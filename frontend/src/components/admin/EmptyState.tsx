"use client";

import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
    icon: Icon, 
    title, 
    description, 
    actionLabel, 
    onAction 
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800"
        >
            <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-6 border border-zinc-100 dark:border-zinc-700 shadow-inner">
                <Icon size={40} className="opacity-40" />
            </div>
            
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-serif tracking-tight">
                {title}
            </h3>
            
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed mx-auto font-medium">
                {description}
            </p>

            {actionLabel && (
                <button 
                    onClick={onAction}
                    className="mt-8 flex items-center justify-center gap-2 px-8 py-3.5 bg-zinc-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-zinc-900/20 active:scale-95 transition-all group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    <span>{actionLabel}</span>
                </button>
            )}
        </motion.div>
    );
};

export default EmptyState;
