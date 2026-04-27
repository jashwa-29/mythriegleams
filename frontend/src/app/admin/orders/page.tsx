"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useSearchParams } from 'next/navigation';
import { fetchOrders, updateOrderStatus, resetOrderSuccess } from '@/redux/slices/orderSlice';
import { 
    ShoppingBag, 
    Search,
    Loader2,
    Calendar,
    User,
    Package,
    ShieldCheck,
    Hammer,
    X,
    MapPin,
    Copy,
    Hash,
    Download,
    CircleDollarSign,
    Zap,
    Truck,
    Clock,
    MoreHorizontal
} from 'lucide-react';
import { RootState } from '@/redux/store';
import Modal from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const OrderManagement = () => {
    const dispatch = useAppDispatch();
    const { orders, loading, success, error } = useAppSelector((state: RootState) => state.orders);
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    
    // UI State
    const [searchTerm, setSearchTerm] = useState("");
    const [inspectedOrder, setInspectedOrder] = useState<any>(null);
    const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
    const [dispatchData, setDispatchData] = useState({ tracking: '', note: '' });

    // Feedback Modals
    const [pendingAction, setPendingAction] = useState<{id: string, status: string, tracking?: string, deliveryNote?: string} | null>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchOrders({ includeUnpaid: false }));
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

    const exportToExcel = () => {
        if (orders.length === 0) return toast.error("No orders to export");
        const headers = ["Order ID", "Customer", "Email", "Amount", "Paid", "Status", "Date"];
        const rows = orders.map(o => [o._id, o.shippingAddress?.name, o.shippingAddress?.email, o.totalPrice, o.isPaid ? 'YES' : 'NO', o.status, new Date(o.createdAt).toISOString().split('T')[0]]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `Mythris_Orders_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        toast.success("Excel Export Initialized");
    };

    const orderStatuses = ['Pending', 'Handcrafting', 'Quality Check', 'Dispatched', 'Delivered', 'Cancelled'];

    const getStatusStyles = (status: string) => {
        switch(status) {
            case 'Pending': return 'bg-amber-100/50 text-amber-700 border-amber-200';
            case 'Handcrafting': return 'bg-zinc-100 text-zinc-900 border-zinc-200 font-bold';
            case 'Quality Check': return 'bg-blue-100/50 text-blue-700 border-blue-200';
            case 'Dispatched': return 'bg-indigo-100/50 text-indigo-700 border-indigo-200';
            case 'Delivered': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200';
            case 'Cancelled': return 'bg-rose-100/50 text-rose-700 border-rose-200';
            default: return 'bg-zinc-50 text-zinc-500 border-zinc-100';
        }
    };

    const filteredOrders = useMemo(() => {
        let result = userId ? orders.filter((o: any) => o.user === userId || o.user?._id === userId) : orders;
        result = result.filter((o: any) => o.isPaid); // Only show paid orders

        if (searchTerm) {
            const lowTerm = searchTerm.toLowerCase();
            result = result.filter((o: any) => 
                o._id.toLowerCase().includes(lowTerm) ||
                o.razorpayOrderId?.toLowerCase().includes(lowTerm) ||
                o.shippingAddress?.name?.toLowerCase().includes(lowTerm) ||
                o.shippingAddress?.email?.toLowerCase().includes(lowTerm)
            );
        }
        return result;
    }, [orders, userId, searchTerm]);

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
            {/* Professional Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Orders</h1>
                    <p className="text-xs text-zinc-500 font-medium">View and manage customer orders and fulfillment.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportToExcel} className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-zinc-200 transition-all border border-zinc-200">
                        <Download size={14} />
                        <span>Export Excel</span>
                    </button>
                    <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                        <button className="bg-zinc-900 text-white shadow-sm px-4 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all">Paid Only</button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 border border-zinc-200 bg-zinc-50/50 p-2 rounded-xl">
                <div className="relative w-full xl:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input type="text" placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:border-zinc-900 outline-none transition-all" />
                </div>
                <div className="text-[10px] font-bold text-zinc-900 bg-white px-4 py-2 rounded-lg border border-zinc-200">Total Revenue: ₹{orders.filter(o => o.isPaid).reduce((acc, o) => acc + o.totalPrice, 0).toLocaleString()}</div>
            </div>

            {/* Order Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading && orders.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3"><Loader2 className="w-6 h-6 animate-spin text-zinc-200" /><p className="text-[10px] uppercase font-bold text-zinc-300">Loading Orders</p></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Order Info</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Total</th>
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
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspectedOrder(null)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="px-8 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <div>
                                    <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-3">Order Details: #{inspectedOrder._id.substring(inspectedOrder._id.length-8).toUpperCase()}</h2>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="text-[9px] text-zinc-400 font-bold uppercase">Manage this order</div>
                                        <div className="text-[9px] text-zinc-500 font-bold uppercase flex items-center gap-1.5 border-l border-zinc-200 pl-4">
                                            <Calendar size={10} /> {new Date(inspectedOrder.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setInspectedOrder(null)} className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-400 transition-all"><X size={20} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-xl space-y-5">
                                            <h3 className="font-bold text-[10px] uppercase text-zinc-500 tracking-wider flex items-center gap-2"><Hammer size={14} /> Update Order Status</h3>
                                            <div className="grid grid-cols-3 gap-2">
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
                                                        <tr><th className="px-6 py-3">Item</th><th className="px-6 py-3 text-center">Qty</th><th className="px-6 py-3 text-right">Total</th></tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-100">
                                                        {inspectedOrder.orderItems.map((item: any, i: number) => (
                                                            <tr key={i}>
                                                                <td className="px-6 py-4 flex items-center gap-4">
                                                                    <div className="w-8 h-8 bg-zinc-50 rounded border border-zinc-100 overflow-hidden"><img src={item.image} className="w-full h-full object-cover" /></div>
                                                                    <div className="font-bold text-zinc-900">{item.name}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-center font-bold">x{item.qty}</td>
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
