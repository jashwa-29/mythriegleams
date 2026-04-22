"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { createOrder, resetOrderSuccess } from "@/redux/slices/orderSlice";
import { clearCartThunk, clearGuest } from "@/redux/slices/cartSlice";
import { useCart } from "@/hooks/useCart";
import Breadcrumb from "@/components/Breadcrumb";
import {
  MapPin, User, Mail, Phone, Home, Package,
  CheckCircle2, ShoppingBag, ArrowLeft, AlertCircle, Loader2
} from "lucide-react";

interface ShippingForm {
  label: string;
  name: string; email: string; phone: string;
  street: string; city: string; state: string; zip: string;
}
type FormErrors = Partial<Record<keyof ShippingForm, string>>;

function validate(f: ShippingForm): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim())   e.name   = "Full name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Valid email required.";
  if (!/^\d{10}$/.test(f.phone.replace(/\s/g, ""))) e.phone = "Enter a valid 10-digit phone.";
  if (!f.street.trim()) e.street = "Street address is required.";
  if (!f.city.trim())   e.city   = "City is required.";
  if (!f.state.trim())  e.state  = "State is required.";
  if (!/^\d{6}$/.test(f.zip)) e.zip = "Enter a valid 6-digit PIN code.";
  return e;
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Puducherry","Other"
];

const STATUS_STEPS = ["Pending","Handcrafting","Quality Check","Dispatched","Delivered"];

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();

  const { items, totalPrice, isAuth, clear } = useCart();
  const userInfo = useAppSelector(s => s.auth.userInfo);
  const { loading, error, success, currentOrder } = useAppSelector(s => s.orders);

  const [form, setForm] = useState<ShippingForm>({
    label: "Home",
    name: userInfo?.name || "", email: userInfo?.email || "",
    phone: "", street: "", city: "", state: "Tamil Nadu", zip: "",
  });

  const [userAddresses, setUserAddresses] = useState<any[]>([]);

  useEffect(() => {
    if (isAuth) {
      const fetchUserDetails = async () => {
        try {
          const { data } = await api.get("/users/me");
          if (data.success && data.user) {
            const u = data.user;
            setUserAddresses(u.addresses || []);
            const defAddr = u.addresses?.find((a: any) => a.isDefault) || u.addresses?.[0];
            
            setForm({
              label: defAddr?.label || "Home",
              name: u.name || "",
              email: u.email || "",
              phone: u.phone || "",
              street: defAddr?.street || "",
              city: defAddr?.city || "",
              state: defAddr?.state || "Tamil Nadu",
              zip: defAddr?.zip || "",
            });
          }
        } catch (err) {
          console.error("Failed to auto-fill checkout details", err);
        }
      };
      fetchUserDetails();
    }
  }, [isAuth]);

  const selectAddress = (addr: any) => {
    setForm(prev => ({
      ...prev,
      label: addr.label,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zip: addr.zip
    }));
  };

  const [touched, setTouched] = useState<Partial<Record<keyof ShippingForm, boolean>>>({});
  const [errors, setErrors]   = useState<FormErrors>({});
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuth) {
      router.push("/login?redirect=/checkout");
    }
  }, [isAuth, router]);

  // Redirect empty cart
  useEffect(() => {
    if (!paymentSuccess && !success && items.length === 0) router.replace("/category/all");
  }, [items, paymentSuccess, success, router]);

  const touch = (k: keyof ShippingForm) => setTouched(p => ({ ...p, [k]: true }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    if (touched[name as keyof ShippingForm]) setErrors(validate(updated));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(form).map(k => [k, true]));
    setTouched(allTouched as any);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const orderData = {
      orderItems: items.map(i => ({
        name: i.name, qty: i.quantity, image: i.image,
        price: i.price, product: i.product,
      })),
      shippingAddress: form,
      totalPrice,
    };

    dispatch(createOrder({ orderData, isGuest: false })).then((res: any) => {
      if (res.meta.requestStatus === "fulfilled") {
        const order = res.payload;
        handleRazorpay(order._id, order.totalPrice);
      }
    });
  };

  const handleRazorpay = async (orderId: string, amount: number) => {
    try {
      setIsProcessingPayment(true);
      
      const { data: createData } = await api.post('/payments/razorpay/create', { orderId });
      const { id: rzpOrderId, key } = createData.data;

      const options = {
        key: key,
        amount: amount * 100,
        currency: "INR",
        name: "Mythris Gleams",
        description: "Artisan Selection",
        order_id: rzpOrderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await api.post('/payments/razorpay/verify', {
              internalOrderId: orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.data.success) {
              setPaymentSuccess(true);
              setIsProcessingPayment(false);
              if (isAuth) dispatch(clearCartThunk());
              else dispatch(clearGuest());
            }
          } catch (error) {
            console.error(error);
            setIsProcessingPayment(false);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone
        },
        theme: {
          color: "#3d332a"
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setIsProcessingPayment(false);
        alert("Payment failed: " + response.error.description);
      });
      rzp.open();

    } catch (error: any) {
      console.error(error);
      setIsProcessingPayment(false);
      const apiMsg = error.response?.data?.error || error.response?.data?.message;
      alert(apiMsg || "Failed to initiate payment. Please try again.");
    }
  };

  const inputBase = "w-full bg-[#f8f6f3] border rounded-xl px-5 py-4 text-[14px] text-[#3d332a] focus:outline-none transition-colors placeholder:text-[#c4b09a]";
  const inputClass = (k: keyof ShippingForm) =>
    `${inputBase} ${touched[k] && errors[k] ? "border-red-300 focus:border-red-400" : "border-[#e8e4db] focus:border-[#a69076]"}`;

  const FieldError = ({ field }: { field: keyof ShippingForm }) =>
    touched[field] && errors[field] ? (
      <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1">
        <AlertCircle size={11} />{errors[field]}
      </p>
    ) : null;

  /* ─── Success / Confirmation Screen ─────────────────────────── */
  if (paymentSuccess && currentOrder) {
    const stepIdx = STATUS_STEPS.indexOf(currentOrder.status);
    return (
      <div className="min-h-screen bg-[#fdfdfb] flex flex-col items-center justify-center px-6 py-20 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <div className="w-24 h-24 rounded-full bg-[#edf5ef] border border-[#849b87]/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={44} className="text-[#6b856f]" strokeWidth={1.5} />
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-serif text-[#3d332a] mb-3">Order Confirmed!</h1>
          <p className="text-[#8c8273] max-w-[420px] mx-auto font-light leading-relaxed mb-2">
            Your artisan order <span className="text-[#594a3c] font-medium font-serif">#{currentOrder._id?.slice(-8).toUpperCase()}</span> has been placed and is now in our queue.
          </p>
          <p className="text-[12px] text-[#a1988c] mb-10">A confirmation has been sent to <strong>{currentOrder.shippingAddress?.email}</strong></p>

          {/* Status tracker */}
          <div className="flex items-center justify-center gap-0 mb-12 overflow-x-auto max-w-[600px] mx-auto pb-2">
            {STATUS_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium transition-all ${i <= stepIdx ? "bg-[#3d332a] text-white" : "bg-[#f0ece5] text-[#a1988c] border border-[#e8e4db]"}`}>
                    {i < stepIdx ? "✓" : i + 1}
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.1em] text-[#8c8273] max-w-[60px] text-center leading-tight">{step}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`h-[1px] w-10 sm:w-16 shrink-0 mb-6 ${i < stepIdx ? "bg-[#3d332a]" : "bg-[#e8e4db]"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                dispatch(resetOrderSuccess());
                setPaymentSuccess(false);
              }}
              className="px-8 py-4 bg-[#3d332a] text-white rounded-xl text-[12px] font-medium tracking-wide hover:bg-[#594a3c] transition-all"
            >
              Continue Shopping
            </button>
            {isAuth && (
              <Link href="/account/orders" className="px-8 py-4 bg-white border border-[#e8e4db] text-[#594a3c] rounded-xl text-[12px] font-medium tracking-wide hover:bg-[#f8f6f3] transition-all">
                View My Orders
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── Main Checkout Form ─────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#fdfdfb]">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Breadcrumb items={[{ label: "Vault", href: "/category/all" }, { label: "Checkout" }]} />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

        {/* ─── LEFT: Form ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-7 flex flex-col gap-8">

          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#a69076]">Step 1 of 1</span>
            <h1 className="text-3xl font-serif text-[#3d332a] mt-2">Delivery Details</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            <fieldset disabled={loading || isProcessingPayment} className={`flex flex-col gap-6 border-none p-0 m-0 min-w-0 transition-all duration-300 ${loading || isProcessingPayment ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="bg-white rounded-[2rem] border border-[#e8e4db] p-8 flex flex-col gap-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#f8f6f3] border border-[#e8e4db] flex items-center justify-center">
                  <User size={15} className="text-[#a69076]" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-lg text-[#3d332a]">Contact Information</h3>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#8c8273]">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} onBlur={() => touch("name")} placeholder="As on ID" className={inputClass("name")} />
                <FieldError field="name" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#8c8273]">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} onBlur={() => touch("email")} placeholder="For order updates" className={inputClass("email")} />
                  <FieldError field="email" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#8c8273]">Phone</label>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} onBlur={() => touch("phone")} placeholder="10-digit mobile" className={inputClass("phone")} />
                  <FieldError field="phone" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-[#e8e4db] p-8 flex flex-col gap-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#f8f6f3] border border-[#e8e4db] flex items-center justify-center">
                  <MapPin size={15} className="text-[#a69076]" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-lg text-[#3d332a]">Delivery Address</h3>
              </div>

              <div className="flex flex-col gap-2 mb-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#8c8273]">Destination Type</label>
                <div className="flex gap-3">
                  {["Home", "Work", "Other"].map(type => (
                    <button 
                      key={type}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, label: type }))}
                      className={`px-4 py-2 rounded-xl text-[12px] font-medium border transition-all ${form.label === type ? 'bg-[#3d332a] text-white border-[#3d332a]' : 'bg-white text-[#594a3c] border-[#e8e4db] hover:bg-[#f8f6f3]'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {isAuth && userAddresses.length > 1 && (
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#a69076]">Select Stored Address</label>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {userAddresses.map((addr, idx) => (
                      <button 
                        key={idx}
                        type="button" 
                        onClick={() => selectAddress(addr)}
                        className={`px-6 py-3 rounded-xl border text-[12px] font-medium whitespace-nowrap transition-all ${form.street === addr.street ? 'bg-[#3d332a] text-white border-[#3d332a]' : 'bg-white text-[#594a3c] border-[#e8e4db] hover:bg-[#f8f6f3]'}`}
                      >
                        {addr.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#8c8273]">Street / House No. / Building</label>
                <input name="street" value={form.street} onChange={handleChange} onBlur={() => touch("street")} placeholder="123, Rose Garden Apartments, MG Road" className={inputClass("street")} />
                <FieldError field="street" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#8c8273]">City</label>
                  <input name="city" value={form.city} onChange={handleChange} onBlur={() => touch("city")} placeholder="City / District" className={inputClass("city")} />
                  <FieldError field="city" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#8c8273]">State</label>
                  <div className="relative">
                    <select name="state" value={form.state} onChange={handleChange} className={`${inputClass("state")} appearance-none pr-10`}>
                      {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#a69076]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:w-1/2">
                <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#8c8273]">PIN Code</label>
                <input name="zip" value={form.zip} onChange={handleChange} onBlur={() => touch("zip")} placeholder="6-digit PIN" maxLength={6} className={inputClass("zip")} />
                <FieldError field="zip" />
              </div>
            </div>

            {/* Payment note */}
            <div className="bg-[#f8f6f3] border border-[#e8e4db] rounded-2xl p-5 flex gap-4 items-start">
              <Package size={20} className="text-[#a69076] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-[13px] font-medium text-[#3d332a]">Secure Online Payment</p>
                <p className="text-[12px] text-[#8c8273] mt-1 font-light">Pay securely via Razorpay. We accept all major Credit Cards, Debit Cards, UPI, and Net Banking.</p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[13px] flex items-center gap-3">
                <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />{error}
              </div>
            )}

            <button type="submit" disabled={loading || isProcessingPayment} className="h-16 bg-[#3d332a] text-white rounded-2xl text-[13px] font-medium tracking-[0.15em] uppercase hover:bg-[#594a3c] transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-lg shadow-[#3d332a]/10">
              {loading || isProcessingPayment ? <><Loader2 size={18} className="animate-spin" /> {isProcessingPayment ? "Processing Payment..." : "Preparing Order..."}</> : <><CheckCircle2 size={18} strokeWidth={1.5} /> Proceed to Pay — ₹{totalPrice.toLocaleString()}</>}
            </button>
            </fieldset>
          </form>
        </motion.div>

        {/* ─── RIGHT: Order Summary ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-5 sticky top-[100px]">
          <div className="bg-white rounded-[2rem] border border-[#e8e4db] overflow-hidden">
            <div className="px-8 py-6 border-b border-[#e8e4db] flex items-center gap-3">
              <ShoppingBag size={18} className="text-[#a69076]" strokeWidth={1.5} />
              <h2 className="font-serif text-[1.1rem] text-[#3d332a]">Order Summary</h2>
              <span className="ml-auto text-[11px] text-[#a1988c] tracking-wide">{items.length} {items.length === 1 ? "item" : "items"}</span>
            </div>

            <div className="px-8 py-6 flex flex-col gap-5 max-h-[380px] overflow-y-auto">
              {items.map(item => (
                <div key={item._id} className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-2xl bg-[#f8f6f3] border border-[#e8e4db] overflow-hidden shrink-0">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center text-[#a1988c]"><Home size={16} strokeWidth={1} /></div>}
                  </div>
                  <div className="flex-grow">
                    <p className="font-serif text-[14px] text-[#3d332a] leading-tight">{item.name}</p>
                    {item.selectedVariant && <p className="text-[10px] text-[#a69076] uppercase tracking-wide mt-0.5">{item.selectedVariant}</p>}
                    <p className="text-[12px] text-[#8c8273] mt-1">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-serif text-[14px] text-[#594a3c] shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="px-8 py-6 border-t border-[#e8e4db] space-y-4 bg-[#f8f6f3]/50">
              <div className="flex justify-between text-[13px] text-[#8c8273]">
                <span>Subtotal</span><span>₹{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[13px] text-[#8c8273]">
                <span>Shipping</span><span className="text-[#849b87] font-medium">Free</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-[#e8e4db]">
                <span className="font-serif text-[1rem] text-[#3d332a]">Total</span>
                <span className="font-serif text-2xl text-[#3d332a]">₹{totalPrice.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-[#a1988c] text-center">✦ Estimated delivery: 10–14 days ✦</p>
            </div>
          </div>

          <Link href="/category/all" className="mt-4 flex items-center justify-center gap-2 text-[12px] text-[#8c8273] hover:text-[#594a3c] transition-colors py-3">
            <ArrowLeft size={14} strokeWidth={1.5} /> Continue Shopping
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
