"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";
import ProductCard from "@/components/ProductCard";
import Breadcrumb from "@/components/Breadcrumb";
import { useCart } from "@/hooks/useCart";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchProductBySlug, fetchProducts } from "@/redux/slices/productSlice";
import { Product } from "@/data/products";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Loader2, ChevronRight, Truck, 
    MessageCircle, 
    Minus, Plus, Leaf, Droplets, Wind
} from "lucide-react";

export default function ProductStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const dispatch = useAppDispatch();
  const { selectedProduct, loading, products } = useAppSelector((state: any) => state.products);
  const { addToCart } = useCart();
  
  const p = selectedProduct as Product | null;
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [activeTab, setActiveTab] = useState("story");

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
  }, [dispatch, slug]);

  useEffect(() => {
    if (p) {
        dispatch(fetchProducts({})); // Fetch all products for broad suggestions
        if (p.variants && p.variants.length > 0 && p.variants[0].options.length > 0) {
            setSelectedVariant(p.variants[0].options[0]);
        }
    }
  }, [dispatch, p]);

  const relatedProducts = (products as Product[]).filter(item => 
    (item._id || item.id) !== (p?._id || p?.id)
  ).slice(0, 4);

  const savings = p?.mrp ? p.mrp - p.price : 0;
  const savePct = p?.mrp ? Math.round((savings / p.mrp) * 100) : 0;

  useEffect(() => {
     window.scrollTo(0, 0);
  }, [slug]);

  if (!p) {
    if (!loading) {
       return (
         <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#fdfdfb] px-6 text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm border border-[#e8e4db]">
                <Leaf className="text-[#a69076]/40" size={36} strokeWidth={1.5} />
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-serif text-[#3d332a] tracking-tight">Artifact Not Found</motion.h1>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[#8c8273] font-light text-[15px] max-w-sm leading-relaxed">The piece you are looking for may have been archived or no longer exists. Discover our other handcrafted treasures.</motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Link href="/category/all" className="mt-6 inline-block px-8 py-3.5 bg-[#594a3c] text-white rounded-xl text-[12px] font-medium tracking-[0.1em] uppercase hover:bg-[#3d332a] transition-all shadow-md">
                   Return to Vault
                </Link>
            </motion.div>
         </div>
       );
    }
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#fdfdfb] transition-colors duration-1000">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
               <Loader2 className="text-[#a69076]" size={40} strokeWidth={1} />
            </motion.div>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[11px] uppercase tracking-[0.3em] text-[#a69076]/60">
               Preparing experience...
            </motion.span>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#fdfdfb] pb-32 selection:bg-[#a69076] selection:text-white">
      <Breadcrumb 
        items={[
          { label: "Vault", href: "/category/all" },
          { label: p.category, href: `/category/${(p as any).categorySlug || p.category?.toLowerCase().replace(/\s+/g,'-')}` },
          { label: p.name }
        ]} 
      />

      <section className="max-w-[1400px] mx-auto px-6 sm:px-12 pt-8 sm:pt-12 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28 items-start w-full">
        {/* SERENE GALLERY */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4 sticky top-[100px]"
        >
          <div className="aspect-square w-full max-h-[70vh] rounded-[2rem] bg-[#f8f6f3] overflow-hidden relative group">
            <AnimatePresence mode="wait">
                {p.images && p.images.length > 0 ? (
                    <motion.img 
                      key={activeImage}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      src={p.images[activeImage]} 
                      alt={p.name} 
                      className="w-full h-full object-contain sm:object-cover" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-[#8c8273]/20 font-serif font-light">Image Unavailable</div>
                )}
            </AnimatePresence>
            
            {/* Visual Wellness Badges */}
            <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none">
              {p.stockStatus === 'made-to-order' && (
                 <span className="bg-white/80 backdrop-blur-md px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[#594a3c] rounded-full flex items-center gap-2 shadow-sm">
                   <Leaf size={12} className="text-[#849b87]" /> Handcrafted to order
                 </span>
              )}
            </div>
          </div>
          
          {/* Refined Thumbnails */}
          {p.images && p.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              {p.images.map((img: string, i: number) => (
                <button 
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-20 h-20 rounded-2xl shrink-0 overflow-hidden transition-all duration-500 ease-out ${activeImage === i ? "ring-1 ring-offset-2 ring-[#a69076]" : "opacity-50 hover:opacity-100 grayscale-[20%]"}`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* CALMING NARRATIVE PANEL */}
        <motion.div 
           initial={{ opacity: 0, y: 40 }} 
           animate={{ opacity: 1, y: 0 }} 
           transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
           className="flex flex-col gap-10 lg:pl-4"
        >
          {/* Header */}
          <div className="space-y-3">
            <div className="text-[11px] tracking-[0.2em] uppercase text-gold font-medium">{p.category}</div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-[clamp(2.2rem,4vw,3.5rem)] font-serif text-brown-dark leading-[1.08] tracking-tight"
            >
                {p.name}
            </motion.h1>
            {(p as any).description && (
              <p className="text-txt-muted text-[1.05rem] font-light leading-relaxed max-w-lg pt-1">
                {(p as any).description}
              </p>
            )}
          </div>

          {/* Value Proposition */}
          <div className="pt-6 pb-8 border-y border-[#e8e4db] flex items-end gap-6 space-x-2">
            <span className="text-4xl sm:text-5xl font-light text-[#3d332a] tracking-tight">₹{p.price.toLocaleString()}</span>
            {p.mrp && p.mrp > p.price && (
              <div className="flex items-center gap-4 mb-1">
                <span className="text-xl text-[#b5aa9d] line-through font-light">₹{p.mrp.toLocaleString()}</span>
                <span className="text-[#849b87] bg-[#849b87]/10 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide">
                   Save {savePct}%
                </span>
              </div>
            )}
          </div>

          {/* Form / Actions */}
          <div className="space-y-10">
              {p.variants && p.variants.length > 0 && p.variants[0].options.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8c8273]">
                    Select Dimensions
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {p.variants[0].options.map((s: string, i: number) => (
                      <button 
                        key={i} 
                        onClick={() => setSelectedVariant(s)}
                        className={`px-6 py-3 text-[12px] font-medium tracking-wide rounded-xl transition-all duration-300 ${selectedVariant === s ? 'bg-[#594a3c] text-white' : 'bg-transparent text-[#8c8273] border border-[#dcd7ce] hover:border-[#a69076]'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center justify-between w-full sm:w-32 h-[56px] border border-[#dcd7ce] rounded-2xl px-2">
                  <button onClick={() => setQty(Math.max(1, qty-1))} className="w-10 h-10 flex items-center justify-center text-[#8c8273] hover:text-[#594a3c] transition-colors"><Minus size={16} strokeWidth={1.5} /></button>
                  <span className="font-medium text-[#594a3c]">{qty}</span>
                  <button onClick={() => setQty(qty+1)} className="w-10 h-10 flex items-center justify-center text-[#8c8273] hover:text-[#594a3c] transition-colors"><Plus size={16} strokeWidth={1.5} /></button>
                </div>
                
                <button 
                  className="flex-1 h-[56px] bg-[#3d332a] text-white rounded-2xl font-medium text-[12px] uppercase tracking-[0.15em] hover:bg-[#594a3c] transition-all duration-300 flex items-center justify-center gap-3 w-full"
                  onClick={() => addToCart({
                    productId: (p as any)._id || String(p.id),
                    name: p.name,
                    image: (p as any).images?.[0] || "",
                    price: p.price,
                    quantity: qty,
                    selectedVariant,
                  })}
                >
                  <span>Add to Collection</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                 <a 
                  href={`https://wa.me/918300034451?text=Hello,%20I%20would%20love%20to%20inquire%20about%20the%20${encodeURIComponent(p.name)}.`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 h-[56px] bg-[#f2f6f3] text-[#6b856f] border border-[#e1ebe3] rounded-2xl text-[12px] font-medium tracking-wide flex items-center justify-center gap-3 hover:bg-[#e6efe9] transition-all duration-300"
                 >
                   <MessageCircle size={20} strokeWidth={1.5} />
                   <span>Ask the Artisan</span>
                 </a>
              </div>
          </div>

          {/* Minimalist Details Section */}
          <div className="mt-12 space-y-6">
             <div className="flex gap-8 border-b border-[#e8e4db]">
                {[
                  { id: 'story', label: 'Story' },
                  { id: 'details', label: 'Details' },
                  { id: 'shipping', label: 'Shipping' }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-4 text-[13px] font-medium transition-all relative ${activeTab === tab.id ? 'text-[#3d332a]' : 'text-[#a1988c] hover:text-[#8c8273]'}`}
                    >
                        {tab.label}
                        {activeTab === tab.id && <motion.div layoutId="tab-line" className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#3d332a]" />}
                    </button>
                ))}
             </div>

             <div className="min-h-[160px] text-[#594a3c] text-[15px] font-light leading-relaxed">
                <AnimatePresence mode="wait">
                  {activeTab === 'story' && (
                      <motion.div key="story" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
                          <p>{p.story || "A beautifully crafted piece to bring harmony and calm to your daily living spaces."}</p>
                          <div className="grid grid-cols-2 gap-4 pt-4">
                              <div className="flex items-center gap-3 text-sm text-[#8c8273]">
                                 <Droplets size={16} strokeWidth={1.5} className="text-[#a69076]" /> Natural Textures
                              </div>
                              <div className="flex items-center gap-3 text-sm text-[#8c8273]">
                                 <Wind size={16} strokeWidth={1.5} className="text-[#a69076]" /> Mindful Creation
                              </div>
                          </div>
                      </motion.div>
                  )}
                  {activeTab === 'details' && (
                      <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                          <p>{p.details || "Carefully made by hand using sustainable materials. To maintain its essence, keep away from direct moisture and clean with a dry, soft cloth."}</p>
                      </motion.div>
                  )}
                  {activeTab === 'shipping' && (
                      <motion.div key="shipping" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="flex gap-4">
                          <Truck size={20} strokeWidth={1.5} className="text-[#a69076] shrink-0 mt-1" />
                          <p>
                            Delivered with care across India. Please allow 10–14 days for this handcrafted piece to reach your sanctuary.
                          </p>
                      </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </motion.div>
      </section>

      {/* GENTLE RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 sm:px-12 py-16 mt-16 border-t border-[#e8e4db]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
                <div className="space-y-2">
                   <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#a69076]">Discover More</span>
                   <h2 className="text-3xl font-serif text-[#3d332a]">Suggestions for You</h2>
                </div>
                <Link href="/category/all" className="group flex items-center gap-2 text-[12px] font-medium tracking-wide text-[#8c8273] hover:text-[#594a3c] transition-colors">
                    View Complete Collection 
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
                {relatedProducts.map((rp: Product, i: number) => (
                    <motion.div 
                        key={rp._id || rp.id} 
                        initial={{ opacity: 0, y: 20 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: 0.1 * i, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <ProductCard product={rp} />
                    </motion.div>
                ))}
            </div>
        </section>
      )}
    </div>
  );
}
