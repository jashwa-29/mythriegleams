"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCollections, createCollection, updateCollection, deleteCollection, resetCollectionState, type CollectionItem } from '@/redux/slices/collectionSlice';
import { 
    Layers, 
    Plus, 
    Trash2, 
    Image as ImageIcon,
    Loader2,
    X,
    Save,
    Hash,
    Database,
    Download,
    ChevronRight,
    Edit,
    FolderTree,
    Search
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RootState } from '@/redux/store';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '@/utils/getImageUrl';

const collectionSchema = z.object({
    name: z.string().min(2, "Collection name required"),
    slug: z.string().min(2, "Slug is required"),
    parent: z.string().optional(),
    description: z.string().optional(),
    metaDescription: z.string().max(160, "SEO description must be concise").optional(),
});

type CollectionForm = z.infer<typeof collectionSchema>;

const CollectionManagement = () => {
    const dispatch = useAppDispatch();
    const { collections, loading, success, error } = useAppSelector((state: RootState) => state.collections);
    
    // UI State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);
    const [inspectedCollection, setInspectedCollection] = useState<CollectionItem | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const { register, handleSubmit, reset, watch, setValue } = useForm<CollectionForm>({
        resolver: zodResolver(collectionSchema)
    });

    const getParentId = (c: { parent?: CollectionItem['parent'] | null }) =>
        typeof c.parent === 'object' && c.parent ? c.parent._id : c.parent;

    // Derive hierarchy from flat list
    const mainCollections = collections.filter(c => !c.parent).sort((a, b) => a.name.localeCompare(b.name));
    const subCollectionsOf = (main: CollectionItem) => collections.filter(c => getParentId(c) === main._id);
    const parentNameOf = (col: CollectionItem) => {
        if (!col.parent) return null;
        if (typeof col.parent === 'object') return col.parent.name;
        return collections.find(c => c._id === col.parent)?.name || 'Parent';
    };

    const galleryName = watch('name');
    useEffect(() => {
        if (galleryName && !editingCollection) {
            const generatedSlug = galleryName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
            setValue('slug', generatedSlug);
        }
    }, [galleryName, setValue, editingCollection]);

    useEffect(() => {
        dispatch(fetchCollections());
    }, [dispatch]);

    useEffect(() => {
        if (success) {
            toast.success("Collections Updated");
            setIsAddModalOpen(false);
            setEditingCollection(null);
            setInspectedCollection(null);
            reset();
            setImage(null);
            setPreview(null);
            dispatch(resetCollectionState());
            dispatch(fetchCollections());
        }
        if (error) {
            toast.error(error);
            dispatch(resetCollectionState());
        }
    }, [success, error, reset, dispatch]);

    const openAddModal = () => {
        setEditingCollection(null);
        reset({ name: '', slug: '', parent: '', description: '', metaDescription: '' });
        setImage(null);
        setPreview(null);
        setIsAddModalOpen(true);
    };

    const openEditModal = (col: CollectionItem) => {
        setEditingCollection(col);
        reset({
            name: col.name,
            slug: col.slug,
            parent: col.parent && typeof col.parent === 'object' ? col.parent._id : (col.parent || ''),
            description: col.description || '',
            metaDescription: col.metaDescription || '',
        });
        setImage(null);
        const existingImage = typeof col.image === 'string' ? col.image : '';
        setPreview(existingImage ? getImageUrl(existingImage) : null);
        setIsAddModalOpen(true);
    };

    const exportToExcel = () => {
        if (collections.length === 0) return toast.error("No data to export");
        const headers = ["ID", "Name", "Slug", "Parent", "Type", "Description"];
        const rows = collections.map(c => [c._id, c.name, c.slug, parentNameOf(c) || "", parentNameOf(c) ? "Subcategory" : "Main Category", c.description || ""]);
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

    const [searchQuery, setSearchQuery] = useState('');

    const handleFormSubmit = (data: CollectionForm) => {
        const formData = new FormData();
        formData.append('name', data.name.trim());
        formData.append('slug', data.slug.trim());
        formData.append('parent', data.parent || '');
        if (data.description) formData.append('description', data.description);
        if (data.metaDescription) formData.append('metaDescription', data.metaDescription);
        if (image) formData.append('image', image);
        if (editingCollection) {
            dispatch(updateCollection({ id: editingCollection._id, formData }));
        } else {
            dispatch(createCollection(formData));
        }
    };

    // Filter main collections and subs by search query
    const filteredCollections = mainCollections.filter(col => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const matchesMain = col.name.toLowerCase().includes(q) || col.slug.toLowerCase().includes(q);
        const subs = subCollectionsOf(col);
        const matchesSub = subs.some(s => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q));
        return matchesMain || matchesSub;
    });

    const totalSubcategories = collections.length - mainCollections.length;

    return (
        <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen rounded-2xl border border-zinc-200">
            {/* Professional Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5 sm:pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Collections Management</h1>
                    <p className="text-xs text-zinc-500 font-medium">Manage your product categories and subcategories ({mainCollections.length} Categories, {totalSubcategories} Subcategories).</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <button onClick={exportToExcel} className="flex items-center gap-1.5 sm:gap-2 bg-zinc-100 text-zinc-900 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-zinc-200 transition-all border border-zinc-200">
                        <Download size={14} />
                        <span>Export</span>
                    </button>
                    <button onClick={openAddModal} className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-black transition-all shadow-sm">
                        <Plus size={14} />
                        <span>Add Collection</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="sm:col-span-2 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search collections or subcategories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-xs font-medium focus:bg-white focus:border-zinc-900 outline-none transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Categories</span>
                    <span className="text-base font-extrabold text-zinc-900">{mainCollections.length}</span>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Subcategories</span>
                    <span className="text-base font-extrabold text-zinc-900">{totalSubcategories}</span>
                </div>
            </div>

            {/* Hierarchy Overview */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading && collections.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-200" />
                        <p className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest">Loading Collections</p>
                    </div>
                ) : filteredCollections.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <FolderTree className="w-8 h-8 text-zinc-200" />
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">
                            {searchQuery ? `No collections match "${searchQuery}"` : "No Categories Yet"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[550px]">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Category Tree</th>
                                    <th className="px-6 py-4">Slug</th>
                                    <th className="px-6 py-4 text-right">Type</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filteredCollections.map((col) => {
                                    const subs = subCollectionsOf(col);
                                    return (
                                        <React.Fragment key={col._id}>
                                            <tr onClick={() => setInspectedCollection(col)} className="hover:bg-zinc-50/50 transition-all text-xs cursor-pointer group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded border border-zinc-100 bg-zinc-50 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500 relative flex items-center justify-center">
                                                            <Layers className="text-zinc-300 absolute" size={16} />
                                                            {col.image && (
                                                                <img 
                                                                    src={getImageUrl(col.image)} 
                                                                    alt={col.name}
                                                                    className="w-full h-full object-cover relative z-10" 
                                                                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                                                />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-zinc-900">{col.name}</div>
                                                            <div className="text-[10px] text-zinc-400 mt-1 italic line-clamp-1">{col.description || "No narrative established."}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-[9px] text-zinc-400 font-bold uppercase">/{col.slug}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="px-2 py-0.5 rounded-full border border-zinc-900/10 text-[9px] font-bold uppercase text-zinc-700 bg-zinc-900/5">
                                                        {subs.length} Subcategories
                                                    </span>
                                                </td>
                                            </tr>
                                            {subs.map((sub) => (
                                                <tr key={sub._id} onClick={() => setInspectedCollection(sub)} className="hover:bg-zinc-50/40 transition-all text-xs cursor-pointer group bg-zinc-50/30">
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-4 pl-8">
                                                            <ChevronRight size={12} className="text-zinc-300 shrink-0" />
                                                            <div className="w-8 h-8 rounded border border-zinc-100 bg-white overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500 relative flex items-center justify-center">
                                                                <Layers className="text-zinc-300 absolute" size={12} />
                                                                {sub.image && (
                                                                    <img 
                                                                        src={getImageUrl(sub.image)} 
                                                                        alt={sub.name}
                                                                        className="w-full h-full object-cover relative z-10" 
                                                                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="font-bold text-zinc-700">{sub.name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 font-mono text-[9px] text-zinc-400 font-bold uppercase pl-16">/{sub.slug}</td>
                                                    <td className="px-6 py-3 text-right">
                                                        <span className="px-2 py-0.5 rounded-full border border-zinc-200 text-[9px] font-bold uppercase text-zinc-400 bg-white">Subcategory</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {inspectedCollection && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspectedCollection(null)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
                            <div className="p-4 sm:p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <h3 className="font-bold text-zinc-900 flex items-center gap-2">Collection Details</h3>
                                <button onClick={() => setInspectedCollection(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto max-h-[70vh]">
                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-stretch">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-zinc-200 overflow-hidden bg-zinc-50 shadow-inner shrink-0 mx-auto sm:mx-0">
                                        {inspectedCollection.image ? <img src={getImageUrl(inspectedCollection.image)} className="w-full h-full object-cover" /> : <Layers className="text-zinc-200 m-auto mt-6" size={24} />}
                                    </div>
                                    <div className="space-y-2 flex-1 w-full">
                                        <h4 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight break-words">{inspectedCollection.name}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1"><Hash size={10}/> {inspectedCollection.slug}</span>
                                            {parentNameOf(inspectedCollection) && (
                                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1"><FolderTree size={10}/> Under: {parentNameOf(inspectedCollection)}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-600 leading-relaxed italic mt-2">{`"${inspectedCollection.description || "No narrative established for this classifying node."}"`}</p>
                                    </div>
                                </div>
                                <div className="p-3 sm:p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2 sm:space-y-3">
                                    <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                                        <span>Node Metadata</span>
                                        <span className="text-emerald-500 flex items-center gap-1"><Database size={10}/> Synchronized</span>
                                    </div>
                                    <div className="text-[11px] text-zinc-500 font-medium">
                                        {inspectedCollection.metaDescription || "No localized SEO metadata detected for this registry entry."}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 bg-zinc-50 border-t border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                <button onClick={() => setDeleteModalOpen(true)} className="flex items-center justify-center gap-2 text-rose-500 hover:text-rose-700 font-bold text-[10px] uppercase tracking-widest transition-all py-2"><Trash2 size={16}/> Delete</button>
                                <div className="flex gap-2">
                                    <button onClick={() => { openEditModal(inspectedCollection); setInspectedCollection(null); }} className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-zinc-200 text-zinc-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-zinc-300 transition-all"><Edit size={12} className="inline mr-1.5" />Edit</button>
                                    <button onClick={() => setInspectedCollection(null)} className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black transition-all">Close</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create / Edit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-4">
                    <div onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl p-5 sm:p-8 overflow-y-auto max-h-[90vh] shadow-2xl border border-zinc-200">
                        <div className="flex items-center justify-between mb-6 sm:mb-8 pb-4 border-b border-zinc-100">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">{editingCollection ? "Edit Collection" : "New Collection"}</h2>
                                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{editingCollection ? "Revise this category node" : "Add a category or subcategory to the site"}</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-900"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Name</label><input {...register('name')} placeholder="Collection Name" className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 sm:p-3 text-xs font-bold focus:border-zinc-900 outline-none" /></div>
                                <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Slug</label><input {...register('slug')} placeholder="url-slug" className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 sm:p-3 text-[10px] font-mono focus:border-zinc-900 outline-none" /></div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Parent Category (leave blank for top-level)</label>
                                <select {...register('parent')} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 sm:p-3 text-xs font-bold focus:border-zinc-900 outline-none appearance-none cursor-pointer">
                                    <option value="">— Top-level Category —</option>
                                    {mainCollections.map((main) => (
                                        <option key={main._id} value={main._id}>{main.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Description</label><textarea {...register('description')} rows={3} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 sm:p-3 text-xs focus:border-zinc-900 outline-none resize-none" /></div>
                            <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Image</label><div className="flex items-center gap-4"><label className="flex-1 border-2 border-dashed border-zinc-100 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-50"><ImageIcon size={20} className="text-zinc-300"/><span className="text-[9px] font-bold uppercase tracking-widest text-zinc-300">{editingCollection?.image ? "Replace image" : "Upload image"}</span><input type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setImage(file); setPreview(URL.createObjectURL(file)); } }} className="hidden" accept="image/*" /></label>{preview && <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-zinc-100 shrink-0"><img src={preview} className="w-full h-full object-cover" /></div>}</div></div>
                            <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white font-bold py-3.5 rounded-lg active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">{loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} />{editingCollection ? "Save Changes" : "Create Collection"}</>}</button>
                        </form>
                    </div>
                </div>
            )}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirm Delete" message="Deleting a category also removes its subcategories and linked products will remain unlinked. Proceed?" type="confirm" />
        </div>
    );
};

export default CollectionManagement;