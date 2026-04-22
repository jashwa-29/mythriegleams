"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import React from 'react';

type ModalType = 'success' | 'error' | 'confirm' | 'info';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string;
    type?: ModalType;
    confirmText?: string;
    cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    type = 'info',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 40 }}
                        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] overflow-hidden border border-black/5"
                    >
                        {/* Status bar */}
                        <div className={`h-2 w-full ${
                            type === 'success' ? 'bg-emerald-500' : 
                            type === 'error' ? 'bg-rose-500' : 
                            type === 'confirm' ? 'bg-zinc-900' : 'bg-gold'
                        }`} />

                        <div className="p-10">
                            <div className="flex flex-col items-center text-center gap-6">
                                <div className={`p-5 rounded-[2rem] ${
                                    type === 'success' ? 'bg-emerald-50 text-emerald-500' : 
                                    type === 'error' ? 'bg-rose-50 text-rose-500' : 
                                    type === 'confirm' ? 'bg-zinc-50 text-zinc-900' : 
                                    'bg-zinc-50 text-gold'
                                }`}>
                                    {type === 'success' && <CheckCircle2 size={42} strokeWidth={1.5} />}
                                    {type === 'error' && <AlertCircle size={42} strokeWidth={1.5} />}
                                    {type === 'confirm' && <HelpCircle size={42} strokeWidth={1.5} />}
                                    {type === 'info' && <CheckCircle2 size={42} strokeWidth={1.5} />}
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black font-serif italic text-zinc-900 tracking-tight leading-tight">{title}</h3>
                                    <p className="text-zinc-600 font-medium leading-relaxed italic px-4">
                                        {message}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                                {type === 'confirm' && (
                                    <button 
                                        onClick={onClose}
                                        className="w-full sm:w-auto px-10 py-5 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                                    >
                                        {cancelText}
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => { 
                                        if (type === 'confirm') onConfirm?.();
                                        onClose(); 
                                    }}
                                    className={`w-full sm:w-auto px-12 py-5 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 ${
                                        type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600' : 
                                        type === 'error' ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600' : 
                                        type === 'confirm' ? 'bg-zinc-900 text-white shadow-zinc-900/20 hover:bg-black' : 
                                        'bg-gold text-white shadow-gold/20 hover:bg-gold/90'
                                    }`}
                                >
                                    {type === 'confirm' ? (confirmText) : type === 'success' ? "Acknowledged" : "Close Portal"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
