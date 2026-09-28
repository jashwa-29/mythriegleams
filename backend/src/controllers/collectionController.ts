import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Collection from '../models/Collection';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';
import { getPausedIndex, describeSectionPause, invalidatePausedIndex } from '../services/productVisibilityService';

/** Accepts true/false/"true"/"false"/1/0 from a form or JSON body. */
export const parsePauseInput = (value: unknown): boolean | null => {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    return null;
};

// @desc    Get collections. Paused sections stay listed (their products are hidden instead),
//          but ?all=1 lets an admin also see deactivated ones so they can be reactivated.
// @route    GET /api/collections
export const getCollections = asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.all === 'true' && req.user?.role === 'admin';
    const collections = await Collection.find(includeInactive ? {} : { isActive: true })
        .populate('parent', 'name slug isPaused')
        .sort({ createdAt: 1 });

    // A sub-collection below a paused parent is not sellable either, so the storefront needs the
    // effective state to explain the empty page.
    const index = await getPausedIndex();
    const data = collections.map((col: any) => {
        const reason = describeSectionPause(index, 'collection', col.name);
        return {
            ...col.toObject(),
            isEffectivelyPaused: !!reason,
            pausedBecause: reason ? reason.pausedName : null
        };
    });

    res.status(200).json({ success: true, count: data.length, data });
});

// @desc    Create new collection (Admin Only)
// @route   POST /api/collections
export const createCollection = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { name, slug, description, metaDescription, parent } = req.body;

    // Ensure parent (if given) actually exists and is a string/ObjectId
    let parentId: mongoose.Types.ObjectId | null = null;
    if (parent) {
        if (!mongoose.Types.ObjectId.isValid(parent)) {
            return next(new ErrorResponse('Invalid parent collection reference.', 400));
        }
        const parentCollection = await Collection.findById(parent);
        if (!parentCollection) {
            return next(new ErrorResponse('Parent collection not found.', 404));
        }
        parentId = parentCollection._id as mongoose.Types.ObjectId;
    }

    const collectionData: any = { name, slug, description, metaDescription, parent: parentId };

    if (req.file) {
        collectionData.image = `/uploads/${req.file.filename}`;
    }

    const collection = await Collection.create(collectionData);
    res.status(201).json({ success: true, data: collection });
});

// @desc    Update collection (Admin Only)
// @route   PUT /api/collections/:id
export const updateCollection = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
        return next(new ErrorResponse('Collection narrative for revision not found.', 404));
    }

    const { name, slug, description, metaDescription, parent, isActive, isPaused } = req.body;

    if (name) collection.name = name;
    if (slug) collection.slug = slug;
    if (description !== undefined) collection.description = description;
    if (metaDescription !== undefined) collection.metaDescription = metaDescription;
    if (isActive !== undefined) collection.isActive = isActive === true || isActive === 'true';
    if (isPaused !== undefined) {
        collection.isPaused = isPaused === true || isPaused === 'true';
        collection.pausedAt = collection.isPaused ? new Date() : undefined;
    }

    if (parent !== undefined) {
        if (parent === '' || parent === 'null' || parent === null) {
            collection.parent = null as any;
        } else {
            if (collection._id.toString() === parent) {
                return next(new ErrorResponse('A collection cannot be its own parent.', 400));
            }
            if (!mongoose.Types.ObjectId.isValid(parent)) {
                return next(new ErrorResponse('Invalid parent collection reference.', 400));
            }
            const parentCollection = await Collection.findById(parent);
            if (!parentCollection) {
                return next(new ErrorResponse('Parent collection not found.', 404));
            }
            collection.parent = parentCollection._id as mongoose.Types.ObjectId;
        }
    }

    if (req.file) {
        collection.image = `/uploads/${req.file.filename}`;
    }

    const updatedCollection = await collection.save();
    // Pause state is cached for a few seconds; drop it so the storefront reacts immediately.
    invalidatePausedIndex();
    res.status(200).json({ success: true, data: updatedCollection });
});

// @desc    Pause / resume a collection's products (Admin Only)
// @route   PUT /api/collections/:id/pause
export const setCollectionPause = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
        return next(new ErrorResponse('Collection narrative for revision not found.', 404));
    }

    const isPaused = parsePauseInput(req.body?.isPaused);
    if (isPaused === null) {
        return next(new ErrorResponse('isPaused must be true or false.', 400));
    }

    collection.isPaused = isPaused;
    collection.pausedAt = isPaused ? new Date() : undefined;
    await collection.save();
    invalidatePausedIndex();

    res.status(200).json({
        success: true,
        message: isPaused
            ? `"${collection.name}" is paused. Its products are now hidden from the storefront.`
            : `"${collection.name}" is live again. Its products are back on the storefront.`,
        data: collection
    });
});

// @desc    Delete collection and its subcategories (Admin Only)
// @route   DELETE /api/collections/:id
export const deleteCollection = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
        return next(new ErrorResponse('Collection narrative for removal not found.', 404));
    }
    // Cascade delete: remove any subcategories that reference this collection as parent
    await Collection.deleteMany({ parent: collection._id });
    await collection.deleteOne();
    res.status(200).json({ success: true, message: 'Collection and its subcategories removed from registry.' });
});