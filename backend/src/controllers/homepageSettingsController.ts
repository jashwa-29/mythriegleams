import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Collection from '../models/Collection';
import Occasion from '../models/Occasion';
import HomepageSettings from '../models/HomepageSettings';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

const SETTINGS_KEY = 'homepage';

const populateSettings = (query: any) => query
    .populate('seasonalSection.collectionIds', 'name slug parent isActive')
    .populate('seasonalSection.occasionIds', 'name slug parent isActive');

const normalizeIds = (value: unknown, fieldName: string): string[] => {
    if (!Array.isArray(value)) {
        throw new ErrorResponse(`${fieldName} must be an array.`, 400);
    }

    const ids = Array.from(new Set(value.map((id) => String(id))));
    if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        throw new ErrorResponse(`${fieldName} contains an invalid reference.`, 400);
    }

    return ids;
};

export const getHomepageSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await populateSettings(HomepageSettings.findOne({ key: SETTINGS_KEY }));
    res.status(200).json({ success: true, data: settings });
});

export const updateHomepageSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { enabled, collectionIds, occasionIds } = req.body;

    if (enabled !== undefined && typeof enabled !== 'boolean' && enabled !== 'true' && enabled !== 'false') {
        return next(new ErrorResponse('Enabled must be a boolean.', 400));
    }

    let normalizedCollectionIds: string[];
    let normalizedOccasionIds: string[];

    try {
        normalizedCollectionIds = normalizeIds(collectionIds ?? [], 'collectionIds');
        normalizedOccasionIds = normalizeIds(occasionIds ?? [], 'occasionIds');
    } catch (error) {
        return next(error);
    }

    const [activeCollectionCount, activeOccasionCount] = await Promise.all([
        Collection.countDocuments({ _id: { $in: normalizedCollectionIds }, isActive: true }),
        Occasion.countDocuments({ _id: { $in: normalizedOccasionIds }, isActive: true })
    ]);

    if (activeCollectionCount !== normalizedCollectionIds.length) {
        return next(new ErrorResponse('One or more selected collections are unavailable.', 400));
    }

    if (activeOccasionCount !== normalizedOccasionIds.length) {
        return next(new ErrorResponse('One or more selected occasions are unavailable.', 400));
    }

    const seasonalSection = {
        enabled: enabled === undefined ? true : enabled === true || enabled === 'true',
        collectionIds: normalizedCollectionIds,
        occasionIds: normalizedOccasionIds
    };

    const settings = await populateSettings(HomepageSettings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set: { key: SETTINGS_KEY, seasonalSection } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ));

    res.status(200).json({ success: true, data: settings });
});
