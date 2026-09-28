import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Occasion from '../models/Occasion';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';
import { getPausedIndex, describeSectionPause, invalidatePausedIndex } from '../services/productVisibilityService';
import { parsePauseInput } from './collectionController';

// @desc    Get occasions. Paused occasions stay listed (their products are hidden instead),
//          but ?all=1 lets an admin also see deactivated ones so they can be reactivated.
// @route   GET /api/occasions
export const getOccasions = asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.all === 'true' && req.user?.role === 'admin';
    const occasions = await Occasion.find(includeInactive ? {} : { isActive: true })
        .populate('parent', 'name slug isPaused')
        .sort({ createdAt: 1 });

    // A sub-occasion below a paused parent is not sellable either, so the storefront needs the
    // effective state to explain the empty page.
    const index = await getPausedIndex();
    const data = occasions.map((occ: any) => {
        const reason = describeSectionPause(index, 'occasion', occ.name);
        return {
            ...occ.toObject(),
            isEffectivelyPaused: !!reason,
            pausedBecause: reason ? reason.pausedName : null
        };
    });

    res.status(200).json({ success: true, count: data.length, data });
});

// @desc    Create new occasion (Admin Only)
// @route   POST /api/occasions
export const createOccasion = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { name, slug, description, metaDescription, parent } = req.body;

    // Ensure parent (if given) actually exists and is a string/ObjectId
    let parentId: mongoose.Types.ObjectId | null = null;
    if (parent) {
        if (!mongoose.Types.ObjectId.isValid(parent)) {
            return next(new ErrorResponse('Invalid parent occasion reference.', 400));
        }
        const parentOccasion = await Occasion.findById(parent);
        if (!parentOccasion) {
            return next(new ErrorResponse('Parent occasion not found.', 404));
        }
        parentId = parentOccasion._id as mongoose.Types.ObjectId;
    }

    const occasionData: any = { name, slug, description, metaDescription, parent: parentId };

    if (req.file) {
        occasionData.image = `/uploads/${req.file.filename}`;
    }

    const occasion = await Occasion.create(occasionData);
    res.status(201).json({ success: true, data: occasion });
});

// @desc    Update occasion (Admin Only)
// @route   PUT /api/occasions/:id
export const updateOccasion = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const occasion = await Occasion.findById(req.params.id);
    if (!occasion) {
        return next(new ErrorResponse('Occasion for revision not found.', 404));
    }

    const { name, slug, description, metaDescription, parent, isActive, isPaused } = req.body;

    if (name) occasion.name = name;
    if (slug) occasion.slug = slug;
    if (description !== undefined) occasion.description = description;
    if (metaDescription !== undefined) occasion.metaDescription = metaDescription;
    if (isActive !== undefined) occasion.isActive = isActive === true || isActive === 'true';
    if (isPaused !== undefined) {
        const isPausedValue = parsePauseInput(isPaused);
        occasion.isPaused = isPausedValue === true;
        occasion.pausedAt = occasion.isPaused ? new Date() : undefined;
    }

    if (parent !== undefined) {
        if (parent === '' || parent === 'null' || parent === null) {
            occasion.parent = null as any;
        } else {
            if (occasion._id.toString() === parent) {
                return next(new ErrorResponse('An occasion cannot be its own parent.', 400));
            }
            if (!mongoose.Types.ObjectId.isValid(parent)) {
                return next(new ErrorResponse('Invalid parent occasion reference.', 400));
            }
            const parentOccasion = await Occasion.findById(parent);
            if (!parentOccasion) {
                return next(new ErrorResponse('Parent occasion not found.', 404));
            }
            occasion.parent = parentOccasion._id as mongoose.Types.ObjectId;
        }
    }

    if (req.file) {
        occasion.image = `/uploads/${req.file.filename}`;
    }

    const updatedOccasion = await occasion.save();
    // Pause state is cached for a few seconds; drop it so the storefront reacts immediately.
    invalidatePausedIndex();
    res.status(200).json({ success: true, data: updatedOccasion });
});

// @desc    Pause / resume an occasion's products (Admin Only)
// @route   PUT /api/occasions/:id/pause
export const setOccasionPause = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const occasion = await Occasion.findById(req.params.id);
    if (!occasion) {
        return next(new ErrorResponse('Occasion narrative for revision not found.', 404));
    }

    const isPaused = parsePauseInput(req.body?.isPaused);
    if (isPaused === null) {
        return next(new ErrorResponse('isPaused must be true or false.', 400));
    }

    occasion.isPaused = isPaused;
    occasion.pausedAt = isPaused ? new Date() : undefined;
    await occasion.save();
    invalidatePausedIndex();

    res.status(200).json({
        success: true,
        message: isPaused
            ? `"${occasion.name}" is paused. Its products are now hidden from the storefront.`
            : `"${occasion.name}" is live again. Its products are back on the storefront.`,
        data: occasion
    });
});

// @desc    Delete occasion and its subcategories (Admin Only)
// @route   DELETE /api/occasions/:id
export const deleteOccasion = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const occasion = await Occasion.findById(req.params.id);
    if (!occasion) {
        return next(new ErrorResponse('Occasion for removal not found.', 404));
    }
    // Cascade delete: remove any subcategories that reference this occasion as parent
    await Occasion.deleteMany({ parent: occasion._id });
    await occasion.deleteOne();
    res.status(200).json({ success: true, message: 'Occasion and its subcategories removed from registry.' });
});