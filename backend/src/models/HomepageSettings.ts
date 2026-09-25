import mongoose, { Schema, Document } from 'mongoose';

export interface IHomepageSettings extends Document {
    key: string;
    seasonalSection: {
        enabled: boolean;
        collectionIds: mongoose.Types.ObjectId[];
        occasionIds: mongoose.Types.ObjectId[];
    };
    createdAt: Date;
    updatedAt: Date;
}

const HomepageSettingsSchema: Schema = new Schema({
    key: { type: String, required: true, unique: true, default: 'homepage' },
    seasonalSection: {
        enabled: { type: Boolean, default: true },
        collectionIds: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
        occasionIds: [{ type: Schema.Types.ObjectId, ref: 'Occasion' }]
    }
}, {
    timestamps: true
});

export default mongoose.model<IHomepageSettings>('HomepageSettings', HomepageSettingsSchema);
