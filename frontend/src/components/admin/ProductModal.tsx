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
    Minus,
    Trash2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { fetchCollections } from '@/redux/slices/collectionSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { RootState } from '@/redux/store';

const artisanalSchema = z.object({
    name: z.string().min(3, "Name your creation"),
    slug: z.string().min(3, "Unique identifier required"),
    category: z.string().min(1, "Choose a collection"),
    price: z.number().min(1, "Enter artisanal value"),
    mrp: z.number().min(1, "Enter valuation (MRP)"),
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
    initialData?: any; // Data for editing
}

const ArtisanalProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSubmit, loading, initialData }) => {
    const dispatch = useAppDispatch();
    const { collections } = useAppSelector((state: RootState) => state.collections);
    const [mediaItems, setMediaItems] = useState<{ type: 'existing' | 'new', url: string, file?: File }[]>([]);
    const [variants, setVariants] = useState<string[]>(['Small (6 inch)', 'Medium (8 inch)', 'Large (10 inch)']);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ArtisanalFormData>({
        resolver: zodResolver(artisanalSchema),
        defaultValues: { stockStatus: 'made-to-order' }
    });

    // Auto-Slug Generation Logic
    const productName = watch('name');
    useEffect(() => {
        if (productName) {
            const generatedSlug = productName
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '') // remove special chars
                .replace(/[\s_-]+/g, '-') // replace spaces/underscores with hyphens
                .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
            setValue('slug', generatedSlug);
        }
    }, [productName, setValue]);

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchCollections());
            if (initialData) {
                reset({
                    name: initialData.name,
                    slug: initialData.slug,
                    category: initialData.category,
                    price: initialData.price,
                    mrp: initialData.mrp,
                    story: initialData.story,
                    details: initialData.details,
                    metaDescription: initialData.metaDescription || '',
                    stockStatus: initialData.stockStatus,
                });
                if (initialData.images) {
                    setMediaItems(initialData.images.map((url: string) => ({ type: 'existing', url })));
                } else {
                    setMediaItems([]);
                }
            } else {
                reset({ stockStatus: 'made-to-order', name: '', slug: '', category: '', price: 0, mrp: 0, story: '', details: '', metaDescription: '' });
                setMediaItems([]);
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
            const newMedia = files.map(file => ({
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
            formData.append(key, (data as any)[key]);
        });
        
        // Add variants
        const variantPayload = [{ type: 'Size', options: variants }];
        formData.append('variants', JSON.stringify(variantPayload));

        // Add kept existing images
        const existingImagesToKeep = mediaItems.filter(m => m.type === 'existing').map(m => m.url);
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
                                                    <img src={mediaItems[0].url} alt="Master" className="w-full h-full object-cover" />
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
                                                        <img src={item.url} alt="Sub" className="w-full h-full object-cover" />
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
                                                    {variants.map((v, i) => (
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
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Collection</label>
                                            <select {...register('category')} className="w-full bg-zinc-50 border-none rounded-2xl p-5 text-zinc-900 font-bold focus:ring-2 focus:ring-gold/20 outline-none transition-all appearance-none cursor-pointer">
                                                <option value="">Select Gallery...</option>
                                                {collections.map((col: any) => (
                                                    <option key={col._id} value={col.name}>{col.name}</option>
                                                ))}
                                            </select>
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
