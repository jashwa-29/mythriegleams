import { Request, Response, NextFunction } from 'express';
import Collection from '../models/Collection';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all active collections
// @route   GET /api/collections
export const getCollections = asyncHandler(async (req: Request, res: Response) => {
    const collections = await Collection.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: collections.length, data: collections });
});

// @desc    Create new collection (Admin Only)
// @route   POST /api/collections
export const createCollection = asyncHandler(async (req: Request, res: Response) => {
    const { name, slug, description, metaDescription } = req.body;
    
    const collectionData: any = { name, slug, description, metaDescription };
    
    if (req.file) {
        collectionData.image = `/uploads/${req.file.filename}`;
    }

    const collection = await Collection.create(collectionData);
    res.status(201).json({ success: true, data: collection });
});

// @desc    Delete collection (Admin Only)
// @route   DELETE /api/collections/:id
export const deleteCollection = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
        return next(new ErrorResponse('Collection narrative for removal not found.', 404));
    }
    await collection.deleteOne();
    res.status(200).json({ success: true, message: 'Collection removed from registry.' });
});
