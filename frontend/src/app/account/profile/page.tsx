"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { updateUserInfo } from "@/redux/slices/authSlice";
import { User, Phone, MapPin, Save, Loader2, Sparkles, AlertCircle, CheckCircle2, Plus, Trash2, Home, Briefcase, PlusCircle } from "lucide-react";
import api from "@/utils/api";
import Breadcrumb from "@/components/Breadcrumb";

interface Address {
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { userInfo } = useAppSelector((s) => s.auth);
  
  const [name, setName] = useState(userInfo?.name || "");
  const [phone, setPhone] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([
    { label: "Home", street: "", city: "", state: "Tamil Nadu", zip: "", isDefault: true }
  ]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userInfo) {
      router.replace("/account");
      return;
    }
    
    // Fetch full profile to get existing addresses
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/users/me");
        if (data.success) {
          setName(data.user.name);
          setPhone(data.user.phone || "");
          setMarketingConsent(data.user.marketingConsent ?? true);
          if (data.user.addresses && data.user.addresses.length > 0) {
            setAddresses(data.user.addresses);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile details");
      }
    };
    fetchProfile();
  }, [userInfo, router]);

  const handleAddressChange = (index: number, field: keyof Address, value: any) => {
    const newAddresses = [...addresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    
    // If setting a new default, unset others
    if (field === "isDefault" && value === true) {
      newAddresses.forEach((addr, i) => {
        if (i !== index) addr.isDefault = false;
      });
    }
    
    setAddresses(newAddresses);
  };

  const addAddress = () => {
    if (addresses.length >= 3) return; // Limit to 3 addresses
    setAddresses([...addresses, { label: "Work", street: "", city: "", state: "Tamil Nadu", zip: "", isDefault: false }]);
  };

  const removeAddress = (index: number) => {
    if (addresses.length === 1) return;
    const newAddresses = addresses.filter((_, i) => i !== index);
    if (!newAddresses.some(a => a.isDefault)) {
      newAddresses[0].isDefault = true;
    }
    setAddresses(newAddresses);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.put("/users/profile", {
        name,
        phone,
        marketingConsent,
        addresses
      });

      if (response.data.success) {
        setSuccess(true);
        const updatedInfo = { ...userInfo, ...response.data.user, token: userInfo?.token };
        dispatch(updateUserInfo(updatedInfo as any));
        
        setTimeout(() => {
            const redirect = new URLSearchParams(window.location.search).get('redirect') || "/";
            router.push(redirect);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const INDIAN_STATES = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
    "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
    "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
    "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Puducherry"
  ];

  if (!userInfo) return null;

  return (
    <div className="min-h-screen bg-[#fdfdfb]">
      <Breadcrumb items={[{ label: "Account", href: "/account" }, { label: "Profile Settings" }]} />
      
      <div className="max-w-[900px] mx-auto px-6 py-12 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] border border-[#e8e4db] shadow-xl shadow-[#3d332a]/5 overflow-hidden">
          
          <div className="p-10 border-b border-[#e8e4db] text-center bg-[#f8f6f3]/30">
            <h1 className="text-3xl font-serif text-[#3d332a]">Manage Your Identity</h1>
            <p className="text-[13px] text-[#8c8273] mt-2 font-light">Keep your profile current for faster checkout and exclusive artisan previews.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 flex flex-col gap-10">
            {/* Core Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#a69076] flex items-center gap-2">
                  <User size={12} /> Legal Name
                </label>
                <input name="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-[#f8f6f3] border border-[#e8e4db] rounded-xl px-5 py-4 text-[14px] text-[#3d332a] focus:outline-none focus:border-[#a69076] transition-colors" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#a69076] flex items-center gap-2">
                  <Phone size={12} /> Primary Phone
                </label>
                <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="10-digit mobile number" className="w-full bg-[#f8f6f3] border border-[#e8e4db] rounded-xl px-5 py-4 text-[14px] text-[#3d332a] focus:outline-none focus:border-[#a69076] transition-colors" />
              </div>
            </div>

            {/* Address Management */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-[#f0ece5] pb-4">
                <h3 className="font-serif text-xl text-[#3d332a] flex items-center gap-2">
                  <MapPin size={20} className="text-[#a69076]" /> 
                  Delivery Addresses
                </h3>
                {addresses.length < 3 && (
                  <button type="button" onClick={addAddress} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#a69076] hover:text-[#594a3c] transition-colors">
                    <PlusCircle size={16} /> Add Another
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-8">
                {addresses.map((addr, index) => (
                  <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-6 rounded-3xl border border-[#e8e4db] bg-[#fdfdfb] relative group">
                    {addresses.length > 1 && (
                      <button type="button" onClick={() => removeAddress(index)} className="absolute top-4 right-4 text-[#c4b09a] hover:text-red-500 transition-colors p-2">
                        <Trash2 size={16} />
                      </button>
                    )}
                    
                    <div className="flex flex-col gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#a1988c]">Address Type</label>
                          <select value={addr.label} onChange={(e) => handleAddressChange(index, "label", e.target.value)} className="w-full bg-white border border-[#e8e4db] rounded-xl px-4 py-2 text-[13px] focus:outline-none">
                            <option>Home</option>
                            <option>Work</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div className="md:col-span-2 flex items-center gap-4 mt-6">
                           <label className="flex items-center gap-3 cursor-pointer">
                             <input type="checkbox" checked={addr.isDefault} onChange={(e) => handleAddressChange(index, "isDefault", e.target.checked)} className="w-4 h-4 rounded border-[#e8e4db] text-[#3d332a] focus:ring-[#a69076]" />
                             <span className="text-[12px] text-[#594a3c] font-medium">Set as default delivery address</span>
                           </label>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#a1988c]">Street Address</label>
                        <input value={addr.street} onChange={(e) => handleAddressChange(index, "street", e.target.value)} placeholder="House No, Building, Street" className="w-full bg-white border border-[#e8e4db] rounded-xl px-5 py-3 text-[14px] focus:outline-none" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#a1988c]">City</label>
                          <input value={addr.city} onChange={(e) => handleAddressChange(index, "city", e.target.value)} className="w-full bg-white border border-[#e8e4db] rounded-xl px-5 py-3 text-[14px] focus:outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#a1988c]">State</label>
                          <select value={addr.state} onChange={(e) => handleAddressChange(index, "state", e.target.value)} className="w-full bg-white border border-[#e8e4db] rounded-xl px-5 py-3 text-[14px] focus:outline-none appearance-none">
                            {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#a1988c]">PIN Code</label>
                          <input value={addr.zip} onChange={(e) => handleAddressChange(index, "zip", e.target.value)} maxLength={6} className="w-full bg-white border border-[#e8e4db] rounded-xl px-5 py-3 text-[14px] focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Marketing Consent */}
            <div className="bg-[#f8f6f3]/50 p-6 rounded-3xl border border-[#e8e4db] flex items-center gap-4">
              <input 
                type="checkbox" 
                id="marketingConsent"
                checked={marketingConsent} 
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="w-5 h-5 rounded border-[#e8e4db] text-[#3d332a] focus:ring-[#a69076]"
              />
              <label htmlFor="marketingConsent" className="text-[13px] text-[#594a3c] font-medium cursor-pointer">
                I agree to receive artisanal updates, exclusive previews, and soul-crafted stories from Mythris Gleams.
              </label>
            </div>

            {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[13px] flex items-center gap-3"><AlertCircle size={16} /> {error}</div>}
            {success && <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-[13px] flex items-center gap-3"><CheckCircle2 size={16} /> Profile secured. Redirecting...</div>}

            <button type="submit" disabled={loading || success} className="h-16 bg-[#3d332a] text-white rounded-2xl text-[13px] font-bold tracking-[0.2em] uppercase hover:bg-[#594a3c] transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-lg shadow-[#3d332a]/10">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Updating...</> : <><Save size={18} strokeWidth={1.5} /> Sync Profile</>}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-[11px] text-[#a1988c] mt-8 uppercase tracking-[0.3em]">✦ Handcrafted Data Privacy ✦</p>
      </div>
    </div>
  );
}
