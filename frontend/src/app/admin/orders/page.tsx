"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchOrders, updateOrderStatus, resetOrderSuccess } from '@/redux/slices/orderSlice';
import { 
    ShoppingBag, 
    Search,
    Loader2,
    Calendar,
    User,
    Package,
        Hammer,
    X,
    MapPin,
    Copy,
    Hash,
    Download,
    Banknote,
    Zap,
    Truck,
    Clock,
    MoreHorizontal,
    Plus,
    Filter,
    SlidersHorizontal,
    RotateCcw,
    ArrowUpDown,
    Check,
    CreditCard
} from 'lucide-react';
import { RootState } from '@/redux/store';
import Modal from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/utils/getImageUrl';
import { formatWeight } from '@/utils/formatWeight';

const OrderManagement = () => {
    const dispatch = useAppDispatch();
    const { orders, loading, success, error } = useAppSelector((state: RootState) => state.orders);
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    // Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [paymentChannelFilter, setPaymentChannelFilter] = useState<'all' | 'razorpay' | 'manual'>('all');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'last7' | 'last30' | 'custom'>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('newest');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

    const [inspectedOrder, setInspectedOrder] = useState<any>(null);
    const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
    const [dispatchData, setDispatchData] = useState({ tracking: '', note: '' });

    // Feedback Modals
    const [pendingAction, setPendingAction] = useState<{id: string, status: string, tracking?: string, deliveryNote?: string} | null>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    useEffect(() => {
        // Unpaid orders must be listed: they are exactly the ones an admin may need to
        // confirm by hand, and they are also what proves a payment is still outstanding.
        dispatch(fetchOrders({ includeUnpaid: true }));
    }, [dispatch]);

    useEffect(() => {
        if (success) {
            toast.success("Order Updated");
            setConfirmModalOpen(false);
            setPendingAction(null);
            dispatch(resetOrderSuccess());
        }
        if (error) {
            toast.error(error);
        }
    }, [success, error, dispatch]);

    const handleActionInitiation = (id: string, status: string, tracking?: string, deliveryNote?: string) => {
        setPendingAction({ id, status, tracking, deliveryNote });
        setConfirmModalOpen(true);
    };

    const handleStatusUpdate = async (id: string, status: string, tracking?: string, deliveryNote?: string) => {
        setStatusUpdating(id);
        await dispatch(updateOrderStatus({ id, status, trackingNumber: tracking, deliveryNote }));
        setStatusUpdating(null);
        if (inspectedOrder && inspectedOrder._id === id) {
            setInspectedOrder((prev: any) => ({ ...prev, status, trackingNumber: tracking || prev.trackingNumber, deliveryNote: deliveryNote || prev.deliveryNote }));
        }
    };

    const orderStatuses = ['Pending', 'Handcrafting', 'Quality Check', 'Dispatched', 'Delivered', 'Cancelled'];

    const orderWeight = (o: { orderItems?: { weight?: number; qty?: number }[] }) => (o.orderItems || []).reduce((s: number, it: { weight?: number; qty?: number }) => s + (it.weight || 0) * (it.qty || 1), 0);

    const getStatusStyles = (status: string) => {
        switch(status) {
            case 'Pending': return 'bg-amber-100/60 text-amber-800 border-amber-300';
            case 'Handcrafting': return 'bg-zinc-100 text-zinc-900 border-zinc-300 font-bold';
            case 'Quality Check': return 'bg-blue-100/60 text-blue-800 border-blue-300';
            case 'Dispatched': return 'bg-indigo-100/60 text-indigo-800 border-indigo-300';
            case 'Delivered': return 'bg-emerald-100/60 text-emerald-800 border-emerald-300';
            case 'Cancelled': return 'bg-rose-100/60 text-rose-800 border-rose-300';
            default: return 'bg-zinc-50 text-zinc-500 border-zinc-200';
        }
    };

    // Live counts across all loaded orders
    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { all: orders.length };
        orderStatuses.forEach(st => { counts[st] = 0; });
        orders.forEach((o: any) => {
            const st = o.status || 'Pending';
            counts[st] = (counts[st] || 0) + 1;
        });
        return counts;
    }, [orders]);

    const paidCount = useMemo(() => orders.filter((o: any) => o.isPaid).length, [orders]);
    const unpaidCount = useMemo(() => orders.length - paidCount, [orders, paidCount]);

    // Multi-dimensional filtering logic
    const filteredOrders = useMemo(() => {
        let result = userId ? orders.filter((o: any) => o.user === userId || o.user?._id === userId) : orders;

        // Payment filter
        if (paymentFilter === 'paid') result = result.filter((o: any) => o.isPaid);
        if (paymentFilter === 'unpaid') result = result.filter((o: any) => !o.isPaid);

        // Order Status filter
        if (selectedStatus !== 'all') {
            result = result.filter((o: any) => (o.status || '').toLowerCase() === selectedStatus.toLowerCase());
        }

        // Payment Channel filter
        if (paymentChannelFilter === 'manual') {
            result = result.filter((o: any) => o.paymentChannel === 'manual');
        } else if (paymentChannelFilter === 'razorpay') {
            result = result.filter((o: any) => o.paymentChannel !== 'manual');
        }

        // Date Range filter
        if (dateFilter !== 'all') {
            const now = new Date();
            result = result.filter((o: any) => {
                const orderDate = new Date(o.createdAt);
                if (dateFilter === 'today') {
                    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    return orderDate >= startOfToday;
                }
                if (dateFilter === 'last7') {
                    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return orderDate >= sevenDaysAgo;
                }
                if (dateFilter === 'last30') {
                    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return orderDate >= thirtyDaysAgo;
                }
                if (dateFilter === 'custom') {
                    if (startDate) {
                        const start = new Date(startDate);
                        start.setHours(0, 0, 0, 0);
                        if (orderDate < start) return false;
                    }
                    if (endDate) {
                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);
                        if (orderDate > end) return false;
                    }
                    return true;
                }
                return true;
            });
        }

        // Text search filter
        if (searchTerm.trim()) {
            const lowTerm = searchTerm.toLowerCase().trim();
            result = result.filter((o: any) =>
                o._id.toLowerCase().includes(lowTerm) ||
                (o.razorpayOrderId && o.razorpayOrderId.toLowerCase().includes(lowTerm)) ||
                (o.paymentReference && o.paymentReference.toLowerCase().includes(lowTerm)) ||
                (o.shippingAddress?.name && o.shippingAddress.name.toLowerCase().includes(lowTerm)) ||
                (o.shippingAddress?.email && o.shippingAddress.email.toLowerCase().includes(lowTerm)) ||
                (o.shippingAddress?.phone && o.shippingAddress.phone.toLowerCase().includes(lowTerm))
            );
        }

        // Sorting
        const sorted = [...result];
        sorted.sort((a: any, b: any) => {
            if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortBy === 'amount_high') return (b.totalPrice || 0) - (a.totalPrice || 0);
            if (sortBy === 'amount_low') return (a.totalPrice || 0) - (b.totalPrice || 0);
            return 0;
        });

        return sorted;
    }, [orders, userId, searchTerm, paymentFilter, selectedStatus, paymentChannelFilter, dateFilter, startDate, endDate, sortBy]);

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setPaymentFilter('all');
        setPaymentChannelFilter('all');
        setDateFilter('all');
        setStartDate('');
        setEndDate('');
        setSortBy('newest');
    };

    const hasActiveFilters = 
        searchTerm.trim() !== '' ||
        selectedStatus !== 'all' ||
        paymentFilter !== 'all' ||
        paymentChannelFilter !== 'all' ||
        dateFilter !== 'all' ||
        startDate !== '' ||
        endDate !== '' ||
        sortBy !== 'newest';

    const filteredRevenue = useMemo(() => {
        return filteredOrders.filter((o: any) => o.isPaid).reduce((acc: number, o: any) => acc + (o.totalPrice || 0), 0);
    }, [filteredOrders]);

    const exportToExcel = () => {
        if (filteredOrders.length === 0) return toast.error("No orders to export");
        const headers = ["Order ID", "Customer Name", "Email", "Phone", "Amount (INR)", "Weight", "Paid", "Status", "Payment Method", "Date"];
        const rows = filteredOrders.map(o => [
            `#${o._id.substring(o._id.length - 8)}`,
            `"${(o.shippingAddress?.name || '').replace(/"/g, '""')}"`,
            `"${(o.shippingAddress?.email || '').replace(/"/g, '""')}"`,
            `"${(o.shippingAddress?.phone || '').replace(/"/g, '""')}"`,
            o.totalPrice,
            `"${formatWeight(orderWeight(o))}"`,
            o.isPaid ? 'PAID' : 'UNPAID',
            `"${o.status}"`,
            `"${o.paymentChannel === 'manual' ? `Manual (${o.paymentMethod || 'Manual'})` : 'Razorpay'}"`,
            new Date(o.createdAt).toLocaleDateString('en-IN')
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `Mythris_Orders_${selectedStatus}_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        toast.success(`Exported ${filteredOrders.length} orders to CSV`);
    };

    return (
        <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen rounded-2xl border border-zinc-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-5 sm:pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Orders</h1>
                    <p className="text-xs text-zinc-500 font-medium">View and manage customer orders and fulfillment.</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <Link
                        href="/admin/orders/create-custom"
                        className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-black transition-all shadow-sm"
                    >
                        <Plus size={14} />
                        <span>Create Custom</span>
                    </Link>
                    <Link
                        href="/admin/orders/offline"
                        className="flex items-center gap-1.5 sm:gap-2 bg-white text-zinc-900 border border-zinc-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-zinc-50 transition-all"
                    >
                        <Banknote size={14} />
                        <span>Offline Order</span>
                    </Link>
                    <button onClick={exportToExcel} className="flex items-center gap-1.5 sm:gap-2 bg-zinc-100 text-zinc-900 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-zinc-200 transition-all border border-zinc-200 cursor-pointer">
                        <Download size={14} />
                        <span>Export ({filteredOrders.length})</span>
                    </button>
                </div>
            </div>

            {/* Quick Status Tabs Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                    onClick={() => setSelectedStatus('all')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        selectedStatus === 'all'
                            ? 'bg-zinc-900 text-white shadow-sm'
                            : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200'
                    }`}
                >
                    <span>All Orders</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        selectedStatus === 'all' ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
                    }`}>
                        {orders.length}
                    </span>
                </button>

                {orderStatuses.map((st) => {
                    const count = statusCounts[st] || 0;
                    const isSelected = selectedStatus === st;
                    return (
                        <button
                            key={st}
                            onClick={() => setSelectedStatus(isSelected ? 'all' : st)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                isSelected
                                    ? 'bg-zinc-900 text-white shadow-sm'
                                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200'
                            }`}
                        >
                            <span>{st}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200/80 text-zinc-700'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Primary Search & Filter Bar */}
            <div className="space-y-3">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border border-zinc-200 bg-zinc-50/70 p-2.5 sm:p-3 rounded-2xl">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[240px]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="Search by ID, customer name, email, phone..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="w-full bg-white border border-zinc-200 rounded-xl py-2.5 pl-9 pr-8 text-xs font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all" 
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5 rounded cursor-pointer"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {/* Payment Filter Toggle */}
                        <div className="flex bg-white p-1 rounded-xl border border-zinc-200 shrink-0">
                            {([['all', `All (${orders.length})`], ['paid', `Paid (${paidCount})`], ['unpaid', `Unpaid (${unpaidCount})`]] as const).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setPaymentFilter(key)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                        paymentFilter === key ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* More Filters Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowAdvancedFilters(prev => !prev)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                                showAdvancedFilters || dateFilter !== 'all' || paymentChannelFilter !== 'all'
                                    ? 'bg-amber-500/10 text-amber-900 border-amber-300'
                                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                            }`}
                        >
                            <SlidersHorizontal size={13} className={dateFilter !== 'all' || paymentChannelFilter !== 'all' ? 'text-amber-600' : 'text-zinc-500'} />
                            <span>Filters</span>
                            {(dateFilter !== 'all' || paymentChannelFilter !== 'all') && (
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                            )}
                        </button>

                        {/* Sort By Dropdown */}
                        <div className="relative shrink-0">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 outline-none hover:border-zinc-300 focus:border-zinc-900 cursor-pointer"
                            >
                                <option value="newest">Sort: Newest First</option>
                                <option value="oldest">Sort: Oldest First</option>
                                <option value="amount_high">Amount: High to Low</option>
                                <option value="amount_low">Amount: Low to High</option>
                            </select>
                        </div>
                    </div>

                    {/* Stats & Revenue Pill */}
                    <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-200">
                        <div className="text-[11px] font-bold text-zinc-800 bg-white px-3.5 py-2 rounded-xl border border-zinc-200 shadow-xs flex items-center gap-2">
                            <span className="text-zinc-400 font-normal">Filtered Revenue:</span>
                            <span className="font-mono font-bold text-emerald-700">₹{filteredRevenue.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Advanced Filters Expandable Drawer */}
                <AnimatePresence>
                    {showAdvancedFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-4 shadow-inner">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Date Range Filter */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                                            <Calendar size={12} className="text-zinc-400" />
                                            Order Date Range
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                ['all', 'All Time'],
                                                ['today', 'Today'],
                                                ['last7', 'Last 7 Days'],
                                                ['last30', 'Last 30 Days'],
                                                ['custom', 'Custom'],
                                            ].map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setDateFilter(key as any)}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                                        dateFilter === key
                                                            ? 'bg-zinc-900 text-white'
                                                            : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>

                                        {dateFilter === 'custom' && (
                                            <div className="flex items-center gap-2 pt-1">
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-700 outline-none flex-1"
                                                />
                                                <span className="text-[10px] text-zinc-400">to</span>
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-700 outline-none flex-1"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment Channel Filter */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                                            <CreditCard size={12} className="text-zinc-400" />
                                            Payment Channel
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                ['all', 'All Channels'],
                                                ['razorpay', 'Razorpay (Online)'],
                                                ['manual', 'Manual / Offline'],
                                            ].map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setPaymentChannelFilter(key as any)}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                                        paymentChannelFilter === key
                                                            ? 'bg-zinc-900 text-white'
                                                            : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Reset Button */}
                                    <div className="flex items-end justify-start lg:justify-end">
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            disabled={!hasActiveFilters}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer shadow-2xs"
                                        >
                                            <RotateCcw size={13} />
                                            <span>Reset All Filters</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Active Filter Chips Bar */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Active:</span>

                        {searchTerm && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                                Search: "{searchTerm}"
                                <button type="button" onClick={() => setSearchTerm('')} className="hover:text-rose-600 cursor-pointer">
                                    <X size={11} />
                                </button>
                            </span>
                        )}

                        {selectedStatus !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                                Status: {selectedStatus}
                                <button type="button" onClick={() => setSelectedStatus('all')} className="hover:text-rose-600 cursor-pointer">
                                    <X size={11} />
                                </button>
                            </span>
                        )}

                        {paymentFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                                Payment: {paymentFilter.toUpperCase()}
                                <button type="button" onClick={() => setPaymentFilter('all')} className="hover:text-rose-600 cursor-pointer">
                                    <X size={11} />
                                </button>
                            </span>
                        )}

                        {paymentChannelFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                                Channel: {paymentChannelFilter === 'manual' ? 'Manual / Offline' : 'Razorpay'}
                                <button type="button" onClick={() => setPaymentChannelFilter('all')} className="hover:text-rose-600 cursor-pointer">
                                    <X size={11} />
                                </button>
                            </span>
                        )}

                        {dateFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                                Date: {dateFilter === 'custom' ? `${startDate || 'Start'} to ${endDate || 'End'}` : dateFilter}
                                <button type="button" onClick={() => { setDateFilter('all'); setStartDate(''); setEndDate(''); }} className="hover:text-rose-600 cursor-pointer">
                                    <X size={11} />
                                </button>
                            </span>
                        )}

                        {sortBy !== 'newest' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                                Sort: {sortBy}
                                <button type="button" onClick={() => setSortBy('newest')} className="hover:text-rose-600 cursor-pointer">
                                    <X size={11} />
                                </button>
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline underline-offset-2 ml-1 cursor-pointer"
                        >
                            Clear all
                        </button>

                        <span className="text-[10px] text-zinc-400 font-medium ml-auto">
                            Showing {filteredOrders.length} of {orders.length} orders
                        </span>
                    </div>
                )}
            </div>

            {/* Order Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading && orders.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-200" />
                        <p className="text-[10px] uppercase font-bold text-zinc-300">Loading Orders</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="py-16 px-4 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                            <Filter size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-zinc-800">No matching orders found</h3>
                            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                                No orders match your current filter settings. Try clearing some filters or searching with different terms.
                            </p>
                        </div>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-xs"
                            >
                                <RotateCcw size={13} />
                                <span>Reset All Filters</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[650px]">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Order Info</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4">Weight</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filteredOrders.map((order: any) => (
                                    <tr key={order._id} onClick={() => setInspectedOrder(order)} className="hover:bg-zinc-50/50 transition-all text-xs cursor-pointer group">
                                        <td className="px-6 py-5">
                                            <div className="font-mono font-bold text-zinc-900 uppercase italic leading-none">#{order._id.substring(order._id.length - 8)}</div>
                                            <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-1"><Calendar size={10} /> {new Date(order.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-zinc-900">{order.shippingAddress?.name}</div>
                                            <div className="text-[10px] text-zinc-500 italic mt-0.5">{order.shippingAddress?.email}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase w-fit border ${order.isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                {order.isPaid ? 'Paid' : 'Unpaid'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-bold text-zinc-900 tabular-nums">₹{order.totalPrice.toLocaleString()}</td>
                                        <td className="px-6 py-5">
                                            <span className="text-[11px] font-bold text-zinc-700 tabular-nums">{formatWeight(orderWeight(order)) || "—"}</span>
                                        </td>
                                        <td className="px-6 py-5 text-right"><span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${getStatusStyles(order.status)}`}>{order.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {inspectedOrder && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspectedOrder(null)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2 sm:gap-3">Order #{inspectedOrder._id.substring(inspectedOrder._id.length-8).toUpperCase()}</h2>
                                    <div className="flex items-center gap-2 sm:gap-4 mt-0.5 sm:mt-1 flex-wrap">
                                        <div className="text-[9px] text-zinc-400 font-bold uppercase">Order Details</div>
                                        <div className="text-[9px] text-zinc-500 font-bold uppercase flex items-center gap-1.5 border-l border-zinc-200 pl-2 sm:pl-4">
                                            <Calendar size={10} /> {new Date(inspectedOrder.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setInspectedOrder(null)} className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-400 transition-all"><X size={20} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                                    <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                                        <div className="bg-zinc-50 border border-zinc-100 p-4 sm:p-6 rounded-xl space-y-4 sm:space-y-5">
                                            <h3 className="font-bold text-[10px] uppercase text-zinc-500 tracking-wider flex items-center gap-2"><Hammer size={14} /> Update Order Status</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {orderStatuses.map(status => (
                                                    <button key={status} onClick={() => { if (status === 'Dispatched') { handleActionInitiation(inspectedOrder._id, status, dispatchData.tracking, dispatchData.note); } else { handleActionInitiation(inspectedOrder._id, status); } }} className={`px-3 py-2.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${inspectedOrder.status === status ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 hover:border-zinc-900 hover:text-zinc-900'}`}>{status}</button>
                                                ))}
                                            </div>
                                            <div className="space-y-3 pt-2">
                                                <div className="bg-zinc-100/50 p-4 rounded-xl border border-zinc-200 space-y-3">
                                                    <h4 className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Shipping Details</h4>
                                                    <input type="text" placeholder="Tracking ID (If shipping)" value={dispatchData.tracking} onChange={(e) => setDispatchData(p => ({...p, tracking: e.target.value}))} className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:border-zinc-900 outline-none transition-all" />
                                                    <textarea placeholder="Shipping Notes / Link" value={dispatchData.note} onChange={(e) => setDispatchData(p => ({...p, note: e.target.value}))} className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:border-zinc-900 outline-none transition-all resize-none h-16" />
                                                    <button onClick={() => handleActionInitiation(inspectedOrder._id, inspectedOrder.status !== 'Dispatched' ? 'Dispatched' : inspectedOrder.status, dispatchData.tracking, dispatchData.note)} className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-colors mt-2">Update Shipping Info</button>
                                                </div>
                                            </div>
                                            {(inspectedOrder.trackingNumber || inspectedOrder.deliveryNote) && <div className="p-4 bg-white border border-zinc-200 rounded-xl flex items-start gap-3"><Truck size={16} className="text-zinc-400 mt-0.5" /><div>{inspectedOrder.trackingNumber && <><div className="text-[8px] font-bold text-zinc-400 uppercase">Tracking ID</div><div className="text-xs font-bold font-mono mb-2">{inspectedOrder.trackingNumber}</div></>}{inspectedOrder.deliveryNote && <><div className="text-[8px] font-bold text-zinc-400 uppercase">Note</div><div className="text-[10px] text-zinc-600 italic bg-zinc-50 p-2 border border-zinc-100 rounded mt-1">{inspectedOrder.deliveryNote}</div></>}</div></div>}
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-[10px] uppercase text-zinc-500 px-1">Order Items</h3>
                                            <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                                                <table className="w-full text-left text-[11px]">
                                                    <thead className="bg-zinc-50 border-b border-zinc-100 font-bold text-zinc-400 uppercase text-[8px]">
                                                        <tr><th className="px-6 py-3">Item</th><th className="px-6 py-3 text-center">Qty</th><th className="px-6 py-3 text-right">Weight</th><th className="px-6 py-3 text-right">Total</th></tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-100">
                                                        {inspectedOrder.orderItems.map((item: any, i: number) => (
                                                            <tr key={i}>
<td className="px-6 py-4 flex items-center gap-4">
                                                                     <div className="w-8 h-8 bg-zinc-50 rounded border border-zinc-100 overflow-hidden"><img src={getImageUrl(item.image)} className="w-full h-full object-cover" /></div>
                                                                     <div>
                                                                         <div className="font-bold text-zinc-900">{item.name}</div>
                                                                         {([item.selectedVariant, item.selectedColor, item.selectedPricedOption]).filter(Boolean).length > 0 && (
                                                                             <div className="text-[9px] text-zinc-400 uppercase tracking-wide font-bold mt-0.5">{[item.selectedVariant, item.selectedColor, item.selectedPricedOption].filter(Boolean).join(" · ")}</div>
                                                                         )}
                                                                         {item.customerImage && (
                                                                             <div className="flex items-center gap-1.5 mt-1">
                                                                                 <img src={item.customerImage} alt="Customer photo" className="w-5 h-5 rounded border border-zinc-200 object-cover" />
                                                                                 <span className="text-[9px] text-zinc-400">Customer Photo</span>
                                                                             </div>
                                                                         )}
                                                                     </div>
                                                                 </td>
                                                                <td className="px-6 py-4 text-center font-bold">x{item.qty}</td>
                                                                <td className="px-6 py-4 text-right font-bold tabular-nums">{formatWeight((item.weight || 0) * item.qty) || "—"}</td>
                                                                <td className="px-6 py-4 text-right font-bold">₹{(item.qty * item.price).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="bg-white p-6 rounded-xl border border-zinc-200 space-y-4 shadow-sm">
                                            <h3 className="font-bold text-[10px] uppercase text-zinc-400">Customer Info</h3>
                                            <div>
                                                <div className="text-base font-bold text-zinc-900">{inspectedOrder.shippingAddress?.name}</div>
                                                <div className="text-[10px] text-zinc-400">{inspectedOrder.shippingAddress?.email}</div>
                                                <div className="text-[10px] font-bold mt-1 italic">{inspectedOrder.shippingAddress?.phone}</div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-xl border border-zinc-200 space-y-4 shadow-sm">
                                            <h3 className="font-bold text-[10px] uppercase text-zinc-400">Shipping Address</h3>
                                            <div className="text-[11px] text-zinc-700 bg-zinc-50 p-4 rounded-lg border border-zinc-100 italic">
                                                {inspectedOrder.shippingAddress?.street}, {inspectedOrder.shippingAddress?.city}, {inspectedOrder.shippingAddress?.state} {inspectedOrder.shippingAddress?.zip}
                                            </div>
                                        </div>
                                        <div className="bg-zinc-900 p-6 rounded-xl text-white shadow-xl space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Payment Status</span>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${inspectedOrder.isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{inspectedOrder.isPaid ? 'Paid' : 'Unpaid'}</span>
                                            </div>
                                            <div className="text-2xl font-bold">₹{inspectedOrder.totalPrice.toLocaleString()}</div>
                                            {inspectedOrder.isPaid && (
                                                <div className="space-y-1.5 pt-3 border-t border-white/10 text-[10px]">
                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-zinc-500 font-bold uppercase">Paid on</span>
                                                        <span className="font-bold text-zinc-200 text-right">{inspectedOrder.paidAt ? new Date(inspectedOrder.paidAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-zinc-500 font-bold uppercase">Via</span>
                                                        <span className="font-bold text-zinc-200 text-right">
                                                            {inspectedOrder.paymentChannel === 'manual'
                                                                ? `Manual — ${inspectedOrder.paymentMethod || 'unspecified'}`
                                                                : `Razorpay (${inspectedOrder.paymentChannel || 'gateway'})`}
                                                        </span>
                                                    </div>
                                                    {(inspectedOrder.paymentReference || inspectedOrder.razorpayPaymentId) && (
                                                        <div className="flex justify-between gap-3">
                                                            <span className="text-zinc-500 font-bold uppercase">Reference</span>
                                                            <span className="font-mono font-bold text-zinc-200 text-right break-all">{inspectedOrder.paymentReference || inspectedOrder.razorpayPaymentId}</span>
                                                        </div>
                                                    )}
                                                    {inspectedOrder.markedPaidByName && (
                                                        <div className="flex justify-between gap-3">
                                                            <span className="text-zinc-500 font-bold uppercase">Recorded by</span>
                                                            <span className="font-bold text-amber-300/90 text-right">{inspectedOrder.markedPaidByName}</span>
                                                        </div>
                                                    )}
                                                    {inspectedOrder.paymentNote && (
                                                        <div className="pt-2">
                                                            <span className="text-zinc-500 font-bold uppercase">Note</span>
                                                            <p className="mt-1 text-zinc-300 italic leading-relaxed">{inspectedOrder.paymentNote}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Total Weight</span>
                                                <span className="text-[11px] font-bold text-zinc-200 tabular-nums">{formatWeight(orderWeight(inspectedOrder)) || "—"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3"><button onClick={() => setInspectedOrder(null)} className="px-10 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black transition-all">Close</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Modal isOpen={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} onConfirm={() => { if (pendingAction) handleStatusUpdate(pendingAction.id, pendingAction.status, pendingAction.tracking, pendingAction.deliveryNote); }} type="confirm" title="Update Order Status" message={`Change status for order #${pendingAction?.id.substring(pendingAction?.id.length-8).toUpperCase()} to ${pendingAction?.status}?`} />
        </div>
    );
};

export default OrderManagement;
