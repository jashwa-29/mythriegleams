import { Request, Response, NextFunction } from 'express';
import Cart from '../models/Cart';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

/**
 * @desc   Get the logged-in user's cart
 * @route  GET /api/cart
 * @access Private
 */
export const getCart = asyncHandler(async (req: Request, res: Response) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images price slug');
    res.status(200).json({ success: true, data: cart?.items || [] });
});

/**
 * @desc   Add an item or update quantity in cart
 * @route  POST /api/cart
 * @access Private
 */
export const addToCart = asyncHandler(async (req: Request, res: Response) => {
    const { productId, name, image, price, quantity = 1, selectedVariant = '' } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId && item.selectedVariant === selectedVariant
    );

    if (existingIndex > -1) {
        cart.items[existingIndex].quantity += quantity;
    } else {
        cart.items.push({ product: productId, name, image, price, quantity, selectedVariant });
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
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.status(200).json({ success: true, data: [] });
});
