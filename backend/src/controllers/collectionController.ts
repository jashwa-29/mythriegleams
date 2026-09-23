import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Collection from '../models/Collection';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all active collections (top-level and subcategories)
// @route   GET /api/collections
export const getCollections = asyncHandler(async (req: Request, res: Response) => {
    const collections = await Collection.find({ isActive: true })
        .populate('parent', 'name slug')
        .sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: collections.length, data: collections });
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

    const { name, slug, description, metaDescription, parent, isActive } = req.body;

    if (name) collection.name = name;
    if (slug) collection.slug = slug;
    if (description !== undefined) collection.description = description;
    if (metaDescription !== undefined) collection.metaDescription = metaDescription;
    if (isActive !== undefined) collection.isActive = isActive === true || isActive === 'true';

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
    res.status(200).json({ success: true, data: updatedCollection });
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