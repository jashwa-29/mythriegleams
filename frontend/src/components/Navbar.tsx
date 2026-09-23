"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  ShoppingBag,
  ChevronDown,
  MapPin,
  Phone,
  Menu,
  X,
  Truck,
  Sparkles,
  Hexagon,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCollections } from "@/redux/slices/collectionSlice";
import { fetchOccasions } from "@/redux/slices/occasionSlice";
import { RootState } from "@/redux/store";

/* ────────────────────────────────────────────────────────────
   MEGA MENU STRUCTURE
   Each top-level item can have:
   - columns: array of { heading, links[] }
   - featured: optional right-rail promo card
──────────────────────────────────────────────────────────── */
const MEGA_MENU = [
  {
    label: "Occasions",
    href: "/occasion/all",
    columns: [
      {
        heading: "Celebrations",
        links: [
          { name: "Birthday", href: "/occasion/birthday" },
          { name: "Wedding", href: "/occasion/wedding" },
          { name: "Anniversary", href: "/occasion/anniversary" },
          { name: "Congratulations", href: "/occasion/congratulations" },
        ],
      },
      {
        heading: "Seasons & Events",
        links: [
          { name: "Festivals & Religious Events", href: "/occasion/festivals" },
          { name: "Housewarming", href: "/occasion/housewarming" },
          { name: "Naming Ceremony", href: "/occasion/naming-ceremony" },
          { name: "Baby Shower", href: "/occasion/baby-shower" },
        ],
      },
    ],
    featured: {
      title: "New Arrivals",
      subtitle: "Fresh from the Studio",
      href: "/category/all?sort=newest",
      img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&q=80",
    },
  },
  {
    label: "Collections",
    href: "/category/all",
    columns: [
      {
        heading: "Wall Clocks",
        links: [
          { name: "All Wall Clocks", href: "/category/wall-clocks" },
          { name: "Food-Themed Clocks", href: "/category/food-themed-clocks" },
          { name: "Custom Scenes", href: "/category/custom-scenes" },
          { name: "Name Clocks", href: "/category/name-clocks" },
        ],
      },
      {
        heading: "Art & Décor",
        links: [
          { name: "All Wall Décor", href: "/category/wall-decor" },
          { name: "Miniature Spatulas", href: "/category/mini-spatulas" },
          { name: "Kitchen Miniatures", href: "/category/kitchen-miniatures" },
          { name: "Shops & Scenes", href: "/category/shops-scenes" },
        ],
      },
      {
        heading: "Miniatures & Figures",
        links: [
          { name: "All Dolls & Figures", href: "/category/dolls-figures" },
          { name: "Acrylic Dolls", href: "/category/acrylic-dolls" },
          { name: "Fridge Magnets", href: "/category/fridge-magnets" },
          { name: "Supplies & Clay", href: "/category/supplies" },
        ],
      },
      {
        heading: "Festive",
        links: [
          { name: "Golu & Navaratri", href: "/category/golu-navaratri" },
          { name: "Navaratri Thamboolam", href: "/category/navaratri-thamboolam" },
          { name: "Golu Themes", href: "/category/golu-themes" },
          { name: "Madurai Nagaram", href: "/category/madurai-nagaram" },
        ],
      },
    ],
    featured: {
      title: "Bestsellers",
      subtitle: "Loved by Thousands",
      href: "/category/all",
      img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80",
    },
  },
];

export default function Navbar() {
  const router = useRouter();
  const { totalItems, open } = useCart();
  const dispatch = useAppDispatch();
  const { collections } = useAppSelector((state: RootState) => state.collections);
  const { occasions } = useAppSelector((state: RootState) => state.occasions);

  const [activeMega, setActiveMega] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    dispatch(fetchCollections());
    dispatch(fetchOccasions());
  }, [dispatch]);

  /* Build the Collections mega-menu columns from live categories + subcategories */
  const collectionColumns = useMemo(() => {
    const mains = collections.filter((c) => !c.parent);
    if (mains.length === 0) {
      return MEGA_MENU.find((item) => item.label === "Collections")?.columns || [];
    }
    return mains.map((main) => ({
      heading: main.name,
      href: `/category/${main.slug}`,
      links: [
        { name: `All ${main.name}`, href: `/category/${main.slug}` },
        ...collections
          .filter((c) => {
            const parentId = typeof c.parent === "object" && c.parent ? c.parent._id : c.parent;
            return parentId === main._id;
          })
          .map((c) => ({ name: c.name, href: `/category/${c.slug}` })),
      ],
    }));
  }, [collections]);

  /* Build the Occasions mega-menu columns from live occasions + subcategories */
  const occasionColumns = useMemo(() => {
    const mains = occasions.filter((o) => !o.parent);
    if (mains.length === 0) {
      return MEGA_MENU.find((item) => item.label === "Occasions")?.columns || [];
    }
    return mains.map((main) => ({
      heading: main.name,
      href: `/occasion/${main.slug}`,
      links: [
        { name: `All ${main.name}`, href: `/occasion/${main.slug}` },
        ...occasions
          .filter((o) => {
            const parentId = typeof o.parent === "object" && o.parent ? o.parent._id : o.parent;
            return parentId === main._id;
          })
          .map((o) => ({ name: o.name, href: `/occasion/${o.slug}` })),
      ],
    }));
  }, [occasions]);

  /* Sticky shadow on scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close mobile drawer when a link is clicked (accordion summaries stay open) */
  const handleDrawerLinkClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) setMobileOpen(false);
  };

  /* Hover intent for mega menu (small delay on leave to prevent flicker) */
  const handleMouseEnter = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMega(label);
  };
  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setActiveMega(null), 150);
  };

  const getItemColumns = (itemLabel: string, itemColumns: typeof MEGA_MENU[0]["columns"]) =>
    itemLabel === "Occasions"
      ? occasionColumns
      : itemLabel === "Collections"
      ? collectionColumns
      : itemColumns;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/category/all?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          HEADER WRAPPER (sticky)
      ═══════════════════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-[100] w-full transition-shadow duration-300 ${
          scrolled ? "shadow-lg" : ""
        }`}
      >
        {/* ─── TIER 1: TOP UTILITY BAR ─── */}
        <div className="hidden md:block bg-[#1f1a16] text-white">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-8 flex items-center justify-between h-9 text-[11px]">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-1.5 hover:text-[var(--accent-light)] transition-colors">
                <MapPin size={12} />
                <span className="font-medium">Where to deliver?</span>
              </button>
              <a
                href="https://wa.me/918300034451"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-[var(--accent-light)] transition-colors"
              >
                <Phone size={12} />
                <span className="font-medium">+91 83000 34451</span>
              </a>
            </div>

            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 text-[var(--accent-light)] font-semibold">
                <Sparkles size={12} />
                Free shipping above ₹999
              </span>
            </div>
          </div>
        </div>

        {/* ─── TIER 2: MAIN BAR (logo + search + actions) ─── */}
        <div className="bg-[var(--accent)] text-white">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 md:h-20 flex items-center gap-4 md:gap-8">

            {/* Mobile: hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Hexagon
                size={30}
                fill="white"
                strokeWidth={1}
                className="hidden sm:block"
              />
              <div className="flex flex-col leading-none">
                <span className="font-serif text-[20px] md:text-[24px] font-bold tracking-tight">
                  Mythris
                </span>
                <span className="text-[9px] tracking-[0.35em] uppercase text-white/80 -mt-0.5">
                  Gleams
                </span>
              </div>
            </Link>

{/* Search bar (desktop) */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden lg:flex flex-1 max-w-[480px] relative"
            >
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for gifts, occasions, collections…"
                className="w-full h-11 pl-11 pr-4 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white placeholder:text-white/60 text-[13px] focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all"
              />
            </form>

            {/* Nav links (desktop, inline in header) */}
            <ul
              className="hidden lg:flex items-stretch gap-1"
              onMouseLeave={handleMouseLeave}
            >
              {MEGA_MENU.map((item) => (
                <li key={item.label} className="relative flex items-stretch">
                  <Link
                    href={item.href}
                    onMouseEnter={() => handleMouseEnter(item.label)}
                    className={`flex items-center gap-1 px-3 py-2 text-[13px] font-semibold tracking-wide whitespace-nowrap transition-colors ${
                      activeMega === item.label
                        ? "text-white"
                        : "text-white/85 hover:text-white"
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        activeMega === item.label ? "rotate-180" : ""
                      }`}
                    />
                  </Link>

                  {/* Mega menu panel */}
                  {activeMega === item.label && item.columns && (
                    <div
                      onMouseEnter={() => handleMouseEnter(item.label)}
                      className="absolute left-1/2 -translate-x-1/2 top-full pt-0 z-50"
                    >
                      <div
                        className={`bg-white border border-[var(--border)] shadow-2xl rounded-b-2xl p-8 ${
                          item.label === "Collections" || item.label === "Occasions"
                            ? "w-[860px] grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-7"
                            : "w-[720px] flex gap-8"
                        }`}
                      >
                        {/* Columns */}
                        {getItemColumns(item.label, item.columns).map((col, ci) => (
                          <div key={ci} className="min-w-0">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
                              {col.heading}
                            </h4>
                            <ul className="space-y-2">
                              {col.links.map((l) => (
                                <li key={l.name}>
                                  <Link
                                    href={l.href}
                                    className="text-[12px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors block leading-snug"
                                  >
                                    {l.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}

                        {/* Featured card */}
                        {item.label !== "Collections" && item.label !== "Occasions" && item.featured && (
                          <div className="w-[220px] shrink-0">
                            <Link
                              href={item.featured.href}
                              className="group block rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-subtle)]"
                            >
                              <div className="aspect-[4/3] overflow-hidden">
                                <img
                                  src={item.featured.img}
                                  alt={item.featured.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                              </div>
                              <div className="p-4">
                                <p className="text-[13px] font-bold text-[var(--text)] leading-tight">
                                  {item.featured.title}
                                </p>
                                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                  {item.featured.subtitle}
                                </p>
                                <span className="inline-block mt-2 text-[10px] font-bold tracking-wider uppercase text-[var(--accent)] group-hover:underline">
                                  Explore →
                                </span>
                              </div>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}

              {/* Contact Us */}
              <li className="relative flex items-stretch">
                <Link
                  href="/contact"
                  className="flex items-center gap-1 px-3 py-2 text-[13px] font-semibold tracking-wide whitespace-nowrap text-white/85 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>

            {/* Right actions */}
            <div className="flex items-center gap-1 md:gap-2 ml-auto">
              {/* Mobile: search toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {/* Account */}
              <Link
                href="/account"
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <User size={18} />
                <span className="text-[12px] font-medium hidden md:inline">
                  Account
                </span>
              </Link>

              {/* Cart */}
              <button
                onClick={open}
                className="relative flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag size={18} />
                <span className="text-[12px] font-medium hidden md:inline">
                  Cart
                </span>
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 md:top-1 md:right-1 bg-white text-[var(--accent)] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile search bar (expands) */}
          {searchOpen && (
            <div className="lg:hidden border-t border-white/20 px-4 pb-3">
              <form onSubmit={handleSearchSubmit} className="relative mt-3">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
                />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search gifts…"
                  className="w-full h-11 pl-11 pr-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 text-[13px] focus:outline-none focus:bg-white/20"
                />
              </form>
            </div>
          )}
        </div>

        </header>

      {/* ══════════════════════════════════════════════════════════
          SPACER (push content below fixed header)
      ═══════════════════════════════════════════════════════════ */}
      <div className="h-[64px] md:h-[116px]" aria-hidden />

      {/* ══════════════════════════════════════════════════════════
          MOBILE DRAWER
      ═══════════════════════════════════════════════════════════ */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998] lg:hidden"
          />
          <div className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[340px] bg-white z-[999] lg:hidden overflow-y-auto"
            onClick={handleDrawerLinkClick}
          >
            {/* Drawer header */}
            <div className="bg-[var(--accent)] text-white p-5 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Hexagon size={24} fill="white" strokeWidth={1} />
                <span className="font-serif text-[18px] font-bold">
                  Mythris Gleams
                </span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick links */}
            <div className="p-4 border-b border-[var(--border)]">
              <Link
                href="/account/orders"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <Truck size={18} className="text-[var(--accent)]" />
                <span className="text-[14px] font-medium">Track Order</span>
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <Phone size={18} className="text-[var(--accent)]" />
                <span className="text-[14px] font-medium">Contact Us</span>
              </Link>
            </div>

            {/* Accordion nav */}
            <nav className="p-4">
              {MEGA_MENU.map((item) => (
                <details key={item.label} className="group border-b border-[var(--bg-subtle)]">
                  <summary className="flex items-center justify-between py-4 cursor-pointer list-none">
                    <span className="text-[14px] font-semibold text-[var(--text)]">
                      {item.label}
                    </span>
                    <ChevronDown
                      size={16}
                      className="text-[var(--text-muted)] group-open:rotate-180 transition-transform"
                    />
                  </summary>
                  <div className="pb-3 pl-2">
                    {getItemColumns(item.label, item.columns).map((col, ci) => (
                      <div key={ci} className="mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-2">
                          {col.heading}
                        </p>
                        <ul className="space-y-2">
                          {col.links.map((l) => (
                            <li key={l.name}>
                              <Link
                                href={l.href}
                                className="text-[13px] text-[var(--text-muted)] block py-1"
                              >
                                {l.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </nav>

            {/* Drawer footer CTA */}
            <div className="p-4 bg-[var(--bg-subtle)]">
              <a
                href="https://wa.me/918300034451"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 bg-[var(--accent)] text-white rounded-full text-[12px] font-bold tracking-widest uppercase"
              >
                <Phone size={14} /> WhatsApp Us
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}