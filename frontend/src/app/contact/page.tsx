"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { createInquiry, resetInquiryState } from "@/redux/slices/inquirySlice";
import { Phone, Mail, MapPin, Send, Upload, CheckCircle2, AlertCircle, Sparkles, Home, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const dispatch = useAppDispatch();
  const { loading, success, error } = useAppSelector((state) => state.inquiries);
  
  React.useEffect(() => {
    dispatch(resetInquiryState());
  }, [dispatch]);

  const [formData, setFormData] = useState({
    type: "contact",
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    else if (formData.name.length < 3) newErrors.name = "Name must be at least 3 characters.";

    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please provide a valid email.";

    const phoneClean = formData.phone.replace(/[^0-9]/g, "");
    if (formData.phone) {
        const isValidIndianMobile = (p: string) => /^[6-9]\d{9}$/.test(p);
        
        let valid = false;
        if (phoneClean.length === 10 && isValidIndianMobile(phoneClean)) valid = true;
        else if (phoneClean.length === 11 && phoneClean.startsWith("0") && isValidIndianMobile(phoneClean.substring(1))) valid = true;
        else if (phoneClean.length === 12 && phoneClean.startsWith("91") && isValidIndianMobile(phoneClean.substring(2))) valid = true;

        if (!valid) newErrors.phone = "Valid 10-digit mobile number required.";
    }

    if (!formData.subject.trim()) newErrors.subject = "Subject is required.";
    if (!formData.message.trim()) newErrors.message = "Message is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
        data.append(key, val);
    });
    if (file) {
        data.append("image", file);
    }
    
    dispatch(createInquiry(data)).then((res: any) => {
        if (res.meta.requestStatus === "fulfilled") {
            setFormData({ type: "contact", name: "", email: "", phone: "", subject: "", message: "" });
            setFile(null);
        }
    });
  };

  return (
    <div className="flex flex-col font-sans bg-[var(--bg)] min-h-screen">
      
      {/* ── BACKGROUND IMAGE BREADCRUMB HERO ── */}
      <section className="relative w-full h-[380px] md:h-[460px] flex flex-col items-start justify-end overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-[1.04]"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        {/* Multi-stop dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />
        {/* Warm terracotta tint */}
        <div className="absolute inset-0 bg-[var(--accent)]/10 mix-blend-multiply" />

        {/* Content anchored to bottom-left */}
        <div className="relative z-10 w-full max-w-[1320px] mx-auto px-8 sm:px-12 pb-12 md:pb-16 flex flex-col gap-5">
          
          {/* Breadcrumb trail */}
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            aria-label="Breadcrumb"
            className="flex items-center gap-2"
          >
            <Link href="/" className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300">
              <Home size={14} />
            </Link>
            <ChevronRight size={14} className="text-white/30" />
            <span className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold tracking-[0.2em] uppercase">
              Contact
            </span>
          </motion.nav>

          {/* Page title */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <span className="text-white/70 text-[10px] font-bold tracking-[0.25em] uppercase mb-4 block">
              Studio Inquiries
            </span>
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-tight">
              Get In Touch With<br />
              Mythri's Gleams
            </h1>
          </motion.div>
        </div>
      </section>

      {/* ── MAIN CONTENT (GRID) ── */}
      <section className="max-w-[1320px] w-full mx-auto px-8 sm:px-12 py-12 md:py-16 mb-12">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Left: Contact Info */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-4 flex flex-col gap-12 lg:sticky lg:top-[120px] self-start"
            >
               <div className="space-y-3">
                   <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-faint)]">The Sanctum</h3>
                   <h2 className="text-[var(--text)] text-3xl font-bold tracking-tight">Direct Channels</h2>
               </div>

               <div className="space-y-10">
                  <div className="flex gap-6 items-start group">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center border border-[var(--border)] group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] transition-colors duration-500 shadow-sm shrink-0">
                       <Mail size={18} strokeWidth={1.5} className="text-[var(--text-muted)] group-hover:text-white transition-colors duration-500" />
                    </div>
                    <div className="flex flex-col gap-1.5 pt-0.5">
                       <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]">Dispatches</span>
                       <a href="mailto:artisan@mythrisgleams.com" className="text-[15px] text-[var(--text)] font-semibold hover:text-[var(--accent)] transition-colors">artisan@mythrisgleams.com</a>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start group">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center border border-[var(--border)] group-hover:bg-[#25D366] group-hover:border-[#25D366] transition-colors duration-500 shadow-sm shrink-0">
                       <Phone size={18} strokeWidth={1.5} className="text-[var(--text-muted)] group-hover:text-white transition-colors duration-500" />
                    </div>
                    <div className="flex flex-col gap-1.5 pt-0.5">
                       <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]">Consultation</span>
                       <a href="https://wa.me/918300034451" className="text-[15px] text-[var(--text)] font-semibold hover:text-[#25D366] transition-colors">+91 83000 34451</a>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start group">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center border border-[var(--border)] transition-colors duration-500 shadow-sm shrink-0">
                       <MapPin size={18} strokeWidth={1.5} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="flex flex-col gap-1.5 pt-0.5">
                       <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]">The Atelier</span>
                       <span className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-[200px]">Mythri's Gleams Studio<br/>Bangalore, India</span>
                    </div>
                  </div>
               </div>
            </motion.div>

            {/* Right: The Form */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-8 bg-[var(--bg-subtle)] rounded-[2rem] p-8 md:p-10 relative overflow-hidden group border border-[var(--border)] shadow-sm"
            >
               {/* Decorative background shape */}
               <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[var(--bg-muted)] rounded-full blur-3xl opacity-50 group-hover:bg-[var(--accent)] group-hover:opacity-10 transition-all duration-1000 pointer-events-none" />

               <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="relative">
                         <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" className={`w-full bg-white h-11 rounded-xl px-4 text-[var(--text)] text-[14px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border ${errors.name ? 'border-red-300' : 'border-transparent'} transition-all shadow-sm`} />
                        {errors.name && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1.5 absolute -bottom-5"><AlertCircle size={10} /> {errors.name}</p>}
                     </div>
                     <div className="relative">
                         <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className={`w-full bg-white h-11 rounded-xl px-4 text-[var(--text)] text-[14px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border ${errors.email ? 'border-red-300' : 'border-transparent'} transition-all shadow-sm`} />
                        {errors.email && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1.5 absolute -bottom-5"><AlertCircle size={10} /> {errors.email}</p>}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="relative">
                         <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="WhatsApp Number (Optional)" className={`w-full bg-white h-11 rounded-xl px-4 text-[var(--text)] text-[14px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border ${errors.phone ? 'border-red-300' : 'border-transparent'} transition-all shadow-sm`} />
                        {errors.phone && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1.5 absolute -bottom-5"><AlertCircle size={10} /> {errors.phone}</p>}
                     </div>
                     <div className="relative">
                         <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-white h-11 rounded-xl px-4 text-[var(--text)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border border-transparent transition-all shadow-sm appearance-none pr-10 cursor-pointer">
                           <option value="contact">General Inquiry</option>
                           <option value="custom">Bespoke / Custom Order</option>
                           <option value="bulk">Bulk Commission</option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-faint)]">
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                     </div>
                  </div>

                  <div className="relative">
                       <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Subject" className={`w-full bg-white h-11 rounded-xl px-4 text-[var(--text)] text-[14px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border ${errors.subject ? 'border-red-300' : 'border-transparent'} transition-all shadow-sm`} />
                      {errors.subject && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1.5 absolute -bottom-5"><AlertCircle size={10} /> {errors.subject}</p>}
                  </div>

                  <div className="relative">
                       <textarea name="message" value={formData.message} onChange={handleChange} rows={4} placeholder="Describe your vision or inquiry..." className={`w-full bg-white rounded-xl px-4 py-3 text-[var(--text)] text-[14px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border ${errors.message ? 'border-red-300' : 'border-transparent'} transition-all shadow-sm resize-none`} />
                      {errors.message && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1.5 absolute -bottom-5"><AlertCircle size={10} /> {errors.message}</p>}
                  </div>

                  <div>
                     <label className="w-full border border-dashed border-[var(--border)] bg-white/50 hover:bg-white hover:border-[var(--accent)] rounded-xl px-5 py-5 flex items-center justify-center gap-3 cursor-pointer transition-all shadow-sm text-[var(--text-faint)] hover:text-[var(--text-muted)] group">
                          <Upload size={16} strokeWidth={1.5} className="group-hover:text-[var(--accent)] transition-colors shrink-0" />
                          <span className="text-[11px] font-bold tracking-[0.1em] uppercase">{file ? file.name : "Attach Reference Visuals (Optional)"}</span>
                          <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                     </label>
                  </div>

                  <AnimatePresence>
                     {success && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="p-5 mt-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#128C7E] flex gap-3 items-center">
                             <CheckCircle2 size={18} strokeWidth={2} className="shrink-0" />
                             <span className="text-[13px] font-bold tracking-tight">Your inquiry has been successfully dispatched to the artisan.</span>
                          </div>
                        </motion.div>
                     )}
                     {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="p-5 mt-2 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-bold flex gap-3 items-center">
                             <AlertCircle size={18} strokeWidth={2} className="shrink-0" />
                             <span>{error}</span>
                          </div>
                        </motion.div>
                     )}
                  </AnimatePresence>

                   <button disabled={loading} type="submit" className="w-full sm:w-max h-12 mt-2 px-8 rounded-xl bg-[var(--text)] text-white text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[var(--accent)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-3 shadow-md">
                     {loading ? <span className="animate-pulse">Dispatching...</span> : <><span>Send Inquiry</span> <Send size={14} /></>}
                  </button>
               </form>
            </motion.div>
         </div>
      </section>
    </div>
  );
}
