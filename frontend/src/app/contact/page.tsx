"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { createInquiry, resetInquiryState } from "@/redux/slices/inquirySlice";
import Breadcrumb from "@/components/Breadcrumb";
import { Phone, Mail, MapPin, Send, Upload, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

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
    // Clear error when user starts typing
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
    if (!formData.name.trim()) newErrors.name = "Artisan name is required.";
    else if (formData.name.length < 3) newErrors.name = "Name must be at least 3 characters.";

    if (!formData.email.trim()) newErrors.email = "Correspondence email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please provide a valid email narrative.";

    const phoneClean = formData.phone.replace(/[^0-9]/g, "");
    if (formData.phone) {
        const isValidIndianMobile = (p: string) => /^[6-9]\d{9}$/.test(p);
        
        let valid = false;
        if (phoneClean.length === 10 && isValidIndianMobile(phoneClean)) {
            valid = true;
        } else if (phoneClean.length === 11 && phoneClean.startsWith("0") && isValidIndianMobile(phoneClean.substring(1))) {
            valid = true;
        } else if (phoneClean.length === 12 && phoneClean.startsWith("91") && isValidIndianMobile(phoneClean.substring(2))) {
            valid = true;
        }

        if (!valid) {
            newErrors.phone = "Please provide a valid Indian mobile number (e.g., 9876543210).";
        }
    }

    if (!formData.subject.trim()) newErrors.subject = "Please specify a subject for the artisan.";
    else if (formData.subject.length < 5) newErrors.subject = "Subject is too brief.";

    if (!formData.message.trim()) newErrors.message = "The artisan requires a detailed message.";
    else if (formData.message.length < 10) newErrors.message = "Message is too concise.";

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
    <div className="min-h-screen bg-[#fdfdfb]">
      <Breadcrumb items={[{ label: "Sanctuary", href: "/" }, { label: "Artisan Contact" }]} />

      <section className="relative overflow-hidden pt-16 pb-24 px-6 sm:px-12 bg-[#fdfdfb] flex flex-col items-center border-b border-[#e8e4db]/50 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#f8f6f3] via-[#fdfdfb] to-[#fdfdfb] pointer-events-none" />
          <div className="max-w-[800px] w-full relative z-10 flex flex-col items-center text-center gap-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-[#e8e4db] bg-white shadow-sm text-[11px] uppercase tracking-[0.2em] text-[#a69076] font-medium">
               <Sparkles size={14} /> <span>Get In Touch</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-[clamp(3rem,6vw,5rem)] font-serif text-[#3d332a] leading-[1.05] tracking-tight">
               Studio Inquiries
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-[#8c8273] font-light leading-relaxed">
               Whether you wish to commission a bespoke artifact or inquire about our existing collections, the artisan awaits your message.
            </motion.p>
          </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 sm:px-12 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 relative">
         <div className="lg:col-span-4 flex flex-col gap-12 sticky top-[120px]">
            <div className="space-y-4">
                <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#a69076]">The Sanctum</h3>
                <h2 className="text-3xl font-serif text-[#3d332a]">Contact Details</h2>
            </div>

            <div className="space-y-8">
               <div className="flex gap-6 items-start group">
                 <div className="w-14 h-14 rounded-full bg-[#f8f6f3] flex items-center justify-center border border-[#e8e4db] group-hover:bg-[#a69076] group-hover:text-white transition-all text-[#8c8273] shadow-sm shrink-0">
                    <Mail size={20} strokeWidth={1.5} />
                 </div>
                 <div className="flex flex-col gap-1 pt-1">
                    <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#a1988c]">Dispatches</span>
                    <a href="mailto:artisan@mythrisgleams.com" className="text-lg text-[#594a3c] font-medium hover:text-[#a69076] transition-colors">artisan@mythrisgleams.com</a>
                 </div>
               </div>

               <div className="flex gap-6 items-start group">
                 <div className="w-14 h-14 rounded-full bg-[#f8f6f3] flex items-center justify-center border border-[#e8e4db] group-hover:bg-[#a69076] group-hover:text-white transition-all text-[#8c8273] shadow-sm shrink-0">
                    <Phone size={20} strokeWidth={1.5} />
                 </div>
                 <div className="flex flex-col gap-1 pt-1">
                    <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#a1988c]">Consultation</span>
                    <a href="tel:+918300034451" className="text-lg text-[#594a3c] font-medium hover:text-[#a69076] transition-colors">+91 83000 34451</a>
                 </div>
               </div>

               <div className="flex gap-6 items-start group">
                 <div className="w-14 h-14 rounded-full bg-[#f8f6f3] flex items-center justify-center border border-[#e8e4db] group-hover:bg-[#a69076] group-hover:text-white transition-all text-[#8c8273] shadow-sm shrink-0">
                    <MapPin size={20} strokeWidth={1.5} />
                 </div>
                 <div className="flex flex-col gap-1 pt-1">
                    <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#a1988c]">The Atelier</span>
                    <span className="text-lg text-[#594a3c] font-serif leading-snug">Mythri's Gleams Studio<br/>Bangalore, India</span>
                 </div>
               </div>
            </div>
         </div>

         <div className="lg:col-span-8 bg-white rounded-[2rem] p-8 sm:p-12 shadow-sm border border-[#e8e4db]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-3">
                     <label className={`text-[11px] font-medium uppercase tracking-[0.1em] ${errors.name ? 'text-red-500' : 'text-[#8c8273]'}`}>Name</label>
                     <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full bg-[#f8f6f3] border ${errors.name ? 'border-red-300 focus:border-red-400' : 'border-[#e8e4db] focus:border-[#a69076]'} rounded-xl px-5 py-4 text-[14px] text-[#3d332a] focus:outline-none transition-colors`} placeholder="Your Name" />
                     {errors.name && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> {errors.name}</p>}
                  </div>
                  <div className="flex flex-col gap-3">
                     <label className={`text-[11px] font-medium uppercase tracking-[0.1em] ${errors.email ? 'text-red-500' : 'text-[#8c8273]'}`}>Email</label>
                     <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full bg-[#f8f6f3] border ${errors.email ? 'border-red-300 focus:border-red-400' : 'border-[#e8e4db] focus:border-[#a69076]'} rounded-xl px-5 py-4 text-[14px] text-[#3d332a] focus:outline-none transition-colors`} placeholder="you@example.com" />
                     {errors.email && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> {errors.email}</p>}
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-3">
                     <label className={`text-[11px] font-medium uppercase tracking-[0.1em] ${errors.phone ? 'text-red-500' : 'text-[#8c8273]'}`}>Phone (Optional)</label>
                     <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`w-full bg-[#f8f6f3] border ${errors.phone ? 'border-red-300 focus:border-red-400' : 'border-[#e8e4db] focus:border-[#a69076]'} rounded-xl px-5 py-4 text-[14px] text-[#3d332a] focus:outline-none transition-colors`} placeholder="+91 XXXXX XXXXX" />
                     {errors.phone && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> {errors.phone}</p>}
                  </div>
                  <div className="flex flex-col gap-3">
                     <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#8c8273]">Inquiry Type</label>
                     <div className="relative">
                       <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-[#f8f6f3] border border-[#e8e4db] rounded-xl px-5 py-4 text-[14px] text-[#3d332a] focus:outline-none focus:border-[#a69076] transition-colors appearance-none pr-10">
                          <option value="contact">General Inquiry</option>
                          <option value="custom">Bespoke / Custom Order</option>
                          <option value="bulk">Bulk Commission</option>
                       </select>
                       <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8273]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                       </div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col gap-3">
                   <label className={`text-[11px] font-medium uppercase tracking-[0.1em] ${errors.subject ? 'text-red-500' : 'text-[#8c8273]'}`}>Subject</label>
                   <input type="text" name="subject" value={formData.subject} onChange={handleChange} className={`w-full bg-[#f8f6f3] border ${errors.subject ? 'border-red-300 focus:border-red-400' : 'border-[#e8e4db] focus:border-[#a69076]'} rounded-xl px-5 py-4 text-[14px] text-[#3d332a] focus:outline-none transition-colors`} placeholder="Regarding..." />
                   {errors.subject && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> {errors.subject}</p>}
               </div>

               <div className="flex flex-col gap-3">
                   <label className={`text-[11px] font-medium uppercase tracking-[0.1em] ${errors.message ? 'text-red-500' : 'text-[#8c8273]'}`}>Message</label>
                   <textarea name="message" value={formData.message} onChange={handleChange} rows={5} className={`w-full bg-[#f8f6f3] border ${errors.message ? 'border-red-300 focus:border-red-400' : 'border-[#e8e4db] focus:border-[#a69076]'} rounded-xl px-5 py-4 text-[14px] text-[#3d332a] focus:outline-none transition-colors resize-none`} placeholder="Elaborate on your inquiry..." />
                   {errors.message && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> {errors.message}</p>}
               </div>

               <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#8c8273]">Reference Visuals (Optional)</label>
                  <label className="w-full border-2 border-dashed border-[#e8e4db] bg-[#f8f6f3] hover:bg-white hover:border-[#a69076] rounded-xl px-5 py-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors text-[#8c8273]">
                      <Upload size={24} strokeWidth={1.5} className="text-[#a1988c]" />
                      <span className="text-[13px] font-medium">{file ? file.name : "Attach reference image"}</span>
                      <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                  </label>
               </div>

               <AnimatePresence>
                  {success && (
                     <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-xl bg-[#849b87]/10 border border-[#849b87]/30 text-[#6b856f] flex gap-3 items-center">
                        <CheckCircle2 size={18} strokeWidth={2} />
                        <span className="text-sm font-medium">Your inquiry has been successfully dispatched to the artisan.</span>
                     </motion.div>
                  )}
                  {error && (
                     <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                        {error}
                     </motion.div>
                  )}
               </AnimatePresence>

               <button disabled={loading} type="submit" className="mt-4 w-full sm:w-auto self-start px-10 py-5 bg-[#3d332a] text-white rounded-xl text-[12px] font-medium tracking-[0.15em] uppercase hover:bg-[#2a231d] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-3">
                  {loading ? <span className="animate-pulse">Dispatching...</span> : <><span>Send Inquiry</span> <Send size={14} /></>}
               </button>
            </form>
         </div>
      </section>
    </div>
  );
}
