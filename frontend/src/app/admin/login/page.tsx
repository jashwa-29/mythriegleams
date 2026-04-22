"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, ShieldCheck, ArrowRight, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { login, resetAuthError } from '@/redux/slices/authSlice';
import Link from 'next/link';

const adminLoginSchema = z.object({
    email: z.string().email("Authorized email required"),
    password: z.string().min(6, "Credentials security minimum not met"),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

const AdminLoginPage = () => {
    const dispatch = useAppDispatch();
    const { userInfo, loading, error } = useAppSelector((state) => state.auth);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginForm>({
        resolver: zodResolver(adminLoginSchema),
    });

    useEffect(() => {
        if (userInfo && userInfo.role === 'admin') {
            router.push('/admin');
        }
    }, [userInfo, router]);

    useEffect(() => {
        dispatch(resetAuthError());
    }, [dispatch]);

    const onSubmit = (data: AdminLoginForm) => {
        dispatch(login(data));
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm"
            >
                {/* Precise Security Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-zinc-900 text-white shadow-xl shadow-zinc-900/10 mb-6">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight uppercase">Administrative Hub</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-2">Logistics Gateway Authorization</p>
                </div>

                {/* Login Terminal */}
                <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 animate-shake">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5">Personnel Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" size={16} />
                                <input 
                                    {...register('email')}
                                    type="email" 
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3.5 pl-11 pr-4 text-zinc-900 text-xs focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all outline-none font-medium placeholder:text-zinc-300"
                                    placeholder="Enter encrypted email"
                                />
                            </div>
                            {errors.email && <p className="text-[9px] text-rose-500 ml-0.5 font-bold uppercase tracking-wider">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-0.5">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Security Phrase</label>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" size={16} />
                                <input 
                                    {...register('password')}
                                    type="password" 
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3.5 pl-11 pr-4 text-zinc-900 text-xs focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all outline-none font-medium placeholder:text-zinc-300"
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && <p className="text-[9px] text-rose-500 ml-0.5 font-bold uppercase tracking-wider">{errors.password.message}</p>}
                        </div>

                        <button 
                            disabled={loading}
                            type="submit" 
                            className="w-full bg-zinc-900 hover:bg-black text-white font-bold uppercase tracking-[0.2em] text-[10px] py-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10 active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : (
                                <>
                                    <span>Validate Personnel</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 transition-all border-b border-zinc-200 pb-1">
                        ← Exit Administrative Environment
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLoginPage;
