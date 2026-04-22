"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";
import ProductCard from "@/components/ProductCard";
import Hero from "@/components/Hero";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchProducts } from "@/redux/slices/productSlice";
import { fetchCollections } from "@/redux/slices/collectionSlice";
import { createInquiry } from "@/redux/slices/inquirySlice";
import { RootState } from "@/redux/store";
import { Sparkles, Loader2, Package, CheckCircle2 } from "lucide-react";
import { Product } from "@/data/products";

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
    return () => observer.disconnect();
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
    <div className="flex flex-col gap-24 font-sans">
      <Hero />

      {/* MARQUEE SECTION */}
      <section className="bg-brown overflow-hidden py-4 border-y border-border">
        <div className="flex gap-12 whitespace-nowrap animate-marquee">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="flex items-center gap-8 text-gold-light text-[0.78rem] tracking-[0.14em] uppercase font-sans font-medium">
              <span>✦ Hand-Crafted with Soul</span>
              <span>✦ Perfect for Gifting</span>
              <span>✦ Miniatures That Wow</span>
              <span>✦ Pan-India Shipping</span>
            </div>
          ))}
        </div>
      </section>

      {/* COLLECTIONS / GALLERIES SECTION */}
      <section className="max-w-[1320px] mx-auto px-8 w-full reveal">
        <SectionHeader 
          eyebrow="Curated Galleries"
          title="Explore Our Artisanal Collections"
          subtitle="Discover miniatures categorized by theme, from traditional food replicas to modern lifestyle clocks."
        />
        
        {collectionsLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gold" /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {collections.map((col: any) => (
                    <Link 
                        key={col._id} 
                        href={`/category/${col.slug}`}
                        className="group relative h-[300px] rounded-[2.5rem] overflow-hidden border border-border shadow-sm hover:border-gold transition-all"
                    >
                        {col.image ? (
                            <img src={col.image} alt={col.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full bg-zinc-50 flex items-center justify-center text-zinc-200"><Package size={48} /></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-8 left-8 text-white">
                            <h3 className="text-xl font-bold font-serif italic">{col.name}</h3>
                            <p className="text-[10px] uppercase font-black tracking-widest text-white/70 mt-1">Explore Collection →</p>
                        </div>
                    </Link>
                ))}
            </div>
        )}
      </section>

      {/* BEST SELLERS SECTION */}
      <section id="products" className="max-w-[1320px] mx-auto px-8 w-full scroll-m-20 reveal">
        <SectionHeader
          eyebrow="Top picks"
          title="Best Selling Miniatures"
          subtitle="Our most loved creations that have stolen hearts across the country. Hand-picked for you."
          btnLabel="View All"
          btnHref="/category/all"
        />
        
        {productsLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gold" /></div>
        ) : products.length === 0 ? (
            <div className="py-20 text-center text-zinc-400 font-medium italic">No products found in the vault yet.</div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product: Product) => (
                    <ProductCard key={product._id || (product as any).id} product={product} />
                ))}
            </div>
        )}
      </section>

      {/* STORY SECTION */}
      <section className="max-w-[1320px] mx-auto px-8 py-24 bg-white rounded-[2.5rem] mt-8 shadow-sm reveal">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden bg-gradient-to-br from-blush via-bisque to-blush flex items-center justify-center text-[8rem] group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(92,58,46,0.15)] transition-opacity duration-300 group-hover:opacity-60" />
            🏺
            <div className="absolute -bottom-5 -right-5 w-30 h-30 bg-gold rounded-full flex flex-col items-center justify-center font-serif text-white text-center leading-none text-[0.85rem] font-semibold shadow-[0_8px_30px_rgba(212,175,55,0.4)]">
              Since <span>2018</span>
            </div>
          </div>
          <div className="flex flex-col gap-8">
            <SectionHeader
              eyebrow="Our story"
              title="A Hand-Made Craft From Chennai To All Over India"
              subtitle="Uma Gayathri founded Mythris Gleams with a simple vision: to turn memories into lasting miniature art. Today, we've delivered thousands of smiles across the country."
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { emoji: "👐", title: "Hand sculpted", text: "Every part is shaped by hand, no molds used for main designs." },
                { emoji: "🖌️", title: "Hand painted", text: "Vibrant and delicate detailing using top quality colors." },
                { emoji: "🎁", title: "Personalized", text: "Themes, names, and concepts tailored to your story." },
                { emoji: "💎", title: "Premium clay", text: "High grade air-dry and polymer clay for durability." },
              ].map((feature, i) => (
                <div key={i} className="bg-bg p-5 rounded-[16px] border border-border group hover:border-gold hover:translate-x-1 transition-all duration-300">
                  <span className="text-2xl mb-1 block">{feature.emoji}</span>
                  <h4 className="font-serif text-base font-semibold text-brown mb-1">{feature.title}</h4>
                  <p className="text-[0.78rem] text-txt-muted leading-relaxed font-sans">{feature.text}</p>
                </div>
              ))}
            </div>
            
            <Link 
              href="/about" 
              className="mt-4 bg-brown text-white w-max px-8 py-3 rounded-full text-[0.85rem] tracking-wider uppercase hover:bg-gold transition-colors font-medium"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* CUSTOM SECTION */}
      <section id="custom" className="bg-brown-light/10 py-24 rounded-[3rem] max-w-[1400px] mx-auto px-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-brown/5 via-gold/5 to-brown/5 opacity-50 pointer-events-none" />
        <div className="max-w-[1320px] mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-10">
              <SectionHeader
                eyebrow="Made for you"
                title="Your Story, Scaled Down to Miniature"
                subtitle="Want something truly unique? We create fully custom miniatures based on your favorite food, pets, hobbies or memories."
              />
              
              <div className="flex flex-col gap-6">
                {[
                  { step: "1", title: "Idea sharing", text: "Tell us your theme, concept or send photos." },
                  { step: "2", title: "Sketch & Design", text: "We finalize the layout and miniature details." },
                  { step: "3", title: "Hand Sculpting", text: "We carefully shape and paint your piece." },
                  { step: "4", title: "Doorstep Delivery", text: "Shipped securely to your home." },
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-full border-1.5 border-gold flex items-center justify-center font-serif text-gold shrink-0 text-base">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="font-serif text-[1.05rem] font-semibold text-brown mb-0.5">{s.title}</h4>
                      <p className="text-[0.78rem] text-txt-muted font-sans font-light">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-border p-10 shadow-lg group-hover:border-gold/50 transition-all duration-500">
               {inquirySuccess ? (
                  <div className="py-20 text-center flex flex-col items-center gap-6">
                    <CheckCircle2 size={64} className="text-emerald-500" />
                    <h3 className="font-serif text-3xl font-black text-brown italic leading-tight">Vision Captured!</h3>
                    <p className="text-txt-muted text-sm max-w-[300px]">Uma Gayathri will reach out to you via WhatsApp shortly to begin the collaboration.</p>
                  </div>
               ) : (
                  <form onSubmit={handleInquirySubmit} className="flex flex-col gap-5">
                    <h3 className="font-serif text-2xl font-semibold text-brown mb-8 text-center italic">Initiate Custom Narrative</h3>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.75rem] tracking-wider uppercase text-txt-muted font-medium ml-1">Your Identity</label>
                      <input 
                        required
                        value={inquiryData.name}
                        onChange={(e) => setInquiryData({...inquiryData, name: e.target.value})}
                        type="text" 
                        placeholder="e.g. Master Chef John" 
                        className="bg-white w-full h-12 rounded-xl px-4 border border-border focus:border-gold outline-none transition-all font-sans text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.75rem] tracking-wider uppercase text-txt-muted font-medium ml-1">WhatsApp Narrative Hub</label>
                      <input 
                        required
                        value={inquiryData.phone}
                        onChange={(e) => setInquiryData({...inquiryData, phone: e.target.value})}
                        type="tel" 
                        placeholder="e.g. 98765 43210" 
                        className="bg-white w-full h-12 rounded-xl px-4 border border-border focus:border-gold outline-none transition-all font-sans text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.75rem] tracking-wider uppercase text-txt-muted font-medium ml-1">The Artisanal Vision</label>
                      <textarea 
                        required
                        value={inquiryData.message}
                        onChange={(e) => setInquiryData({...inquiryData, message: e.target.value})}
                        rows={3} 
                        placeholder="Describe your dream artisanal miniature..." 
                        className="bg-white w-full rounded-xl px-4 py-3 border border-border focus:border-gold outline-none transition-all font-sans text-sm resize-none"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={inquiryLoading}
                      className="bg-brown text-white h-12 rounded-full uppercase tracking-widest text-[0.8rem] font-black hover:bg-gold transition-all mt-2 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {inquiryLoading && <Loader2 size={16} className="animate-spin" />}
                      <span>{inquiryLoading ? 'Disseminating...' : 'Submit Vision 💬'}</span>
                    </button>
                  </form>
               )}
            </div>
          </div>
        </div>
      </section>
      
      {/* WHATSAPP CTA */}
      <section id="bulk" className="max-w-[1320px] mx-auto px-8 mb-16">
        <div className="bg-brown rounded-[2.5rem] overflow-hidden relative group">
          <div className="absolute inset-0 bg-[#25D366] translate-y-[102%] group-hover:translate-y-0 transition-transform duration-700 ease-in-out -z-1" />
          <div className="px-10 py-16 text-center flex flex-col items-center gap-6 z-10 relative">
            <div className="text-gold group-hover:text-white transition-colors duration-500 font-serif italic text-xl">
              Planning for a wedding, birthday or event?
            </div>
            <h2 className="text-white text-[clamp(2rem,4vw,3.5rem)] font-serif font-semibold leading-tight max-w-[800px]">
              Bulk Orders & Corporate Gifting Available India-Wide
            </h2>
            <p className="text-white/70 group-hover:text-white text-base leading-relaxed max-w-[600px] transition-colors duration-500">
               Special rates for bulk orders (25+ units). Custom designs and packaging to suit your occasion. Let's make it memorable together.
            </p>
            <a 
              href="https://wa.me/918300034451" 
              className="bg-white text-brown group-hover:bg-brown group-hover:text-white rounded-full px-10 py-4 text-[0.88rem] tracking-widest uppercase font-sans font-bold shadow-lg transition-all transform hover:scale-110 active:scale-95"
            >
              Chat on WhatsApp 💬
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
