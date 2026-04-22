"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { CartItem } from "@/redux/slices/cartSlice";

export default function CartDrawer() {
  const { items, isOpen, close, setQty, remove, totalPrice, totalItems, loading } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[998]"
            onClick={close}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[420px] max-w-[100vw] bg-[#fdfdfb] z-[999] flex flex-col shadow-2xl border-l border-[#e8e4db]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#e8e4db]">
              <div>
                <h2 className="font-serif text-[1.4rem] text-[#3d332a] tracking-tight">Your Collection</h2>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#a69076] mt-0.5">{totalItems} piece{totalItems !== 1 ? "s" : ""} selected</p>
              </div>
              <button
                onClick={close}
                className="w-10 h-10 rounded-full bg-[#f8f6f3] border border-[#e8e4db] flex items-center justify-center text-[#8c8273] hover:bg-[#3d332a] hover:text-white transition-all"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-grow overflow-y-auto px-8 py-6 flex flex-col gap-6">
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-[#a69076] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
                  <div className="w-20 h-20 rounded-full bg-[#f8f6f3] border border-[#e8e4db] flex items-center justify-center">
                    <ShoppingBag size={28} className="text-[#a69076]/40" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-serif text-xl text-[#3d332a]">Your cart is empty</p>
                    <p className="text-[13px] text-[#8c8273] font-light mt-1 max-w-[200px]">
                      Discover handcrafted pieces to fill your home with warmth.
                    </p>
                  </div>
                  <button
                    onClick={close}
                    className="mt-2 px-8 py-3 bg-[#3d332a] text-white rounded-xl text-[12px] font-medium tracking-wide hover:bg-[#594a3c] transition-all"
                  >
                    Browse Collection
                  </button>
                </div>
              )}

              {!loading && items.map((item: CartItem) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  className="flex gap-4 pb-6 border-b border-[#e8e4db] last:border-0"
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#f8f6f3] border border-[#e8e4db] shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#a1988c] text-xs font-light font-serif italic">No image</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-grow flex flex-col gap-1">
                    <h4 className="font-serif text-[15px] text-[#3d332a] leading-tight">{item.name}</h4>
                    {item.selectedVariant && (
                      <span className="text-[10px] text-[#a69076] tracking-[0.1em] uppercase">{item.selectedVariant}</span>
                    )}
                    <span className="text-[14px] font-medium text-[#594a3c] mt-0.5">₹{item.price.toLocaleString()}</span>

                    {/* Qty control */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-[#e8e4db] rounded-xl overflow-hidden bg-white">
                        <button
                          onClick={() => setQty(item, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-[#8c8273] hover:bg-[#f8f6f3] transition-colors"
                        >
                          <Minus size={12} strokeWidth={2} />
                        </button>
                        <span className="w-8 text-center text-[13px] font-medium text-[#3d332a]">{item.quantity}</span>
                        <button
                          onClick={() => setQty(item, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-[#8c8273] hover:bg-[#f8f6f3] transition-colors"
                        >
                          <Plus size={12} strokeWidth={2} />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(item)}
                        className="text-[#a1988c] hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="text-right shrink-0">
                    <span className="font-serif text-[15px] text-[#594a3c]">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-8 py-6 border-t border-[#e8e4db] bg-white space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#8c8273]">Subtotal</span>
                  <span className="font-serif text-2xl text-[#3d332a]">₹{totalPrice.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-[#a1988c]">Shipping & taxes calculated at checkout.</p>

                <Link
                  href="/checkout"
                  onClick={close}
                  className="w-full h-14 bg-[#3d332a] text-white rounded-xl text-[12px] font-medium tracking-[0.15em] uppercase hover:bg-[#594a3c] transition-all flex items-center justify-center gap-3"
                >
                  Proceed to Checkout <ArrowRight size={15} strokeWidth={1.5} />
                </Link>
                <a
                  href={`https://wa.me/918300034451?text=${encodeURIComponent(`Hi! I'd like to order: ${items.map(c => `${c.name} x${c.quantity}`).join(", ")}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 bg-[#25D366] text-white rounded-xl text-[12px] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  💬 Order via WhatsApp
                </a>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
