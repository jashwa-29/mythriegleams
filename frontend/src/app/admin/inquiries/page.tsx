"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchInquiries, updateInquiryStatus, deleteInquiry } from '@/redux/slices/inquirySlice';
import { 
    Mail, 
    MessageCircle, 
    Calendar, 
    Loader2,
    CheckCircle2,
    User,
    Phone,
    Image as ImageIcon,
    Clock,
    X,
    Copy,
    Download,
    Paperclip,
    Shield,
    Bell,
    Trash2
} from 'lucide-react';
import { RootState } from '@/redux/store';
import EmptyState from '@/components/admin/EmptyState';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const InquiryManagement = () => {
    const dispatch = useAppDispatch();
    const { inquiries, loading } = useAppSelector((state: RootState) => state.inquiries);
    const [inspectedInquiry, setInspectedInquiry] = useState<any>(null);

    useEffect(() => {
        dispatch(fetchInquiries());
    }, [dispatch]);

    const handleStatusUpdate = (id: string, status: string) => {
        dispatch(updateInquiryStatus({ id, status }));
        toast.success(`Log Updated: ${status}`);
        if (inspectedInquiry && inspectedInquiry._id === id) {
            setInspectedInquiry((prev: any) => ({ ...prev, status }));
        }
    };

    const handleInquiryDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this inquiry forever? This action cannot be undone.")) {
            dispatch(deleteInquiry(id));
            toast.success("Inquiry removed from registry.");
            setInspectedInquiry(null);
        }
    };

    const exportToExcel = () => {
        if (inquiries.length === 0) return toast.error("No logic to export");
        const headers = ["ID", "Name", "Email", "Phone", "Subject", "Status", "Date"];
        const rows = inquiries.map(i => [i._id, i.name, i.email, i.phone, i.subject, i.status, new Date(i.createdAt).toISOString().split('T')[0]]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `Mythris_Inquiries_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        toast.success("Excel Export Initialized");
    };

    const getStatusStyles = (status: string) => {
        switch(status) {
            case 'new': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'responded': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'closed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-zinc-50 text-zinc-400 border-zinc-100';
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Contact Inquiries</h1>
                    <p className="text-xs text-zinc-500 font-medium">Manage and respond to customer messages.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportToExcel} className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-zinc-200 transition-all border border-zinc-200">
                        <Download size={14} />
                        <span>Export Excel</span>
                    </button>
                    <div className="flex bg-zinc-50 border border-zinc-200 rounded-lg p-2 px-4 gap-4 shadow-sm">
                       <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-r border-zinc-200 pr-4">Total: {inquiries.length}</span>
                       <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">New: {inquiries.filter(i => i.status === 'new').length}</span>
                    </div>
                </div>
            </div>

            {/* Communication Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-200" />
                        <p className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest">Loading Logs</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Date / Time</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Subject / Message</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {inquiries.map((inquiry: any) => (
                                    <tr key={inquiry._id} onClick={() => setInspectedInquiry(inquiry)} className="hover:bg-zinc-50/50 transition-all text-xs cursor-pointer group">
                                        <td className="px-6 py-6">
                                            <div className="font-bold text-zinc-900">{new Date(inquiry.createdAt).toLocaleDateString()}</div>
                                            <div className="text-[10px] text-zinc-400 mt-1">{new Date(inquiry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-6 py-6 font-bold text-zinc-900">{inquiry.name} <span className="block text-[10px] text-zinc-400 font-normal">{inquiry.email}</span></td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2 font-bold text-zinc-600"><Paperclip size={12} className="text-zinc-300"/> {inquiry.subject}</div>
                                            <div className="text-[10px] text-zinc-400 line-clamp-1 mt-1 font-medium">"{inquiry.message}"</div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shadow-sm ${getStatusStyles(inquiry.status)}`}>{inquiry.status === 'new' ? 'New' : inquiry.status === 'responded' ? 'Responded' : 'Closed'}</span>
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
                {inspectedInquiry && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspectedInquiry(null)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <div>
                                    <h3 className="font-bold text-zinc-900 flex items-center gap-2">Inquiry Details</h3>
                                    <div className="text-[9px] text-zinc-400 font-bold uppercase mt-1 flex items-center gap-1.5 line-clamp-1">
                                        <Calendar size={10}/> {new Date(inspectedInquiry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} at {new Date(inspectedInquiry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <button onClick={() => setInspectedInquiry(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-xl font-bold text-zinc-900">{inspectedInquiry.name}</div>
                                            <div className="text-xs text-zinc-500 font-medium">{inspectedInquiry.email}</div>
                                            <div className="text-[10px] font-mono font-bold text-zinc-400 mt-1 uppercase tracking-tighter italic">{inspectedInquiry.phone || "No phone number"}</div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase border ${getStatusStyles(inspectedInquiry.status)}`}>{inspectedInquiry.status === 'new' ? 'New' : inspectedInquiry.status === 'responded' ? 'Responded' : 'Closed'}</span>
                                    </div>
                                    <div className="p-5 bg-zinc-50 border border-zinc-100 rounded-xl space-y-3 shadow-inner">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest"><MessageCircle size={12}/> Subject: {inspectedInquiry.subject}</div>
                                        <p className="text-sm font-medium text-zinc-700 leading-relaxed italic border-l-2 border-zinc-200 pl-4">"{inspectedInquiry.message}"</p>
                                        {inspectedInquiry.image && (
                                            <div className="mt-4 pt-4 border-t border-zinc-100">
                                                <div className="text-[8px] font-bold text-zinc-300 uppercase tracking-[0.2em] mb-3">Attached Image</div>
                                                <a href={inspectedInquiry.image} target="_blank" className="block w-full h-48 rounded-lg overflow-hidden border border-zinc-200 bg-white group hover:border-zinc-900 transition-all">
                                                    <img src={inspectedInquiry.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleStatusUpdate(inspectedInquiry._id, 'responded')} className="py-2.5 rounded-lg border border-zinc-200 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-50 hover:text-amber-600 transition-all">Mark Responded</button>
                                    <button onClick={() => handleStatusUpdate(inspectedInquiry._id, 'closed')} className="py-2.5 rounded-lg border border-zinc-200 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all">Close Inquiry</button>
                                </div>
                            </div>
                            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
                                <button onClick={() => handleInquiryDelete(inspectedInquiry._id)} className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-rose-100 flex items-center gap-2 mr-auto"><Trash2 size={14}/> Delete</button>
                                <a href={`mailto:${inspectedInquiry.email}`} className="px-6 py-2.5 bg-zinc-200 text-zinc-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-zinc-300 flex items-center gap-2"><Mail size={14}/> Reply (Email)</a>
                                <button onClick={() => setInspectedInquiry(null)} className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black">Close</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InquiryManagement;
