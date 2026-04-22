import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Order from '../models/Order';
import generateToken from '../utils/generateToken';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user._id);
    if (user) {
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                addresses: user.addresses,
                marketingConsent: user.marketingConsent
            }
        });
    } else {
        return next(new ErrorResponse('Identity narrative not found.', 404));
    }
});

/**
 * @desc    Registrar a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        return next(new ErrorResponse('This narrative already exists. User already exists.', 400));
    }

    const user = await User.create({ name, email, password });

    if (user) {
        res.status(201).json({
            success: true,
            token: generateToken(user._id.toString(), user.role),
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } else {
        return next(new ErrorResponse('Failed to draft user registry entry.', 400));
    }
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (user && (await (user as any).matchPassword(password))) {
        res.status(200).json({
            success: true,
            token: generateToken(user._id.toString(), user.role),
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } else {
        return next(new ErrorResponse('Invalid credentials provided to the archive.', 401));
    }
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        if (req.body.phone) user.phone = req.body.phone;
        if (req.body.addresses) user.addresses = req.body.addresses;

        const updatedUser = await user.save();

        res.status(200).json({
            success: true,
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                addresses: updatedUser.addresses
            }
        });
    } else {
        return next(new ErrorResponse('Profile for update not found.', 404));
    }
});

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    
    // Count orders for each user fast
    const ordersCount = await Order.aggregate([
        { $group: { _id: "$user", count: { $sum: 1 } } }
    ]);
    
    const data = users.map(user => {
        const userOrders = ordersCount.find(o => String(o._id) === String(user._id));
        return {
            ...user,
            orderCount: userOrders ? userOrders.count : 0
        };
    });

    res.status(200).json({ success: true, count: data.length, data });
});
