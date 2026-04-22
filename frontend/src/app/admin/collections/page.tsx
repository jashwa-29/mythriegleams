"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCollections, createCollection, deleteCollection, resetCollectionState } from '@/redux/slices/collectionSlice';
import { 
    Layers, 
    Plus, 
    Trash2, 
    Image as ImageIcon,
    Loader2,
    X,
    Save,
    Sparkles,
    Search,
    Hash,
    Database,
    Download,
    ExternalLink,
    ChevronRight,
    MapPin,
    Clock
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RootState } from '@/redux/store';
import EmptyState from '@/components/admin/EmptyState';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const collectionSchema = z.object({
    name: z.string().min(2, "Collection name required"),
    slug: z.string().min(2, "Slug is required"),
    description: z.string().optional(),
    metaDescription: z.string().max(160, "SEO description must be concise").optional(),
});

type CollectionForm = z.infer<typeof collectionSchema>;

const CollectionManagement = () => {
    const dispatch = useAppDispatch();
    const { collections, loading, success, error } = useAppSelector((state: RootState) => state.collections);
    
    // UI State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [inspectedCollection, setInspectedCollection] = useState<any>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CollectionForm>({
        resolver: zodResolver(collectionSchema)
    });

    const galleryName = watch('name');
    useEffect(() => {
        if (galleryName) {
            const generatedSlug = galleryName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
            setValue('slug', generatedSlug);
        }
    }, [galleryName, setValue]);

    useEffect(() => {
        dispatch(fetchCollections());
    }, [dispatch]);

    useEffect(() => {
        if (success) {
            toast.success("Collections Updated");
            setIsAddModalOpen(false);
            setInspectedCollection(null);
            reset();
            setImage(null);
            setPreview(null);
            dispatch(resetCollectionState());
            dispatch(fetchCollections());
        }
    }, [success, reset, dispatch]);

    const exportToExcel = () => {
        if (collections.length === 0) return toast.error("No data to export");
        const headers = ["ID", "Name", "Slug", "Description"];
        const rows = collections.map(c => [c._id, c.name, c.slug, c.description || ""]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `Mythris_Collections_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        toast.success("Excel Export Initialized");
    };

    const confirmDelete = () => {
        if (inspectedCollection) {
            dispatch(deleteCollection(inspectedCollection._id));
            setDeleteModalOpen(false);
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
            {/* Professional Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Collections Management</h1>
                    <p className="text-xs text-zinc-500 font-medium">Manage your site's product collections and categories.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportToExcel} className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-zinc-200 transition-all border border-zinc-200">
                        <Download size={14} />
                        <span>Export Excel</span>
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-black transition-all">
                        <Plus size={14} />
                        <span>Add Collection</span>
                    </button>
                </div>
            </div>

            {/* Gallery Registry (Table) */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading && collections.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-200" />
                        <p className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest">Loading Collections</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Image</th>
                                    <th className="px-6 py-4">Collection Name</th>
                                    <th className="px-6 py-4">Slug</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {collections.map((col: any) => (
                                    <tr key={col._id} onClick={() => setInspectedCollection(col)} className="hover:bg-zinc-50/50 transition-all text-xs cursor-pointer group">
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 rounded border border-zinc-100 bg-zinc-50 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                                                {col.image ? <img src={col.image} className="w-full h-full object-cover" /> : <Layers className="text-zinc-200 m-auto" size={16} />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-zinc-900">{col.name}</div>
                                            <div className="text-[10px] text-zinc-400 mt-1 italic line-clamp-1">{col.description || "No narrative established."}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-[9px] text-zinc-400 font-bold uppercase">/{col.slug}</td>
                                        <td className="px-6 py-4 text-right"><span className="px-2 py-0.5 rounded border border-zinc-200 text-[9px] font-bold uppercase text-zinc-500 bg-zinc-50">Authorized</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {inspectedCollection && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspectedCollection(null)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <h3 className="font-bold text-zinc-900 flex items-center gap-2">Collection Details</h3>
                                <button onClick={() => setInspectedCollection(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="flex gap-6">
                                    <div className="w-24 h-24 rounded-xl border border-zinc-200 overflow-hidden bg-zinc-50 shadow-inner shrink-0">
                                        {inspectedCollection.image ? <img src={inspectedCollection.image} className="w-full h-full object-cover" /> : <Layers className="text-zinc-200 m-auto mt-7" size={24} />}
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <h4 className="text-xl font-bold text-zinc-900 tracking-tight">{inspectedCollection.name}</h4>
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2"><Hash size={10}/> {inspectedCollection.slug}</div>
                                        <p className="text-xs text-zinc-600 leading-relaxed italic mt-2">"{inspectedCollection.description || "No narrative established for this classifying node."}"</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-3">
                                    <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                                        <span>Node Metadata</span>
                                        <span className="text-emerald-500 flex items-center gap-1"><Database size={10}/> Synchronized</span>
                                    </div>
                                    <div className="text-[11px] text-zinc-500 font-medium">
                                        {inspectedCollection.metaDescription || "No localized SEO metadata detected for this registry entry."}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                                <button onClick={() => setDeleteModalOpen(true)} className="flex items-center gap-2 text-rose-500 hover:text-rose-700 font-bold text-[10px] uppercase tracking-widest transition-all"><Trash2 size={16}/> Delete Collection</button>
                                <button onClick={() => setInspectedCollection(null)} className="px-8 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black transition-all">Close</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Initialize Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <div onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl p-8 overflow-hidden shadow-2xl border border-zinc-200">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
                            <div><h2 className="text-lg font-bold text-zinc-900 tracking-tight">New Collection</h2><p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Add a new category to the site</p></div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-900"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit((data) => {
                            const formData = new FormData();
                            formData.append('name', data.name); formData.append('slug', data.slug);
                            if (data.description) formData.append('description', data.description);
                            if (data.metaDescription) formData.append('metaDescription', data.metaDescription);
                            if (image) formData.append('image', image);
                            dispatch(createCollection(formData));
                        })} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Name</label><input {...register('name')} placeholder="Collection Name" className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs font-bold focus:border-zinc-900 outline-none" /></div>
                                <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Slug</label><input {...register('slug')} placeholder="url-slug" className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-[10px] font-mono focus:border-zinc-900 outline-none" /></div>
                            </div>
                            <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Description</label><textarea {...register('description')} rows={3} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs focus:border-zinc-900 outline-none resize-none" /></div>
                            <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Image</label><div className="flex items-center gap-4"><label className="flex-1 border-2 border-dashed border-zinc-100 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-50"><ImageIcon size={20} className="text-zinc-300"/><input type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setImage(file); setPreview(URL.createObjectURL(file)); } }} className="hidden" accept="image/*" /></label>{preview && <div className="w-20 h-20 rounded-xl overflow-hidden border border-zinc-100"><img src={preview} className="w-full h-full object-cover" /></div>}</div></div>
                            <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white font-bold py-3.5 rounded-lg active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">{loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} />Create Collection</>}</button>
                        </form>
                    </div>
                </div>
            )}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirm Delete" message="Are you sure you want to delete this collection?" type="confirm" />
        </div>
    );
};

export default CollectionManagement;
