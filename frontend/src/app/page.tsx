"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchProducts } from "@/redux/slices/productSlice";
import { fetchCollections } from "@/redux/slices/collectionSlice";
import { fetchOccasions } from "@/redux/slices/occasionSlice";
import { RootState } from "@/redux/store";
import { getImageUrl } from "@/utils/getImageUrl";
import ProductCard from "@/components/ProductCard";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowRight,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   STATIC DATA (Categories / Occasions / Vibes)
   — Replace images with your real ones from the backend later
──────────────────────────────────────────────────────────── */

const SHOP_BY_CATEGORIES = [
  {
    name: "Wall Clocks",
    slug: "wall-clocks",
    img: "https://images.unsplash.com/photo-1563861826-1efe393625ef?w=500&q=85",
  },
  {
    name: "Art & Wall Décor",
    slug: "wall-decor",
    img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=85",
  },
  {
    name: "Shops & Scenes",
    slug: "shops-scenes",
    img: "https://images.unsplash.com/photo-1593306449620-88b0e3c59869?w=500&q=85",
  },
  {
    name: "Golu & Navaratri",
    slug: "golu-navaratri",
    img: "https://images.unsplash.com/photo-1604608672516-f1b9b1a0ef30?w=500&q=85",
  },
  {
    name: "Dolls & Figures",
    slug: "dolls-figures",
    img: "https://images.unsplash.com/photo-1611145434331-c4b4a7a1d5f8?w=500&q=85",
  },
  {
    name: "Fridge Magnets",
    slug: "fridge-magnets",
    img: "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=500&q=85",
  },
  {
    name: "Supplies",
    slug: "supplies",
    img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&q=85",
  },
];

const SHOP_BY_OCCASION = [
  {
    name: "Birthday",
    slug: "birthday",
    tag: "Popular",
    img: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&q=85",
  },
  {
    name: "Wedding",
    slug: "wedding",
    tag: "Love",
    img: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&q=85",
  },
  {
    name: "Anniversary",
    slug: "anniversary",
    tag: "New",
    img: "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=500&q=85",
  },
  {
    name: "Housewarming",
    slug: "housewarming",
    tag: "Trending",
    img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&q=85",
  },
  {
    name: "Naming Ceremony",
    slug: "naming-ceremony",
    tag: "New Born",
    img: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500&q=85",
  },
  {
    name: "Baby Shower",
    slug: "baby-shower",
    tag: "Cute",
    img: "https://images.unsplash.com/photo-1544126592-807ade215a0b?w=500&q=85",
  },
  {
    name: "Congratulations",
    slug: "congratulations",
    tag: "Just Because",
    img: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=500&q=85",
  },
  {
    name: "Festivals",
    slug: "festivals",
    tag: "Diwali",
    img: "https://images.unsplash.com/photo-1604608672516-f1b9b1a0ef30?w=500&q=85",
  },
];

const PROMO_SLIDES = [
  {
    eyebrow: "Birthday Joy,",
    title: "Gift-wrapped",
    subtitle: "Curated birthday gifts for thoughtful celebrations.",
    cta: "Order Now",
    href: "/occasion/birthday",
    bgImage: "/miniature-clock-bg.jpg",
  },
  {
    eyebrow: "Handcrafted,",
    title: "Made for You",
    subtitle: "Every miniature piece sculpted by hand — unique, timeless, unforgettable.",
    cta: "Explore Collection",
    href: "/category/all",
    bgImage: "/miniature-clock-bg.jpg",
  },
  {
    eyebrow: "Festive Season,",
    title: "Celebrate in Style",
    subtitle: "Discover our curated collection for Diwali, Navaratri, and every festival.",
    cta: "Shop Festive",
    href: "/occasion/festivals",
    bgImage: "/miniature-clock-bg.jpg",
  },
];

const VIBES_CATEGORIES = [
  { name: "Orchids", slug: "orchids", img: "https://images.unsplash.com/photo-1567748157439-651aca2ff064?w=400&q=80" },
  { name: "Crochet", slug: "crochet", img: "https://images.unsplash.com/photo-1615671524827-c1fe3973b648?w=400&q=80" },
  { name: "Centrepiece", slug: "centrepiece", img: "https://images.unsplash.com/photo-1611486212355-d276af4581c0?w=400&q=80" },
  { name: "Sunny Blooms", slug: "sunny", img: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&q=80" },
  { name: "Dried Blooms", slug: "dried", img: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=400&q=80" },
];

/* ────────────────────────────────────────────────────────────
   REUSABLE SUB-COMPONENTS
──────────────────────────────────────────────────────────── */

/** Simple section heading */
function SectionTitle({ title, viewAllHref }: { title: string; viewAllHref?: string }) {
  return (
    <div className="flex items-end justify-between mb-5 md:mb-6">
      <h2 className="text-[var(--text)] text-xl md:text-2xl lg:text-[1.65rem] font-bold tracking-tight">
        {title}
      </h2>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--accent)] hover:text-[var(--text)] transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          View All <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}
/* ────────────────────────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────────────────────────── */

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { products, loading: productsLoading } = useAppSelector(
    (state: RootState) => state.products
  );
  const { collections } = useAppSelector(
    (state: RootState) => state.collections
  );
  const { occasions } = useAppSelector(
    (state: RootState) => state.occasions
  );

  useEffect(() => {
    dispatch(fetchProducts({ sort: "newest" }));
    dispatch(fetchCollections());
    dispatch(fetchOccasions());
  }, [dispatch]);

  const bestSellers = products;

  // Curated "Browse the Atelier" rail — driven by backend collections (top-level categories)
  const atelierCategories = useMemo(() => {
    const mains = collections.filter((c) => !c.parent);
    if (mains.length === 0) return SHOP_BY_CATEGORIES;
    const fallback = SHOP_BY_CATEGORIES[0]?.img || "";
    return mains.map((c) => ({
      name: c.name,
      slug: c.slug,
      img:
        getImageUrl(c.image) ||
        SHOP_BY_CATEGORIES.find((s) => s.slug === c.slug)?.img ||
        fallback,
    }));
  }, [collections]);

  // Occasion rail — driven by backend occasions (top-level)
  const occasionCards = useMemo(() => {
    const mains = occasions.filter((o) => !o.parent);
    if (mains.length === 0) return SHOP_BY_OCCASION;
    const fallback = SHOP_BY_OCCASION[0]?.img || "";
    return mains.map((o) => ({
      name: o.name,
      slug: o.slug,
      tag: (SHOP_BY_OCCASION.find((s) => s.slug === o.slug) as { tag?: string } | undefined)?.tag,
      img:
        getImageUrl(o.image) ||
        SHOP_BY_OCCASION.find((s) => s.slug === o.slug)?.img ||
        fallback,
    }));
  }, [occasions]);

  /* Embla carousel for the category rail */
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      loop: true,
      skipSnaps: false,
      dragFree: false,
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const onScroll = () => {
      const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
      setScrollProgress(progress * 100);
    };

    onScroll();
    emblaApi.on("scroll", onScroll);
    emblaApi.on("reInit", onScroll);

    return () => {
      emblaApi.off("scroll", onScroll);
      emblaApi.off("reInit", onScroll);
    };
  }, [emblaApi]);

  /* Embla carousel for the promo banner */
  const [promoEmblaRef, promoEmblaApi] = useEmblaCarousel(
    {
      align: "start",
      loop: true,
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const [promoIndex, setPromoIndex] = useState(0);

  useEffect(() => {
    if (!promoEmblaApi) return;

    const onSelect = () => setPromoIndex(promoEmblaApi.selectedScrollSnap());

    onSelect();
    promoEmblaApi.on("select", onSelect);
    promoEmblaApi.on("reInit", onSelect);

    return () => {
      promoEmblaApi.off("select", onSelect);
      promoEmblaApi.off("reInit", onSelect);
    };
  }, [promoEmblaApi]);

  /* Embla carousel for bestsellers */
  const [bestEmblaRef, bestEmblaApi] = useEmblaCarousel(
    {
      align: "start",
      loop: true,
      containScroll: "trimSnaps",
    },
    [Autoplay({ delay: 5500, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const [bestProgress, setBestProgress] = useState(0);

  useEffect(() => {
    if (!bestEmblaApi) return;

    const onScroll = () => {
      const p = Math.max(0, Math.min(1, bestEmblaApi.scrollProgress()));
      setBestProgress(p * 100);
    };

    onScroll();
    bestEmblaApi.on("scroll", onScroll);
    bestEmblaApi.on("reInit", onScroll);

    return () => {
      bestEmblaApi.off("scroll", onScroll);
      bestEmblaApi.off("reInit", onScroll);
    };
  }, [bestEmblaApi]);

  return (
    <div className="flex flex-col font-sans bg-[var(--bg)] overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════
          1. SHOP BY CATEGORIES — Editorial Atelier Rail (Embla)
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative w-full bg-[var(--bg)] border-b border-[var(--border)] overflow-hidden">
        {/* Soft radial glow backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 120% at 50% 0%, rgba(184,92,58,0.08) 0%, transparent 60%), radial-gradient(40% 80% at 80% 100%, rgba(184,92,58,0.05) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8 pt-10 pb-12 md:pt-14 md:pb-16">

          {/* ── Section heading ── */}
          <div className="flex items-end justify-between mb-7 md:mb-9">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="h-[1px] w-8 bg-[var(--accent)]" />
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--accent)]">
                  Curated
                </span>
              </div>
              <h2 className="font-serif text-[1.75rem] md:text-[2.25rem] leading-none text-[var(--text)] tracking-tight">
                Browse the <em className="italic font-normal text-[var(--accent)]">Atelier</em>
              </h2>
            </div>

            {/* Nav arrows (visible on md+) */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/category/all"
                className="group inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                All Collections
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => emblaApi?.scrollPrev()}
                  aria-label="Previous"
                  className="w-10 h-10 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-[var(--text)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => emblaApi?.scrollNext()}
                  aria-label="Next"
                  className="w-10 h-10 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-[var(--text)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Embla Carousel ── */}
          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex touch-pan-y -ml-4 md:-ml-5">
                {atelierCategories.map((cat, i) => (
                  <div
                    key={cat.slug}
                    className="shrink-0 grow-0 pl-4 md:pl-5 basis-[calc(100%/2.2)] sm:basis-[calc(100%/3.2)] md:basis-[calc(100%/4.5)] lg:basis-[calc(100%/6.2)] xl:basis-[calc(100%/7.2)]"
                  >
                    <Link
                      href={`/category/${cat.slug}`}
                      className="group relative block w-full"
                    >
                      {/* Card */}
                      <div className="relative w-full aspect-[3/4] rounded-[28px] overflow-hidden bg-[var(--bg-subtle)] shadow-[0_2px_10px_-4px_rgba(42,31,24,0.12)] group-hover:shadow-[0_24px_50px_-20px_rgba(184,92,58,0.35)] transition-all duration-500 ease-out">

                        {/* Image */}
                        <img
                          src={cat.img}
                          alt={cat.name}
                          draggable={false}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.12] select-none pointer-events-none"
                        />

                        {/* Warm gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 group-hover:from-black/80 transition-opacity duration-500" />

                        {/* Inner hairline highlight */}
                        <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/10 group-hover:ring-white/20 transition-all duration-500" />

                        {/* Index number */}
                        <span className="absolute top-4 left-4 font-serif italic text-[11px] tracking-widest text-white/70">
                          {String(i + 1).padStart(2, "0")}
                        </span>

                        {/* Gold accent dot */}
                        <span className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-[var(--accent-light)] opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all duration-500 ease-out" />

                        {/* Bottom label block */}
                        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                          <h3 className="text-white text-[13px] md:text-[14px] font-bold tracking-[0.06em] uppercase leading-tight">
                            {cat.name}
                          </h3>

                          <span className="block mt-2 h-[2px] w-0 bg-[var(--accent-light)] group-hover:w-10 transition-all duration-500 ease-out rounded-full" />

                          <div className="flex items-center gap-1.5 mt-3 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-75">
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/90">
                              Explore
                            </span>
                            <ArrowRight size={11} className="text-white/90 group-hover:translate-x-1 transition-transform duration-300" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar underneath */}
            <div className="mt-6 h-[2px] w-full bg-[var(--bg-muted)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
          </div>

          {/* Mobile: All link */}
          <div className="mt-6 flex justify-center md:hidden">
            <Link
              href="/category/all"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--border)] text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--text-muted)]"
            >
              All Collections <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          2. SHOP BY OCCASIONS — Compact Editorial Row
      ═══════════════════════════════════════════════════════════ */}
      <section id="occasions" className="relative w-full bg-white border-b border-[var(--border)] py-10 md:py-14">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">

          {/* ── Section header (inline, compact) ── */}
          <div className="flex items-end justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <span className="h-[1px] w-8 bg-[var(--accent)]" />
              <h2 className="font-serif text-[1.35rem] md:text-[1.65rem] leading-none tracking-tight text-[var(--text)]">
                Shop By{" "}
                <em className="italic font-normal text-[var(--accent)]">Occasions</em>
              </h2>
            </div>
            <Link
              href="/occasion/all"
              className="group inline-flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              View All
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* ── Row of slim occasion cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {occasionCards.map((occ, i) => (
              <motion.div
                key={occ.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/occasion/${occ.slug}`}
                  className="group relative block w-full"
                >
                  <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-[var(--bg-subtle)] shadow-[0_1px_6px_-2px_rgba(42,31,24,0.10)] group-hover:shadow-[0_18px_40px_-18px_rgba(184,92,58,0.35)] transition-all duration-500 ease-out">

                    {/* Image */}
                    <img
                      src={occ.img}
                      alt={occ.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.10]"
                    />

                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent group-hover:from-black/85 transition-colors duration-500" />

                    {/* Hairline */}
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-white/25 transition-all duration-500" />

                    {/* Tag pill — top right */}
                    {occ.tag && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-[8px] font-bold tracking-[0.12em] uppercase text-white">
                        {occ.tag}
                      </span>
                    )}

                    {/* Bottom content */}
                    <div className="absolute inset-x-0 bottom-0 p-3 md:p-3.5">
                      <h3 className="text-white text-[12px] md:text-[13px] font-bold tracking-wide leading-tight">
                        {occ.name}
                      </h3>
                      <span className="block mt-1.5 h-[1.5px] w-0 bg-[var(--accent-light)] rounded-full group-hover:w-6 transition-all duration-500" />
                      <div className="flex items-center gap-1 mt-2 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-75">
                        <span className="text-[8.5px] font-bold tracking-[0.2em] uppercase text-white/95">
                          Explore
                        </span>
                        <ArrowRight size={9} className="text-white/95 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. PROMO BANNER — Auto-Scrolling Editorial Carousel
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative w-full py-6 md:py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">

          {/* Embla viewport */}
          <div className="relative rounded-[24px] md:rounded-[28px] overflow-hidden" ref={promoEmblaRef}>
            <div className="flex">
              {PROMO_SLIDES.map((slide, i) => (
                <div
                  key={i}
                  className="relative shrink-0 grow-0 basis-full"
                >
                  {/* Background image */}
                  <div className="relative w-full min-h-[280px] md:min-h-[360px] lg:min-h-[420px]">
                    <img
                      src={slide.bgImage}
                      alt={slide.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Dark overlay for text legibility — heavier on left */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />

                    {/* Warm terracotta tint */}
                    <div className="absolute inset-0 bg-[var(--accent)]/10 mix-blend-multiply" />

                    {/* Content */}
                    <div className="relative z-10 h-full flex items-center">
                      <div className="px-8 sm:px-12 md:px-16 lg:px-20 py-12 md:py-16 max-w-[640px]">

                        {/* Eyebrow */}
                        <p className="text-white/70 text-[10px] md:text-[11px] font-bold tracking-[0.3em] uppercase mb-4">
                          {slide.eyebrow}
                        </p>

                        {/* Headline */}
                        <h2 className="text-white font-serif text-[2rem] md:text-[2.75rem] lg:text-[3.25rem] leading-[1.05] tracking-tight mb-4">
                          {slide.title}
                        </h2>

                        {/* Subline */}
                        <p className="text-white/75 text-[13px] md:text-[15px] leading-relaxed mb-8 max-w-[420px]">
                          {slide.subtitle}
                        </p>

                        {/* CTA */}
                        <Link
                          href={slide.href}
                          className="group inline-flex items-center gap-3 px-7 py-3.5 bg-white text-[var(--text)] rounded-full text-[11px] font-bold tracking-[0.18em] uppercase hover:bg-[var(--accent)] hover:text-white transition-all duration-300 shadow-xl shadow-black/20"
                        >
                          {slide.cta}
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
              {PROMO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => promoEmblaApi?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    promoIndex === i
                      ? "w-8 bg-white"
                      : "w-1.5 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          4. SHOP BY BESTSELLERS — Editorial Product Carousel
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative w-full bg-white border-b border-[var(--border)] py-12 md:py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">

          {/* ── Section header ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-10">
            <div className="max-w-[560px]">
              <div className="flex items-center gap-3 mb-3">
                <span className="h-[1px] w-8 bg-[var(--accent)]" />
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--accent)]">
                  Bestsellers
                </span>
              </div>
              <h2 className="font-serif text-[1.75rem] md:text-[2.25rem] leading-[1.1] tracking-tight text-[var(--text)]">
                India&apos;s favourite{" "}
                <em className="italic font-normal text-[var(--accent)]">gifting</em>{" "}
                picks.
              </h2>
            </div>

            {/* Right cluster: View All + arrows */}
            <div className="flex items-center gap-5">
              <Link
                href="/category/all"
                className="group hidden md:inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                View All
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => bestEmblaApi?.scrollPrev()}
                  aria-label="Previous"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-[var(--text)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-300"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => bestEmblaApi?.scrollNext()}
                  aria-label="Next"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-[var(--text)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-300"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Embla Product Carousel ── */}
          {productsLoading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="animate-spin text-[var(--accent)]" size={28} />
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-hidden" ref={bestEmblaRef}>
                <div className="flex touch-pan-y -ml-4 md:-ml-5">
                  {bestSellers.map((product) => (
                    <div
                      key={product._id || product.id}
                      className="shrink-0 grow-0 pl-4 md:pl-5 basis-[calc(100%/1.6)] sm:basis-[calc(100%/2.4)] md:basis-[calc(100%/3.2)] lg:basis-[calc(100%/4.2)] xl:basis-[calc(100%/5)]"
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-8 h-[2px] w-full bg-[var(--bg-muted)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-300"
                  style={{ width: `${bestProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Mobile: View All */}
          <div className="mt-8 flex justify-center md:hidden">
            <Link
              href="/category/all"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--border)] text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--text-muted)]"
            >
              View All Bestsellers <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5. CATEGORY COLLECTION BAND (Vibes strip)
      ═══════════════════════════════════════════════════════════ */}
      <section className="w-full py-8 md:py-12 bg-[#e8eef5]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <SectionTitle title="Collections" />

          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            {VIBES_CATEGORIES.map((v, i) => (
              <motion.div
                key={v.slug}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <Link
                  href={`/category/${v.slug}`}
                  className="group block"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden bg-white mb-2">
                    <img
                      src={v.img}
                      alt={v.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="bg-white rounded-full py-2 px-3 text-center border border-[var(--border)] group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)] transition-all">
                    <span className="text-[11px] md:text-[12px] font-bold text-[var(--text)] group-hover:text-white transition-colors">
                      Order Now
                    </span>
                  </div>
                  <p className="text-center text-[11px] font-semibold text-[var(--text)] mt-1.5">
                    {v.name}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
}
