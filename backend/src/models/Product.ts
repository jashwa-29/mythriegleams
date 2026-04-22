import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    slug: string;
    category: string;
    price: number;
    mrp: number; // For discount calculation
    story: string; // The inspiration
    details: string; // The technical specs
    metaDescription?: string; // SEO optimization
    images: string[];
    variants: {
        type: string;
        options: string[];
    }[];
    stockStatus: string;
    createdAt: Date;
}

const ProductSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    mrp: { type: Number, default: 0 },
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
    }
}, {
    timestamps: true
});

export default mongoose.model<IProduct>('Product', ProductSchema);
