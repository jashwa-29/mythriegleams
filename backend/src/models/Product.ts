import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    slug: string;
    category: string;
    categories?: string[];
    subcategory?: string;
    subcategories?: string[];
    occasion?: string;      // Main occasion name (e.g. "Birthday")
    occasions?: string[];   // Multiple occasions
    occasionSub?: string;   // Occasion subcategory (e.g. "Wedding")
    occasionSubs?: string[]; // Multiple occasion subcategories
    price: number;
    mrp: number; // For discount calculation
    weight: number; // Weight in grams
    story: string; // The inspiration
    details: string; // The technical specs
    metaDescription?: string; // SEO optimization
    images: string[];
    variants: {
        type: string;
        options: string[];
    }[];
    stockStatus: string;
    requiresImage: boolean;
    isBestseller: boolean;
    createdAt: Date;
}

const ProductSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    categories: [{ type: String, index: true }],
    subcategory: { type: String, default: '', index: true },
    subcategories: [{ type: String, index: true }],
    occasion: { type: String, default: '', index: true },
    occasions: [{ type: String, index: true }],
    occasionSub: { type: String, default: '', index: true },
    occasionSubs: [{ type: String, index: true }],
    price: { type: Number, required: true },
    mrp: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    story: { type: String, required: true },
    details: { type: String, required: true },
    metaDescription: { type: String },
    images: [{ type: String }],
    variants: [{
        type: { type: String, default: 'Size' },
        options: [{ type: String }]
    }],
    stockStatus: { 
        type: String, 
        enum: ['in-stock', 'out-of-stock', 'made-to-order'], 
        default: 'made-to-order' 
    },
    requiresImage: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false, index: true }
}, {
    timestamps: true
});

export default mongoose.model<IProduct>('Product', ProductSchema);
