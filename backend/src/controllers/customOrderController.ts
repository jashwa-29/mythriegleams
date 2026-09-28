import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Order from '../models/Order';
import User from '../models/User';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';
import { getRazorpay, isValidPaymentSignature, markOrderPaid, shortOrderCode } from '../services/paymentService';

/**
 * Load an order and validate the caller-supplied payment token.
 * Shared by every public (token-gated) endpoint.
 */
const loadOrderByToken = async (id: string, token: unknown, next: NextFunction) => {
    if (!token || typeof token !== 'string') {
        next(new ErrorResponse('Payment link is missing its access token.', 401));
        return null;
    }

    const order = await Order.findById(id);
    if (!order) {
        next(new ErrorResponse('This order could not be traced.', 404));
        return null;
    }

    if (!order.paymentToken) {
        next(new ErrorResponse('This payment link has already been used or was revoked by the store.', 410));
        return null;
    }

    if (order.paymentToken !== token) {
        next(new ErrorResponse('Invalid payment link. Please request a fresh link from the store.', 401));
        return null;
    }

    return order;
};

/**
 * @desc    Admin creates a custom order for a customer and issues a payment link
 * @route   POST /api/orders/admin/custom
 * @access  Private/Admin
 */
export const createAdminCustomOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const {
        customerName,
        customerEmail,
        customerPhone,
        customerStreet,
        customerCity,
        customerState,
        customerZip,
        amount,
        title,
        description,
        image,
        weight = 0,
    } = req.body;

    if (!customerName || !customerPhone) {
        return next(new ErrorResponse('Customer name and phone number are required.', 400));
    }

    const totalPrice = Number(amount);
    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
        return next(new ErrorResponse('Amount must be a number greater than zero.', 400));
    }

    const email = String(customerEmail || '').trim().toLowerCase();
    const phone = String(customerPhone).trim();
    if (phone.length < 6 || phone.length > 20) {
        return next(new ErrorResponse('Enter a valid phone number.', 400));
    }

    // 192 bits of entropy — brute forcing a valid link is infeasible.
    const paymentToken = crypto.randomBytes(24).toString('hex');

    // Link the order to a registered account when the email matches, so it also
    // shows up under "My Orders" for that customer.
    const linkedUser = email ? await User.findOne({ email }).select('_id') : null;

    const itemsPrice = Math.round(totalPrice * 100) / 100;
    const shippingPrice = 0;

    const order = new Order({
        user: linkedUser ? linkedUser._id : undefined,
        orderItems: [
            {
                name: String(title || 'Custom Order').trim(),
                qty: 1,
                image: String(image || '').trim(),
                price: itemsPrice,
                weight: Number(weight) || 0,
                product: 'admin-custom',
            },
        ],
        shippingAddress: {
            label: 'Custom',
            name: String(customerName).trim(),
            email,
            street: String(customerStreet || '').trim(),
            city: String(customerCity || '').trim(),
            state: String(customerState || '').trim(),
            zip: String(customerZip || '').trim(),
            phone,
        },
        itemsPrice,
        shippingPrice,
        totalPrice: itemsPrice + shippingPrice,
        isPaid: false,
        status: 'Pending',
        source: 'admin-custom',
        paymentToken,
    });

    const createdOrder = await order.save();

    res.status(201).json({
        success: true,
        data: {
            orderId: createdOrder._id,
            orderCode: shortOrderCode(createdOrder._id),
            paymentToken,
            totalPrice: createdOrder.totalPrice,
            payUrl: `/pay/${createdOrder._id}?token=${paymentToken}`,
        },
    });
});

/**
 * @desc    Admin: live payment state of a custom order (drives the pay-link tracker on the admin page)
 * @route   GET /api/orders/admin/custom/:id
 * @access  Private/Admin
 */
export const getAdminCustomOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const order = await Order.findOne({ _id: req.params.id, source: 'admin-custom' });

    if (!order) {
        return next(new ErrorResponse('Custom order not found.', 404));
    }

    const item = order.orderItems?.[0];

    res.status(200).json({
        success: true,
        data: {
            _id: order._id,
            orderCode: shortOrderCode(order._id),
            customerName: order.shippingAddress?.name || '',
            title: item?.name || 'Custom Order',
            totalPrice: order.totalPrice,
            isPaid: order.isPaid,
            status: order.status,
            paidAt: order.paidAt || null,
            createdAt: order.createdAt,
        },
    });
});

/**
 * @desc    Public, token-gated order summary for the payment page
 * @route   GET /api/orders/public/pay/:id?token=...
 * @access  Public (token required)
 */
export const getPublicOrderForPayment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const order = await loadOrderByToken(req.params.id, String(req.query.token || ''), next);
    if (!order) return;

    const item = order.orderItems?.[0];

    // Only the fields the customer legitimately needs — no signatures, no internal metadata.
    res.status(200).json({
        success: true,
        data: {
            _id: order._id,
            orderCode: shortOrderCode(order._id),
            title: item?.name || 'Custom Order',
            image: item?.image || '',
            weight: item?.weight || 0,
            totalPrice: order.totalPrice,
            isPaid: order.isPaid,
            status: order.status,
            customerName: order.shippingAddress?.name || '',
            customerEmail: order.shippingAddress?.email || '',
            customerPhone: order.shippingAddress?.phone || '',
        },
    });
});

/**
 * @desc    Public — create the Razorpay order for a token-gated custom payment
 * @route   POST /api/orders/public/pay/:id/razorpay/create
 * @access  Public (token required)
 */
export const createPublicRazorpayOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const order = await loadOrderByToken(req.params.id, req.body?.token, next);
    if (!order) return;

    if (order.isPaid) {
        return next(new ErrorResponse('This order has already been paid.', 400));
    }

    const rzp = getRazorpay();

    const rzpOrder = await rzp.orders.create({
        amount: Math.round(order.totalPrice * 100), // Paise
        currency: 'INR',
        receipt: `receipt_custom_${String(order._id).slice(-12)}`,
        notes: { internalOrderId: String(order._id), source: 'admin-custom' },
    });

    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    res.status(200).json({
        success: true,
        data: {
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            key: process.env.RAZORPAY_KEY_ID,
        },
    });
});

/**
 * @desc    Public — verify the payment and mark the custom order as paid
 * @route   POST /api/orders/public/pay/:id/razorpay/verify
 * @access  Public (token required)
 */
export const verifyPublicRazorpayPayment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    const order = await loadOrderByToken(req.params.id, req.body?.token, next);
    if (!order) return;

    if (order.isPaid) {
        return next(new ErrorResponse('This order has already been paid.', 400));
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return next(new ErrorResponse('Incomplete payment verification payload.', 400));
    }

    // The signature must belong to THIS order's Razorpay order — blocks replay
    // of a valid signature harvested from a different payment.
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
        return next(new ErrorResponse('Payment does not match the initiated order.', 400));
    }

    if (!isValidPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        return next(new ErrorResponse('Invalid payment signature detected. Payment rejected.', 400));
    }

    // Idempotent, and the single place confirmation emails are triggered from.
    await markOrderPaid(order, {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        channel: 'client-verify',
    });

    res.status(200).json({
        success: true,
        message: 'Payment verified and order placed.',
        data: { orderCode: shortOrderCode(order._id), totalPrice: order.totalPrice, status: order.status },
    });
});
