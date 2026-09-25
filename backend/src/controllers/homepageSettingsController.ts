import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Collection from '../models/Collection';
import Occasion from '../models/Occasion';
import HomepageSettings from '../models/HomepageSettings';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

const SETTINGS_KEY = 'homepage';

const populateSettings = (query: any) => query
    .populate('seasonalSections.collectionIds', 'name slug parent isActive')
    .populate('seasonalSections.occasionIds', 'name slug parent isActive');

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
    const { seasonalSections } = req.body;

    if (!Array.isArray(seasonalSections)) {
        return next(new ErrorResponse('seasonalSections must be an array.', 400));
    }

    const validatedSections = [];

    for (const section of seasonalSections) {
        const { _id, name, enabled, badge, heading, description, collectionIds, occasionIds } = section;

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

        const sectionData: any = {
            name: name || 'Seasonal Section',
            enabled: enabled === undefined ? false : Boolean(enabled),
            badge: badge || '🪔 Festive Special',
            heading: heading || 'Seasonal Collection',
            description: description || 'Explore our latest seasonal items.',
            collectionIds: normalizedCollectionIds,
            occasionIds: normalizedOccasionIds
        };

        if (_id) {
            sectionData._id = _id;
        }

        validatedSections.push(sectionData);
    }

    const settings = await populateSettings(HomepageSettings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set: { key: SETTINGS_KEY, seasonalSections: validatedSections }, $unset: { seasonalSection: 1 } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ));

    res.status(200).json({ success: true, data: settings });
});
