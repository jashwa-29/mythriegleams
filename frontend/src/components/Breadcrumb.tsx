"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="w-full relative z-40 bg-gradient-to-b from-[#fdfdfb] to-[#fdfdfb]/80 backdrop-blur-md sticky top-0 border-b border-[#e8e4db]/50">
      <nav className="max-w-[1400px] mx-auto px-6 sm:px-12 py-5 flex items-center overflow-x-auto no-scrollbar">
        <ol className="flex items-center space-x-2 sm:space-x-4 min-w-max">
          <motion.li 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center"
          >
            <Link 
              href="/" 
              className="w-9 h-9 rounded-full bg-[#f8f6f3] flex items-center justify-center text-[#8c8273] hover:text-white hover:bg-[#a69076] transition-all duration-300 shadow-sm border border-[#e8e4db]"
              aria-label="Home"
            >
              <Home size={16} />
            </Link>
          </motion.li>

          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: (index + 1) * 0.1 }}
                className="flex items-center space-x-2 sm:space-x-4"
              >
                <ChevronRight size={16} className="text-[#dcd7ce]" />
                {isLast || !item.href ? (
                  <div className="px-5 py-2 rounded-full bg-[#594a3c] text-white text-[11px] font-medium tracking-[0.1em] shadow-md uppercase">
                    {item.label}
                  </div>
                ) : (
                  <Link 
                    href={item.href}
                    className="group relative px-5 py-2 rounded-full bg-[#f8f6f3] text-[#8c8273] text-[11px] font-medium tracking-[0.1em] hover:text-[#594a3c] transition-colors border border-[#e8e4db] uppercase"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-1/2 w-0 h-[2px] bg-[#a69076] transition-all duration-300 group-hover:w-1/2 group-hover:-translate-x-1/2"></span>
                    <span className="absolute -bottom-1 right-1/2 w-0 h-[2px] bg-[#a69076] transition-all duration-300 group-hover:w-1/2 group-hover:translate-x-1/2"></span>
                  </Link>
                )}
              </motion.li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
