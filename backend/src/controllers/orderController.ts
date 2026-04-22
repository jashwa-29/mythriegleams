import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import sendEmail from '../utils/sendEmail';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Public (Guest/User)
 */
export const addOrderItems = asyncHandler(async (req: Request, res: Response) => {
    const { orderItems, shippingAddress, totalPrice, isPaid } = req.body;

    if (!orderItems || orderItems.length === 0) {
        throw new ErrorResponse('Registry Forge requires artisanal components to proceed (No order items).', 400);
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.email) {
        throw new ErrorResponse('Fulfillment Narrative incomplete. Destination details (street/email) missing.', 400);
    }

    const order = new Order({
        user: req.user?._id, // Add if logged in
        orderItems,
        shippingAddress,
        totalPrice,
        isPaid: isPaid || false // Default to unpaid unless validated
    });

    const createdOrder = await order.save();
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
 * @desc    Get logged-in user's orders
 * @route   GET /api/orders/mine
 * @access  Private
 */
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
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
