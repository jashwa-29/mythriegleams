"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, 
    ShoppingBag, 
    Users, 
    LogOut, 
    Layers, 
    ShieldCheck, 
    Box, 
    Globe, 
    Inbox, 
    Gift,
    Settings,
    X
} from 'lucide-react';
import { useAppDispatch } from '@/redux/hooks';
import { logout } from '@/redux/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen = false, onClose }) => {
    const pathname = usePathname();
    const dispatch = useAppDispatch();

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={16} />, path: '/admin' },
        { name: 'Products', icon: <Box size={16} />, path: '/admin/products' },
        { name: 'Collections', icon: <Layers size={16} />, path: '/admin/collections' },
        { name: 'Occasions', icon: <Gift size={16} />, path: '/admin/occasions' },
        { name: 'Homepage', icon: <Settings size={16} />, path: '/admin/settings' },
        { name: 'Orders', icon: <ShoppingBag size={16} />, path: '/admin/orders' },
        { name: 'Inquiries', icon: <Inbox size={16} />, path: '/admin/inquiries' },
        { name: 'Customers', icon: <Users size={16} />, path: '/admin/customers' },
    ];

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Professional Logo Area */}
            <div className="p-6">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-5">
                    <Link href="/" onClick={onClose} className="flex items-center gap-2.5 group text-zinc-900">
                        <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[var(--accent-gold)] bg-black shadow-sm group-hover:scale-105 transition-transform shrink-0">
                          <Image src="/logo.png" alt="Mythris Gleams" fill sizes="36px" className="object-cover" />
                        </div>
                        <div>
                            <span className="font-bold tracking-tight text-xs uppercase text-zinc-900">Mythris Gleams</span>
                            <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest leading-none mt-0.5 flex items-center gap-1">
                                <ShieldCheck size={8} /> Store Admin
                            </div>
                        </div>
                    </Link>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                            aria-label="Close menu"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Registry */}
            <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto">
                <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-3 mb-2">Main Menu</div>
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link 
                            key={item.name} 
                            href={item.path}
                            onClick={onClose}
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
            <div className="p-4 space-y-1 border-t border-zinc-100 mt-auto">
                <Link href="/" onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900 transition-all font-bold text-[9px] uppercase tracking-widest">
                    <Globe size={14} />
                    <span>View Website</span>
                </Link>
                <button 
                    onClick={() => {
                        if (onClose) onClose();
                        dispatch(logout());
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-all text-left font-bold text-[9px] uppercase tracking-widest"
                >
                    <LogOut size={14} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop persistent sidebar */}
            <aside className="hidden lg:flex w-60 h-screen bg-white text-zinc-600 flex-col border-r border-zinc-200 flex-shrink-0 relative z-40">
                {sidebarContent}
            </aside>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/40 z-50 lg:hidden backdrop-blur-xs"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 250 }}
                            className="fixed top-0 bottom-0 left-0 w-64 bg-white text-zinc-600 flex flex-col border-r border-zinc-200 z-50 lg:hidden shadow-2xl"
                        >
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminSidebar;
