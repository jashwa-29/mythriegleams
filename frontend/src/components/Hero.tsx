"use client";

import React from "react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section 
      className="relative w-full min-h-[100svh] flex items-center justify-center overflow-hidden bg-fixed bg-cover bg-center bg-no-repeat" 
      style={{ backgroundImage: "url('/sofa-bg.jpg')" }}
      id="hero"
    >
      {/* Subtle overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/10 mix-blend-multiply z-0"></div>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-8 sm:px-12 h-full flex flex-col md:flex-row pt-32 pb-12">
        
        {/* ── Left Side: Glass Typography Panel ── */}
        <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center h-full min-h-[60vh]">
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/10 backdrop-blur-xl border border-white/30 rounded-[1.5rem] p-10 md:p-14 shadow-2xl flex flex-col items-start relative z-20"
          >
            
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-white/70 text-[10px] font-bold tracking-[0.25em] uppercase mb-4 block"
            >
              Handmade in India
            </motion.span>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="text-white text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-tight mb-6"
            >
              Handcrafted Miniature <br /> Food Clock & <br /> Unique Gift Items
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-white/80 text-[15px] leading-relaxed mb-10 max-w-sm"
            >
              Each piece tells a story. Our collection brings art to your walls — meticulously sculpted by hand, designed to delight, and perfect for gifting.
            </motion.p>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="px-8 py-3 rounded-full border border-white text-white text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors duration-300"
            >
              Shop Now
            </motion.button>
            
          </motion.div>
        </div>

        {/* ── Right Side Bottom: 3 Feature Cards ── */}
        <div className="w-full md:w-[55%] lg:w-[60%] flex items-end justify-end mt-12 md:mt-0 relative z-20">
          <div className="flex flex-wrap md:flex-nowrap items-end gap-4">

            {/* Card 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-36 h-44 md:w-40 md:h-48 overflow-hidden rounded-2xl shadow-xl hover:-translate-y-2 transition-transform duration-300 cursor-pointer group border border-white/20"
            >
              <img
                src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&q=80"
                alt="Wooden Products"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
              <span className="absolute bottom-4 left-0 right-0 text-center text-white text-[10px] font-bold tracking-[0.2em] uppercase">Products</span>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-36 h-44 md:w-40 md:h-48 overflow-hidden rounded-2xl shadow-xl hover:-translate-y-2 transition-transform duration-300 cursor-pointer group border border-white/20"
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
                alt="Features"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                style={{ filter: "sepia(0.3) saturate(0.8)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
              <span className="absolute bottom-4 left-0 right-0 text-center text-white text-[10px] font-bold tracking-[0.2em] uppercase">Features</span>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-36 h-44 md:w-40 md:h-48 overflow-hidden rounded-2xl shadow-xl hover:-translate-y-2 transition-transform duration-300 cursor-pointer group border border-white/20"
            >
              <img
                src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80"
                alt="Bio Plates"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
              <span className="absolute bottom-4 left-0 right-0 text-center text-white text-[10px] font-bold tracking-[0.2em] uppercase">Bio</span>
            </motion.div>

          </div>
        </div>

      </div>
    </section>
  );
}
