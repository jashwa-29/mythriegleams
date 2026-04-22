import mongoose, { Schema, Document } from 'mongoose';

export interface ICollection extends Document {
    name: string;
    slug: string;
    description?: string;
    metaDescription?: string; // SEO optimization
    image?: string;
    isActive: boolean;
    createdAt: Date;
}

const CollectionSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    metaDescription: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

export default mongoose.model<ICollection>('Collection', CollectionSchema);
