"use client";

import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";

export default function Footer() {
  const { collections } = useAppSelector((state: RootState) => state.collections);

  // Fallback collections if none are fetched yet
  const displayCollections = collections.length > 0 
    ? collections.slice(0, 5) 
    : [
        { name: "Miniature Food Clocks", slug: "miniature-food-clocks" },
        { name: "Kawaii Collections", slug: "kawaii-collections" },
        { name: "Personalized Gifts", slug: "personalized-gifts" },
        { name: "Jewellery", slug: "jewellery" },
      ];

  return (
    <footer className="bg-brown text-white/70 mt-16">
      <div className="max-w-[1320px] mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="flex flex-col gap-6">
          <Link href="/" className="flex flex-col items-start no-underline shrink-0">
            <span className="font-serif font-semibold text-[1.4rem] text-gold-light tracking-wide leading-none">
              Mythris Gleams
            </span>
            <span className="text-[0.58rem] tracking-[0.22em] text-white/50 uppercase mt-0.5">
              Handcrafted in India
            </span>
          </Link>
          <p className="text-[0.88rem] leading-relaxed text-white/60">
            Handcrafting souls into clay pieces. Every miniature, every gift is 
            meticulously sculpted and painted by Uma Gayathri in her Chennai studio.
          </p>
          <div className="flex gap-4">
            <a href="https://instagram.com/mythrisgleams" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-gold-light hover:text-gold-light transition-all" title="Instagram">📸</a>
            <a href="https://facebook.com/mythrisgleams" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-gold-light hover:text-gold-light transition-all" title="Facebook">📘</a>
            <a href="https://youtube.com/mythrisgleams" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-gold-light hover:text-gold-light transition-all" title="YouTube">🎥</a>
          </div>
        </div>

        <div>
          <h4 className="text-gold-light text-[0.7rem] tracking-[0.2em] uppercase font-sans font-semibold mb-8">
            Collections
          </h4>
          <ul className="flex flex-col gap-4">
            {displayCollections.map((col: any) => (
              <li key={col.slug}>
                <Link href={`/category/${col.slug}`} className="text-[0.88rem] hover:text-gold-light transition-colors">
                  {col.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/category/all" className="text-[0.88rem] hover:text-gold-light transition-colors">
                View All
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-gold-light text-[0.7rem] tracking-[0.2em] uppercase font-sans font-semibold mb-8">
            Support
          </h4>
          <ul className="flex flex-col gap-4">
            {[
              { name: "Track Order", href: "/account/orders" },
              { name: "Custom Orders", href: "/#custom" },
              { name: "Bulk Gifting", href: "/#bulk" },
              { name: "Shipping Policy", href: "/#shipping" },
              { name: "Care Instructions", href: "/#care" },
              { name: "Contact Us", href: "/contact" },
            ].map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="text-[0.88rem] hover:text-gold-light transition-colors">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-gold-light text-[0.7rem] tracking-[0.2em] uppercase font-sans font-semibold mb-8">
            The Studio
          </h4>
          <div className="text-[0.88rem] text-white/60 leading-relaxed space-y-4">
            <p>Mythris Gleams Studio,<br />Chrompet, Chennai,<br />Tamil Nadu - 600044</p>
            <p>Mon - Sun: 10:00 AM - 8:00 PM</p>
            <p className="flex items-center gap-3">
              <span className="text-gold-light">✉️</span> mythrisgleams@gmail.com
            </p>
            <p className="flex items-center gap-3">
              <span className="text-gold-light">📞</span> +91 83000 34451
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-8 py-8 md:py-6">
        <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[0.78rem] text-white/40 text-center md:text-left">
            © {new Date().getFullYear()} <span className="text-gold-light">Mythris Gleams</span>. All rights reserved. 
            Handcrafted with ❤️ by Uma Gayathri · Chennai, India.
          </p>
          <div className="flex gap-6">
            <Link href="/#privacy" className="text-[0.7rem] tracking-[0.1em] uppercase text-white/30 hover:text-white/60">Privacy Policy</Link>
            <Link href="/#terms" className="text-[0.7rem] tracking-[0.1em] uppercase text-white/30 hover:text-white/60">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
