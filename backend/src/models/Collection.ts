import mongoose, { Schema, Document } from 'mongoose';

export interface ICollection extends Document {
    name: string;
    slug: string;
    description?: string;
    metaDescription?: string; // SEO optimization
    image?: string;
    parent: mongoose.Types.ObjectId | null; // null => top-level category
    isActive: boolean;
    isPaused?: boolean;   // Hides this collection's products from the storefront
    pausedAt?: Date;
    createdAt: Date;
}

const CollectionSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    metaDescription: { type: String },
    image: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: 'Collection', default: null },
    isActive: { type: Boolean, default: true },
    isPaused: { type: Boolean, default: false, index: true },
    pausedAt: { type: Date },
}, {
    timestamps: true
});

export default mongoose.model<ICollection>('Collection', CollectionSchema);