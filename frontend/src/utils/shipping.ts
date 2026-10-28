export interface RateSlab {
    minWeight: number;
    maxWeight?: number | null;
    charge: number;
}

export interface CountryRate {
    country: string;
    slabs: RateSlab[];
}

export interface ShippingSettingsData {
    homeState: string;
    withinState: RateSlab[];
    otherStates: RateSlab[];
    international: RateSlab[];
    countryRates: CountryRate[];
}

export interface ShippingContext {
    country?: string;
    state?: string;
    /** Total order weight in grams. */
    totalWeight?: number;
}

// Out-of-the-box default delivery charge — the live rates come from the
// ShippingSettings document.
export const SHIPPING_FEE = 200;

const flat = (charge: number): RateSlab[] => [{ minWeight: 0, maxWeight: null, charge }];

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettingsData = {
    homeState: 'Tamil Nadu',
    withinState: flat(SHIPPING_FEE),
    otherStates: flat(SHIPPING_FEE),
    international: flat(SHIPPING_FEE),
    countryRates: []
};

const INDIA_ALIASES = ['india', 'bharat', 'in', 'ind'];

export const isIndia = (country?: string): boolean => {
    const value = (country || '').trim().toLowerCase();
    return !value || INDIA_ALIASES.includes(value);
};

const toNumber = (value: unknown, fallback = 0): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeSlabs = (value: unknown): RateSlab[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((raw) => {
            const slab = (raw ?? {}) as { minWeight?: unknown; maxWeight?: unknown; charge?: unknown };
            return {
                minWeight: Math.max(0, toNumber(slab.minWeight)),
                maxWeight:
                    slab.maxWeight === null || slab.maxWeight === undefined || slab.maxWeight === ''
                        ? null
                        : Math.max(0, toNumber(slab.maxWeight)),
                charge: Math.max(0, toNumber(slab.charge))
            };
        })
        .sort((a, b) => a.minWeight - b.minWeight);
};

/** Merge a server payload with the defaults so the UI always has a complete shape. */
export const normalizeShippingSettings = (value: Partial<ShippingSettingsData> | null | undefined): ShippingSettingsData => {
    if (!value) return DEFAULT_SHIPPING_SETTINGS;
    return {
        homeState: (value.homeState || DEFAULT_SHIPPING_SETTINGS.homeState).trim(),
        withinState: normalizeSlabs(value.withinState),
        otherStates: normalizeSlabs(value.otherStates),
        international: normalizeSlabs(value.international),
        countryRates: Array.isArray(value.countryRates)
            ? value.countryRates
                  .filter((entry) => entry && String(entry.country || '').trim())
                  .map((entry) => ({ country: String(entry.country).trim(), slabs: normalizeSlabs(entry.slabs) }))
            : []
    };
};

/** Pick the slab a given weight falls into. Above the top slab, the heaviest charge applies. */
const pickSlab = (slabs: RateSlab[], weight: number): RateSlab | null => {
    if (!slabs || slabs.length === 0) return null;
    const sorted = [...slabs].sort((a, b) => a.minWeight - b.minWeight);
    const safeWeight = Math.max(0, weight);

    for (const slab of sorted) {
        const max = slab.maxWeight;
        if (safeWeight >= slab.minWeight && (max === null || max === undefined || safeWeight < max)) {
            return slab;
        }
    }

    return sorted[sorted.length - 1];
};

/** Choose which rate table applies to a destination. */
const resolveSlabs = (context: ShippingContext, settings: ShippingSettingsData): RateSlab[] => {
    if (isIndia(context.country)) {
        const home = (settings.homeState || '').trim().toLowerCase();
        const state = (context.state || '').trim().toLowerCase();
        return home && state && state === home ? settings.withinState : settings.otherStates;
    }

    const country = (context.country || '').trim().toLowerCase();
    const override = settings.countryRates.find((entry) => entry.country.trim().toLowerCase() === country);
    return override && override.slabs.length > 0 ? override.slabs : settings.international;
};

/**
 * Mirror of the backend rule so the cart and checkout can preview a charge.
 * The backend always recomputes authoritatively on order creation.
 */
export const calculateShipping = (
    _itemsPrice: number,
    context: ShippingContext = {},
    settings: ShippingSettingsData = DEFAULT_SHIPPING_SETTINGS
): number => {
    const slabs = resolveSlabs(context, settings);
    const slab = pickSlab(slabs, toNumber(context.totalWeight));

    return Math.round((slab?.charge ?? 0) * 100) / 100;
};
