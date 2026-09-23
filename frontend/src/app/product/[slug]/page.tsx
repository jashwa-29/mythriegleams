"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/hooks/useCart";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchProductBySlug, fetchProducts } from "@/redux/slices/productSlice";
import { Product } from "@/data/products";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from '@/utils/getImageUrl';
import { compressImageFile } from '@/utils/compressImage';
import {
  Loader2, ChevronRight, Truck,
  MessageCircle,
  Minus, Plus, Leaf, Droplets, Wind, Home, Camera, ImageUp, X
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
  const [selectedColor, setSelectedColor] = useState("");
  const [customerImage, setCustomerImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState("story");

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
  }, [dispatch, slug]);

  useEffect(() => {
    if (p) {
      dispatch(fetchProducts({}));
      if (p.variants && p.variants.length > 0 && p.variants[0].options.length > 0) {
        if (p.variants[0].type !== 'Color') {
          setSelectedVariant(p.variants[0].options[0]);
        }
      }
      const colorGroup = p.variants?.find((v) => v.type === 'Color');
      if (colorGroup && colorGroup.options?.length > 0) {
        setSelectedColor(colorGroup.options[0]);
      }
    }
  }, [dispatch, p]);

  const handleCustomerImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const dataUrl = await compressImageFile(file);
      setCustomerImage(dataUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const requiresImage = !!((p as any)?.requiresImage);

  const relatedProducts = (products as Product[]).filter(item =>
    (item._id || item.id) !== (p?._id || p?.id)
  ).slice(0, 8);

  const savings = p?.mrp ? p.mrp - p.price : 0;
  const savePct = p?.mrp ? Math.round((savings / p.mrp) * 100) : 0;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // ── Loading State ──
  if (loading || (!p && loading !== false)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[var(--bg)]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Loader2 className="text-[var(--accent)]" size={36} strokeWidth={1.5} />
        </motion.div>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-faint)]">
          Preparing experience...
        </motion.span>
      </div>
    );
  }

  // ── Not Found State ──
  if (!p) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[var(--bg)] px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-20 h-20 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center border border-[var(--border)] shadow-sm">
          <Leaf className="text-[var(--text-faint)]" size={32} strokeWidth={1.5} />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-bold text-[var(--text)] tracking-tight">
          Artifact Not Found
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[var(--text-muted)] text-[15px] max-w-sm leading-relaxed">
          The piece you are looking for may have been archived or no longer exists.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Link href="/category/all" className="mt-4 inline-block px-8 py-3.5 bg-[var(--text)] text-white rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[var(--accent)] transition-all shadow-md">
            Return to Collection
          </Link>
        </motion.div>
      </div>
    );
  }

  const categorySlug = (p as any).categorySlug || p.category?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[var(--bg)] selection:bg-[var(--accent)] selection:text-white">

      {/* ── BACKGROUND IMAGE BREADCRUMB HERO ── */}
      <section className="relative w-full h-[280px] md:h-[340px] flex flex-col items-start justify-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-[1.04]"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />
        <div className="absolute inset-0 bg-[var(--accent)]/10 mix-blend-multiply" />

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-8 sm:px-12 pb-8 md:pb-12 flex flex-col gap-4">
          {/* Breadcrumb */}
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
            <ChevronRight size={14} className="text-white/30" />
            <Link href="/category/all" className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase hover:text-white transition-all">
              All Products
            </Link>
            {p.category && (
              <>
                <ChevronRight size={14} className="text-white/30" />
                <Link href={`/category/${categorySlug}`} className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase hover:text-white transition-all">
                  {p.category}
                </Link>
              </>
            )}
            <ChevronRight size={14} className="text-white/30" />
            <span className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold tracking-[0.2em] uppercase max-w-[200px] truncate">
              {p.name}
            </span>
          </motion.nav>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <span className="text-white/70 text-[10px] font-bold tracking-[0.25em] uppercase mb-3 block">
              {p.category}
            </span>
            <h1 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.2] tracking-tight max-w-2xl line-clamp-2">
              {p.name}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* ── PRODUCT DETAIL ── */}
      <section className="max-w-[1440px] mx-auto px-8 sm:px-12 pt-10 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start w-full">

        {/* LEFT: Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4 lg:sticky lg:top-[100px]"
        >
          <div className="aspect-square w-full max-h-[65vh] rounded-[2rem] bg-[var(--bg-subtle)] overflow-hidden relative group border border-[var(--border)]">
            <AnimatePresence mode="wait">
              {p.images && p.images.length > 0 ? (
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  src={getImageUrl(p.images[activeImage])}
                  alt={p.name}
                  className="w-full h-full object-contain sm:object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--text-faint)] text-xl font-light">No Image</div>
              )}
            </AnimatePresence>

            {p.stockStatus === 'made-to-order' && (
              <div className="absolute top-5 left-5 pointer-events-none">
                <span className="bg-white/80 backdrop-blur-md px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text)] rounded-full flex items-center gap-2 shadow-sm border border-[var(--border)]">
                  <Leaf size={11} className="text-[var(--accent)]" /> Made to Order
                </span>
              </div>
            )}
          </div>

          {p.images && p.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {p.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-18 h-18 min-w-[4.5rem] min-h-[4.5rem] rounded-xl shrink-0 overflow-hidden transition-all duration-500 border-2 ${activeImage === i ? "border-[var(--accent)] opacity-100" : "border-transparent opacity-50 hover:opacity-80"}`}
                >
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* RIGHT: Details Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-8"
        >
          {/* Category Label + Name */}
          <div className="space-y-2">
            <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-faint)] font-bold">{p.category}</div>
            <h2 className="text-[var(--text)] text-2xl md:text-3xl font-bold leading-[1.2] tracking-tight">
              {p.name}
            </h2>
            {(p as any).description && (
              <p className="text-[var(--text-muted)] text-[15px] leading-relaxed pt-1 max-w-lg">
                {(p as any).description}
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="py-6 border-y border-[var(--border)] flex items-end gap-5">
            <span className="text-4xl font-bold text-[var(--text)] tracking-tight">₹{p.price.toLocaleString()}</span>
            {p.mrp && p.mrp > p.price && (
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[var(--text-faint)] text-xl line-through font-light">₹{p.mrp.toLocaleString()}</span>
                <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
                  Save {savePct}%
                </span>
              </div>
            )}
          </div>

          {/* Form / Actions */}
          <div className="space-y-6">
            {/* Variants */}
            {p.variants && p.variants.length > 0 && p.variants[0].type !== 'Color' && p.variants[0].options.length > 0 && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]">
                  Select {p.variants[0].type === 'Color' ? 'Colour' : p.variants[0].type || 'Option'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {p.variants[0].options.map((s: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(s)}
                      className={`px-5 py-2.5 text-[12px] font-bold tracking-wide rounded-xl transition-all duration-300 ${selectedVariant === s ? 'bg-[var(--text)] text-white' : 'bg-transparent text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Variant */}
            {(() => {
              const colorGroup = p.variants?.find((v) => v.type === 'Color');
              if (!colorGroup || colorGroup.options?.length === 0) return null;
              return (
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]">Select Colour</span>
                  <div className="flex flex-wrap gap-2">
                    {colorGroup.options.map((c: string) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`px-5 py-2.5 text-[12px] font-bold tracking-wide rounded-xl transition-all duration-300 flex items-center gap-2 ${selectedColor === c ? 'bg-[var(--text)] text-white' : 'bg-transparent text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'}`}
                      >
                        <span
                          className={`w-3 h-3 rounded-full border ${selectedColor === c ? 'border-white/40' : 'border-[var(--border)]'}`}
                          style={{ backgroundColor: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c) ? c : undefined }}
                        />
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Customer Image Intake */}
            {requiresImage && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)] flex items-center gap-2">
                  <Camera size={13} className="text-[var(--accent)]" /> Upload Your Photo
                </span>
                {customerImage ? (
                  <div className="relative w-40 aspect-square rounded-xl overflow-hidden border border-[var(--border)] group">
                    <img src={customerImage} alt="Your reference" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCustomerImage("")}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black transition-all"
                      aria-label="Remove photo"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center gap-2 w-40 aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 cursor-pointer transition-all ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploadingImage ? <Loader2 size={20} className="text-[var(--accent)] animate-spin" /> : <ImageUp size={20} className="text-[var(--text-faint)]" />}
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]">{uploadingImage ? 'Processing...' : 'Add image'}</span>
                    <input type="file" accept="image/*" onChange={handleCustomerImage} className="hidden" />
                  </label>
                )}
                <p className="text-[11px] text-[var(--text-faint)]">A clear photo of your reference helps the artisan craft your piece perfectly.</p>
              </div>
            )}

            {/* Qty + Add to Cart */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="flex items-center justify-between w-full sm:w-32 h-12 border border-[var(--border)] rounded-xl px-2 bg-white">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  <Minus size={14} strokeWidth={2} />
                </button>
                <span className="font-bold text-[var(--text)]">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  <Plus size={14} strokeWidth={2} />
                </button>
              </div>

              <button
                className="flex-1 h-12 bg-[var(--text)] text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-[var(--accent)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 shadow-md disabled:opacity-40 disabled:hover:bg-[var(--text)] disabled:hover:translate-y-0 disabled:hover:shadow-md"
                disabled={requiresImage && !customerImage}
                onClick={() => addToCart({
                  productId: (p as any)._id || String(p.id),
                  name: p.name,
                  image: (p as any).images?.[0] || "",
                  price: p.price,
                  quantity: qty,
                  selectedVariant,
                  selectedColor,
                  customerImage,
                })}
              >
                {requiresImage && !customerImage ? "Upload a photo to continue" : "Add to Cart"}
              </button>
            </div>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/918300034451?text=Hello,%20I%20would%20love%20to%20inquire%20about%20the%20${encodeURIComponent(p.name)}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 rounded-xl text-[11px] font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-3 hover:bg-[#25D366]/20 transition-all duration-300"
            >
              <MessageCircle size={16} strokeWidth={2} />
              Ask the Artisan on WhatsApp
            </a>
          </div>

          {/* Tabs */}
          <div className="space-y-5 pt-2 border-t border-[var(--border)]">
            <div className="flex gap-6">
              {[{ id: 'story', label: 'Story' }, { id: 'details', label: 'Details' }, { id: 'shipping', label: 'Shipping' }].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-[12px] font-bold tracking-[0.1em] uppercase transition-all relative ${activeTab === tab.id ? 'text-[var(--text)]' : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'}`}
                >
                  {tab.label}
                  {activeTab === tab.id && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]" />}
                </button>
              ))}
            </div>

            <div className="min-h-[130px] text-[var(--text-muted)] text-[14px] leading-relaxed">
              <AnimatePresence mode="wait">
                {activeTab === 'story' && (
                  <motion.div key="story" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-5">
                    <p>{p.story || "A beautifully handcrafted piece to bring warmth and artistry to your space."}</p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2 text-[13px]">
                        <Droplets size={14} strokeWidth={1.5} className="text-[var(--accent)]" /> Natural Textures
                      </div>
                      <div className="flex items-center gap-2 text-[13px]">
                        <Wind size={14} strokeWidth={1.5} className="text-[var(--accent)]" /> Mindful Creation
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeTab === 'details' && (
                  <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                    <p>{p.details || "Crafted by hand using premium clay. Keep away from direct moisture and clean with a dry, soft cloth."}</p>
                  </motion.div>
                )}
                {activeTab === 'shipping' && (
                  <motion.div key="shipping" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="flex gap-4">
                    <Truck size={18} strokeWidth={1.5} className="text-[var(--accent)] shrink-0 mt-0.5" />
                    <p>Delivered with care across India. Please allow 10–14 days for this handcrafted piece to reach your home.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── RELATED PRODUCTS ── */}
      {relatedProducts.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-8 sm:px-12 py-12 border-t border-[var(--border)] w-full mb-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent)] block">Discover More</span>
                <h2 className="text-[var(--text)] text-2xl md:text-3xl font-bold tracking-tight">You May Also Love</h2>
              </div>
              <Link href="/category/all" className="group flex items-center gap-2 text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors">
                View All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {relatedProducts.map((rp: Product, i: number) => (
                <motion.div
                  key={(rp as any)._id || rp.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: 0.08 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ProductCard product={rp as any} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}
    </div>
  );
}
