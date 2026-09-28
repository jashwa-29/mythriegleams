import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import sendEmail, { storeNotificationEmail } from '../utils/sendEmail';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';
import { calculateShipping } from '../utils/shipping';
import { shortOrderCode, markOrderPaid } from '../services/paymentService';
import { getPausedIndex, findPauseMatch, describePause } from '../services/productVisibilityService';

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Public (Guest/User)
 */
export const addOrderItems = asyncHandler(async (req: Request, res: Response) => {
    const { orderItems, shippingAddress, isPaid } = req.body;

    if (!orderItems || orderItems.length === 0) {
        throw new ErrorResponse('Registry Forge requires artisanal components to proceed (No order items).', 400);
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.email) {
        throw new ErrorResponse('Fulfillment Narrative incomplete. Destination details (street/email) missing.', 400);
    }

    // Re-check every line against the live catalogue. Prices are already re-derived below, and
    // this closes the same hole for paused designs: a cart saved before a pause, or a crafted
    // request, cannot place an order for a product that is no longer sellable.
    const pausedIndex = await getPausedIndex();
    const requestedIds = orderItems.map((item: any) => item.product).filter(Boolean);
    const liveProducts = await Product.find({ _id: { $in: requestedIds } }).select(
        '_id name price category categories occasion occasions isBestseller'
    );
    const liveById = new Map<string, any>(liveProducts.map((p: any) => [String(p._id), p]));

    const blocked = orderItems
        .map((item: any) => {
            const live = liveById.get(String(item.product));
            if (!live) return { name: item.name, reason: 'no longer exists' };
            const pause = findPauseMatch(live, pausedIndex);
            return pause ? { name: live.name, reason: describePause(pause) } : null;
        })
        .filter(Boolean);

    if (blocked.length > 0) {
        const details = blocked.map((b: any) => `"${b.name}" — ${b.reason}`).join('; ');
        throw new ErrorResponse(`Some items in your bag cannot be ordered: ${details}.`, 409);
    }

    // Authoritative totals: derive items price from line items, shipping from the free-shipping rule,
    // and grand total as their sum. Client-supplied values are ignored to prevent tampering.
    const itemsPrice = orderItems.reduce((sum: number, item: any) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
    const shippingPrice = calculateShipping(itemsPrice);
    const totalPrice = itemsPrice + shippingPrice;

    const order = new Order({
        user: req.user?._id, // Add if logged in
        orderItems,
        shippingAddress,
        itemsPrice,
        shippingPrice,
        totalPrice,
        isPaid: isPaid || false // Default to unpaid unless validated
    });

    const createdOrder = await order.save();

    // Notify the store that an order came in. Payment is confirmed separately (Razorpay
    // callback / webhook / reconciler), so this is deliberately a "new order" alert.
    const code = shortOrderCode(createdOrder._id);
    const address = createdOrder.shippingAddress;
    try {
        await sendEmail({
            email: storeNotificationEmail(),
            subject: `New order received — #${code} (₹${createdOrder.totalPrice})`,
            message: `Order #${code} for ₹${createdOrder.totalPrice} from ${address?.name} (${address?.phone}). ${createdOrder.orderItems.length} item(s). Awaiting payment.`,
            html: `
                <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;">
                    <h1 style="color: #000; font-style: italic; margin-top: 0;">New Order</h1>
                    <p>Order <strong>#${code}</strong> is awaiting payment.</p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 2px;">Customer</p>
                        <p style="font-size: 14px;"><strong>${address?.name || '—'}</strong></p>
                        <p style="font-size: 14px;">${address?.phone || '—'}</p>
                        <p style="font-size: 14px;">${address?.email || 'no email'}</p>
                        <p style="font-size: 14px;">${[address?.street, address?.city, address?.state, address?.zip].filter(Boolean).join(', ') || '—'}</p>
                    </div>
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 2px;">Items (${createdOrder.orderItems.length})</p>
                        ${createdOrder.orderItems
                            .map((item) => `<p style="font-size: 14px; margin: 4px 0;">${item.qty} × ${item.name} — ₹${item.price}</p>`)
                            .join('')}
                    </div>
                    <p style="margin-top: 30px; font-size: 16px;">Order Total: <strong>₹${createdOrder.totalPrice}</strong></p>
                </div>
            `
        });
    } catch (emailError: any) {
        // The order is already saved — a mail failure must never fail checkout.
        console.error('New order notification failed:', emailError.message);
    }

    res.status(201).json({ success: true, data: createdOrder });
});

/**
 * @desc    Get order by ID (Tracking)
 * @route   GET /api/orders/:id
 * @access  Public / Mixed (Secure)
 */
export const getOrderById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
        return next(new ErrorResponse('Artisanal Trace lost. Order not found.', 404));
    }

    // Security check: Only owner, admin, or the guest who placed it (by email match if we had it) can see full details.
    const isOwner = order.user && req.user && order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (order.user && !isOwner && !isAdmin) {
        return next(new ErrorResponse('Unauthorized access to this order narrative.', 401));
    }

    res.status(200).json({ success: true, data: order });
});

/**
 * @desc    Update order status (Admin)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const order: any = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse('Order for status revision not found.', 404));
    }

    const oldStatus = order.status;
    order.status = req.body.status;
    if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;
    if (req.body.deliveryNote) order.deliveryNote = req.body.deliveryNote;

    const updatedOrder = await order.save();

    // Send status update email to user
    if (oldStatus !== order.status) {
        try {
            await sendEmail({
                email: order.shippingAddress.email || order.user?.email || 'customer@example.com',
                subject: `Order Status Update: ${order.status}`,
                message: `Your order #${order._id} status has been changed to: ${order.status}.`,
                html: `
                    <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; padding: 40px; border-radius: 16px;">
                        <h2 style="color: #111827; margin-bottom: 20px;">Order Status Update</h2>
                        <p>Hello,</p>
                        <p>We are writing to inform you that your order <strong>#${order._id}</strong> lifecycle status has been updated.</p>
                        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
                            <p style="margin: 0; font-size: 16px;">Current Status: <strong style="color: #059669; text-transform: uppercase;">${order.status}</strong></p>
                            ${order.trackingNumber ? `<p style="margin: 10px 0 0 0; font-size: 14px;">Tracking Number: <strong>${order.trackingNumber}</strong></p>` : ''}
                            ${order.deliveryNote ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #4b5563; font-style: italic;">Delivery Note: ${order.deliveryNote}</p>` : ''}
                        </div>
                        <p>Thank you for choosing MythrieGleams.</p>
                    </div>
                `
            });
        } catch (emailError: any) {
            console.error('Email sending failed during status update. Error:', emailError.message);
        }
    }

    res.status(200).json({ success: true, data: updatedOrder });
});

/**
 * @desc    Mark an order as paid by hand (bank transfer, cash, UPI outside the gateway, etc.)
 * @route   PUT /api/orders/:id/paid
 * @access  Private/Admin
 *
 * This is the escape hatch for payments the gateway never saw — a bank transfer that cleared,
 * cash at the studio, or a gateway webhook that was never delivered. It deliberately records who
 * confirmed it and why, because a manual entry is an assertion by a human, not evidence from
 * Razorpay. Idempotent: an already-paid order is refused rather than silently re-confirmed, so
 * the customer is never emailed twice.
 */
export const markOrderPaidManually = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { method, reference, note } = req.body || {};

    const cleanMethod = typeof method === 'string' ? method.trim().slice(0, 60) : '';
    if (!cleanMethod) {
        return next(new ErrorResponse('Select how this order was paid.', 400));
    }
    const cleanReference = typeof reference === 'string' ? reference.trim().slice(0, 120) : '';
    const cleanNote = typeof note === 'string' ? note.trim().slice(0, 500) : '';

    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorResponse('Order not found.', 404));
    }

    if (order.isPaid) {
        const code = shortOrderCode(order._id);
        return res.status(409).json({
            success: false,
            error: `Order #${code} is already marked paid.`,
            data: order
        });
    }

    const settled = await markOrderPaid(order, {
        channel: 'manual',
        manual: {
            method: cleanMethod,
            reference: cleanReference,
            note: cleanNote,
            markedBy: req.user?._id,
            markedByName: (req.user as any)?.name || 'admin'
        }
    });

    // Lost the race against a webhook that landed at the same moment — report the real state.
    if (!settled) {
        const fresh = await Order.findById(order._id);
        return res.status(409).json({
            success: false,
            error: `Order #${shortOrderCode(order._id)} was confirmed as paid by another channel a moment ago.`,
            data: fresh
        });
    }

    res.status(200).json({
        success: true,
        message: `Order #${shortOrderCode(order._id)} marked as paid.`,
        data: await Order.findById(order._id)
    });
});

/**
 * @desc    Get logged-in user's orders
 * @route   GET /api/orders/mine
 * @access  Private
 */
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        return res.status(401).json({ success: false, error: 'User session not found or expired.' });
    }
    const orders = await Order.find({ user: req.user._id, isPaid: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
});

/**
 * @desc    Get all orders (Admin only)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
    const { includeUnpaid } = req.query;
    const filter = includeUnpaid === 'true' ? {} : { isPaid: true };
    
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
});
