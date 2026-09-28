import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Order from '../models/Order';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';
import { isAuthenticSignature, markOrderPaid, reconcileOrderWithRazorpay } from '../services/paymentService';

const orderCode = (id: unknown) => String(id).slice(-8).toUpperCase();

/**
 * Locate the internal order a Razorpay event refers to. `order.paid` only carries an
 * `order_id`, so we resolve it through the order we ourselves created earlier.
 */
const findOrderForPaymentEntity = async (paymentEntity: any) => {
    const razorpayOrderId = paymentEntity?.order_id;
    const razorpayPaymentId = paymentEntity?.id;
    if (razorpayOrderId) return Order.findOne({ razorpayOrderId });
    if (razorpayPaymentId) return Order.findOne({ razorpayPaymentId });
    return null;
};

/**
 * Processing runs after the 200 so Razorpay never retries a slow handler.
 */
const processWebhookEvent = async (event: any) => {
    const paymentEntity = event?.payload?.payment?.entity;

    switch (event?.event) {
        case 'payment.captured':
        case 'order.paid': {
            const order = await findOrderForPaymentEntity(paymentEntity);
            if (!order) {
                console.warn(`[webhook] ${event.event}: no local order for ${paymentEntity?.order_id || paymentEntity?.id}`);
                return;
            }
            // Idempotent: if the browser callback already marked it paid, this is a no-op.
            await markOrderPaid(order, {
                razorpayPaymentId: paymentEntity?.id || order.razorpayPaymentId || 'unknown',
                channel: 'webhook',
            });
            return;
        }
        case 'payment.failed': {
            const order = await findOrderForPaymentEntity(paymentEntity);
            console.warn(
                `[webhook] payment.failed for ${paymentEntity?.order_id || 'unknown'}` +
                    (order ? ` (local order ${order._id})` : ' — no local order')
            );
            return;
        }
        case 'refund.processed': {
            const order = await findOrderForPaymentEntity(paymentEntity);
            console.error(
                `[webhook] REFUND processed for order ${order?._id || paymentEntity?.order_id || 'unknown'} — ` +
                    'update the order status manually and arrange a return if required.'
            );
            return;
        }
        default:
            return;
    }
};

/**
 * @desc    Razorpay webhook — the authoritative payment confirmation. Fires even if the
 *          customer closes the tab, loses network, or their device dies mid-payment.
 * @route   POST /api/payments/razorpay/webhook
 * @access  Public (HMAC signature verified against the raw request body)
 */
export const razorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody;

    if (!webhookSecret) {
        console.error('[webhook] RAZORPAY_WEBHOOK_SECRET is not configured — webhook disabled.');
        return res.status(500).json({ success: false, error: 'Webhook secret not configured' });
    }

    if (typeof signature !== 'string' || !rawBody) {
        console.error('[webhook] Missing signature or raw body.');
        return res.status(400).json({ success: false, error: 'Missing signature' });
    }

    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    if (!isAuthenticSignature(expected, signature)) {
        console.error('[webhook] Signature mismatch — payload rejected.');
        return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    let event: any;
    try {
        event = JSON.parse(rawBody.toString('utf8'));
    } catch {
        return res.status(400).json({ success: false, error: 'Malformed payload' });
    }

    // Acknowledge first, then process.
    res.status(200).json({ success: true });

    processWebhookEvent(event).catch((err) => console.error('[webhook] Processing failed:', err.message));
});

/**
 * @desc    Ask Razorpay directly whether an order was paid, and heal the local record.
 *          Used by the background reconciler and by the frontend as a reload safety net.
 * @route   POST /api/payments/razorpay/check/:orderId
 * @access  Owner, admin, or holder of the order's payment token
 */
export const reconcileRazorpayOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) return next(new ErrorResponse('Order not found.', 404));

    const token = req.body?.token;
    const hasValidToken = typeof token === 'string' && !!order.paymentToken && order.paymentToken === token;
    const isOwner = !!order.user && !!req.user && String(order.user) === String(req.user._id);
    const isAdmin = req.user?.role === 'admin';

    if (!hasValidToken && !isOwner && !isAdmin) {
        return next(new ErrorResponse('Unauthorized to check this order.', 401));
    }

    const result = await reconcileOrderWithRazorpay(order, 'reconciler');

    res.status(200).json({
        success: true,
        data: {
            _id: order._id,
            orderCode: orderCode(order._id),
            isPaid: order.isPaid,
            status: order.status,
            paidAt: order.paidAt || null,
            totalPrice: order.totalPrice,
            recovered: result.recovered,
            rzpStatus: result.rzpStatus,
            reason: result.reason,
        },
    });
});

/**
 * @desc    Public reload safety net for the token-gated pay page. Once a payment settles,
 *          the token is destroyed, so a returning customer proves ownership with the
 *          Razorpay order id we handed them instead.
 * @route   POST /api/orders/public/pay/:id/reconcile
 * @access  Public (requires the order's own Razorpay order id)
 */
export const reconcilePublicPayOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { razorpayOrderId } = req.body || {};

    const order = await Order.findOne({ _id: id, source: 'admin-custom' });
    if (!order) return next(new ErrorResponse('Order not found.', 404));

    // Both halves must match this order, so this cannot be used to probe other orders.
    if (!razorpayOrderId || !order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
        return next(new ErrorResponse('Invalid payment reference.', 401));
    }

    const result = await reconcileOrderWithRazorpay(order, 'reconciler');

    res.status(200).json({
        success: true,
        data: {
            _id: order._id,
            orderCode: orderCode(order._id),
            isPaid: order.isPaid,
            status: order.status,
            paidAt: order.paidAt || null,
            totalPrice: order.totalPrice,
            customerName: order.shippingAddress?.name || '',
            recovered: result.recovered,
            rzpStatus: result.rzpStatus,
            reason: result.reason,
        },
    });
});
