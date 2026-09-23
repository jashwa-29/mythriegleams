"use client";

import Link from "next/link";
import Image from "next/image";
import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const { collections } = useAppSelector((state: RootState) => state.collections);

  // Fallback collections based on Excel catalogs
  const displayCollections = collections.length > 0 
    ? collections.slice(0, 6) 
    : [
        { name: "Navaratri Miniature Shops", slug: "miniature-shops" },
        { name: "Miniature Fruit Baskets", slug: "fruit-baskets" },
        { name: "Miniature Vegetable Crates", slug: "vegetable-crates" },
        { name: "Navaratri Thamboolam Sets", slug: "navaratri-thamboolam" },
        { name: "Heritage Wall Clocks", slug: "wall-clocks" },
        { name: "Clay Fridge Magnets", slug: "fridge-magnets" },
      ];

  return (
    <footer className="bg-[var(--text)] text-white pt-16 md:pt-24 pb-8 border-t border-[var(--border)] relative overflow-hidden">
      
      {/* Massive Brand Watermark */}
      <div className="absolute top-0 left-0 w-full flex justify-center pointer-events-none select-none overflow-hidden opacity-5">
        <h2 className="font-serif text-[18vw] leading-[0.8] tracking-tighter uppercase whitespace-nowrap pt-8">
          Mythris Gleams
        </h2>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
        
        {/* Top Header Row with Mascot Logo */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-8 border-b border-white/10 pb-12 mb-14">
          <Link href="/" className="flex items-center gap-4 text-center md:text-left group">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--accent-gold)] bg-black shadow-lg shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="Mythris Gleams"
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-white group-hover:text-[var(--accent-gold)] transition-colors">
                Mythris <span className="text-[var(--accent-gold)]">Gleams</span>
              </span>
              <span className="text-[10px] tracking-[0.25em] uppercase text-white/70">
                Handcrafted Clay Art • Chennai, India
              </span>
            </div>
          </Link>
          
          {/* Social Icons */}
          <div className="flex gap-4">
            <a href="https://instagram.com/mythrisgleams" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-[var(--text)] transition-all duration-300 hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="https://facebook.com/mythrisgleams" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-[var(--text)] transition-all duration-300 hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://youtube.com/mythrisgleams" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-[var(--text)] transition-all duration-300 hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.1C2.1 8.4 2 10.2 2 12s.1 3.6.5 4.9a3.2 3.2 0 0 0 2.2 2.2C6 19.5 12 19.5 12 19.5s6 0 7.3-.4a3.2 3.2 0 0 0 2.2-2.2C21.9 15.6 22 13.8 22 12s-.1-3.6-.5-4.9a3.2 3.2 0 0 0-2.2-2.2C18 4.5 12 4.5 12 4.5s-6 0-7.3.4A3.2 3.2 0 0 0 2.5 7.1z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
            </a>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-20">
          
          {/* About */}
          <div className="lg:pr-8">
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--accent-light)] mb-8">
              The Artisan
            </h4>
            <p className="text-[14px] text-white/80 leading-[1.8] font-light">
              Handcrafting souls into clay pieces. Every miniature, every gift is meticulously sculpted and painted by Uma Gayathri in her studio, designed to evoke nostalgia and wonder.
            </p>
          </div>

          {/* Collections */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--accent-light)] mb-8">
              Curated Collections
            </h4>
            <ul className="flex flex-col gap-5">
              {displayCollections.map((col: any) => (
                <li key={col.slug}>
                  <Link href={`/category/${col.slug}`} className="text-[14px] text-white/90 hover:text-[var(--accent-light)] hover:pl-2 transition-all duration-300 font-light block w-max">
                    {col.name}
                  </Link>
                </li>
              ))}
              <li className="pt-3">
                <Link href="/category/all" className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/80 hover:text-white transition-colors duration-300 border-b border-transparent hover:border-white pb-1">
                  Explore All →
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--accent-light)] mb-8">
              Client Care
            </h4>
            <ul className="flex flex-col gap-5">
              {[
                { name: "Track Order", href: "/account/orders" },
                { name: "Custom Orders", href: "/#custom" },
                { name: "Bulk Gifting", href: "/#bulk" },
                { name: "Shipping Policy", href: "/#shipping" },
                { name: "Care Instructions", href: "/#care" },
                { name: "Contact Us", href: "/contact" },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-[14px] text-white/90 hover:text-[var(--accent-light)] hover:pl-2 transition-all duration-300 font-light block w-max">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Studio */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--accent-light)] mb-8">
              The Studio
            </h4>
            <div className="flex flex-col gap-6 text-[14px] text-white/80 font-light">
              <div className="flex items-start gap-4 hover:text-[var(--accent-light)] transition-colors duration-300 cursor-default">
                <MapPin size={18} className="shrink-0 text-white/60 mt-1" strokeWidth={1.5} />
                <p className="leading-relaxed">Mythris Gleams Studio,<br />Chrompet, Chennai,<br />Tamil Nadu - 600044</p>
              </div>
              <div className="flex items-center gap-4 hover:text-[var(--accent-light)] transition-colors duration-300 cursor-default">
                <Mail size={18} className="shrink-0 text-white/60" strokeWidth={1.5} />
                <p>mythrisgleams@gmail.com</p>
              </div>
              <div className="flex items-center gap-4 hover:text-[var(--accent-light)] transition-colors duration-300 cursor-default">
                <Phone size={18} className="shrink-0 text-white/60" strokeWidth={1.5} />
                <p>+91 83000 34451</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 pt-8 pb-4 mt-auto">
        <div className="max-w-[1440px] mx-auto px-8 sm:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[11px] tracking-[0.15em] text-white/60 text-center md:text-left font-semibold uppercase">
            © {new Date().getFullYear()} MYTHRIS GLEAMS. ALL RIGHTS RESERVED. <br className="md:hidden" />
            <span className="hidden md:inline"> · </span> HANDCRAFTED IN INDIA.
          </p>
          <div className="flex gap-8">
            <Link href="/#privacy" className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60 hover:text-[var(--accent-light)] transition-colors duration-300">Privacy Policy</Link>
            <Link href="/#terms" className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60 hover:text-[var(--accent-light)] transition-colors duration-300">Terms of Service</Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
