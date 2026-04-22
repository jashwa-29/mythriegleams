"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, 
    ShoppingBag, 
    Users, 
    MessageSquare, 
    LogOut, 
    Package,
    ArrowLeft,
    Layers,
    ShieldCheck,
    Box,
    Globe,
    Inbox
} from 'lucide-react';
import { useAppDispatch } from '@/redux/hooks';
import { logout } from '@/redux/slices/authSlice';

const AdminSidebar = () => {
    const pathname = usePathname();
    const dispatch = useAppDispatch();

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={16} />, path: '/admin' },
        { name: 'Products', icon: <Box size={16} />, path: '/admin/products' },
        { name: 'Collections', icon: <Layers size={16} />, path: '/admin/collections' },
        { name: 'Orders', icon: <ShoppingBag size={16} />, path: '/admin/orders' },
        { name: 'Inquiries', icon: <Inbox size={16} />, path: '/admin/inquiries' },
        { name: 'Customers', icon: <Users size={16} />, path: '/admin/customers' },
    ];

    return (
        <aside className="w-60 h-screen bg-white text-zinc-600 flex flex-col border-r border-zinc-200 flex-shrink-0 relative z-50">
            {/* Professional Logo Area */}
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2 group text-zinc-900 border-b border-zinc-100 pb-5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-bold shadow-md shadow-zinc-900/10 group-hover:scale-105 transition-transform">MG</div>
                    <div>
                        <span className="font-bold tracking-tight text-xs uppercase">Store Admin</span>
                        <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest leading-none mt-0.5 flex items-center gap-1">
                            <ShieldCheck size={8} /> Authorized
                        </div>
                    </div>
                </Link>
            </div>

            {/* Navigation Registry */}
            <nav className="flex-1 px-3 space-y-1 mt-4">
                <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-3 mb-2">Main Menu</div>
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link 
                            key={item.name} 
                            href={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${
                                isActive 
                                    ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/10 font-bold' 
                                    : 'hover:bg-zinc-50 hover:text-zinc-900 text-zinc-500 font-medium'
                            }`}
                        >
                            <span className={`${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-900'} transition-colors`}>{item.icon}</span>
                            <span className="text-[10px] uppercase tracking-[0.1em]">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Protocols Footer */}
            <div className="p-4 space-y-1 border-t border-zinc-100">
                <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900 transition-all font-bold text-[9px] uppercase tracking-widest">
                    <Globe size={14} />
                    <span>View Website</span>
                </Link>
                <button 
                    onClick={() => dispatch(logout())}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-all text-left font-bold text-[9px] uppercase tracking-widest"
                >
                    <LogOut size={14} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
