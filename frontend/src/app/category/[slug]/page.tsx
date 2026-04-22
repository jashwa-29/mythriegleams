"use client";

import React, { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Breadcrumb from "@/components/Breadcrumb";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchProducts } from "@/redux/slices/productSlice";
import { fetchCollections } from "@/redux/slices/collectionSlice";
import { RootState } from "@/redux/store";
import { Loader2, Sparkles, Filter, LayoutGrid, List, Leaf } from "lucide-react";
import { Product } from "@/data/products";
import { motion, AnimatePresence } from "framer-motion";

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const dispatch = useAppDispatch();
  
  const { collections } = useAppSelector((state: RootState) => state.collections);
  const { products, loading } = useAppSelector((state: RootState) => state.products);

  // Core filtering state
  const [maxPrice, setMaxPrice] = useState(100000); // matches slider max — show all by default
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    dispatch(fetchCollections());
  }, [dispatch]);

  // Find current collection by slug
  const currentCollection = (collections as any[]).find(c => c.slug === slug);

  // Unified reactive fetcher
  useEffect(() => {
    if (slug === 'all') {
      dispatch(fetchProducts({ sort: sortBy }));
    } else if (currentCollection?.name) {
      dispatch(fetchProducts({ category: currentCollection.name, sort: sortBy }));
    }
  }, [dispatch, slug, currentCollection?.name, sortBy]);

  const filteredProducts = useMemo(() => {
    return (products as Product[]).filter(p => p.price <= maxPrice);
  }, [products, maxPrice]);

  const resetFilters = () => {
    setMaxPrice(100000);
    setSortBy("newest");
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#fdfdfb]">
      {/* BREADCRUMB */}
      <Breadcrumb items={[
         { label: "Vault", href: "/category/all" },
         { label: currentCollection?.name || (slug === 'all' ? "All Collections" : "Collection") }
      ]} />

      {/* CATEGORY HERO */}
      <section className="relative overflow-hidden pt-16 pb-24 px-6 sm:px-12 bg-[#fdfdfb] flex flex-col items-center justify-center border-b border-[#e8e4db]/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#f8f6f3] via-[#fdfdfb] to-[#fdfdfb] pointer-events-none" />
        
        <div className="max-w-[1000px] mx-auto relative z-10 flex flex-col items-center text-center gap-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-[#e8e4db] bg-white shadow-sm text-[11px] uppercase tracking-[0.2em] text-[#a69076] font-medium"
          >
            <Sparkles size={14} /> <span>Curated Selection</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(3.5rem,8vw,6rem)] font-serif text-[#3d332a] leading-[1.05] tracking-tight"
          >
            {currentCollection?.name || "The Archive"}
          </motion.h1>
          
          <motion.p 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
             className="text-[1.1rem] sm:text-[1.25rem] text-[#8c8273] font-light leading-relaxed max-w-[700px]"
          >
            {currentCollection?.description || "A mindful exploration of all our handcrafted artifacts. Find pieces that resonate with your space and spirit."}
          </motion.p>
          
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
             className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 mt-6 pt-8 border-t border-[#e8e4db] w-full max-w-[600px]"
          >
               <div className="flex flex-col items-center">
                 <span className="font-serif text-4xl text-[#3d332a]">{filteredProducts.length}</span>
                 <span className="text-[10px] uppercase tracking-[0.2em] text-[#8c8273] font-medium mt-2">Curated Pieces</span>
               </div>
               <div className="w-[1px] h-12 bg-[#e8e4db]" />
               <div className="flex flex-col items-center">
                 <span className="font-serif text-4xl text-[#3d332a]">100%</span>
                 <span className="text-[10px] uppercase tracking-[0.2em] text-[#8c8273] font-medium mt-2">Artisanal Craft</span>
               </div>
          </motion.div>
        </div>
      </section>

      {/* SHOP LAYOUT */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-12 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 items-start w-full border-t border-[#e8e4db]">
        
        {/* FILTERS SIDEBAR */}
        <aside className="flex flex-col gap-10 sticky top-[120px]">
          <div className="space-y-8 p-8 rounded-[2rem] bg-[#f8f6f3] border border-[#e8e4db] shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#e8e4db]">
               <h3 className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#594a3c] flex items-center gap-2">
                 <Filter size={16} strokeWidth={1.5} /> Refine Sort
               </h3>
               <button onClick={resetFilters} className="text-[10px] uppercase tracking-widest font-medium text-[#a69076] hover:text-[#594a3c] transition-colors">Clear</button>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[11px] font-medium uppercase text-[#8c8273] tracking-[0.1em] block">Investment Limit</label>
                <div className="relative pt-2">
                    <input 
                    type="range" 
                    min="0" 
                    max="100000" 
                    step="1000" 
                    value={maxPrice} 
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))} 
                    className="w-full h-1 bg-[#e8e4db] rounded-lg appearance-none cursor-pointer outline-none slider-thumb"
                    style={{ WebkitAppearance: 'none', background: `linear-gradient(to right, #a69076 ${(maxPrice / 100000) * 100}%, #e8e4db ${(maxPrice / 100000) * 100}%)` }}
                    />
                </div>
                <div className="flex justify-between text-[13px] font-medium text-[#a1988c]">
                  <span>₹0</span>
                  <span className="text-[#594a3c]">₹{maxPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-medium uppercase text-[#8c8273] tracking-[0.1em] block">Curate By</label>
                <div className="relative">
                    <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white border border-[#dcd7ce] hover:border-[#a69076] focus:border-[#a69076] transition-colors rounded-xl px-4 py-3.5 text-[13px] font-medium text-[#594a3c] outline-none cursor-pointer appearance-none shadow-sm"
                    >
                        <option value="newest">Latest Arrivals</option>
                        <option value="price-asc">Value: Approachable First</option>
                        <option value="price-desc">Value: Premium First</option>
                        <option value="rating">Top Authenticated</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#a1988c]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* PRODUCTS AREA */}
        <div className="flex flex-col gap-8 pb-32">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e4db] pb-6">
             <div className="text-[12px] font-medium tracking-[0.1em] text-[#8c8273]">
               Displaying <span className="text-[#3d332a]">{filteredProducts.length}</span> Handcrafted Results
             </div>
             <div className="flex bg-[#f8f6f3] rounded-xl p-1 border border-[#e8e4db]">
               <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-[#594a3c]" : "text-[#a1988c] hover:text-[#8c8273]"}`}><LayoutGrid size={18} strokeWidth={1.5} /></button>
               <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-[#594a3c]" : "text-[#a1988c] hover:text-[#8c8273]"}`}><List size={18} strokeWidth={1.5} /></button>
             </div>
          </div>

          <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-40 flex flex-col items-center gap-6">
                    <Loader2 className="animate-spin text-[#a69076]" size={40} strokeWidth={1} />
                    <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#a69076]/70">Curating the Archive...</span>
                </motion.div>
              ) : filteredProducts.length > 0 ? (
                <motion.div key="grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className={`grid gap-x-8 gap-y-16 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                  {filteredProducts.map((p: Product, i: number) => (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }} key={p._id || p.id}>
                       <ProductCard product={p as any} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-24 px-8 text-center bg-[#f8f6f3] rounded-[2rem] border border-[#e8e4db] flex flex-col items-center gap-4 shadow-sm">
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm border border-[#e8e4db]">
                      <Leaf size={32} className="text-[#a69076]/40" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-3xl text-[#3d332a] tracking-tight">The Vault is Silent</h3>
                  <p className="text-[#8c8273] text-[15px] font-light max-w-sm leading-relaxed">No artifacts match your current criteria. Consider adjusting your investment threshold to discover more pieces.</p>
                  <button 
                    onClick={resetFilters} 
                    className="mt-6 px-8 py-3 bg-white text-[#594a3c] rounded-full text-[12px] font-medium tracking-wide hover:bg-[#fdfdfb] hover:shadow-sm border border-[#dcd7ce] transition-all"
                  >
                    Reset Filters
                  </button>
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Required slider thumb styling */}
      <style dangerouslySetInnerHTML={{__html: `
        .slider-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #594a3c;
            cursor: pointer;
            border: 2px solid #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
      `}} />
    </div>
  );
}
