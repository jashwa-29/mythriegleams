import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order, { IOrder } from '../models/Order';
import sendEmail, { storeNotificationEmail } from '../utils/sendEmail';

export const shortOrderCode = (id: unknown) => String(id).slice(-8).toUpperCase();

export const razorpayConfigured = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export const getRazorpay = () =>
    new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID as string,
        key_secret: process.env.RAZORPAY_KEY_SECRET as string,
    });

/** Constant-time string comparison (length differences are not secret here). */
export const isAuthenticSignature = (expected: string, received: unknown): boolean => {
    if (typeof received !== 'string' || received.length !== expected.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'));
    } catch {
        return false;
    }
};

/** Verifies the checkout signature (razorpay_order_id|razorpay_payment_id signed with the key secret). */
export const isValidPaymentSignature = (razorpayOrderId: string, razorpayPaymentId: string, signature: unknown) => {
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');
    return isAuthenticSignature(expected, signature);
};

export type PaymentChannel = 'client-verify' | 'webhook' | 'reconciler' | 'manual';

/** Extra provenance recorded when an admin confirms a payment outside the gateway. */
export type ManualPaymentMeta = {
    method?: string;
    reference?: string;
    note?: string;
    markedBy?: unknown;
    markedByName?: string;
};

/**
 * Confirmation emails. Best effort: a mail failure must never fail a payment.
 */
const notifyPaymentReceived = async (
    order: IOrder,
    channel: PaymentChannel,
    reference: string
) => {
    const code = shortOrderCode(order._id);
    const customerName = order.shippingAddress?.name || 'friend';
    const address = order.shippingAddress;
    const isManual = channel === 'manual';
    const referenceLabel = isManual ? 'Payment Reference' : 'Payment ID';
    const methodLine = isManual && order.paymentMethod
        ? `<p style="font-size: 14px;"><strong>Paid via:</strong> ${order.paymentMethod}</p>`
        : '';

    try {
        if (address?.email) {
            await sendEmail({
                email: address.email,
                subject: `Payment Confirmed — Order #${code}`,
                message: `Hi ${customerName}, we've received your payment of Rs.${order.totalPrice} for order #${code}. Your piece is now in Handcrafting.`,
                html: `
                    <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;">
                        <h1 style="color: #000; font-style: italic;">Payment Confirmed</h1>
                        <p>Hi ${customerName}, thank you for choosing MythrieGleams. Your payment for order <strong>#${code}</strong> has been received and your piece is now in <strong>Handcrafting</strong>.</p>
                        <p>We will keep you posted as it moves to Quality Check and Dispatch.</p>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 2px;">Order Summary</p>
                            <p style="font-size: 14px;"><strong>Order ID:</strong> #${code}</p>
                            ${methodLine}
                            <p style="font-size: 14px;"><strong>${referenceLabel}:</strong> ${reference}</p>
                            <p style="font-size: 14px;"><strong>Total Paid:</strong> ₹${order.totalPrice}</p>
                        </div>
                    </div>
                `,
            });
        }

        await sendEmail({
            email: storeNotificationEmail(),
            subject: `Payment received: #${code} (₹${order.totalPrice})`,
            message: `Order #${code} paid Rs.${order.totalPrice} by ${customerName} (${address?.email || 'no email'} / ${address?.phone || 'no phone'}). Confirmed via ${channel}.`,
            html: `<h2>New paid order</h2><p><strong>#${code}</strong> — ₹${order.totalPrice}</p><p>Customer: ${customerName} (${address?.email || 'no email'} / ${address?.phone || 'no phone'})</p><p>Confirmed via: ${channel}</p>` +
                (isManual
                    ? `<div style="background:#fff7ed;border:1px solid #fed7aa;padding:12px;margin-top:12px;border-radius:8px"><p><strong>Recorded manually by ${order.markedPaidByName || 'an admin'}</strong></p>` +
                      `<p>Method: ${order.paymentMethod || '—'}</p>` +
                      `<p>Reference: ${order.paymentReference || '—'}</p>` +
                      (order.paymentNote ? `<p>Note: ${order.paymentNote}</p>` : '') +
                      `</div>`
                    : ''),
        });
    } catch (emailError: any) {
        console.error('Payment confirmation email failed:', emailError.message);
    }
};

/**
 * The single place an order becomes paid.
 *
 * Idempotent and race-safe: the transition is a conditional update on `isPaid: false`, so a
 * webhook racing the browser callback (or an admin marking it paid by hand) leaves exactly one
 * winner and the confirmation emails are sent once.
 *
 * Returns true when THIS call is the one that settled the order.
 */
export const markOrderPaid = async (
    order: IOrder,
    input: {
        razorpayPaymentId?: string;
        razorpaySignature?: string;
        channel: PaymentChannel;
        manual?: ManualPaymentMeta;
    }
): Promise<boolean> => {
    if (order.isPaid) return false;

    const settledAt = new Date();
    const updated = await Order.findOneAndUpdate(
        { _id: order._id, isPaid: false },
        {
            $set: {
                isPaid: true,
                paidAt: settledAt,
                ...(input.razorpayPaymentId ? { razorpayPaymentId: input.razorpayPaymentId } : {}),
                ...(input.razorpaySignature ? { razorpaySignature: input.razorpaySignature } : {}),
                paymentChannel: input.channel,
                ...(input.manual?.method ? { paymentMethod: input.manual.method } : {}),
                ...(input.manual?.reference ? { paymentReference: input.manual.reference } : {}),
                ...(input.manual?.note ? { paymentNote: input.manual.note } : {}),
                ...(input.manual?.markedBy ? { markedPaidBy: input.manual.markedBy } : {}),
                ...(input.manual?.markedByName ? { markedPaidByName: input.manual.markedByName } : {})
            },
            // $unset, not `$set: undefined` — a settled order must stop accepting its
            // single-use payment link, and $set with undefined leaves the field in place.
            $unset: { paymentToken: 1 }
        },
        { new: true }
    );

    // Another channel won the race, or the order was already settled.
    if (!updated) return false;

    // Only nudge a freshly created order forward; never walk a later status backwards.
    if (updated.status === 'Pending') {
        await Order.updateOne({ _id: order._id, status: 'Pending' }, { $set: { status: 'Handcrafting' } });
    }

    console.log(`[payment] Order ${order._id} marked paid (${input.channel})`);
    const reference = input.razorpayPaymentId || input.manual?.reference || 'not recorded';
    await notifyPaymentReceived(updated, input.channel, reference);
    return true;
};

/** Asks Razorpay whether an order was actually paid, and returns the settled payment id. */
export const fetchRazorpayPayment = async (razorpayOrderId: string): Promise<PaymentLookupResult> => {
    try {
        const rzp = getRazorpay();
        const rzpOrder: any = await rzp.orders.fetch(razorpayOrderId);

        if (rzpOrder?.status !== 'paid') {
            return { paid: false, status: rzpOrder?.status || 'unknown' };
        }

        const payments: any = await rzp.orders.fetchPayments(razorpayOrderId);
        const settled = (payments?.items || []).find((p: any) => p.status === 'captured' || p.status === 'authorized');

        return { paid: !!settled, status: 'paid', paymentId: settled?.id as string | undefined };
    } catch (err: any) {
        // A lookup that cannot be completed is NOT evidence of non-payment, so it reports as
        // 'unknown' (never 'created'/'attempted') and every caller keeps the order for a retry.
        const reason = err?.error?.description || err?.description || err?.message || 'unknown error';
        console.warn(`[payment] Razorpay lookup failed for ${razorpayOrderId}: ${reason}`);
        return { paid: false, status: 'unknown' };
    }
};

export type ReconcileResult = {
    isPaid: boolean;
    rzpStatus?: string;
    recovered?: boolean;
    reason?: string;
};

/** Shape returned by a Razorpay payment lookup (injectable so the reconciler is testable). */
export type PaymentLookupResult = { paid: boolean; status: string; paymentId?: string };
export type PaymentLookup = (razorpayOrderId: string) => Promise<PaymentLookupResult>;

/**
 * Server-side reconciliation: the browser callback is not trusted as the source of truth,
 * this is. Safe to call repeatedly.
 */
export const reconcileOrderWithRazorpay = async (order: IOrder, channel: PaymentChannel = 'reconciler'): Promise<ReconcileResult> => {
    if (order.isPaid) return { isPaid: true, reason: 'already_paid' };
    if (!order.razorpayOrderId) return { isPaid: false, reason: 'no_razorpay_order' };
    if (!razorpayConfigured()) return { isPaid: false, reason: 'razorpay_not_configured' };

    const result = await fetchRazorpayPayment(order.razorpayOrderId);

    if (result.paid && result.paymentId) {
        const recovered = await markOrderPaid(order, { razorpayPaymentId: result.paymentId, channel });
        return { isPaid: true, recovered, rzpStatus: 'paid' };
    }

    return { isPaid: false, rzpStatus: result.status };
};
