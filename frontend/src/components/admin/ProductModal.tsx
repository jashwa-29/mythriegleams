"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, 
    Upload, 
    Save, 
    Loader2, 
    Sparkles, 
    PenTool, 
    IndianRupee, 
    Layers, 
    Image as ImageIcon,
    Plus,
    Trash2,
    Palette,
    Camera,
    Weight,
    TrendingUp
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { fetchCollections } from '@/redux/slices/collectionSlice';
import { fetchOccasions } from '@/redux/slices/occasionSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { RootState } from '@/redux/store';
import { getImageUrl } from '@/utils/getImageUrl';
import toast from 'react-hot-toast';

const artisanalSchema = z.object({
    name: z.string().min(3, "Name your creation"),
    slug: z.string().min(3, "Unique identifier required"),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    occasion: z.string().optional(),
    occasionSub: z.string().optional(),
    price: z.number().min(1, "Enter artisanal value"),
    mrp: z.number().min(1, "Enter valuation (MRP)"),
    weight: z.number().min(0, "Enter weight in grams"),
    story: z.string().min(10, "Share the inspiration behind this piece"),
    details: z.string().min(5, "Technical details are mandatory"),
    metaDescription: z.string().max(160, "Keep SEO hooks concise").optional(),
    stockStatus: z.enum(['in-stock', 'out-of-stock', 'made-to-order']),
});

type ArtisanalFormData = z.infer<typeof artisanalSchema>;

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => void;
    loading?: boolean;
    initialData?: Partial<{
        _id?: string;
        id: number;
        name: string;
        slug: string;
        category: string;
        categories?: string[];
        subcategory?: string | null;
        subcategories?: string[];
        occasion?: string | null;
        occasions?: string[];
        occasionSub?: string | null;
        occasionSubs?: string[];
        price: number;
        mrp?: number | null;
        weight?: number | null;
        story?: string;
        details?: string;
        metaDescription?: string;
        stockStatus?: string;
        requiresImage?: boolean;
        isBestseller?: boolean;
        images?: string[];
        variants?: { type: string; options: string[] }[];
    }>; // Data for editing
}

const ArtisanalProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSubmit, loading, initialData }) => {
    const dispatch = useAppDispatch();
    const { collections } = useAppSelector((state: RootState) => state.collections);
    const { occasions } = useAppSelector((state: RootState) => state.occasions);
    const [mediaItems, setMediaItems] = useState<{ type: 'existing' | 'new', url: string, file?: File }[]>([]);
    const [variants, setVariants] = useState<string[]>(['Small (6 inch)', 'Medium (8 inch)', 'Large (10 inch)']);
    const [colors, setColors] = useState<string[]>([]);
    const [requiresImage, setRequiresImage] = useState(false);
    const [isBestseller, setIsBestseller] = useState(false);

    // Multi-selection state
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
    const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
    const [selectedOccasionSubs, setSelectedOccasionSubs] = useState<string[]>([]);

    const COLOR_PALETTE = [
        { name: 'Gold', hex: '#d4af37' },
        { name: 'Red', hex: '#b33a3a' },
        { name: 'Blue', hex: '#3a5ba0' },
        { name: 'Green', hex: '#4a7c59' },
        { name: 'Black', hex: '#1a1a1a' },
        { name: 'White', hex: '#f5f5f5' },
        { name: 'Brown', hex: '#8b5a2b' },
        { name: 'Pink', hex: '#e8a0bf' },
    ];

    const resolveColorHex = (name: string) => {
        const match = COLOR_PALETTE.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (match) return match.hex;
        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(name)) return name;
        return '#d4af37';
    };

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ArtisanalFormData>({
        resolver: zodResolver(artisanalSchema),
        defaultValues: { stockStatus: 'made-to-order', subcategory: '', weight: 0 }
    });

    const mainCategories = collections.filter(c => !c.parent);
    // Subcategories available for any currently selected main categories
    const activeSubcategories = collections.filter(c => {
        if (!c.parent) return false;
        const parentId = typeof c.parent === 'object' ? c.parent._id : c.parent;
        const parentCol = collections.find(col => col._id === parentId);
        return parentCol && selectedCategories.includes(parentCol.name);
    });

    const mainOccasions = occasions.filter(o => !o.parent);
    // Occasion subcategories available for any currently selected main occasions
    const activeOccasionSubs = occasions.filter(o => {
        if (!o.parent) return false;
        const parentId = typeof o.parent === 'object' ? o.parent._id : o.parent;
        const parentOcc = occasions.find(occ => occ._id === parentId);
        return parentOcc && selectedOccasions.includes(parentOcc.name);
    });

    // Auto-Slug Generation Logic
    const productName = watch('name');
    useEffect(() => {
        if (productName && !initialData) {
            const generatedSlug = productName
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '') // remove special chars
                .replace(/[\s_-]+/g, '-') // replace spaces/underscores with hyphens
                .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
            setValue('slug', generatedSlug);
        }
    }, [productName, setValue, initialData]);

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchCollections());
            dispatch(fetchOccasions());
            if (initialData) {
                reset({
                    name: initialData.name || '',
                    slug: initialData.slug || '',
                    category: initialData.category || '',
                    subcategory: initialData.subcategory || '',
                    occasion: initialData.occasion || '',
                    occasionSub: initialData.occasionSub || '',
                    price: initialData.price || 0,
                    mrp: initialData.mrp || 0,
                    weight: initialData.weight || 0,
                    story: initialData.story,
                    details: initialData.details,
                    metaDescription: initialData.metaDescription || '',
                    stockStatus: (initialData.stockStatus as ArtisanalFormData['stockStatus']) || 'made-to-order',
                });

                // Populate multi categories
                const initCats = Array.from(new Set([
                    ...(initialData.categories || []),
                    ...(initialData.category ? [initialData.category] : [])
                ].filter(Boolean)));
                setSelectedCategories(initCats);

                // Populate multi subcategories
                const initSubs = Array.from(new Set([
                    ...(initialData.subcategories || []),
                    ...(initialData.subcategory ? [initialData.subcategory] : [])
                ].filter(Boolean)));
                setSelectedSubcategories(initSubs);

                // Populate multi occasions
                const initOccs = Array.from(new Set([
                    ...(initialData.occasions || []),
                    ...(initialData.occasion ? [initialData.occasion] : [])
                ].filter(Boolean)));
                setSelectedOccasions(initOccs);

                // Populate multi occasion subs
                const initOccSubs = Array.from(new Set([
                    ...(initialData.occasionSubs || []),
                    ...(initialData.occasionSub ? [initialData.occasionSub] : [])
                ].filter(Boolean)));
                setSelectedOccasionSubs(initOccSubs);

                if (initialData.images) {
                    setMediaItems(initialData.images.map((url: string) => ({ type: 'existing', url })));
                } else {
                    setMediaItems([]);
                }
                const sizeVariants = initialData.variants?.find((v) => v.type === 'Size')?.options || [];
                const colorVariants = initialData.variants?.find((v) => v.type === 'Color')?.options || [];
                setVariants(Array.isArray(sizeVariants) && sizeVariants.length > 0 ? sizeVariants : []);
                setColors(Array.isArray(colorVariants) ? colorVariants : []);
                setRequiresImage(!!initialData.requiresImage);
                setIsBestseller(!!initialData.isBestseller);
            } else {
                reset({ stockStatus: 'made-to-order', name: '', slug: '', category: '', subcategory: '', occasion: '', occasionSub: '', price: 0, mrp: 0, weight: 0, story: '', details: '', metaDescription: '' });
                setSelectedCategories([]);
                setSelectedSubcategories([]);
                setSelectedOccasions([]);
                setSelectedOccasionSubs([]);
                setMediaItems([]);
                setVariants(['Small (6 inch)', 'Medium (8 inch)', 'Large (10 inch)']);
                setColors([]);
                setRequiresImage(false);
                setIsBestseller(false);
            }
        }
    }, [isOpen, initialData, reset, dispatch]);

    const priceBatch = watch(['price', 'mrp']);
    const discount = priceBatch[1] > priceBatch[0] 
        ? Math.round(((priceBatch[1] - priceBatch[0]) / priceBatch[1]) * 100) 
        : 0;
    const saving = priceBatch[1] - priceBatch[0];

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const allowed = Math.max(0, 10 - mediaItems.length);
            if (allowed <= 0) {
                toast.error("Maximum 10 images per product");
                return;
            }
            const accepted = files.slice(0, allowed);
            if (accepted.length < files.length) {
                toast.error(`Maximum 10 images per product (skipped ${files.length - accepted.length})`);
            }
            const newMedia = accepted.map(file => ({
                type: 'new' as const,
                url: URL.createObjectURL(file), // create temporary URL for preview
                file
            }));
            setMediaItems(prev => [...prev, ...newMedia]);
        }
    };

    const handleRemoveMedia = (index: number) => {
        setMediaItems(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleFormSubmit = (data: ArtisanalFormData) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            formData.append(key, String((data as Record<string, unknown>)[key]));
        });

        // Set primary and multi collections
        const primaryCat = selectedCategories[0] || data.category || '';
        formData.set('category', primaryCat);
        formData.set('categories', JSON.stringify(selectedCategories));

        // Set primary and multi subcategories
        const primarySub = selectedSubcategories[0] || data.subcategory || '';
        formData.set('subcategory', primarySub);
        formData.set('subcategories', JSON.stringify(selectedSubcategories));

        // Set primary and multi occasions
        const primaryOcc = selectedOccasions[0] || data.occasion || '';
        formData.set('occasion', primaryOcc);
        formData.set('occasions', JSON.stringify(selectedOccasions));

        // Set primary and multi occasion subcategories
        const primaryOccSub = selectedOccasionSubs[0] || data.occasionSub || '';
        formData.set('occasionSub', primaryOccSub);
        formData.set('occasionSubs', JSON.stringify(selectedOccasionSubs));
        
        // Add variants
        const variantPayload: { type: string; options: string[] }[] = [];
        if (variants.length > 0) variantPayload.push({ type: 'Size', options: variants });
        if (colors.length > 0) variantPayload.push({ type: 'Color', options: colors });
        formData.append('variants', JSON.stringify(variantPayload));
        formData.append('requiresImage', String(requiresImage));
        formData.append('isBestseller', String(isBestseller));

        // Add kept existing images
        const existingImagesToKeep = mediaItems
            .filter(m => m.type === 'existing')
            .map(m => {
                const idx = m.url.indexOf('/uploads/');
                return idx !== -1 ? m.url.slice(idx) : m.url;
            });
        formData.append('existingImages', JSON.stringify(existingImagesToKeep));

        // Add new images
        mediaItems.filter(m => m.type === 'new' && m.file).forEach(m => {
            formData.append('images', m.file as File);
        });
        
        onSubmit(formData);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 30 }}
                        className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Elegant Header */}
                        <div className="px-12 py-10 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30">
                            <div>
                                <h2 className="text-3xl font-bold font-serif italic text-zinc-900 tracking-tight">Artisanal Catalog Intake</h2>
                                <p className="text-zinc-500 text-xs font-medium uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                    <Sparkles size={14} className="text-gold" /> Master Template: Mythris Gleams
                                </p>
                            </div>
                            <button onClick={onClose} className="p-4 rounded-3xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all active:scale-95">
                                <X size={28} />
                            </button>
                        </div>

                        {/* Body - Split Columns */}
                        <div className="flex-1 overflow-y-auto p-12">
                            <form id="artisanal-form" onSubmit={handleSubmit(handleFormSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                                
                                {/* Left Side: Media & Variants (5 cols) */}
                                <div className="lg:col-span-5 space-y-12">
                                    {/* Image Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 flex items-center gap-2">
                                                <ImageIcon size={14} /> Visual Narrative
                                            </label>
                                            <span className="text-[10px] font-medium text-zinc-400 italic">First image is Master Image</span>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {mediaItems.length > 0 ? (
                                                <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-zinc-100 relative group">
                                                    <img src={mediaItems[0].type === 'new' ? mediaItems[0].url : getImageUrl(mediaItems[0].url)} alt="Master" className="w-full h-full object-cover" />
                                                    <div className="absolute top-4 left-4 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/20">
                                                        Master Visual
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleRemoveMedia(0)}
                                                        className="absolute top-4 right-4 bg-rose-500/80 hover:bg-rose-600 text-white p-2 rounded-full transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 shadow-xl"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="aspect-[4/3] rounded-[2.5rem] border-2 border-dashed border-zinc-200 hover:border-gold hover:bg-gold/5 transition-all flex flex-col items-center justify-center cursor-pointer group">
                                                    <Upload size={40} className="text-zinc-300 group-hover:text-gold group-hover:-translate-y-2 transition-all" />
                                                    <span className="mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Initiate Master Image Upload</span>
                                                    <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                                                </label>
                                            )}

                                            <div className="grid grid-cols-4 gap-4">
                                                {mediaItems.slice(1).map((item, i) => (
                                                    <div key={i} className="aspect-square rounded-2xl border border-zinc-100 overflow-hidden relative group">
                                                        <img src={item.type === 'new' ? item.url : getImageUrl(item.url)} alt="Sub" className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleRemoveMedia(i + 1)}
                                                            className="absolute inset-0 bg-rose-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {mediaItems.length > 0 && (
                                                    <label className="aspect-square rounded-2xl border-2 border-dashed border-zinc-100 hover:border-gold hover:bg-gold/5 flex items-center justify-center cursor-pointer transition-all">
                                                        <Plus size={20} className="text-zinc-300" />
                                                        <input type="file" multiple onChange={handleImageChange} className="hidden" accept="image/*" />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Variant Section */}
                                    <div className="space-y-6 pt-6">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 flex items-center gap-2">
                                                <Layers size={14} /> Dimensional Variations
                                            </label>
                                            <span className="text-[10px] font-medium text-zinc-400 italic">Select or Create</span>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Predefined Suggestions */}
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    'Small (6 inch)', 
                                                    'Medium (8 inch)', 
                                                    'Large (10 inch)',
                                                    'Miniature (4 inch)',
                                                    'XL (12 inch)'
                                                ].map(suggestion => (
                                                    <button
                                                        key={suggestion}
                                                        type="button"
                                                        onClick={() => {
                                                            if (!variants.includes(suggestion)) {
                                                                setVariants(prev => [...prev, suggestion]);
                                                            }
                                                        }}
                                                        className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-zinc-100 bg-zinc-50 hover:border-gold hover:text-gold hover:bg-gold/5 transition-all text-zinc-400"
                                                    >
                                                        + {suggestion}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Custom Input */}
                                            <div className="flex gap-2">
                                                <input 
                                                    id="custom-variant-input"
                                                    placeholder="Enter custom dimension..."
                                                    className="flex-1 bg-zinc-50 border-none rounded-xl px-4 py-3 text-xs font-medium focus:ring-1 focus:ring-gold/20 outline-none transition-all"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = (e.target as HTMLInputElement).value.trim();
                                                            if (val && !variants.includes(val)) {
                                                                setVariants(prev => [...prev, val]);
                                                                (e.target as HTMLInputElement).value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const input = document.getElementById('custom-variant-input') as HTMLInputElement;
                                                        const val = input.value.trim();
                                                        if (val && !variants.includes(val)) {
                                                            setVariants(prev => [...prev, val]);
                                                            input.value = '';
                                                        }
                                                    }}
                                                    className="bg-gold/10 text-gold p-3 rounded-xl hover:bg-gold hover:text-white transition-all active:scale-95"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>

                                            {/* Active Variants List */}
                                            <div className="grid grid-cols-1 gap-2 pt-2">
                                                <AnimatePresence>
                                                    {variants.map((v) => (
                                                        <motion.div 
                                                            key={v}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 10 }}
                                                            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 font-bold text-xs text-zinc-700 shadow-sm group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                                                                {v}
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setVariants(prev => prev.filter(item => item !== v))}
                                                                className="p-1 px-2.5 rounded-lg hover:bg-rose-50 text-zinc-200 hover:text-rose-500 transition-all font-black text-[10px] uppercase tracking-widest"
                                                            >
                                                                Remove
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Color Section */}
                                    <div className="space-y-6 pt-6">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 flex items-center gap-2">
                                                <Palette size={14} /> Colour Palette
                                            </label>
                                            <span className="text-[10px] font-medium text-zinc-400 italic">Select or Create</span>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Predefined Suggestions */}
                                            <div className="flex flex-wrap gap-2">
                                                {COLOR_PALETTE.map(suggestion => (
                                                    <button
                                                        key={suggestion.name}
                                                        type="button"
                                                        onClick={() => {
                                                            if (!colors.includes(suggestion.name)) {
                                                                setColors(prev => [...prev, suggestion.name]);
                                                            }
                                                        }}
                                                        className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-zinc-100 bg-zinc-50 hover:border-gold hover:text-gold hover:bg-gold/5 transition-all text-zinc-400 flex items-center gap-1.5"
                                                    >
                                                        <span className="w-2.5 h-2.5 rounded-full border border-zinc-200" style={{ backgroundColor: suggestion.hex }} />
                                                        + {suggestion.name}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Custom Input */}
                                            <div className="flex gap-2 items-center">
                                                <input 
                                                    id="custom-color-input"
                                                    placeholder="Enter custom colour (name or #hex)..."
                                                    className="flex-1 bg-zinc-50 border-none rounded-xl px-4 py-3 text-xs font-medium focus:ring-1 focus:ring-gold/20 outline-none transition-all"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = (e.target as HTMLInputElement).value.trim();
                                                            if (val && !colors.includes(val)) {
                                                                setColors(prev => [...prev, val]);
                                                                (e.target as HTMLInputElement).value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const input = document.getElementById('custom-color-input') as HTMLInputElement;
                                                        const val = input.value.trim();
                                                        if (val && !colors.includes(val)) {
                                                            setColors(prev => [...prev, val]);
                                                            input.value = '';
                                                        }
                                                    }}
                                                    className="bg-gold/10 text-gold p-3 rounded-xl hover:bg-gold hover:text-white transition-all active:scale-95"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>

                                            {/* Active Colors List */}
                                            <div className="grid grid-cols-1 gap-2 pt-2">
                                                <AnimatePresence>
                                                    {colors.map((c) => (
                                                        <motion.div 
                                                            key={c}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 10 }}
                                                            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 font-bold text-xs text-zinc-700 shadow-sm group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-4 h-4 rounded-full border border-zinc-200" style={{ backgroundColor: resolveColorHex(c) }} />
                                                                {c}
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setColors(prev => prev.filter(item => item !== c))}
                                                                className="p-1 px-2.5 rounded-lg hover:bg-rose-50 text-zinc-200 hover:text-rose-500 transition-all font-black text-[10px] uppercase tracking-widest"
                                                            >
                                                                Remove
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Image Intake Toggle */}
                                    <div className="space-y-6 pt-6">
                                        <div className="p-8 bg-zinc-50 rounded-[2rem] border border-zinc-100 flex items-center justify-between gap-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                                                    <Camera size={18} className="text-gold" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block">Collect Customer Image</label>
                                                    <p className="text-[11px] font-medium text-zinc-400 italic mt-1 max-w-[260px]">Require the buyer to upload a personal image (photo / reference) with this product.</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setRequiresImage(prev => !prev)}
                                                className={`w-16 h-8 rounded-full transition-all flex items-center px-1 ${requiresImage ? 'bg-gold justify-end' : 'bg-zinc-300 justify-start'}`}
                                            >
                                                <span className="w-6 h-6 rounded-full bg-white shadow-md transition-all" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-6">
                                        <div className="p-8 bg-amber-50/60 rounded-[2rem] border border-amber-100 flex items-center justify-between gap-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                                    <TrendingUp size={18} className="text-amber-600" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block">Show in Best Sellers</label>
                                                    <p className="text-[11px] font-medium text-zinc-400 italic mt-1 max-w-[260px]">Feature this product in the Best Sellers carousel on the home page.</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={isBestseller}
                                                aria-label="Show this product in Best Sellers"
                                                onClick={() => setIsBestseller(prev => !prev)}
                                                className={`w-16 h-8 rounded-full transition-all flex items-center px-1 ${isBestseller ? 'bg-amber-500 justify-end' : 'bg-zinc-300 justify-start'}`}
                                            >
                                                <span className="w-6 h-6 rounded-full bg-white shadow-md transition-all" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Information Narrative (7 cols) */}
                                <div className="lg:col-span-7 space-y-12">
                                    {/* Core Info */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Creation Name</label>
                                            <input {...register('name')} placeholder="e.g. Traditional Samosa Miniature Clock" className="w-full bg-zinc-50 border-none rounded-2xl p-5 text-zinc-900 font-bold focus:ring-2 focus:ring-gold/20 outline-none transition-all placeholder:text-zinc-200" />
                                            {errors.name && <p className="text-[10px] font-black text-rose-500 ml-1 uppercase">{errors.name.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Reference Slug</label>
                                            <input {...register('slug')} placeholder="slug-path" className="w-full bg-zinc-50 border-none rounded-2xl p-5 text-zinc-900 font-mono text-xs focus:ring-2 focus:ring-gold/20 outline-none transition-all" />
                                        </div>
                                        {/* Multi-Collection Selection */}
                                        <div className="col-span-2 space-y-3 bg-zinc-50/70 p-5 rounded-2xl border border-zinc-100">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-1.5">
                                                    <Layers size={13} className="text-gold" /> Collections (Galleries)
                                                </label>
                                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                                                    {selectedCategories.length} selected
                                                </span>
                                            </div>

                                            {/* Dropdown to add collection */}
                                            <select
                                                value=""
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val && !selectedCategories.includes(val)) {
                                                        setSelectedCategories(prev => [...prev, val]);
                                                    }
                                                }}
                                                className="w-full bg-white border border-zinc-200 rounded-xl p-3.5 text-zinc-900 font-bold text-xs focus:ring-2 focus:ring-gold/20 outline-none transition-all cursor-pointer shadow-sm"
                                            >
                                                <option value="">+ Add to Collection...</option>
                                                {mainCategories.filter(c => !selectedCategories.includes(c.name)).map((col) => (
                                                    <option key={col._id} value={col.name}>{col.name}</option>
                                                ))}
                                            </select>

                                            {/* Selected collections chips */}
                                            {selectedCategories.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {selectedCategories.map((cat, idx) => (
                                                        <span key={cat} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-[11px] font-bold shadow-sm">
                                                            {idx === 0 && <span className="text-[8px] bg-gold/30 text-gold px-1.5 py-0.5 rounded font-black tracking-wider uppercase mr-0.5">Primary</span>}
                                                            {cat}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedCategories(prev => prev.filter(c => c !== cat));
                                                                    // remove subcategories that belong only to this category if needed
                                                                }}
                                                                className="hover:text-rose-400 p-0.5 transition-colors"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Subcategories multi-select (appears if activeSubcategories exist) */}
                                            {activeSubcategories.length > 0 && (
                                                <div className="pt-3 border-t border-zinc-200/60 space-y-2">
                                                    <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Subcategories</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {activeSubcategories.map(sub => {
                                                            const isSelected = selectedSubcategories.includes(sub.name);
                                                            return (
                                                                <button
                                                                    key={sub._id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (isSelected) {
                                                                            setSelectedSubcategories(prev => prev.filter(s => s !== sub.name));
                                                                        } else {
                                                                            setSelectedSubcategories(prev => [...prev, sub.name]);
                                                                        }
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all border ${
                                                                        isSelected 
                                                                            ? 'bg-gold text-white border-gold shadow-sm' 
                                                                            : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                                                                    }`}
                                                                >
                                                                    {isSelected ? '✓ ' : '+ '} {sub.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Multi-Occasion Selection */}
                                        <div className="col-span-2 space-y-3 bg-rose-50/40 p-5 rounded-2xl border border-rose-100/70">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-rose-800 flex items-center gap-1.5">
                                                    <Sparkles size={13} className="text-rose-500" /> Occasions & Festivals
                                                </label>
                                                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">
                                                    {selectedOccasions.length} selected
                                                </span>
                                            </div>

                                            {/* Dropdown to add occasion */}
                                            <select
                                                value=""
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val && !selectedOccasions.includes(val)) {
                                                        setSelectedOccasions(prev => [...prev, val]);
                                                    }
                                                }}
                                                className="w-full bg-white border border-rose-200 rounded-xl p-3.5 text-zinc-900 font-bold text-xs focus:ring-2 focus:ring-rose-300 outline-none transition-all cursor-pointer shadow-sm"
                                            >
                                                <option value="">+ Add to Occasion...</option>
                                                {mainOccasions.filter(o => !selectedOccasions.includes(o.name)).map((occ) => (
                                                    <option key={occ._id} value={occ.name}>{occ.name}</option>
                                                ))}
                                            </select>

                                            {/* Selected occasions chips */}
                                            {selectedOccasions.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {selectedOccasions.map((occ, idx) => (
                                                        <span key={occ} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-[11px] font-bold shadow-sm">
                                                            {idx === 0 && <span className="text-[8px] bg-white/20 text-white px-1.5 py-0.5 rounded font-black tracking-wider uppercase mr-0.5">Primary</span>}
                                                            {occ}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedOccasions(prev => prev.filter(o => o !== occ));
                                                                }}
                                                                className="hover:text-rose-200 p-0.5 transition-colors"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Occasion Subcategories multi-select (appears if activeOccasionSubs exist) */}
                                            {activeOccasionSubs.length > 0 && (
                                                <div className="pt-3 border-t border-rose-200/60 space-y-2">
                                                    <label className="text-[9px] font-black uppercase tracking-wider text-rose-500 block">Occasion Subcategories</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {activeOccasionSubs.map(sub => {
                                                            const isSelected = selectedOccasionSubs.includes(sub.name);
                                                            return (
                                                                <button
                                                                    key={sub._id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (isSelected) {
                                                                            setSelectedOccasionSubs(prev => prev.filter(s => s !== sub.name));
                                                                        } else {
                                                                            setSelectedOccasionSubs(prev => [...prev, sub.name]);
                                                                        }
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all border ${
                                                                        isSelected 
                                                                            ? 'bg-rose-500 text-white border-rose-500 shadow-sm' 
                                                                            : 'bg-white text-rose-700 border-rose-200 hover:border-rose-300'
                                                                    }`}
                                                                >
                                                                    {isSelected ? '✓ ' : '+ '} {sub.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pricing Narrative */}
                                    <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white">
                                        <label className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-6 block">Valuation Spectrum</label>
                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black tracking-widest text-zinc-400 ml-1">Artisanal Price</label>
                                                <div className="relative">
                                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" size={18} />
                                                    <input {...register('price', { valueAsNumber: true })} type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-12 text-2xl font-black text-white focus:ring-1 focus:ring-gold outline-none" placeholder="0.00" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black tracking-widest text-zinc-400 ml-1">Valuation (MRP)</label>
                                                <div className="relative">
                                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                                    <input {...register('mrp', { valueAsNumber: true })} type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-12 text-sm font-bold text-zinc-400 focus:ring-1 focus:ring-white/20 outline-none" placeholder="0.00" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-2">
                                            <label className="text-[10px] font-black tracking-widest text-zinc-400 ml-1">Item Weight (grams)</label>
                                            <div className="relative">
                                                <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" size={16} />
                                                <input {...register('weight', { valueAsNumber: true })} type="number" min={0} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-12 text-sm font-bold text-white focus:ring-1 focus:ring-white/20 outline-none" placeholder="e.g. 850" />
                                            </div>
                                        </div>
                                        
                                        {(saving > 0) && (
                                            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Commercial Incentive:</span>
                                                <div className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                                    <span className="bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">Save ₹{saving}</span>
                                                    <span className="text-gold italic font-serif text-lg">({discount}% Off)</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Textual Narrative */}
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                <PenTool size={14} className="text-gold" /> The Story (Inspiration)
                                            </div>
                                            <textarea 
                                                {...register('story')} 
                                                rows={5} 
                                                placeholder="Share the inspiration, the culture, and the artisanal journey that created this piece..." 
                                                className="w-full bg-zinc-50 border-none rounded-[2rem] p-8 text-sm leading-relaxed font-medium italic focus:ring-2 focus:ring-gold/20 outline-none transition-all placeholder:text-zinc-200"
                                            />
                                            {errors.story && <p className="text-[10px] font-black text-rose-500 ml-1 uppercase">{errors.story.message}</p>}
                                        </div>
                                        <div className="space-y-3">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">The Technical Details</div>
                                            <textarea 
                                                {...register('details')} 
                                                rows={3} 
                                                placeholder="Materials: Clay, Resin, etc. Dimensions: ... Weight: ..." 
                                                className="w-full bg-zinc-50 border-none rounded-[1.5rem] p-8 text-xs leading-relaxed font-bold tracking-tight text-zinc-500 focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                                            />
                                            {errors.details && <p className="text-[10px] font-black text-rose-500 ml-1 uppercase">{errors.details.message}</p>}
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                <Sparkles size={14} className="text-gold" /> SEO Meta Narrative (Search View)
                                            </div>
                                            <textarea 
                                                {...register('metaDescription')} 
                                                rows={3} 
                                                placeholder="Brief summary for Google results. Keep this between 50-160 characters for maximum visibility..." 
                                                className="w-full bg-zinc-50 border-none rounded-[1.5rem] p-8 text-xs leading-relaxed font-medium text-zinc-400 focus:ring-2 focus:ring-zinc-900/10 outline-none transition-all italic"
                                            />
                                            {errors.metaDescription && <p className="text-[10px] font-black text-rose-500 ml-1 uppercase">{errors.metaDescription.message}</p>}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Stately Footer */}
                        <div className="px-12 py-10 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-6">
                            <button onClick={onClose} className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 hover:text-zinc-500 transition-colors">Abort Cataloging</button>
                            <button 
                                form="artisanal-form" 
                                type="submit" 
                                disabled={loading}
                                className="px-14 py-5 bg-zinc-900 hover:bg-black text-white rounded-[2rem] font-bold tracking-[0.2em] uppercase text-xs flex items-center gap-4 shadow-2xl shadow-zinc-900/30 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                    <>
                                        <Save size={20} className="text-gold" />
                                        <span>Secure to Gallery</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ArtisanalProductModal;
