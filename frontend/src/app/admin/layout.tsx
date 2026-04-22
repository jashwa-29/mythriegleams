"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/redux/hooks';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { motion } from 'framer-motion';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = React.useState(false);
    const { userInfo } = useAppSelector((state) => state.auth);
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
        setMounted(true);
        if (!pathname.includes('/admin/login') && (!userInfo || userInfo.role !== 'admin')) {
            router.push('/admin/login');
        }
    }, [userInfo, router, pathname]);

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
        <div className="flex h-screen bg-zinc-50 text-zinc-900 overflow-hidden">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto px-12 py-12 scroll-smooth">
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
