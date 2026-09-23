import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    slug: string;
    category: string;
    subcategory?: string;
    occasion?: string;      // Main occasion name (e.g. "Birthday")
    occasionSub?: string;   // Occasion subcategory (e.g. "Wedding")
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
    createdAt: Date;
}

const ProductSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, default: '', index: true },
    occasion: { type: String, default: '', index: true },
    occasionSub: { type: String, default: '', index: true },
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
    requiresImage: { type: Boolean, default: false }
}, {
    timestamps: true
});

export default mongoose.model<IProduct>('Product', ProductSchema);
