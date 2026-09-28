import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';
import { markOrderPaid, shortOrderCode } from '../services/paymentService';
import { calculateShipping } from '../utils/shipping';
import { getPausedIndex, findPauseMatch, describePause } from '../services/productVisibilityService';

/** Trim + cap anything a client can send, so a long paste can never bloat a document. */
const str = (value: unknown, max = 200): string => {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, max);
};

const num = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

/** Quantities are whole pieces — a fractional qty would quietly corrupt the line total. */
const wholeQty = (value: unknown): number => {
    const qty = Math.floor(num(value));
    return qty > 0 ? qty : 0;
};

const MAX_LINES = 30;
const MAX_QTY_PER_LINE = 99;

/**
 * @desc    Admin logs an order that came in by phone/WhatsApp. Items are chosen from the
 *          live catalogue and every price is re-derived from the database, so the admin
 *          cannot mistype or tamper with a line total. No payment link is ever created:
 *          the money either arrived offline (marked paid on the spot) or is recorded later
 *          with PUT /api/orders/:id/paid.
 * @route   POST /api/orders/admin/offline
 * @access  Private/Admin
 */
export const createAdminOfflineOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const {
        customerName,
        customerEmail,
        customerPhone,
        customerStreet,
        customerCity,
        customerState,
        customerZip,
        items,
        customItem,
        paymentReceived = false,
        method,
        reference,
        note,
    } = req.body || {};

    const name = str(customerName, 100);
    const phone = str(customerPhone, 20);
    if (!name) return next(new ErrorResponse('Customer name is required.', 400));
    if (!phone) return next(new ErrorResponse('Phone number is required.', 400));
    if (phone.length < 6) return next(new ErrorResponse('Enter a valid phone number.', 400));

    const email = str(customerEmail, 150).toLowerCase();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        return next(new ErrorResponse('Enter a valid email address.', 400));
    }

    const requestedItems: any[] = Array.isArray(items) ? items : [];
    const bespoke = customItem && typeof customItem === 'object' ? customItem : null;
    const bespokeQty = bespoke ? wholeQty(bespoke.qty ?? 1) : 0;
    const bespokeAmount = bespoke ? num(bespoke.amount) : 0;

    if (requestedItems.length === 0 && (!bespoke || bespokeQty === 0 || bespokeAmount <= 0)) {
        return next(new ErrorResponse('Add at least one product to the order.', 400));
    }
    if (requestedItems.length + (bespokeQty ? 1 : 0) > MAX_LINES) {
        return next(new ErrorResponse(`An offline order can hold at most ${MAX_LINES} items.`, 400));
    }

    // Catalogue lines: look every one up and take name/price/weight from the database.
    // The client only ever gets to say *which* product and *how many*.
    const requestedIds = requestedItems
        .map((i: any) => str(i?.product, 40))
        .filter((id: string) => /^[a-f\d]{24}$/i.test(id));

    const liveProducts = await Product.find({ _id: { $in: requestedIds } }).select(
        '_id name price weight images variants stockStatus category categories occasion occasions'
    );
    const liveById = new Map<string, any>(liveProducts.map((p: any) => [String(p._id), p]));

    const missing = requestedItems.filter((i: any) => {
        const id = str(i?.product, 40);
        return !/^[a-f\d]{24}$/i.test(id) || !liveById.has(id);
    });
    if (missing.length > 0) {
        return next(new ErrorResponse(`${missing.length} selected product(s) no longer exist. Refresh and try again.`, 409));
    }

    // A paused design is still sellable to someone who already asked for it in person, so
    // this is a warning rather than a hard block — but the admin is always told.
    const pausedIndex = await getPausedIndex();
    const warnings: string[] = [];

    const orderItems: any[] = requestedItems.map((i: any) => {
        const product = liveById.get(str(i?.product, 40));
        const qty = wholeQty(i?.qty);
        if (qty === 0) throw new ErrorResponse(`Choose a quantity for "${product.name}".`, 400);
        if (qty > MAX_QTY_PER_LINE) {
            throw new ErrorResponse(`"${product.name}" is limited to ${MAX_QTY_PER_LINE} per order.`, 400);
        }

        const pause = findPauseMatch(product, pausedIndex);
        if (pause) {
            warnings.push(`"${product.name}" is ${describePause(pause)} — it will not be sellable on the storefront.`);
        }
        if (product.stockStatus === 'out-of-stock') {
            warnings.push(`"${product.name}" is marked out of stock.`);
        }

        return {
            name: product.name,
            qty,
            image: product.images?.[0] || '',
            price: num(product.price),
            weight: num(product.weight),
            product: product._id,
            selectedVariant: str(i?.selectedVariant, 60),
            selectedColor: str(i?.selectedColor, 60),
        };
    });

    if (bespoke && bespokeQty > 0) {
        const bespokeName = str(bespoke.name, 160);
        if (!bespokeName) return next(new ErrorResponse('Name the custom item, or remove it from the order.', 400));
        if (bespokeQty > MAX_QTY_PER_LINE) {
            return next(new ErrorResponse(`"${bespokeName}" is limited to ${MAX_QTY_PER_LINE} per order.`, 400));
        }
        orderItems.push({
            name: bespokeName,
            qty: bespokeQty,
            image: str(bespoke.image, 300),
            price: Math.round(bespokeAmount * 100) / 100,
            weight: Math.max(0, num(bespoke.weight)),
            product: 'admin-bespoke',
            description: str(bespoke.description, 1000),
        });
    }

    // Money already in hand must always say how it arrived, or the books stay unauditable.
    const cleanMethod = str(method, 60);
    if (paymentReceived && !cleanMethod) {
        return next(new ErrorResponse('Select how the payment was received.', 400));
    }

    // Link to a registered account when the email matches, so the order also shows
    // up under "My Orders" for that customer.
    const linkedUser = email ? await User.findOne({ email }).select('_id') : null;

    const itemsPrice = Math.round(orderItems.reduce((sum, line) => sum + line.price * line.qty, 0) * 100) / 100;
    if (itemsPrice <= 0) return next(new ErrorResponse('The order total must be greater than zero.', 400));
    const shippingPrice = calculateShipping(itemsPrice);

    const order = new Order({
        user: linkedUser ? linkedUser._id : undefined,
        orderItems,
        shippingAddress: {
            label: 'Offline',
            name,
            email,
            street: str(customerStreet, 200),
            city: str(customerCity, 100),
            state: str(customerState, 100),
            zip: str(customerZip, 20),
            phone,
        },
        itemsPrice,
        shippingPrice,
        totalPrice: Math.round((itemsPrice + shippingPrice) * 100) / 100,
        isPaid: false,
        status: 'Pending',
        source: 'offline',
    });

    const created = await order.save();

    if (paymentReceived) {
        // Same single settlement path as every other channel, so the audit trail,
        // status advance and confirmation email behave identically.
        const settled = await markOrderPaid(created, {
            channel: 'manual',
            manual: {
                method: cleanMethod,
                reference: str(reference, 120),
                note: str(note, 500),
                markedBy: req.user?._id,
                markedByName: (req.user as any)?.name || 'admin',
            },
        });

        if (!settled) {
            return next(new ErrorResponse('This order was settled by another channel while saving.', 409));
        }
    }

    const fresh = await Order.findById(created._id);

    res.status(201).json({
        success: true,
        message: paymentReceived
            ? `Order #${shortOrderCode(created._id)} recorded and marked paid.`
            : `Order #${shortOrderCode(created._id)} recorded as awaiting payment.`,
        data: {
            orderId: fresh?._id,
            orderCode: shortOrderCode(created._id),
            totalPrice: fresh?.totalPrice,
            isPaid: fresh?.isPaid,
            status: fresh?.status,
        },
        warnings,
    });
});

/**
 * @desc    Admin list of offline orders, newest first, so a payment taken later can
 *          be recorded against the right order.
 * @route   GET /api/orders/admin/offline
 * @access  Private/Admin
 */
export const getAdminOfflineOrders = asyncHandler(async (req: Request, res: Response) => {
    const orders = await Order.find({ source: 'offline' }).sort({ createdAt: -1 }).limit(100);

    res.status(200).json({
        success: true,
        count: orders.length,
        data: orders.map((order) => ({
            _id: order._id,
            orderCode: shortOrderCode(order._id),
            customerName: order.shippingAddress?.name || '',
            customerPhone: order.shippingAddress?.phone || '',
            title: order.orderItems?.map((i) => `${i.qty}x ${i.name}`).join(', ') || 'Offline Order',
            totalPrice: order.totalPrice,
            isPaid: order.isPaid,
            status: order.status,
            paidAt: order.paidAt || null,
            paymentChannel: order.paymentChannel,
            paymentMethod: order.paymentMethod,
            paymentReference: order.paymentReference,
            markedPaidByName: order.markedPaidByName,
            createdAt: order.createdAt,
        })),
    });
});
