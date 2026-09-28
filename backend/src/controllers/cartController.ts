import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Cart from '../models/Cart';
import Product from '../models/Product';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';
import { getPausedIndex, findPauseMatch, describePause } from '../services/productVisibilityService';

/**
 * @desc   Get the logged-in user's cart
 * @route  GET /api/cart
 * @access Private
 */
export const getCart = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        return res.status(401).json({ success: false, error: 'User session not found or expired. Please sign in.' });
    }
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
        return res.status(200).json({ success: true, data: [], removed: [] });
    }

    // A design can be paused after it was added, so the stored bag is cleaned on read: paused
    // products are dropped instead of being shown and then rejected at checkout.
    const index = await getPausedIndex();
    if (index.collectionNames.size === 0 && index.occasionNames.size === 0) {
        return res.status(200).json({ success: true, data: cart.items, removed: [] });
    }

    const ids = cart.items
        .map((item) => (item.product as any)?._id ? String((item.product as any)._id) : String(item.product))
        .filter((id) => mongoose.Types.ObjectId.isValid(id));
    const products = await Product.find({ _id: { $in: ids } })
        .select('category categories subcategory subcategories occasion occasions occasionSub occasionSubs')
        .lean();
    const byId = new Map(products.map((p: any) => [String(p._id), p]));

    const kept: typeof cart.items = [];
    const removed: { name: string; reason: string }[] = [];
    for (const item of cart.items) {
        const id = (item.product as any)?._id ? String((item.product as any)._id) : String(item.product);
        const product = byId.get(id);
        const pause = product ? findPauseMatch(product, index) : null;
        if (pause) {
            removed.push({ name: item.name, reason: describePause(pause) });
        } else {
            kept.push(item);
        }
    }

    if (removed.length > 0) {
        cart.items = kept;
        await cart.save();
    }

    res.status(200).json({ success: true, data: cart.items, removed });
});

/**
 * @desc   Add an item or update quantity in cart
 * @route  POST /api/cart
 * @access Private
 */
export const addToCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?._id) {
        return res.status(401).json({ success: false, error: 'User session not found or expired. Please sign in.' });
    }
    const { productId, name, image, price, weight = 0, quantity = 1, selectedVariant = '', selectedColor = '', customerImage = '' } = req.body;

    // A paused product must never enter a cart: the storefront hides it, and the money path
    // refuses it too, so a stale page or a crafted request cannot buy a paused design.
    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorResponse('This design is no longer available.', 404));
    }
    const pause = findPauseMatch(product, await getPausedIndex());
    if (pause) {
        return next(new ErrorResponse(`This design is ${describePause(pause)} and cannot be added to your bag.`, 409));
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
        (item) =>
            (typeof item.product === 'object' && (item.product as any)?._id ? (item.product as any)._id.toString() : item.product?.toString()) === productId &&
            item.selectedVariant === selectedVariant &&
            item.selectedColor === selectedColor
    );

    if (existingIndex > -1) {
        cart.items[existingIndex].quantity += quantity;
        if (customerImage) cart.items[existingIndex].customerImage = customerImage;
    } else {
        cart.items.push({ product: productId, name, image, price, weight, quantity, selectedVariant, selectedColor, customerImage });
    }

    await cart.save();
    res.status(200).json({ success: true, data: cart.items });
});

/**
 * @desc   Update quantity of a cart item
 * @route  PUT /api/cart/:itemId
 * @access Private
 */
export const updateCartItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?._id) {
        return res.status(401).json({ success: false, error: 'User session not found or expired. Please sign in.' });
    }
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return next(new ErrorResponse('Cart not found in the archives.', 404));

    const item = cart.items.find((i) => i._id?.toString() === req.params.itemId);
    if (!item) return next(new ErrorResponse('Artisanal item not found in cart.', 404));

    if (quantity <= 0) {
        cart.items = cart.items.filter((i) => i._id?.toString() !== req.params.itemId) as any;
    } else {
        item.quantity = quantity;
    }

    await cart.save();
    res.status(200).json({ success: true, data: cart.items });
});

/**
 * @desc   Remove an item from the cart
 * @route  DELETE /api/cart/:itemId
 * @access Private
 */
export const removeFromCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?._id) {
        return res.status(401).json({ success: false, error: 'User session not found or expired. Please sign in.' });
    }
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return next(new ErrorResponse('Cart not found.', 404));

    cart.items = cart.items.filter((i) => i._id?.toString() !== req.params.itemId) as any;
    await cart.save();
    res.status(200).json({ success: true, data: cart.items });
});

/**
 * @desc   Clear the cart
 * @route  DELETE /api/cart
 * @access Private
 */
export const clearCart = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        return res.status(401).json({ success: false, error: 'User session not found or expired. Please sign in.' });
    }
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.status(200).json({ success: true, data: [] });
});
