"use client";

import Link from "next/link";
import { CATEGORIES } from "@/data/categories";
import { type Product } from "@/data/products";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag } from "lucide-react";
import { getImageUrl } from '@/utils/getImageUrl';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const catTitle = (CATEGORIES as any)[product.category]?.title || product.category;
  const { addToCart } = useCart();

  const productSlug  = product.slug || product.id;
  const productId    = (product as any)._id || String(product.id);
  const productImage = (product as any).images?.[0] ?? null;
  const productPrice = product.price;
  const productMRP   = (product as any).mrp || (product as any).oldPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: productId,
      name:      product.name,
      image:     productImage || "",
      price:     productPrice,
      weight:    product.weight || 0,
      quantity:  1,
    });
  };

  const requiresImage = !!(product as any).requiresImage;

  return (
    <div className="group relative w-full rounded-xl bg-white overflow-hidden shadow-[0_1px_10px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_-6px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out border border-gray-100 flex flex-col">
      <div className="relative w-full aspect-square overflow-hidden bg-[#faf9f8]">
        <Link href={`/product/${productSlug}`} className="block absolute inset-0">
          {/* Image */}
          {productImage ? (
            <img
              src={getImageUrl(productImage)}
              alt={product.name}
              className="w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-light font-serif italic">
              No Image
            </div>
          )}

          {/* Overlay gradient on hover for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />

          {/* Badges */}
          {((product as any).badge || (productMRP && productMRP > productPrice)) && (
            <div className="absolute top-2 left-2 z-10 transition-transform duration-500 group-hover:translate-y-0.5">
              <span className="px-2 py-1 rounded-full text-[8px] tracking-wider uppercase bg-white/90 backdrop-blur-sm text-gray-900 font-bold shadow-sm">
                {(product as any).badge === "new" ? "New" : (product as any).badge === "hot" ? "Trending" : "Artisanal"}
              </span>
            </div>
          )}
        </Link>

        {/* Hover Quick Add Button (Bottom slide-up) — sibling of the image Link, never nested */}
        {requiresImage ? (
          <Link
            href={`/product/${productSlug}`}
            onClick={(e) => { e.stopPropagation(); }}
            className="absolute bottom-2 left-2 right-2 translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20 flex items-center justify-center gap-1.5 bg-white/90 backdrop-blur-md text-[#2d2926] py-2 rounded-lg shadow-md font-bold text-[9px] uppercase tracking-wider hover:bg-[#2d2926] hover:text-white"
          >
            <ShoppingBag size={12} strokeWidth={2} /> Upload Photo
          </Link>
        ) : (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 left-2 right-2 translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20 flex items-center justify-center gap-1.5 bg-white/90 backdrop-blur-md text-[#2d2926] py-2 rounded-lg shadow-md font-bold text-[9px] uppercase tracking-wider hover:bg-[#2d2926] hover:text-white"
          >
            <ShoppingBag size={12} strokeWidth={2} /> Quick Add
          </button>
        )}
      </div>

      {/* Details Section */}
      <div className="p-3 flex flex-col flex-1 bg-white z-10 relative">
        <div className="flex justify-between items-start gap-2 mb-1">
          <Link href={`/product/${productSlug}`} className="flex-1">
            <h3 className="text-[12px] font-bold text-[#2d2926] leading-snug line-clamp-2 group-hover:text-[#a69076] transition-colors duration-300">
              {product.name}
            </h3>
          </Link>
          <div className="flex flex-col items-end shrink-0 pt-0.5">
            <span className="text-[12px] font-bold text-[#2d2926] leading-none">
              ₹{productPrice.toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-end mt-auto pt-1">
          <span className="text-[8px] uppercase tracking-[0.2em] font-semibold text-[#a69076]/90">
            {catTitle}
          </span>
          {productMRP && productMRP > productPrice && (
            <span className="text-[9px] text-gray-400 line-through font-medium">
              ₹{productMRP.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
