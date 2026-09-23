"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchProducts } from "@/redux/slices/productSlice";
import { fetchCollections } from "@/redux/slices/collectionSlice";
import { createInquiry } from "@/redux/slices/inquirySlice";
import { RootState } from "@/redux/store";
import { Loader2, Package, CheckCircle2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@/data/products";
import { getImageUrl } from '@/utils/getImageUrl';
import { useCart } from '@/hooks/useCart';

/* ── Inline add-to-cart button — needs hook so must be its own component ── */
function BestSellerAddBtn({ product, className, showText }: { product: Product, className?: string, showText?: boolean }) {
  const { addToCart } = useCart();
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({
          productId: (product as any)._id || String(product.id),
          name:      product.name,
          image:     (product as any).images?.[0] || '',
          price:     product.price,
          quantity:  1,
        });
      }}
      aria-label="Add to cart"
      className={className || "w-9 h-9 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-300 shrink-0"}
    >
      {showText ? "Add to Cart" : <Plus size={14} strokeWidth={2} />}
    </button>
  );
}

export default function Home() {
  const dispatch = useAppDispatch();
  const { products, loading: productsLoading } = useAppSelector((state: RootState) => state.products);
  const { collections, loading: collectionsLoading } = useAppSelector((state: RootState) => state.collections);
  const { success: inquirySuccess, loading: inquiryLoading } = useAppSelector((state: RootState) => state.inquiries);
  
  const [inquiryData, setInquiryData] = useState({ name: '', phone: '', message: '' });

  useEffect(() => {
    dispatch(fetchProducts({ sort: 'newest' }));
    dispatch(fetchCollections());

    // Premium Reveal Animation logic
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    // Parallax Animation logic
    const handleScroll = () => {
      document.querySelectorAll('.parallax').forEach(el => {
        const rect = el.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        // Only animate if in or near viewport
        if (rect.top < viewportHeight && rect.bottom > 0) {
          const speed = parseFloat(el.getAttribute('data-speed') || '0.1');
          const yOffset = (rect.top - viewportHeight / 2) * speed;
          (el as HTMLElement).style.transform = `translate3d(0, ${yOffset}px, 0)`;
        }
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger once on load
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [dispatch]);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('type', 'custom');
    formData.append('name', inquiryData.name);
    formData.append('phone', inquiryData.phone);
    formData.append('message', inquiryData.message);
    formData.append('subject', `Custom Design Request from ${inquiryData.name}`);
    formData.append('email', 'guest@mythrisgleams.com'); 
    dispatch(createInquiry(formData as any));
  };

  // Featured Products (Trending / Top Picks)
  const featuredProducts = (products as Product[]).slice(0, 4);

  return (
    <div className="flex flex-col font-sans">
      <Hero />


      {/* ── CURATED GALLERIES — POTTERY EDITORIAL LAYOUT ── */}
      <section className="w-full py-16 md:py-24">
        <div className="max-w-[1440px] mx-auto px-8 sm:px-12">

          {/* ── TOP HEADER ROW ── */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }} 
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-start mb-14 md:mb-16"
          >

            {/* Left: eyebrow + large heading */}
            <div>
              <span className="text-[var(--text-faint)] text-[10px] font-bold tracking-[0.25em] uppercase mb-4 block">
                Our Product
              </span>
              <h2 className="text-[var(--text)] text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-tight">
                Explore Our<br /> Artisanal Collections
              </h2>
            </div>

            {/* Right: body text + CTA */}
            <div className="flex flex-col items-start justify-center gap-6 pt-0 md:pt-10">
              <p className="text-[var(--text-muted)] text-[15px] leading-relaxed">
                Each piece in our collection is handcrafted by skilled artisans using 
                premium clay — shaped, fired, and finished with care. From functional 
                tableware to sculptural centerpieces, explore a world of texture, warmth, 
                and timeless artisanal beauty.
              </p>
              <Link
                href="/category/all"
                className="inline-block bg-[var(--bg-muted)] hover:bg-[var(--accent)] text-[var(--text)] hover:text-white text-[11px] font-bold tracking-[0.2em] uppercase px-7 py-3 rounded-full transition-colors duration-300"
              >
                All Products
              </Link>
            </div>
          </motion.div>

          {/* ── BOTTOM: 4-CARD GRID ── */}
          {collectionsLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-[var(--accent)]" size={28} />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {collections.slice(0, 4).map((col: any) => (
                <Link
                  key={col._id}
                  href={`/category/${col.slug}`}
                  className="group flex flex-col"
                >
                  {/* Image */}
                  <div className="relative w-full aspect-square rounded-[10px] overflow-hidden bg-[var(--bg-muted)] mb-4 parallax" data-speed="-0.03">
                    {col.image ? (
                      <img
                        src={getImageUrl(col.image)}
                        alt={col.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[var(--text-faint)]">
                        <Package size={40} strokeWidth={1.2} />
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="text-center px-1">
                    <h3 className="text-[var(--text)] text-[15px] font-bold leading-[1.2] mb-1.5 group-hover:text-[var(--accent)] transition-colors duration-300">
                      {col.name}
                    </h3>
                    <p className="text-[var(--text-faint)] text-[13px] leading-relaxed line-clamp-2">
                      {col.description || "Handcrafted with care, shaped by skilled artisans using premium clay."}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── BEST SELLERS — MINIMALIST GALLERY ── */}
      <section id="products" className="w-full py-16 md:py-24 scroll-m-20 bg-white relative overflow-hidden">
        
        <div className="max-w-[1440px] mx-auto px-8 sm:px-12">
          
          {/* ── Unique Header (Centered Watermark Style) ── */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }} 
            transition={{ duration: 0.8 }}
            className="relative mb-20 flex flex-col items-center justify-center text-center"
          >

            <div className="z-10 pt-6 md:pt-12">
              <span className="text-[var(--accent)] text-[10px] font-bold tracking-[0.4em] uppercase mb-4 block">
                 Curated Selection
              </span>
              <h2 className="text-[var(--text)] text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5">
                 Best Selling Miniatures
              </h2>
              <p className="text-[var(--text-muted)] text-[15px] leading-relaxed max-w-md mx-auto">
                 Our most loved creations, meticulously hand-crafted and cherished across the country.
              </p>
            </div>
          </motion.div>

          {/* ── 4-Card Minimalist Grid ── */}
          {productsLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-[var(--accent)]" size={36} />
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center text-[var(--text-faint)] italic text-[16px]">
              No products found in the vault yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {featuredProducts.map((product: Product, i: number) => {
                const productSlug  = product.slug || product.id;
                const productImage = (product as any).images?.[0] ?? null;
                const productPrice = product.price;
                const productMRP   = (product as any).mrp || (product as any).oldPrice;
                const catTitle     = product.category;

                return (
                  <div key={(product as any)._id || product.id}>
                    <ProductCard product={product as any} />
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Centered View All Link */}
          <div className="mt-16 flex justify-center">
             <Link
                href="/category/all"
                className="inline-flex items-center gap-3 text-[var(--accent)] text-[11px] font-bold tracking-[0.2em] uppercase group hover:text-[var(--text)] transition-colors duration-300"
              >
                View Complete Vault
                <span className="inline-block group-hover:translate-x-1 transition-transform duration-300">→</span>
             </Link>
          </div>
        </div>
      </section>

      {/* ── OUR HERITAGE (STORY SECTION) ── */}
      <section className="w-full py-16 md:py-24 bg-white relative overflow-hidden group">
        
        {/* Animated Background Seal (Addon) */}
        <div className="absolute -top-10 -right-20 md:top-10 md:right-10 w-96 h-96 lg:w-[500px] lg:h-[500px] animate-[spin_60s_linear_infinite] opacity-[0.02] pointer-events-none select-none z-0 parallax" data-speed="0.2">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-[var(--text)]">
            <path id="heritageCircle" d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" fill="none" />
            <text className="text-[9px] font-bold tracking-[0.25em] uppercase">
              <textPath href="#heritageCircle" startOffset="0%">
                Mythris Gleams • Handcrafted with love • Since 2018 • Mythris Gleams • Handcrafted with love • Since 2018 • 
              </textPath>
            </text>
          </svg>
        </div>

        <div className="max-w-[1440px] mx-auto px-8 sm:px-12 relative z-10">
          
          <div className="flex items-center gap-4 mb-16 md:mb-24">
            <span className="w-12 h-px bg-[var(--text-faint)]"></span>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--text-faint)]">Our Heritage</span>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }} 
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32"
          >
             {/* Left: The Vision */}
             <div className="relative">
                <h2 className="text-[var(--text)] text-4xl md:text-5xl lg:text-[4rem] font-bold leading-[1.1] tracking-tight mb-10 max-w-xl relative parallax" data-speed="-0.05">
                  From Chennai to <br />
                  <span className="text-[var(--accent)] relative inline-block">
                    across India.
                    {/* Subtle underline animation */}
                    <span className="absolute bottom-2 left-0 w-full h-[6px] bg-[var(--accent)] opacity-20 -z-10 group-hover:h-[60%] transition-all duration-700 ease-out"></span>
                  </span>
                </h2>
                <div className="relative pl-8 md:pl-12 border-l border-[var(--border)]">
                   <div className="absolute top-0 left-[-1.5px] w-[3px] h-16 bg-[var(--accent)]" />
                   <p className="text-[var(--text-muted)] text-[16px] md:text-[18px] leading-relaxed max-w-lg mb-8">
                     Founded by <strong className="text-[var(--text)] font-semibold">Uma Gayathri</strong> in 2018 with a simple vision: to capture fleeting memories and transform them into lasting miniature art. 
                   </p>
                   <p className="text-[var(--text-muted)] text-[15px] leading-relaxed max-w-lg">
                     Today, our atelier has delivered thousands of hand-sculpted smiles, meticulously crafting stories into timeless physical forms.
                   </p>
                   
                   <Link href="/about" className="inline-flex items-center gap-4 mt-12 group/btn">
                     <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--text)] group-hover/btn:text-[var(--accent)] transition-colors duration-300">
                       Read Full Story
                     </span>
                     <span className="w-12 h-px bg-[var(--text)] group-hover/btn:w-20 group-hover/btn:bg-[var(--accent)] transition-all duration-500"></span>
                   </Link>
                </div>
             </div>

             {/* Right: The Pillars */}
             <div className="flex flex-col justify-center">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-12">
                  
                  {/* Pillar 1 */}
                  <div className="group/pillar relative pt-8 pb-6 px-6 -mx-6 rounded-[1.5rem] transition-all duration-500 hover:bg-[var(--bg-subtle)] hover:shadow-[0_8px_30px_rgba(42,31,24,0.06)]">
                     {/* Animated top border */}
                     <div className="absolute top-0 left-6 right-6 h-px bg-[var(--border)] group-hover/pillar:bg-transparent transition-colors duration-300" />
                     <div className="absolute top-0 left-6 w-0 h-[2px] bg-[var(--accent)] group-hover/pillar:w-[60%] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                     
                     <span className="block text-[var(--text-faint)] text-3xl font-light mb-4 group-hover/pillar:text-[var(--accent)] group-hover/pillar:translate-x-1 transition-all duration-500">01</span>
                     <h4 className="text-[var(--text)] text-[14px] font-bold tracking-[0.2em] uppercase mb-3">Hand Sculpted</h4>
                     <p className="text-[var(--text-muted)] text-[14px] leading-relaxed">
                       Every piece is shaped entirely by hand. No molds are used for our main designs, ensuring each creation is wholly unique.
                     </p>
                  </div>
                  
                  {/* Pillar 2 */}
                  <div className="group/pillar relative pt-8 pb-6 px-6 -mx-6 rounded-[1.5rem] transition-all duration-500 hover:bg-[var(--bg-subtle)] hover:shadow-[0_8px_30px_rgba(42,31,24,0.06)]">
                     <div className="absolute top-0 left-6 right-6 h-px bg-[var(--border)] group-hover/pillar:bg-transparent transition-colors duration-300" />
                     <div className="absolute top-0 left-6 w-0 h-[2px] bg-[var(--accent)] group-hover/pillar:w-[60%] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                     
                     <span className="block text-[var(--text-faint)] text-3xl font-light mb-4 group-hover/pillar:text-[var(--accent)] group-hover/pillar:translate-x-1 transition-all duration-500">02</span>
                     <h4 className="text-[var(--text)] text-[14px] font-bold tracking-[0.2em] uppercase mb-3">Hand Painted</h4>
                     <p className="text-[var(--text-muted)] text-[14px] leading-relaxed">
                       Vibrant and delicate detailing is achieved using top quality colors and microscopic brushes for breathtaking precision.
                     </p>
                  </div>

                  {/* Pillar 3 */}
                  <div className="group/pillar relative pt-8 pb-6 px-6 -mx-6 rounded-[1.5rem] transition-all duration-500 hover:bg-[var(--bg-subtle)] hover:shadow-[0_8px_30px_rgba(42,31,24,0.06)]">
                     <div className="absolute top-0 left-6 right-6 h-px bg-[var(--border)] group-hover/pillar:bg-transparent transition-colors duration-300" />
                     <div className="absolute top-0 left-6 w-0 h-[2px] bg-[var(--accent)] group-hover/pillar:w-[60%] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                     
                     <span className="block text-[var(--text-faint)] text-3xl font-light mb-4 group-hover/pillar:text-[var(--accent)] group-hover/pillar:translate-x-1 transition-all duration-500">03</span>
                     <h4 className="text-[var(--text)] text-[14px] font-bold tracking-[0.2em] uppercase mb-3">Premium Clay</h4>
                     <p className="text-[var(--text-muted)] text-[14px] leading-relaxed">
                       Crafted using high-grade, resilient air-dry and polymer clay designed for lifelong durability and a smooth finish.
                     </p>
                  </div>

                  {/* Pillar 4 */}
                  <div className="group/pillar relative pt-8 pb-6 px-6 -mx-6 rounded-[1.5rem] transition-all duration-500 hover:bg-[var(--bg-subtle)] hover:shadow-[0_8px_30px_rgba(42,31,24,0.06)]">
                     <div className="absolute top-0 left-6 right-6 h-px bg-[var(--border)] group-hover/pillar:bg-transparent transition-colors duration-300" />
                     <div className="absolute top-0 left-6 w-0 h-[2px] bg-[var(--accent)] group-hover/pillar:w-[60%] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                     
                     <span className="block text-[var(--text-faint)] text-3xl font-light mb-4 group-hover/pillar:text-[var(--accent)] group-hover/pillar:translate-x-1 transition-all duration-500">04</span>
                     <h4 className="text-[var(--text)] text-[14px] font-bold tracking-[0.2em] uppercase mb-3">Personalized</h4>
                     <p className="text-[var(--text-muted)] text-[14px] leading-relaxed">
                       Themes, names, and concepts perfectly tailored to your memories. You dream it, we sculpt it.
                     </p>
                  </div>

               </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* ── BESPOKE COMMISSION (CUSTOM SECTION) ── */}
      <section id="custom" className="w-full bg-white py-16 md:py-24 border-t border-[var(--border)]">
        <div className="max-w-[1320px] mx-auto px-8 sm:px-12">
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }} 
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center"
          >
            
            {/* Left side: Editorial Typography */}
            <div className="flex flex-col order-2 lg:order-1">
               <div className="inline-block px-4 py-1.5 rounded-full border border-[var(--accent)] text-[var(--accent)] text-[9px] font-bold tracking-[0.3em] uppercase w-max mb-8">
                 Bespoke Service
               </div>

               <h2 className="text-[var(--text)] text-4xl md:text-5xl lg:text-[4.5rem] font-bold leading-[1.05] tracking-tight mb-8">
                 Your story,<br />
                 <span className="text-[var(--text-faint)] italic font-serif font-light">miniaturized.</span>
               </h2>

               <p className="text-[var(--text-muted)] text-[16px] md:text-[18px] leading-[1.8] max-w-md mb-12">
                 We transform your cherished memories, favorite foods, and beloved pets into everlasting miniature art. Share your vision, and we will sculpt it into reality.
               </p>

               <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  <div>
                    <div className="text-[var(--text-faint)] font-light text-3xl mb-2">01</div>
                    <h4 className="text-[var(--text)] text-[12px] font-bold tracking-[0.1em] uppercase mb-2">Share Idea</h4>
                    <p className="text-[var(--text-muted)] text-[13px] leading-relaxed pr-4">Send us your theme, concept, or reference photos.</p>
                  </div>
                  <div>
                    <div className="text-[var(--text-faint)] font-light text-3xl mb-2">02</div>
                    <h4 className="text-[var(--text)] text-[12px] font-bold tracking-[0.1em] uppercase mb-2">Sketch & Design</h4>
                    <p className="text-[var(--text-muted)] text-[13px] leading-relaxed pr-4">We finalize the layout before the clay is touched.</p>
                  </div>
                  <div>
                    <div className="text-[var(--text-faint)] font-light text-3xl mb-2">03</div>
                    <h4 className="text-[var(--text)] text-[12px] font-bold tracking-[0.1em] uppercase mb-2">Hand Sculpt</h4>
                    <p className="text-[var(--text-muted)] text-[13px] leading-relaxed pr-4">Every detail is shaped and painted by artisan hands.</p>
                  </div>
                  <div>
                    <div className="text-[var(--text-faint)] font-light text-3xl mb-2">04</div>
                    <h4 className="text-[var(--text)] text-[12px] font-bold tracking-[0.1em] uppercase mb-2">Delivery</h4>
                    <p className="text-[var(--text-muted)] text-[13px] leading-relaxed pr-4">Packaged securely and shipped right to your door.</p>
                  </div>
               </div>
            </div>

            {/* Right side: The Form */}
            <div className="order-1 lg:order-2 bg-[var(--bg-subtle)] rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden group border border-[var(--border)] shadow-sm">
               {/* Decorative background shape */}
               <div className="absolute -top-32 -right-32 w-80 h-80 bg-[var(--bg-muted)] rounded-full blur-3xl opacity-50 group-hover:bg-[var(--accent)] group-hover:opacity-10 transition-all duration-1000 parallax" data-speed="-0.15" />
               
               <div className="relative z-10">
                 {inquirySuccess ? (
                    <div className="py-20 text-center flex flex-col items-center gap-6">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <CheckCircle2 size={32} className="text-[var(--accent)]" />
                      </div>
                      <h3 className="text-3xl font-bold text-[var(--text)] tracking-tight">Vision Captured.</h3>
                      <p className="text-[var(--text-muted)] text-[15px] max-w-[280px] mx-auto leading-relaxed">Uma Gayathri will reach out via WhatsApp shortly to begin your bespoke collaboration.</p>
                    </div>
                 ) : (
                    <form onSubmit={handleInquirySubmit} className="flex flex-col gap-8">
                      <div>
                        <h3 className="text-[var(--text)] text-[28px] font-bold tracking-tight mb-2">Initiate Narrative</h3>
                        <p className="text-[var(--text-muted)] text-[14px]">We'll respond via WhatsApp within 24 hours.</p>
                      </div>

                      <div className="flex flex-col gap-5 mt-2">
                        <div className="relative">
                          <input
                            required
                            value={inquiryData.name}
                            onChange={(e) => setInquiryData({...inquiryData, name: e.target.value})}
                            type="text"
                            placeholder="Your Name"
                            className="w-full bg-white h-14 rounded-xl px-5 text-[var(--text)] text-[15px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border border-transparent transition-all shadow-sm"
                          />
                        </div>
                        <div className="relative">
                          <input
                            required
                            value={inquiryData.phone}
                            onChange={(e) => setInquiryData({...inquiryData, phone: e.target.value})}
                            type="tel"
                            placeholder="WhatsApp Number"
                            className="w-full bg-white h-14 rounded-xl px-5 text-[var(--text)] text-[15px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border border-transparent transition-all shadow-sm"
                          />
                        </div>
                        <div className="relative">
                          <textarea
                            required
                            value={inquiryData.message}
                            onChange={(e) => setInquiryData({...inquiryData, message: e.target.value})}
                            rows={4}
                            placeholder="Describe your vision..."
                            className="w-full bg-white rounded-xl px-5 py-4 text-[var(--text)] text-[15px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border border-transparent transition-all shadow-sm resize-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={inquiryLoading}
                        className="w-full h-14 mt-4 rounded-xl bg-[var(--text)] text-white text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[var(--accent)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-3 shadow-md"
                      >
                        {inquiryLoading && <Loader2 size={16} className="animate-spin" />}
                        {inquiryLoading ? 'Sending...' : 'Submit Request'}
                      </button>
                    </form>
                 )}
               </div>
            </div>

          </motion.div>
        </div>
      </section>
      
      {/* ── WHATSAPP CTA (SLEEK & ELEGANT) ── */}
      <section id="bulk" className="w-full max-w-[1000px] mx-auto px-8 sm:px-12 py-16 md:py-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }} 
          whileInView={{ opacity: 1, scale: 1, y: 0 }} 
          viewport={{ once: true, margin: "-50px" }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white border border-[var(--border)] rounded-[2rem] md:rounded-full p-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm transition-all hover:shadow-md hover:border-[#25D366]/30 group"
        >
          
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0 group-hover:bg-[#25D366]/10 transition-colors duration-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] group-hover:text-[#25D366] transition-colors duration-500">
                 <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
               </svg>
            </div>
            <div>
              <h2 className="text-[var(--text)] text-[16px] font-bold tracking-tight mb-1">
                Events & Corporate Gifting
              </h2>
              <p className="text-[var(--text-muted)] text-[13px]">
                Special rates for bulk orders (25+ units). Custom designs & packaging available.
              </p>
            </div>
          </div>

          <a 
            href="https://wa.me/918300034451" 
            className="shrink-0 bg-white text-[var(--text)] border border-[var(--border)] group-hover:border-[#25D366] group-hover:text-[#25D366] group-hover:bg-[#25D366]/5 rounded-full px-8 py-3 text-[10px] tracking-[0.25em] uppercase font-bold transition-all duration-300"
          >
            Chat on WhatsApp
          </a>
        </motion.div>
      </section>
    </div>
  );
}
