"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Hexagon, ChevronDown, ShoppingBag } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCollections } from "@/redux/slices/collectionSlice";
import { RootState } from "@/redux/store";
import { useCart } from "@/hooks/useCart";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const dispatch = useAppDispatch();
  const { collections } = useAppSelector((s: RootState) => s.collections);
  const { totalItems, open } = useCart();

  useEffect(() => {
    dispatch(fetchCollections());
    
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dispatch]);

  const staticLinks = [
    { label: "Best Sellers", href: "/#products" },
    { label: "Custom Order", href: "/#custom" },
    { label: "Bulk Orders", href: "/#bulk" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[100] w-full pointer-events-auto transition-all duration-500 ease-in-out flex items-center justify-between ${
        scrolled 
          ? "px-6 py-4 md:px-10 md:py-4 bg-[#b46a36]/95 backdrop-blur-md shadow-xl border-b border-white/10" 
          : "px-8 py-8 md:px-12 md:py-10 bg-transparent"
      }`}
    >
      
      {/* ── Brand Mythrie ── */}
      <Link href="/" className="flex items-center gap-3 text-white">
        <Hexagon size={32} fill="white" strokeWidth={1} />
        <span className="font-sans text-[13px] font-semibold tracking-[0.2em] uppercase">
          Mythrie
        </span>
      </Link>

      {/* ── Desktop Nav ── */}
      <nav className="hidden lg:flex items-center gap-8">
        
        {/* Collections Dropdown */}
        <div className="relative group py-2">
          <button className="flex items-center gap-2 text-[12px] font-medium tracking-[0.15em] uppercase text-white hover:opacity-70 transition-opacity">
            Collections
            <ChevronDown size={14} strokeWidth={2} className="group-hover:rotate-180 transition-transform duration-300" />
          </button>

          {/* Dropdown Menu */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible translate-y-3 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300">
            <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-2 min-w-[200px] flex flex-col">
              <Link 
                href="/category/all" 
                className="px-4 py-3 text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--text)] hover:bg-[#b46a36]/10 hover:text-[#b46a36] rounded-lg transition-colors border-b border-[var(--bg-muted)]"
              >
                All Collections
              </Link>
              {collections?.map((cat: any) => (
                <Link 
                  key={cat.slug} 
                  href={`/category/${cat.slug}`} 
                  className="px-4 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[var(--text-muted)] hover:bg-[#b46a36]/10 hover:text-[#b46a36] rounded-lg transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Static Links */}
        {staticLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-[12px] font-medium tracking-[0.15em] uppercase text-white hover:opacity-70 transition-opacity py-2"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* ── Right Action ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={open}
          className={`relative rounded-full border flex items-center justify-center text-white hover:bg-white hover:text-[#b46a36] transition-all duration-300 ${
            scrolled ? "w-9 h-9 border-white/30" : "w-10 h-10 border-white/50 bg-white/10"
          }`}
        >
          <ShoppingBag size={16} strokeWidth={1.5} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-[#b46a36] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md">
              {totalItems}
            </span>
          )}
        </button>

        <Link
          href="/account"
          className={`rounded-full border flex items-center justify-center text-white hover:bg-white hover:text-[#b46a36] transition-all duration-300 ${
            scrolled ? "w-9 h-9 border-white/30" : "w-10 h-10 border-white/50 bg-white/10"
          }`}
        >
          <User size={16} strokeWidth={1.5} />
        </Link>
      </div>
      
    </header>
  );
}
