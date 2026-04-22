"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchUsers } from '@/redux/slices/userSlice';
import { 
    Users, 
    Mail, 
    Calendar, 
    Loader2,
    CheckCircle2,
    Activity,
    User,
    Download,
    X,
    Phone,
    MapPin,
    ShoppingBag,
    Clock,
    Shield
} from 'lucide-react';
import { RootState } from '@/redux/store';
import EmptyState from '@/components/admin/EmptyState';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerManagement = () => {
    const dispatch = useAppDispatch();
    const { users, loading } = useAppSelector((state: RootState) => state.users);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Filter to only show actual customers
    const customers = users.filter((u: any) => u.role === 'user');

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    const exportToExcel = () => {
        if (customers.length === 0) return toast.error("No data available to export");
        
        const headers = ["ID", "Name", "Email", "Role", "Joined Date"];
        const rows = customers.map((u: any) => [
            u._id,
            u.name,
            u.email,
            u.role,
            new Date(u.createdAt).toLocaleDateString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Mythris_Patrons_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Excel Export Initialized");
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
            {/* Professional Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Customer Directory</h1>
                    <p className="text-xs text-zinc-500 font-medium">Click any row to audit detailed member profile and history.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={exportToExcel}
                        className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-black transition-all shadow-md active:scale-95"
                    >
                        <Download size={14} />
                        <span>Export Excel</span>
                    </button>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-4 py-2.5 rounded-lg border border-zinc-200">
                        Total: {customers.length}
                    </div>
                </div>
            </div>

            {/* Customers Data Registry */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-200" />
                        <p className="text-[10px] font-bold tracking-widest text-zinc-300 uppercase">Synchronizing Records</p>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="p-10 text-center">
                        <EmptyState 
                            icon={Users}
                            title="No Customers Found"
                            description="The registry currently contains no member data."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Customer Identity</th>
                                    <th className="px-6 py-4">Email Address</th>
                                    <th className="px-6 py-4 text-center">Access Level</th>
                                    <th className="px-6 py-4 text-right">Enrollment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {customers.map((user: any) => (
                                    <tr 
                                        key={user._id} 
                                        onClick={() => setSelectedUser(user)}
                                        className="hover:bg-zinc-50/50 transition-all text-xs cursor-pointer group"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-9 h-9 rounded bg-zinc-100 flex items-center justify-center text-zinc-500 border border-zinc-200 font-bold group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                                                    {user.name?.charAt(0) || <User size={16} />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-zinc-900">{user.name}</div>
                                                    <div className="text-[9px] text-zinc-400 font-mono">UID: {user._id.substring(user._id.length-8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-zinc-500 font-medium">
                                                <Mail size={12} className="text-zinc-300" />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                                user.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-zinc-50 text-zinc-400 border-zinc-100'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right text-zinc-400 font-medium tabular-nums">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden"
                        >
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                    <User size={18} /> Profile Intelligence
                                </h3>
                                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-400 transition-all"><X size={20} /></button>
                            </div>
                            
                            <div className="p-8 space-y-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                                        {selectedUser.name[0]}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xl font-bold text-zinc-900">{selectedUser.name}</div>
                                        <div className="text-xs text-zinc-500 font-medium flex items-center gap-2">
                                            <Mail size={12} /> {selectedUser.email}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <Shield size={10} /> Role Access
                                        </div>
                                        <div className="text-xs font-bold text-zinc-900 uppercase">{selectedUser.role}</div>
                                    </div>
                                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock size={10} /> Account Age
                                        </div>
                                        <div className="text-xs font-bold text-zinc-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Node Logistics</h4>
                                    <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                                                <Phone size={16} />
                                            </div>
                                            <div>
                                                <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Contact Terminal</div>
                                                <div className="text-xs font-bold text-zinc-900 font-mono tracking-tighter">{selectedUser.phone || "UNVERIFIED"}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                                                <ShoppingBag size={16} />
                                            </div>
                                            <div>
                                                <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Transaction History</div>
                                                <div className="text-xs font-bold text-zinc-900">{selectedUser.orderCount || 0} Artifacts Ordered</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-end">
                                <button onClick={() => setSelectedUser(null)} className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black transition-all">Close Entry</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomerManagement;
