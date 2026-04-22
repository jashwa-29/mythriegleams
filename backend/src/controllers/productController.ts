import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all products (with optional filtering)
// @route   GET /api/products
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const { category, sort, search } = req.query;
    let query: any = {};

    if (category) query.category = category;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { story: { $regex: search, $options: 'i' } },
            { details: { $regex: search, $options: 'i' } }
        ];
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
        price, 
        mrp, 
        story, 
        details, 
        metaDescription,
        stockStatus,
        variants // JSON string because it's FormData
    } = req.body;
    
    const productData: any = {
        name,
        slug,
        category,
        price: Number(price),
        mrp: Number(mrp || 0),
        story,
        details,
        metaDescription,
        stockStatus: stockStatus || 'made-to-order'
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

    const { name, slug, category, price, mrp, story, details, metaDescription, stockStatus, variants, existingImages } = req.body;
    
    product.name = name || product.name;
    product.slug = slug || product.slug;
    product.category = category || product.category;
    product.price = price ? Number(price) : product.price;
    product.mrp = mrp ? Number(mrp) : product.mrp;
    product.story = story || product.story;
    product.details = details || product.details;
    product.metaDescription = metaDescription || product.metaDescription;
    product.stockStatus = stockStatus || product.stockStatus;

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
