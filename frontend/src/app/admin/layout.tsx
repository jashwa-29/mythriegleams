"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAppSelector } from '@/redux/hooks';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { motion } from 'framer-motion';
import { Menu, ShieldCheck, Globe } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { userInfo } = useAppSelector((state) => state.auth);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
        if (!pathname.includes('/admin/login') && (!userInfo || userInfo.role !== 'admin')) {
            router.push('/admin/login');
        }
    }, [userInfo, router, pathname]);

    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    if (!mounted) {
        return null; 
    }

    // Bypass layout completely for the login page
    if (pathname.includes('/admin/login')) {
        return <>{children}</>;
    }

    if (!userInfo || userInfo.role !== 'admin') {
        return null;
    }

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 text-zinc-900 overflow-hidden">
            {/* Mobile Top Navigation Header */}
            <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 z-30 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-1 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="relative w-7 h-7 rounded-full overflow-hidden border border-[var(--accent-gold)] bg-black shadow-xs shrink-0">
                            <Image src="/logo.png" alt="Logo" fill sizes="28px" className="object-cover" />
                        </div>
                        <div>
                            <span className="font-bold text-xs uppercase tracking-tight text-zinc-900 leading-tight block">Mythris Admin</span>
                            <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest leading-none flex items-center gap-0.5">
                                <ShieldCheck size={8} /> Active
                            </span>
                        </div>
                    </div>
                </div>

                <Link
                    href="/"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                    <Globe size={12} />
                    <span>Store</span>
                </Link>
            </header>

            {/* Sidebar (Desktop Persistent + Mobile Drawer) */}
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-12 scroll-smooth">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
}
