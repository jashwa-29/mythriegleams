"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/api";
import { useAppSelector } from "@/redux/hooks";
import Breadcrumb from "@/components/Breadcrumb";
import { 
  ArrowLeft, Package, MapPin, CreditCard, 
  CheckCircle2, Clock, Truck, Home, FileText 
} from "lucide-react";
import { motion } from "framer-motion";

const STATUS_COLORS: Record<string, string> = {
  "Pending": "bg-[#fff8e6] text-[#b48d28] border-[#f2e6c4]",
  "Handcrafting": "bg-[#edf5ef] text-[#6b856f] border-[#d2e3d5]",
  "Quality Check": "bg-[#eef3fb] text-[#557eb3] border-[#d6e3f4]",
  "Dispatched": "bg-[#f4ebea] text-[#b46a62] border-[#e1cac7]",
  "Delivered": "bg-[#3d332a] text-white border-[#3d332a]",
  "Cancelled": "bg-[#f8f6f3] text-[#a1988c] border-[#e8e4db]",
};
const STATUS_STEPS = ["Pending", "Handcrafting", "Quality Check", "Dispatched", "Delivered"];

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { userInfo } = useAppSelector((s) => s.auth);
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfdfb] flex flex-col items-center justify-center">
        <Package size={32} className="animate-pulse text-[#a69076] mb-4" />
        <p className="text-[12px] uppercase tracking-widest text-[#8c8273]">Retrieving Order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#fdfdfb] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
          <FileText size={24} />
        </div>
        <h1 className="text-2xl font-serif text-[#3d332a] mb-2">Order Not Found</h1>
        <p className="text-[#8c8273] mb-8">{error || "We couldn't locate this order."}</p>
        <Link href="/account/orders" className="px-6 py-3 bg-[#3d332a] text-white rounded-xl text-[12px] font-medium tracking-wide">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const stepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="min-h-screen bg-[#fdfdfb]">
      <Breadcrumb items={[
        { label: "Account", href: "/account" }, 
        { label: "Orders", href: "/account/orders" },
        { label: `Order #${order._id.slice(-8)}` }
      ]} />

      <div className="max-w-[1200px] mx-auto px-6 py-10 lg:py-16">
        <Link href="/account/orders" className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-widest text-[#a1988c] hover:text-[#594a3c] transition-colors mb-10">
          <ArrowLeft size={14} /> Back to History
        </Link>

        {/* ─── Header ─── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-serif text-[#3d332a]">Order <span className="uppercase text-[#a69076]">#{order._id.slice(-8)}</span></h1>
              <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-medium rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS["Pending"]}`}>
                {order.status}
              </span>
            </div>
            <p className="text-[14px] text-[#8c8273] flex items-center gap-2">
              <Clock size={14} className="text-[#a69076]" />
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: '2-digit', minute:'2-digit' })}
            </p>
          </div>
          {(order.trackingNumber || order.deliveryNote) && (
            <div className="px-5 py-4 bg-[#f8f6f3] border border-[#e8e4db] rounded-2xl flex items-start gap-4 max-w-[400px]">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#a69076] shadow-sm shrink-0">
                <Truck size={18} />
              </div>
              <div className="flex flex-col gap-3 mt-0.5">
                {order.trackingNumber && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#8c8273] font-medium">Tracking Info</p>
                    <p className="text-[14px] font-medium text-[#3d332a] tracking-wide mt-0.5 font-mono">{order.trackingNumber}</p>
                  </div>
                )}
                {order.deliveryNote && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#8c8273] font-medium">Courier Notes</p>
                    <p className="text-[12px] text-[#594a3c] mt-0.5 bg-white p-2 border border-[#e8e4db] rounded-lg shadow-sm italic leading-relaxed">{order.deliveryNote}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Status Visualizer ─── */}
        {order.status !== "Cancelled" && (
          <div className="bg-white rounded-[2rem] border border-[#e8e4db] p-8 md:p-12 mb-10 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[600px] relative">
              {/* background tracking line */}
              <div className="absolute left-6 right-6 top-5 h-[2px] bg-[#f0ece5] -z-0"></div>
              {/* active tracking line */}
              <div className="absolute left-6 top-5 h-[2px] bg-[#3d332a] -z-0 transition-all duration-1000" style={{ width: `${(Math.max(0, stepIdx) / (STATUS_STEPS.length - 1)) * 100}%` }}></div>

              {STATUS_STEPS.map((step, i) => {
                const isActive = i <= stepIdx;
                return (
                  <div key={step} className="flex flex-col items-center gap-3 relative z-10 w-24">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white transition-colors duration-500 ${isActive ? "bg-[#3d332a] text-white shadow-md shadow-[#3d332a]/20" : "bg-[#f0ece5] text-[#a1988c]"}`}>
                      {isActive ? <CheckCircle2 size={18} /> : <span className="text-[12px] font-medium">{i + 1}</span>}
                    </div>
                    <span className={`text-[10px] uppercase tracking-[0.1em] text-center w-max ${isActive ? "text-[#3d332a] font-medium" : "text-[#a1988c]"}`}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* ─── Left Column: Items ─── */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white rounded-[2rem] border border-[#e8e4db] overflow-hidden">
              <div className="px-8 py-6 border-b border-[#e8e4db] bg-[#fdfdfb]">
                <h2 className="font-serif text-xl text-[#3d332a]">Order Items</h2>
              </div>
              <div className="p-8 flex flex-col gap-6">
                {order.orderItems.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-6 pb-6 border-b border-[#e8e4db] last:border-0 last:pb-0">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#f8f6f3] border border-[#e8e4db] shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#a1988c]"><Home size={20} /></div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <Link href={`/product/${item.product}`} className="font-serif text-[18px] text-[#3d332a] hover:text-[#a69076] transition-colors inline-block mb-1">
                        {item.name}
                      </Link>
                      {item.selectedVariant && <p className="text-[11px] text-[#8c8273] uppercase tracking-wide mb-2">{item.selectedVariant}</p>}
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-[13px] text-[#8c8273]">Qty: <span className="font-medium text-[#3d332a]">{item.qty}</span></p>
                        <p className="font-serif text-[16px] text-[#594a3c]">₹{(item.price * item.qty).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Need Help CTA */}
            <div className="bg-[#f8f6f3] rounded-[2rem] p-8 border border-[#e8e4db] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-serif text-lg text-[#3d332a] mb-1">Need help with your order?</h3>
                <p className="text-[13px] text-[#8c8273] font-light">Contact our artisan care team via WhatsApp directly.</p>
              </div>
              <a
                href={`https://wa.me/918300034451?text=Hello,%20I'm%20inquiring%20about%20my%20order%20%23${order._id.slice(-8).toUpperCase()}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#3d332a] text-white rounded-xl text-[12px] font-medium tracking-wide hover:bg-[#594a3c] transition-all whitespace-nowrap"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* ─── Right Column: Summary & Info ─── */}
          <div className="flex flex-col gap-8">
            
            {/* Payment & Summary */}
            <div className="bg-white rounded-[2rem] border border-[#e8e4db] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#e8e4db] bg-[#fdfdfb] flex items-center gap-3">
                <CreditCard size={18} className="text-[#a69076]" />
                <h3 className="font-serif text-lg text-[#3d332a]">Payment</h3>
              </div>
              <div className="p-6 text-[13px]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#8c8273]">Status</span>
                  <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-widest font-medium ${order.isPaid ? 'bg-[#edf5ef] text-[#6b856f]' : 'bg-[#fff8e6] text-[#b48d28]'}`}>
                    {order.isPaid ? 'Paid' : 'Cash on Delivery'}
                  </span>
                </div>
                {order.isPaid && order.razorpayPaymentId && (
                  <div className="flex items-center justify-between mb-4 border-b border-[#e8e4db] pb-4">
                    <span className="text-[#8c8273]">Transaction</span>
                    <span className="text-[#3d332a] font-mono text-[11px]">{order.razorpayPaymentId}</span>
                  </div>
                )}
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-[#8c8273]">
                    <span>Items Total</span>
                    <span>₹{order.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#8c8273]">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[#e8e4db] mt-2">
                    <span className="font-serif text-[16px] text-[#3d332a]">Grand Total</span>
                    <span className="font-serif text-xl text-[#3d332a]">₹{order.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-[2rem] border border-[#e8e4db] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#e8e4db] bg-[#fdfdfb] flex items-center gap-3">
                <MapPin size={18} className="text-[#a69076]" />
                <h3 className="font-serif text-lg text-[#3d332a]">Delivery Details</h3>
              </div>
              <div className="p-6 text-[13px] text-[#594a3c] leading-relaxed">
                <p className="font-medium text-[14px] text-[#3d332a] mb-2">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                
                <div className="mt-4 pt-4 border-t border-[#e8e4db] space-y-1">
                  <p className="text-[#8c8273] font-light">Email: <span className="text-[#594a3c]">{order.shippingAddress.email}</span></p>
                  <p className="text-[#8c8273] font-light">Phone: <span className="text-[#594a3c]">{order.shippingAddress.phone}</span></p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
