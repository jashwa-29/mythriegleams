"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ChevronRight } from "lucide-react";

export type HeroBreadcrumbItem = {
  label: React.ReactNode;
  href?: string;
};

interface BreadcrumbHeroProps {
  items: HeroBreadcrumbItem[];
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  heightClass?: string;
}

export default function BreadcrumbHero({
  items,
  eyebrow,
  title,
  heightClass = "h-[320px] md:h-[380px]",
}: BreadcrumbHeroProps) {
  return (
    <section className={`relative w-full ${heightClass} flex flex-col items-start justify-end overflow-hidden`}>
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-[1.04]"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      />
      {/* Multi-stop dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />
      {/* Warm terracotta tint */}
      <div className="absolute inset-0 bg-[var(--accent)]/10 mix-blend-multiply" />

      {/* Content anchored to bottom-left */}
      <div className="relative z-10 w-full max-w-[1320px] mx-auto px-8 sm:px-12 pb-12 md:pb-16 flex flex-col gap-5">

        {/* Breadcrumb trail */}
        <motion.nav
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          aria-label="Breadcrumb"
          className="flex items-center gap-2 flex-wrap"
        >
          <Link href="/" className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300">
            <Home size={14} />
          </Link>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight size={14} className="text-white/30" />
              {item.href ? (
                <Link href={item.href} className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase hover:text-white transition-all">
                  {item.label}
                </Link>
              ) : (
                <span className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold tracking-[0.2em] uppercase">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </motion.nav>

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          {eyebrow && (
            <span className="text-white/70 text-[10px] font-bold tracking-[0.25em] uppercase mb-4 block">
              {eyebrow}
            </span>
          )}
          <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-tight">
            {title}
          </h1>
        </motion.div>
      </div>
    </section>
  );
}