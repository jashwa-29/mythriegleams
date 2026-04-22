"use client";

import Link from "next/link";
import { CATEGORIES } from "@/data/categories";
import { type Product } from "@/data/products";
import { useCart } from "@/hooks/useCart";
import { Plus } from "lucide-react";

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
      quantity:  1,
    });
  };

  return (
    <Link
      href={`/product/${productSlug}`}
      className="group bg-white rounded-[2rem] overflow-hidden transition-all duration-700 hover:-translate-y-3 hover:shadow-xl hover:shadow-[#e8e4db]/50 relative flex flex-col border border-[#e8e4db]/40"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f8f6f3]">
        {productImage ? (
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:opacity-90"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-[#a1988c] font-light font-serif italic">
            No Artifact Preview
          </div>
        )}

        {/* Badge */}
        {((product as any).badge || (productMRP && productMRP > productPrice)) && (
          <span className="absolute top-4 left-4 px-4 py-1.5 rounded-full text-[9px] tracking-[0.2em] uppercase bg-white/90 backdrop-blur-sm text-[#594a3c] shadow-sm font-medium border border-[#e8e4db]">
            {(product as any).badge === "new" ? "New Arrival" : (product as any).badge === "hot" ? "Trending" : "Artisanal Selection"}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-6 flex-grow flex flex-col bg-white">
        <div className="text-[10px] tracking-[0.2em] uppercase text-[#a69076] mb-2 font-medium">{catTitle}</div>
        <h3 className="font-serif text-[1.15rem] text-[#3d332a] leading-tight mb-3 group-hover:text-[#a69076] transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 mb-6">
          <span className="text-[#a69076] text-[10px]">{"★".repeat(Math.floor(product.rating || 5))}</span>
          <span className="text-[10px] text-[#a1988c]">
            ({(product as any).reviews || (product as any).reviewCount || 0} Appraisals)
          </span>
        </div>

        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col">
            {productMRP && productMRP > productPrice && (
              <span className="text-[10px] text-[#a1988c] line-through mb-0.5">₹{productMRP.toLocaleString()}</span>
            )}
            <span className="font-serif text-[1.35rem] text-[#594a3c] leading-none">₹{productPrice.toLocaleString()}</span>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-11 h-11 rounded-full bg-[#f8f6f3] text-[#594a3c] flex items-center justify-center group-hover:bg-[#3d332a] group-hover:text-white transition-all duration-500 border border-[#e8e4db] hover:scale-105"
            aria-label="Add to cart"
          >
            <Plus size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
