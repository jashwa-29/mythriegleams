import Order from '../models/Order';
import { fetchRazorpayPayment, markOrderPaid, razorpayConfigured, type PaymentLookup } from './paymentService';

/** Checkout abandoned with no payment session started. */
export const ABANDONED_AFTER_MS = 20 * 60 * 1000;
/** Attempted but unpaid — kept retryable for a full day before it is dropped. */
export const UNPAID_GRACE_MS = 24 * 60 * 60 * 1000;
export const RECONCILE_BATCH = 50;
export const RECONCILE_INTERVAL_MS = 2 * 60 * 1000;

/**
 * Safety net for payments whose browser callback never arrived (closed tab, dead network,
 * missed webhook). Nothing is ever deleted on a local guess: Razorpay is asked first, and
 * an attempted-but-unpaid order is kept for a day so the customer can retry.
 *
 * Admin custom orders are excluded entirely — they are paid on the customer's schedule.
 */
export const createOrderReconciler = (lookup: PaymentLookup = fetchRazorpayPayment) => async () => {
    const now = Date.now();
    const abandonedBefore = new Date(now - ABANDONED_AFTER_MS);
    const graceBefore = new Date(now - UNPAID_GRACE_MS);
    const summary = { deletedAbandoned: 0, recovered: 0, deletedUnpaid: 0 };

    try {
        // 1. Abandoned checkouts that never reached Razorpay — nothing was ever at stake.
        const noGateway = await Order.deleteMany({
            isPaid: false,
            source: { $ne: 'admin-custom' },
            $or: [{ razorpayOrderId: { $exists: false } }, { razorpayOrderId: null }, { razorpayOrderId: '' }],
            createdAt: { $lt: abandonedBefore }
        });
        summary.deletedAbandoned = noGateway.deletedCount;
        if (noGateway.deletedCount > 0) {
            console.log(`[reconciler] Deleted ${noGateway.deletedCount} abandoned checkout(s) with no payment session.`);
        }

        if (!razorpayConfigured()) {
            console.warn('[reconciler] Razorpay keys missing — skipping payment reconciliation.');
            return summary;
        }

        // 2. Unpaid orders that DO have a payment session — ask Razorpay what happened.
        //    Admin custom orders are included here (a link closed mid-payment still gets
        //    healed) but are never deleted, since they are paid on the customer's schedule.
        const stale = await Order.find({
            isPaid: false,
            razorpayOrderId: { $exists: true, $nin: [null, ''] },
            createdAt: { $lt: abandonedBefore }
        })
            .sort({ createdAt: 1 })
            .limit(RECONCILE_BATCH);

        const deletable: any[] = [];

        for (const order of stale) {
            const isCustom = order.source === 'admin-custom';
            try {
                const result = await lookup(order.razorpayOrderId as string);

                if (result.paid && result.paymentId) {
                    if (await markOrderPaid(order, { razorpayPaymentId: result.paymentId, channel: 'reconciler' })) {
                        summary.recovered++;
                    }
                } else if (isCustom) {
                    // Keep it: the customer may still be about to pay.
                } else if (result.status === 'created' && order.createdAt && order.createdAt < abandonedBefore) {
                    // Session opened, customer never attempted a payment.
                    deletable.push(order._id);
                } else if (result.status === 'attempted' && order.createdAt && order.createdAt < graceBefore) {
                    // Attempted and failed/abandoned for over a day.
                    deletable.push(order._id);
                }
                // Any other outcome (gateway error, still processing) means keep it and
                // retry on the next tick.
            } catch (err: any) {
                console.error(`[reconciler] Razorpay lookup failed for order ${order._id}:`, err.message);
            }
        }

        if (deletable.length > 0) {
            await Order.deleteMany({ _id: { $in: deletable } });
            summary.deletedUnpaid = deletable.length;
            console.log(`[reconciler] Deleted ${deletable.length} unpaid order(s) confirmed dead by Razorpay.`);
        }
        if (summary.recovered > 0) {
            console.log(`[reconciler] Recovered ${summary.recovered} paid order(s) that the browser callback missed.`);
        }
    } catch (err: any) {
        console.error('[reconciler] Fatal error:', err.message);
    }

    return summary;
};
