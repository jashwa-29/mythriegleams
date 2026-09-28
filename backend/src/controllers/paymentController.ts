import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';
import { getRazorpay, isValidPaymentSignature, markOrderPaid } from '../services/paymentService';

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/payments/razorpay/create
 * @access  Public (Guest/User)
 */
export const createRazorpayOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { orderId } = req.body; // Our internal MongoDB order ID

    const order = await Order.findById(orderId);
    if (!order) {
        return next(new ErrorResponse('Internal Order not found for payment initialization.', 404));
    }

    // Amount in paise
    const amountInPaise = Math.round(order.totalPrice * 100);

    const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_order_${orderId}`,
    };

    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.create(options);

    if (!rzpOrder) {
        return next(new ErrorResponse('Failed to draft Razorpay payment narrative.', 500));
    }

    // Update our MongoDB order with the Razorpay order ID
    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    res.status(200).json({
        success: true,
        data: {
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            key: process.env.RAZORPAY_KEY_ID // Send key to frontend for initialization
        }
    });
});

/**
 * @desc    Verify Razorpay Payment
 * @route   POST /api/payments/razorpay/verify
 * @access  Public (Guest/User)
 *
 * This is the fast path only: it depends on the customer's browser surviving the payment.
 * The webhook (/razorpay/webhook) and the background reconciler are the authoritative
 * confirmation routes, so a closed tab can never lose a paid order.
 */
export const verifyRazorpayPayment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { internalOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!internalOrderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return next(new ErrorResponse('Incomplete payment verification payload.', 400));
    }

    if (!isValidPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        return next(new ErrorResponse('Invalid signature detected. Payment narrative rejected.', 400));
    }

    const order = await Order.findById(internalOrderId);
    if (!order) {
        return next(new ErrorResponse('Internal Order narrative lost during verification.', 404));
    }

    // The signature must belong to the Razorpay order we created for THIS order — blocks
    // replaying a genuine signature captured from a different payment.
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
        return next(new ErrorResponse('Payment does not match the initiated order.', 400));
    }

    // Idempotent: if the webhook already confirmed this payment, this is a no-op and the
    // customer is not emailed twice.
    await markOrderPaid(order, {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        channel: 'client-verify',
    });

    return res.status(200).json({ success: true, message: 'Payment verified and registry updated.' });
});
