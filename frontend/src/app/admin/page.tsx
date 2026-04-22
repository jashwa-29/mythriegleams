"use client";

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchOrders } from '@/redux/slices/orderSlice';
import { fetchProducts } from '@/redux/slices/productSlice';
import { 
    ShoppingBag, 
    TrendingUp, 
    Package, 
    ArrowUpRight,
    Loader2,
    Users,
    Activity,
    Clock,
    DollarSign,
    Box,
    ChevronRight,
    ChevronLeft,
    Calendar
} from 'lucide-react';
import Link from 'next/link';

const AdminDashboard = () => {
    const dispatch = useAppDispatch();
    const { orders, loading: ordersLoading } = useAppSelector((state: any) => state.orders);
    const { products, loading: productsLoading } = useAppSelector((state: any) => state.products);

    useEffect(() => {
        dispatch(fetchOrders());
        dispatch(fetchProducts({}));
    }, [dispatch]);

    const paidOrders = orders.filter((o: any) => o.isPaid);
    const totalRevenue = paidOrders.reduce((acc: number, order: any) => acc + order.totalPrice, 0);
    const pendingOrders = orders.filter((o: any) => o.status === 'Pending').length;
    const completedOrders = orders.filter((o: any) => o.status === 'Delivered').length;

    const stats = [
        { name: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: <DollarSign size={16} />, color: 'emerald' },
        { name: 'Total Orders', value: orders.length, icon: <ShoppingBag size={16} />, color: 'blue' },
        { name: 'Pending Orders', value: pendingOrders, icon: <Clock size={16} />, color: 'amber' },
        { name: 'Total Products', value: products.length, icon: <Box size={16} />, color: 'zinc' },
    ];

    if (ordersLoading || productsLoading) {
        return (
            <div className="flex h-[70vh] items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-900 opacity-20" />
                    <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Loading Data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8 bg-white min-h-screen">
            {/* Header Area */}
            <div className="flex justify-between items-center border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-xs text-zinc-500 font-medium">Monitor your store's performance and manage various sections.</p>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> System Active
                </div>
            </div>

            {/* Performance Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.name} className="p-6 bg-white rounded-xl border border-zinc-200 hover:border-zinc-900 transition-all shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400">
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">{stat.name}</p>
                                <h2 className="text-xl font-bold text-zinc-900 tabular-nums">{stat.value}</h2>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Critical Activity & Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Logistics Registry */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="font-bold text-[10px] uppercase text-zinc-900 tracking-widest flex items-center gap-2">
                            <Activity size={14} className="text-zinc-400" /> Recent Orders
                        </h3>
                        <Link href="/admin/orders" className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest transition-colors flex items-center gap-2">
                            View All <ArrowUpRight size={14} />
                        </Link>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest">
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Total Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {orders.slice(0, 8).map((order: any) => (
                                    <tr key={order._id} className="hover:bg-zinc-50/50 transition-colors cursor-default">
                                        <td className="px-6 py-4 font-mono text-[9px] text-zinc-400 uppercase tracking-tighter">#{order._id.substring(order._id.length - 8).toUpperCase()}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-zinc-900 text-[11px]">{order.shippingAddress?.name || 'Guest'}</div>
                                            <div className="text-[9px] text-zinc-500 font-bold flex items-center gap-1.5 mt-0.5">
                                                <Calendar size={10} className="text-zinc-300" /> {new Date(order.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                                                order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                order.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-zinc-100 text-zinc-600 border-zinc-200'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-[11px] text-zinc-900 tabular-nums">₹{order.totalPrice.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Control Nodes */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-bold text-[10px] uppercase text-zinc-900 tracking-widest flex items-center gap-2 px-1">
                            <Box size={14} className="text-zinc-400" /> Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { name: 'Products', href: '/admin/products', icon: <Package size={14}/>, desc: 'Manage products' },
                                { name: 'Users', href: '/admin/users', icon: <Users size={14}/>, desc: 'Manage user accounts' }
                            ].map((nav) => (
                                <Link key={nav.name} href={nav.href} className="flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-900 transition-all group">
                                    <div className="w-10 h-10 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                                        {nav.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">{nav.name}</div>
                                        <div className="text-[9px] text-zinc-400 font-medium">{nav.desc}</div>
                                    </div>
                                    <ChevronRight className="text-zinc-300 group-hover:text-zinc-900 transition-colors" size={14} />
                                </Link>
                            ))}
                        </div>
                    </div>

               
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
