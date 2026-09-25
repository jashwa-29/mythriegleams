import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

// Helper to normalize array input (stringified JSON, comma-separated string, or array)
const parseArrayField = (input: any): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input.map((s: any) => String(s).trim()).filter(Boolean);
    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed.map((s: any) => String(s).trim()).filter(Boolean);
            } catch (e) {
                // Ignore and fallback
            }
        }
        return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
};

// @desc    Get all products (with optional filtering)
// @route   GET /api/products
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const { category, subcategory, occasion, occasionSub, sort, search } = req.query;
    let query: any = {};

    if (category) {
        query.$or = query.$or || [];
        query.$or.push(
            { category: category },
            { categories: category }
        );
    }
    if (subcategory) {
        query.$or = query.$or || [];
        query.$or.push(
            { subcategory: subcategory },
            { subcategories: subcategory }
        );
    }
    if (occasion) {
        query.$or = query.$or || [];
        query.$or.push(
            { occasion: occasion },
            { occasions: occasion }
        );
    }
    if (occasionSub) {
        query.$or = query.$or || [];
        query.$or.push(
            { occasionSub: occasionSub },
            { occasionSubs: occasionSub }
        );
    }
    if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        const searchConditions = [
            { name: searchRegex },
            { story: searchRegex },
            { details: searchRegex },
            { category: searchRegex },
            { categories: searchRegex },
            { occasion: searchRegex },
            { occasions: searchRegex }
        ];
        if (query.$or) {
            query.$and = [
                { $or: query.$or },
                { $or: searchConditions }
            ];
            delete query.$or;
        } else {
            query.$or = searchConditions;
        }
    }

    let products = Product.find(query);

    // Sophisticated Sorting
    if (sort === 'price-low' || sort === 'price-asc') products = products.sort({ price: 1 });
    if (sort === 'price-high' || sort === 'price-desc') products = products.sort({ price: -1 });
    if (sort === 'rating') products = products.sort({ rating: -1 });
    if (sort === 'newest') products = products.sort({ createdAt: -1 });

    const data = await products.lean();
    res.status(200).json({ success: true, count: data.length, data });
});

// @desc    Get single product by slug
// @route   GET /api/products/:slug
export const getProductBySlug = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findOne({ slug: req.params.slug as string });
    if (!product) {
        return next(new ErrorResponse('Product narrative not found in the archives.', 404));
    }
    res.status(200).json({ success: true, data: product });
});

// @desc    Create product (Admin only)
// @route   POST /api/products
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const { 
        name, 
        slug, 
        category, 
        categories,
        subcategory, 
        subcategories,
        occasion, 
        occasions,
        occasionSub, 
        occasionSubs,
        price, 
        mrp, 
        weight,
        story, 
        details, 
        metaDescription,
        stockStatus,
        requiresImage,
        variants // JSON string because it's FormData
    } = req.body;

    const parsedCategories = parseArrayField(categories);
    const parsedSubcategories = parseArrayField(subcategories);
    const parsedOccasions = parseArrayField(occasions);
    const parsedOccasionSubs = parseArrayField(occasionSubs);

    // Ensure category & categories are consistent
    const primaryCategory = category || (parsedCategories.length > 0 ? parsedCategories[0] : '');
    const allCategories = Array.from(new Set([primaryCategory, ...parsedCategories].filter(Boolean)));

    const primarySubcategory = subcategory || (parsedSubcategories.length > 0 ? parsedSubcategories[0] : '');
    const allSubcategories = Array.from(new Set([primarySubcategory, ...parsedSubcategories].filter(Boolean)));

    const primaryOccasion = occasion || (parsedOccasions.length > 0 ? parsedOccasions[0] : '');
    const allOccasions = Array.from(new Set([primaryOccasion, ...parsedOccasions].filter(Boolean)));

    const primaryOccasionSub = occasionSub || (parsedOccasionSubs.length > 0 ? parsedOccasionSubs[0] : '');
    const allOccasionSubs = Array.from(new Set([primaryOccasionSub, ...parsedOccasionSubs].filter(Boolean)));
    
    const productData: any = {
        name,
        slug,
        category: primaryCategory,
        categories: allCategories,
        subcategory: primarySubcategory,
        subcategories: allSubcategories,
        occasion: primaryOccasion,
        occasions: allOccasions,
        occasionSub: primaryOccasionSub,
        occasionSubs: allOccasionSubs,
        price: Number(price),
        mrp: Number(mrp || 0),
        weight: Number(weight || 0),
        story,
        details,
        metaDescription,
        stockStatus: stockStatus || 'made-to-order',
        requiresImage: requiresImage === true || requiresImage === 'true'
    };

    // Parse variants if provided as string
    if (variants) {
        try {
            productData.variants = JSON.parse(variants);
        } catch (e) {
            // fallback to default size variants
            productData.variants = [{ type: 'Size', options: ['Small (6 inch)', 'Medium (8 inch)', 'Large (10 inch)'] }];
        }
    } else {
        productData.variants = [{ type: 'Size', options: ['Small (6 inch)', 'Medium (8 inch)', 'Large (10 inch)'] }];
    }

    // Handle images if uploaded via Multer
    if (req.files && (req.files as any[]).length > 0) {
        productData.images = (req.files as any[]).map(file => `/uploads/${file.filename}`);
    }

    const product = await Product.create(productData);
    res.status(201).json({ success: true, data: product });
});

// @desc    Delete product (Admin only)
// @route   DELETE /api/products/:id
export const deleteProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorResponse('Product for destruction not found.', 404));
    }
    await product.deleteOne();
    res.status(200).json({ success: true, message: 'Registry updated. Product removed.' });
});

// @desc    Update product (Admin only)
// @route   PUT /api/products/:id
export const updateProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorResponse('Product for revision not found.', 404));
    }

    const { 
        name, 
        slug, 
        category, 
        categories,
        subcategory, 
        subcategories,
        occasion, 
        occasions,
        occasionSub, 
        occasionSubs,
        price, 
        mrp, 
        weight, 
        story, 
        details, 
        metaDescription, 
        stockStatus, 
        requiresImage, 
        variants, 
        existingImages 
    } = req.body;
    
    product.name = name || product.name;
    product.slug = slug || product.slug;
    
    // Multiple collections / categories logic
    if (categories !== undefined || category !== undefined) {
        const parsedCategories = categories !== undefined ? parseArrayField(categories) : (product.categories || []);
        const primaryCat = category !== undefined ? category : (parsedCategories[0] || product.category);
        const allCats = Array.from(new Set([primaryCat, ...parsedCategories].filter(Boolean)));
        product.category = primaryCat;
        product.categories = allCats;
    }

    // Multiple subcategories logic
    if (subcategories !== undefined || subcategory !== undefined) {
        const parsedSubs = subcategories !== undefined ? parseArrayField(subcategories) : (product.subcategories || []);
        const primarySub = subcategory !== undefined ? subcategory : (parsedSubs[0] || product.subcategory || '');
        const allSubs = Array.from(new Set([primarySub, ...parsedSubs].filter(Boolean)));
        product.subcategory = primarySub;
        product.subcategories = allSubs;
    }

    // Multiple occasions logic
    if (occasions !== undefined || occasion !== undefined) {
        const parsedOccasions = occasions !== undefined ? parseArrayField(occasions) : (product.occasions || []);
        const primaryOcc = occasion !== undefined ? occasion : (parsedOccasions[0] || product.occasion || '');
        const allOccs = Array.from(new Set([primaryOcc, ...parsedOccasions].filter(Boolean)));
        product.occasion = primaryOcc;
        product.occasions = allOccs;
    }

    // Multiple occasion subcategories logic
    if (occasionSubs !== undefined || occasionSub !== undefined) {
        const parsedOccSubs = occasionSubs !== undefined ? parseArrayField(occasionSubs) : (product.occasionSubs || []);
        const primaryOccSub = occasionSub !== undefined ? occasionSub : (parsedOccSubs[0] || product.occasionSub || '');
        const allOccSubs = Array.from(new Set([primaryOccSub, ...parsedOccSubs].filter(Boolean)));
        product.occasionSub = primaryOccSub;
        product.occasionSubs = allOccSubs;
    }

    product.price = price ? Number(price) : product.price;
    product.mrp = mrp ? Number(mrp) : product.mrp;
    if (weight !== undefined) product.weight = Number(weight) || 0;
    product.story = story || product.story;
    product.details = details || product.details;
    product.metaDescription = metaDescription || product.metaDescription;
    product.stockStatus = stockStatus || product.stockStatus;
    product.requiresImage = requiresImage === true || requiresImage === 'true';

    if (variants) {
        try {
            product.variants = JSON.parse(variants);
        } catch (e) {
            console.error("Variants parse error", e);
        }
    }

    // Handle images update logic
    let finalImages: string[] = [];
    
    if (existingImages) {
        try {
            finalImages = JSON.parse(existingImages);
        } catch (e) {
            console.error("Existing images parse error", e);
        }
    } else if (req.body.existingImages !== undefined) {
        // It was sent but was empty
        finalImages = [];
    } else {
        // Backward compatibility
        finalImages = product.images;
    }

    // Append new images if uploaded
    if (req.files && (req.files as any[]).length > 0) {
        const newImages = (req.files as any[]).map(file => `/uploads/${file.filename}`);
        finalImages = [...finalImages, ...newImages];
    }

    product.images = finalImages;

    const updatedProduct = await product.save();
    res.status(200).json({ success: true, data: updatedProduct });
});
