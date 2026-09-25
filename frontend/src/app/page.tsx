"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchProducts } from "@/redux/slices/productSlice";
import { fetchCollections, type CollectionItem } from "@/redux/slices/collectionSlice";
import { fetchOccasions } from "@/redux/slices/occasionSlice";
import { fetchHomepageSettings, type HomepageSettingsReferenceValue } from "@/redux/slices/homepageSettingsSlice";
import { RootState } from "@/redux/store";
import { getImageUrl } from "@/utils/getImageUrl";
import { useCart } from "@/hooks/useCart";
import { EXCEL_PRODUCTS } from "@/data/excelProducts";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Star,
  Truck,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const SEASONAL_COLLECTION_SLUG = "navaratri-thamboolam";
const SEASONAL_OCCASION_SLUG = "navaratri-golu";
const DEFAULT_SEASONAL_COLLECTION_NAME = "Navaratri Thamboolam Collections";
const DEFAULT_SEASONAL_OCCASION_NAME = "Navaratri Golu";
const DEFAULT_SEASONAL_DESCRIPTION = "Thoughtful traditional return gifts for Golu visitors, weddings, and housewarmings. Featuring miniature betel leaves, supari, coconut, and decorative trays.";

type SeasonalCatalogItem = Pick<CollectionItem, "_id" | "name" | "slug" | "description" | "image" | "parent">;

const getReferenceId = (reference: HomepageSettingsReferenceValue) =>
  typeof reference === "string" ? reference : reference?._id || "";

const getParentId = (item: { parent?: string | { _id: string } | null }) =>
  typeof item.parent === "string" ? item.parent : item.parent?._id;

const expandSelectedItems = <T extends SeasonalCatalogItem>(
  selected: T[],
  catalog: T[]
): T[] => {
  const expanded: T[] = [];
  const pending = [...selected];
  const seen = new Set<string>();

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || seen.has(current._id)) continue;
    seen.add(current._id);
    expanded.push(current);
    catalog.forEach((item) => {
      if (getParentId(item) === current._id) pending.push(item);
    });
  }

  return expanded;
};

const ProductImage = ({
  image,
  alt,
  className,
}: {
  image?: string;
  alt: string;
  className: string;
}) => {
  if (!image) {
    return (
      <div className={`${className} flex items-center justify-center bg-stone-100 text-[var(--text-muted)] text-xs`}>
        Image unavailable
      </div>
    );
  }

  return <img src={getImageUrl(image)} alt={alt} className={className} />;
};

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { products } = useAppSelector(
    (state: RootState) => state.products
  );
  const { collections } = useAppSelector(
    (state: RootState) => state.collections
  );
  const { occasions } = useAppSelector(
    (state: RootState) => state.occasions
  );
  const { settings: homepageSettings } = useAppSelector(
    (state: RootState) => state.homepageSettings
  );
  const { addToCart } = useCart();

  // Active tab for the ₹199 Market section
  const [activeMarketTab, setActiveMarketTab] = useState<"fruits" | "veggies">("fruits");

  useEffect(() => {
    dispatch(fetchProducts({ sort: "newest" }));
    dispatch(fetchCollections());
    dispatch(fetchOccasions());
    dispatch(fetchHomepageSettings());
  }, [dispatch]);

  // Heritage stalls drawn from the live product catalog (API)
  const miniatureShops = useMemo(
    () =>
      products
        .filter(
          (p) =>
            p.category === "Navaratri Miniature Shops" ||
            p.subcategory === "Cultural Souvenirs"
        )
        .map((p) => ({
          _id: p._id,
          sku: p.sku || `MG-${String(p._id).slice(-6).toUpperCase()}`,
          name: p.name,
          slug: p.slug,
          category: p.category,
          group: "miniature-shops" as const,
          subcategory: p.subcategory || "Miniature Shops",
          image: p.images?.[0] || p.image || "",
          price: p.price,
          mrp: p.mrp || p.price,
          badge: p.badge,
          shortDesc: p.story || p.details || "",
          rating: p.rating ?? 5,
          reviewsCount: p.reviewCount ?? 0,
        })),
    [products]
  );
  const fruitBaskets = useMemo(
    () => EXCEL_PRODUCTS.filter((p) => p.group === "fruit-baskets"),
    []
  );
  const vegetableCrates = useMemo(
    () => EXCEL_PRODUCTS.filter((p) => p.group === "vegetable-crates"),
    []
  );
  const fallbackSeasonalCollection = collections.find(
    (collection) =>
      collection.slug === SEASONAL_COLLECTION_SLUG ||
      collection.name === DEFAULT_SEASONAL_COLLECTION_NAME
  );
  const fallbackSeasonalOccasion = occasions.find(
    (occasion) =>
      occasion.slug === SEASONAL_OCCASION_SLUG ||
      occasion.name === DEFAULT_SEASONAL_OCCASION_NAME
  );
  // Pick the first enabled seasonal section from the new array
  const activeSeasonalSection = useMemo(() => {
    if (!homepageSettings?.seasonalSections?.length) return null;
    return homepageSettings.seasonalSections.find((s) => s.enabled) ?? null;
  }, [homepageSettings]);

  const selectedCollections = useMemo(() => {
    if (!activeSeasonalSection) {
      return fallbackSeasonalCollection ? [fallbackSeasonalCollection] : [];
    }
    const selectedIds = new Set(
      activeSeasonalSection.collectionIds.map(getReferenceId)
    );
    return collections.filter((collection) => selectedIds.has(collection._id));
  }, [collections, fallbackSeasonalCollection, activeSeasonalSection]);
  const selectedOccasions = useMemo(() => {
    if (!activeSeasonalSection) {
      return fallbackSeasonalOccasion ? [fallbackSeasonalOccasion] : [];
    }
    const selectedIds = new Set(
      activeSeasonalSection.occasionIds.map(getReferenceId)
    );
    return occasions.filter((occasion) => selectedIds.has(occasion._id));
  }, [fallbackSeasonalOccasion, activeSeasonalSection, occasions]);
  const seasonalCollectionItems = useMemo(
    () => expandSelectedItems(selectedCollections, collections),
    [collections, selectedCollections]
  );
  const seasonalOccasionItems = useMemo(
    () => expandSelectedItems(selectedOccasions, occasions),
    [occasions, selectedOccasions]
  );
  const seasonalSectionEnabled = Boolean(activeSeasonalSection?.enabled);
  const seasonalBadge = activeSeasonalSection?.badge || "";
  const seasonalCollectionName = activeSeasonalSection?.heading ||
    (selectedCollections.length > 0
      ? selectedCollections.map((collection) => collection.name).join(" · ")
      : DEFAULT_SEASONAL_COLLECTION_NAME);
  const seasonalOccasionName = activeSeasonalSection?.badge ||
    (selectedOccasions.length > 0
      ? selectedOccasions.map((occasion) => occasion.name).join(" · ")
      : "Sacred Festive Keepsakes");
  const seasonalDescription = activeSeasonalSection?.description ||
    seasonalOccasionItems.find((occasion) => occasion.description)?.description ||
    seasonalCollectionItems.find((collection) => collection.description)?.description ||
    DEFAULT_SEASONAL_DESCRIPTION;
  const seasonalImage =
    seasonalOccasionItems.find((occasion) => occasion.image)?.image ||
    seasonalCollectionItems.find((collection) => collection.image)?.image;
  const seasonalProducts = useMemo(() => {
    if (!seasonalSectionEnabled) return [];

    const collectionNames = new Set(
      seasonalCollectionItems.map((collection) => collection.name)
    );
    const occasionNames = new Set(
      seasonalOccasionItems.map((occasion) => occasion.name)
    );

    if (collectionNames.size === 0 && occasionNames.size === 0) return [];

    return products
      .filter((product) => {
        const productCollectionNames = [
          product.category,
          product.subcategory,
          ...(Array.isArray(product.categories) ? product.categories : []),
          ...(Array.isArray(product.subcategories) ? product.subcategories : []),
        ];
        const productOccasionNames = [
          product.occasion,
          product.occasionSub,
          ...(Array.isArray(product.occasions) ? product.occasions : []),
          ...(Array.isArray(product.occasionSubs) ? product.occasionSubs : []),
        ];
        return productCollectionNames.some((name) => collectionNames.has(name)) ||
          productOccasionNames.some((name) => occasionNames.has(name));
      })
      .map((product) => ({
        _id: product._id,
        sku: product._id || product.sku || product.slug || "",
        name: product.name,
        slug: product.slug || product._id || product.sku || "",
        image: product.images?.[0] || product.image || "",
        price: product.price,
        mrp: product.mrp || product.price,
        shortDesc: product.story || product.details || "",
        weight: product.weight,
        stockStatus: product.stockStatus,
        requiresImage: product.requiresImage,
      }));
  }, [products, seasonalCollectionItems, seasonalOccasionItems, seasonalSectionEnabled]);

  const [seasonalEmblaRef, seasonalEmblaApi] = useEmblaCarousel(
    {
      align: "start",
      loop: true,
      containScroll: "trimSnaps",
    },
    [Autoplay({ delay: 4500, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [seasonalProgress, setSeasonalProgress] = useState(0);

  useEffect(() => {
    if (!seasonalEmblaApi) return;
    const onScroll = () => {
      const p = Math.max(0, Math.min(1, seasonalEmblaApi.scrollProgress()));
      setSeasonalProgress(p * 100);
    };
    onScroll();
    seasonalEmblaApi.on("scroll", onScroll);
    seasonalEmblaApi.on("reInit", onScroll);
    return () => {
      seasonalEmblaApi.off("scroll", onScroll);
      seasonalEmblaApi.off("reInit", onScroll);
    };
  }, [seasonalEmblaApi]);

  // Newest additions to the catalog, sorted by createdAt (newest first)
  const newArrivals = useMemo(
    () =>
      [...products]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 8)
        .map((p) => ({
          _id: p._id,
          sku: p.sku || `MG-${String(p._id).slice(-6).toUpperCase()}`,
          name: p.name,
          slug: p.slug,
          category: p.category,
          subcategory: p.subcategory || p.category || "",
          image: p.images?.[0] || p.image || "",
          price: p.price,
          mrp: p.mrp || p.price,
          shortDesc: p.story || p.details || "",
        })),
    [products]
  );

  const bestSellers = useMemo(
    () =>
      products
        .filter((product) => Boolean(product.isBestseller))
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )
        .map((product) => ({
          _id: product._id,
          sku: product.sku || `MG-${String(product._id).slice(-6).toUpperCase()}`,
          name: product.name,
          slug: product.slug,
          category: product.category,
          subcategory: product.subcategory || product.category || "",
          image: product.images?.[0] || product.image || "",
          price: product.price,
          mrp: product.mrp || product.price,
          shortDesc: product.story || product.details || "",
        })),
    [products]
  );

  // Custom Miniature Wall Clocks drawn from the live catalog (API)
  const wallClocks = useMemo(
    () =>
      products
        .filter((p) => p.category === "Custom Miniature Wall Clocks")
        .map((p) => ({
          _id: p._id,
          sku: p.sku || `MG-${String(p._id).slice(-6).toUpperCase()}`,
          name: p.name,
          slug: p.slug,
          category: p.category,
          subcategory: p.subcategory || p.category || "",
          image: p.images?.[0] || p.image || "",
          price: p.price,
          mrp: p.mrp || p.price,
          shortDesc: p.story || p.details || "",
        })),
    [products]
  );
  const [shopsEmblaRef, shopsEmblaApi] = useEmblaCarousel(
    {
      align: "start",
      loop: true,
      containScroll: "trimSnaps",
    },
    [Autoplay({ delay: 4500, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [shopsProgress, setShopsProgress] = useState(0);

  useEffect(() => {
    if (!shopsEmblaApi) return;
    const onScroll = () => {
      const p = Math.max(0, Math.min(1, shopsEmblaApi.scrollProgress()));
      setShopsProgress(p * 100);
    };
    onScroll();
    shopsEmblaApi.on("scroll", onScroll);
    shopsEmblaApi.on("reInit", onScroll);
    return () => {
      shopsEmblaApi.off("scroll", onScroll);
      shopsEmblaApi.off("reInit", onScroll);
    };
  }, [shopsEmblaApi]);

  // Custom Miniature Wall Clocks carousel
  const [clocksEmblaRef, clocksEmblaApi] = useEmblaCarousel(
    {
      align: "start",
      loop: true,
      containScroll: "trimSnaps",
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [clocksProgress, setClocksProgress] = useState(0);

  useEffect(() => {
    if (!clocksEmblaApi) return;
    const onScroll = () => {
      const p = Math.max(0, Math.min(1, clocksEmblaApi.scrollProgress()));
      setClocksProgress(p * 100);
    };
    onScroll();
    clocksEmblaApi.on("scroll", onScroll);
    clocksEmblaApi.on("reInit", onScroll);
    return () => {
      clocksEmblaApi.off("scroll", onScroll);
      clocksEmblaApi.off("reInit", onScroll);
    };
  }, [clocksEmblaApi]);

  const [bestSellersEmblaRef, bestSellersEmblaApi] = useEmblaCarousel(
    {
      align: "start",
      loop: true,
      containScroll: "trimSnaps",
    },
    [Autoplay({ delay: 4500, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [bestSellersProgress, setBestSellersProgress] = useState(0);

  useEffect(() => {
    if (!bestSellersEmblaApi) return;
    const onScroll = () => {
      const p = Math.max(0, Math.min(1, bestSellersEmblaApi.scrollProgress()));
      setBestSellersProgress(p * 100);
    };
    onScroll();
    bestSellersEmblaApi.on("scroll", onScroll);
    bestSellersEmblaApi.on("reInit", onScroll);
    return () => {
      bestSellersEmblaApi.off("scroll", onScroll);
      bestSellersEmblaApi.off("reInit", onScroll);
    };
  }, [bestSellersEmblaApi]);

  // Handle Quick Add to Cart
  const handleQuickAdd = (product: { _id?: string; sku: string; name: string; image: string; price: number; weight?: number; stockStatus?: string; requiresImage?: boolean }, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockStatus === "out-of-stock") {
      toast.error(`${product.name} is currently unavailable.`);
      return;
    }
    if (product.requiresImage) {
      toast("Please select options on the product page.");
      return;
    }
    addToCart({
      productId: product._id || product.sku,
      name: product.name,
      image: product.image,
      price: product.price,
      weight: product.weight,
      quantity: 1,
    });
    toast.success(`${product.name} added to cart!`, {
      icon: "🏺",
      style: {
        borderRadius: "12px",
        background: "#2d1810",
        color: "#fff",
        fontSize: "12px",
      },
    });
  };

  return (
    <div className="flex flex-col font-sans bg-[var(--bg)] text-[var(--text)] overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════
          1. HERO SECTION: Brand Mascot & Artisanal Heritage
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#fbf5ed] via-[#fffdf9] to-[#faf4ec] border-b border-[var(--border)] pt-8 pb-14 md:pt-14 md:pb-20">
        {/* Ambient Decorative Backdrops */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[var(--accent-gold)]/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 -right-24 w-[30rem] h-[30rem] rounded-full bg-[var(--accent)]/10 blur-3xl"
        />

        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Content (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
              
              {/* Studio Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[var(--border)] shadow-sm mb-5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[var(--accent)]">
                  Handcrafted Clay Miniature Studio
                </span>
                <span className="text-[10px] text-[var(--accent-teal)] font-semibold border-l border-[var(--border)] pl-2">
                  Navaratri & Golu 2026
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif text-[2.4rem] sm:text-[3.2rem] md:text-[3.8rem] leading-[1.08] tracking-tight text-[var(--text)] mb-5">
                Hand-Sculpted Stories of{" "}
                <span className="relative inline-block text-[var(--accent)] italic font-normal">
                  South Indian Heritage
                  <svg
                    className="absolute -bottom-1.5 left-0 w-full text-[var(--accent-gold)]"
                    height="8"
                    viewBox="0 0 250 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 6C65 2 175 2 248 6"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                & Everyday Nostalgia.
              </h1>

              {/* Sub-headline */}
              <p className="text-[14px] sm:text-[16px] text-[var(--text-muted)] leading-relaxed max-w-[580px] mb-8 font-medium">
                From bustling Madurai Jigarthanda stalls and crispy Dosa kadas to
                fragrant Malligai Poo stands—bring home museum-grade miniature clay art, 
                sculpted by hand with air-dry polymer clay, wood, and pure nostalgia.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-10 w-full sm:w-auto">
                <a
                  href="#miniature-shops"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[var(--accent)] text-white text-[12px] font-bold tracking-[0.14em] uppercase shadow-lg shadow-[var(--accent)]/25 hover:bg-[var(--accent-light)] transition-all duration-300 hover:scale-[1.02]"
                >
                  <Sparkles size={15} />
                  Explore Miniature Shops
                </a>
                <a
                  href="#market-crates"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-white border-2 border-[var(--border)] text-[var(--text)] text-[12px] font-bold tracking-[0.14em] uppercase hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all duration-300 shadow-sm"
                >
                  Shop ₹199 Baskets & Crates
                  <ArrowRight size={14} />
                </a>
              </div>

              {/* Trust Value Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[var(--border)]/80 w-full max-w-[540px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-gold)]/15 flex items-center justify-center text-[var(--accent-gold)]">
                    <Star size={15} fill="currentColor" />
                  </div>
                  <div>
                    <span className="block text-[13px] font-bold leading-tight">40+</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Exclusive Designs</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)]">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <span className="block text-[13px] font-bold leading-tight">100%</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Hand-Sculpted</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-teal)]/15 flex items-center justify-center text-[var(--accent-teal)]">
                    <Truck size={15} />
                  </div>
                  <div>
                    <span className="block text-[13px] font-bold leading-tight">Safe</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Pan-India Delivery</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Showcase: Mascot Emblem & Floating Highlights (5 Cols) */}
            <div className="lg:col-span-5 relative flex justify-center mt-6 lg:mt-0">
              
              {/* Golden Sun Emblem Aura */}
              <div className="relative w-[280px] xs:w-[320px] sm:w-[380px] md:w-[420px] max-w-[85vw] aspect-square rounded-full p-2.5 sm:p-3 bg-gradient-to-tr from-[var(--accent-gold)] via-[var(--accent)] to-[var(--accent-teal)] shadow-2xl shadow-[var(--accent)]/20">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-black border-4 border-white">
                  <Image
                    src="/logo.png"
                    alt="Mythris Gleams Artisanal Mascot"
                    fill
                    priority
                    sizes="(max-width: 768px) 300px, 420px"
                    className="object-cover scale-105"
                  />
                  {/* Subtle inner highlight */}
                  <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" />
                </div>

                {/* Floating Badge 1: Top Right */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="absolute -top-3 -right-1 sm:right-2 bg-white/95 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border border-[var(--border)] shadow-lg flex items-center gap-2 max-w-[190px] sm:max-w-none"
                >
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                    🏺
                  </span>
                  <div>
                    <p className="text-[8px] sm:text-[9px] font-bold tracking-wider uppercase text-[var(--accent)]">
                      Bestseller
                    </p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-[var(--text)] truncate">
                      Jigarthanda Shop • ₹2,499
                    </p>
                  </div>
                </motion.div>

                {/* Floating Badge 2: Bottom Left */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="absolute -bottom-3 -left-1 sm:left-2 bg-white/95 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-[var(--border)] shadow-lg flex items-center gap-2 max-w-[190px] sm:max-w-none"
                >
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                    🧺
                  </span>
                  <div>
                    <p className="text-[8px] sm:text-[9px] font-bold tracking-wider uppercase text-[var(--accent-gold)]">
                      Pocket Favorite
                    </p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-[var(--text)] truncate">
                      Clay Fruit Baskets • ₹199
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {bestSellers.length > 0 && (
        <section id="bestsellers" className="relative w-full py-14 md:py-20 bg-[var(--bg-subtle)] border-b border-[var(--border)]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                  <Star size={12} fill="currentColor" />
                  Collector Favorites
                </div>
                <h2 className="font-serif text-[2rem] sm:text-[2.6rem] md:text-[3rem] leading-[1.1] text-[var(--text)] tracking-tight">
                  Best Sellers
                </h2>
                <p className="text-[13px] sm:text-[14px] text-[var(--text-muted)] mt-3 leading-relaxed max-w-[560px]">
                  The handcrafted pieces our collectors return to most. Discover the stories everyone is bringing home.
                </p>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto">
                <span className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] mr-2 hidden sm:inline">
                  {bestSellers.length} {bestSellers.length === 1 ? "Favorite" : "Favorites"}
                </span>
                {bestSellers.length > 1 && (
                  <>
                    <button
                      onClick={() => bestSellersEmblaApi?.scrollPrev()}
                      aria-label="Previous best seller"
                      className="w-10 h-10 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-[var(--text)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-300 shadow-sm"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => bestSellersEmblaApi?.scrollNext()}
                      aria-label="Next best seller"
                      className="w-10 h-10 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-[var(--text)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-300 shadow-sm"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden" ref={bestSellersEmblaRef}>
                <div className="flex touch-pan-y -ml-4 md:-ml-6">
                  {bestSellers.map((product) => {
                    const discountPct = product.mrp > product.price
                      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                      : 0;
                    return (
                      <div
                        key={product._id || product.sku}
                        className="shrink-0 grow-0 pl-4 md:pl-6 basis-[85%] sm:basis-[50%] lg:basis-[33.33%] xl:basis-[25%]"
                      >
                        <Link
                          href={`/product/${product.slug}`}
                          className="group relative flex flex-col h-full rounded-[24px] bg-white border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-xl hover:border-[var(--accent-gold)] transition-all duration-500"
                        >
                          <div className="relative w-full aspect-[4/3] overflow-hidden bg-stone-100">
                            <ProductImage
                              image={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[9px] font-extrabold tracking-wider uppercase shadow-md">
                              Bestseller
                            </span>
                            {discountPct > 0 && (
                              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/95 text-[var(--accent)] text-[9px] font-extrabold tracking-wider uppercase shadow-sm">
                                {discountPct}% OFF
                              </span>
                            )}
                          </div>
                          <div className="p-5 flex flex-col flex-1 justify-between">
                            <div>
                              <h3 className="font-serif text-[17px] font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors leading-snug mb-2 line-clamp-2">
                                {product.name}
                              </h3>
                              {product.shortDesc && (
                                <p className="text-[12px] text-[var(--text-muted)] leading-relaxed line-clamp-2 mb-4">
                                  {product.shortDesc}
                                </p>
                              )}
                            </div>
                            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
                              <div className="flex items-baseline gap-2">
                                <span className="text-[18px] font-bold text-[var(--text)]">
                                  ₹{product.price.toLocaleString()}
                                </span>
                                {product.mrp > product.price && (
                                  <span className="text-[12px] text-[var(--text-muted)] line-through">
                                    ₹{product.mrp.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleQuickAdd(product, e)}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--text)] text-white text-[11px] font-bold tracking-wider uppercase hover:bg-[var(--accent)] transition-colors shadow-sm"
                              >
                                <ShoppingBag size={13} />
                                Add
                              </button>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
              {bestSellers.length > 1 && (
                <div className="mt-8 h-[2px] w-full bg-[var(--bg-muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${bestSellersProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          2. SIGNATURE COLLECTION: Navaratri Miniature Shops
      ═══════════════════════════════════════════════════════════ */}
      <section id="miniature-shops" className="relative w-full py-14 md:py-20 bg-white border-b border-[var(--border)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <span className="h-[2px] w-8 bg-[var(--accent)]" />
                <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[var(--accent)]">
                  Signature Heritage Showpieces
                </span>
              </div>
              <h2 className="font-serif text-[1.9rem] sm:text-[2.5rem] md:text-[2.85rem] leading-[1.1] text-[var(--text)] tracking-tight">
                Traditional Miniature <em className="italic font-normal text-[var(--accent)]">Street Shops & Carts</em>
              </h2>
              <p className="text-[13px] md:text-[14px] text-[var(--text-muted)] mt-2 max-w-[620px]">
                Recreating Tamil Nadu & South Indian street culture with meticulous clay craftsmanship, 
                rustic tile roofs, copper pots, and miniature figurines.
              </p>
            </div>

            {/* Nav Arrows */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              <span className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] mr-2 hidden sm:inline">
                {miniatureShops.length} Heritage Stalls
              </span>
              <button
                onClick={() => shopsEmblaApi?.scrollPrev()}
                aria-label="Previous Stall"
                className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-300 shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => shopsEmblaApi?.scrollNext()}
                aria-label="Next Stall"
                className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-300 shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Embla Carousel */}
          <div className="relative">
            <div className="overflow-hidden" ref={shopsEmblaRef}>
              <div className="flex touch-pan-y -ml-4 md:-ml-6">
                {miniatureShops.map((product) => {
                  const discountPct = Math.round(
                    ((product.mrp - product.price) / product.mrp) * 100
                  );
                  return (
                    <div
                      key={product.sku}
                      className="shrink-0 grow-0 pl-4 md:pl-6 basis-[85%] sm:basis-[50%] lg:basis-[33.33%] xl:basis-[28%]"
                    >
                      <Link
                        href={`/product/${product.slug}`}
                        className="group relative flex flex-col h-full rounded-[24px] bg-[var(--bg)] border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-xl hover:border-[var(--accent-gold)] transition-all duration-500"
                      >
                        
                        {/* Image Showcase */}
                        <div className="relative w-full aspect-[4/3] overflow-hidden bg-stone-100">
                          <ProductImage
                            image={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />

                          {/* Gradient Backdrop for Legibility */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Discount Pill */}
                          {discountPct > 0 && (
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[var(--accent)] text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md">
                              {discountPct}% OFF
                            </span>
                          )}

                          {/* Golu Badge */}
                          {product.badge && (
                            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-white/40 text-[9px] font-bold tracking-wider uppercase text-[var(--text)] shadow-sm">
                              {product.badge}
                            </span>
                          )}

                          {/* SKU Pill */}
                          <span className="absolute bottom-3 left-3 text-[9px] font-mono text-white/90 font-bold bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded">
                            {product.sku}
                          </span>
                        </div>

                        {/* Content Area */}
                        <div className="p-5 flex flex-col flex-1 justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <div className="flex text-[var(--accent-gold)]">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={11} fill="currentColor" />
                                ))}
                              </div>
                              {product.reviewsCount > 0 && (
                                <span className="text-[10px] font-bold text-[var(--text-muted)]">
                                  ({product.reviewsCount} reviews)
                                </span>
                              )}
                            </div>

                            <h3 className="font-serif text-[17px] font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors leading-snug mb-2 line-clamp-2">
                              {product.name}
                            </h3>

                            {product.shortDesc && (
                              <p className="text-[12px] text-[var(--text-muted)] leading-relaxed line-clamp-2 mb-4">
                                {product.shortDesc}
                              </p>
                            )}
                          </div>

                          {/* Pricing & CTA */}
                          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-[18px] font-bold text-[var(--text)]">
                                  ₹{product.price.toLocaleString()}
                                </span>
                                {product.mrp > product.price && (
                                  <span className="text-[12px] text-[var(--text-muted)] line-through">
                                    ₹{product.mrp.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-[var(--accent-teal)] font-semibold">
                                Air-dry clay & wood
                              </span>
                            </div>

                            <button
                              onClick={(e) => handleQuickAdd(product, e)}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--text)] text-white text-[11px] font-bold tracking-wider uppercase hover:bg-[var(--accent)] transition-colors shadow-sm"
                            >
                              <ShoppingBag size={13} />
                              Add
                            </button>
                          </div>
                        </div>

                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8 h-[2px] w-full bg-[var(--bg-muted)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${shopsProgress}%` }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CHEF DAMU SPOTLIGHT: Celebrity Bespoke Miniature Clock
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative w-full py-16 md:py-24 bg-gradient-to-br from-[#1e130b] via-[#2c1910] to-[#180e07] text-white overflow-hidden border-b border-[var(--border)]">
        {/* Soft Golden Ambient Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--accent-gold)]/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-[var(--accent)]/15 blur-3xl"
        />

        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Image Showcase with Golden Wooden Border */}
            <div className="lg:col-span-6 relative">
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-[28px] md:rounded-[36px] overflow-hidden border-2 border-[var(--accent-gold)]/40 shadow-2xl shadow-black/60 group">
                <Image
                  src="/chef-damu-clock.jpg"
                  alt="Mythris Gleams Bespoke Miniature Food Wall Clock at Chef Damu's Office"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                
                {/* Subtle Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                {/* Floating Corner Ribbon */}
                <div className="absolute top-4 left-4 bg-black/65 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)] animate-pulse" />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--accent-gold-light)]">
                    Chef Damu’s Office
                  </span>
                </div>

                {/* Bottom Caption Pill */}
                <div className="absolute bottom-2 inset-x-2 sm:bottom-4 sm:inset-x-4 bg-black/80 backdrop-blur-md p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <span className="text-lg sm:text-xl">👨‍🍳</span>
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-bold text-white leading-tight">
                        Presented to Chef K. Damodharan
                      </p>
                      <p className="text-[8px] sm:text-[9px] text-white/70">
                        Guinness Record Holder &amp; MasterChef Judge
                      </p>
                    </div>
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[var(--accent-gold)] bg-white/10 px-2 sm:px-2.5 py-1 rounded-full shrink-0">
                    Bespoke Piece
                  </span>
                </div>
              </div>
            </div>

            {/* Right Editorial Story & Commission Action */}
            <div className="lg:col-span-6 flex flex-col items-start">
              
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--accent-gold)]/15 border border-[var(--accent-gold)]/30 text-[var(--accent-gold-light)] text-[10px] font-bold tracking-[0.22em] uppercase mb-4">
                <Sparkles size={12} className="text-[var(--accent-gold)]" />
                Celebrity Spotlight &amp; Heirloom Craft
              </div>

              {/* Headline */}
              <h2 className="font-serif text-[2rem] sm:text-[2.8rem] md:text-[3.3rem] leading-[1.08] tracking-tight text-white mb-5">
                When Culinary Royalty Meets{" "}
                <span className="text-[var(--accent-gold)] italic font-normal">
                  Handcrafted Clay.
                </span>
              </h2>

              {/* Story Description */}
              <p className="text-white/80 text-[13px] sm:text-[15px] leading-relaxed mb-6 font-light">
                We had the immense honour of handcrafting a custom South Indian food wall clock 
                installed proudly at <strong className="text-white font-semibold">Chef Damu&apos;s personal office</strong> in Chennai.
                Each hour on the wooden Roman clock dial features an iconic delicacy—from steaming idlis 
                and crispy vadai to miniature dosas and fragrant biryani—sculpted millimeter by millimeter in polymer clay.
              </p>

              {/* 3 Detail Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full mb-8">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-lg mb-1 block">🍽️</span>
                  <p className="text-[12px] font-bold text-white">12 Clay Delicacies</p>
                  <p className="text-[10px] text-white/60">One signature dish at every hour mark</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-lg mb-1 block">🕰️</span>
                  <p className="text-[12px] font-bold text-white">Silent Quartz Sweep</p>
                  <p className="text-[10px] text-white/60">Laser-carved Roman wooden center</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-lg mb-1 block">✨</span>
                  <p className="text-[12px] font-bold text-white">100% Bespoke</p>
                  <p className="text-[10px] text-white/60">Personalized for gifts &amp; executive spaces</p>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <a
                  href="https://wa.me/918300034451?text=Hi%20Mythris%20Gleams,%20I%20saw%20Chef%20Damu's%20clock%20on%20your%20website%20and%20would%20like%20to%20commission%20a%20custom%20clock."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-full bg-[var(--accent-gold)] text-[var(--text)] text-[11px] font-bold tracking-widest uppercase hover:bg-[var(--accent-gold-light)] transition-all duration-300 shadow-xl shadow-[var(--accent-gold)]/20 text-center"
                >
                  <MessageCircle size={15} />
                  Commission Your Custom Clock
                </a>
                <Link
                  href="/category/wall-clocks"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold tracking-widest uppercase border border-white/20 transition-all duration-300 text-center"
                >
                  Explore Clock Range
                  <ArrowRight size={13} />
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CUSTOM MINIATURE WALL CLOCKS: Commission & Curated Range
      ═══════════════════════════════════════════════════════════ */}
      <section id="wall-clocks" className="relative w-full py-14 md:py-20 bg-[var(--bg-subtle)] border-b border-[var(--border)] overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">

          {/* Commission CTA Banner */}
          <div className="rounded-[28px] md:rounded-[36px] bg-gradient-to-tr from-[#1e130b] via-[#2c1910] to-[#180e07] text-white relative overflow-hidden shadow-2xl mb-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[var(--accent-gold)]/15 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[var(--accent)]/10 blur-3xl"
            />
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 p-8 sm:p-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--accent-gold)]/15 border border-[var(--accent-gold)]/30 text-[var(--accent-gold-light)] text-[10px] font-bold tracking-[0.22em] uppercase mb-4">
                  <Sparkles size={12} className="text-[var(--accent-gold)]" />
                  Commissioned Timepieces
                </div>
                <h2 className="font-serif text-[2rem] sm:text-[2.8rem] md:text-[3.2rem] leading-[1.08] tracking-tight text-white mb-3">
                  Custom Miniature{" "}
                  <span className="text-[var(--accent-gold)] italic">Wall Clocks</span>
                </h2>
                <p className="text-white/80 text-[13px] sm:text-[15px] leading-relaxed font-light max-w-[560px] mx-auto lg:mx-0 mb-7">
                  Bespoke sculptural timepieces capturing heritage, food and personal stories —
                  each hour hand-sculpted in polymer clay around a silent quartz movement.
                  Made to order, personalised to you.
                </p>
                <a
                  href="https://wa.me/918300034451?text=Hi%20Mythris%20Gleams,%20I%20would%20like%20to%20commission%20a%20custom%20miniature%20wall%20clock."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[var(--accent-gold)] text-[var(--text)] text-[11px] font-bold tracking-widest uppercase hover:bg-[var(--accent-gold-light)] transition-all duration-300 shadow-xl shadow-[var(--accent-gold)]/20"
                >
                  <MessageCircle size={15} />
                  Commission Your Custom Clock
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full lg:w-auto shrink-0">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center lg:text-left">
                  <span className="text-lg mb-1 block">🕰️</span>
                  <p className="text-[12px] font-bold text-white">Silent Quartz</p>
                  <p className="text-[10px] text-white/60">Soft sweep movement</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center lg:text-left">
                  <span className="text-lg mb-1 block">🎨</span>
                  <p className="text-[12px] font-bold text-white">100% Bespoke</p>
                  <p className="text-[10px] text-white/60">Theme, colours &amp; name</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center lg:text-left">
                  <span className="text-lg mb-1 block">🎁</span>
                  <p className="text-[12px] font-bold text-white">Prized Gifts</p>
                  <p className="text-[10px] text-white/60">Heirlooms &amp; executive spaces</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-gold)]/20 text-[var(--text)] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                <Sparkles size={12} className="text-[var(--accent)]" />
                The Signature Clock Range
              </div>
              <h3 className="font-serif text-[1.9rem] sm:text-[2.4rem] leading-[1.1] text-[var(--text)] tracking-tight">
                Curated Commissions
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => clocksEmblaApi?.scrollPrev()}
                aria-label="Previous Clock"
                className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-300 shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => clocksEmblaApi?.scrollNext()}
                aria-label="Next Clock"
                className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-300 shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
              <Link
                href="/category/wall-clocks"
                className="group shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] text-[11px] font-bold tracking-widest uppercase text-[var(--text)] hover:bg-[var(--text)] hover:text-white hover:border-[var(--text)] transition-all duration-300"
              >
                Explore Clock Range
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {wallClocks.length === 0 ? (
            <p className="text-center text-[13px] text-[var(--text-muted)] py-12">
              New clock commissions are being crafted — message us to start yours.
            </p>
          ) : (
            <div className="relative">
              <div className="overflow-hidden" ref={clocksEmblaRef}>
                <div className="flex touch-pan-y select-none -ml-4 md:-ml-6">
                  {wallClocks.map((product) => {
                    const discountPct = Math.round(
                      ((product.mrp - product.price) / product.mrp) * 100
                    );
                    return (
                      <div
                        key={product.sku}
                        className="shrink-0 grow-0 basis-[70%] sm:basis-[45%] md:basis-[33.33%] lg:basis-[25%] xl:basis-[20%] pl-4 md:pl-6"
                      >
                        <Link
                          href={`/product/${product.slug}`}
                          className="group relative flex flex-col h-full rounded-[24px] bg-white border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-xl hover:border-[var(--accent-gold)] transition-all duration-300"
                        >
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                            <ProductImage
                              image={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {discountPct > 0 && (
                              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/95 text-[var(--accent)] text-[9px] font-extrabold tracking-wider uppercase shadow-sm">
                                {discountPct}% OFF
                              </span>
                            )}
                            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-sm text-white/90 text-[9px] font-bold tracking-wider uppercase border border-white/15">
                              Made to Order
                            </span>
                          </div>

                          <div className="p-5 flex flex-col flex-1 justify-between">
                            <div>
                              <h3 className="font-serif text-[17px] font-bold text-[var(--text)] leading-snug mb-1.5 group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                                {product.name}
                              </h3>
                              {product.subcategory && (
                                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-2">
                                  {product.subcategory}
                                </p>
                              )}
                              {product.shortDesc && (
                                <p className="text-[12px] text-[var(--text-muted)] leading-relaxed line-clamp-2 mb-4">
                                  {product.shortDesc}
                                </p>
                              )}
                            </div>

                            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
                              <div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-[18px] font-bold text-[var(--text)]">
                                    ₹{product.price.toLocaleString()}
                                  </span>
                                  {product.mrp > product.price && (
                                    <span className="text-[12px] text-[var(--text-muted)] line-through">
                                      ₹{product.mrp.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={(e) => handleQuickAdd(product, e)}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--text)] text-white text-[11px] font-bold tracking-wider uppercase hover:bg-[var(--accent)] transition-colors shadow-sm"
                              >
                                <ShoppingBag size={13} />
                                Add
                              </button>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-8 h-[2px] w-full bg-[var(--bg-muted)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-300"
                  style={{ width: `${clocksProgress}%` }}
                />
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. ₹199 COLLECTORS' CORNER: Fruit Baskets & Vegetable Crates
      ═══════════════════════════════════════════════════════════ */}
      <section id="market-crates" className="relative w-full py-14 md:py-20 bg-[var(--bg-subtle)] border-b border-[var(--border)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          
          {/* Header */}
          <div className="text-center max-w-[680px] mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-gold)]/20 text-[var(--text)] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
              <Sparkles size={12} className="text-[var(--accent)]" />
              The ₹199 Collectors’ Corner
            </div>
            <h2 className="font-serif text-[2rem] sm:text-[2.6rem] md:text-[3rem] leading-[1.1] text-[var(--text)] tracking-tight">
              Fresh From the Clay Market
            </h2>
            <p className="text-[13px] sm:text-[14px] text-[var(--text-muted)] mt-3 leading-relaxed">
              Delightful hand-textured fruit baskets and miniature farm vegetable crates. 
              Ideal for Golu market streets, dollhouse kitchens, and charming festive return gifts.
            </p>

            {/* Tab Buttons */}
            <div className="flex flex-col sm:inline-flex sm:flex-row p-1.5 rounded-2xl sm:rounded-full bg-white border border-[var(--border)] shadow-sm mt-6 gap-1 sm:gap-0 max-w-full">
              <button
                onClick={() => setActiveMarketTab("fruits")}
                className={`px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-all duration-300 text-center ${
                  activeMarketTab === "fruits"
                    ? "bg-[var(--accent)] text-white shadow-md"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                🧺 Fruit Baskets ({fruitBaskets.length})
              </button>
              <button
                onClick={() => setActiveMarketTab("veggies")}
                className={`px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-all duration-300 text-center ${
                  activeMarketTab === "veggies"
                    ? "bg-[var(--accent)] text-white shadow-md"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                📦 Vegetable Crates ({vegetableCrates.length})
              </button>
            </div>
          </div>

          {/* Special Festive Bundle Callout (Hidden) */}
          {/*
          <div className="mb-10 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#fae8d4] via-[#fcefdc] to-[#f7e4ce] border border-[var(--accent-gold)]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <span className="text-2xl">🎁</span>
              <div>
                <h4 className="text-[13px] sm:text-[14px] font-bold text-[var(--text)]">
                  Navaratri Collector Bundle Offer
                </h4>
                <p className="text-[11px] sm:text-[12px] text-[var(--text-muted)]">
                  Select any 5 Fruit Baskets or Vegetable Crates for just <strong className="text-[var(--accent)]">₹899</strong> (Save ₹100 instantly at checkout).
                </p>
              </div>
            </div>
            <span className="px-4 py-2 rounded-full bg-white text-[var(--accent)] text-[10px] font-bold tracking-widest uppercase border border-[var(--border)] shrink-0 shadow-sm">
              Code: CLAY5BUNDLE
            </span>
          </div>
          */}

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
            {(activeMarketTab === "fruits" ? fruitBaskets : vegetableCrates).map((item) => (
              <div
                key={item.sku}
                className="group relative flex flex-col h-full rounded-[20px] bg-white border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-xl hover:border-[var(--accent-gold)] transition-all duration-500"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden bg-stone-100">
                  <ProductImage
                    image={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Discount Badge */}
                  {item.mrp > item.price && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#be442b] text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md z-10">
                      {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                    </span>
                  )}

                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <span className="absolute bottom-3 left-3 text-[9px] font-mono text-white/90 font-bold bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {item.sku}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col flex-1 justify-between bg-gradient-to-b from-white to-[var(--bg-subtle)]">
                  <div>
                    <h4 className="text-[14px] font-bold text-[var(--text)] leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors mb-2">
                      {item.name}
                    </h4>
                  </div>

                  <div className="pt-3 border-t border-[var(--border)] mt-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[18px] font-extrabold text-[var(--accent)]">
                        ₹{item.price}
                      </span>
                      {item.mrp > item.price && (
                        <span className="text-[12px] font-semibold text-[var(--text-muted)] line-through">
                          ₹{item.mrp}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleQuickAdd(item, e)}
                      className="w-full py-2.5 rounded-xl bg-[var(--text)] hover:bg-[var(--accent)] text-white text-[11px] font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(190,68,43,0.3)] hover:-translate-y-0.5"
                    >
                      <ShoppingBag size={14} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          4. FESTIVE SPECIAL: Navaratri Thamboolam Return Gifts
      ═══════════════════════════════════════════════════════════ */}
      {seasonalSectionEnabled && (selectedCollections.length > 0 || selectedOccasions.length > 0) && seasonalProducts.length > 0 && (
        <section id="seasonal-collection" className="relative w-full py-14 md:py-20 bg-white border-b border-[var(--border)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          
          <div className="rounded-[36px] bg-gradient-to-br from-[#180e07] via-[#24130b] to-[#120a05] border border-[var(--accent-gold)]/20 text-white p-8 sm:p-12 md:p-16 relative overflow-hidden shadow-2xl">
            {seasonalImage && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.12] mix-blend-overlay"
                style={{ backgroundImage: `url(${getImageUrl(seasonalImage)})` }}
              />
            )}
            {/* Elegant Background Glows */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 w-[30rem] h-[30rem] rounded-full bg-[var(--accent-gold)]/15 blur-[100px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[var(--accent)]/10 blur-[80px]"
            />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* Left Info - Premium Design */}
              <div className="lg:col-span-5 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-[var(--accent-gold)]/30 text-[var(--accent-gold)] text-[10px] font-bold tracking-[0.25em] uppercase mb-6 self-start shadow-sm">
                  <Sparkles size={12} className="text-[var(--accent-gold)]" />
                  {seasonalBadge || seasonalOccasionName}
                </div>
                
                <h2 className="font-serif text-[2.4rem] sm:text-[3.2rem] md:text-[3.5rem] leading-[1.05] tracking-tight mb-5 text-white">
                  {seasonalCollectionName.split(' ').map((word, i, arr) => 
                    i === arr.length - 1 ? <em key={i} className="italic text-[var(--accent-gold)] font-normal">{word}</em> : `${word} `
                  )}
                </h2>
                
                {/* Decorative Divider */}
                <div className="flex items-center gap-3 mb-6 opacity-60">
                  <span className="h-[1px] w-12 bg-gradient-to-r from-[var(--accent-gold)] to-transparent" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)]" />
                  <span className="h-[1px] w-12 bg-gradient-to-l from-[var(--accent-gold)] to-transparent" />
                </div>
                
                <p className="text-white/70 text-[14px] md:text-[15px] font-light leading-relaxed mb-8 max-w-[420px]">
                  {seasonalDescription}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-4">
                  <a
                    href="https://wa.me/918300034451?text=Hi%20Mythris%20Gleams,%20I%20am%20interested%20in%20bulk%20Navaratri%20Thamboolam%20orders."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full bg-gradient-to-r from-[var(--accent-gold)] to-yellow-600 text-[#1a0f0a] text-[11px] font-extrabold tracking-[0.15em] uppercase hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300"
                  >
                    <MessageCircle size={16} />
                    Inquire Bulk Gifting
                  </a>
                  <p className="text-white/50 text-[10px] md:text-[11px] leading-snug max-w-[180px]">
                    Custom packaging & personalized name tags available.
                  </p>
                </div>
              </div>

              {/* Right: Carousel */}
              <div className="lg:col-span-7 relative">
                <div className="overflow-hidden" ref={seasonalEmblaRef}>
                  <div className="flex touch-pan-y -ml-4">
                    {seasonalProducts.map((set) => (
                      <div
                        key={set._id || set.slug}
                        className="shrink-0 grow-0 pl-4 basis-[85%] sm:basis-[45%] md:basis-[40%] lg:basis-[45%] xl:basis-[40%]"
                      >
                        <div
                          className="h-full rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 flex flex-col justify-between hover:bg-white/15 transition-all duration-300"
                        >
                          <Link href={`/product/${set.slug}`} className="block">
                            <div className="aspect-square w-full rounded-xl overflow-hidden mb-3 bg-black/20">
                              <ProductImage
                                image={set.image}
                                alt={set.name}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                              />
                            </div>
                            <h4 className="text-[13px] font-bold text-white leading-snug mb-1">
                              {set.name.replace(/^Navaratri Miniature Thamboolam\s*[–-]\s*/, "")}
                            </h4>
                          </Link>
                          <p className="text-[10px] text-white/60 line-clamp-2 mb-3 mt-1">
                            {set.shortDesc}
                          </p>
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                            <div>
                              <span className="text-[14px] font-bold text-[var(--accent-gold)]">
                                ₹{set.price.toLocaleString()}
                              </span>
                              {set.mrp > set.price && (
                                <span className="text-[10px] text-white/40 line-through ml-1.5">
                                  ₹{set.mrp.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {set.requiresImage ? (
                              <Link
                                href={`/product/${set.slug}`}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors text-[11px]"
                              >
                                Customize
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleQuickAdd(set, e)}
                                disabled={set.stockStatus === "out-of-stock"}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 text-[11px]"
                                aria-label={`Add ${set.name} to cart`}
                              >
                                <ShoppingBag size={12} />
                                {set.stockStatus === "out-of-stock" ? "Out of Stock" : "Add"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress bar and navigation */}
                {seasonalProducts.length > 1 && (
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div className="h-[2px] flex-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent-gold)] transition-all duration-300"
                        style={{ width: `${seasonalProgress}%` }}
                      />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => seasonalEmblaApi?.scrollPrev()}
                        className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => seasonalEmblaApi?.scrollNext()}
                        className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          5. NEW COLLECTIONS: Fresh From The Kiln
      ═══════════════════════════════════════════════════════════ */}
      <section id="new-collections" className="relative w-full py-14 md:py-20 bg-white border-b border-[var(--border)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-gold)]/20 text-[var(--text)] text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                <Sparkles size={12} className="text-[var(--accent)]" />
                Fresh From The Kiln
              </div>
              <h2 className="font-serif text-[2rem] sm:text-[2.6rem] md:text-[3rem] leading-[1.1] text-[var(--text)] tracking-tight">
                New Collections
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[var(--text-muted)] mt-3 leading-relaxed max-w-[520px]">
                The latest handcrafted additions straight to our shelves — freshly shaped, painted, and ready for your Golu, home, and gift-giving.
              </p>
            </div>
            <Link
              href="/category/all"
              className="group shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] text-[11px] font-bold tracking-widest uppercase text-[var(--text)] hover:bg-[var(--text)] hover:text-white hover:border-[var(--text)] transition-all duration-300"
            >
              View All Pieces
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {newArrivals.length === 0 ? (
            <p className="text-center text-[13px] text-[var(--text-muted)] py-16">
              New pieces are being crafted — check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4 md:gap-5">
              {newArrivals.map((product) => {
                const discountPct = Math.round(
                  ((product.mrp - product.price) / product.mrp) * 100
                );
                return (
                  <Link
                    key={product.sku}
                    href={`/product/${product.slug}`}
                    className="group relative flex flex-col rounded-2xl bg-white border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-lg hover:border-[var(--accent-gold)] transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
                      <ProductImage
                        image={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* New Pill */}
                      <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-[var(--accent)] text-white text-[9px] font-extrabold tracking-wider uppercase shadow-md">
                        New
                      </span>
                      {/* Discount Pill */}
                      {discountPct > 0 && (
                        <span className="absolute top-2 right-2 px-2 py-1 rounded-full bg-white/95 text-[var(--accent)] text-[9px] font-extrabold tracking-wider uppercase shadow-sm">
                          {discountPct}% OFF
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className="text-[12px] sm:text-[13px] font-bold text-[var(--text)] leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                          {product.name}
                        </h3>
                        {product.subcategory && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-1 truncate uppercase tracking-wide">
                            {product.subcategory}
                          </p>
                        )}
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-[15px] sm:text-[16px] font-bold text-[var(--text)]">
                            ₹{product.price.toLocaleString()}
                          </span>
                          {product.mrp > product.price && (
                            <span className="text-[11px] text-[var(--text-muted)] line-through">
                              ₹{product.mrp.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleQuickAdd(product, e)}
                        className="mt-3 w-full py-2 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--accent)] hover:text-white text-[10px] font-bold text-[var(--text)] tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 border border-[var(--border)]"
                      >
                        <ShoppingBag size={11} />
                        Add to Cart
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          6. THE CRAFT: Behind The Gleam (Artisan Spotlight)
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative w-full py-16 md:py-24 bg-[var(--bg)] border-b border-[var(--border)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Mascot Visual Display */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[380px] aspect-square rounded-[36px] overflow-hidden border-2 border-[var(--accent-gold)] shadow-2xl bg-black">
                <Image
                  src="/logo.png"
                  alt="Mythris Gleams Craft Story"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Story Content */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="h-[2px] w-8 bg-[var(--accent)]" />
                <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[var(--accent)]">
                  Behind the Gleam
                </span>
              </div>
              <h2 className="font-serif text-[2.2rem] sm:text-[2.8rem] leading-[1.1] text-[var(--text)] tracking-tight mb-5">
                Preserving Southern Memory, <em className="italic font-normal text-[var(--accent)]">One Millimeter</em> at a Time.
              </h2>
              <p className="text-[14px] text-[var(--text-muted)] leading-relaxed mb-8">
                Mythris Gleams was born out of deep admiration for the everyday street life of Tamil Nadu—the 
                sizzling tiffin counters, the aroma of crushed sugarcane, and the vivid colours of the flower bazaars. 
                Each miniature scene is individually hand-shaped, painted, assembled, and protected for a lifetime of festive joy.
              </p>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[var(--border)] shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-sm mb-2">
                    1
                  </div>
                  <h4 className="text-[13px] font-bold mb-1">Air-Dry & Polymer Clay</h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Lightweight, durable, and highly detailed formulas that will not crumble over time.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[var(--border)] shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] flex items-center justify-center font-bold text-sm mb-2">
                    2
                  </div>
                  <h4 className="text-[13px] font-bold mb-1">Authentic Materials</h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Real pine wood crates, woven cane baskets, and miniature metal accents for true realism.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[var(--border)] shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent-teal)]/15 text-[var(--accent-teal)] flex items-center justify-center font-bold text-sm mb-2">
                    3
                  </div>
                  <h4 className="text-[13px] font-bold mb-1">Hand-Mixed Pigments</h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Turmeric yellows, fresh mint chutneys, and terracotta reds mixed to perfection.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[var(--border)] shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-sm mb-2">
                    4
                  </div>
                  <h4 className="text-[13px] font-bold mb-1">Collector-Grade Sealant</h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Protected against dust and humid weather so your Golu pieces shine year after year.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          7. NOSTALGIA & CUSTOMER REVIEWS
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative w-full py-14 md:py-20 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          
          <div className="text-center max-w-[620px] mx-auto mb-12">
            <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[var(--accent)] block mb-2">
              Collector Stories
            </span>
            <h2 className="font-serif text-[2rem] sm:text-[2.5rem] text-[var(--text)] tracking-tight">
              Cherished in Homes Worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[var(--bg)] border border-[var(--border)] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex text-[var(--accent-gold)] mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-[13px] text-[var(--text-muted)] italic leading-relaxed mb-4">
                  &ldquo;The Madurai Jigarthanda stall was the absolute centerpiece of our Navaratri Golu this year! 
                  The tiny glass bottles and brass churner had every single guest taking close-up photos.&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-[12px] font-bold text-[var(--text)]">Lakshmi Ramanathan</p>
                <p className="text-[10px] text-[var(--text-muted)]">Chennai • Golu Enthusiast</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[var(--bg)] border border-[var(--border)] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex text-[var(--accent-gold)] mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-[13px] text-[var(--text-muted)] italic leading-relaxed mb-4">
                  &ldquo;We ordered 40 Miniature Vegetable Crates and Fruit Baskets as wedding return gifts. 
                  They were packed safely and our guests were so touched by such a unique, artistic keepsake.&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-[12px] font-bold text-[var(--text)]">Aditi & Karthik</p>
                <p className="text-[10px] text-[var(--text-muted)]">Bangalore • Wedding Return Gifts</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[var(--bg)] border border-[var(--border)] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex text-[var(--accent-gold)] mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-[13px] text-[var(--text-muted)] italic leading-relaxed mb-4">
                  &ldquo;Living in the US, having the Dosa stall and Filter Coffee miniatures on our shelf brings 
                  such warm nostalgia of Sunday mornings in Tamil Nadu. The craft detail is breathtaking.&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-[12px] font-bold text-[var(--text)]">Sowmya Venkat</p>
                <p className="text-[10px] text-[var(--text-muted)]">California, USA • Miniature Collector</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          8. BOTTOM CTA BANNER: Custom Orders & Corporate Gifting
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative w-full py-12 bg-gradient-to-r from-[var(--accent)] via-[#be442b] to-[#a83c25] text-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 text-center">
          <h3 className="font-serif text-[1.8rem] sm:text-[2.2rem] font-bold mb-3 tracking-tight">
            Have a Bespoke Clay Sculpture or Miniature in Mind?
          </h3>
          <p className="text-white/80 text-[13px] sm:text-[14px] max-w-[560px] mx-auto mb-6">
            We hand-sculpt custom family street scenes, personalized heirloom clocks, and wedding return gift sets.
          </p>
          <a
            href="https://wa.me/918300034451"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-[var(--accent)] text-[11px] font-bold tracking-widest uppercase hover:bg-[var(--bg-subtle)] transition-all shadow-xl"
          >
            <MessageCircle size={15} />
            Chat with the Artisan on WhatsApp
          </a>
        </div>
      </section>

    </div>
  );
}
