import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Occasion from '../models/Occasion';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all active occasions (top-level and subcategories)
// @route   GET /api/occasions
export const getOccasions = asyncHandler(async (req: Request, res: Response) => {
    const occasions = await Occasion.find({ isActive: true })
        .populate('parent', 'name slug')
        .sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: occasions.length, data: occasions });
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

    const { name, slug, description, metaDescription, parent, isActive } = req.body;

    if (name) occasion.name = name;
    if (slug) occasion.slug = slug;
    if (description !== undefined) occasion.description = description;
    if (metaDescription !== undefined) occasion.metaDescription = metaDescription;
    if (isActive !== undefined) occasion.isActive = isActive === true || isActive === 'true';

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
    res.status(200).json({ success: true, data: updatedOccasion });
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