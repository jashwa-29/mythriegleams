"use client";

import React, { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchProducts } from "@/redux/slices/productSlice";
import { fetchOccasions } from "@/redux/slices/occasionSlice";
import { RootState } from "@/redux/store";
import { getImageUrl } from "@/utils/getImageUrl";
import { Loader2, Filter, LayoutGrid, List, Leaf, Home, ChevronRight } from "lucide-react";
import { Product } from "@/data/products";
import { motion, AnimatePresence } from "framer-motion";

export default function OccasionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const dispatch = useAppDispatch();

  const { occasions } = useAppSelector((state: RootState) => state.occasions);
  const { products, loading } = useAppSelector((state: RootState) => state.products);

  const [maxPrice, setMaxPrice] = useState(100000);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    dispatch(fetchOccasions());
  }, [dispatch]);

  const getParentId = (o: { parent?: string | { _id: string } | null }) =>
    typeof o.parent === 'object' && o.parent ? o.parent._id : null;

  const currentOccasion = occasions.find(o => o.slug === slug);
  const isSubOccasion = !!currentOccasion?.parent;

  // Resolve the top-level occasion either for this occasion or its parent
  const mainOccasion = isSubOccasion
    ? occasions.find(o => o._id === getParentId(currentOccasion!))
    : currentOccasion;

  const subOccasions = occasions.filter(o => {
    if (!o.parent || !mainOccasion) return false;
    return getParentId(o) === mainOccasion._id;
  });

  // Active sub-occasion: if the current slug IS a sub-occasion, pre-select it; else "all"
  const activeSub = isSubOccasion ? currentOccasion?.slug : "all";

  useEffect(() => {
    if (slug === 'all') {
      dispatch(fetchProducts({ sort: sortBy }));
    } else if (mainOccasion?.name) {
      const activeSubOccasion = subOccasions.find(s => s.slug === activeSub);
      if (activeSub === 'all' || !activeSubOccasion) {
        dispatch(fetchProducts({ occasion: mainOccasion.name, sort: sortBy }));
      } else {
        dispatch(fetchProducts({ occasion: mainOccasion.name, occasionSub: activeSubOccasion.name, sort: sortBy }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, slug, mainOccasion?.name, activeSub, sortBy]);

  const filteredProducts = useMemo(() => {
    return (products as Product[]).filter(p => p.price <= maxPrice);
  }, [products, maxPrice]);

  const resetFilters = () => {
    setMaxPrice(100000);
    setSortBy("newest");
  };

  const pageTitle = currentOccasion?.name || (slug === 'all' ? "All Occasions" : "Occasion");
  const pageDesc = currentOccasion?.description || mainOccasion?.description || "Thoughtfully curated miniatures for every celebration — birthdays, weddings, festivals and every special moment worth treasuring.";
  const bgImage = getImageUrl(currentOccasion?.image || mainOccasion?.image) || '/hero-bg.jpg';

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[var(--bg)]">

      {/* ── BACKGROUND IMAGE BREADCRUMB HERO ── */}
      <section className="relative w-full h-[340px] md:h-[420px] flex flex-col items-start justify-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-[1.04]"
          style={{ backgroundImage: `url('${bgImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />
        <div className="absolute inset-0 bg-[var(--accent)]/10 mix-blend-multiply" />

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-8 sm:px-12 pb-10 md:pb-14 flex flex-col gap-4">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            aria-label="Breadcrumb"
            className="flex items-center gap-2"
          >
            <Link href="/" className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300">
              <Home size={14} />
            </Link>
            <ChevronRight size={14} className="text-white/30" />
            {slug !== 'all' && (
              <>
                <Link href="/occasion/all" className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase hover:text-white transition-all">
                  All Occasions
                </Link>
                <ChevronRight size={14} className="text-white/30" />
                {isSubOccasion && mainOccasion && (
                  <>
                    <Link href={`/occasion/${mainOccasion.slug}`} className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase hover:text-white transition-all">
                      {mainOccasion.name}
                    </Link>
                    <ChevronRight size={14} className="text-white/30" />
                  </>
                )}
              </>
            )}
            <span className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold tracking-[0.2em] uppercase">
              {pageTitle}
            </span>
          </motion.nav>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <span className="text-white/70 text-[10px] font-bold tracking-[0.25em] uppercase mb-3 block">
              {filteredProducts.length} Handcrafted Pieces
            </span>
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-tight">
              {pageTitle}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* ── SHOP LAYOUT ── */}
      <div className="max-w-[1440px] mx-auto px-8 sm:px-12 py-12 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 lg:gap-16 items-start w-full">

        {/* FILTERS SIDEBAR */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col gap-8 lg:sticky lg:top-[100px]"
        >
          <div className="space-y-7 p-7 rounded-[1.5rem] bg-[var(--bg-subtle)] border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
               <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--text)] flex items-center gap-2">
                 <Filter size={14} strokeWidth={2} /> Refine
               </h3>
               <button onClick={resetFilters} className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors">Clear</button>
            </div>

            <div className="space-y-7">
              {/* Price Range */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase text-[var(--text-faint)] tracking-[0.15em] block">Price Limit</label>
                <div className="relative pt-1">
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full h-1 rounded-lg appearance-none cursor-pointer outline-none slider-thumb"
                    style={{ WebkitAppearance: 'none', background: `linear-gradient(to right, var(--accent) ${(maxPrice / 100000) * 100}%, var(--bg-muted) ${(maxPrice / 100000) * 100}%)` }}
                  />
                </div>
                <div className="flex justify-between text-[12px] font-bold text-[var(--text-faint)]">
                  <span>₹0</span>
                  <span className="text-[var(--accent)]">₹{maxPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Sort */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase text-[var(--text-faint)] tracking-[0.15em] block">Sort By</label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white border border-[var(--border)] hover:border-[var(--accent)] focus:border-[var(--accent)] transition-colors rounded-xl px-4 py-3 text-[13px] font-bold text-[var(--text)] outline-none cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="newest">Latest Arrivals</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-faint)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Occasion Description */}
          {pageDesc && (
            <div className="p-6 rounded-[1.5rem] bg-white border border-[var(--border)] shadow-sm">
              <p className="text-[var(--text-muted)] text-[13px] leading-relaxed">{pageDesc}</p>
            </div>
          )}
        </motion.aside>

        {/* PRODUCTS AREA */}
        <div className="flex flex-col gap-6 pb-16">
          {/* Sub-occasion Tabs */}
          {mainOccasion && subOccasions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
            >
              <Link
                href={`/occasion/${mainOccasion.slug}`}
                className={`shrink-0 px-5 py-2.5 rounded-full border text-[11px] font-bold tracking-wide transition-all duration-300 ${
                  activeSub === "all" || (!isSubOccasion && !activeSub)
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                }`}
              >
                All
              </Link>
              {subOccasions.map((sub) => (
                <Link
                  key={sub._id}
                  href={`/occasion/${sub.slug}`}
                  className={`shrink-0 px-5 py-2.5 rounded-full border text-[11px] font-bold tracking-wide transition-all duration-300 ${
                    activeSub === sub.slug
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  }`}
                >
                  {sub.name}
                </Link>
              ))}
            </motion.div>
          )}

          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5"
          >
            <div className="text-[12px] font-bold tracking-[0.1em] text-[var(--text-faint)] uppercase">
              <span className="text-[var(--text)]">{filteredProducts.length}</span> results
            </div>
            <div className="flex bg-[var(--bg-subtle)] rounded-xl p-1 border border-[var(--border)]">
              <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-[var(--text)]" : "text-[var(--text-faint)] hover:text-[var(--text-muted)]"}`}><LayoutGrid size={16} strokeWidth={1.5} /></button>
              <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-[var(--text)]" : "text-[var(--text-faint)] hover:text-[var(--text-muted)]"}`}><List size={16} strokeWidth={1.5} /></button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-40 flex flex-col items-center gap-5">
                <Loader2 className="animate-spin text-[var(--accent)]" size={36} strokeWidth={1.5} />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]">Curating the Archive...</span>
              </motion.div>
            ) : filteredProducts.length > 0 ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className={`grid gap-x-6 gap-y-12 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
              >
                {filteredProducts.map((p: Product, i: number) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.5 }}
                    key={p._id || p.id}
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-24 px-8 text-center bg-[var(--bg-subtle)] rounded-[2rem] border border-[var(--border)] flex flex-col items-center gap-4 shadow-sm"
              >
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm border border-[var(--border)]">
                  <Leaf size={28} className="text-[var(--text-faint)]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[var(--text)] text-2xl font-bold tracking-tight">No Results Found</h3>
                <p className="text-[var(--text-muted)] text-[14px] max-w-sm leading-relaxed">No artifacts match your current price filter. Try adjusting or resetting the filters.</p>
                <button onClick={resetFilters} className="mt-4 px-8 py-3 bg-white text-[var(--text)] rounded-full text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[var(--accent)] hover:text-white border border-[var(--border)] transition-all">
                  Reset Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Slider thumb style */}
      <style dangerouslySetInnerHTML={{__html: `
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
      `}} />
    </div>
  );
}