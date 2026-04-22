"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchProducts, deleteProduct, updateProduct, createProduct, resetProductState } from '@/redux/slices/productSlice';
import { 
    Plus, 
    Search, 
    Trash2, 
    Edit, 
    Package,
    Loader2,
    Activity,
    Box,
    Download,
    X,
    Hash,
    Tag,
    Layers,
    Archive,
    Image as ImageIcon,
    Clock,
    DollarSign,
    ExternalLink
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/admin/EmptyState';
import ProductModal from '@/components/admin/ProductModal';
import { RootState } from '@/redux/store';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ProductManagement = () => {
    const dispatch = useAppDispatch();
    const { products, loading, deleteSuccess, success: createSuccess, error } = useAppSelector((state: RootState) => state.products);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [inspectedProduct, setInspectedProduct] = useState<any>(null);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchProducts({}));
    }, [dispatch]);

    useEffect(() => {
        if (deleteSuccess || createSuccess) {
            toast.success(deleteSuccess ? "Inventory Updated" : "Entry Saved");
            setAddModalOpen(false);
            setInspectedProduct(null);
            dispatch(resetProductState());
            dispatch(fetchProducts({}));
        }
        if (error) {
            toast.error(error);
            dispatch(resetProductState());
        }
    }, [deleteSuccess, createSuccess, error, dispatch]);

    const exportToExcel = () => {
        if (products.length === 0) return toast.error("No data available to export");
        const headers = ["ID", "Name", "Slug", "Category", "Price", "Stock Status"];
        const rows = products.map(p => [p._id, p.name, p.slug, p.category, p.price, p.stockStatus]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `Mythris_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        toast.success("Excel Export Initialized");
    };

    const confirmDelete = () => {
        if (selectedProduct) {
            dispatch(deleteProduct(selectedProduct._id));
            setDeleteModalOpen(false);
            setSelectedProduct(null);
        }
    };

    const filteredProducts = products.filter((p: any) => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleFormSubmit = (formData: FormData) => {
        if (selectedProduct) {
            dispatch(updateProduct({ id: selectedProduct._id, productData: formData }));
        } else {
            dispatch(createProduct(formData));
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
            {/* Professional Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Product Management</h1>
                    <p className="text-xs text-zinc-500 font-medium">Manage your store's inventory and product details.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportToExcel} className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-zinc-200 transition-all border border-zinc-200">
                        <Download size={14} />
                        <span>Export Excel</span>
                    </button>
                    <button 
                        onClick={() => { setSelectedProduct(null); setAddModalOpen(true); }}
                        className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-black transition-all"
                    >
                        <Plus size={14} />
                        <span>New Entry</span>
                    </button>
                </div>
            </div>

            {/* Precision Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between border border-zinc-200 bg-zinc-50/50 p-2 rounded-xl">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:border-zinc-900 outline-none transition-all"
                    />
                </div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">{filteredProducts.length} Products Found</div>
            </div>

            {/* Inventory Data Registry */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading && products.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-200" />
                        <p className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest">Loading Products</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filteredProducts.map((product: any) => (
                                    <tr 
                                        key={product._id} 
                                        onClick={() => setInspectedProduct(product)}
                                        className="hover:bg-zinc-50/50 transition-all text-xs cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded border border-zinc-100 bg-zinc-50 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                                    {product.images?.[0] ? <img src={product.images[0]} className="w-full h-full object-cover" /> : <ImageIcon className="text-zinc-200 m-auto" size={16} />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-zinc-900 line-clamp-1">{product.name}</div>
                                                    <div className="text-[9px] font-mono text-zinc-400 uppercase">#{product.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 rounded border border-zinc-200 text-[9px] font-bold uppercase text-zinc-500 bg-zinc-50">{product.category}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shadow-sm ${
                                                product.stockStatus === 'in-stock' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                product.stockStatus === 'made-to-order' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                                            }`}>{product.stockStatus}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-zinc-900 tabular-nums">₹{product.price.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {inspectedProduct && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspectedProduct(null)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <h3 className="font-bold text-zinc-900 flex items-center gap-2">Product Details</h3>
                                <button onClick={() => setInspectedProduct(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                                <div className="flex gap-8">
                                    <div className="w-40 h-40 rounded-xl border border-zinc-200 overflow-hidden shrink-0 bg-zinc-50">
                                        {inspectedProduct.images?.[0] ? <img src={inspectedProduct.images[0]} className="w-full h-full object-cover" /> : <ImageIcon className="text-zinc-200 m-auto mt-12" size={40} />}
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        <div className="space-y-1">
                                            <div className="text-xl font-bold text-zinc-900">{inspectedProduct.name}</div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">UID: {inspectedProduct._id}</div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-xs text-zinc-500 leading-relaxed italic border-l-2 border-zinc-100 pl-4">"{inspectedProduct.story || "No story provided."}"</p>
                                            <div className="text-[10px] bg-zinc-50 p-3 rounded-lg border border-zinc-100 font-medium text-zinc-600">
                                                <span className="font-bold text-zinc-900 uppercase block mb-1">Product Details:</span>
                                                {inspectedProduct.details || "No technical specs found."}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-2"><DollarSign size={10}/> Price</div>
                                        <div className="text-lg font-bold text-zinc-900 tabular-nums">₹{inspectedProduct.price.toLocaleString()}</div>
                                    </div>
                                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Tag size={10}/> Category</div>
                                        <div className="text-lg font-bold text-zinc-900 uppercase">{inspectedProduct.category}</div>
                                    </div>
                                </div>
                            </div>
                             <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                                <button onClick={() => { setSelectedProduct(inspectedProduct); setInspectedProduct(null); setDeleteModalOpen(true); }} className="flex items-center gap-2 text-rose-500 hover:text-rose-700 font-bold text-[10px] uppercase tracking-widest transition-all"><Trash2 size={16}/> Delete Product</button>
                                <div className="flex gap-2">
                                    <button onClick={() => { setSelectedProduct(inspectedProduct); setInspectedProduct(null); setAddModalOpen(true); }} className="px-6 py-2 bg-zinc-200 text-zinc-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-zinc-300">Edit Product</button>
                                    <button onClick={() => setInspectedProduct(null)} className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black">Close</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modals Suite */}
            <ProductModal isOpen={addModalOpen} onClose={() => { setAddModalOpen(false); setSelectedProduct(null); }} onSubmit={handleFormSubmit} loading={loading} initialData={selectedProduct} />
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} type="confirm" title="Confirm Delete" message="Are you sure you want to delete this product?" />
        </div>
    );
};

export default ProductManagement;
