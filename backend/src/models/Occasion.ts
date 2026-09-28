import mongoose, { Schema, Document } from 'mongoose';

export interface IOccasion extends Document {
    name: string;
    slug: string;
    description?: string;
    metaDescription?: string; // SEO optimization
    image?: string;
    parent: mongoose.Types.ObjectId | null; // null => top-level occasion
    isActive: boolean;
    isPaused?: boolean;   // Hides this occasion's products from the storefront
    pausedAt?: Date;
    createdAt: Date;
}

const OccasionSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    metaDescription: { type: String },
    image: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: 'Occasion', default: null },
    isActive: { type: Boolean, default: true },
    isPaused: { type: Boolean, default: false, index: true },
    pausedAt: { type: Date },
}, {
    timestamps: true
});

export default mongoose.model<IOccasion>('Occasion', OccasionSchema);