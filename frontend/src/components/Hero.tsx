"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const Hero = () => {
  const [time, setTime] = useState("12:00");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let h = now.getHours();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setTime(`${h}:${m}:${s} ${ampm}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[calc(100svh-110px)] min-h-[680px] flex items-center overflow-hidden bg-bg" id="hero">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_70%_50%,rgba(212,175,55,0.18)_0%,transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_20%_80%,rgba(232,207,207,0.35)_0%,transparent_55%)]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5ede3] via-bg to-[#f0e4d3]"></div>
      </div>

      {/* Decorative Animated Rings */}
      <div className="absolute top-[20%] -right-20 w-[450px] h-[450px] border border-gold/20 rounded-full animate-[rotate-cw_25s_linear_infinite] z-0"></div>
      <div className="absolute top-[35%] -right-44 w-[650px] h-[650px] border border-gold/10 rounded-full animate-[rotate-ccw_35s_linear_infinite] z-0"></div>

      <div className="relative z-10 w-full max-w-[1320px] mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Hero Content */}
          <div className="flex flex-col items-start max-w-[620px]">
            <div className="flex items-center gap-3 text-[0.72rem] tracking-[0.32em] uppercase text-gold mb-8 font-sans font-medium reveal visible">
              <span className="w-10 h-[1px] bg-gold"></span>
              Handmade in India
            </div>
            
            <h1 className="text-[clamp(2.6rem,5.8vw,4.4rem)] font-serif font-normal leading-[1.08] text-brown-dark mb-8 reveal visible reveal-delay-1">
              Handcrafted <span className="italic text-gold">Miniature Food Clock</span> & Unique Gift Items
            </h1>
            
            <p className="text-[1.08rem] text-text-muted leading-relaxed mb-10 max-w-[500px] reveal visible reveal-delay-2">
              Each piece tells a story. Our collection brings art to your walls — meticulously sculpted by hand, designed to delight, and perfect for gifting.
            </p>
            
            <div className="flex flex-wrap gap-5 reveal visible reveal-delay-3">
              <Link 
                href="#products" 
                className="inline-flex items-center gap-2 bg-brown text-white px-11 py-4.5 rounded-lg text-[0.82rem] tracking-widest uppercase hover:bg-gold hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-brown/10 font-bold"
              >
                Shop Now ↓
              </Link>
              <Link 
                href="#custom" 
                className="inline-flex items-center gap-2 border-2 border-brown text-brown px-11 py-4.5 rounded-lg text-[0.82rem] tracking-widest uppercase hover:bg-brown hover:text-white hover:-translate-y-1 transition-all duration-300 font-bold"
              >
                Custom Orders
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Visual (Plate & Clock) */}
          <div className="hidden lg:flex justify-end items-center relative order-last pr-4">
            <div className="relative w-full max-w-[480px] aspect-square rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff9f0,#f0e4d3_70%,#e8d5c0)] shadow-[0_50px_110px_rgba(92,58,46,0.35),0_12px_45px_rgba(212,175,55,0.4),inset_0_-10px_40px_rgba(92,58,46,0.12)] flex items-center justify-center animate-hero-float pointer-events-none">
              
              {/* Inner Plate Details */}
              <div className="absolute inset-[8%] border-2 border-gold/45 rounded-full animate-[rotate-cw_40s_linear_infinite]"></div>
              <div className="absolute inset-[15%] border border-gold/30 rounded-full animate-[rotate-ccw_30s_linear_infinite]"></div>
              
              {/* Orbiting Food Items (Orbiting Container) */}
              <div className="absolute inset-[-12%] flex items-center justify-center animate-[rotate-cw_20s_linear_infinite]">
                 {/* Each item counter-rotates to stay upright */}
                 <div className="absolute top-0 left-[50%] -translate-x-1/2 -translate-y-1/2 animate-[rotate-ccw_20s_linear_infinite]">
                    <span className="text-6xl animate-orbit-food drop-shadow-2xl inline-block">🍰</span>
                 </div>
                 <div className="absolute top-[50%] right-0 translate-x-1/2 -translate-y-1/2 animate-[rotate-ccw_20s_linear_infinite]">
                    <span className="text-6xl animate-orbit-food [animation-delay:-3s] drop-shadow-2xl inline-block">🧁</span>
                 </div>
                 <div className="absolute bottom-0 left-[50%] -translate-x-1/2 translate-y-1/2 animate-[rotate-ccw_20s_linear_infinite]">
                    <span className="text-6xl animate-orbit-food [animation-delay:-6s] drop-shadow-2xl inline-block">🍩</span>
                 </div>
                 <div className="absolute top-[50%] left-0 -translate-x-1/2 -translate-y-1/2 animate-[rotate-ccw_20s_linear_infinite]">
                    <span className="text-6xl animate-orbit-food [animation-delay:-9s] drop-shadow-2xl inline-block">🍓</span>
                 </div>
              </div>

              {/* Real Clock Face */}
              <div className="w-[62%] aspect-square rounded-full bg-gradient-to-br from-[#fff6e6] to-[#ffedc0] shadow-[0_14px_45px_rgba(92,58,46,0.3),inset_0_2px_12px_rgba(255,255,255,1)] flex items-center justify-center relative">
                <div className="text-center">
                  <div className="font-sans text-[1.8rem] font-bold text-brown tracking-tighter transition-all duration-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {time}
                  </div>
                  <div className="text-[0.78rem] text-gold tracking-[0.28em] uppercase mt-2 font-sans font-medium">
                    Mythris Gleams
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-[0.68rem] tracking-[0.3em] uppercase text-text-muted z-20">
        <div className="w-[1px] h-14 bg-gradient-to-b from-gold via-gold/50 to-transparent animate-scroll-drop"></div>
        Scroll
      </div>
    </section>
  );
};

export default Hero;
