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
    TrendingUp,
    Users,
    Tag,
    Eye,
    Copy,
    ArrowUp,
    ArrowDown,
    Wand2,
    Gift,
    Check
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
        pricedOptions?: {
            enabled?: boolean;
            title?: string;
            options?: { label: string; price: number }[];
        };
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

    // Priced Options (generic: admin can add named options with their own price)
    const [pricedOptionsEnabled, setPricedOptionsEnabled] = useState(false);
    const [pricedOptionsTitle, setPricedOptionsTitle] = useState('Options');
    const [pricedOptionItems, setPricedOptionItems] = useState<{ label: string; price: number }[]>([]);
    const [pricedOptionLabelDraft, setPricedOptionLabelDraft] = useState('');
    const [pricedOptionPriceDraft, setPricedOptionPriceDraft] = useState('');
    const [previewSelectedOption, setPreviewSelectedOption] = useState<string>('');

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
                const initPriced = initialData.pricedOptions;
                setPricedOptionsEnabled(!!initPriced?.enabled);
                setPricedOptionsTitle(initPriced?.title || 'Options');
                setPricedOptionItems(
                    Array.isArray(initPriced?.options)
                        ? initPriced.options.map((o) => ({ label: o.label || '', price: Number(o.price) || 0 }))
                        : []
                );
                setPricedOptionLabelDraft('');
                setPricedOptionPriceDraft('');
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
                setPricedOptionsEnabled(false);
                setPricedOptionsTitle('Options');
                setPricedOptionItems([]);
                setPricedOptionLabelDraft('');
                setPricedOptionPriceDraft('');
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

    const baseProductPrice = Number(watch('price')) || 0;

    const addPricedOption = () => {
        const label = pricedOptionLabelDraft.trim();
        if (!label) {
            toast.error("Please enter a name for the option (e.g. '2 Figures')");
            return;
        }
        const enteredPrice = pricedOptionPriceDraft.trim() === ''
            ? baseProductPrice
            : Number(pricedOptionPriceDraft);

        if (isNaN(enteredPrice) || enteredPrice < 0) {
            toast.error("Enter a valid price for the option");
            return;
        }
        setPricedOptionItems(prev => [...prev, { label, price: enteredPrice }]);
        setPricedOptionLabelDraft('');
        setPricedOptionPriceDraft('');
        toast.success(`Added "${label}" (₹${enteredPrice.toLocaleString()})`);
    };

    const updatePricedOption = (index: number, patch: Partial<{ label: string; price: number }>) => {
        setPricedOptionItems(prev => prev.map((opt, i) => (i === index ? { ...opt, ...patch } : opt)));
    };

    const removePricedOption = (index: number) => {
        setPricedOptionItems(prev => prev.filter((_, i) => i !== index));
    };

    const movePricedOption = (index: number, direction: 'up' | 'down') => {
        setPricedOptionItems(prev => {
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= prev.length) return prev;
            const updated = [...prev];
            const [moved] = updated.splice(index, 1);
            updated.splice(targetIndex, 0, moved);
            return updated;
        });
    };

    const duplicatePricedOption = (index: number) => {
        setPricedOptionItems(prev => {
            const item = prev[index];
            if (!item) return prev;
            const updated = [...prev];
            updated.splice(index + 1, 0, {
                label: `${item.label} (Copy)`,
                price: item.price
            });
            return updated;
        });
        toast.success("Option duplicated");
    };

    const applyPricedOptionsTemplate = (type: 'figures' | 'gift' | 'sizes') => {
        const base = baseProductPrice > 0 ? baseProductPrice : 599;
        if (type === 'figures') {
            setPricedOptionsTitle('Number of Dolls');
            setPricedOptionItems([
                { label: '1 Customer Doll', price: base },
                { label: '2 Customer Dolls', price: Math.round(base * 1.75) },
                { label: '3 Customer Dolls', price: Math.round(base * 2.5) },
            ]);
            toast.success("Loaded 'Dolls / Figures' preset");
        } else if (type === 'gift') {
            setPricedOptionsTitle('Packaging & Gift Wrap');
            setPricedOptionItems([
                { label: 'Standard Box', price: base },
                { label: 'Gift Wrap + Greeting Card', price: base + 100 },
                { label: 'Luxury Velvet Keepsake Box', price: base + 250 },
            ]);
            toast.success("Loaded 'Gift Wrap' preset");
        } else if (type === 'sizes') {
            setPricedOptionsTitle('Size / Quantity');
            setPricedOptionItems([
                { label: 'Single Piece', price: base },
                { label: 'Couple Set (Pair)', price: Math.round(base * 1.85) },
                { label: 'Family Set (4 Pcs)', price: Math.round(base * 3.4) },
            ]);
            toast.success("Loaded 'Size / Sets' preset");
        }
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
        formData.append('customerDollOption', String('')); // backward compatibility not needed; use pricedOptions
        formData.append('pricedOptions', JSON.stringify({
            enabled: pricedOptionsEnabled,
            title: pricedOptionsTitle.trim() || 'Options',
            options: pricedOptionsEnabled ? pricedOptionItems : []
        }));

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

                                    {/* Priced Options */}
                                    <div className="space-y-6 pt-6">
                                        <div className={`p-5 sm:p-6 rounded-[2rem] border transition-all duration-300 overflow-hidden ${pricedOptionsEnabled ? 'bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 border-amber-300/80 shadow-md shadow-amber-900/5' : 'bg-zinc-50/80 border-zinc-200/80'}`}>
                                            
                                            {/* Card Header & Toggle */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${pricedOptionsEnabled ? 'bg-amber-100 text-amber-800 border-amber-300/80 shadow-xs' : 'bg-zinc-100 text-zinc-400 border-zinc-200'}`}>
                                                        <Layers size={18} className={pricedOptionsEnabled ? 'text-amber-800' : 'text-zinc-400'} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-800">Priced Options</label>
                                                            {pricedOptionsEnabled ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                    Active
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-zinc-200/70 text-zinc-500">
                                                                    Off
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                                                            Let buyers pick custom options (e.g. <span className="font-semibold text-zinc-700">"1 Figure", "2 Figures"</span>) with custom pricing.
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={pricedOptionsEnabled}
                                                    aria-label="Enable Priced Options"
                                                    onClick={() => setPricedOptionsEnabled(prev => !prev)}
                                                    className={`w-13 h-7 rounded-full transition-all flex items-center px-1 shrink-0 cursor-pointer ${pricedOptionsEnabled ? 'bg-amber-600 justify-end shadow-inner' : 'bg-zinc-300 justify-start'}`}
                                                >
                                                    <motion.span 
                                                        layout
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        className="w-5 h-5 rounded-full bg-white shadow-md block" 
                                                    />
                                                </button>
                                            </div>

                                            {pricedOptionsEnabled && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="pt-5 mt-5 border-t border-amber-200/60 space-y-5"
                                                >
                                                    {/* Option Group Title Section */}
                                                    <div className="p-4 bg-white rounded-2xl border border-amber-200/60 shadow-xs space-y-2.5">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 flex items-center gap-1.5">
                                                                <Tag size={12} className="text-amber-600" />
                                                                Option Group Title
                                                            </label>
                                                            <span className="text-[9px] text-zinc-400 font-medium italic">Heading for buyer</span>
                                                        </div>

                                                        <div className="relative">
                                                            <input
                                                                value={pricedOptionsTitle}
                                                                onChange={(e) => setPricedOptionsTitle(e.target.value)}
                                                                placeholder="e.g. Number of Dolls, Choose Variant"
                                                                className="w-full bg-amber-50/20 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-bold text-zinc-800 outline-none transition-all focus:ring-2 focus:ring-amber-500/10 placeholder:text-zinc-300"
                                                            />
                                                        </div>

                                                        {/* Quick Title Chips */}
                                                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Presets:</span>
                                                            {['Number of Dolls', 'Figure Count', 'Choose Size', 'Packaging', 'Add-ons'].map(t => (
                                                                <button
                                                                    key={t}
                                                                    type="button"
                                                                    onClick={() => setPricedOptionsTitle(t)}
                                                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${pricedOptionsTitle === t ? 'bg-amber-600 text-white shadow-xs' : 'bg-zinc-100 hover:bg-amber-50 text-zinc-600 hover:text-amber-700'}`}
                                                                >
                                                                    {t}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Quick Presets / Starter Templates */}
                                                    <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Wand2 size={13} className="text-amber-700 shrink-0" />
                                                            <div>
                                                                <p className="text-[10px] font-black text-amber-900 uppercase tracking-wide">Quick 1-Click Templates</p>
                                                                <p className="text-[9px] text-amber-700/80">Scales tiers from base price (₹{baseProductPrice.toLocaleString()})</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-1.5 w-full pt-0.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => applyPricedOptionsTemplate('figures')}
                                                                className="flex-1 min-w-[90px] text-center px-2 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-900 hover:bg-amber-600 hover:text-white hover:border-amber-600 text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                                                            >
                                                                🎭 Figures
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => applyPricedOptionsTemplate('gift')}
                                                                className="flex-1 min-w-[90px] text-center px-2 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-900 hover:bg-amber-600 hover:text-white hover:border-amber-600 text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                                                            >
                                                                🎁 Gift Wrap
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => applyPricedOptionsTemplate('sizes')}
                                                                className="flex-1 min-w-[90px] text-center px-2 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-900 hover:bg-amber-600 hover:text-white hover:border-amber-600 text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                                                            >
                                                                📦 Size Sets
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Configured Options List */}
                                                    <div className="space-y-2.5">
                                                        <div className="flex items-center justify-between px-1">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                                                Configured Options ({pricedOptionItems.length})
                                                            </label>
                                                            {pricedOptionItems.length > 0 && (
                                                                <span className="text-[9px] text-zinc-400 font-medium">Use arrows to reorder</span>
                                                            )}
                                                        </div>

                                                        {pricedOptionItems.length === 0 ? (
                                                            <div className="p-6 bg-white rounded-2xl border border-dashed border-zinc-200 text-center space-y-1.5">
                                                                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                                                                    <Layers size={16} />
                                                                </div>
                                                                <p className="text-xs font-bold text-zinc-600">No options added yet</p>
                                                                <p className="text-[10px] text-zinc-400 max-w-xs mx-auto">
                                                                    Add an option below or pick a preset above to get started.
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <AnimatePresence initial={false}>
                                                                    {pricedOptionItems.map((opt, idx) => {
                                                                        const diff = opt.price - baseProductPrice;
                                                                        return (
                                                                            <motion.div
                                                                                key={idx}
                                                                                initial={{ opacity: 0, y: 6 }}
                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                exit={{ opacity: 0, scale: 0.95 }}
                                                                                className="p-3 bg-white rounded-2xl border border-zinc-200 hover:border-amber-300 shadow-xs space-y-2 transition-all group"
                                                                            >
                                                                                {/* Line 1: Badge + Option Name + Actions */}
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="w-5 h-5 rounded-md bg-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-600 shrink-0">
                                                                                        {idx + 1}
                                                                                    </span>
                                                                                    <input
                                                                                        value={opt.label}
                                                                                        onChange={(e) => updatePricedOption(idx, { label: e.target.value })}
                                                                                        placeholder="e.g. 1 Customer Doll"
                                                                                        className="flex-1 min-w-0 bg-zinc-50/70 hover:bg-white focus:bg-white border border-zinc-200 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-800 outline-none transition-all"
                                                                                    />
                                                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => movePricedOption(idx, 'up')}
                                                                                            disabled={idx === 0}
                                                                                            title="Move Up"
                                                                                            className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 disabled:opacity-20 cursor-pointer"
                                                                                        >
                                                                                            <ArrowUp size={13} />
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => movePricedOption(idx, 'down')}
                                                                                            disabled={idx === pricedOptionItems.length - 1}
                                                                                            title="Move Down"
                                                                                            className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 disabled:opacity-20 cursor-pointer"
                                                                                        >
                                                                                            <ArrowDown size={13} />
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => duplicatePricedOption(idx)}
                                                                                            title="Duplicate"
                                                                                            className="p-1 rounded hover:bg-amber-50 text-zinc-400 hover:text-amber-700 cursor-pointer"
                                                                                        >
                                                                                            <Copy size={13} />
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => removePricedOption(idx)}
                                                                                            title="Remove"
                                                                                            className="p-1 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600 cursor-pointer"
                                                                                        >
                                                                                            <Trash2 size={13} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Line 2: Price Input + Diff Badge */}
                                                                                <div className="flex items-center justify-between gap-2 pl-7">
                                                                                    <div className="relative flex-1 max-w-[150px]">
                                                                                        <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={12} />
                                                                                        <input
                                                                                            type="number"
                                                                                            min={0}
                                                                                            value={opt.price}
                                                                                            onChange={(e) => updatePricedOption(idx, { price: Number(e.target.value) || 0 })}
                                                                                            placeholder="0"
                                                                                            className="w-full bg-zinc-50/70 hover:bg-white focus:bg-white border border-zinc-200 focus:border-amber-500 rounded-lg py-1.5 pl-7 pr-2 text-xs font-black text-zinc-900 outline-none transition-all"
                                                                                        />
                                                                                    </div>
                                                                                    {baseProductPrice > 0 && (
                                                                                        <span 
                                                                                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight shrink-0 ${diff === 0 ? 'bg-zinc-100 text-zinc-500' : diff > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
                                                                                            title={`Base price is ₹${baseProductPrice}`}
                                                                                        >
                                                                                            {diff === 0 ? 'Base' : diff > 0 ? `+₹${diff.toLocaleString()}` : `-₹${Math.abs(diff).toLocaleString()}`}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </motion.div>
                                                                        );
                                                                    })}
                                                                </AnimatePresence>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Add New Option Composer */}
                                                    <div className="p-3.5 bg-gradient-to-br from-amber-500/5 via-white to-amber-500/10 rounded-2xl border-2 border-dashed border-amber-300/80 space-y-2.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 flex items-center gap-1.5">
                                                                <Plus size={13} className="text-amber-600" />
                                                                Add New Option
                                                            </span>
                                                            {baseProductPrice > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPricedOptionPriceDraft(String(baseProductPrice))}
                                                                    className="text-[9px] font-bold text-amber-700 hover:text-amber-900 underline underline-offset-2 cursor-pointer"
                                                                >
                                                                    Match Base (₹{baseProductPrice.toLocaleString()})
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Option Label input on full width */}
                                                        <div>
                                                            <input
                                                                value={pricedOptionLabelDraft}
                                                                onChange={(e) => setPricedOptionLabelDraft(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        addPricedOption();
                                                                    }
                                                                }}
                                                                placeholder="e.g. 2 Customer Dolls / Gift Wrap / Extra Set"
                                                                className="w-full bg-white border border-zinc-200 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-zinc-800 outline-none transition-all placeholder:text-zinc-300"
                                                            />
                                                        </div>

                                                        {/* Price input + Add Button side-by-side */}
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative flex-1">
                                                                <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-600" size={13} />
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={pricedOptionPriceDraft}
                                                                    onChange={(e) => setPricedOptionPriceDraft(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            addPricedOption();
                                                                        }
                                                                    }}
                                                                    placeholder={baseProductPrice ? String(baseProductPrice) : '0'}
                                                                    className="w-full bg-white border border-zinc-200 focus:border-amber-500 rounded-xl py-2 pl-7 pr-3 text-xs font-black text-zinc-900 outline-none transition-all placeholder:text-zinc-300"
                                                                />
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={addPricedOption}
                                                                className="bg-zinc-900 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs shrink-0 cursor-pointer"
                                                            >
                                                                <Plus size={14} />
                                                                <span>Add Option</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Interactive Storefront Live Preview */}
                                                    {pricedOptionItems.length > 0 && (
                                                        <div className="p-4 bg-zinc-900 text-white rounded-2xl border border-zinc-800 shadow-md space-y-2.5 overflow-hidden">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Eye size={12} className="text-amber-400" />
                                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Buyer View Preview</span>
                                                                </div>
                                                                <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/20">
                                                                    Interactive
                                                                </span>
                                                            </div>

                                                            <div className="pt-0.5 space-y-2">
                                                                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-300 flex items-center gap-1.5">
                                                                    <Users size={11} className="text-amber-400" />
                                                                    {pricedOptionsTitle || 'Options'}
                                                                </div>

                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {pricedOptionItems.map((opt, i) => {
                                                                        const isSelected = (previewSelectedOption || pricedOptionItems[0]?.label) === opt.label;
                                                                        return (
                                                                            <button
                                                                                key={i}
                                                                                type="button"
                                                                                onClick={() => setPreviewSelectedOption(opt.label)}
                                                                                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${isSelected ? 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20' : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60'}`}
                                                                            >
                                                                                {opt.label} <span className="opacity-80">· ₹{Number(opt.price || 0).toLocaleString()}</span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>

                                                                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px]">
                                                                    <span className="text-zinc-400">Simulated Price:</span>
                                                                    <span className="font-serif font-bold text-amber-400 text-sm">
                                                                        ₹{Number((pricedOptionItems.find(o => o.label === (previewSelectedOption || pricedOptionItems[0]?.label)) || pricedOptionItems[0])?.price || baseProductPrice).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
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
