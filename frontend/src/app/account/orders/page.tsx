"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { getMyOrders } from "@/redux/slices/orderSlice";
import Breadcrumb from "@/components/Breadcrumb";
import { Package, ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_COLORS: Record<string, string> = {
  "Pending": "bg-[#fff8e6] text-[#b48d28] border-[#f2e6c4]",
  "Handcrafting": "bg-[#edf5ef] text-[#6b856f] border-[#d2e3d5]",
  "Quality Check": "bg-[#eef3fb] text-[#557eb3] border-[#d6e3f4]",
  "Dispatched": "bg-[#f4ebea] text-[#b46a62] border-[#e1cac7]",
  "Delivered": "bg-[#3d332a] text-white border-[#3d332a]",
  "Cancelled": "bg-[#f8f6f3] text-[#a1988c] border-[#e8e4db]",
};

export default function MyOrdersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { userInfo } = useAppSelector((s) => s.auth);
  const { orders, loading, error } = useAppSelector((s) => s.orders);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!userInfo) {
      router.replace("/account");
    } else {
      dispatch(getMyOrders());
    }
  }, [userInfo, dispatch, router]);

  if (!mounted || !userInfo) return null;

  return (
    <div className="min-h-screen bg-[#fdfdfb]">
      <Breadcrumb items={[{ label: "Account", href: "/account" }, { label: "My Orders" }]} />

      <div className="max-w-[1000px] mx-auto px-6 py-12 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e8e4db] pb-6 mb-10">
          <div>
            <h1 className="text-3xl font-serif text-[#3d332a]">Order History</h1>
            <p className="text-[13px] text-[#8c8273] mt-2 font-light tracking-wide">
              Track and manage your artisan pieces
            </p>
          </div>
          <Link
            href="/category/all"
            className="flex items-center gap-2 px-6 py-3 bg-[#f8f6f3] text-[#594a3c] rounded-xl text-[12px] font-medium tracking-wide hover:bg-[#e8e4db] transition-colors border border-[#e8e4db]"
          >
            <ArrowLeft size={14} strokeWidth={1.5} /> Continue Shopping
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#a1988c] gap-4">
            <Loader2 size={32} strokeWidth={1.5} className="animate-spin" />
            <p className="text-[12px] uppercase tracking-widest font-medium">Loading Orders...</p>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-50 text-red-600 rounded-3xl text-center border border-red-100">
            {error}
          </div>
        ) : !orders || orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-[#e8e4db] py-32 px-6 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <div className="w-20 h-20 rounded-full bg-[#f8f6f3] text-[#a69076] flex items-center justify-center mb-6">
              <Package size={28} strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-2xl text-[#3d332a] mb-2">No Orders Yet</h2>
            <p className="text-[#8c8273] max-w-[300px] font-light leading-relaxed mb-8">
              Your collection is waiting to be started. Explore our handcrafted artifacts.
            </p>
            <Link
              href="/category/all"
              className="px-8 py-4 bg-[#3d332a] text-white rounded-xl text-[12px] font-medium tracking-wide hover:bg-[#594a3c] transition-all flex items-center gap-3"
            >
              Explore Collection <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-6">
            {orders.map((order: any) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] border border-[#e8e4db] overflow-hidden shadow-sm hover:shadow-md hover:shadow-[#3d332a]/5 transition-all"
              >
                {/* Header */}
                <div className="px-6 py-5 sm:px-8 border-b border-[#e8e4db] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#fdfdfb]">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-[#8c8273] font-medium">Order Placed</p>
                      <p className="text-[13px] text-[#3d332a] font-medium mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-[#8c8273] font-medium">Total</p>
                      <p className="text-[13px] text-[#3d332a] font-medium mt-0.5">
                        ₹{order.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#8c8273] font-medium sm:mb-0.5">Order ID</p>
                    <p className="text-[12px] text-[#3d332a] font-serif tracking-wider uppercase">
                      #{order._id.slice(-8)}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6 sm:px-8 flex flex-col lg:flex-row gap-8 lg:gap-12 lg:items-center justify-between">
                  {/* Items */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className={`px-3 py-1 text-[10px] uppercase tracking-widest font-medium rounded-full border ${
                          STATUS_COLORS[order.status] || STATUS_COLORS["Pending"]
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.trackingNumber && (
                        <p className="text-[11px] text-[#8c8273]">
                          Tracking: <span className="font-medium text-[#594a3c]">{order.trackingNumber}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-4">
                      {order.orderItems.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#f8f6f3] border border-[#e8e4db] shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#a1988c] text-[10px]">No Img</div>
                            )}
                          </div>
                          <div>
                            <Link href={`/product/${item.product}`} className="font-serif text-[15px] text-[#3d332a] hover:text-[#a69076] transition-colors line-clamp-1">
                              {item.name}
                            </Link>
                            <p className="text-[12px] text-[#8c8273] mt-0.5">Qty: {item.qty}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col gap-3 lg:items-end border-t lg:border-t-0 lg:border-l border-[#e8e4db] pt-6 lg:pt-0 lg:pl-12">
                    <Link
                      href={`/account/orders/${order._id}`}
                      className="px-6 py-3 w-full lg:w-auto text-center bg-[#3d332a] text-white rounded-xl text-[12px] font-medium tracking-wide hover:bg-[#594a3c] transition-all"
                    >
                      View Details
                    </Link>
                    <a
                      href={`https://wa.me/918300034451?text=Hello,%20I'm%20inquiring%20about%20my%20order%20%23${order._id.slice(-8).toUpperCase()}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 w-full lg:w-auto text-center border border-[#e8e4db] rounded-xl text-[12px] font-medium text-[#594a3c] hover:bg-[#f8f6f3] transition-colors"
                    >
                      Need Help?
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
