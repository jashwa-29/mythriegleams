"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { CartItem } from "@/redux/slices/cartSlice";
import { getImageUrl } from '@/utils/getImageUrl';

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
            className="fixed top-0 right-0 bottom-0 w-[420px] max-w-[100vw] bg-[var(--bg)] z-[999] flex flex-col shadow-2xl border-l border-[var(--border)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--border)]">
              <div>
                <h2 className="text-[var(--text)] text-xl md:text-2xl font-bold tracking-tight leading-tight">Your Collection</h2>
                <p className="text-[var(--text-faint)] text-[10px] font-bold uppercase tracking-[0.25em] mt-1">{totalItems} piece{totalItems !== 1 ? "s" : ""} selected</p>
              </div>
              <button
                onClick={close}
                className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--text)] hover:text-white transition-all"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-grow overflow-y-auto px-8 py-6 flex flex-col gap-6">
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-[var(--text-faint)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
                  <div className="w-20 h-20 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center">
                    <ShoppingBag size={28} className="text-[var(--text-faint)]/60" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[var(--text)] text-2xl font-bold tracking-tight">Your cart is empty</p>
                    <p className="text-[var(--text-muted)] text-[15px] leading-relaxed mt-1 max-w-[220px]">
                      Discover handcrafted pieces to fill your home with warmth.
                    </p>
                  </div>
                  <button
                    onClick={close}
                    className="mt-2 px-8 py-3 bg-[var(--text)] text-white rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[var(--accent)] transition-all"
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
                  className="flex gap-4 pb-6 border-b border-[var(--border)] last:border-0"
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[var(--bg-subtle)] border border-[var(--border)] shrink-0">
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-faint)] text-xs font-light italic">No image</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-grow flex flex-col gap-1">
                    <h4 className="text-[var(--text)] text-[15px] font-bold leading-tight">{item.name}</h4>
                    {(item.selectedVariant || item.selectedColor) && (
                      <span className="text-[10px] text-[var(--text-faint)] font-bold uppercase tracking-[0.15em]">
                        {[item.selectedVariant, item.selectedColor].filter(Boolean).join(" · ")}
                      </span>
                    )}
                    {item.customerImage && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <img src={item.customerImage} alt="Your photo" className="w-6 h-6 rounded-md object-cover border border-[var(--border)]" />
                        <span className="text-[9px] text-[var(--text-faint)] font-medium">Your photo</span>
                      </div>
                    )}
                    <span className="text-[14px] font-bold text-[var(--text)] mt-0.5">₹{item.price.toLocaleString()}</span>

                    {/* Qty control */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-[var(--border)] rounded-xl overflow-hidden bg-white">
                        <button
                          onClick={() => setQty(item, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] transition-colors"
                        >
                          <Minus size={12} strokeWidth={2} />
                        </button>
                        <span className="w-8 text-center text-[13px] font-bold text-[var(--text)]">{item.quantity}</span>
                        <button
                          onClick={() => setQty(item, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] transition-colors"
                        >
                          <Plus size={12} strokeWidth={2} />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(item)}
                        className="text-[var(--text-faint)] hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="text-right shrink-0">
                    <span className="text-[var(--text)] text-[15px] font-bold">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-8 py-6 border-t border-[var(--border)] bg-white space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Subtotal</span>
                  <span className="text-[var(--text)] text-xl md:text-2xl font-bold tracking-tight">₹{totalPrice.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-[var(--text-faint)]">Shipping & taxes calculated at checkout.</p>

                <Link
                  href="/checkout"
                  onClick={close}
                  className="w-full h-14 bg-[var(--text)] text-white rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[var(--accent)] transition-all flex items-center justify-center gap-3"
                >
                  Proceed to Checkout <ArrowRight size={15} strokeWidth={1.5} />
                </Link>
                <a
                  href={`https://wa.me/918300034451?text=${encodeURIComponent(`Hi! I'd like to order: ${items.map(c => `${c.name}${[c.selectedVariant, c.selectedColor].filter(Boolean).length ? ` (${[c.selectedVariant, c.selectedColor].filter(Boolean).join(", ")})` : ""} x${c.quantity}${c.customerImage ? " [photo attached]" : ""}`).join(", ")}`)}`}
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