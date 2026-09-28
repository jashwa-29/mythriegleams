"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createAdminCustomOrder, clearCustomOrder } from '@/redux/slices/orderSlice';
import { RootState } from '@/redux/store';
import api from '@/utils/api';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    IndianRupee,
    FileText,
    Link2,
    Copy,
    Check,
    Loader2,
    Sparkles,
    Scale,
    ImageIcon,
    ExternalLink,
    X,
    CheckCircle2,
    RefreshCw,
    Hourglass
} from 'lucide-react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'mg_pending_custom_orders';
const POLL_INTERVAL = 8000;
const PAID_FLASH_MS = 7000;

const EMPTY_FORM = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerStreet: '',
    customerCity: '',
    customerState: '',
    customerZip: '',
    amount: '',
    title: '',
    description: '',
    image: '',
    weight: '',
};

type CustomOrder = {
    orderId: string;
    orderCode: string;
    paymentToken: string;
    totalPrice: number;
    payUrl: string;
    absoluteUrl: string;
    customerName: string;
    title: string;
    createdAt: string;
    paidAt?: string | null;
};

type CustomOrderStatus = {
    _id: string;
    orderCode: string;
    customerName: string;
    title: string;
    totalPrice: number;
    isPaid: boolean;
    status: string;
    paidAt: string | null;
    createdAt: string;
};

const inputClass =
    'w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white outline-none transition-all';

const SectionLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
        {icon}
        {children}
    </h2>
);

const loadStoredOrders = (): CustomOrder[] => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? (parsed as CustomOrder[]) : [];
    } catch {
        return [];
    }
};

const formatTimestamp = (value: string) =>
    new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const CreateCustomOrderPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { loading } = useAppSelector((state: RootState) => state.orders);

    const [form, setForm] = useState({ ...EMPTY_FORM });
    // Pending cards survive refreshes: the admin must not lose a link they already sent.
    const [orders, setOrders] = useState<CustomOrder[]>(loadStoredOrders);
    const [checking, setChecking] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const cardsRef = useRef<HTMLDivElement | null>(null);
    const ordersRef = useRef<CustomOrder[]>([]);

    useEffect(() => {
        ordersRef.current = orders;
    }, [orders]);

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }, [orders]);

    // A paid card stays visible for a few seconds as confirmation, then clears itself.
    const markAsPaid = useCallback((paid: CustomOrder[]) => {
        if (paid.length === 0) return;
        paid.forEach((o) => toast.success(`Payment received — order #${o.orderCode} is paid.`));
        const paidIds = paid.map((o) => o.orderId);
        window.setTimeout(() => {
            setOrders((current) => current.filter((o) => !paidIds.includes(o.orderId)));
        }, PAID_FLASH_MS);
    }, []);

    const refreshStatuses = useCallback(async () => {
        const current = ordersRef.current;
        if (current.length === 0) return;

        setChecking(true);
        const statuses = await Promise.all(
            current.map(async (o) => {
                try {
                    const { data } = await api.get<{ data: CustomOrderStatus }>(`/orders/admin/custom/${o.orderId}`);
                    return { id: o.orderId, status: data.data };
                } catch {
                    // 404 means the order was removed server-side; drop the card silently.
                    return { id: o.orderId, status: null };
                }
            })
        );
        setChecking(false);

        const goneIds = statuses.filter((s) => !s.status).map((s) => s.id);
        const paidIds = statuses.filter((s) => s.status?.isPaid).map((s) => s.id);

        setOrders((prev) =>
            prev
                .filter((o) => !goneIds.includes(o.orderId))
                .map((o) => {
                    const match = statuses.find((s) => s.id === o.orderId);
                    return match?.status
                        ? {
                              ...o,
                              title: match.status.title,
                              customerName: match.status.customerName || o.customerName,
                              totalPrice: match.status.totalPrice,
                              paidAt: match.status.paidAt,
                          }
                        : o;
                })
        );

        if (paidIds.length) markAsPaid(current.filter((o) => paidIds.includes(o.orderId)));
    }, [markAsPaid]);

    // Poll so the card flips to "paid" the moment the customer completes checkout.
    useEffect(() => {
        const initialCheck = window.setTimeout(refreshStatuses, 400);
        const interval = window.setInterval(refreshStatuses, POLL_INTERVAL);
        return () => {
            window.clearTimeout(initialCheck);
            window.clearInterval(interval);
        };
    }, [refreshStatuses]);

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.customerName.trim()) return toast.error("Customer name is required.");
        if (!form.customerPhone.trim()) return toast.error("Phone number is required.");
        if (form.customerEmail && !/^\S+@\S+\.\S+$/.test(form.customerEmail)) return toast.error("Enter a valid email address.");

        const amount = Number(form.amount);
        if (!Number.isFinite(amount) || amount <= 0) return toast.error("Enter an amount greater than zero.");

        try {
            const res = await dispatch(
                createAdminCustomOrder({
                    customerName: form.customerName.trim(),
                    customerEmail: form.customerEmail.trim(),
                    customerPhone: form.customerPhone.trim(),
                    customerStreet: form.customerStreet.trim(),
                    customerCity: form.customerCity.trim(),
                    customerState: form.customerState.trim(),
                    customerZip: form.customerZip.trim(),
                    amount,
                    title: form.title.trim(),
                    description: form.description.trim(),
                    image: form.image.trim(),
                    weight: form.weight ? Number(form.weight) : 0,
                })
            ).unwrap();

            const created = res as {
                orderId: string;
                orderCode: string;
                paymentToken: string;
                totalPrice: number;
                payUrl: string;
            };

            setOrders((prev) => [
                {
                    ...created,
                    absoluteUrl: `${window.location.origin}${created.payUrl}`,
                    customerName: form.customerName.trim(),
                    title: form.title.trim() || 'Custom Order',
                    createdAt: new Date().toISOString(),
                    paidAt: null,
                },
                ...prev,
            ]);
            setForm({ ...EMPTY_FORM });
            dispatch(clearCustomOrder());
            toast.success("Payment link generated — send it to the customer.");
            window.setTimeout(() => cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
        } catch (err: unknown) {
            toast.error(typeof err === 'string' ? err : "Failed to create the custom order.");
        }
    };

    const copy = async (key: string, label: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(key);
            toast.success(`${label} copied`);
            window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
        } catch {
            toast.error("Copy failed — please copy manually.");
        }
    };

    const hideCard = (order: CustomOrder) => {
        setOrders((prev) => prev.filter((o) => o.orderId !== order.orderId));
        toast("Card hidden — the payment link stays active until it is used.");
    };

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 bg-white min-h-screen rounded-2xl border border-zinc-200">
            <div className="flex items-center gap-4 border-b border-zinc-200 pb-5">
                <button
                    type="button"
                    onClick={() => router.push('/admin/orders')}
                    className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors"
                    aria-label="Back to orders"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Create Custom Order</h1>
                    <p className="text-xs text-zinc-500 font-medium">
                        Generate a payment link, send it to the customer. The link stays on this page until the payment lands.
                    </p>
                </div>
            </div>

            {/* Payment links awaiting settlement */}
            <div ref={cardsRef} className="space-y-3">
                {orders.length > 0 && (
                    <div className="flex items-center justify-between">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                            <Hourglass size={12} /> Awaiting payment ({orders.length})
                        </h2>
                        <button
                            type="button"
                            onClick={refreshStatuses}
                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                            <RefreshCw size={11} className={checking ? 'animate-spin' : ''} />
                            {checking ? 'Checking' : 'Check now'}
                        </button>
                    </div>
                )}

                {orders.map((order) => {
                    const isPaid = !!order.paidAt;
                    return (
                        <motion.div
                            key={order.orderId}
                            layout
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                                isPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'
                            }`}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <span className="font-mono font-bold text-sm text-zinc-900">#{order.orderCode}</span>
                                    {isPaid ? (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase border bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1">
                                            <CheckCircle2 size={11} /> Paid
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Awaiting payment
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg font-bold text-zinc-900 tabular-nums">₹{order.totalPrice.toLocaleString()}</span>
                                    <button
                                        type="button"
                                        onClick={() => hideCard(order)}
                                        className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
                                        aria-label="Hide card"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                                <span className="flex items-center gap-1.5">
                                    <User size={11} /> {order.customerName}
                                </span>
                                <span className="text-zinc-300">|</span>
                                <span className="truncate max-w-[220px]">{order.title}</span>
                                <span className="text-zinc-300">|</span>
                                <span>Created {formatTimestamp(order.createdAt)}</span>
                            </div>

                            {isPaid ? (
                                <p className="text-[11px] text-emerald-700">
                                    Paid {order.paidAt ? formatTimestamp(order.paidAt) : 'just now'} — this order is now in Order Management.
                                </p>
                            ) : (
                                <div className="flex items-stretch gap-2">
                                    <div className="flex-1 flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2.5 overflow-x-auto">
                                        <Link2 size={13} className="text-zinc-400 shrink-0" />
                                        <span className="text-[11px] font-mono text-zinc-700 whitespace-nowrap">{order.absoluteUrl}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => copy(order.orderId, 'Payment link', order.absoluteUrl)}
                                        className="px-4 bg-zinc-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-all flex items-center gap-2"
                                    >
                                        {copied === order.orderId ? <Check size={14} /> : <Copy size={14} />}
                                        {copied === order.orderId ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            )}

                            {!isPaid && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <Link
                                        href={order.payUrl}
                                        target="_blank"
                                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition-colors"
                                    >
                                        <ExternalLink size={12} /> Preview pay page
                                    </Link>
                                    <span className="text-[10px] text-zinc-400">Auto-checks every {POLL_INTERVAL / 1000}s</span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-7 border-t border-zinc-100 pt-6">
                <section className="space-y-4">
                    <SectionLabel icon={<User size={12} />}>Customer Details</SectionLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            name="customerName"
                            value={form.customerName}
                            onChange={onChange}
                            placeholder="Customer Name *"
                            className={inputClass}
                            required
                        />
                        <div className="relative">
                            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                name="customerPhone"
                                value={form.customerPhone}
                                onChange={onChange}
                                placeholder="Phone Number *"
                                className={`${inputClass} pl-10`}
                                required
                            />
                        </div>
                        <div className="relative md:col-span-2">
                            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                name="customerEmail"
                                type="email"
                                value={form.customerEmail}
                                onChange={onChange}
                                placeholder="Email (optional — enables payment confirmation + account linking)"
                                className={`${inputClass} pl-10`}
                            />
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <SectionLabel icon={<MapPin size={12} />}>Shipping Address (optional)</SectionLabel>
                    <input
                        name="customerStreet"
                        value={form.customerStreet}
                        onChange={onChange}
                        placeholder="Street address"
                        className={inputClass}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input name="customerCity" value={form.customerCity} onChange={onChange} placeholder="City" className={inputClass} />
                        <input name="customerState" value={form.customerState} onChange={onChange} placeholder="State" className={inputClass} />
                        <input name="customerZip" value={form.customerZip} onChange={onChange} placeholder="PIN code" className={inputClass} />
                    </div>
                </section>

                <section className="space-y-4">
                    <SectionLabel icon={<FileText size={12} />}>Order Details</SectionLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            name="title"
                            value={form.title}
                            onChange={onChange}
                            placeholder="Order title shown to customer (e.g. Navaratri Thamboolam Set)"
                            className={inputClass}
                        />
                        <div className="relative">
                            <IndianRupee size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                name="amount"
                                type="number"
                                min="1"
                                step="0.01"
                                value={form.amount}
                                onChange={onChange}
                                placeholder="Amount to be paid *"
                                className={`${inputClass} pl-10`}
                                required
                            />
                        </div>
                        <div className="relative">
                            <Scale size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                name="weight"
                                type="number"
                                min="0"
                                value={form.weight}
                                onChange={onChange}
                                placeholder="Total weight in grams (optional)"
                                className={`${inputClass} pl-10`}
                            />
                        </div>
                        <div className="relative">
                            <ImageIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                name="image"
                                value={form.image}
                                onChange={onChange}
                                placeholder="Image URL (optional)"
                                className={`${inputClass} pl-10`}
                            />
                        </div>
                    </div>
                    <textarea
                        name="description"
                        rows={3}
                        value={form.description}
                        onChange={onChange}
                        placeholder="Notes shown on the payment page (optional)"
                        className={`${inputClass} resize-none`}
                    />
                </section>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        Generate Payment Link
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateCustomOrderPage;
