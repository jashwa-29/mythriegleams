import { Request, Response, NextFunction } from 'express';
import ShippingSettings from '../models/ShippingSettings';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';
import {
    normalizeSlabs,
    getShippingSettings,
    DEFAULT_SHIPPING_SETTINGS,
    type RateSlab,
    type CountryRate
} from '../utils/shipping';

const SETTINGS_KEY = 'shipping';

const sanitizeSlabs = (value: unknown, field: string): RateSlab[] => {
    if (value === undefined) return [];
    if (!Array.isArray(value)) throw new ErrorResponse(`${field} must be a list of weight slabs.`, 400);

    const slabs = normalizeSlabs(value);
    for (const slab of slabs) {
        if (!Number.isFinite(slab.charge) || slab.charge < 0) {
            throw new ErrorResponse(`${field} has a slab with an invalid charge.`, 400);
        }
        if (slab.maxWeight != null && slab.maxWeight <= slab.minWeight) {
            throw new ErrorResponse(`${field} has a slab whose maximum weight must exceed its minimum.`, 400);
        }
    }
    return slabs;
};

const sanitizeCountryRates = (value: unknown): CountryRate[] => {
    if (value === undefined) return [];
    if (!Array.isArray(value)) throw new ErrorResponse('countryRates must be a list.', 400);

    const seen = new Set<string>();
    const rates: CountryRate[] = [];

    for (const entry of value) {
        const country = typeof entry?.country === 'string' ? entry.country.trim() : '';
        if (!country) throw new ErrorResponse('Every country override needs a country name.', 400);

        const key = country.toLowerCase();
        if (seen.has(key)) throw new ErrorResponse(`"${country}" is listed more than once.`, 400);
        seen.add(key);

        rates.push({ country, slabs: sanitizeSlabs(entry?.slabs, `rates for ${country}`) });
    }

    return rates;
};

/**
 * @desc    Public shipping configuration. The storefront uses this to preview the
 *          delivery charge for the address being entered.
 * @route   GET /api/shipping-settings
 * @access  Public
 */
export const getShippingSettingsConfig = asyncHandler(async (req: Request, res: Response) => {
    const settings = await getShippingSettings();
    res.status(200).json({ success: true, data: settings });
});

/**
 * @desc    Update delivery charges: per-weight slabs for the home state / other
 *          states / international, and per-country overrides.
 * @route   PUT /api/shipping-settings
 * @access  Private/Admin
 */
export const updateShippingSettingsConfig = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const body = req.body || {};

    let withinState: RateSlab[];
    let otherStates: RateSlab[];
    let international: RateSlab[];
    let countryRates: CountryRate[];

    try {
        withinState = sanitizeSlabs(body.withinState, 'Home-state rates');
        otherStates = sanitizeSlabs(body.otherStates, 'Other-state rates');
        international = sanitizeSlabs(body.international, 'International rates');
        countryRates = sanitizeCountryRates(body.countryRates);
    } catch (error) {
        return next(error);
    }

    const payload = {
        key: SETTINGS_KEY,
        homeState:
            typeof body.homeState === 'string' && body.homeState.trim()
                ? body.homeState.trim()
                : DEFAULT_SHIPPING_SETTINGS.homeState,
        withinState,
        otherStates,
        international,
        countryRates
    };

    await ShippingSettings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set: payload },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const settings = await getShippingSettings();
    res.status(200).json({ success: true, data: settings });
});
