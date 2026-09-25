import mongoose, { Schema, Document } from 'mongoose';

export interface ISeasonalSection {
    _id?: mongoose.Types.ObjectId;
    name: string;
    enabled: boolean;
    badge: string;
    heading: string;
    description: string;
    collectionIds: mongoose.Types.ObjectId[];
    occasionIds: mongoose.Types.ObjectId[];
}

export interface IHomepageSettings extends Document {
    key: string;
    seasonalSections: ISeasonalSection[];
    createdAt: Date;
    updatedAt: Date;
}

const SeasonalSectionSchema: Schema = new Schema({
    name: { type: String, default: 'Seasonal Section' },
    enabled: { type: Boolean, default: false },
    badge: { type: String, default: '🪔 Festive Special' },
    heading: { type: String, default: 'Seasonal Collection' },
    description: { type: String, default: 'Explore our latest seasonal items.' },
    collectionIds: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
    occasionIds: [{ type: Schema.Types.ObjectId, ref: 'Occasion' }]
});

const HomepageSettingsSchema: Schema = new Schema({
    key: { type: String, required: true, unique: true, default: 'homepage' },
    seasonalSections: {
        type: [SeasonalSectionSchema],
        default: []
    }
}, {
    timestamps: true
});

export default mongoose.model<IHomepageSettings>('HomepageSettings', HomepageSettingsSchema);

