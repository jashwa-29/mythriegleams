import mongoose, { Schema, Document } from 'mongoose';

/**
 * A weight slab. Weight is in grams. `maxWeight` null/undefined means "no upper bound",
 * so the heaviest slab should always be left open to catch any weight.
 */
export interface IRateSlab {
    minWeight: number;
    maxWeight?: number | null;
    charge: number;
}

/** An override for a single named country. Falls back to `international` when absent. */
export interface ICountryRate {
    country: string;
    slabs: IRateSlab[];
}

export interface IShippingSettings extends Document {
    key: string;
    /** The store's home state — orders shipping within it use `withinState` rates. */
    homeState: string;
    /** Rates for the home state, by weight. */
    withinState: IRateSlab[];
    /** Rates for every other Indian state, by weight. */
    otherStates: IRateSlab[];
    /** Default rates for countries without a specific override, by weight. */
    international: IRateSlab[];
    /** Per-country overrides, by weight. */
    countryRates: ICountryRate[];
    createdAt: Date;
    updatedAt: Date;
}

const RateSlabSchema: Schema = new Schema({
    minWeight: { type: Number, default: 0, min: 0 },
    maxWeight: { type: Number, default: null },
    charge: { type: Number, default: 0, min: 0 }
}, { _id: false });

const CountryRateSchema: Schema = new Schema({
    country: { type: String, required: true },
    slabs: { type: [RateSlabSchema], default: [] }
}, { _id: false });

const ShippingSettingsSchema: Schema = new Schema({
    key: { type: String, required: true, unique: true, default: 'shipping' },
    homeState: { type: String, default: 'Tamil Nadu' },
    withinState: { type: [RateSlabSchema], default: [] },
    otherStates: { type: [RateSlabSchema], default: [] },
    international: { type: [RateSlabSchema], default: [] },
    countryRates: { type: [CountryRateSchema], default: [] }
}, {
    timestamps: true
});

export default mongoose.model<IShippingSettings>('ShippingSettings', ShippingSettingsSchema);
