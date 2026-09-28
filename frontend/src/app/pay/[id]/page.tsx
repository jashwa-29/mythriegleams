"use client";

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/utils/getImageUrl';
import { formatWeight } from '@/utils/formatWeight';
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck, Sparkles, Phone } from 'lucide-react';

// A bare axios instance: the shared `api` client redirects to /account on any 401,
// which would break this public, token-gated page.
const publicApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

type PayOrder = {
    _id: string;
    orderCode: string;
    title: string;
    image: string;
    weight: number;
    totalPrice: number;
    isPaid: boolean;
    status: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
};

type RazorpayCheckoutResponse = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
};

type RazorpayInstance = {
    open: () => void;
    on: (event: 'payment.failed', handler: (response: { error?: { description?: string } }) => void) => void;
};

declare global {
    interface Window {
        Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
    }
}

const apiErrorMessage = (err: unknown, fallback: string): string => {
    const e = err as { response?: { data?: { error?: string; message?: string } } };
    return e?.response?.data?.error || e?.response?.data?.message || fallback;
};

// Remembers which Razorpay order this tab opened, so a reload/closed tab can be
// reconciled server-side instead of silently losing a completed payment.
const PENDING_PAY_KEY = 'mg_pending_pay_order';

type PendingPayOrder = { orderId: string; rzpOrderId: string; startedAt: number };

const readPendingPayOrder = (): PendingPayOrder | null => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.sessionStorage.getItem(PENDING_PAY_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as PendingPayOrder;
        if (!parsed?.rzpOrderId || Date.now() - (parsed.startedAt || 0) > 7 * 24 * 60 * 60 * 1000) return null;
        return parsed;
    } catch {
        return null;
    }
};

const writePendingPayOrder = (value: PendingPayOrder | null) => {
    if (typeof window === 'undefined') return;
    if (value) window.sessionStorage.setItem(PENDING_PAY_KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(PENDING_PAY_KEY);
};

const clearPendingPayOrder = () => writePendingPayOrder(null);

const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
        if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
        const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
        if (existing) {
            existing.addEventListener('load', () => resolve(true));
            existing.addEventListener('error', () => resolve(false));
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const PayOrderContent = () => {
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const id = String(params?.id || '');
    const token = searchParams.get('token') || '';

    const [order, setOrder] = useState<PayOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paying, setPaying] = useState(false);
    const [paid, setPaid] = useState(false);

    // Reload safety net. A settled order has its token destroyed, so the token-gated
    // GET answers 410 — that alone tells us the payment may have gone through. The
    // server re-asks Razorpay before we claim success, so a live-but-unpaid order
    // never shows a false confirmation. Resolves true only when Razorpay confirms paid.
    const recoverSettledPayment = useCallback(async (): Promise<boolean> => {
        const pending = readPendingPayOrder();
        if (!pending) return false;

        try {
            const { data } = await publicApi.post(`/orders/public/pay/${id}/reconcile`, {
                razorpayOrderId: pending.rzpOrderId,
            });
            // The gateway gave a definitive answer, so the marker has done its job.
            clearPendingPayOrder();
            if (!data?.data?.isPaid) return false;
            setOrder((prev) => ({
                _id: data.data._id,
                orderCode: data.data.orderCode,
                title: prev?.title || data.data.title || 'Custom Order',
                image: prev?.image || '',
                weight: prev?.weight || 0,
                totalPrice: data.data.totalPrice,
                isPaid: true,
                status: data.data.status,
                customerName: data.data.customerName || prev?.customerName || '',
                customerEmail: prev?.customerEmail || '',
                customerPhone: prev?.customerPhone || '',
            }));
            setPaid(true);
            return true;
        } catch {
            clearPendingPayOrder();
            return false;
        }
    }, [id]);

    useEffect(() => {
        let active = true;

        const load = async () => {
            if (!id || !token) {
                setError("This payment link is incomplete. Please request a fresh link from the store.");
                setLoading(false);
                return;
            }
            try {
                const { data } = await publicApi.get(`/orders/public/pay/${id}`, { params: { token } });
                if (!active) return;
                setOrder(data.data);
                if (data.data.isPaid) setPaid(true);
            } catch (err: unknown) {
                if (active) await recoverSettledPayment();
                if (!active) return;
                setError(apiErrorMessage(err, "We could not open this payment link."));
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, [id, token, recoverSettledPayment]);

    const handlePay = useCallback(async () => {
        setPaying(true);
        try {
            const scriptReady = await loadRazorpayScript();
            if (!scriptReady) {
                setError("The payment gateway could not be loaded. Please check your connection and refresh.");
                setPaying(false);
                return;
            }

            const { data } = await publicApi.post(`/orders/public/pay/${id}/razorpay/create`, { token });
            const { id: rzpOrderId, amount, currency, key } = data.data;

            // Recorded before the popup opens: if this tab dies mid-payment, the
            // reconcile endpoint can still confirm it with Razorpay.
            writePendingPayOrder({ orderId: id, rzpOrderId, startedAt: Date.now() });

            if (!window.Razorpay) {
                setError("The payment gateway is unavailable right now. Please refresh to try again.");
                setPaying(false);
                return;
            }

            const rzp = new window.Razorpay({
                key,
                amount,
                currency,
                name: 'Mythris Gleams',
                description: order?.title || 'Custom Order',
                order_id: rzpOrderId,
                prefill: {
                    name: order?.customerName || undefined,
                    email: order?.customerEmail || undefined,
                    contact: order?.customerPhone || undefined,
                },
                theme: { color: '#c84b31' },
                handler: async (response: RazorpayCheckoutResponse) => {
                    try {
                        await publicApi.post(`/orders/public/pay/${id}/razorpay/verify`, {
                            token,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        clearPendingPayOrder();
                        setPaid(true);
                    } catch (err: unknown) {
                        // Razorpay's `order.paid` webhook often settles the order — and
                        // destroys this link's token — before this browser callback
                        // lands, which makes verify answer 410 (or 400 "already paid").
                        // That is a SUCCESS, not a failure. Ask the gateway before telling
                        // the customer their money is at risk.
                        if (await recoverSettledPayment()) return;
                        // The webhook or reconciler may still confirm this payment,
                        // so the marker is deliberately left in place.
                        alert(apiErrorMessage(err, "Payment verification failed. If money was deducted, it is saved and the store has been notified."));
                    } finally {
                        setPaying(false);
                    }
                },
                modal: {
                    ondismiss: () => setPaying(false),
                },
            });

            rzp.on('payment.failed', (response) => {
                clearPendingPayOrder(); // Nothing was captured.
                setPaying(false);
                alert(response?.error?.description || "Payment failed. Please try again.");
            });

            rzp.open();
        } catch (err: unknown) {
            setPaying(false);
            setError(apiErrorMessage(err, "We could not start the payment. Please try again."));
        }
    }, [id, token, order, recoverSettledPayment]);

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Loading your order</p>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-5">
                    <AlertCircle size={26} />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 mb-2">Payment Link Unavailable</h1>
                <p className="text-zinc-500 max-w-md text-sm mb-6">{error}</p>
                <Link
                    href="/"
                    className="px-6 py-3 bg-zinc-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                >
                    Back to store
                </Link>
            </div>
        );
    }

    if (paid && order) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-12">
                <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="text-center max-w-md w-full"
                >
                    <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
                        <CheckCircle2 className="text-emerald-600" size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 mb-2">Payment Successful</h1>
                    <p className="text-zinc-500 mb-8 text-sm">
                        Thank you{order.customerName ? `, ${order.customerName.split(' ')[0]}` : ''}! Your order is confirmed and is already in our handcrafting
                        stage.
                    </p>
                    <div className="bg-white border border-zinc-200 rounded-2xl p-5 text-left text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Order</span>
                            <span className="font-mono font-bold text-zinc-900">#{order.orderCode}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Amount paid</span>
                            <span className="font-bold text-zinc-900 tabular-nums">₹{order.totalPrice.toLocaleString()}</span>
                        </div>
                    </div>
                    <Link
                        href="/"
                        className="inline-block mt-8 px-6 py-3 bg-zinc-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                    >
                        Continue shopping
                    </Link>
                </motion.div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="py-10 sm:py-16 px-4">
            <div className="max-w-xl mx-auto">
                <div className="text-center mb-8">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--accent)]">
                        <Sparkles size={12} /> Secure Payment
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mt-4 mb-2">Complete your order</h1>
                    <p className="text-zinc-500 text-sm">
                        {order.customerName ? `Hi ${order.customerName.split(' ')[0]}, ` : ''}please review and pay below.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm"
                >
                    {order.image ? (
                        <div className="aspect-[16/9] bg-stone-100 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={getImageUrl(order.image)} alt={order.title} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="h-1.5 bg-[var(--accent)]" />
                    )}

                    <div className="p-6 sm:p-7 space-y-4">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Order #{order.orderCode}</div>
                            <div className="text-lg font-bold text-zinc-900">{order.title}</div>
                            {order.weight > 0 && <div className="text-[11px] text-zinc-400 mt-1">Shipping weight: {formatWeight(order.weight)}</div>}
                        </div>

                        {order.customerPhone && (
                            <div className="flex items-center gap-2 text-[12px] text-zinc-500">
                                <Phone size={12} /> {order.customerPhone}
                            </div>
                        )}

                        <div className="pt-4 border-t border-zinc-100 flex items-baseline justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Amount payable</span>
                            <span className="text-3xl font-bold text-zinc-900 tabular-nums">₹{order.totalPrice.toLocaleString()}</span>
                        </div>

                        {error && <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}

                        <button
                            type="button"
                            onClick={handlePay}
                            disabled={paying}
                            className="w-full h-14 bg-zinc-900 text-white rounded-2xl font-bold text-[12px] uppercase tracking-[0.15em] hover:bg-[var(--accent)] transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-lg"
                        >
                            {paying ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                            {paying ? 'Processing' : 'Pay securely with Razorpay'}
                        </button>

                        <p className="text-[11px] text-center text-zinc-400 flex items-center justify-center gap-1.5">
                            <ShieldCheck size={12} /> Secured by Razorpay
                        </p>
                    </div>
                </motion.div>

                <p className="text-[11px] text-center text-zinc-400 mt-6">
                    Questions about this order? Reach us on{' '}
                    <a
                        href={`https://wa.me/918300034451?text=${encodeURIComponent(`Hi, I have a question about my custom order #${order.orderCode}.`)}`}
                        className="underline hover:text-zinc-900"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        WhatsApp
                    </a>
                    .
                </p>
            </div>
        </div>
    );
};

const PayOrderPage = () => (
    <Suspense
        fallback={
            <div className="min-h-[70vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-zinc-300" size={28} />
            </div>
        }
    >
        <PayOrderContent />
    </Suspense>
);

export default PayOrderPage;
