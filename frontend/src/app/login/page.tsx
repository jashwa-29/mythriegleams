"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowLeft, AlertCircle, UserPlus, LogIn, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { login, registerUser, resetAuthError } from '@/redux/slices/authSlice';
import Link from 'next/link';

// Validation Schemas
const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password too short"),
});

const signupSchema = z.object({
    name: z.string().min(2, "Name required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be 6+ chars"),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const dispatch = useAppDispatch();
    const { userInfo, loading, error } = useAppSelector((state) => state.auth);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isRegistering, setIsRegistering] = useState(false);
    const redirect = searchParams.get('redirect');

    const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
    const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

    useEffect(() => {
        if (userInfo) {
            if (userInfo.role === 'admin') {
                router.push('/admin');
            } else if (isRegistering) {
                router.push(`/account/profile?redirect=${redirect || '/'}`);
            } else {
                router.push(redirect || '/');
            }
        }
    }, [userInfo, router, redirect, isRegistering]);

    useEffect(() => {
        dispatch(resetAuthError());
    }, [isLogin, dispatch]);

    const onLoginSubmit = (data: LoginForm) => {
        setIsRegistering(false);
        dispatch(login(data));
    };
    const onSignupSubmit = (data: SignupForm) => {
        setIsRegistering(true);
        dispatch(registerUser(data));
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent">
            {/* Back Button */}
            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">
                <ArrowLeft size={16} />
                <span>Return to Shop</span>
            </Link>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Brand Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 text-gold shadow-2xl mb-6 shadow-gold/20">
                        <span className="text-2xl font-bold font-serif italic">M</span>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-zinc-200/50 p-12 border border-zinc-100 flex flex-col items-center">
                    {/* Mode Toggle */}
                    <div className="flex bg-zinc-50 p-1.5 rounded-2xl mb-10 w-full">
                        <button 
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isLogin ? 'bg-white text-zinc-900 shadow-lg shadow-black/5' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            <LogIn size={16} /> Sign In
                        </button>
                        <button 
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${!isLogin ? 'bg-white text-zinc-900 shadow-lg shadow-black/5' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            <UserPlus size={16} /> Sign Up
                        </button>
                    </div>

                    {/* Shared Error Alert */}
                    {error && (
                        <div className="w-full mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {isLogin ? (
                            <motion.form 
                                key="login"
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                                className="w-full space-y-6"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Email Connection</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-gold transition-colors" size={18} />
                                            <input {...loginForm.register('email')} type="email" placeholder="email@address.com" className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-zinc-900 text-sm focus:ring-2 focus:ring-gold/20 transition-all outline-none font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Credentials</label>
                                            <Link href="#" className="text-[9px] font-black text-zinc-300 hover:text-gold transition-colors underline underline-offset-4 decoration-zinc-100">FORGOT?</Link>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-gold transition-colors" size={18} />
                                            <input {...loginForm.register('password')} type="password" placeholder="••••••••" className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-zinc-900 text-sm focus:ring-2 focus:ring-gold/20 transition-all outline-none font-medium" />
                                        </div>
                                    </div>
                                </div>
                                <button disabled={loading} type="submit" className="w-full bg-zinc-900 hover:bg-black text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-zinc-900/20 active:scale-95 flex items-center justify-center uppercase tracking-widest text-xs">
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In Securely"}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form 
                                key="signup"
                                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                                onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                                className="w-full space-y-6"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Full Identity</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-gold transition-colors" size={18} />
                                            <input {...signupForm.register('name')} type="text" placeholder="Uma Gayathri" className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-zinc-900 text-sm focus:ring-2 focus:ring-gold/20 transition-all outline-none font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-gold transition-colors" size={18} />
                                            <input {...signupForm.register('email')} type="email" placeholder="email@address.com" className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-zinc-900 text-sm focus:ring-2 focus:ring-gold/20 transition-all outline-none font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Security Key</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-gold transition-colors" size={18} />
                                            <input {...signupForm.register('password')} type="password" placeholder="••••••••" className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-zinc-900 text-sm focus:ring-2 focus:ring-gold/20 transition-all outline-none font-medium" />
                                        </div>
                                    </div>
                                </div>
                                <button disabled={loading} type="submit" className="w-full bg-zinc-900 hover:bg-black text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-zinc-900/20 active:scale-95 flex items-center justify-center uppercase tracking-widest text-xs">
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Join the Community"}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
