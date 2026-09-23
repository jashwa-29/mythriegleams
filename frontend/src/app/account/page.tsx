"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { login, registerUser, resetAuthError, logout } from "@/redux/slices/authSlice";
import { fetchCart, clearGuest } from "@/redux/slices/cartSlice";
import { 
  Eye, EyeOff, Sparkles, LogIn, UserPlus, AlertCircle, 
  User, Package, ChevronRight, LogOut, Settings, 
  ShoppingBag, MapPin, Heart
} from "lucide-react";
import Link from "next/link";
import BreadcrumbHero from "@/components/BreadcrumbHero";

type Tab = "login" | "register";

interface FieldError {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

function validate(tab: Tab, fields: any): FieldError {
  const errors: FieldError = {};
  if (tab === "register" && !fields.name?.trim()) {
    errors.name = "Full name is required.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!fields.password || fields.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (tab === "register" && fields.password !== fields.confirm) {
    errors.confirm = "Passwords do not match.";
  }
  return errors;
}

export default function AccountPage() {
  const dispatch   = useAppDispatch();
  const router     = useRouter();
  const { userInfo, loading, error } = useAppSelector((s) => s.auth);

  const [tab, setTab]         = useState<Tab>("login");
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);
  const [fields, setFields]   = useState({ name: "", email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [clientErrors, setClientErrors] = useState<FieldError>({});
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Sync cart on login
  useEffect(() => {
    if (userInfo) {
      dispatch(fetchCart());
      if (isNewRegistration) {
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect');
        router.replace(`/account/profile${redirect ? `?redirect=${redirect}` : ''}`);
      }
    }
  }, [userInfo, isNewRegistration, dispatch, router]);

  useEffect(() => {
    dispatch(resetAuthError());
    setFields({ name: "", email: "", password: "", confirm: "" });
    setTouched({});
    setClientErrors({});
  }, [tab, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearGuest());
    router.push("/");
  };

  const touch = (name: string) => setTouched((p) => ({ ...p, [name]: true }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFields((p) => ({ ...p, [name]: value }));
    if (touched[name]) {
      setClientErrors(validate(tab, { ...fields, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(fields).map((k) => [k, true]));
    setTouched(allTouched);
    const errs = validate(tab, fields);
    setClientErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (tab === "login") {
      setIsNewRegistration(false);
      dispatch(login({ email: fields.email, password: fields.password }));
    } else {
      setIsNewRegistration(true);
      dispatch(registerUser({ name: fields.name, email: fields.email, password: fields.password }));
    }
  };

  const inputClass = (field: keyof FieldError) =>
    `w-full bg-[var(--bg-subtle)] border rounded-xl px-5 py-4 text-[14px] text-[var(--text)] focus:outline-none transition-colors ${
      touched[field] && clientErrors[field]
        ? "border-red-300 focus:border-red-400"
        : "border-[var(--border)] focus:border-[var(--accent)]"
    }`;

  /* ─── Render Dashboard if Logged In ─── */
  if (hydrated && userInfo && !isNewRegistration) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <BreadcrumbHero items={[{ label: "Account" }]} eyebrow="Member Area" title="My Account" />
        <div className="max-w-[1200px] mx-auto px-6 py-12 lg:py-20">
          
          <div className="flex flex-col md:flex-row gap-12">
            {/* Sidebar / User Info */}
            <div className="md:w-[350px] shrink-0">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2.5rem] border border-[var(--border)] p-10 shadow-xl shadow-[var(--text)]/5 sticky top-24">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--text)] text-white flex items-center justify-center text-3xl  mb-6 shadow-xl shadow-[var(--text)]/20">
                    {userInfo.name?.[0] || <User size={40} />}
                  </div>
                  <h1 className="text-2xl  text-[var(--text)] mb-1">{userInfo.name}</h1>
                  <p className="text-[13px] text-[var(--text-muted)] font-light mb-8">{userInfo.email}</p>
                  
                  <div className="w-full flex flex-col gap-3 pt-6 border-t border-[var(--bg-muted)]">
                    <Link href="/account/profile" className="flex items-center justify-between p-4 bg-[var(--bg-subtle)] rounded-2xl text-[13px] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] transition-colors group">
                      <div className="flex items-center gap-3">
                        <Settings size={18} strokeWidth={1.5} /> Edit Details
                      </div>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <button onClick={handleLogout} className="flex items-center justify-between p-4 bg-white border border-[var(--border)] rounded-2xl text-[13px] text-[#b46a62] hover:bg-red-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <LogOut size={18} strokeWidth={1.5} /> Sign Out
                      </div>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col gap-10">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <Link href="/account/orders" className="bg-[var(--text)] rounded-[2.5rem] p-10 text-white flex flex-col justify-between h-[280px] group shadow-xl shadow-[var(--text)]/10 hover:-translate-y-1 transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Package size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="text-2xl  mb-2">My Collective</h2>
                      <p className="text-white/60 text-[13px] font-light leading-relaxed">Track your artisanal pieces through every stage of creation and delivery.</p>
                      <div className="mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                        View Order Details <ChevronRight size={14} />
                      </div>
                    </div>
                 </Link>

                 <div className="bg-white rounded-[2.5rem] border border-[var(--border)] p-10 flex flex-col justify-between h-[280px] group shadow-sm hover:shadow-xl hover:shadow-[var(--text)]/5 transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--bg-subtle)] text-[var(--accent)] flex items-center justify-center">
                      <ShoppingBag size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="text-2xl  text-[var(--text)] mb-2">Back to the Vault</h2>
                      <p className="text-[var(--text-muted)] text-[13px] font-light leading-relaxed">Your journey has just begun. Explore the latest additions to our artifact collections.</p>
                      <Link href="/category/all" className="mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] group-hover:text-[var(--text-muted)] transition-colors">
                        Explore Treasures <ChevronRight size={14} />
                      </Link>
                    </div>
                 </div>
              </motion.div>

              <div className="bg-white rounded-[2.5rem] border border-[var(--border)] p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <Sparkles size={18} className="text-[var(--accent)]" />
                  <h3 className=" text-xl text-[var(--text)]">Quick Access</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Shipping Addresses", icon: MapPin, href: "/account/profile" },
                    { label: "Wishlist Artifacts", icon: Heart, href: "/#products" },
                  ].map((item, i) => (
                    <Link key={i} href={item.href} className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--bg-subtle)]/50 border border-[var(--bg-muted)] hover:bg-white hover:shadow-lg hover:shadow-[var(--text)]/5 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center text-[var(--accent)] group-hover:bg-[var(--text)] group-hover:text-white transition-all">
                        <item.icon size={18} strokeWidth={1.5} />
                      </div>
                      <span className="text-[14px] text-[var(--text-muted)] font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Render Login/Register Form ─── */
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <BreadcrumbHero items={[{ label: "Account" }]} eyebrow="Member Area" title="My Account" />
      <div className="relative flex-1 flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--bg-subtle),_var(--bg)_60%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[480px] bg-white rounded-[2.5rem] shadow-xl shadow-[var(--text)]/5 border border-[var(--border)] overflow-hidden"
      >
        <div className="pt-10 pb-8 px-10 text-center border-b border-[var(--border)]">
          <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] font-medium mb-5">
            <Sparkles size={12} /> Mythris Gleams
          </div>
          <h1 className="text-3xl  text-[var(--text)] tracking-tight">
            {tab === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-[13px] text-[var(--text-muted)] font-light mt-2">
            {tab === "login" ? "Sign in to access your cart and orders." : "Join our artisan community today."}
          </p>
        </div>

        <div className="flex border-b border-[var(--border)]">
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-4 text-[12px] font-medium uppercase tracking-[0.15em] transition-colors relative ${
                tab === t ? "text-[var(--text)]" : "text-[var(--text-faint)] hover:text-[var(--text-muted)]"
              }`}
            >
              {t === "login" ? "Sign In" : "Register"}
              {tab === t && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--text)]" />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-10 py-8 flex flex-col gap-5" noValidate>
          <AnimatePresence mode="wait">
            {tab === "register" && (
              <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">Full Name</label>
                  <input
                    type="text" name="name" autoComplete="name"
                    placeholder="e.g. Priya Sharma"
                    value={fields.name} onChange={handleChange} onBlur={() => touch("name")}
                    className={inputClass("name")}
                  />
                  {touched.name && clientErrors.name && (
                    <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={11} />{clientErrors.name}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">Email Address</label>
            <input
              type="email" name="email" autoComplete="email"
              placeholder="you@example.com"
              value={fields.email} onChange={handleChange} onBlur={() => touch("email")}
              className={inputClass("email")}
            />
            {touched.email && clientErrors.email && (
              <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={11} />{clientErrors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} name="password" autoComplete={tab === "login" ? "current-password" : "new-password"}
                placeholder="Min 8 characters"
                value={fields.password} onChange={handleChange} onBlur={() => touch("password")}
                className={inputClass("password") + " pr-12"}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors">
                {showPw ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>
            {touched.password && clientErrors.password && (
              <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={11} />{clientErrors.password}</p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {tab === "register" && (
              <motion.div key="confirm" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showCf ? "text" : "password"} name="confirm" autoComplete="new-password"
                      placeholder="Repeat your password"
                      value={fields.confirm} onChange={handleChange} onBlur={() => touch("confirm")}
                      className={inputClass("confirm") + " pr-12"}
                    />
                    <button type="button" onClick={() => setShowCf(!showCf)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors">
                      {showCf ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                    </button>
                  </div>
                  {touched.confirm && clientErrors.confirm && (
                    <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={11} />{clientErrors.confirm}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[13px]">
              <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" /> {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-14 bg-[var(--text)] text-white rounded-xl text-[12px] font-medium tracking-[0.15em] uppercase hover:bg-[var(--text-muted)] transition-all disabled:opacity-60 flex items-center justify-center gap-3 mt-1"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : (tab === "login" ? <LogIn size={16} /> : <UserPlus size={16} />)}
            {loading ? "Processing..." : (tab === "login" ? "Sign In" : "Create Account")}
          </button>

          <p className="text-center text-[12px] text-[var(--text-faint)]">
            {tab === "login" ? "New to Mythris Gleams?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => setTab(tab === "login" ? "register" : "login")} className="text-[var(--text-muted)] font-medium hover:underline">
              {tab === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </form>
      </motion.div>
      </div>
    </div>
  );
}
