"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createOfflineOrder, fetchOfflineOrders, markOrderPaid } from '@/redux/slices/orderSlice';
import { RootState } from '@/redux/store';
import api from '@/utils/api';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    Banknote,
    Loader2,
    CheckCircle2,
    Hourglass,
    History,
    Search,
    Plus,
    X,
    SearchX,
    Package,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
    'Bank Transfer',
    'UPI',
    'Cash',
    'Card (in person)',
    'Cheque',
    'PayPal / International',
    'Other',
];

const MAX_QTY = 99;
const SEARCH_DEBOUNCE_MS = 300;

const EMPTY_FORM = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerStreet: '',
    customerCity: '',
    customerState: '',
    customerZip: '',
    method: PAYMENT_METHODS[0],
    reference: '',
    note: '',
};

const inputClass =
    'w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white outline-none transition-all';

const SectionLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
        {icon}
        {children}
    </h2>
);

const formatTimestamp = (value: string) =>
    new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const rupee = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

type SearchHit = {
    _id: string;
    name: string;
    price: number;
    weight?: number;
    images?: string[];
    stockStatus?: string;
    variants?: { type: string; options: string[] }[];
};

type Line = {
    key: string;
    product: string;
    name: string;
    price: number;
    image: string;
    stockStatus?: string;
    variantOptions: string[];
    colorOptions: string[];
    qty: number;
    selectedVariant: string;
    selectedColor: string;
};

const OfflineOrderPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { offlineOrders, offlineLoading } = useAppSelector((state: RootState) => state.orders);

    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [paymentReceived, setPaymentReceived] = useState(true);
    // Per-row expansion for a payment that lands after the order was logged.
    const [settling, setSettling] = useState<string | null>(null);
    const [settleForm, setSettleForm] = useState({ method: PAYMENT_METHODS[0], reference: '', note: '' });
    const [saving, setSaving] = useState(false);

    // --- product search ---
    const [query, setQuery] = useState('');
    const [hits, setHits] = useState<SearchHit[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [lines, setLines] = useState<Line[]>([]);
    const [showBespoke, setShowBespoke] = useState(false);
    const [bespoke, setBespoke] = useState({ name: '', amount: '', qty: '1', weight: '', description: '' });
    const searchRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        dispatch(fetchOfflineOrders());
    }, [dispatch]);

    useEffect(() => {
        if (query.trim().length < 2) {
            setHits([]);
            setSearching(false);
            return;
        }

        setSearching(true);
        const timer = window.setTimeout(async () => {
            try {
                // includePaused lets the desk sell a paused design to someone who asked for it
                // in person; the backend reports it back as a warning.
                const { data } = await api.get('/products', {
                    params: { search: query.trim(), includePaused: 'true' },
                });
                setHits((data.data || []).slice(0, 8));
            } catch {
                setHits([]);
            } finally {
                setSearching(false);
            }
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [query]);

    // Click-away closes the results without stealing focus from the search field.
    useEffect(() => {
        if (!searchOpen) return;
        const onDown = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [searchOpen]);

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const addLine = (product: SearchHit) => {
        setLines((prev) => {
            const existing = prev.find((l) => l.product === product._id);
            // Same product picked twice just bumps the count — no duplicate rows.
            if (existing) {
                return prev.map((l) => (l.product === product._id ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l));
            }
            const sizeVariant = product.variants?.find((v) => v.type !== 'Color' && v.options?.length);
            const colorVariant = product.variants?.find((v) => v.type === 'Color' && v.options?.length);
            return [
                ...prev,
                {
                    key: `${product._id}-${Date.now()}`,
                    product: product._id,
                    name: product.name,
                    price: Number(product.price) || 0,
                    image: product.images?.[0] || '',
                    stockStatus: product.stockStatus,
                    variantOptions: sizeVariant?.options || [],
                    colorOptions: colorVariant?.options || [],
                    qty: 1,
                    selectedVariant: sizeVariant?.options?.[0] || '',
                    selectedColor: colorVariant?.options?.[0] || '',
                },
            ];
        });
        setQuery('');
        setHits([]);
        setSearchOpen(false);
        toast.success(`${product.name} added`);
    };

    const setQty = (key: string, qty: number) =>
        setLines((prev) =>
            prev.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(MAX_QTY, qty || 1)) } : l))
        );

    const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

    const itemsTotal = useMemo(() => lines.reduce((sum, l) => sum + l.price * l.qty, 0), [lines]);
    const bespokeQty = Math.max(1, parseInt(bespoke.qty, 10) || 1);
    const bespokeTotal = (parseFloat(bespoke.amount) || 0) * bespokeQty;
    const hasBespoke = showBespoke && bespoke.name.trim() && bespokeTotal > 0;
    const grandTotal = Math.round((itemsTotal + (hasBespoke ? bespokeTotal : 0)) * 100) / 100;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.customerName.trim()) return toast.error('Customer name is required.');
        if (!form.customerPhone.trim()) return toast.error('Phone number is required.');
        if (form.customerEmail && !/^\S+@\S+\.\S+$/.test(form.customerEmail)) {
            return toast.error('Enter a valid email address.');
        }
        if (lines.length === 0 && !hasBespoke) return toast.error('Add at least one product to the order.');
        if (hasBespoke && !bespoke.name.trim()) return toast.error('Name the custom item, or remove it.');
        if (hasBespoke && bespokeTotal <= 0) return toast.error('Enter an amount for the custom item.');
        if (paymentReceived && !form.method.trim()) return toast.error('Select how the payment was received.');

        try {
            const res = await dispatch(
                createOfflineOrder({
                    customerName: form.customerName.trim(),
                    customerEmail: form.customerEmail.trim(),
                    customerPhone: form.customerPhone.trim(),
                    customerStreet: form.customerStreet.trim(),
                    customerCity: form.customerCity.trim(),
                    customerState: form.customerState.trim(),
                    customerZip: form.customerZip.trim(),
                    items: lines.map((l) => ({
                        product: l.product,
                        qty: l.qty,
                        selectedVariant: l.selectedVariant || undefined,
                        selectedColor: l.selectedColor || undefined,
                    })),
                    customItem: hasBespoke
                        ? {
                              name: bespoke.name.trim(),
                              amount: parseFloat(bespoke.amount),
                              qty: bespokeQty,
                              weight: bespoke.weight ? Number(bespoke.weight) : 0,
                              description: bespoke.description.trim(),
                          }
                        : undefined,
                    paymentReceived,
                    method: paymentReceived ? form.method.trim() : undefined,
                    reference: paymentReceived ? form.reference.trim() : undefined,
                    note: paymentReceived ? form.note.trim() : undefined,
                })
            ).unwrap();

            toast.success(res.message);
            (res.warnings || []).forEach((w: string) => toast(w, { icon: '⚠️', duration: 7000 }));
            setForm({ ...EMPTY_FORM });
            setLines([]);
            setQuery('');
            setShowBespoke(false);
            setBespoke({ name: '', amount: '', qty: '1', weight: '', description: '' });
            dispatch(fetchOfflineOrders());
        } catch (err: unknown) {
            toast.error(typeof err === 'string' ? err : 'Failed to record this order.');
        }
    };

    const recordLaterPayment = useCallback(
        async (orderId: string) => {
            if (!settleForm.method.trim()) {
                toast.error('Select how the payment was received.');
                return;
            }
            setSaving(true);
            try {
                const res = await dispatch(
                    markOrderPaid({
                        id: orderId,
                        method: settleForm.method.trim(),
                        reference: settleForm.reference.trim() || undefined,
                        note: settleForm.note.trim() || undefined,
                    })
                ).unwrap();
                toast.success(res.message || 'Payment recorded');
                setSettling(null);
                setSettleForm({ method: PAYMENT_METHODS[0], reference: '', note: '' });
            } catch (err: unknown) {
                toast.error(typeof err === 'string' ? err : 'Could not record this payment.');
                // The backend refuses a double confirmation — resync so the row stops offering it.
                dispatch(fetchOfflineOrders());
                setSettling(null);
            } finally {
                setSaving(false);
            }
        },
        [dispatch, settleForm]
    );

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
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Offline Order Entry</h1>
                    <p className="text-xs text-zinc-500 font-medium">
                        Log an order taken over the phone or WhatsApp. Cash, UPI, bank transfer and cheques are
                        recorded here — no payment link is generated.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
                <section className="space-y-4">
                    <SectionLabel icon={<Package size={12} />}>Products</SectionLabel>

                    <div className="relative" ref={searchRef}>
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSearchOpen(true);
                            }}
                            onFocus={() => setSearchOpen(true)}
                            placeholder="Search products by name, category or occasion…"
                            className={`${inputClass} pl-10`}
                        />
                        {searching && (
                            <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" />
                        )}

                        {searchOpen && query.trim().length >= 2 && (
                            <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                                {!searching && hits.length === 0 && (
                                    <p className="px-4 py-4 text-[11px] text-zinc-400 flex items-center gap-2">
                                        <SearchX size={13} /> No products match “{query.trim()}”.
                                    </p>
                                )}
                                {hits.map((hit) => (
                                    <button
                                        key={hit._id}
                                        type="button"
                                        onClick={() => addLine(hit)}
                                        className="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors flex items-center gap-3 border-b border-zinc-100 last:border-b-0"
                                    >
                                        {hit.images?.[0] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={hit.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-zinc-100 shrink-0" />
                                        ) : (
                                            <span className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                                <Package size={15} className="text-zinc-400" />
                                            </span>
                                        )}
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-xs font-bold text-zinc-900 truncate">{hit.name}</span>
                                            <span className="block text-[10px] text-zinc-400">
                                                {hit.stockStatus === 'out-of-stock' ? 'Out of stock' : hit.stockStatus === 'in-stock' ? 'In stock' : 'Made to order'}
                                            </span>
                                        </span>
                                        <span className="text-xs font-bold text-zinc-900 tabular-nums shrink-0">{rupee(hit.price)}</span>
                                        <Plus size={14} className="text-zinc-400 shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {lines.length === 0 ? (
                        <p className="text-[11px] text-zinc-400 py-2">No products added yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {lines.map((line) => (
                                <div key={line.key} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        {line.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={line.image} alt="" className="w-11 h-11 rounded-lg object-cover bg-white shrink-0" />
                                        ) : (
                                            <span className="w-11 h-11 rounded-lg bg-white flex items-center justify-center shrink-0">
                                                <Package size={15} className="text-zinc-400" />
                                            </span>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-zinc-900 leading-snug">{line.name}</p>
                                            <p className="text-[11px] text-zinc-500 mt-0.5 tabular-nums">
                                                {rupee(line.price)} each
                                                {line.stockStatus === 'out-of-stock' && <span className="ml-1.5 text-rose-500">· out of stock</span>}
                                            </p>
                                        </div>
                                        <span className="text-sm font-bold text-zinc-900 tabular-nums shrink-0">
                                            {rupee(line.price * line.qty)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeLine(line.key)}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 hover:text-rose-600 transition-colors shrink-0"
                                            aria-label={`Remove ${line.name}`}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap items-end gap-3 pt-1">
                                        <div>
                                            <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Count</label>
                                            <div className="flex items-center border border-zinc-200 bg-white rounded-lg overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => setQty(line.key, line.qty - 1)}
                                                    disabled={line.qty <= 1}
                                                    className="px-2.5 py-2 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 transition-colors"
                                                    aria-label="Decrease quantity"
                                                >
                                                    −
                                                </button>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={MAX_QTY}
                                                    value={line.qty}
                                                    onChange={(e) => setQty(line.key, parseInt(e.target.value, 10) || 1)}
                                                    className="w-11 text-center text-xs font-bold text-zinc-900 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setQty(line.key, line.qty + 1)}
                                                    disabled={line.qty >= MAX_QTY}
                                                    className="px-2.5 py-2 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 transition-colors"
                                                    aria-label="Increase quantity"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {line.variantOptions.length > 0 && (
                                            <div>
                                                <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Option</label>
                                                <select
                                                    value={line.selectedVariant}
                                                    onChange={(e) =>
                                                        setLines((prev) =>
                                                            prev.map((l) => (l.key === line.key ? { ...l, selectedVariant: e.target.value } : l))
                                                        )
                                                    }
                                                    className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-medium focus:border-zinc-900 outline-none"
                                                >
                                                    {line.variantOptions.map((o) => (
                                                        <option key={o} value={o}>
                                                            {o}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {line.colorOptions.length > 0 && (
                                            <div>
                                                <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Colour</label>
                                                <select
                                                    value={line.selectedColor}
                                                    onChange={(e) =>
                                                        setLines((prev) =>
                                                            prev.map((l) => (l.key === line.key ? { ...l, selectedColor: e.target.value } : l))
                                                        )
                                                    }
                                                    className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-medium focus:border-zinc-900 outline-none"
                                                >
                                                    {line.colorOptions.map((o) => (
                                                        <option key={o} value={o}>
                                                            {o}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Escape hatch for a one-off piece that is not in the catalogue. */}
                    {showBespoke ? (
                        <div className="rounded-xl border border-dashed border-zinc-300 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Custom item (not in catalogue)</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBespoke(false);
                                        setBespoke({ name: '', amount: '', qty: '1', weight: '', description: '' });
                                    }}
                                    className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-200 transition-colors"
                                    aria-label="Remove custom item"
                                >
                                    <X size={13} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <input
                                    value={bespoke.name}
                                    onChange={(e) => setBespoke((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="Item name *"
                                    className={`${inputClass} sm:col-span-2`}
                                />
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={bespoke.amount}
                                    onChange={(e) => setBespoke((p) => ({ ...p, amount: e.target.value }))}
                                    placeholder="Unit price *"
                                    className={inputClass}
                                />
                                <input
                                    type="number"
                                    min="1"
                                    value={bespoke.qty}
                                    onChange={(e) => setBespoke((p) => ({ ...p, qty: e.target.value }))}
                                    placeholder="Count"
                                    className={inputClass}
                                />
                            </div>
                            <input
                                type="number"
                                min="0"
                                value={bespoke.weight}
                                onChange={(e) => setBespoke((p) => ({ ...p, weight: e.target.value }))}
                                placeholder="Weight in grams (optional)"
                                className={inputClass}
                            />
                            <textarea
                                rows={2}
                                value={bespoke.description}
                                onChange={(e) => setBespoke((p) => ({ ...p, description: e.target.value }))}
                                placeholder="Notes for the workshop (optional)"
                                className={`${inputClass} resize-none`}
                            />
                            {bespokeTotal > 0 && (
                                <p className="text-[11px] text-zinc-500 tabular-nums">
                                    {bespokeQty} × {rupee(parseFloat(bespoke.amount) || 0)} = <strong>{rupee(bespokeTotal)}</strong>
                                </p>
                            )}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowBespoke(true)}
                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                            <Plus size={12} /> Add a custom item
                        </button>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Order total</span>
                        <span className="text-lg font-bold text-zinc-900 tabular-nums">{rupee(grandTotal)}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 -mt-4">
                        Shipping is added by the server on save, using the same free-shipping rule as checkout.
                    </p>
                </section>

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
                    <SectionLabel icon={<Banknote size={12} />}>Payment</SectionLabel>

                    <label className="flex items-start gap-3 p-4 rounded-xl border border-zinc-200 bg-zinc-50 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={paymentReceived}
                            onChange={(e) => setPaymentReceived(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-emerald-600"
                        />
                        <span className="text-xs font-medium text-zinc-700 leading-relaxed">
                            Payment already received
                            <span className="block text-[10px] text-zinc-500 font-normal mt-0.5">
                                Uncheck if the customer will pay later — the order is saved as awaiting payment and
                                you can record the money from this page once it lands.
                            </span>
                        </span>
                    </label>

                    {paymentReceived && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-4 overflow-hidden"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <select
                                    name="method"
                                    value={form.method}
                                    onChange={onChange}
                                    className={`${inputClass} appearance-none`}
                                    required
                                >
                                    {PAYMENT_METHODS.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    name="reference"
                                    value={form.reference}
                                    onChange={onChange}
                                    placeholder="UTR / cheque / transaction no. (optional)"
                                    className={inputClass}
                                />
                            </div>
                            <textarea
                                name="note"
                                rows={2}
                                value={form.note}
                                onChange={onChange}
                                placeholder="Payment note (optional) — e.g. confirmed over the phone"
                                className={`${inputClass} resize-none`}
                            />
                        </motion.div>
                    )}
                </section>

                <div>
                    <button
                        type="submit"
                        disabled={offlineLoading}
                        className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {offlineLoading ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
                        {paymentReceived ? 'Record Order as Paid' : 'Record Order'}
                    </button>
                </div>
            </form>

            {/* Offline orders logged so far — this is where a later payment is recorded. */}
            <section className="space-y-3 border-t border-zinc-100 pt-6">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <History size={12} /> Recent offline orders ({offlineOrders.length})
                </h2>

                {offlineOrders.length === 0 && (
                    <p className="text-[11px] text-zinc-400 py-2">Nothing recorded yet.</p>
                )}

                {offlineOrders.map((order: any) => (
                    <div
                        key={order._id}
                        className={`rounded-xl border p-4 space-y-3 ${
                            order.isPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'
                        }`}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <span className="font-mono font-bold text-sm text-zinc-900">#{order.orderCode}</span>
                                {order.isPaid ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase border bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1">
                                        <CheckCircle2 size={11} /> Paid
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1.5">
                                        <Hourglass size={11} /> Awaiting payment
                                    </span>
                                )}
                            </div>
                            <span className="text-sm font-bold text-zinc-900 tabular-nums">{rupee(order.totalPrice)}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                            <span className="flex items-center gap-1.5">
                                <User size={11} /> {order.customerName}
                            </span>
                            {order.customerPhone && <span className="font-mono">{order.customerPhone}</span>}
                            <span className="text-zinc-300">|</span>
                            <span className="truncate max-w-[240px]">{order.title}</span>
                            <span className="text-zinc-300">|</span>
                            <span>{formatTimestamp(order.createdAt)}</span>
                        </div>

                        {order.isPaid ? (
                            <p className="text-[11px] text-emerald-700">
                                {order.paymentMethod || 'Manual'} recorded
                                {order.paymentReference ? ` — ref ${order.paymentReference}` : ''}
                                {order.markedPaidByName ? ` by ${order.markedPaidByName}` : ''}
                            </p>
                        ) : settling === order._id ? (
                            <div className="space-y-2 pt-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <select
                                        value={settleForm.method}
                                        onChange={(e) => setSettleForm((p) => ({ ...p, method: e.target.value }))}
                                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-xs font-medium focus:border-zinc-900 outline-none"
                                    >
                                        {PAYMENT_METHODS.map((m) => (
                                            <option key={m} value={m}>
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        value={settleForm.reference}
                                        onChange={(e) => setSettleForm((p) => ({ ...p, reference: e.target.value }))}
                                        placeholder="UTR / cheque no. (optional)"
                                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-xs font-mono focus:border-zinc-900 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => recordLaterPayment(order._id)}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                                    >
                                        {saving && <Loader2 size={12} className="animate-spin" />}
                                        Confirm payment
                                    </button>
                                    <button
                                        onClick={() => setSettling(null)}
                                        disabled={saving}
                                        className="px-4 py-2 text-zinc-500 text-[10px] font-bold uppercase tracking-wider hover:text-zinc-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    setSettling(order._id);
                                    setSettleForm({ method: PAYMENT_METHODS[0], reference: '', note: '' });
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-50 transition-all"
                            >
                                <Banknote size={12} /> Record payment received
                            </button>
                        )}
                    </div>
                ))}

                <p className="pt-1">
                    <Link
                        href="/admin/orders"
                        className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                        View all orders
                    </Link>
                </p>
            </section>
        </div>
    );
};

export default OfflineOrderPage;
