# Mythris Gleams E-commerce Full Stack Codebase

## File: `backend/.env`

```
# Environment Variables
NODE_ENV=production
PORT=5010
MONGO_URI=mongodb://localhost:27017/mythris_gleams
JWT_SECRET=your_jwt_secret_change_this_for_production
CLIENT_URL=http://localhost:3000,https://mythrisgleams.com,https://www.mythrisgleams.com

# Email Config (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=jashwa4673@gmail.com
EMAIL_PASS=bqunmxldtahpndde
EMAIL_FROM=Mythris Gleams <noreply@mythrisgleams.com>


# Razorpay Keys
RAZORPAY_KEY_ID="rzp_live_ShbzVUWfxBnc97"
RAZORPAY_KEY_SECRET="BNxx3vvoHTQcBQ7xb2KjQs7H"
```

## File: `backend/package.json`

```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "Mythris Gleams E-commerce Backend",
  "main": "dist/server.js",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "seed": "tsx src/seeder.ts",
    "seed:destroy": "tsx src/seeder.ts -d",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.3.2",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.13",
    "razorpay": "^2.9.6"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/morgan": "^1.9.10",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.12.7",
    "@types/nodemailer": "^6.4.15",
    "ts-node-dev": "^2.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.4.5"
  }
}

```

## File: `backend/src/app.ts`

```typescript
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load Env
dotenv.config();

const app: Application = express();

// Middlewares
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : '*', // Restrict to front-end in prod
    credentials: true
}));
app.use(morgan('dev')); // Logger
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));

// Import Routes
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import inquiryRoutes from './routes/inquiryRoutes';
import userRoutes from './routes/userRoutes';
import collectionRoutes from './routes/collectionRoutes';
import cartRoutes from './routes/cartRoutes';
import paymentRoutes from './routes/paymentRoutes';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);

// Static Uploads Folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'Mythris Gleams Backend is healthy' });
});

// 404 Handler
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ success: false, message: 'Resource not found' });
});

// Central Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error] ${err.name || typeof err}: ${err.message || err}`);
    if (err.stack) console.error(err.stack);

    let message = err.message || 'Internal Server Error';
    let statusCode = err.statusCode || 500;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        message = `Resource not found with id of ${err.value}`;
        statusCode = 404;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        message = 'Duplicate field value entered';
        statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        message = Object.values(err.errors).map((val: any) => val.message).join(', ');
        statusCode = 400;
    }

    // Multer / string errors (e.g. file type rejection)
    if (typeof err === 'string') {
        message = err;
        statusCode = 400;
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

export default app;

```

## File: `backend/src/config/db.ts`

```typescript
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mythris_gleams';
        const conn = await mongoose.connect(mongoURI);
        console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`❌ DB Connection Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;

```

## File: `backend/src/controllers/authController.ts`

```typescript
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

```

## File: `backend/src/controllers/cartController.ts`

```typescript
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
    const { productId, name, image, price, quantity = 1, selectedVariant = '', selectedColor = '', customerImage = '' } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
        (item) =>
            item.product.toString() === productId &&
            item.selectedVariant === selectedVariant &&
            item.selectedColor === selectedColor
    );

    if (existingIndex > -1) {
        cart.items[existingIndex].quantity += quantity;
        if (customerImage) cart.items[existingIndex].customerImage = customerImage;
    } else {
        cart.items.push({ product: productId, name, image, price, quantity, selectedVariant, selectedColor, customerImage });
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

```

## File: `backend/src/controllers/collectionController.ts`

```typescript
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

```

## File: `backend/src/controllers/inquiryController.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import Inquiry from '../models/Inquiry';
import sendEmail from '../utils/sendEmail';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

/**
 * @desc    Submit a new inquiry (Custom/Bulk/Contact)
 * @route   POST /api/inquiries
 * @access  Public
 */
export const createInquiry = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { type, name, email, phone, subject, message, productRef } = req.body;

    const inquiryData: any = {
        type, name, email, phone, subject, message, productRef
    };

    // If file was uploaded via Multer
    if (req.file) {
        inquiryData.image = `/uploads/${req.file.filename}`;
    }

    const inquiry = await Inquiry.create(inquiryData);

    // Send confirmation email
    try {
        await sendEmail({
            email,
            subject: `Inquiry Received - #${inquiry._id}`,
            message: `Hi ${name}! We've received your ${type} design inquiry. We'll get back to you within 24–48 hours.`,
            html: `<h1>Inquiry Received! 🚀</h1><p>Your ${type} design request <strong>#${inquiry._id}</strong> has been received perfectly.</p>`
        });

        // Email Alert to Admin
        await sendEmail({
            email: process.env.ADMIN_EMAIL || 'admin@mythrisgleams.com',
            subject: `📦 NEW INQUIRY: ${type} from ${name}`,
            message: `Inquiry #${inquiry._id} - ${subject}. Check the admin dashboard for details.`
        });
    } catch (emailError) {
        console.error('Email service unavailable for inquiry:', emailError);
    }

    res.status(201).json({ success: true, data: inquiry });
});

/**
 * @desc    Get all inquiries (Admin)
 * @route   GET /api/inquiries
 * @access  Private/Admin
 */
export const getInquiries = asyncHandler(async (req: Request, res: Response) => {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: inquiries });
});

/**
 * @desc    Update inquiry status (Admin)
 * @route   PUT /api/inquiries/:id/status
 * @access  Private/Admin
 */
export const updateInquiryStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
        return next(new ErrorResponse('Inquiry for status revision not found.', 404));
    }

    inquiry.status = req.body.status || inquiry.status;
    const updatedInquiry = await inquiry.save();

    res.status(200).json({ success: true, data: updatedInquiry });
});

/**
 * @desc    Delete an inquiry (Admin)
 * @route   DELETE /api/inquiries/:id
 * @access  Private/Admin
 */
export const deleteInquiry = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
        return next(new ErrorResponse('Inquiry not found for deletion.', 404));
    }

    await inquiry.deleteOne();

    res.status(200).json({ success: true, message: 'Inquiry narrative removed from registry.' });
});

```

## File: `backend/src/controllers/orderController.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import sendEmail from '../utils/sendEmail';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Public (Guest/User)
 */
export const addOrderItems = asyncHandler(async (req: Request, res: Response) => {
    const { orderItems, shippingAddress, totalPrice, isPaid } = req.body;

    if (!orderItems || orderItems.length === 0) {
        throw new ErrorResponse('Registry Forge requires artisanal components to proceed (No order items).', 400);
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.email) {
        throw new ErrorResponse('Fulfillment Narrative incomplete. Destination details (street/email) missing.', 400);
    }

    const order = new Order({
        user: req.user?._id, // Add if logged in
        orderItems,
        shippingAddress,
        totalPrice,
        isPaid: isPaid || false // Default to unpaid unless validated
    });

    const createdOrder = await order.save();
    res.status(201).json({ success: true, data: createdOrder });
});

/**
 * @desc    Get order by ID (Tracking)
 * @route   GET /api/orders/:id
 * @access  Public / Mixed (Secure)
 */
export const getOrderById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
        return next(new ErrorResponse('Artisanal Trace lost. Order not found.', 404));
    }

    // Security check: Only owner, admin, or the guest who placed it (by email match if we had it) can see full details.
    const isOwner = order.user && req.user && order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (order.user && !isOwner && !isAdmin) {
        return next(new ErrorResponse('Unauthorized access to this order narrative.', 401));
    }

    res.status(200).json({ success: true, data: order });
});

/**
 * @desc    Update order status (Admin)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const order: any = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse('Order for status revision not found.', 404));
    }

    const oldStatus = order.status;
    order.status = req.body.status;
    if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;
    if (req.body.deliveryNote) order.deliveryNote = req.body.deliveryNote;

    const updatedOrder = await order.save();

    // Send status update email to user
    if (oldStatus !== order.status) {
        try {
            await sendEmail({
                email: order.shippingAddress.email || order.user?.email || 'customer@example.com',
                subject: `Order Status Update: ${order.status}`,
                message: `Your order #${order._id} status has been changed to: ${order.status}.`,
                html: `
                    <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; padding: 40px; border-radius: 16px;">
                        <h2 style="color: #111827; margin-bottom: 20px;">Order Status Update</h2>
                        <p>Hello,</p>
                        <p>We are writing to inform you that your order <strong>#${order._id}</strong> lifecycle status has been updated.</p>
                        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
                            <p style="margin: 0; font-size: 16px;">Current Status: <strong style="color: #059669; text-transform: uppercase;">${order.status}</strong></p>
                            ${order.trackingNumber ? `<p style="margin: 10px 0 0 0; font-size: 14px;">Tracking Number: <strong>${order.trackingNumber}</strong></p>` : ''}
                            ${order.deliveryNote ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #4b5563; font-style: italic;">Delivery Note: ${order.deliveryNote}</p>` : ''}
                        </div>
                        <p>Thank you for choosing MythrieGleams.</p>
                    </div>
                `
            });
        } catch (emailError: any) {
            console.error('Email sending failed during status update. Error:', emailError.message);
        }
    }

    res.status(200).json({ success: true, data: updatedOrder });
});

/**
 * @desc    Get logged-in user's orders
 * @route   GET /api/orders/mine
 * @access  Private
 */
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
    const orders = await Order.find({ user: req.user._id, isPaid: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
});

/**
 * @desc    Get all orders (Admin only)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
    const { includeUnpaid } = req.query;
    const filter = includeUnpaid === 'true' ? {} : { isPaid: true };
    
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
});

```

## File: `backend/src/controllers/paymentController.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order';
import sendEmail from '../utils/sendEmail';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID as string,
        key_secret: process.env.RAZORPAY_KEY_SECRET as string,
    });
};

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/payment/razorpay/create
 * @access  Public (Guest/User)
 */
export const createRazorpayOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { orderId } = req.body; // Our internal MongoDB order ID

    const order = await Order.findById(orderId);
    if (!order) {
        return next(new ErrorResponse('Internal Order not found for payment initialization.', 404));
    }

    // Amount in paise
    const amountInPaise = Math.round(order.totalPrice * 100);

    const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_order_${orderId}`,
    };

    const rzp = getRazorpayInstance();
    const rzpOrder = await rzp.orders.create(options);

    if (!rzpOrder) {
        return next(new ErrorResponse('Failed to draft Razorpay payment narrative.', 500));
    }

    // Update our MongoDB order with the Razorpay order ID
    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    res.status(200).json({
        success: true,
        data: {
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            key: process.env.RAZORPAY_KEY_ID // Send key to frontend for initialization
        }
    });
});

/**
 * @desc    Verify Razorpay Payment
 * @route   POST /api/payment/razorpay/verify
 * @access  Public (Guest/User)
 */
export const verifyRazorpayPayment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { internalOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        // Find our order and update it
        const order: any = await Order.findById(internalOrderId).populate('user', 'name email');
        if (order) {
            order.isPaid = true;
            order.paidAt = new Date();
            order.razorpayPaymentId = razorpay_payment_id;
            order.razorpaySignature = razorpay_signature;
            order.status = 'Handcrafting'; // Start the process automatically upon payment
            await order.save();

            // Send Confirmation Emails
            try {
                // To Customer
                await sendEmail({
                    email: order.shippingAddress.email || order.user?.email || 'customer@example.com',
                    subject: `Order Confirmed! Your MythrieGleams Journey Begins - #${order._id}`,
                    message: `Hi! We've received your payment for order #${order._id}. We're already handcrafting your artisanal pieces!`,
                    html: `
                        <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;">
                            <h1 style="color: #000; font-style: italic;">Payment Confirmed! ✨</h1>
                            <p>Thank you for choosing MythrieGleams. This is to confirm that your order <strong>#${order._id}</strong> has been successfully placed and is now proceeding to our <strong>Handcrafting</strong> stage.</p>
                            <p>We will keep you updated on your order's lifecycle.</p>
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                                <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 2px;">Order Summary</p>
                                <p style="font-size: 14px;"><strong>Order ID:</strong> ${order._id}</p>
                                <p style="font-size: 14px;"><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
                                <p style="font-size: 14px;"><strong>Total Paid:</strong> ₹${order.totalPrice}</p>
                            </div>
                        </div>
                    `
                });

                // To Admin
                await sendEmail({
                    email: process.env.ADMIN_EMAIL || 'admin@mythrisgleams.com',
                    subject: `💰 NEW PAID ORDER: #${order._id}`,
                    message: `Payment verified for order #${order._id}. Amount: ₹${order.totalPrice}. Status updated to Handcrafting.`,
                    html: `<h2>New Sale! 💰</h2><p>Order <strong>#${order._id}</strong> has been paid and is ready for fulfillment.</p><p>Customer: ${order.shippingAddress.name} (${order.shippingAddress.email})</p>`
                });
            } catch (emailError: any) {
                console.error('Email sending failed after payment verification. Error:', emailError.message);
            }
            
            return res.status(200).json({ success: true, message: 'Payment verified and registry updated.' });
        } else {
             return next(new ErrorResponse('Internal Order narrative lost during verification.', 404));
        }
    } else {
        return next(new ErrorResponse('Invalid signature detected. Payment narrative rejected.', 400));
    }
});

```

## File: `backend/src/controllers/productController.ts`

```typescript
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
        requiresImage,
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

    const { name, slug, category, price, mrp, story, details, metaDescription, stockStatus, requiresImage, variants, existingImages } = req.body;
    
    product.name = name || product.name;
    product.slug = slug || product.slug;
    product.category = category || product.category;
    product.price = price ? Number(price) : product.price;
    product.mrp = mrp ? Number(mrp) : product.mrp;
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

```

## File: `backend/src/middlewares/asyncHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;

```

## File: `backend/src/middlewares/authMiddleware.ts`

```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            
            // Add user info to request (excluding password)
            req.user = await User.findById(decoded.id).select('-password');
            return next();
        } catch (error) {
            return res.status(401).json({ success: false, error: 'Authorization signature mismatch or artifact expired.' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Authorization token not found in request headers.' });
    }
};

/**
 * Optional Authentication: Populates req.user if token is present, 
 * but does not reject the request if no token is provided.
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Silently fail authentication for optional auth
            console.log("Optional Auth failed, continuing as guest");
        }
    }
    next();
};

export const admin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ success: false, error: 'Access denied. Administrator credentials required.' });
    }
};

// Update global express namespace to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

```

## File: `backend/src/middlewares/uploadMiddleware.ts`

```typescript
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

function checkFileType(file: Express.Multer.File, cb: multer.FileFilterCallback) {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }
    cb(new Error('Images Only!'));
}

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
});

export default upload;

```

## File: `backend/src/models/Cart.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
    _id?: mongoose.Types.ObjectId;
    product: mongoose.Types.ObjectId;
    name: string;
    image: string;
    price: number;
    quantity: number;
    selectedVariant?: string;
    selectedColor?: string;
    customerImage?: string;
}

export interface ICart extends Document {
    user: mongoose.Types.ObjectId;
    items: ICartItem[];
    updatedAt: Date;
}

const CartItemSchema = new Schema({
    product:         { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name:            { type: String, required: true },
    image:           { type: String, default: '' },
    price:           { type: Number, required: true },
    quantity:        { type: Number, required: true, min: 1, default: 1 },
    selectedVariant: { type: String, default: '' },
    selectedColor:   { type: String, default: '' },
    customerImage:   { type: String, default: '' },
});

const CartSchema: Schema = new Schema({
    user:  { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [CartItemSchema],
}, { timestamps: true });

export default mongoose.model<ICart>('Cart', CartSchema);

```

## File: `backend/src/models/Collection.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ICollection extends Document {
    name: string;
    slug: string;
    description?: string;
    metaDescription?: string; // SEO optimization
    image?: string;
    isActive: boolean;
    createdAt: Date;
}

const CollectionSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    metaDescription: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

export default mongoose.model<ICollection>('Collection', CollectionSchema);

```

## File: `backend/src/models/Inquiry.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
    type: 'custom' | 'bulk' | 'contact';
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    image?: string; // Captured via Multer
    productRef?: mongoose.Types.ObjectId;
    status: 'new' | 'responded' | 'closed';
    createdAt: Date;
}

const InquirySchema: Schema = new Schema({
    type: { type: String, enum: ['custom', 'bulk', 'contact'], required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    image: { type: String }, // Path to uploaded reference design
    productRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    status: { type: String, enum: ['new', 'responded', 'closed'], default: 'new' }
}, {
    timestamps: true
});

export default mongoose.model<IInquiry>('Inquiry', InquirySchema);

```

## File: `backend/src/models/Order.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    user?: mongoose.Types.ObjectId;
    orderItems: {
        name: string;
        qty: number;
        image: string;
        price: number;
        product: mongoose.Types.ObjectId;
        selectedVariant?: string;
        selectedColor?: string;
        customerImage?: string;
    }[];
    shippingAddress: {
        label?: string;
        name: string; // The Recipient
        email: string; // Dispatch Notification Destination
        street: string;
        city: string;
        state: string;
        zip: string;
        phone: string;
    };
    totalPrice: number;
    isPaid: boolean;
    paidAt?: Date;
    status: 'Pending' | 'Handcrafting' | 'Quality Check' | 'Dispatched' | 'Delivered' | 'Cancelled';
    trackingNumber?: string;
    deliveryNote?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    createdAt: Date;
}

const OrderSchema: Schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for guest checkout
    orderItems: [{
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        selectedVariant: { type: String, default: '' },
        selectedColor: { type: String, default: '' },
        customerImage: { type: String, default: '' }
    }],
    shippingAddress: {
        label: { type: String, default: 'Home' },
        name: { type: String, required: true },
        email: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true },
        phone: { type: String, required: true }
    },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Handcrafting', 'Quality Check', 'Dispatched', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    trackingNumber: { type: String },
    deliveryNote: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<IOrder>('Order', OrderSchema);

```

## File: `backend/src/models/Product.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    slug: string;
    category: string;
    price: number;
    mrp: number; // For discount calculation
    story: string; // The inspiration
    details: string; // The technical specs
    metaDescription?: string; // SEO optimization
    images: string[];
    variants: {
        type: string;
        options: string[];
    }[];
    stockStatus: string;
    requiresImage: boolean;
    createdAt: Date;
}

const ProductSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    mrp: { type: Number, default: 0 },
    story: { type: String, required: true },
    details: { type: String, required: true },
    metaDescription: { type: String },
    images: [{ type: String }],
    variants: [{
        type: { type: String, default: 'Size' },
        options: [{ type: String }]
    }],
    stockStatus: { 
        type: String, 
        enum: ['in-stock', 'out-of-stock', 'made-to-order'], 
        default: 'made-to-order' 
    },
    requiresImage: { type: Boolean, default: false }
}, {
    timestamps: true
});

export default mongoose.model<IProduct>('Product', ProductSchema);

```

## File: `backend/src/models/User.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'user' | 'admin';
    phone?: string;
    marketingConsent: boolean;
    addresses: {
        label: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        isDefault: boolean;
    }[];
    matchPassword: (enteredPassword: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, select: false }, // Don't return password by default
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    phone: { type: String },
    marketingConsent: { type: Boolean, default: true },
    addresses: [{
        label: { type: String, default: 'Home' }, // Home, Office, etc.
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zip: { type: String },
        isDefault: { type: Boolean, default: false }
    }]
}, {
    timestamps: true
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
});

// Compare password
UserSchema.methods.matchPassword = async function(enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);

```

## File: `backend/src/routes/authRoutes.ts`

```typescript
import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/authController';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;

```

## File: `backend/src/routes/cartRoutes.ts`

```typescript
import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cartController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect); // All cart routes require a valid JWT

router.route('/')
    .get(getCart)
    .post(addToCart)
    .delete(clearCart);

router.route('/:itemId')
    .put(updateCartItem)
    .delete(removeFromCart);

export default router;

```

## File: `backend/src/routes/collectionRoutes.ts`

```typescript
import { Router } from 'express';
import { getCollections, createCollection, deleteCollection } from '../controllers/collectionController';
import { protect, admin } from '../middlewares/authMiddleware';
import upload from '../middlewares/uploadMiddleware';

const router = Router();

// Public Routes
router.get('/', getCollections);

// Admin Routes
router.post('/', protect, admin, upload.single('image'), createCollection);
router.delete('/:id', protect, admin, deleteCollection);

export default router;

```

## File: `backend/src/routes/inquiryRoutes.ts`

```typescript
import { Router } from 'express';
import { createInquiry, getInquiries, updateInquiryStatus, deleteInquiry } from '../controllers/inquiryController';
import upload from '../middlewares/uploadMiddleware';
import { protect, admin } from '../middlewares/authMiddleware';

const router = Router();

// Public Routes
router.post('/', upload.single('image'), createInquiry); // Submit inquiry with image

// Admin Routes
router.get('/', protect, admin, getInquiries); // Admin list
router.put('/:id/status', protect, admin, updateInquiryStatus); // Update status (Admin)
router.delete('/:id', protect, admin, deleteInquiry); // Delete inquiry (Admin)

export default router;

```

## File: `backend/src/routes/orderRoutes.ts`

```typescript
import { Router } from 'express';
import { addOrderItems, getOrderById, updateOrderStatus, getOrders, getMyOrders } from '../controllers/orderController';
import { protect, admin, optionalAuth } from '../middlewares/authMiddleware';

const router = Router();

router.post('/',        optionalAuth, addOrderItems);    // Public (Guest) / Auth checkout
router.get('/',         protect, admin, getOrders);      // Admin list
router.get('/mine',     protect, getMyOrders);           // My orders
router.get('/:id',      optionalAuth, getOrderById);     // Tracking (Secure)
router.put('/:id/status', protect, admin, updateOrderStatus);

export default router;

```

## File: `backend/src/routes/paymentRoutes.ts`

```typescript
import { Router } from 'express';
import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/paymentController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Routes
router.post('/razorpay/create', createRazorpayOrder); // Public/Guest (as guest orders are allowed)
router.post('/razorpay/verify', verifyRazorpayPayment); // Public/Guest

export default router;

```

## File: `backend/src/routes/productRoutes.ts`

```typescript
import { Router } from 'express';
import { getProducts, getProductBySlug, createProduct, deleteProduct, updateProduct } from '../controllers/productController';
import { protect, admin } from '../middlewares/authMiddleware';
import upload from '../middlewares/uploadMiddleware';

const router = Router();

// Public Routes
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// Admin Routes
router.post('/', protect, admin, upload.array('images', 5), createProduct);
router.put('/:id', protect, admin, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;

```

## File: `backend/src/routes/userRoutes.ts`

```typescript
import { Router } from 'express';
import { getUsers, updateUserProfile, getMe } from '../controllers/authController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = Router();

// User Routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);

// Admin Only
router.get('/', protect, admin, getUsers);

export default router;

```

## File: `backend/src/seedAdmin.ts`

```typescript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

export const seedAdmin = async () => {
    try {
        const adminEmail = 'admin@mythrisgleams.com';
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (existingAdmin) {
            existingAdmin.password = 'password123';
            await existingAdmin.save();
            console.log('✅ Admin password forcefully reset to: password123');
        } else {
            const adminUser = new User({
                name: 'Chief Artisan',
                email: adminEmail,
                password: 'password123',
                role: 'admin'
            });
            await adminUser.save();
            console.log('✅ Default Admin Created: admin@mythrisgleams.com | password123');
        }
    } catch (error) {
        console.error('❌ Error creating Admin: ', error);
    }
};

```

## File: `backend/src/seeder.ts`

```typescript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import Product from './models/Product';
import Collection from './models/Collection';

dotenv.config();

connectDB();

const collections = [
    {
        name: 'Miniatures',
        slug: 'miniatures',
        description: 'Lifelike artisanal clay replicas of your favorite food and cultural aspects.',
        metaDescription: 'Shop handcrafted miniature clay art.',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800'
    },
    {
        name: 'Clocks',
        slug: 'clocks',
        description: 'Bespoke sculptural timepieces capturing heritage and culinary art.',
        metaDescription: 'Shop artisanal designer clocks.',
        image: 'https://images.unsplash.com/photo-1563861826-1efe393625ef?auto=format&fit=crop&q=80&w=800'
    },
    {
        name: 'Magnets',
        slug: 'magnets',
        description: 'Tiny detailed magnetic art for your fridge.',
        metaDescription: 'Shop handcrafted clay fridge magnets.',
        image: 'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?auto=format&fit=crop&q=80&w=800'
    }
];

const products = [
    {
        name: 'Traditional Samosa Miniature Clock',
        slug: 'traditional-samosa-miniature-clock',
        category: 'Clocks',
        price: 2499,
        mrp: 3200,
        story: 'Inspired by the vibrant streets of Mumbai, this clock captures the essence of a warm chai and samosa evening.',
        details: 'Hand sculpted with premium polymer clay. Mounted on a 10-inch wooden base. Silent sweep mechanism.',
        metaDescription: 'Buy handcrafted samosa and chai miniature wall clock.',
        images: [
            'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800'
        ],
        variants: [{ type: 'Size', options: ['Small (8 inch)', 'Large (10 inch)'] }],
        stockStatus: 'made-to-order',
        rating: 4.8,
        reviewCount: 12
    },
    {
        name: 'South Indian Filter Coffee Magnet',
        slug: 'south-indian-filter-coffee-magnet',
        category: 'Magnets',
        price: 499,
        mrp: 650,
        story: 'A miniature tribute to the quintessential morning ritual of South India. Complete with a tiny brass dabarah set.',
        details: 'Air-dry clay base with acrylic detailing. High-grade neodymium magnet attached.',
        metaDescription: 'Handcrafted South Indian Filter Coffee Fridge Magnet.',
        images: [
            'https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?auto=format&fit=crop&q=80&w=800'
        ],
        variants: [{ type: 'Size', options: ['Standard'] }],
        stockStatus: 'in-stock',
        rating: 5.0,
        reviewCount: 45
    },
    {
        name: 'Biryani Handi Miniature',
        slug: 'biryani-handi-miniature',
        category: 'Miniatures',
        price: 1899,
        mrp: 2500,
        story: 'A hyper-realistic clay sculpture of Hyderabadi Dum Biryani, complete with individual rice grains and a traditional copper handi.',
        details: 'Meticulously shaped using dental tools for precision. Set in resin broth.',
        metaDescription: 'Realistic clay miniature of Biryani in a copper handi.',
        images: [
            'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800'
        ],
        variants: [{ type: 'Scale', options: ['1:12 Scale', '1:6 Scale'] }],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 8
    },
    {
        name: 'Masala Dosa Platter Miniature',
        slug: 'masala-dosa-platter-miniature',
        category: 'Miniatures',
        price: 1299,
        mrp: 1800,
        story: 'The quintessential South Indian breakfast platter, featuring crispy dosa, three types of chutney, and sambar on a banana leaf.',
        details: 'Hand-painted banana leaf made from polymer clay. Sambar crafted with colored resin.',
        metaDescription: 'Handmade Masala Dosa Platter miniature art.',
        images: [
            'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?auto=format&fit=crop&q=80&w=800'
        ],
        variants: [{ type: 'Base', options: ['Banana Leaf', 'Silver Plate'] }],
        stockStatus: 'in-stock',
        rating: 4.7,
        reviewCount: 22
    },
    {
        name: 'Vintage Camera Miniature Desk Art',
        slug: 'vintage-camera-miniature-desk-art',
        category: 'Miniatures',
        price: 3499,
        mrp: 4200,
        story: 'For the photography enthusiast. A nostalgic ode to vintage twin-lens reflex cameras.',
        details: 'Crafted with black polymer clay and brushed metallic accents. Perfect for office desks.',
        metaDescription: 'Vintage Camera miniature sculpture for desk decor.',
        images: [
            'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800'
        ],
        variants: [{ type: 'Style', options: ['Black & Silver', 'Vintage Brown'] }],
        stockStatus: 'made-to-order',
        rating: 5.0,
        reviewCount: 15
    },
    {
        name: 'Idli Sambar Wall Clock',
        slug: 'idli-sambar-wall-clock',
        category: 'Clocks',
        price: 2899,
        mrp: 3500,
        story: 'Start your day on time and with an appetite! A delightful kitchen clock featuring South India\'s beloved breakfast.',
        details: '12-inch diameter. Requires 1 AA battery. Vibrant non-fade acrylics.',
        metaDescription: 'Idli Sambar themed handmade kitchen wall clock.',
        images: [
            'https://images.unsplash.com/photo-1626082895617-2c6b4122d3d3?auto=format&fit=crop&q=80&w=800'
        ],
        variants: [{ type: 'Size', options: ['12 inch', '14 inch'] }],
        stockStatus: 'in-stock',
        rating: 4.6,
        reviewCount: 30
    }
];

const importData = async () => {
    try {
        await Collection.deleteMany();
        await Product.deleteMany();

        console.log('🧹 Cleared existing database records.');

        const createdCollections = await Collection.insertMany(collections);
        console.log('✅ Collections Seeded: ', createdCollections.length);

        const createdProducts = await Product.insertMany(products);
        console.log('✅ Products Seeded: ', createdProducts.length);

        console.log('🎉 Data Import Successful!');
        process.exit();
    } catch (error) {
        console.error('❌ Error during seeding: ', error);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Collection.deleteMany();
        await Product.deleteMany();

        console.log('💥 Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error('❌ Error during destruction: ', error);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}

```

## File: `backend/src/server.ts`

```typescript
import app from './app';
import connectDB from './config/db';
import dotenv from 'dotenv';
import Order from './models/Order';
import { seedAdmin } from './seedAdmin';
dotenv.config();

const PORT = process.env.PORT || 5010;

// Connect to Database
connectDB();
seedAdmin();
 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const server = app.listen(PORT, () => {
    console.log(`🚀 Mythris Gleams Server running in ${process.env.NODE_ENV || 'production'} mode on http://localhost:${PORT}`);
}); 

// Background job to clean up pending (unpaid) orders older than 20 minutes
const cleanPendingOrders = async () => {
    try {
        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
        const result = await Order.deleteMany({
            isPaid: false,
            createdAt: { $lt: twentyMinutesAgo }
        });
        if (result.deletedCount > 0) {
            console.log(`🧹 Background Job: Cleaned up ${result.deletedCount} pending orders older than 20 minutes.`);
        }
    } catch (error: any) {
        console.error(`❌ Background Job Error (Order Cleanup): ${error.message}`);
    }
};

// Run immediately when server starts
cleanPendingOrders();

// Check every 1 minute
setInterval(cleanPendingOrders, 1 * 60 * 1000);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise) => {
    console.error(`❌ Unhandled Error: ${err.message}`);
    // Close server & exit process
    // server.close(() => process.exit(1)); 
});

```

## File: `backend/src/utils/errorResponse.ts`

```typescript
class ErrorResponse extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorResponse;

```

## File: `backend/src/utils/generateToken.ts`

```typescript
import jwt from 'jsonwebtoken';

const generateToken = (id: string, role: string) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d'
    });
};

export default generateToken;

```

## File: `backend/src/utils/seedAdmin.ts`

```typescript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import connectDB from '../config/db';

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@mythrisgleams.com' });

        if (adminExists) {
            console.log('💡 Admin user already exists.');
            process.exit(0);
        }

        // Create Admin
        await User.create({
            name: 'Uma Gayathri (Admin)',
            email: 'admin@mythrisgleams.com',
            password: 'password123',
            role: 'admin'
        });

        console.log('✅ Admin User Created Successfully!');
        console.log('📧 Email: admin@mythrisgleams.com');
        console.log('🔑 Password: password123');
        process.exit(0);
    } catch (error: any) {
        console.error(`❌ Error seeding admin: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();

```

## File: `backend/src/utils/sendEmail.ts`

```typescript
import nodemailer from 'nodemailer';

const sendEmail = async (options: { email: string; subject: string; message: string; html?: string }) => {
    // Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Send the email
    const message = {
        from: `${process.env.EMAIL_FROM || 'Mythris Gleams <noreply@mythrisgleams.com>'}`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    const info = await transporter.sendMail(message);

    console.log('📬 Email Message sent: %s', info.messageId);
};

export default sendEmail;

```

## File: `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "node",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": false,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "*": ["node_modules/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}

```

## File: `frontend/.env`

```
NEXT_PUBLIC_API_URL=https://mythrisgleams.com/api

```

## File: `frontend/AGENTS.md`

```
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

```

## File: `frontend/CLAUDE.md`

```
@AGENTS.md

```

## File: `frontend/eslint.config.mjs`

```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

```

## File: `frontend/next-env.d.ts`

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/dev/types/routes.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

## File: `frontend/next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "http://localhost:5000/uploads/:path*", // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;

```

## File: `frontend/package.json`

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@reduxjs/toolkit": "^2.11.2",
    "axios": "^1.14.0",
    "framer-motion": "^12.38.0",
    "lucide-react": "^1.7.0",
    "next": "16.2.2",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-hook-form": "^7.72.0",
    "react-hot-toast": "^2.6.0",
    "react-redux": "^9.2.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.2",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}

```

## File: `frontend/postcss.config.mjs`

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;

```

## File: `frontend/README.md`

```
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```

## File: `frontend/src/app/account/orders/page.tsx`

```typescript
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { getMyOrders } from "@/redux/slices/orderSlice";
import Breadcrumb from "@/components/Breadcrumb";
import { Package, ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { getImageUrl } from '@/utils/getImageUrl';

const STATUS_COLORS: Record<string, string> = {
  "Pending": "bg-[#fff8e6] text-[#b48d28] border-[#f2e6c4]",
  "Handcrafting": "bg-[#edf5ef] text-[#6b856f] border-[#d2e3d5]",
  "Quality Check": "bg-[#eef3fb] text-[#557eb3] border-[#d6e3f4]",
  "Dispatched": "bg-[#f4ebea] text-[#b46a62] border-[#e1cac7]",
  "Delivered": "bg-[#3d332a] text-white border-[#3d332a]",
  "Cancelled": "bg-[#f8f6f3] text-[#a1988c] border-[#e8e4db]",
};

export default function MyOrdersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { userInfo } = useAppSelector((s) => s.auth);
  const { orders, loading, error } = useAppSelector((s) => s.orders);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!userInfo) {
      router.replace("/account");
    } else {
      dispatch(getMyOrders());
    }
  }, [userInfo, dispatch, router]);

  if (!mounted || !userInfo) return null;

  return (
    <div className="min-h-screen bg-[#fdfdfb]">
      <Breadcrumb items={[{ label: "Account", href: "/account" }, { label: "My Orders" }]} />

      <div className="max-w-[1000px] mx-auto px-6 py-12 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e8e4db] pb-6 mb-10">
          <div>
            <h1 className="text-3xl font-serif text-[#3d332a]">Order History</h1>
            <p className="text-[13px] text-[#8c8273] mt-2 font-light tracking-wide">
              Track and manage your artisan pieces
            </p>
          </div>
          <Link
            href="/category/all"
            className="flex items-center gap-2 px-6 py-3 bg-[#f8f6f3] text-[#594a3c] rounded-xl text-[12px] font-medium tracking-wide hover:bg-[#e8e4db] transition-colors border border-[#e8e4db]"
          >
            <ArrowLeft size={14} strokeWidth={1.5} /> Continue Shopping
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#a1988c] gap-4">
            <Loader2 size={32} strokeWidth={1.5} className="animate-spin" />
            <p className="text-[12px] uppercase tracking-widest font-medium">Loading Orders...</p>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-50 text-red-600 rounded-3xl text-center border border-red-100">
            {error}
          </div>
        ) : !orders || orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-[#e8e4db] py-32 px-6 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <div className="w-20 h-20 rounded-full bg-[#f8f6f3] text-[#a69076] flex items-center justify-center mb-6">
              <Package size={28} strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-2xl text-[#3d332a] mb-2">No Orders Yet</h2>
            <p className="text-[#8c8273] max-w-[300px] font-light leading-relaxed mb-8">
              Your collection is waiting to be started. Explore our handcrafted artifacts.
            </p>
            <Link
              href="/category/all"
              className="px-8 py-4 bg-[#3d332a] text-white rounded-xl text-[12px] font-medium tracking-wide hover:bg-[#594a3c] transition-all flex items-center gap-3"
            >
              Explore Collection <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-6">
            {orders.map((order: any) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] border border-[#e8e4db] overflow-hidden shadow-sm hover:shadow-md hover:shadow-[#3d332a]/5 transition-all"
              >
                {/* Header */}
                <div className="px-6 py-5 sm:px-8 border-b border-[#e8e4db] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#fdfdfb]">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-[#8c8273] font-medium">Order Placed</p>
                      <p className="text-[13px] text-[#3d332a] font-medium mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-[#8c8273] font-medium">Total</p>
                      <p className="text-[13px] text-[#3d332a] font-medium mt-0.5">
                        ₹{order.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#8c8273] font-medium sm:mb-0.5">Order ID</p>
                    <p className="text-[12px] text-[#3d332a] font-serif tracking-wider uppercase">
                      #{order._id.slice(-8)}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6 sm:px-8 flex flex-col lg:flex-row gap-8 lg:gap-12 lg:items-center justify-between">
                  {/* Items */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className={`px-3 py-1 text-[10px] uppercase tracking-widest font-medium rounded-full border ${
                          STATUS_COLORS[order.status] || STATUS_COLORS["Pending"]
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.trackingNumber && (
                        <p className="text-[11px] text-[#8c8273]">
                          Tracking: <span className="font-medium text-[#594a3c]">{order.trackingNumber}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-4">
                      {order.orderItems.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#f8f6f3] border border-[#e8e4db] shrink-0">
                            {item.image ? (
                              <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#a1988c] text-[10px]">No Img</div>
                            )}
                          </div>
                          <div>
                            <Link href={`/product/${item.product}`} className="font-serif text-[15px] text-[#3d332a] hover:text-[#a69076] transition-colors line-clamp-1">
                              {item.name}
                            </Link>
                            <p className="text-[12px] text-[#8c8273] mt-0.5">Qty: {item.qty}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col gap-3 lg:items-end border-t lg:border-t-0 lg:border-l border-[#e8e4db] pt-6 lg:pt-0 lg:pl-12">
                    <Link
                      href={`/account/orders/${order._id}`}
                      className="px-6 py-3 w-full lg:w-auto text-center bg-[#3d332a] text-white rounded-xl text-[12px] font-medium tracking-wide hover:bg-[#594a3c] transition-all"
                    >
                      View Details
                    </Link>
                    <a
                      href={`https://wa.me/918300034451?text=Hello,%20I'm%20inquiring%20about%20my%20order%20%23${order._id.slice(-8).toUpperCase()}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 w-full lg:w-auto text-center border border-[#e8e4db] rounded-xl text-[12px] font-medium text-[#594a3c] hover:bg-[#f8f6f3] transition-colors"
                    >
                      Need Help?
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

```

## File: `frontend/src/app/account/orders/[id]/page.tsx`

```typescript
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/api";
import { useAppSelector } from "@/redux/hooks";
import Breadcrumb from "@/components/Breadcrumb";
import { 
  ArrowLeft, Package, MapPin, CreditCard, 
  CheckCircle2, Clock, Truck, Home, FileText 
} from "lucide-react";
import { motion } from "framer-motion";
import { getImageUrl } from '@/utils/getImageUrl';

const STATUS_COLORS: Record<string, string> = {
  "Pending": "bg-[#fff8e6] text-[#b48d28] border-[#f2e6c4]",
  "Handcrafting": "bg-[#edf5ef] text-[#6b856f] border-[#d2e3d5]",
  "Quality Check": "bg-[#eef3fb] text-[#557eb3] border-[#d6e3f4]",
  "Dispatched": "bg-[#f4ebea] text-[#b46a62] border-[#e1cac7]",
  "Delivered": "bg-[#3d332a] text-white border-[#3d332a]",
  "Cancelled": "bg-[#f8f6f3] text-[#a1988c] border-[#e8e4db]",
};
const STATUS_STEPS = ["Pending", "Handcrafting", "Quality Check", "Dispatched", "Delivered"];

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { userInfo } = useAppSelector((s) => s.auth);
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfdfb] flex flex-col items-center justify-center">
        <Package size={32} className="animate-pulse text-[#a69076] mb-4" />
        <p className="text-[12px] uppercase tracking-widest text-[#8c8273]">Retrieving Order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#fdfdfb] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
          <FileText size={24} />
        </div>
        <h1 className="text-2xl font-serif text-[#3d332a] mb-2">Order Not Found</h1>
        <p className="text-[#8c8273] mb-8">{error || "We couldn't locate this order."}</p>
        <Link href="/account/orders" className="px-6 py-3 bg-[#3d332a] text-white rounded-xl text-[12px] font-medium tracking-wide">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const stepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="min-h-screen bg-[#fdfdfb]">
      <Breadcrumb items={[
        { label: "Account", href: "/account" }, 
        { label: "Orders", href: "/account/orders" },
        { label: `Order #${order._id.slice(-8)}` }
      ]} />

      <div className="max-w-[1200px] mx-auto px-6 py-10 lg:py-16">
        <Link href="/account/orders" className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-widest text-[#a1988c] hover:text-[#594a3c] transition-colors mb-10">
          <ArrowLeft size={14} /> Back to History
        </Link>

        {/* ─── Header ─── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-serif text-[#3d332a]">Order <span className="uppercase text-[#a69076]">#{order._id.slice(-8)}</span></h1>
              <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-medium rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS["Pending"]}`}>
                {order.status}
              </span>
            </div>
            <p className="text-[14px] text-[#8c8273] flex items-center gap-2">
              <Clock size={14} className="text-[#a69076]" />
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: '2-digit', minute:'2-digit' })}
            </p>
          </div>
          {(order.trackingNumber || order.deliveryNote) && (
            <div className="px-5 py-4 bg-[#f8f6f3] border border-[#e8e4db] rounded-2xl flex items-start gap-4 max-w-[400px]">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#a69076] shadow-sm shrink-0">
                <Truck size={18} />
              </div>
              <div className="flex flex-col gap-3 mt-0.5">
                {order.trackingNumber && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#8c8273] font-medium">Tracking Info</p>
                    <p className="text-[14px] font-medium text-[#3d332a] tracking-wide mt-0.5 font-mono">{order.trackingNumber}</p>
                  </div>
                )}
                {order.deliveryNote && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#8c8273] font-medium">Courier Notes</p>
                    <p className="text-[12px] text-[#594a3c] mt-0.5 bg-white p-2 border border-[#e8e4db] rounded-lg shadow-sm italic leading-relaxed">{order.deliveryNote}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Status Visualizer ─── */}
        {order.status !== "Cancelled" && (
          <div className="bg-white rounded-[2rem] border border-[#e8e4db] p-8 md:p-12 mb-10 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[600px] relative">
              {/* background tracking line */}
              <div className="absolute left-6 right-6 top-5 h-[2px] bg-[#f0ece5] -z-0"></div>
              {/* active tracking line */}
              <div className="absolute left-6 top-5 h-[2px] bg-[#3d332a] -z-0 transition-all duration-1000" style={{ width: `${(Math.max(0, stepIdx) / (STATUS_STEPS.length - 1)) * 100}%` }}></div>

              {STATUS_STEPS.map((step, i) => {
                const isActive = i <= stepIdx;
                return (
                  <div key={step} className="flex flex-col items-center gap-3 relative z-10 w-24">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white transition-colors duration-500 ${isActive ? "bg-[#3d332a] text-white shadow-md shadow-[#3d332a]/20" : "bg-[#f0ece5] text-[#a1988c]"}`}>
                      {isActive ? <CheckCircle2 size={18} /> : <span className="text-[12px] font-medium">{i + 1}</span>}
                    </div>
                    <span className={`text-[10px] uppercase tracking-[0.1em] text-center w-max ${isActive ? "text-[#3d332a] font-medium" : "text-[#a1988c]"}`}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* ─── Left Column: Items ─── */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white rounded-[2rem] border border-[#e8e4db] overflow-hidden">
              <div className="px-8 py-6 border-b border-[#e8e4db] bg-[#fdfdfb]">
                <h2 className="font-serif text-xl text-[#3d332a]">Order Items</h2>
              </div>
              <div className="p-8 flex flex-col gap-6">
                {order.orderItems.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-6 pb-6 border-b border-[#e8e4db] last:border-0 last:pb-0">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#f8f6f3] border border-[#e8e4db] shrink-0">
                      {item.image ? (
                        <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#a1988c]"><Home size={20} /></div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <Link href={`/product/${item.product}`} className="font-serif text-[18px] text-[#3d332a] hover:text-[#a69076] transition-colors inline-block mb-1">
                        {item.name}
                      </Link>
                      {item.selectedVariant && <p className="text-[11px] text-[#8c8273] uppercase tracking-wide mb-2">{item.selectedVariant}</p>}
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-[13px] text-[#8c8273]">Qty: <span className="font-medium text-[#3d332a]">{item.qty}</span></p>
                        <p className="font-serif text-[16px] text-[#594a3c]">₹{(item.price * item.qty).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Need Help CTA */}
            <div className="bg-[#f8f6f3] rounded-[2rem] p-8 border border-[#e8e4db] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-serif text-lg text-[#3d332a] mb-1">Need help with your order?</h3>
                <p className="text-[13px] text-[#8c8273] font-light">Contact our artisan care team via WhatsApp directly.</p>
              </div>
              <a
                href={`https://wa.me/918300034451?text=Hello,%20I'm%20inquiring%20about%20my%20order%20%23${order._id.slice(-8).toUpperCase()}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#3d332a] text-white rounded-xl text-[12px] font-medium tracking-wide hover:bg-[#594a3c] transition-all whitespace-nowrap"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* ─── Right Column: Summary & Info ─── */}
          <div className="flex flex-col gap-8">
            
            {/* Payment & Summary */}
            <div className="bg-white rounded-[2rem] border border-[#e8e4db] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#e8e4db] bg-[#fdfdfb] flex items-center gap-3">
                <CreditCard size={18} className="text-[#a69076]" />
                <h3 className="font-serif text-lg text-[#3d332a]">Payment</h3>
              </div>
              <div className="p-6 text-[13px]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#8c8273]">Status</span>
                  <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-widest font-medium ${order.isPaid ? 'bg-[#edf5ef] text-[#6b856f]' : 'bg-[#fff8e6] text-[#b48d28]'}`}>
                    {order.isPaid ? 'Paid' : 'Cash on Delivery'}
                  </span>
                </div>
                {order.isPaid && order.razorpayPaymentId && (
                  <div className="flex items-center justify-between mb-4 border-b border-[#e8e4db] pb-4">
                    <span className="text-[#8c8273]">Transaction</span>
                    <span className="text-[#3d332a] font-mono text-[11px]">{order.razorpayPaymentId}</span>
                  </div>
                )}
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-[#8c8273]">
                    <span>Items Total</span>
                    <span>₹{order.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#8c8273]">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[#e8e4db] mt-2">
                    <span className="font-serif text-[16px] text-[#3d332a]">Grand Total</span>
                    <span className="font-serif text-xl text-[#3d332a]">₹{order.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-[2rem] border border-[#e8e4db] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#e8e4db] bg-[#fdfdfb] flex items-center gap-3">
                <MapPin size={18} className="text-[#a69076]" />
                <h3 className="font-serif text-lg text-[#3d332a]">Delivery Details</h3>
              </div>
              <div className="p-6 text-[13px] text-[#594a3c] leading-relaxed">
                <p className="font-medium text-[14px] text-[#3d332a] mb-2">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                
                <div className="mt-4 pt-4 border-t border-[#e8e4db] space-y-1">
                  <p className="text-[#8c8273] font-light">Email: <span className="text-[#594a3c]">{order.shippingAddress.email}</span></p>
                  <p className="text-[#8c8273] font-light">Phone: <span className="text-[#594a3c]">{order.shippingAddress.phone}</span></p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

```

## File: `frontend/src/app/account/page.tsx`

```typescript
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { login, registerUser, resetAuthError, logout } from "@/redux/slices/authSlice";
import { fetchCart, clearGuest } from "@/redux/slices/cartSlice";
import { 
  Eye, EyeOff, Sparkles, LogIn, UserPlus, AlertCircle, 
  User, Package, ChevronRight, LogOut, Settings, 
  ShoppingBag, MapPin, Heart
} from "lucide-react";
import Link from "next/link";
import BreadcrumbHero from "@/components/BreadcrumbHero";

type Tab = "login" | "register";

interface FieldError {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

function validate(tab: Tab, fields: any): FieldError {
  const errors: FieldError = {};
  if (tab === "register" && !fields.name?.trim()) {
    errors.name = "Full name is required.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!fields.password || fields.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (tab === "register" && fields.password !== fields.confirm) {
    errors.confirm = "Passwords do not match.";
  }
  return errors;
}

export default function AccountPage() {
  const dispatch   = useAppDispatch();
  const router     = useRouter();
  const { userInfo, loading, error } = useAppSelector((s) => s.auth);

  const [tab, setTab]         = useState<Tab>("login");
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);
  const [fields, setFields]   = useState({ name: "", email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [clientErrors, setClientErrors] = useState<FieldError>({});
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Sync cart on login
  useEffect(() => {
    if (userInfo) {
      dispatch(fetchCart());
      if (isNewRegistration) {
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect');
        router.replace(`/account/profile${redirect ? `?redirect=${redirect}` : ''}`);
      }
    }
  }, [userInfo, isNewRegistration, dispatch, router]);

  useEffect(() => {
    dispatch(resetAuthError());
    setFields({ name: "", email: "", password: "", confirm: "" });
    setTouched({});
    setClientErrors({});
  }, [tab, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearGuest());
    router.push("/");
  };

  const touch = (name: string) => setTouched((p) => ({ ...p, [name]: true }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFields((p) => ({ ...p, [name]: value }));
    if (touched[name]) {
      setClientErrors(validate(tab, { ...fields, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(fields).map((k) => [k, true]));
    setTouched(allTouched);
    const errs = validate(tab, fields);
    setClientErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (tab === "login") {
      setIsNewRegistration(false);
      dispatch(login({ email: fields.email, password: fields.password }));
    } else {
      setIsNewRegistration(true);
      dispatch(registerUser({ name: fields.name, email: fields.email, password: fields.password }));
    }
  };

  const inputClass = (field: keyof FieldError) =>
    `w-full bg-[var(--bg-subtle)] border rounded-xl px-5 py-4 text-[14px] text-[var(--text)] focus:outline-none transition-colors ${
      touched[field] && clientErrors[field]
        ? "border-red-300 focus:border-red-400"
        : "border-[var(--border)] focus:border-[var(--accent)]"
    }`;

  /* ─── Render Dashboard if Logged In ─── */
  if (hydrated && userInfo && !isNewRegistration) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <BreadcrumbHero items={[{ label: "Account" }]} eyebrow="Member Area" title="My Account" />
        <div className="max-w-[1200px] mx-auto px-6 py-12 lg:py-20">
          
          <div className="flex flex-col md:flex-row gap-12">
            {/* Sidebar / User Info */}
            <div className="md:w-[350px] shrink-0">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2.5rem] border border-[var(--border)] p-10 shadow-xl shadow-[var(--text)]/5 sticky top-24">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--text)] text-white flex items-center justify-center text-3xl  mb-6 shadow-xl shadow-[var(--text)]/20">
                    {userInfo.name?.[0] || <User size={40} />}
                  </div>
                  <h1 className="text-2xl  text-[var(--text)] mb-1">{userInfo.name}</h1>
                  <p className="text-[13px] text-[var(--text-muted)] font-light mb-8">{userInfo.email}</p>
                  
                  <div className="w-full flex flex-col gap-3 pt-6 border-t border-[var(--bg-muted)]">
                    <Link href="/account/profile" className="flex items-center justify-between p-4 bg-[var(--bg-subtle)] rounded-2xl text-[13px] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] transition-colors group">
                      <div className="flex items-center gap-3">
                        <Settings size={18} strokeWidth={1.5} /> Edit Details
                      </div>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <button onClick={handleLogout} className="flex items-center justify-between p-4 bg-white border border-[var(--border)] rounded-2xl text-[13px] text-[#b46a62] hover:bg-red-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <LogOut size={18} strokeWidth={1.5} /> Sign Out
                      </div>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col gap-10">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <Link href="/account/orders" className="bg-[var(--text)] rounded-[2.5rem] p-10 text-white flex flex-col justify-between h-[280px] group shadow-xl shadow-[var(--text)]/10 hover:-translate-y-1 transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Package size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="text-2xl  mb-2">My Collective</h2>
                      <p className="text-white/60 text-[13px] font-light leading-relaxed">Track your artisanal pieces through every stage of creation and delivery.</p>
                      <div className="mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                        View Order Details <ChevronRight size={14} />
                      </div>
                    </div>
                 </Link>

                 <div className="bg-white rounded-[2.5rem] border border-[var(--border)] p-10 flex flex-col justify-between h-[280px] group shadow-sm hover:shadow-xl hover:shadow-[var(--text)]/5 transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--bg-subtle)] text-[var(--accent)] flex items-center justify-center">
                      <ShoppingBag size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="text-2xl  text-[var(--text)] mb-2">Back to the Vault</h2>
                      <p className="text-[var(--text-muted)] text-[13px] font-light leading-relaxed">Your journey has just begun. Explore the latest additions to our artifact collections.</p>
                      <Link href="/category/all" className="mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] group-hover:text-[var(--text-muted)] transition-colors">
                        Explore Treasures <ChevronRight size={14} />
                      </Link>
                    </div>
                 </div>
              </motion.div>

              <div className="bg-white rounded-[2.5rem] border border-[var(--border)] p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <Sparkles size={18} className="text-[var(--accent)]" />
                  <h3 className=" text-xl text-[var(--text)]">Quick Access</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Shipping Addresses", icon: MapPin, href: "/account/profile" },
                    { label: "Wishlist Artifacts", icon: Heart, href: "/#products" },
                  ].map((item, i) => (
                    <Link key={i} href={item.href} className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--bg-subtle)]/50 border border-[var(--bg-muted)] hover:bg-white hover:shadow-lg hover:shadow-[var(--text)]/5 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center text-[var(--accent)] group-hover:bg-[var(--text)] group-hover:text-white transition-all">
                        <item.icon size={18} strokeWidth={1.5} />
                      </div>
                      <span className="text-[14px] text-[var(--text-muted)] font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Render Login/Register Form ─── */
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <BreadcrumbHero items={[{ label: "Account" }]} eyebrow="Member Area" title="My Account" />
      <div className="relative flex-1 flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--bg-subtle),_var(--bg)_60%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[480px] bg-white rounded-[2.5rem] shadow-xl shadow-[var(--text)]/5 border border-[var(--border)] overflow-hidden"
      >
        <div className="pt-10 pb-8 px-10 text-center border-b border-[var(--border)]">
          <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] font-medium mb-5">
            <Sparkles size={12} /> Mythris Gleams
          </div>
          <h1 className="text-3xl  text-[var(--text)] tracking-tight">
            {tab === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-[13px] text-[var(--text-muted)] font-light mt-2">
            {tab === "login" ? "Sign in to access your cart and orders." : "Join our artisan community today."}
          </p>
        </div>

        <div className="flex border-b border-[var(--border)]">
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-4 text-[12px] font-medium uppercase tracking-[0.15em] transition-colors relative ${
                tab === t ? "text-[var(--text)]" : "text-[var(--text-faint)] hover:text-[var(--text-muted)]"
              }`}
            >
              {t === "login" ? "Sign In" : "Register"}
              {tab === t && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--text)]" />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-10 py-8 flex flex-col gap-5" noValidate>
          <AnimatePresence mode="wait">
            {tab === "register" && (
              <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">Full Name</label>
                  <input
                    type="text" name="name" autoComplete="name"
                    placeholder="e.g. Priya Sharma"
                    value={fields.name} onChange={handleChange} onBlur={() => touch("name")}
                    className={inputClass("name")}
                  />
                  {touched.name && clientErrors.name && (
                    <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={11} />{clientErrors.name}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">Email Address</label>
            <input
              type="email" name="email" autoComplete="email"
              placeholder="you@example.com"
              value={fields.email} onChange={handleChange} onBlur={() => touch("email")}
              className={inputClass("email")}
            />
            {touched.email && clientErrors.email && (
              <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={11} />{clientErrors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} name="password" autoComplete={tab === "login" ? "current-password" : "new-password"}
                placeholder="Min 8 characters"
                value={fields.password} onChange={handleChange} onBlur={() => touch("password")}
                className={inputClass("password") + " pr-12"}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors">
                {showPw ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>
            {touched.password && clientErrors.password && (
              <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={11} />{clientErrors.password}</p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {tab === "register" && (
              <motion.div key="confirm" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showCf ? "text" : "password"} name="confirm" autoComplete="new-password"
                      placeholder="Repeat your password"
                      value={fields.confirm} onChange={handleChange} onBlur={() => touch("confirm")}
                      className={inputClass("confirm") + " pr-12"}
                    />
                    <button type="button" onClick={() => setShowCf(!showCf)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors">
                      {showCf ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                    </button>
                  </div>
                  {touched.confirm && clientErrors.confirm && (
                    <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={11} />{clientErrors.confirm}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[13px]">
              <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" /> {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-14 bg-[var(--text)] text-white rounded-xl text-[12px] font-medium tracking-[0.15em] uppercase hover:bg-[var(--text-muted)] transition-all disabled:opacity-60 flex items-center justify-center gap-3 mt-1"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : (tab === "login" ? <LogIn size={16} /> : <UserPlus size={16} />)}
            {loading ? "Processing..." : (tab === "login" ? "Sign In" : "Create Account")}
          </button>

          <p className="text-center text-[12px] text-[var(--text-faint)]">
            {tab === "login" ? "New to Mythris Gleams?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => setTab(tab === "login" ? "register" : "login")} className="text-[var(--text-muted)] font-medium hover:underline">
              {tab === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </form>
      </motion.div>
      </div>
    </div>
  );
}

```

## File: `frontend/src/app/account/profile/page.tsx`

```typescript
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { updateUserInfo } from "@/redux/slices/authSlice";
import { User, Phone, MapPin, Save, Loader2, Sparkles, AlertCircle, CheckCircle2, Plus, Trash2, Home, Briefcase, PlusCircle } from "lucide-react";
import api from "@/utils/api";
import Breadcrumb from "@/components/Breadcrumb";

interface Address {
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { userInfo } = useAppSelector((s) => s.auth);
  
  const [name, setName] = useState(userInfo?.name || "");
  const [phone, setPhone] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([
    { label: "Home", street: "", city: "", state: "Tamil Nadu", zip: "", isDefault: true }
  ]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!userInfo) {
      router.replace("/account");
      return;
    }
    
    // Fetch full profile to get existing addresses
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/users/me");
        if (data.success) {
          setName(data.user.name);
          setPhone(data.user.phone || "");
          setMarketingConsent(data.user.marketingConsent ?? true);
          if (data.user.addresses && data.user.addresses.length > 0) {
            setAddresses(data.user.addresses);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile details");
      }
    };
    fetchProfile();
  }, [userInfo, router]);

  const handleAddressChange = (index: number, field: keyof Address, value: any) => {
    const newAddresses = [...addresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    
    // If setting a new default, unset others
    if (field === "isDefault" && value === true) {
      newAddresses.forEach((addr, i) => {
        if (i !== index) addr.isDefault = false;
      });
    }
    
    setAddresses(newAddresses);
  };

  const addAddress = () => {
    if (addresses.length >= 3) return; // Limit to 3 addresses
    setAddresses([...addresses, { label: "Work", street: "", city: "", state: "Tamil Nadu", zip: "", isDefault: false }]);
  };

  const removeAddress = (index: number) => {
    if (addresses.length === 1) return;
    const newAddresses = addresses.filter((_, i) => i !== index);
    if (!newAddresses.some(a => a.isDefault)) {
      newAddresses[0].isDefault = true;
    }
    setAddresses(newAddresses);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.put("/users/profile", {
        name,
        phone,
        marketingConsent,
        addresses
      });

      if (response.data.success) {
        setSuccess(true);
        const updatedInfo = { ...userInfo, ...response.data.user, token: userInfo?.token };
        dispatch(updateUserInfo(updatedInfo as any));
        
        setTimeout(() => {
            const redirect = new URLSearchParams(window.location.search).get('redirect') || "/";
            router.push(redirect);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const INDIAN_STATES = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
    "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
    "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
    "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Puducherry"
  ];

  if (!hydrated || !userInfo) return null;

  return (
    <div className="min-h-screen bg-[#fdfdfb]">
      <Breadcrumb items={[{ label: "Account", href: "/account" }, { label: "Profile Settings" }]} />
      
      <div className="max-w-[900px] mx-auto px-6 py-12 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] border border-[#e8e4db] shadow-xl shadow-[#3d332a]/5 overflow-hidden">
          
          <div className="p-10 border-b border-[#e8e4db] text-center bg-[#f8f6f3]/30">
            <h1 className="text-3xl font-serif text-[#3d332a]">Manage Your Identity</h1>
            <p className="text-[13px] text-[#8c8273] mt-2 font-light">Keep your profile current for faster checkout and exclusive artisan previews.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 flex flex-col gap-10">
            {/* Core Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#a69076] flex items-center gap-2">
                  <User size={12} /> Legal Name
                </label>
                <input name="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-[#f8f6f3] border border-[#e8e4db] rounded-xl px-5 py-4 text-[14px] text-[#3d332a] focus:outline-none focus:border-[#a69076] transition-colors" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#a69076] flex items-center gap-2">
                  <Phone size={12} /> Primary Phone
                </label>
                <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="10-digit mobile number" className="w-full bg-[#f8f6f3] border border-[#e8e4db] rounded-xl px-5 py-4 text-[14px] text-[#3d332a] focus:outline-none focus:border-[#a69076] transition-colors" />
              </div>
            </div>

            {/* Address Management */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-[#f0ece5] pb-4">
                <h3 className="font-serif text-xl text-[#3d332a] flex items-center gap-2">
                  <MapPin size={20} className="text-[#a69076]" /> 
                  Delivery Addresses
                </h3>
                {addresses.length < 3 && (
                  <button type="button" onClick={addAddress} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#a69076] hover:text-[#594a3c] transition-colors">
                    <PlusCircle size={16} /> Add Another
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-8">
                {addresses.map((addr, index) => (
                  <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-6 rounded-3xl border border-[#e8e4db] bg-[#fdfdfb] relative group">
                    {addresses.length > 1 && (
                      <button type="button" onClick={() => removeAddress(index)} className="absolute top-4 right-4 text-[#c4b09a] hover:text-red-500 transition-colors p-2">
                        <Trash2 size={16} />
                      </button>
                    )}
                    
                    <div className="flex flex-col gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#a1988c]">Address Type</label>
                          <select value={addr.label} onChange={(e) => handleAddressChange(index, "label", e.target.value)} className="w-full bg-white border border-[#e8e4db] rounded-xl px-4 py-2 text-[13px] focus:outline-none">
                            <option>Home</option>
                            <option>Work</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div className="md:col-span-2 flex items-center gap-4 mt-6">
                           <label className="flex items-center gap-3 cursor-pointer">
                             <input type="checkbox" checked={addr.isDefault} onChange={(e) => handleAddressChange(index, "isDefault", e.target.checked)} className="w-4 h-4 rounded border-[#e8e4db] text-[#3d332a] focus:ring-[#a69076]" />
                             <span className="text-[12px] text-[#594a3c] font-medium">Set as default delivery address</span>
                           </label>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#a1988c]">Street Address</label>
                        <input value={addr.street} onChange={(e) => handleAddressChange(index, "street", e.target.value)} placeholder="House No, Building, Street" className="w-full bg-white border border-[#e8e4db] rounded-xl px-5 py-3 text-[14px] focus:outline-none" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#a1988c]">City</label>
                          <input value={addr.city} onChange={(e) => handleAddressChange(index, "city", e.target.value)} className="w-full bg-white border border-[#e8e4db] rounded-xl px-5 py-3 text-[14px] focus:outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#a1988c]">State</label>
                          <select value={addr.state} onChange={(e) => handleAddressChange(index, "state", e.target.value)} className="w-full bg-white border border-[#e8e4db] rounded-xl px-5 py-3 text-[14px] focus:outline-none appearance-none">
                            {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#a1988c]">PIN Code</label>
                          <input value={addr.zip} onChange={(e) => handleAddressChange(index, "zip", e.target.value)} maxLength={6} className="w-full bg-white border border-[#e8e4db] rounded-xl px-5 py-3 text-[14px] focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Marketing Consent */}
            <div className="bg-[#f8f6f3]/50 p-6 rounded-3xl border border-[#e8e4db] flex items-center gap-4">
              <input 
                type="checkbox" 
                id="marketingConsent"
                checked={marketingConsent} 
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="w-5 h-5 rounded border-[#e8e4db] text-[#3d332a] focus:ring-[#a69076]"
              />
              <label htmlFor="marketingConsent" className="text-[13px] text-[#594a3c] font-medium cursor-pointer">
                I agree to receive artisanal updates, exclusive previews, and soul-crafted stories from Mythris Gleams.
              </label>
            </div>

            {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[13px] flex items-center gap-3"><AlertCircle size={16} /> {error}</div>}
            {success && <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-[13px] flex items-center gap-3"><CheckCircle2 size={16} /> Profile secured. Redirecting...</div>}

            <button type="submit" disabled={loading || success} className="h-16 bg-[#3d332a] text-white rounded-2xl text-[13px] font-bold tracking-[0.2em] uppercase hover:bg-[#594a3c] transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-lg shadow-[#3d332a]/10">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Updating...</> : <><Save size={18} strokeWidth={1.5} /> Sync Profile</>}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-[11px] text-[#a1988c] mt-8 uppercase tracking-[0.3em]">✦ Handcrafted Data Privacy ✦</p>
      </div>
    </div>
  );
}

```

## File: `frontend/src/app/admin/collections/page.tsx`

```typescript
"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCollections, createCollection, deleteCollection, resetCollectionState } from '@/redux/slices/collectionSlice';
import { 
    Layers, 
    Plus, 
    Trash2, 
    Image as ImageIcon,
    Loader2,
    X,
    Save,
    Sparkles,
    Search,
    Hash,
    Database,
    Download,
    ExternalLink,
    ChevronRight,
    MapPin,
    Clock
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RootState } from '@/redux/store';
import EmptyState from '@/components/admin/EmptyState';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '@/utils/getImageUrl';

const collectionSchema = z.object({
    name: z.string().min(2, "Collection name required"),
    slug: z.string().min(2, "Slug is required"),
    description: z.string().optional(),
    metaDescription: z.string().max(160, "SEO description must be concise").optional(),
});

type CollectionForm = z.infer<typeof collectionSchema>;

const CollectionManagement = () => {
    const dispatch = useAppDispatch();
    const { collections, loading, success, error } = useAppSelector((state: RootState) => state.collections);
    
    // UI State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [inspectedCollection, setInspectedCollection] = useState<any>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CollectionForm>({
        resolver: zodResolver(collectionSchema)
    });

    const galleryName = watch('name');
    useEffect(() => {
        if (galleryName) {
            const generatedSlug = galleryName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
            setValue('slug', generatedSlug);
        }
    }, [galleryName, setValue]);

    useEffect(() => {
        dispatch(fetchCollections());
    }, [dispatch]);

    useEffect(() => {
        if (success) {
            toast.success("Collections Updated");
            setIsAddModalOpen(false);
            setInspectedCollection(null);
            reset();
            setImage(null);
            setPreview(null);
            dispatch(resetCollectionState());
            dispatch(fetchCollections());
        }
    }, [success, reset, dispatch]);

    const exportToExcel = () => {
        if (collections.length === 0) return toast.error("No data to export");
        const headers = ["ID", "Name", "Slug", "Description"];
        const rows = collections.map(c => [c._id, c.name, c.slug, c.description || ""]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `Mythris_Collections_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        toast.success("Excel Export Initialized");
    };

    const confirmDelete = () => {
        if (inspectedCollection) {
            dispatch(deleteCollection(inspectedCollection._id));
            setDeleteModalOpen(false);
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
            {/* Professional Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Collections Management</h1>
                    <p className="text-xs text-zinc-500 font-medium">Manage your site's product collections and categories.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportToExcel} className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-zinc-200 transition-all border border-zinc-200">
                        <Download size={14} />
                        <span>Export Excel</span>
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-black transition-all">
                        <Plus size={14} />
                        <span>Add Collection</span>
                    </button>
                </div>
            </div>

            {/* Gallery Registry (Table) */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading && collections.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-200" />
                        <p className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest">Loading Collections</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Image</th>
                                    <th className="px-6 py-4">Collection Name</th>
                                    <th className="px-6 py-4">Slug</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {collections.map((col: any) => (
                                    <tr key={col._id} onClick={() => setInspectedCollection(col)} className="hover:bg-zinc-50/50 transition-all text-xs cursor-pointer group">
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 rounded border border-zinc-100 bg-zinc-50 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                                                {col.image ? <img src={getImageUrl(col.image)} className="w-full h-full object-cover" /> : <Layers className="text-zinc-200 m-auto" size={16} />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-zinc-900">{col.name}</div>
                                            <div className="text-[10px] text-zinc-400 mt-1 italic line-clamp-1">{col.description || "No narrative established."}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-[9px] text-zinc-400 font-bold uppercase">/{col.slug}</td>
                                        <td className="px-6 py-4 text-right"><span className="px-2 py-0.5 rounded border border-zinc-200 text-[9px] font-bold uppercase text-zinc-500 bg-zinc-50">Authorized</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {inspectedCollection && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspectedCollection(null)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <h3 className="font-bold text-zinc-900 flex items-center gap-2">Collection Details</h3>
                                <button onClick={() => setInspectedCollection(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="flex gap-6">
                                    <div className="w-24 h-24 rounded-xl border border-zinc-200 overflow-hidden bg-zinc-50 shadow-inner shrink-0">
                                        {inspectedCollection.image ? <img src={getImageUrl(inspectedCollection.image)} className="w-full h-full object-cover" /> : <Layers className="text-zinc-200 m-auto mt-7" size={24} />}
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <h4 className="text-xl font-bold text-zinc-900 tracking-tight">{inspectedCollection.name}</h4>
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2"><Hash size={10}/> {inspectedCollection.slug}</div>
                                        <p className="text-xs text-zinc-600 leading-relaxed italic mt-2">"{inspectedCollection.description || "No narrative established for this classifying node."}"</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-3">
                                    <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                                        <span>Node Metadata</span>
                                        <span className="text-emerald-500 flex items-center gap-1"><Database size={10}/> Synchronized</span>
                                    </div>
                                    <div className="text-[11px] text-zinc-500 font-medium">
                                        {inspectedCollection.metaDescription || "No localized SEO metadata detected for this registry entry."}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                                <button onClick={() => setDeleteModalOpen(true)} className="flex items-center gap-2 text-rose-500 hover:text-rose-700 font-bold text-[10px] uppercase tracking-widest transition-all"><Trash2 size={16}/> Delete Collection</button>
                                <button onClick={() => setInspectedCollection(null)} className="px-8 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black transition-all">Close</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Initialize Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <div onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl p-8 overflow-hidden shadow-2xl border border-zinc-200">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
                            <div><h2 className="text-lg font-bold text-zinc-900 tracking-tight">New Collection</h2><p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Add a new category to the site</p></div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-900"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit((data) => {
                            const formData = new FormData();
                            formData.append('name', data.name); formData.append('slug', data.slug);
                            if (data.description) formData.append('description', data.description);
                            if (data.metaDescription) formData.append('metaDescription', data.metaDescription);
                            if (image) formData.append('image', image);
                            dispatch(createCollection(formData));
                        })} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Name</label><input {...register('name')} placeholder="Collection Name" className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs font-bold focus:border-zinc-900 outline-none" /></div>
                                <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Slug</label><input {...register('slug')} placeholder="url-slug" className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-[10px] font-mono focus:border-zinc-900 outline-none" /></div>
                            </div>
                            <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Description</label><textarea {...register('description')} rows={3} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs focus:border-zinc-900 outline-none resize-none" /></div>
                            <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Image</label><div className="flex items-center gap-4"><label className="flex-1 border-2 border-dashed border-zinc-100 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-50"><ImageIcon size={20} className="text-zinc-300"/><input type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setImage(file); setPreview(URL.createObjectURL(file)); } }} className="hidden" accept="image/*" /></label>{preview && <div className="w-20 h-20 rounded-xl overflow-hidden border border-zinc-100"><img src={preview} className="w-full h-full object-cover" /></div>}</div></div>
                            <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white font-bold py-3.5 rounded-lg active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">{loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} />Create Collection</>}</button>
                        </form>
                    </div>
                </div>
            )}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirm Delete" message="Are you sure you want to delete this collection?" type="confirm" />
        </div>
    );
};

export default CollectionManagement;

```

## File: `frontend/src/app/admin/customers/page.tsx`

```typescript
"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchUsers } from '@/redux/slices/userSlice';
import { 
    Users, 
    Mail, 
    Calendar, 
    Loader2,
    CheckCircle2,
    Activity,
    User,
    Download,
    X,
    Phone,
    MapPin,
    ShoppingBag,
    Clock,
    Shield
} from 'lucide-react';
import { RootState } from '@/redux/store';
import EmptyState from '@/components/admin/EmptyState';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerManagement = () => {
    const dispatch = useAppDispatch();
    const { users, loading } = useAppSelector((state: RootState) => state.users);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Filter to only show actual customers
    const customers = users.filter((u: any) => u.role === 'user');

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    const exportToExcel = () => {
        if (customers.length === 0) return toast.error("No data available to export");
        
        const headers = ["ID", "Name", "Email", "Role", "Joined Date"];
        const rows = customers.map((u: any) => [
            u._id,
            u.name,
            u.email,
            u.role,
            new Date(u.createdAt).toLocaleDateString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Mythris_Patrons_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Excel Export Initialized");
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
            {/* Professional Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Customer Directory</h1>
                    <p className="text-xs text-zinc-500 font-medium">Click any row to audit detailed member profile and history.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={exportToExcel}
                        className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-black transition-all shadow-md active:scale-95"
                    >
                        <Download size={14} />
                        <span>Export Excel</span>
                    </button>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-4 py-2.5 rounded-lg border border-zinc-200">
                        Total: {customers.length}
                    </div>
                </div>
            </div>

            {/* Customers Data Registry */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-200" />
                        <p className="text-[10px] font-bold tracking-widest text-zinc-300 uppercase">Synchronizing Records</p>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="p-10 text-center">
                        <EmptyState 
                            icon={Users}
                            title="No Customers Found"
                            description="The registry currently contains no member data."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Customer Identity</th>
                                    <th className="px-6 py-4">Email Address</th>
                                    <th className="px-6 py-4 text-center">Access Level</th>
                                    <th className="px-6 py-4 text-right">Enrollment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {customers.map((user: any) => (
                                    <tr 
                                        key={user._id} 
                                        onClick={() => setSelectedUser(user)}
                                        className="hover:bg-zinc-50/50 transition-all text-xs cursor-pointer group"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-9 h-9 rounded bg-zinc-100 flex items-center justify-center text-zinc-500 border border-zinc-200 font-bold group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                                                    {user.name?.charAt(0) || <User size={16} />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-zinc-900">{user.name}</div>
                                                    <div className="text-[9px] text-zinc-400 font-mono">UID: {user._id.substring(user._id.length-8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-zinc-500 font-medium">
                                                <Mail size={12} className="text-zinc-300" />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                                user.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-zinc-50 text-zinc-400 border-zinc-100'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right text-zinc-400 font-medium tabular-nums">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden"
                        >
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                    <User size={18} /> Profile Intelligence
                                </h3>
                                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-400 transition-all"><X size={20} /></button>
                            </div>
                            
                            <div className="p-8 space-y-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                                        {selectedUser.name[0]}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xl font-bold text-zinc-900">{selectedUser.name}</div>
                                        <div className="text-xs text-zinc-500 font-medium flex items-center gap-2">
                                            <Mail size={12} /> {selectedUser.email}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <Shield size={10} /> Role Access
                                        </div>
                                        <div className="text-xs font-bold text-zinc-900 uppercase">{selectedUser.role}</div>
                                    </div>
                                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock size={10} /> Account Age
                                        </div>
                                        <div className="text-xs font-bold text-zinc-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Node Logistics</h4>
                                    <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                                                <Phone size={16} />
                                            </div>
                                            <div>
                                                <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Contact Terminal</div>
                                                <div className="text-xs font-bold text-zinc-900 font-mono tracking-tighter">{selectedUser.phone || "UNVERIFIED"}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                                                <ShoppingBag size={16} />
                                            </div>
                                            <div>
                                                <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Transaction History</div>
                                                <div className="text-xs font-bold text-zinc-900">{selectedUser.orderCount || 0} Artifacts Ordered</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-end">
                                <button onClick={() => setSelectedUser(null)} className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black transition-all">Close Entry</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomerManagement;

```

## File: `frontend/src/app/admin/inquiries/page.tsx`

```typescript
"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchInquiries, updateInquiryStatus, deleteInquiry } from '@/redux/slices/inquirySlice';
import { 
    Mail, 
    MessageCircle, 
    Calendar, 
    Loader2,
    CheckCircle2,
    User,
    Phone,
    Image as ImageIcon,
    Clock,
    X,
    Copy,
    Download,
    Paperclip,
    Shield,
    Bell,
    Trash2
} from 'lucide-react';
import { RootState } from '@/redux/store';
import EmptyState from '@/components/admin/EmptyState';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '@/utils/getImageUrl';

const InquiryManagement = () => {
    const dispatch = useAppDispatch();
    const { inquiries, loading } = useAppSelector((state: RootState) => state.inquiries);
    const [inspectedInquiry, setInspectedInquiry] = useState<any>(null);

    useEffect(() => {
        dispatch(fetchInquiries());
    }, [dispatch]);

    const handleStatusUpdate = (id: string, status: string) => {
        dispatch(updateInquiryStatus({ id, status }));
        toast.success(`Log Updated: ${status}`);
        if (inspectedInquiry && inspectedInquiry._id === id) {
            setInspectedInquiry((prev: any) => ({ ...prev, status }));
        }
    };

    const handleInquiryDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this inquiry forever? This action cannot be undone.")) {
            dispatch(deleteInquiry(id));
            toast.success("Inquiry removed from registry.");
            setInspectedInquiry(null);
        }
    };

    const exportToExcel = () => {
        if (inquiries.length === 0) return toast.error("No logic to export");
        const headers = ["ID", "Name", "Email", "Phone", "Subject", "Status", "Date"];
        const rows = inquiries.map(i => [i._id, i.name, i.email, i.phone, i.subject, i.status, new Date(i.createdAt).toISOString().split('T')[0]]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `Mythris_Inquiries_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        toast.success("Excel Export Initialized");
    };

    const getStatusStyles = (status: string) => {
        switch(status) {
            case 'new': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'responded': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'closed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-zinc-50 text-zinc-400 border-zinc-100';
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Contact Inquiries</h1>
                    <p className="text-xs text-zinc-500 font-medium">Manage and respond to customer messages.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportToExcel} className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-zinc-200 transition-all border border-zinc-200">
                        <Download size={14} />
                        <span>Export Excel</span>
                    </button>
                    <div className="flex bg-zinc-50 border border-zinc-200 rounded-lg p-2 px-4 gap-4 shadow-sm">
                       <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-r border-zinc-200 pr-4">Total: {inquiries.length}</span>
                       <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">New: {inquiries.filter(i => i.status === 'new').length}</span>
                    </div>
                </div>
            </div>

            {/* Communication Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-200" />
                        <p className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest">Loading Logs</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Date / Time</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Subject / Message</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {inquiries.map((inquiry: any) => (
                                    <tr key={inquiry._id} onClick={() => setInspectedInquiry(inquiry)} className="hover:bg-zinc-50/50 transition-all text-xs cursor-pointer group">
                                        <td className="px-6 py-6">
                                            <div className="font-bold text-zinc-900">{new Date(inquiry.createdAt).toLocaleDateString()}</div>
                                            <div className="text-[10px] text-zinc-400 mt-1">{new Date(inquiry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-6 py-6 font-bold text-zinc-900">{inquiry.name} <span className="block text-[10px] text-zinc-400 font-normal">{inquiry.email}</span></td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2 font-bold text-zinc-600"><Paperclip size={12} className="text-zinc-300"/> {inquiry.subject}</div>
                                            <div className="text-[10px] text-zinc-400 line-clamp-1 mt-1 font-medium">"{inquiry.message}"</div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shadow-sm ${getStatusStyles(inquiry.status)}`}>{inquiry.status === 'new' ? 'New' : inquiry.status === 'responded' ? 'Responded' : 'Closed'}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {inspectedInquiry && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspectedInquiry(null)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <div>
                                    <h3 className="font-bold text-zinc-900 flex items-center gap-2">Inquiry Details</h3>
                                    <div className="text-[9px] text-zinc-400 font-bold uppercase mt-1 flex items-center gap-1.5 line-clamp-1">
                                        <Calendar size={10}/> {new Date(inspectedInquiry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} at {new Date(inspectedInquiry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <button onClick={() => setInspectedInquiry(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-xl font-bold text-zinc-900">{inspectedInquiry.name}</div>
                                            <div className="text-xs text-zinc-500 font-medium">{inspectedInquiry.email}</div>
                                            <div className="text-[10px] font-mono font-bold text-zinc-400 mt-1 uppercase tracking-tighter italic">{inspectedInquiry.phone || "No phone number"}</div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase border ${getStatusStyles(inspectedInquiry.status)}`}>{inspectedInquiry.status === 'new' ? 'New' : inspectedInquiry.status === 'responded' ? 'Responded' : 'Closed'}</span>
                                    </div>
                                    <div className="p-5 bg-zinc-50 border border-zinc-100 rounded-xl space-y-3 shadow-inner">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest"><MessageCircle size={12}/> Subject: {inspectedInquiry.subject}</div>
                                        <p className="text-sm font-medium text-zinc-700 leading-relaxed italic border-l-2 border-zinc-200 pl-4">"{inspectedInquiry.message}"</p>
                                        {inspectedInquiry.image && (
                                            <div className="mt-4 pt-4 border-t border-zinc-100">
                                                <div className="text-[8px] font-bold text-zinc-300 uppercase tracking-[0.2em] mb-3">Attached Image</div>
                                                <a href={getImageUrl(inspectedInquiry.image)} target="_blank" className="block w-full h-48 rounded-lg overflow-hidden border border-zinc-200 bg-white group hover:border-zinc-900 transition-all">
                                                    <img src={getImageUrl(inspectedInquiry.image)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleStatusUpdate(inspectedInquiry._id, 'responded')} className="py-2.5 rounded-lg border border-zinc-200 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-50 hover:text-amber-600 transition-all">Mark Responded</button>
                                    <button onClick={() => handleStatusUpdate(inspectedInquiry._id, 'closed')} className="py-2.5 rounded-lg border border-zinc-200 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all">Close Inquiry</button>
                                </div>
                            </div>
                            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
                                <button onClick={() => handleInquiryDelete(inspectedInquiry._id)} className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-rose-100 flex items-center gap-2 mr-auto"><Trash2 size={14}/> Delete</button>
                                <a href={`mailto:${inspectedInquiry.email}`} className="px-6 py-2.5 bg-zinc-200 text-zinc-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-zinc-300 flex items-center gap-2"><Mail size={14}/> Reply (Email)</a>
                                <button onClick={() => setInspectedInquiry(null)} className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black">Close</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InquiryManagement;

```

## File: `frontend/src/app/admin/layout.tsx`

```typescript
"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/redux/hooks';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { motion } from 'framer-motion';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = React.useState(false);
    const { userInfo } = useAppSelector((state) => state.auth);
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
        setMounted(true);
        if (!pathname.includes('/admin/login') && (!userInfo || userInfo.role !== 'admin')) {
            router.push('/admin/login');
        }
    }, [userInfo, router, pathname]);

    if (!mounted) {
        return null; 
    }

    // Bypass layout completely for the login page
    if (pathname.includes('/admin/login')) {
        return <>{children}</>;
    }

    if (!userInfo || userInfo.role !== 'admin') {
        return null;
    }

    return (
        <div className="flex h-screen bg-zinc-50 text-zinc-900 overflow-hidden">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto px-12 py-12 scroll-smooth">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
}

```

## File: `frontend/src/app/admin/login/page.tsx`

```typescript
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, ShieldCheck, ArrowRight, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { login, resetAuthError } from '@/redux/slices/authSlice';
import Link from 'next/link';

const adminLoginSchema = z.object({
    email: z.string().email("Authorized email required"),
    password: z.string().min(6, "Credentials security minimum not met"),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

const AdminLoginPage = () => {
    const dispatch = useAppDispatch();
    const { userInfo, loading, error } = useAppSelector((state) => state.auth);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginForm>({
        resolver: zodResolver(adminLoginSchema),
    });

    useEffect(() => {
        if (userInfo && userInfo.role === 'admin') {
            router.push('/admin');
        }
    }, [userInfo, router]);

    useEffect(() => {
        dispatch(resetAuthError());
    }, [dispatch]);

    const onSubmit = (data: AdminLoginForm) => {
        dispatch(login(data));
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm"
            >
                {/* Precise Security Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-zinc-900 text-white shadow-xl shadow-zinc-900/10 mb-6">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight uppercase">Administrative Hub</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-2">Logistics Gateway Authorization</p>
                </div>

                {/* Login Terminal */}
                <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 animate-shake">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5">Personnel Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" size={16} />
                                <input 
                                    {...register('email')}
                                    type="email" 
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3.5 pl-11 pr-4 text-zinc-900 text-xs focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all outline-none font-medium placeholder:text-zinc-300"
                                    placeholder="Enter encrypted email"
                                />
                            </div>
                            {errors.email && <p className="text-[9px] text-rose-500 ml-0.5 font-bold uppercase tracking-wider">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-0.5">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Security Phrase</label>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" size={16} />
                                <input 
                                    {...register('password')}
                                    type="password" 
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3.5 pl-11 pr-4 text-zinc-900 text-xs focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all outline-none font-medium placeholder:text-zinc-300"
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && <p className="text-[9px] text-rose-500 ml-0.5 font-bold uppercase tracking-wider">{errors.password.message}</p>}
                        </div>

                        <button 
                            disabled={loading}
                            type="submit" 
                            className="w-full bg-zinc-900 hover:bg-black text-white font-bold uppercase tracking-[0.2em] text-[10px] py-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10 active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : (
                                <>
                                    <span>Validate Personnel</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 transition-all border-b border-zinc-200 pb-1">
                        ← Exit Administrative Environment
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLoginPage;

```

## File: `frontend/src/app/admin/orders/page.tsx`

```typescript
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useSearchParams } from 'next/navigation';
import { fetchOrders, updateOrderStatus, resetOrderSuccess } from '@/redux/slices/orderSlice';
import { 
    ShoppingBag, 
    Search,
    Loader2,
    Calendar,
    User,
    Package,
    ShieldCheck,
    Hammer,
    X,
    MapPin,
    Copy,
    Hash,
    Download,
    CircleDollarSign,
    Zap,
    Truck,
    Clock,
    MoreHorizontal
} from 'lucide-react';
import { RootState } from '@/redux/store';
import Modal from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/utils/getImageUrl';

const OrderManagement = () => {
    const dispatch = useAppDispatch();
    const { orders, loading, success, error } = useAppSelector((state: RootState) => state.orders);
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    
    // UI State
    const [searchTerm, setSearchTerm] = useState("");
    const [inspectedOrder, setInspectedOrder] = useState<any>(null);
    const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
    const [dispatchData, setDispatchData] = useState({ tracking: '', note: '' });

    // Feedback Modals
    const [pendingAction, setPendingAction] = useState<{id: string, status: string, tracking?: string, deliveryNote?: string} | null>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchOrders({ includeUnpaid: false }));
    }, [dispatch]);

    useEffect(() => {
        if (success) {
            toast.success("Order Updated");
            setConfirmModalOpen(false);
            setPendingAction(null);
            dispatch(resetOrderSuccess());
        }
        if (error) {
            toast.error(error);
        }
    }, [success, error, dispatch]);

    const handleActionInitiation = (id: string, status: string, tracking?: string, deliveryNote?: string) => {
        setPendingAction({ id, status, tracking, deliveryNote });
        setConfirmModalOpen(true);
    };

    const handleStatusUpdate = async (id: string, status: string, tracking?: string, deliveryNote?: string) => {
        setStatusUpdating(id);
        await dispatch(updateOrderStatus({ id, status, trackingNumber: tracking, deliveryNote }));
        setStatusUpdating(null);
        if (inspectedOrder && inspectedOrder._id === id) {
            setInspectedOrder((prev: any) => ({ ...prev, status, trackingNumber: tracking || prev.trackingNumber, deliveryNote: deliveryNote || prev.deliveryNote }));
        }
    };

    const exportToExcel = () => {
        if (orders.length === 0) return toast.error("No orders to export");
        const headers = ["Order ID", "Customer", "Email", "Amount", "Paid", "Status", "Date"];
        const rows = orders.map(o => [o._id, o.shippingAddress?.name, o.shippingAddress?.email, o.totalPrice, o.isPaid ? 'YES' : 'NO', o.status, new Date(o.createdAt).toISOString().split('T')[0]]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `Mythris_Orders_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        toast.success("Excel Export Initialized");
    };

    const orderStatuses = ['Pending', 'Handcrafting', 'Quality Check', 'Dispatched', 'Delivered', 'Cancelled'];

    const getStatusStyles = (status: string) => {
        switch(status) {
            case 'Pending': return 'bg-amber-100/50 text-amber-700 border-amber-200';
            case 'Handcrafting': return 'bg-zinc-100 text-zinc-900 border-zinc-200 font-bold';
            case 'Quality Check': return 'bg-blue-100/50 text-blue-700 border-blue-200';
            case 'Dispatched': return 'bg-indigo-100/50 text-indigo-700 border-indigo-200';
            case 'Delivered': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200';
            case 'Cancelled': return 'bg-rose-100/50 text-rose-700 border-rose-200';
            default: return 'bg-zinc-50 text-zinc-500 border-zinc-100';
        }
    };

    const filteredOrders = useMemo(() => {
        let result = userId ? orders.filter((o: any) => o.user === userId || o.user?._id === userId) : orders;
        result = result.filter((o: any) => o.isPaid); // Only show paid orders

        if (searchTerm) {
            const lowTerm = searchTerm.toLowerCase();
            result = result.filter((o: any) => 
                o._id.toLowerCase().includes(lowTerm) ||
                o.razorpayOrderId?.toLowerCase().includes(lowTerm) ||
                o.shippingAddress?.name?.toLowerCase().includes(lowTerm) ||
                o.shippingAddress?.email?.toLowerCase().includes(lowTerm)
            );
        }
        return result;
    }, [orders, userId, searchTerm]);

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
            {/* Professional Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Orders</h1>
                    <p className="text-xs text-zinc-500 font-medium">View and manage customer orders and fulfillment.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportToExcel} className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-zinc-200 transition-all border border-zinc-200">
                        <Download size={14} />
                        <span>Export Excel</span>
                    </button>
                    <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                        <button className="bg-zinc-900 text-white shadow-sm px-4 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all">Paid Only</button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 border border-zinc-200 bg-zinc-50/50 p-2 rounded-xl">
                <div className="relative w-full xl:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input type="text" placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:border-zinc-900 outline-none transition-all" />
                </div>
                <div className="text-[10px] font-bold text-zinc-900 bg-white px-4 py-2 rounded-lg border border-zinc-200">Total Revenue: ₹{orders.filter(o => o.isPaid).reduce((acc, o) => acc + o.totalPrice, 0).toLocaleString()}</div>
            </div>

            {/* Order Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading && orders.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3"><Loader2 className="w-6 h-6 animate-spin text-zinc-200" /><p className="text-[10px] uppercase font-bold text-zinc-300">Loading Orders</p></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Order Info</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filteredOrders.map((order: any) => (
                                    <tr key={order._id} onClick={() => setInspectedOrder(order)} className="hover:bg-zinc-50/50 transition-all text-xs cursor-pointer group">
                                        <td className="px-6 py-5">
                                            <div className="font-mono font-bold text-zinc-900 uppercase italic leading-none">#{order._id.substring(order._id.length - 8)}</div>
                                            <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-1"><Calendar size={10} /> {new Date(order.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-zinc-900">{order.shippingAddress?.name}</div>
                                            <div className="text-[10px] text-zinc-500 italic mt-0.5">{order.shippingAddress?.email}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase w-fit border ${order.isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                {order.isPaid ? 'Paid' : 'Unpaid'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-bold text-zinc-900 tabular-nums">₹{order.totalPrice.toLocaleString()}</td>
                                        <td className="px-6 py-5 text-right"><span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${getStatusStyles(order.status)}`}>{order.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {inspectedOrder && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspectedOrder(null)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="px-8 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <div>
                                    <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-3">Order Details: #{inspectedOrder._id.substring(inspectedOrder._id.length-8).toUpperCase()}</h2>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="text-[9px] text-zinc-400 font-bold uppercase">Manage this order</div>
                                        <div className="text-[9px] text-zinc-500 font-bold uppercase flex items-center gap-1.5 border-l border-zinc-200 pl-4">
                                            <Calendar size={10} /> {new Date(inspectedOrder.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setInspectedOrder(null)} className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-400 transition-all"><X size={20} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-xl space-y-5">
                                            <h3 className="font-bold text-[10px] uppercase text-zinc-500 tracking-wider flex items-center gap-2"><Hammer size={14} /> Update Order Status</h3>
                                            <div className="grid grid-cols-3 gap-2">
                                                {orderStatuses.map(status => (
                                                    <button key={status} onClick={() => { if (status === 'Dispatched') { handleActionInitiation(inspectedOrder._id, status, dispatchData.tracking, dispatchData.note); } else { handleActionInitiation(inspectedOrder._id, status); } }} className={`px-3 py-2.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${inspectedOrder.status === status ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 hover:border-zinc-900 hover:text-zinc-900'}`}>{status}</button>
                                                ))}
                                            </div>
                                            <div className="space-y-3 pt-2">
                                                <div className="bg-zinc-100/50 p-4 rounded-xl border border-zinc-200 space-y-3">
                                                    <h4 className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Shipping Details</h4>
                                                    <input type="text" placeholder="Tracking ID (If shipping)" value={dispatchData.tracking} onChange={(e) => setDispatchData(p => ({...p, tracking: e.target.value}))} className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:border-zinc-900 outline-none transition-all" />
                                                    <textarea placeholder="Shipping Notes / Link" value={dispatchData.note} onChange={(e) => setDispatchData(p => ({...p, note: e.target.value}))} className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:border-zinc-900 outline-none transition-all resize-none h-16" />
                                                    <button onClick={() => handleActionInitiation(inspectedOrder._id, inspectedOrder.status !== 'Dispatched' ? 'Dispatched' : inspectedOrder.status, dispatchData.tracking, dispatchData.note)} className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-colors mt-2">Update Shipping Info</button>
                                                </div>
                                            </div>
                                            {(inspectedOrder.trackingNumber || inspectedOrder.deliveryNote) && <div className="p-4 bg-white border border-zinc-200 rounded-xl flex items-start gap-3"><Truck size={16} className="text-zinc-400 mt-0.5" /><div>{inspectedOrder.trackingNumber && <><div className="text-[8px] font-bold text-zinc-400 uppercase">Tracking ID</div><div className="text-xs font-bold font-mono mb-2">{inspectedOrder.trackingNumber}</div></>}{inspectedOrder.deliveryNote && <><div className="text-[8px] font-bold text-zinc-400 uppercase">Note</div><div className="text-[10px] text-zinc-600 italic bg-zinc-50 p-2 border border-zinc-100 rounded mt-1">{inspectedOrder.deliveryNote}</div></>}</div></div>}
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-[10px] uppercase text-zinc-500 px-1">Order Items</h3>
                                            <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                                                <table className="w-full text-left text-[11px]">
                                                    <thead className="bg-zinc-50 border-b border-zinc-100 font-bold text-zinc-400 uppercase text-[8px]">
                                                        <tr><th className="px-6 py-3">Item</th><th className="px-6 py-3 text-center">Qty</th><th className="px-6 py-3 text-right">Total</th></tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-100">
                                                        {inspectedOrder.orderItems.map((item: any, i: number) => (
                                                            <tr key={i}>
<td className="px-6 py-4 flex items-center gap-4">
                                                                     <div className="w-8 h-8 bg-zinc-50 rounded border border-zinc-100 overflow-hidden"><img src={getImageUrl(item.image)} className="w-full h-full object-cover" /></div>
                                                                     <div>
                                                                         <div className="font-bold text-zinc-900">{item.name}</div>
                                                                         {[item.selectedVariant, item.selectedColor].filter(Boolean).length > 0 && (
                                                                             <div className="text-[9px] text-zinc-400 uppercase tracking-wide font-bold mt-0.5">{[item.selectedVariant, item.selectedColor].filter(Boolean).join(" · ")}</div>
                                                                         )}
                                                                         {item.customerImage && (
                                                                             <div className="flex items-center gap-1.5 mt-1">
                                                                                 <img src={item.customerImage} alt="Customer photo" className="w-5 h-5 rounded border border-zinc-200 object-cover" />
                                                                                 <span className="text-[9px] text-zinc-400">Customer Photo</span>
                                                                             </div>
                                                                         )}
                                                                     </div>
                                                                 </td>
                                                                <td className="px-6 py-4 text-center font-bold">x{item.qty}</td>
                                                                <td className="px-6 py-4 text-right font-bold">₹{(item.qty * item.price).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="bg-white p-6 rounded-xl border border-zinc-200 space-y-4 shadow-sm">
                                            <h3 className="font-bold text-[10px] uppercase text-zinc-400">Customer Info</h3>
                                            <div>
                                                <div className="text-base font-bold text-zinc-900">{inspectedOrder.shippingAddress?.name}</div>
                                                <div className="text-[10px] text-zinc-400">{inspectedOrder.shippingAddress?.email}</div>
                                                <div className="text-[10px] font-bold mt-1 italic">{inspectedOrder.shippingAddress?.phone}</div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-xl border border-zinc-200 space-y-4 shadow-sm">
                                            <h3 className="font-bold text-[10px] uppercase text-zinc-400">Shipping Address</h3>
                                            <div className="text-[11px] text-zinc-700 bg-zinc-50 p-4 rounded-lg border border-zinc-100 italic">
                                                {inspectedOrder.shippingAddress?.street}, {inspectedOrder.shippingAddress?.city}, {inspectedOrder.shippingAddress?.state} {inspectedOrder.shippingAddress?.zip}
                                            </div>
                                        </div>
                                        <div className="bg-zinc-900 p-6 rounded-xl text-white shadow-xl space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Payment Status</span>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${inspectedOrder.isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{inspectedOrder.isPaid ? 'Paid' : 'Unpaid'}</span>
                                            </div>
                                            <div className="text-2xl font-bold">₹{inspectedOrder.totalPrice.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3"><button onClick={() => setInspectedOrder(null)} className="px-10 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black transition-all">Close</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Modal isOpen={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} onConfirm={() => { if (pendingAction) handleStatusUpdate(pendingAction.id, pendingAction.status, pendingAction.tracking, pendingAction.deliveryNote); }} type="confirm" title="Update Order Status" message={`Change status for order #${pendingAction?.id.substring(pendingAction?.id.length-8).toUpperCase()} to ${pendingAction?.status}?`} />
        </div>
    );
};

export default OrderManagement;

```

## File: `frontend/src/app/admin/page.tsx`

```typescript
"use client";

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchOrders } from '@/redux/slices/orderSlice';
import { fetchProducts } from '@/redux/slices/productSlice';
import { 
    ShoppingBag, 
    TrendingUp, 
    Package, 
    ArrowUpRight,
    Loader2,
    Users,
    Activity,
    Clock,
    DollarSign,
    Box,
    ChevronRight,
    ChevronLeft,
    Calendar
} from 'lucide-react';
import Link from 'next/link';

const AdminDashboard = () => {
    const dispatch = useAppDispatch();
    const { orders, loading: ordersLoading } = useAppSelector((state: any) => state.orders);
    const { products, loading: productsLoading } = useAppSelector((state: any) => state.products);

    useEffect(() => {
        dispatch(fetchOrders());
        dispatch(fetchProducts({}));
    }, [dispatch]);

    const paidOrders = orders.filter((o: any) => o.isPaid);
    const totalRevenue = paidOrders.reduce((acc: number, order: any) => acc + order.totalPrice, 0);
    const pendingOrders = orders.filter((o: any) => o.status === 'Pending').length;
    const completedOrders = orders.filter((o: any) => o.status === 'Delivered').length;

    const stats = [
        { name: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: <DollarSign size={16} />, color: 'emerald' },
        { name: 'Total Orders', value: orders.length, icon: <ShoppingBag size={16} />, color: 'blue' },
        { name: 'Pending Orders', value: pendingOrders, icon: <Clock size={16} />, color: 'amber' },
        { name: 'Total Products', value: products.length, icon: <Box size={16} />, color: 'zinc' },
    ];

    if (ordersLoading || productsLoading) {
        return (
            <div className="flex h-[70vh] items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-900 opacity-20" />
                    <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Loading Data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8 bg-white min-h-screen">
            {/* Header Area */}
            <div className="flex justify-between items-center border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-xs text-zinc-500 font-medium">Monitor your store's performance and manage various sections.</p>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> System Active
                </div>
            </div>

            {/* Performance Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.name} className="p-6 bg-white rounded-xl border border-zinc-200 hover:border-zinc-900 transition-all shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400">
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">{stat.name}</p>
                                <h2 className="text-xl font-bold text-zinc-900 tabular-nums">{stat.value}</h2>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Critical Activity & Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Logistics Registry */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="font-bold text-[10px] uppercase text-zinc-900 tracking-widest flex items-center gap-2">
                            <Activity size={14} className="text-zinc-400" /> Recent Orders
                        </h3>
                        <Link href="/admin/orders" className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest transition-colors flex items-center gap-2">
                            View All <ArrowUpRight size={14} />
                        </Link>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest">
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Total Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {orders.slice(0, 8).map((order: any) => (
                                    <tr key={order._id} className="hover:bg-zinc-50/50 transition-colors cursor-default">
                                        <td className="px-6 py-4 font-mono text-[9px] text-zinc-400 uppercase tracking-tighter">#{order._id.substring(order._id.length - 8).toUpperCase()}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-zinc-900 text-[11px]">{order.shippingAddress?.name || 'Guest'}</div>
                                            <div className="text-[9px] text-zinc-500 font-bold flex items-center gap-1.5 mt-0.5">
                                                <Calendar size={10} className="text-zinc-300" /> {new Date(order.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                                                order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                order.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-zinc-100 text-zinc-600 border-zinc-200'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-[11px] text-zinc-900 tabular-nums">₹{order.totalPrice.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Control Nodes */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-bold text-[10px] uppercase text-zinc-900 tracking-widest flex items-center gap-2 px-1">
                            <Box size={14} className="text-zinc-400" /> Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { name: 'Products', href: '/admin/products', icon: <Package size={14}/>, desc: 'Manage products' },
                                { name: 'Users', href: '/admin/users', icon: <Users size={14}/>, desc: 'Manage user accounts' }
                            ].map((nav) => (
                                <Link key={nav.name} href={nav.href} className="flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-900 transition-all group">
                                    <div className="w-10 h-10 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                                        {nav.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">{nav.name}</div>
                                        <div className="text-[9px] text-zinc-400 font-medium">{nav.desc}</div>
                                    </div>
                                    <ChevronRight className="text-zinc-300 group-hover:text-zinc-900 transition-colors" size={14} />
                                </Link>
                            ))}
                        </div>
                    </div>

               
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

```

## File: `frontend/src/app/admin/products/page.tsx`

```typescript
"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchProducts, deleteProduct, updateProduct, createProduct, resetProductState } from '@/redux/slices/productSlice';
import { 
    Plus, 
    Search, 
    Trash2, 
    Edit, 
    Package,
    Loader2,
    Activity,
    Box,
    Download,
    X,
    Hash,
    Tag,
    Layers,
    Archive,
    Image as ImageIcon,
    Clock,
    DollarSign,
    ExternalLink
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/admin/EmptyState';
import ProductModal from '@/components/admin/ProductModal';
import { RootState } from '@/redux/store';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '@/utils/getImageUrl';

const ProductManagement = () => {
    const dispatch = useAppDispatch();
    const { products, loading, deleteSuccess, success: createSuccess, error } = useAppSelector((state: RootState) => state.products);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [inspectedProduct, setInspectedProduct] = useState<any>(null);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchProducts({}));
    }, [dispatch]);

    useEffect(() => {
        if (deleteSuccess || createSuccess) {
            toast.success(deleteSuccess ? "Inventory Updated" : "Entry Saved");
            setAddModalOpen(false);
            setInspectedProduct(null);
            dispatch(resetProductState());
            dispatch(fetchProducts({}));
        }
        if (error) {
            toast.error(error);
            dispatch(resetProductState());
        }
    }, [deleteSuccess, createSuccess, error, dispatch]);

    const exportToExcel = () => {
        if (products.length === 0) return toast.error("No data available to export");
        const headers = ["ID", "Name", "Slug", "Category", "Price", "Stock Status"];
        const rows = products.map(p => [p._id, p.name, p.slug, p.category, p.price, p.stockStatus]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `Mythris_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        toast.success("Excel Export Initialized");
    };

    const confirmDelete = () => {
        if (selectedProduct) {
            dispatch(deleteProduct(selectedProduct._id));
            setDeleteModalOpen(false);
            setSelectedProduct(null);
        }
    };

    const filteredProducts = products.filter((p: any) => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleFormSubmit = (formData: FormData) => {
        if (selectedProduct) {
            dispatch(updateProduct({ id: selectedProduct._id, productData: formData }));
        } else {
            dispatch(createProduct(formData));
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
            {/* Professional Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Product Management</h1>
                    <p className="text-xs text-zinc-500 font-medium">Manage your store's inventory and product details.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportToExcel} className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-zinc-200 transition-all border border-zinc-200">
                        <Download size={14} />
                        <span>Export Excel</span>
                    </button>
                    <button 
                        onClick={() => { setSelectedProduct(null); setAddModalOpen(true); }}
                        className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-black transition-all"
                    >
                        <Plus size={14} />
                        <span>New Entry</span>
                    </button>
                </div>
            </div>

            {/* Precision Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between border border-zinc-200 bg-zinc-50/50 p-2 rounded-xl">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:border-zinc-900 outline-none transition-all"
                    />
                </div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">{filteredProducts.length} Products Found</div>
            </div>

            {/* Inventory Data Registry */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading && products.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-200" />
                        <p className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest">Loading Products</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filteredProducts.map((product: any) => (
                                    <tr 
                                        key={product._id} 
                                        onClick={() => setInspectedProduct(product)}
                                        className="hover:bg-zinc-50/50 transition-all text-xs cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded border border-zinc-100 bg-zinc-50 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                                    {product.images?.[0] ? <img src={getImageUrl(product.images[0])} className="w-full h-full object-cover" /> : <ImageIcon className="text-zinc-200 m-auto" size={16} />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-zinc-900 line-clamp-1">{product.name}</div>
                                                    <div className="text-[9px] font-mono text-zinc-400 uppercase">#{product.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 rounded border border-zinc-200 text-[9px] font-bold uppercase text-zinc-500 bg-zinc-50">{product.category}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shadow-sm ${
                                                product.stockStatus === 'in-stock' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                product.stockStatus === 'made-to-order' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                                            }`}>{product.stockStatus}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-zinc-900 tabular-nums">₹{product.price.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {inspectedProduct && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspectedProduct(null)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <h3 className="font-bold text-zinc-900 flex items-center gap-2">Product Details</h3>
                                <button onClick={() => setInspectedProduct(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                                <div className="flex gap-8">
                                    <div className="w-40 h-40 rounded-xl border border-zinc-200 overflow-hidden shrink-0 bg-zinc-50">
                                        {inspectedProduct.images?.[0] ? <img src={getImageUrl(inspectedProduct.images[0])} className="w-full h-full object-cover" /> : <ImageIcon className="text-zinc-200 m-auto mt-12" size={40} />}
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        <div className="space-y-1">
                                            <div className="text-xl font-bold text-zinc-900">{inspectedProduct.name}</div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">UID: {inspectedProduct._id}</div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-xs text-zinc-500 leading-relaxed italic border-l-2 border-zinc-100 pl-4">"{inspectedProduct.story || "No story provided."}"</p>
                                            <div className="text-[10px] bg-zinc-50 p-3 rounded-lg border border-zinc-100 font-medium text-zinc-600">
                                                <span className="font-bold text-zinc-900 uppercase block mb-1">Product Details:</span>
                                                {inspectedProduct.details || "No technical specs found."}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-2"><DollarSign size={10}/> Price</div>
                                        <div className="text-lg font-bold text-zinc-900 tabular-nums">₹{inspectedProduct.price.toLocaleString()}</div>
                                    </div>
                                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Tag size={10}/> Category</div>
                                        <div className="text-lg font-bold text-zinc-900 uppercase">{inspectedProduct.category}</div>
                                    </div>
                                </div>
                                {(inspectedProduct.variants?.length > 0 || inspectedProduct.requiresImage) && (
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {inspectedProduct.variants?.map((vg: any) => (
                                            <span key={vg.type} className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 text-[9px] font-bold text-zinc-500">
                                                {vg.type}: {vg.options.join(", ")}
                                            </span>
                                        ))}
                                        {inspectedProduct.requiresImage && (
                                            <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-600 uppercase">
                                                Requires Customer Photo
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                             <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                                <button onClick={() => { setSelectedProduct(inspectedProduct); setInspectedProduct(null); setDeleteModalOpen(true); }} className="flex items-center gap-2 text-rose-500 hover:text-rose-700 font-bold text-[10px] uppercase tracking-widest transition-all"><Trash2 size={16}/> Delete Product</button>
                                <div className="flex gap-2">
                                    <button onClick={() => { setSelectedProduct(inspectedProduct); setInspectedProduct(null); setAddModalOpen(true); }} className="px-6 py-2 bg-zinc-200 text-zinc-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-zinc-300">Edit Product</button>
                                    <button onClick={() => setInspectedProduct(null)} className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black">Close</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modals Suite */}
            <ProductModal isOpen={addModalOpen} onClose={() => { setAddModalOpen(false); setSelectedProduct(null); }} onSubmit={handleFormSubmit} loading={loading} initialData={selectedProduct} />
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} type="confirm" title="Confirm Delete" message="Are you sure you want to delete this product?" />
        </div>
    );
};

export default ProductManagement;

```

## File: `frontend/src/app/admin/users/page.tsx`

```typescript
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchUsers } from '@/redux/slices/userSlice';
import { 
    Users, 
    Mail, 
    Phone, 
    Calendar, 
    Search, 
    ShieldCheck, 
    MapPin, 
    ShoppingBag, 
    ChevronRight,
    Loader2,
    Filter,
    Activity,
    Lock,
    Unlock,
    MoreVertical
} from 'lucide-react';
import { RootState } from '@/redux/store';
import Link from 'next/link';
import toast from 'react-hot-toast';
import EmptyState from '@/components/admin/EmptyState';

const UserManagement = () => {
    const dispatch = useAppDispatch();
    const { users, loading } = useAppSelector((state: RootState) => state.users);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("all");

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = filterRole === "all" || user.role === filterRole;
            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, filterRole]);

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">User Management</h1>
                    <p className="text-xs text-zinc-500 font-medium">View and manage registered users and their roles.</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Total Users: {users.length}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between border border-zinc-200 bg-zinc-50/50 p-2 rounded-xl">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:border-zinc-900 outline-none transition-all placeholder:text-zinc-400"
                    />
                </div>
                <div className="flex bg-white p-1 rounded-lg border border-zinc-200 gap-1">
                    {['all', 'user', 'admin'].map((role) => (
                        <button 
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${filterRole === role ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            {role === 'all' ? 'All' : role === 'user' ? 'Users' : 'Admins'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Registry Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-200" />
                        <p className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest">Loading Users</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-10 text-center">
                        <EmptyState 
                            icon={Users}
                            title="No Results"
                            description="No user matched your query."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Phone</th>
                                    <th className="px-6 py-4">Joined Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-zinc-50/50 transition-all text-xs">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                                    {user.name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-zinc-900">{user.name}</div>
                                                    <div className="text-[10px] text-zinc-400 lowercase">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${
                                                user.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 font-mono text-[11px] tabular-nums">
                                            {user.phone || "Not provided"}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link 
                                                    href={`/admin/orders?userId=${user._id}`}
                                                    className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all"
                                                    title="View Orders"
                                                >
                                                    <ShoppingBag size={14} />
                                                </Link>
                                                <button 
                                                    className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400"
                                                    onClick={() => toast.success("Opening profile...")}
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;

```

## File: `frontend/src/app/category/[slug]/page.tsx`

```typescript
"use client";

import React, { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchProducts } from "@/redux/slices/productSlice";
import { fetchCollections } from "@/redux/slices/collectionSlice";
import { RootState } from "@/redux/store";
import { Loader2, Filter, LayoutGrid, List, Leaf, Home, ChevronRight } from "lucide-react";
import { Product } from "@/data/products";
import { motion, AnimatePresence } from "framer-motion";

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const dispatch = useAppDispatch();

  const { collections } = useAppSelector((state: RootState) => state.collections);
  const { products, loading } = useAppSelector((state: RootState) => state.products);

  const [maxPrice, setMaxPrice] = useState(100000);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    dispatch(fetchCollections());
  }, [dispatch]);

  const currentCollection = (collections as any[]).find(c => c.slug === slug);

  useEffect(() => {
    if (slug === 'all') {
      dispatch(fetchProducts({ sort: sortBy }));
    } else if (currentCollection?.name) {
      dispatch(fetchProducts({ category: currentCollection.name, sort: sortBy }));
    }
  }, [dispatch, slug, currentCollection?.name, sortBy]);

  const filteredProducts = useMemo(() => {
    return (products as Product[]).filter(p => p.price <= maxPrice);
  }, [products, maxPrice]);

  const resetFilters = () => {
    setMaxPrice(100000);
    setSortBy("newest");
  };

  const pageTitle = currentCollection?.name || (slug === 'all' ? "All Products" : "Collection");
  const pageDesc = currentCollection?.description || "A mindful exploration of all our handcrafted artifacts. Find pieces that resonate with your space and spirit.";

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[var(--bg)]">

      {/* ── BACKGROUND IMAGE BREADCRUMB HERO ── */}
      <section className="relative w-full h-[340px] md:h-[420px] flex flex-col items-start justify-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-[1.04]"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />
        <div className="absolute inset-0 bg-[var(--accent)]/10 mix-blend-multiply" />

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-8 sm:px-12 pb-10 md:pb-14 flex flex-col gap-4">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            aria-label="Breadcrumb"
            className="flex items-center gap-2"
          >
            <Link href="/" className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300">
              <Home size={14} />
            </Link>
            <ChevronRight size={14} className="text-white/30" />
            {slug !== 'all' && (
              <>
                <Link href="/category/all" className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase hover:text-white transition-all">
                  All Products
                </Link>
                <ChevronRight size={14} className="text-white/30" />
              </>
            )}
            <span className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold tracking-[0.2em] uppercase">
              {pageTitle}
            </span>
          </motion.nav>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <span className="text-white/70 text-[10px] font-bold tracking-[0.25em] uppercase mb-3 block">
              {filteredProducts.length} Handcrafted Pieces
            </span>
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-tight">
              {pageTitle}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* ── SHOP LAYOUT ── */}
      <div className="max-w-[1440px] mx-auto px-8 sm:px-12 py-12 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 lg:gap-16 items-start w-full">

        {/* FILTERS SIDEBAR */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col gap-8 lg:sticky lg:top-[100px]"
        >
          <div className="space-y-7 p-7 rounded-[1.5rem] bg-[var(--bg-subtle)] border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
               <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--text)] flex items-center gap-2">
                 <Filter size={14} strokeWidth={2} /> Refine
               </h3>
               <button onClick={resetFilters} className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors">Clear</button>
            </div>

            <div className="space-y-7">
              {/* Price Range */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase text-[var(--text-faint)] tracking-[0.15em] block">Price Limit</label>
                <div className="relative pt-1">
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full h-1 rounded-lg appearance-none cursor-pointer outline-none slider-thumb"
                    style={{ WebkitAppearance: 'none', background: `linear-gradient(to right, var(--accent) ${(maxPrice / 100000) * 100}%, var(--bg-muted) ${(maxPrice / 100000) * 100}%)` }}
                  />
                </div>
                <div className="flex justify-between text-[12px] font-bold text-[var(--text-faint)]">
                  <span>₹0</span>
                  <span className="text-[var(--accent)]">₹{maxPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Sort */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase text-[var(--text-faint)] tracking-[0.15em] block">Sort By</label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white border border-[var(--border)] hover:border-[var(--accent)] focus:border-[var(--accent)] transition-colors rounded-xl px-4 py-3 text-[13px] font-bold text-[var(--text)] outline-none cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="newest">Latest Arrivals</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-faint)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Description */}
          {pageDesc && (
            <div className="p-6 rounded-[1.5rem] bg-white border border-[var(--border)] shadow-sm">
              <p className="text-[var(--text-muted)] text-[13px] leading-relaxed">{pageDesc}</p>
            </div>
          )}
        </motion.aside>

        {/* PRODUCTS AREA */}
        <div className="flex flex-col gap-6 pb-16">
          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5"
          >
            <div className="text-[12px] font-bold tracking-[0.1em] text-[var(--text-faint)] uppercase">
              <span className="text-[var(--text)]">{filteredProducts.length}</span> results
            </div>
            <div className="flex bg-[var(--bg-subtle)] rounded-xl p-1 border border-[var(--border)]">
              <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-[var(--text)]" : "text-[var(--text-faint)] hover:text-[var(--text-muted)]"}`}><LayoutGrid size={16} strokeWidth={1.5} /></button>
              <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-[var(--text)]" : "text-[var(--text-faint)] hover:text-[var(--text-muted)]"}`}><List size={16} strokeWidth={1.5} /></button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-40 flex flex-col items-center gap-5">
                <Loader2 className="animate-spin text-[var(--accent)]" size={36} strokeWidth={1.5} />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]">Curating the Archive...</span>
              </motion.div>
            ) : filteredProducts.length > 0 ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className={`grid gap-x-6 gap-y-12 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
              >
                {filteredProducts.map((p: Product, i: number) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.5 }}
                    key={(p as any)._id || p.id}
                  >
                    <ProductCard product={p as any} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-24 px-8 text-center bg-[var(--bg-subtle)] rounded-[2rem] border border-[var(--border)] flex flex-col items-center gap-4 shadow-sm"
              >
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm border border-[var(--border)]">
                  <Leaf size={28} className="text-[var(--text-faint)]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[var(--text)] text-2xl font-bold tracking-tight">No Results Found</h3>
                <p className="text-[var(--text-muted)] text-[14px] max-w-sm leading-relaxed">No artifacts match your current price filter. Try adjusting or resetting the filters.</p>
                <button onClick={resetFilters} className="mt-4 px-8 py-3 bg-white text-[var(--text)] rounded-full text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[var(--accent)] hover:text-white border border-[var(--border)] transition-all">
                  Reset Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Slider thumb style */}
      <style dangerouslySetInnerHTML={{__html: `
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
      `}} />
    </div>
  );
}

```

## File: `frontend/src/app/checkout/page.tsx`

```typescript
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { createOrder, resetOrderSuccess } from "@/redux/slices/orderSlice";
import { clearCartThunk, clearGuest } from "@/redux/slices/cartSlice";
import { useCart } from "@/hooks/useCart";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import { getImageUrl } from '@/utils/getImageUrl';
import {
  MapPin, User, Mail, Phone, Home, Package,
  CheckCircle2, ShoppingBag, ArrowLeft, AlertCircle, Loader2
} from "lucide-react";

interface ShippingForm {
  label: string;
  name: string; email: string; phone: string;
  street: string; city: string; state: string; zip: string;
}
type FormErrors = Partial<Record<keyof ShippingForm, string>>;

function validate(f: ShippingForm): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim())   e.name   = "Full name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Valid email required.";
  if (!/^\d{10}$/.test(f.phone.replace(/\s/g, ""))) e.phone = "Enter a valid 10-digit phone.";
  if (!f.street.trim()) e.street = "Street address is required.";
  if (!f.city.trim())   e.city   = "City is required.";
  if (!f.state.trim())  e.state  = "State is required.";
  if (!/^\d{6}$/.test(f.zip)) e.zip = "Enter a valid 6-digit PIN code.";
  return e;
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Puducherry","Other"
];

const STATUS_STEPS = ["Pending","Handcrafting","Quality Check","Dispatched","Delivered"];

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();

  const { items, totalPrice, isAuth, clear } = useCart();
  const userInfo = useAppSelector(s => s.auth.userInfo);
  const { loading, error, success, currentOrder } = useAppSelector(s => s.orders);

  const [form, setForm] = useState<ShippingForm>({
    label: "Home",
    name: userInfo?.name || "", email: userInfo?.email || "",
    phone: "", street: "", city: "", state: "Tamil Nadu", zip: "",
  });

  const [userAddresses, setUserAddresses] = useState<any[]>([]);

  useEffect(() => {
    if (isAuth) {
      const fetchUserDetails = async () => {
        try {
          const { data } = await api.get("/users/me");
          if (data.success && data.user) {
            const u = data.user;
            setUserAddresses(u.addresses || []);
            const defAddr = u.addresses?.find((a: any) => a.isDefault) || u.addresses?.[0];
            
            setForm({
              label: defAddr?.label || "Home",
              name: u.name || "",
              email: u.email || "",
              phone: u.phone || "",
              street: defAddr?.street || "",
              city: defAddr?.city || "",
              state: defAddr?.state || "Tamil Nadu",
              zip: defAddr?.zip || "",
            });
          }
        } catch (err) {
          console.error("Failed to auto-fill checkout details", err);
        }
      };
      fetchUserDetails();
    }
  }, [isAuth]);

  const selectAddress = (addr: any) => {
    setForm(prev => ({
      ...prev,
      label: addr.label,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zip: addr.zip
    }));
  };

  const [touched, setTouched] = useState<Partial<Record<keyof ShippingForm, boolean>>>({});
  const [errors, setErrors]   = useState<FormErrors>({});
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuth) {
      router.push("/login?redirect=/checkout");
    }
  }, [isAuth, router]);

  // Redirect empty cart
  useEffect(() => {
    if (!paymentSuccess && !success && items.length === 0) router.replace("/category/all");
  }, [items, paymentSuccess, success, router]);

  const touch = (k: keyof ShippingForm) => setTouched(p => ({ ...p, [k]: true }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    if (touched[name as keyof ShippingForm]) setErrors(validate(updated));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(form).map(k => [k, true]));
    setTouched(allTouched as any);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const orderData = {
      orderItems: items.map(i => ({
        name: i.name, qty: i.quantity, image: i.image,
        price: i.price, product: i.product,
        selectedVariant: i.selectedVariant,
        selectedColor: i.selectedColor,
        customerImage: i.customerImage,
      })),
      shippingAddress: form,
      totalPrice,
    };

    dispatch(createOrder({ orderData, isGuest: false })).then((res: any) => {
      if (res.meta.requestStatus === "fulfilled") {
        const order = res.payload;
        handleRazorpay(order._id, order.totalPrice);
      }
    });
  };

  const handleRazorpay = async (orderId: string, amount: number) => {
    try {
      setIsProcessingPayment(true);
      
      const { data: createData } = await api.post('/payments/razorpay/create', { orderId });
      const { id: rzpOrderId, key } = createData.data;

      const options = {
        key: key,
        amount: amount * 100,
        currency: "INR",
        name: "Mythris Gleams",
        description: "Artisan Selection",
        order_id: rzpOrderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await api.post('/payments/razorpay/verify', {
              internalOrderId: orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.data.success) {
              setPaymentSuccess(true);
              setIsProcessingPayment(false);
              if (isAuth) dispatch(clearCartThunk());
              else dispatch(clearGuest());
            }
          } catch (error) {
            console.error(error);
            setIsProcessingPayment(false);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone
        },
        theme: {
          color: "#b85c3a"
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setIsProcessingPayment(false);
        alert("Payment failed: " + response.error.description);
      });
      rzp.open();

    } catch (error: any) {
      console.error(error);
      setIsProcessingPayment(false);
      const apiMsg = error.response?.data?.error || error.response?.data?.message;
      alert(apiMsg || "Failed to initiate payment. Please try again.");
    }
  };

  const inputBase = "w-full bg-[var(--bg-subtle)] border rounded-xl px-5 py-4 text-[14px] text-[var(--text)] focus:outline-none transition-colors placeholder:text-[var(--text-faint)]";
  const inputClass = (k: keyof ShippingForm) =>
    `${inputBase} ${touched[k] && errors[k] ? "border-red-300 focus:border-red-400" : "border-[var(--border)] focus:border-[var(--accent)]"}`;

  const FieldError = ({ field }: { field: keyof ShippingForm }) =>
    touched[field] && errors[field] ? (
      <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1">
        <AlertCircle size={11} />{errors[field]}
      </p>
    ) : null;

  /* ─── Success / Confirmation Screen ─────────────────────────── */
  if (paymentSuccess && currentOrder) {
    const stepIdx = STATUS_STEPS.indexOf(currentOrder.status);
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-6 py-20 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <div className="w-24 h-24 rounded-full bg-[#edf5ef] border border-[#849b87]/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={44} className="text-[#6b856f]" strokeWidth={1.5} />
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)]  text-[var(--text)] mb-3">Order Confirmed!</h1>
          <p className="text-[var(--text-muted)] max-w-[420px] mx-auto font-light leading-relaxed mb-2">
            Your artisan order <span className="text-[var(--text-muted)] font-medium ">#{currentOrder._id?.slice(-8).toUpperCase()}</span> has been placed and is now in our queue.
          </p>
          <p className="text-[12px] text-[var(--text-faint)] mb-10">A confirmation has been sent to <strong>{currentOrder.shippingAddress?.email}</strong></p>

          {/* Status tracker */}
          <div className="flex items-center justify-center gap-0 mb-12 overflow-x-auto max-w-[600px] mx-auto pb-2">
            {STATUS_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium transition-all ${i <= stepIdx ? "bg-[var(--text)] text-white" : "bg-[var(--bg-muted)] text-[var(--text-faint)] border border-[var(--border)]"}`}>
                    {i < stepIdx ? "✓" : i + 1}
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)] max-w-[60px] text-center leading-tight">{step}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`h-[1px] w-10 sm:w-16 shrink-0 mb-6 ${i < stepIdx ? "bg-[var(--text)]" : "bg-[var(--border)]"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                dispatch(resetOrderSuccess());
                setPaymentSuccess(false);
              }}
              className="px-8 py-4 bg-[var(--text)] text-white rounded-xl text-[12px] font-medium tracking-wide hover:bg-[var(--text-muted)] transition-all"
            >
              Continue Shopping
            </button>
            {isAuth && (
              <Link href="/account/orders" className="px-8 py-4 bg-white border border-[var(--border)] text-[var(--text-muted)] rounded-xl text-[12px] font-medium tracking-wide hover:bg-[var(--bg-subtle)] transition-all">
                View My Orders
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── Main Checkout Form ─────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <BreadcrumbHero
        items={[{ label: "Vault", href: "/category/all" }, { label: "Checkout" }]}
        eyebrow="Delivery & Payment"
        title="Checkout"
      />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

        {/* ─── LEFT: Form ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-7 flex flex-col gap-8">

          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">Step 1 of 1</span>
            <h1 className="text-3xl  text-[var(--text)] mt-2">Delivery Details</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            <fieldset disabled={loading || isProcessingPayment} className={`flex flex-col gap-6 border-none p-0 m-0 min-w-0 transition-all duration-300 ${loading || isProcessingPayment ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="bg-white rounded-[2rem] border border-[var(--border)] p-8 flex flex-col gap-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center">
                  <User size={15} className="text-[var(--accent)]" strokeWidth={1.5} />
                </div>
                <h3 className=" text-lg text-[var(--text)]">Contact Information</h3>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} onBlur={() => touch("name")} placeholder="As on ID" className={inputClass("name")} />
                <FieldError field="name" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} onBlur={() => touch("email")} placeholder="For order updates" className={inputClass("email")} />
                  <FieldError field="email" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">Phone</label>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} onBlur={() => touch("phone")} placeholder="10-digit mobile" className={inputClass("phone")} />
                  <FieldError field="phone" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-[var(--border)] p-8 flex flex-col gap-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center">
                  <MapPin size={15} className="text-[var(--accent)]" strokeWidth={1.5} />
                </div>
                <h3 className=" text-lg text-[var(--text)]">Delivery Address</h3>
              </div>

              <div className="flex flex-col gap-2 mb-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">Destination Type</label>
                <div className="flex gap-3">
                  {["Home", "Work", "Other"].map(type => (
                    <button 
                      key={type}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, label: type }))}
                      className={`px-4 py-2 rounded-xl text-[12px] font-medium border transition-all ${form.label === type ? 'bg-[var(--text)] text-white border-[var(--text)]' : 'bg-white text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--bg-subtle)]'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {isAuth && userAddresses.length > 1 && (
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">Select Stored Address</label>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {userAddresses.map((addr, idx) => (
                      <button 
                        key={idx}
                        type="button" 
                        onClick={() => selectAddress(addr)}
                        className={`px-6 py-3 rounded-xl border text-[12px] font-medium whitespace-nowrap transition-all ${form.street === addr.street ? 'bg-[var(--text)] text-white border-[var(--text)]' : 'bg-white text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--bg-subtle)]'}`}
                      >
                        {addr.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">Street / House No. / Building</label>
                <input name="street" value={form.street} onChange={handleChange} onBlur={() => touch("street")} placeholder="123, Rose Garden Apartments, MG Road" className={inputClass("street")} />
                <FieldError field="street" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">City</label>
                  <input name="city" value={form.city} onChange={handleChange} onBlur={() => touch("city")} placeholder="City / District" className={inputClass("city")} />
                  <FieldError field="city" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">State</label>
                  <div className="relative">
                    <select name="state" value={form.state} onChange={handleChange} className={`${inputClass("state")} appearance-none pr-10`}>
                      {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--accent)]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:w-1/2">
                <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">PIN Code</label>
                <input name="zip" value={form.zip} onChange={handleChange} onBlur={() => touch("zip")} placeholder="6-digit PIN" maxLength={6} className={inputClass("zip")} />
                <FieldError field="zip" />
              </div>
            </div>

            {/* Payment note */}
            <div className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-2xl p-5 flex gap-4 items-start">
              <Package size={20} className="text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-[13px] font-medium text-[var(--text)]">Secure Online Payment</p>
                <p className="text-[12px] text-[var(--text-muted)] mt-1 font-light">Pay securely via Razorpay. We accept all major Credit Cards, Debit Cards, UPI, and Net Banking.</p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[13px] flex items-center gap-3">
                <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />{error}
              </div>
            )}

            <button type="submit" disabled={loading || isProcessingPayment} className="h-16 bg-[var(--text)] text-white rounded-2xl text-[13px] font-medium tracking-[0.15em] uppercase hover:bg-[var(--text-muted)] transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-lg shadow-[var(--text)]/10">
              {loading || isProcessingPayment ? <><Loader2 size={18} className="animate-spin" /> {isProcessingPayment ? "Processing Payment..." : "Preparing Order..."}</> : <><CheckCircle2 size={18} strokeWidth={1.5} /> Proceed to Pay — ₹{totalPrice.toLocaleString()}</>}
            </button>
            </fieldset>
          </form>
        </motion.div>

        {/* ─── RIGHT: Order Summary ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-5 sticky top-[100px]">
          <div className="bg-white rounded-[2rem] border border-[var(--border)] overflow-hidden">
            <div className="px-8 py-6 border-b border-[var(--border)] flex items-center gap-3">
              <ShoppingBag size={18} className="text-[var(--accent)]" strokeWidth={1.5} />
              <h2 className=" text-[1.1rem] text-[var(--text)]">Order Summary</h2>
              <span className="ml-auto text-[11px] text-[var(--text-faint)] tracking-wide">{items.length} {items.length === 1 ? "item" : "items"}</span>
            </div>

            <div className="px-8 py-6 flex flex-col gap-5 max-h-[380px] overflow-y-auto">
              {items.map(item => (
                <div key={item._id} className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] overflow-hidden shrink-0">
                    {item.image ? <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-faint)]"><Home size={16} strokeWidth={1} /></div>}
                  </div>
                  <div className="flex-grow">
                    <p className=" text-[14px] text-[var(--text)] leading-tight">{item.name}</p>
                    {[item.selectedVariant, item.selectedColor].filter(Boolean).length > 0 && <p className="text-[10px] text-[var(--accent)] uppercase tracking-wide mt-0.5">{[item.selectedVariant, item.selectedColor].filter(Boolean).join(" · ")}</p>}
                    {item.customerImage && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <img src={item.customerImage} alt="Your photo" className="w-6 h-6 rounded-md object-cover border border-[var(--border)]" />
                        <span className="text-[10px] text-[var(--text-faint)]">Your photo</span>
                      </div>
                    )}
                    <p className="text-[12px] text-[var(--text-muted)] mt-1">Qty: {item.quantity}</p>
                  </div>
                  <span className=" text-[14px] text-[var(--text-muted)] shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="px-8 py-6 border-t border-[var(--border)] space-y-4 bg-[var(--bg-subtle)]/50">
              <div className="flex justify-between text-[13px] text-[var(--text-muted)]">
                <span>Subtotal</span><span>₹{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[13px] text-[var(--text-muted)]">
                <span>Shipping</span><span className="text-[#849b87] font-medium">Free</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
                <span className=" text-[1rem] text-[var(--text)]">Total</span>
                <span className=" text-2xl text-[var(--text)]">₹{totalPrice.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-[var(--text-faint)] text-center">✦ Estimated delivery: 10–14 days ✦</p>
            </div>
          </div>

          <Link href="/category/all" className="mt-4 flex items-center justify-center gap-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-muted)] transition-colors py-3">
            <ArrowLeft size={14} strokeWidth={1.5} /> Continue Shopping
          </Link>
        </motion.div>

      </div>
    </div>
  );
}

```

## File: `frontend/src/app/contact/page.tsx`

```typescript
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { createInquiry, resetInquiryState } from "@/redux/slices/inquirySlice";
import { Phone, Mail, MapPin, Send, Upload, CheckCircle2, AlertCircle, Sparkles, Home, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const dispatch = useAppDispatch();
  const { loading, success, error } = useAppSelector((state) => state.inquiries);
  
  React.useEffect(() => {
    dispatch(resetInquiryState());
  }, [dispatch]);

  const [formData, setFormData] = useState({
    type: "contact",
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    else if (formData.name.length < 3) newErrors.name = "Name must be at least 3 characters.";

    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please provide a valid email.";

    const phoneClean = formData.phone.replace(/[^0-9]/g, "");
    if (formData.phone) {
        const isValidIndianMobile = (p: string) => /^[6-9]\d{9}$/.test(p);
        
        let valid = false;
        if (phoneClean.length === 10 && isValidIndianMobile(phoneClean)) valid = true;
        else if (phoneClean.length === 11 && phoneClean.startsWith("0") && isValidIndianMobile(phoneClean.substring(1))) valid = true;
        else if (phoneClean.length === 12 && phoneClean.startsWith("91") && isValidIndianMobile(phoneClean.substring(2))) valid = true;

        if (!valid) newErrors.phone = "Valid 10-digit mobile number required.";
    }

    if (!formData.subject.trim()) newErrors.subject = "Subject is required.";
    if (!formData.message.trim()) newErrors.message = "Message is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
        data.append(key, val);
    });
    if (file) {
        data.append("image", file);
    }
    
    dispatch(createInquiry(data)).then((res: any) => {
        if (res.meta.requestStatus === "fulfilled") {
            setFormData({ type: "contact", name: "", email: "", phone: "", subject: "", message: "" });
            setFile(null);
        }
    });
  };

  return (
    <div className="flex flex-col font-sans bg-[var(--bg)] min-h-screen">
      
      {/* ── BACKGROUND IMAGE BREADCRUMB HERO ── */}
      <section className="relative w-full h-[380px] md:h-[460px] flex flex-col items-start justify-end overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-[1.04]"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        {/* Multi-stop dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />
        {/* Warm terracotta tint */}
        <div className="absolute inset-0 bg-[var(--accent)]/10 mix-blend-multiply" />

        {/* Content anchored to bottom-left */}
        <div className="relative z-10 w-full max-w-[1320px] mx-auto px-8 sm:px-12 pb-12 md:pb-16 flex flex-col gap-5">
          
          {/* Breadcrumb trail */}
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            aria-label="Breadcrumb"
            className="flex items-center gap-2"
          >
            <Link href="/" className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300">
              <Home size={14} />
            </Link>
            <ChevronRight size={14} className="text-white/30" />
            <span className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold tracking-[0.2em] uppercase">
              Contact
            </span>
          </motion.nav>

          {/* Page title */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <span className="text-white/70 text-[10px] font-bold tracking-[0.25em] uppercase mb-4 block">
              Studio Inquiries
            </span>
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-tight">
              Get In Touch With<br />
              Mythri's Gleams
            </h1>
          </motion.div>
        </div>
      </section>

      {/* ── MAIN CONTENT (GRID) ── */}
      <section className="max-w-[1320px] w-full mx-auto px-8 sm:px-12 py-12 md:py-16 mb-12">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Left: Contact Info */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-4 flex flex-col gap-12 lg:sticky lg:top-[120px] self-start"
            >
               <div className="space-y-3">
                   <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-faint)]">The Sanctum</h3>
                   <h2 className="text-[var(--text)] text-3xl font-bold tracking-tight">Direct Channels</h2>
               </div>

               <div className="space-y-10">
                  <div className="flex gap-6 items-start group">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center border border-[var(--border)] group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] transition-colors duration-500 shadow-sm shrink-0">
                       <Mail size={18} strokeWidth={1.5} className="text-[var(--text-muted)] group-hover:text-white transition-colors duration-500" />
                    </div>
                    <div className="flex flex-col gap-1.5 pt-0.5">
                       <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]">Dispatches</span>
                       <a href="mailto:artisan@mythrisgleams.com" className="text-[15px] text-[var(--text)] font-semibold hover:text-[var(--accent)] transition-colors">artisan@mythrisgleams.com</a>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start group">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center border border-[var(--border)] group-hover:bg-[#25D366] group-hover:border-[#25D366] transition-colors duration-500 shadow-sm shrink-0">
                       <Phone size={18} strokeWidth={1.5} className="text-[var(--text-muted)] group-hover:text-white transition-colors duration-500" />
                    </div>
                    <div className="flex flex-col gap-1.5 pt-0.5">
                       <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]">Consultation</span>
                       <a href="https://wa.me/918300034451" className="text-[15px] text-[var(--text)] font-semibold hover:text-[#25D366] transition-colors">+91 83000 34451</a>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start group">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center border border-[var(--border)] transition-colors duration-500 shadow-sm shrink-0">
                       <MapPin size={18} strokeWidth={1.5} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="flex flex-col gap-1.5 pt-0.5">
                       <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]">The Atelier</span>
                       <span className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-[200px]">Mythri's Gleams Studio<br/>Bangalore, India</span>
                    </div>
                  </div>
               </div>
            </motion.div>

            {/* Right: The Form */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-8 bg-[var(--bg-subtle)] rounded-[2rem] p-8 md:p-10 relative overflow-hidden group border border-[var(--border)] shadow-sm"
            >
               {/* Decorative background shape */}
               <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[var(--bg-muted)] rounded-full blur-3xl opacity-50 group-hover:bg-[var(--accent)] group-hover:opacity-10 transition-all duration-1000 pointer-events-none" />

               <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="relative">
                         <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" className={`w-full bg-white h-11 rounded-xl px-4 text-[var(--text)] text-[14px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border ${errors.name ? 'border-red-300' : 'border-transparent'} transition-all shadow-sm`} />
                        {errors.name && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1.5 absolute -bottom-5"><AlertCircle size={10} /> {errors.name}</p>}
                     </div>
                     <div className="relative">
                         <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className={`w-full bg-white h-11 rounded-xl px-4 text-[var(--text)] text-[14px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border ${errors.email ? 'border-red-300' : 'border-transparent'} transition-all shadow-sm`} />
                        {errors.email && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1.5 absolute -bottom-5"><AlertCircle size={10} /> {errors.email}</p>}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="relative">
                         <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="WhatsApp Number (Optional)" className={`w-full bg-white h-11 rounded-xl px-4 text-[var(--text)] text-[14px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border ${errors.phone ? 'border-red-300' : 'border-transparent'} transition-all shadow-sm`} />
                        {errors.phone && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1.5 absolute -bottom-5"><AlertCircle size={10} /> {errors.phone}</p>}
                     </div>
                     <div className="relative">
                         <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-white h-11 rounded-xl px-4 text-[var(--text)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border border-transparent transition-all shadow-sm appearance-none pr-10 cursor-pointer">
                           <option value="contact">General Inquiry</option>
                           <option value="custom">Bespoke / Custom Order</option>
                           <option value="bulk">Bulk Commission</option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-faint)]">
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                     </div>
                  </div>

                  <div className="relative">
                       <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Subject" className={`w-full bg-white h-11 rounded-xl px-4 text-[var(--text)] text-[14px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border ${errors.subject ? 'border-red-300' : 'border-transparent'} transition-all shadow-sm`} />
                      {errors.subject && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1.5 absolute -bottom-5"><AlertCircle size={10} /> {errors.subject}</p>}
                  </div>

                  <div className="relative">
                       <textarea name="message" value={formData.message} onChange={handleChange} rows={4} placeholder="Describe your vision or inquiry..." className={`w-full bg-white rounded-xl px-4 py-3 text-[var(--text)] text-[14px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border ${errors.message ? 'border-red-300' : 'border-transparent'} transition-all shadow-sm resize-none`} />
                      {errors.message && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1.5 absolute -bottom-5"><AlertCircle size={10} /> {errors.message}</p>}
                  </div>

                  <div>
                     <label className="w-full border border-dashed border-[var(--border)] bg-white/50 hover:bg-white hover:border-[var(--accent)] rounded-xl px-5 py-5 flex items-center justify-center gap-3 cursor-pointer transition-all shadow-sm text-[var(--text-faint)] hover:text-[var(--text-muted)] group">
                          <Upload size={16} strokeWidth={1.5} className="group-hover:text-[var(--accent)] transition-colors shrink-0" />
                          <span className="text-[11px] font-bold tracking-[0.1em] uppercase">{file ? file.name : "Attach Reference Visuals (Optional)"}</span>
                          <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                     </label>
                  </div>

                  <AnimatePresence>
                     {success && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="p-5 mt-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#128C7E] flex gap-3 items-center">
                             <CheckCircle2 size={18} strokeWidth={2} className="shrink-0" />
                             <span className="text-[13px] font-bold tracking-tight">Your inquiry has been successfully dispatched to the artisan.</span>
                          </div>
                        </motion.div>
                     )}
                     {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="p-5 mt-2 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-bold flex gap-3 items-center">
                             <AlertCircle size={18} strokeWidth={2} className="shrink-0" />
                             <span>{error}</span>
                          </div>
                        </motion.div>
                     )}
                  </AnimatePresence>

                   <button disabled={loading} type="submit" className="w-full sm:w-max h-12 mt-2 px-8 rounded-xl bg-[var(--text)] text-white text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[var(--accent)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-3 shadow-md">
                     {loading ? <span className="animate-pulse">Dispatching...</span> : <><span>Send Inquiry</span> <Send size={14} /></>}
                  </button>
               </form>
            </motion.div>
         </div>
      </section>
    </div>
  );
}

```

## File: `frontend/src/app/globals.css`

```css
@import "tailwindcss";

@layer base {
  :root {
    /* ─── Warm Terracotta & Rust Palette ───────────────────────────── */
    /* Backgrounds — warm ivory/linen */
    --bg:           #faf7f3; /* Rich warm ivory */
    --bg-subtle:    #f3ebe0; /* Aged linen */
    --bg-muted:     #e8d9c8; /* Warm sand */

    /* Text — deep charcoal-brown */
    --text:         #2a1f18; /* Espresso dark */
    --text-muted:   #6b5444; /* Warm mahogany mid-tone */
    --text-faint:   #a8896e; /* Soft caramel */

    /* Accents — terracotta & rust */
    --accent:       #b85c3a; /* Rich terracotta */
    --accent-light: #e07c52; /* Burnt rust/orange */
    --accent-glow:  #d4855a; /* Warm amber glow */

    --border:       #ddd0c0; /* Warm linen border */

    /* Shadows */
    --shadow-soft:  0 8px 30px rgba(42, 31, 24, 0.06);
    --shadow-float: 0 20px 50px rgba(184, 92, 58, 0.14);
  }

  html {
    @apply scroll-smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-quicksand), system-ui, sans-serif;
    font-weight: 400;
    overflow-x: hidden;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-quicksand), system-ui, sans-serif;
    font-weight: 600;
    line-height: 1.15;
    color: var(--text);
    letter-spacing: -0.02em;
  }
}

@theme {
  --color-bg:           var(--bg);
  --color-bg-subtle:    var(--bg-subtle);
  --color-bg-muted:     var(--bg-muted);
  
  --color-txt:          var(--text);
  --color-txt-muted:    var(--text-muted);
  
  --color-border:       var(--border);
  --color-accent:       var(--accent);
  --color-accent-light: var(--accent-light);

  --font-serif:    var(--font-playfair), serif;
  --font-sans:     var(--font-quicksand), system-ui, sans-serif;
  --font-quicksand: var(--font-quicksand), system-ui, sans-serif;
  
  --shadow-soft:   var(--shadow-soft);
  --shadow-float:  var(--shadow-float);
  
  --animate-fade-up: fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  --animate-float-slow: float-slow 4s ease-in-out infinite;
  --animate-blob: blob 10s ease-in-out infinite alternate;

  @keyframes fade-up {
    0% { opacity: 0; transform: translateY(15px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes float-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  
  @keyframes blob {
    0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
    100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  }
}

@layer utilities {
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
}

/* Rounded Scrollbar */
::-webkit-scrollbar       { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--bg-muted); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent); }

```

## File: `frontend/src/app/layout.tsx`

```typescript
"use client";

import { Cormorant_Garamond, DM_Sans, Playfair_Display, Quicksand } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import CartDrawer from "@/components/CartDrawer";
import { ReduxProvider } from "@/components/ReduxProvider";
import { usePathname } from "next/navigation";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-quicksand",
});

import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin  = pathname.startsWith("/admin");

  // Fix for cross-page hash navigation
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 500); // Small delay to ensure content is rendered
    }
  }, [pathname]);

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${playfair.variable} ${quicksand.variable} h-full antialiased`}
    >
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ReduxProvider>
          <Toaster position="top-right" />
          {!isAdmin && <Navbar />}
          <main className="flex-grow">
            {children}
          </main>
          {!isAdmin && <Footer />}
          {!isAdmin && <CartDrawer />}
        </ReduxProvider>
      </body>
    </html>
  );
}

```

## File: `frontend/src/app/login/page.tsx`

```typescript
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowLeft, AlertCircle, UserPlus, LogIn, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { login, registerUser, resetAuthError } from '@/redux/slices/authSlice';
import Link from 'next/link';

// Validation Schemas
const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password too short"),
});

const signupSchema = z.object({
    name: z.string().min(2, "Name required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be 6+ chars"),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

const LoginContent = () => {
    const [isLogin, setIsLogin] = useState(true);
    const dispatch = useAppDispatch();
    const { userInfo, loading, error } = useAppSelector((state) => state.auth);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isRegistering, setIsRegistering] = useState(false);
    const redirect = searchParams.get('redirect');

    const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
    const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

    useEffect(() => {
        if (userInfo) {
            if (userInfo.role === 'admin') {
                router.push('/admin');
            } else if (isRegistering) {
                router.push(`/account/profile?redirect=${redirect || '/'}`);
            } else {
                router.push(redirect || '/');
            }
        }
    }, [userInfo, router, redirect, isRegistering]);

    useEffect(() => {
        dispatch(resetAuthError());
    }, [isLogin, dispatch]);

    const onLoginSubmit = (data: LoginForm) => {
        setIsRegistering(false);
        dispatch(login(data));
    };
    const onSignupSubmit = (data: SignupForm) => {
        setIsRegistering(true);
        dispatch(registerUser(data));
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent">
            {/* Back Button */}
            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">
                <ArrowLeft size={16} />
                <span>Return to Shop</span>
            </Link>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Brand Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 text-gold shadow-2xl mb-6 shadow-gold/20">
                        <span className="text-2xl font-bold font-serif italic">M</span>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-zinc-200/50 p-12 border border-zinc-100 flex flex-col items-center">
                    {/* Mode Toggle */}
                    <div className="flex bg-zinc-50 p-1.5 rounded-2xl mb-10 w-full">
                        <button 
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isLogin ? 'bg-white text-zinc-900 shadow-lg shadow-black/5' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            <LogIn size={16} /> Sign In
                        </button>
                        <button 
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${!isLogin ? 'bg-white text-zinc-900 shadow-lg shadow-black/5' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            <UserPlus size={16} /> Sign Up
                        </button>
                    </div>

                    {/* Shared Error Alert */}
                    {error && (
                        <div className="w-full mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {isLogin ? (
                            <motion.form 
                                key="login"
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                                className="w-full space-y-6"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Email Connection</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-gold transition-colors" size={18} />
                                            <input {...loginForm.register('email')} type="email" placeholder="email@address.com" className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-zinc-900 text-sm focus:ring-2 focus:ring-gold/20 transition-all outline-none font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Credentials</label>

                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-gold transition-colors" size={18} />
                                            <input {...loginForm.register('password')} type="password" placeholder="••••••••" className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-zinc-900 text-sm focus:ring-2 focus:ring-gold/20 transition-all outline-none font-medium" />
                                        </div>
                                    </div>
                                </div>
                                <button disabled={loading} type="submit" className="w-full bg-zinc-900 hover:bg-black text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-zinc-900/20 active:scale-95 flex items-center justify-center uppercase tracking-widest text-xs">
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In Securely"}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form 
                                key="signup"
                                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                                onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                                className="w-full space-y-6"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Full Identity</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-gold transition-colors" size={18} />
                                            <input {...signupForm.register('name')} type="text" placeholder="Your Name" className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-zinc-900 text-sm focus:ring-2 focus:ring-gold/20 transition-all outline-none font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-gold transition-colors" size={18} />
                                            <input {...signupForm.register('email')} type="email" placeholder="email@address.com" className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-zinc-900 text-sm focus:ring-2 focus:ring-gold/20 transition-all outline-none font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Security Key</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-gold transition-colors" size={18} />
                                            <input {...signupForm.register('password')} type="password" placeholder="••••••••" className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-zinc-900 text-sm focus:ring-2 focus:ring-gold/20 transition-all outline-none font-medium" />
                                        </div>
                                    </div>
                                </div>
                                <button disabled={loading} type="submit" className="w-full bg-zinc-900 hover:bg-black text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-zinc-900/20 active:scale-95 flex items-center justify-center uppercase tracking-widest text-xs">
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Join the Community"}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

const LoginPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-zinc-900" size={40} />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
};

export default LoginPage;

```

## File: `frontend/src/app/page.tsx`

```typescript
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchProducts } from "@/redux/slices/productSlice";
import { fetchCollections } from "@/redux/slices/collectionSlice";
import { createInquiry } from "@/redux/slices/inquirySlice";
import { RootState } from "@/redux/store";
import { Loader2, Package, CheckCircle2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@/data/products";
import { getImageUrl } from '@/utils/getImageUrl';
import { useCart } from '@/hooks/useCart';

/* ── Inline add-to-cart button — needs hook so must be its own component ── */
function BestSellerAddBtn({ product, className, showText }: { product: Product, className?: string, showText?: boolean }) {
  const { addToCart } = useCart();
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({
          productId: (product as any)._id || String(product.id),
          name:      product.name,
          image:     (product as any).images?.[0] || '',
          price:     product.price,
          quantity:  1,
        });
      }}
      aria-label="Add to cart"
      className={className || "w-9 h-9 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-300 shrink-0"}
    >
      {showText ? "Add to Cart" : <Plus size={14} strokeWidth={2} />}
    </button>
  );
}

export default function Home() {
  const dispatch = useAppDispatch();
  const { products, loading: productsLoading } = useAppSelector((state: RootState) => state.products);
  const { collections, loading: collectionsLoading } = useAppSelector((state: RootState) => state.collections);
  const { success: inquirySuccess, loading: inquiryLoading } = useAppSelector((state: RootState) => state.inquiries);
  
  const [inquiryData, setInquiryData] = useState({ name: '', phone: '', message: '' });

  useEffect(() => {
    dispatch(fetchProducts({ sort: 'newest' }));
    dispatch(fetchCollections());

    // Premium Reveal Animation logic
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    // Parallax Animation logic
    const handleScroll = () => {
      document.querySelectorAll('.parallax').forEach(el => {
        const rect = el.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        // Only animate if in or near viewport
        if (rect.top < viewportHeight && rect.bottom > 0) {
          const speed = parseFloat(el.getAttribute('data-speed') || '0.1');
          const yOffset = (rect.top - viewportHeight / 2) * speed;
          (el as HTMLElement).style.transform = `translate3d(0, ${yOffset}px, 0)`;
        }
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger once on load
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [dispatch]);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('type', 'custom');
    formData.append('name', inquiryData.name);
    formData.append('phone', inquiryData.phone);
    formData.append('message', inquiryData.message);
    formData.append('subject', `Custom Design Request from ${inquiryData.name}`);
    formData.append('email', 'guest@mythrisgleams.com'); 
    dispatch(createInquiry(formData as any));
  };

  // Featured Products (Trending / Top Picks)
  const featuredProducts = (products as Product[]).slice(0, 4);

  return (
    <div className="flex flex-col font-sans">
      <Hero />


      {/* ── CURATED GALLERIES — POTTERY EDITORIAL LAYOUT ── */}
      <section className="w-full py-16 md:py-24">
        <div className="max-w-[1440px] mx-auto px-8 sm:px-12">

          {/* ── TOP HEADER ROW ── */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }} 
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-start mb-14 md:mb-16"
          >

            {/* Left: eyebrow + large heading */}
            <div>
              <span className="text-[var(--text-faint)] text-[10px] font-bold tracking-[0.25em] uppercase mb-4 block">
                Our Product
              </span>
              <h2 className="text-[var(--text)] text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-tight">
                Explore Our<br /> Artisanal Collections
              </h2>
            </div>

            {/* Right: body text + CTA */}
            <div className="flex flex-col items-start justify-center gap-6 pt-0 md:pt-10">
              <p className="text-[var(--text-muted)] text-[15px] leading-relaxed">
                Each piece in our collection is handcrafted by skilled artisans using 
                premium clay — shaped, fired, and finished with care. From functional 
                tableware to sculptural centerpieces, explore a world of texture, warmth, 
                and timeless artisanal beauty.
              </p>
              <Link
                href="/category/all"
                className="inline-block bg-[var(--bg-muted)] hover:bg-[var(--accent)] text-[var(--text)] hover:text-white text-[11px] font-bold tracking-[0.2em] uppercase px-7 py-3 rounded-full transition-colors duration-300"
              >
                All Products
              </Link>
            </div>
          </motion.div>

          {/* ── BOTTOM: 4-CARD GRID ── */}
          {collectionsLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-[var(--accent)]" size={28} />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {collections.slice(0, 4).map((col: any) => (
                <Link
                  key={col._id}
                  href={`/category/${col.slug}`}
                  className="group flex flex-col"
                >
                  {/* Image */}
                  <div className="relative w-full aspect-square rounded-[10px] overflow-hidden bg-[var(--bg-muted)] mb-4 parallax" data-speed="-0.03">
                    {col.image ? (
                      <img
                        src={getImageUrl(col.image)}
                        alt={col.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[var(--text-faint)]">
                        <Package size={40} strokeWidth={1.2} />
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="text-center px-1">
                    <h3 className="text-[var(--text)] text-[15px] font-bold leading-[1.2] mb-1.5 group-hover:text-[var(--accent)] transition-colors duration-300">
                      {col.name}
                    </h3>
                    <p className="text-[var(--text-faint)] text-[13px] leading-relaxed line-clamp-2">
                      {col.description || "Handcrafted with care, shaped by skilled artisans using premium clay."}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── BEST SELLERS — MINIMALIST GALLERY ── */}
      <section id="products" className="w-full py-16 md:py-24 scroll-m-20 bg-white relative overflow-hidden">
        
        <div className="max-w-[1440px] mx-auto px-8 sm:px-12">
          
          {/* ── Unique Header (Centered Watermark Style) ── */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }} 
            transition={{ duration: 0.8 }}
            className="relative mb-20 flex flex-col items-center justify-center text-center"
          >

            <div className="z-10 pt-6 md:pt-12">
              <span className="text-[var(--accent)] text-[10px] font-bold tracking-[0.4em] uppercase mb-4 block">
                 Curated Selection
              </span>
              <h2 className="text-[var(--text)] text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5">
                 Best Selling Miniatures
              </h2>
              <p className="text-[var(--text-muted)] text-[15px] leading-relaxed max-w-md mx-auto">
                 Our most loved creations, meticulously hand-crafted and cherished across the country.
              </p>
            </div>
          </motion.div>

          {/* ── 4-Card Minimalist Grid ── */}
          {productsLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-[var(--accent)]" size={36} />
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center text-[var(--text-faint)] italic text-[16px]">
              No products found in the vault yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {featuredProducts.map((product: Product, i: number) => {
                const productSlug  = product.slug || product.id;
                const productImage = (product as any).images?.[0] ?? null;
                const productPrice = product.price;
                const productMRP   = (product as any).mrp || (product as any).oldPrice;
                const catTitle     = product.category;

                return (
                  <div key={(product as any)._id || product.id}>
                    <ProductCard product={product as any} />
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Centered View All Link */}
          <div className="mt-16 flex justify-center">
             <Link
                href="/category/all"
                className="inline-flex items-center gap-3 text-[var(--accent)] text-[11px] font-bold tracking-[0.2em] uppercase group hover:text-[var(--text)] transition-colors duration-300"
              >
                View Complete Vault
                <span className="inline-block group-hover:translate-x-1 transition-transform duration-300">→</span>
             </Link>
          </div>
        </div>
      </section>

      {/* ── OUR HERITAGE (STORY SECTION) ── */}
      <section className="w-full py-16 md:py-24 bg-white relative overflow-hidden group">
        
        {/* Animated Background Seal (Addon) */}
        <div className="absolute -top-10 -right-20 md:top-10 md:right-10 w-96 h-96 lg:w-[500px] lg:h-[500px] animate-[spin_60s_linear_infinite] opacity-[0.02] pointer-events-none select-none z-0 parallax" data-speed="0.2">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-[var(--text)]">
            <path id="heritageCircle" d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" fill="none" />
            <text className="text-[9px] font-bold tracking-[0.25em] uppercase">
              <textPath href="#heritageCircle" startOffset="0%">
                Mythris Gleams • Handcrafted with love • Since 2018 • Mythris Gleams • Handcrafted with love • Since 2018 • 
              </textPath>
            </text>
          </svg>
        </div>

        <div className="max-w-[1440px] mx-auto px-8 sm:px-12 relative z-10">
          
          <div className="flex items-center gap-4 mb-16 md:mb-24">
            <span className="w-12 h-px bg-[var(--text-faint)]"></span>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--text-faint)]">Our Heritage</span>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }} 
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32"
          >
             {/* Left: The Vision */}
             <div className="relative">
                <h2 className="text-[var(--text)] text-4xl md:text-5xl lg:text-[4rem] font-bold leading-[1.1] tracking-tight mb-10 max-w-xl relative parallax" data-speed="-0.05">
                  From Chennai to <br />
                  <span className="text-[var(--accent)] relative inline-block">
                    across India.
                    {/* Subtle underline animation */}
                    <span className="absolute bottom-2 left-0 w-full h-[6px] bg-[var(--accent)] opacity-20 -z-10 group-hover:h-[60%] transition-all duration-700 ease-out"></span>
                  </span>
                </h2>
                <div className="relative pl-8 md:pl-12 border-l border-[var(--border)]">
                   <div className="absolute top-0 left-[-1.5px] w-[3px] h-16 bg-[var(--accent)]" />
                   <p className="text-[var(--text-muted)] text-[16px] md:text-[18px] leading-relaxed max-w-lg mb-8">
                     Founded by <strong className="text-[var(--text)] font-semibold">Uma Gayathri</strong> in 2018 with a simple vision: to capture fleeting memories and transform them into lasting miniature art. 
                   </p>
                   <p className="text-[var(--text-muted)] text-[15px] leading-relaxed max-w-lg">
                     Today, our atelier has delivered thousands of hand-sculpted smiles, meticulously crafting stories into timeless physical forms.
                   </p>
                   
                   <Link href="/about" className="inline-flex items-center gap-4 mt-12 group/btn">
                     <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--text)] group-hover/btn:text-[var(--accent)] transition-colors duration-300">
                       Read Full Story
                     </span>
                     <span className="w-12 h-px bg-[var(--text)] group-hover/btn:w-20 group-hover/btn:bg-[var(--accent)] transition-all duration-500"></span>
                   </Link>
                </div>
             </div>

             {/* Right: The Pillars */}
             <div className="flex flex-col justify-center">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-12">
                  
                  {/* Pillar 1 */}
                  <div className="group/pillar relative pt-8 pb-6 px-6 -mx-6 rounded-[1.5rem] transition-all duration-500 hover:bg-[var(--bg-subtle)] hover:shadow-[0_8px_30px_rgba(42,31,24,0.06)]">
                     {/* Animated top border */}
                     <div className="absolute top-0 left-6 right-6 h-px bg-[var(--border)] group-hover/pillar:bg-transparent transition-colors duration-300" />
                     <div className="absolute top-0 left-6 w-0 h-[2px] bg-[var(--accent)] group-hover/pillar:w-[60%] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                     
                     <span className="block text-[var(--text-faint)] text-3xl font-light mb-4 group-hover/pillar:text-[var(--accent)] group-hover/pillar:translate-x-1 transition-all duration-500">01</span>
                     <h4 className="text-[var(--text)] text-[14px] font-bold tracking-[0.2em] uppercase mb-3">Hand Sculpted</h4>
                     <p className="text-[var(--text-muted)] text-[14px] leading-relaxed">
                       Every piece is shaped entirely by hand. No molds are used for our main designs, ensuring each creation is wholly unique.
                     </p>
                  </div>
                  
                  {/* Pillar 2 */}
                  <div className="group/pillar relative pt-8 pb-6 px-6 -mx-6 rounded-[1.5rem] transition-all duration-500 hover:bg-[var(--bg-subtle)] hover:shadow-[0_8px_30px_rgba(42,31,24,0.06)]">
                     <div className="absolute top-0 left-6 right-6 h-px bg-[var(--border)] group-hover/pillar:bg-transparent transition-colors duration-300" />
                     <div className="absolute top-0 left-6 w-0 h-[2px] bg-[var(--accent)] group-hover/pillar:w-[60%] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                     
                     <span className="block text-[var(--text-faint)] text-3xl font-light mb-4 group-hover/pillar:text-[var(--accent)] group-hover/pillar:translate-x-1 transition-all duration-500">02</span>
                     <h4 className="text-[var(--text)] text-[14px] font-bold tracking-[0.2em] uppercase mb-3">Hand Painted</h4>
                     <p className="text-[var(--text-muted)] text-[14px] leading-relaxed">
                       Vibrant and delicate detailing is achieved using top quality colors and microscopic brushes for breathtaking precision.
                     </p>
                  </div>

                  {/* Pillar 3 */}
                  <div className="group/pillar relative pt-8 pb-6 px-6 -mx-6 rounded-[1.5rem] transition-all duration-500 hover:bg-[var(--bg-subtle)] hover:shadow-[0_8px_30px_rgba(42,31,24,0.06)]">
                     <div className="absolute top-0 left-6 right-6 h-px bg-[var(--border)] group-hover/pillar:bg-transparent transition-colors duration-300" />
                     <div className="absolute top-0 left-6 w-0 h-[2px] bg-[var(--accent)] group-hover/pillar:w-[60%] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                     
                     <span className="block text-[var(--text-faint)] text-3xl font-light mb-4 group-hover/pillar:text-[var(--accent)] group-hover/pillar:translate-x-1 transition-all duration-500">03</span>
                     <h4 className="text-[var(--text)] text-[14px] font-bold tracking-[0.2em] uppercase mb-3">Premium Clay</h4>
                     <p className="text-[var(--text-muted)] text-[14px] leading-relaxed">
                       Crafted using high-grade, resilient air-dry and polymer clay designed for lifelong durability and a smooth finish.
                     </p>
                  </div>

                  {/* Pillar 4 */}
                  <div className="group/pillar relative pt-8 pb-6 px-6 -mx-6 rounded-[1.5rem] transition-all duration-500 hover:bg-[var(--bg-subtle)] hover:shadow-[0_8px_30px_rgba(42,31,24,0.06)]">
                     <div className="absolute top-0 left-6 right-6 h-px bg-[var(--border)] group-hover/pillar:bg-transparent transition-colors duration-300" />
                     <div className="absolute top-0 left-6 w-0 h-[2px] bg-[var(--accent)] group-hover/pillar:w-[60%] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                     
                     <span className="block text-[var(--text-faint)] text-3xl font-light mb-4 group-hover/pillar:text-[var(--accent)] group-hover/pillar:translate-x-1 transition-all duration-500">04</span>
                     <h4 className="text-[var(--text)] text-[14px] font-bold tracking-[0.2em] uppercase mb-3">Personalized</h4>
                     <p className="text-[var(--text-muted)] text-[14px] leading-relaxed">
                       Themes, names, and concepts perfectly tailored to your memories. You dream it, we sculpt it.
                     </p>
                  </div>

               </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* ── BESPOKE COMMISSION (CUSTOM SECTION) ── */}
      <section id="custom" className="w-full bg-white py-16 md:py-24 border-t border-[var(--border)]">
        <div className="max-w-[1320px] mx-auto px-8 sm:px-12">
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }} 
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center"
          >
            
            {/* Left side: Editorial Typography */}
            <div className="flex flex-col order-2 lg:order-1">
               <div className="inline-block px-4 py-1.5 rounded-full border border-[var(--accent)] text-[var(--accent)] text-[9px] font-bold tracking-[0.3em] uppercase w-max mb-8">
                 Bespoke Service
               </div>

               <h2 className="text-[var(--text)] text-4xl md:text-5xl lg:text-[4.5rem] font-bold leading-[1.05] tracking-tight mb-8">
                 Your story,<br />
                 <span className="text-[var(--text-faint)] italic font-serif font-light">miniaturized.</span>
               </h2>

               <p className="text-[var(--text-muted)] text-[16px] md:text-[18px] leading-[1.8] max-w-md mb-12">
                 We transform your cherished memories, favorite foods, and beloved pets into everlasting miniature art. Share your vision, and we will sculpt it into reality.
               </p>

               <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  <div>
                    <div className="text-[var(--text-faint)] font-light text-3xl mb-2">01</div>
                    <h4 className="text-[var(--text)] text-[12px] font-bold tracking-[0.1em] uppercase mb-2">Share Idea</h4>
                    <p className="text-[var(--text-muted)] text-[13px] leading-relaxed pr-4">Send us your theme, concept, or reference photos.</p>
                  </div>
                  <div>
                    <div className="text-[var(--text-faint)] font-light text-3xl mb-2">02</div>
                    <h4 className="text-[var(--text)] text-[12px] font-bold tracking-[0.1em] uppercase mb-2">Sketch & Design</h4>
                    <p className="text-[var(--text-muted)] text-[13px] leading-relaxed pr-4">We finalize the layout before the clay is touched.</p>
                  </div>
                  <div>
                    <div className="text-[var(--text-faint)] font-light text-3xl mb-2">03</div>
                    <h4 className="text-[var(--text)] text-[12px] font-bold tracking-[0.1em] uppercase mb-2">Hand Sculpt</h4>
                    <p className="text-[var(--text-muted)] text-[13px] leading-relaxed pr-4">Every detail is shaped and painted by artisan hands.</p>
                  </div>
                  <div>
                    <div className="text-[var(--text-faint)] font-light text-3xl mb-2">04</div>
                    <h4 className="text-[var(--text)] text-[12px] font-bold tracking-[0.1em] uppercase mb-2">Delivery</h4>
                    <p className="text-[var(--text-muted)] text-[13px] leading-relaxed pr-4">Packaged securely and shipped right to your door.</p>
                  </div>
               </div>
            </div>

            {/* Right side: The Form */}
            <div className="order-1 lg:order-2 bg-[var(--bg-subtle)] rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden group border border-[var(--border)] shadow-sm">
               {/* Decorative background shape */}
               <div className="absolute -top-32 -right-32 w-80 h-80 bg-[var(--bg-muted)] rounded-full blur-3xl opacity-50 group-hover:bg-[var(--accent)] group-hover:opacity-10 transition-all duration-1000 parallax" data-speed="-0.15" />
               
               <div className="relative z-10">
                 {inquirySuccess ? (
                    <div className="py-20 text-center flex flex-col items-center gap-6">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <CheckCircle2 size={32} className="text-[var(--accent)]" />
                      </div>
                      <h3 className="text-3xl font-bold text-[var(--text)] tracking-tight">Vision Captured.</h3>
                      <p className="text-[var(--text-muted)] text-[15px] max-w-[280px] mx-auto leading-relaxed">Uma Gayathri will reach out via WhatsApp shortly to begin your bespoke collaboration.</p>
                    </div>
                 ) : (
                    <form onSubmit={handleInquirySubmit} className="flex flex-col gap-8">
                      <div>
                        <h3 className="text-[var(--text)] text-[28px] font-bold tracking-tight mb-2">Initiate Narrative</h3>
                        <p className="text-[var(--text-muted)] text-[14px]">We'll respond via WhatsApp within 24 hours.</p>
                      </div>

                      <div className="flex flex-col gap-5 mt-2">
                        <div className="relative">
                          <input
                            required
                            value={inquiryData.name}
                            onChange={(e) => setInquiryData({...inquiryData, name: e.target.value})}
                            type="text"
                            placeholder="Your Name"
                            className="w-full bg-white h-14 rounded-xl px-5 text-[var(--text)] text-[15px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border border-transparent transition-all shadow-sm"
                          />
                        </div>
                        <div className="relative">
                          <input
                            required
                            value={inquiryData.phone}
                            onChange={(e) => setInquiryData({...inquiryData, phone: e.target.value})}
                            type="tel"
                            placeholder="WhatsApp Number"
                            className="w-full bg-white h-14 rounded-xl px-5 text-[var(--text)] text-[15px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border border-transparent transition-all shadow-sm"
                          />
                        </div>
                        <div className="relative">
                          <textarea
                            required
                            value={inquiryData.message}
                            onChange={(e) => setInquiryData({...inquiryData, message: e.target.value})}
                            rows={4}
                            placeholder="Describe your vision..."
                            className="w-full bg-white rounded-xl px-5 py-4 text-[var(--text)] text-[15px] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] border border-transparent transition-all shadow-sm resize-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={inquiryLoading}
                        className="w-full h-14 mt-4 rounded-xl bg-[var(--text)] text-white text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[var(--accent)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-3 shadow-md"
                      >
                        {inquiryLoading && <Loader2 size={16} className="animate-spin" />}
                        {inquiryLoading ? 'Sending...' : 'Submit Request'}
                      </button>
                    </form>
                 )}
               </div>
            </div>

          </motion.div>
        </div>
      </section>
      
      {/* ── WHATSAPP CTA (SLEEK & ELEGANT) ── */}
      <section id="bulk" className="w-full max-w-[1000px] mx-auto px-8 sm:px-12 py-16 md:py-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }} 
          whileInView={{ opacity: 1, scale: 1, y: 0 }} 
          viewport={{ once: true, margin: "-50px" }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white border border-[var(--border)] rounded-[2rem] md:rounded-full p-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm transition-all hover:shadow-md hover:border-[#25D366]/30 group"
        >
          
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0 group-hover:bg-[#25D366]/10 transition-colors duration-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] group-hover:text-[#25D366] transition-colors duration-500">
                 <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
               </svg>
            </div>
            <div>
              <h2 className="text-[var(--text)] text-[16px] font-bold tracking-tight mb-1">
                Events & Corporate Gifting
              </h2>
              <p className="text-[var(--text-muted)] text-[13px]">
                Special rates for bulk orders (25+ units). Custom designs & packaging available.
              </p>
            </div>
          </div>

          <a 
            href="https://wa.me/918300034451" 
            className="shrink-0 bg-white text-[var(--text)] border border-[var(--border)] group-hover:border-[#25D366] group-hover:text-[#25D366] group-hover:bg-[#25D366]/5 rounded-full px-8 py-3 text-[10px] tracking-[0.25em] uppercase font-bold transition-all duration-300"
          >
            Chat on WhatsApp
          </a>
        </motion.div>
      </section>
    </div>
  );
}

```

## File: `frontend/src/app/product/[slug]/page.tsx`

```typescript
"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/hooks/useCart";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchProductBySlug, fetchProducts } from "@/redux/slices/productSlice";
import { Product } from "@/data/products";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from '@/utils/getImageUrl';
import { compressImageFile } from '@/utils/compressImage';
import {
  Loader2, ChevronRight, Truck,
  MessageCircle,
  Minus, Plus, Leaf, Droplets, Wind, Home, Camera, ImageUp, X
} from "lucide-react";

export default function ProductStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const dispatch = useAppDispatch();
  const { selectedProduct, loading, products } = useAppSelector((state: any) => state.products);
  const { addToCart } = useCart();

  const p = selectedProduct as Product | null;
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [customerImage, setCustomerImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState("story");

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
  }, [dispatch, slug]);

  useEffect(() => {
    if (p) {
      dispatch(fetchProducts({}));
      if (p.variants && p.variants.length > 0 && p.variants[0].options.length > 0) {
        if (p.variants[0].type !== 'Color') {
          setSelectedVariant(p.variants[0].options[0]);
        }
      }
      const colorGroup = p.variants?.find((v) => v.type === 'Color');
      if (colorGroup && colorGroup.options?.length > 0) {
        setSelectedColor(colorGroup.options[0]);
      }
    }
  }, [dispatch, p]);

  const handleCustomerImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const dataUrl = await compressImageFile(file);
      setCustomerImage(dataUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const requiresImage = !!((p as any)?.requiresImage);

  const relatedProducts = (products as Product[]).filter(item =>
    (item._id || item.id) !== (p?._id || p?.id)
  ).slice(0, 8);

  const savings = p?.mrp ? p.mrp - p.price : 0;
  const savePct = p?.mrp ? Math.round((savings / p.mrp) * 100) : 0;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // ── Loading State ──
  if (loading || (!p && loading !== false)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[var(--bg)]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Loader2 className="text-[var(--accent)]" size={36} strokeWidth={1.5} />
        </motion.div>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-faint)]">
          Preparing experience...
        </motion.span>
      </div>
    );
  }

  // ── Not Found State ──
  if (!p) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[var(--bg)] px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-20 h-20 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center border border-[var(--border)] shadow-sm">
          <Leaf className="text-[var(--text-faint)]" size={32} strokeWidth={1.5} />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-bold text-[var(--text)] tracking-tight">
          Artifact Not Found
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[var(--text-muted)] text-[15px] max-w-sm leading-relaxed">
          The piece you are looking for may have been archived or no longer exists.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Link href="/category/all" className="mt-4 inline-block px-8 py-3.5 bg-[var(--text)] text-white rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[var(--accent)] transition-all shadow-md">
            Return to Collection
          </Link>
        </motion.div>
      </div>
    );
  }

  const categorySlug = (p as any).categorySlug || p.category?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[var(--bg)] selection:bg-[var(--accent)] selection:text-white">

      {/* ── BACKGROUND IMAGE BREADCRUMB HERO ── */}
      <section className="relative w-full h-[280px] md:h-[340px] flex flex-col items-start justify-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-[1.04]"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />
        <div className="absolute inset-0 bg-[var(--accent)]/10 mix-blend-multiply" />

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-8 sm:px-12 pb-8 md:pb-12 flex flex-col gap-4">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            aria-label="Breadcrumb"
            className="flex items-center gap-2 flex-wrap"
          >
            <Link href="/" className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300">
              <Home size={14} />
            </Link>
            <ChevronRight size={14} className="text-white/30" />
            <Link href="/category/all" className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase hover:text-white transition-all">
              All Products
            </Link>
            {p.category && (
              <>
                <ChevronRight size={14} className="text-white/30" />
                <Link href={`/category/${categorySlug}`} className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase hover:text-white transition-all">
                  {p.category}
                </Link>
              </>
            )}
            <ChevronRight size={14} className="text-white/30" />
            <span className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold tracking-[0.2em] uppercase max-w-[200px] truncate">
              {p.name}
            </span>
          </motion.nav>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <span className="text-white/70 text-[10px] font-bold tracking-[0.25em] uppercase mb-3 block">
              {p.category}
            </span>
            <h1 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.2] tracking-tight max-w-2xl line-clamp-2">
              {p.name}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* ── PRODUCT DETAIL ── */}
      <section className="max-w-[1440px] mx-auto px-8 sm:px-12 pt-10 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start w-full">

        {/* LEFT: Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4 lg:sticky lg:top-[100px]"
        >
          <div className="aspect-square w-full max-h-[65vh] rounded-[2rem] bg-[var(--bg-subtle)] overflow-hidden relative group border border-[var(--border)]">
            <AnimatePresence mode="wait">
              {p.images && p.images.length > 0 ? (
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  src={getImageUrl(p.images[activeImage])}
                  alt={p.name}
                  className="w-full h-full object-contain sm:object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--text-faint)] text-xl font-light">No Image</div>
              )}
            </AnimatePresence>

            {p.stockStatus === 'made-to-order' && (
              <div className="absolute top-5 left-5 pointer-events-none">
                <span className="bg-white/80 backdrop-blur-md px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text)] rounded-full flex items-center gap-2 shadow-sm border border-[var(--border)]">
                  <Leaf size={11} className="text-[var(--accent)]" /> Made to Order
                </span>
              </div>
            )}
          </div>

          {p.images && p.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {p.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-18 h-18 min-w-[4.5rem] min-h-[4.5rem] rounded-xl shrink-0 overflow-hidden transition-all duration-500 border-2 ${activeImage === i ? "border-[var(--accent)] opacity-100" : "border-transparent opacity-50 hover:opacity-80"}`}
                >
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* RIGHT: Details Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-8"
        >
          {/* Category Label + Name */}
          <div className="space-y-2">
            <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-faint)] font-bold">{p.category}</div>
            <h2 className="text-[var(--text)] text-2xl md:text-3xl font-bold leading-[1.2] tracking-tight">
              {p.name}
            </h2>
            {(p as any).description && (
              <p className="text-[var(--text-muted)] text-[15px] leading-relaxed pt-1 max-w-lg">
                {(p as any).description}
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="py-6 border-y border-[var(--border)] flex items-end gap-5">
            <span className="text-4xl font-bold text-[var(--text)] tracking-tight">₹{p.price.toLocaleString()}</span>
            {p.mrp && p.mrp > p.price && (
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[var(--text-faint)] text-xl line-through font-light">₹{p.mrp.toLocaleString()}</span>
                <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
                  Save {savePct}%
                </span>
              </div>
            )}
          </div>

          {/* Form / Actions */}
          <div className="space-y-6">
            {/* Variants */}
            {p.variants && p.variants.length > 0 && p.variants[0].type !== 'Color' && p.variants[0].options.length > 0 && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]">
                  Select {p.variants[0].type === 'Color' ? 'Colour' : p.variants[0].type || 'Option'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {p.variants[0].options.map((s: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(s)}
                      className={`px-5 py-2.5 text-[12px] font-bold tracking-wide rounded-xl transition-all duration-300 ${selectedVariant === s ? 'bg-[var(--text)] text-white' : 'bg-transparent text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Variant */}
            {(() => {
              const colorGroup = p.variants?.find((v) => v.type === 'Color');
              if (!colorGroup || colorGroup.options?.length === 0) return null;
              return (
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]">Select Colour</span>
                  <div className="flex flex-wrap gap-2">
                    {colorGroup.options.map((c: string) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`px-5 py-2.5 text-[12px] font-bold tracking-wide rounded-xl transition-all duration-300 flex items-center gap-2 ${selectedColor === c ? 'bg-[var(--text)] text-white' : 'bg-transparent text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'}`}
                      >
                        <span
                          className={`w-3 h-3 rounded-full border ${selectedColor === c ? 'border-white/40' : 'border-[var(--border)]'}`}
                          style={{ backgroundColor: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c) ? c : undefined }}
                        />
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Customer Image Intake */}
            {requiresImage && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)] flex items-center gap-2">
                  <Camera size={13} className="text-[var(--accent)]" /> Upload Your Photo
                </span>
                {customerImage ? (
                  <div className="relative w-40 aspect-square rounded-xl overflow-hidden border border-[var(--border)] group">
                    <img src={customerImage} alt="Your reference" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCustomerImage("")}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black transition-all"
                      aria-label="Remove photo"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center gap-2 w-40 aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 cursor-pointer transition-all ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploadingImage ? <Loader2 size={20} className="text-[var(--accent)] animate-spin" /> : <ImageUp size={20} className="text-[var(--text-faint)]" />}
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]">{uploadingImage ? 'Processing...' : 'Add image'}</span>
                    <input type="file" accept="image/*" onChange={handleCustomerImage} className="hidden" />
                  </label>
                )}
                <p className="text-[11px] text-[var(--text-faint)]">A clear photo of your reference helps the artisan craft your piece perfectly.</p>
              </div>
            )}

            {/* Qty + Add to Cart */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="flex items-center justify-between w-full sm:w-32 h-12 border border-[var(--border)] rounded-xl px-2 bg-white">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  <Minus size={14} strokeWidth={2} />
                </button>
                <span className="font-bold text-[var(--text)]">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  <Plus size={14} strokeWidth={2} />
                </button>
              </div>

              <button
                className="flex-1 h-12 bg-[var(--text)] text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-[var(--accent)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 shadow-md disabled:opacity-40 disabled:hover:bg-[var(--text)] disabled:hover:translate-y-0 disabled:hover:shadow-md"
                disabled={requiresImage && !customerImage}
                onClick={() => addToCart({
                  productId: (p as any)._id || String(p.id),
                  name: p.name,
                  image: (p as any).images?.[0] || "",
                  price: p.price,
                  quantity: qty,
                  selectedVariant,
                  selectedColor,
                  customerImage,
                })}
              >
                {requiresImage && !customerImage ? "Upload a photo to continue" : "Add to Cart"}
              </button>
            </div>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/918300034451?text=Hello,%20I%20would%20love%20to%20inquire%20about%20the%20${encodeURIComponent(p.name)}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 rounded-xl text-[11px] font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-3 hover:bg-[#25D366]/20 transition-all duration-300"
            >
              <MessageCircle size={16} strokeWidth={2} />
              Ask the Artisan on WhatsApp
            </a>
          </div>

          {/* Tabs */}
          <div className="space-y-5 pt-2 border-t border-[var(--border)]">
            <div className="flex gap-6">
              {[{ id: 'story', label: 'Story' }, { id: 'details', label: 'Details' }, { id: 'shipping', label: 'Shipping' }].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-[12px] font-bold tracking-[0.1em] uppercase transition-all relative ${activeTab === tab.id ? 'text-[var(--text)]' : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'}`}
                >
                  {tab.label}
                  {activeTab === tab.id && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]" />}
                </button>
              ))}
            </div>

            <div className="min-h-[130px] text-[var(--text-muted)] text-[14px] leading-relaxed">
              <AnimatePresence mode="wait">
                {activeTab === 'story' && (
                  <motion.div key="story" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-5">
                    <p>{p.story || "A beautifully handcrafted piece to bring warmth and artistry to your space."}</p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2 text-[13px]">
                        <Droplets size={14} strokeWidth={1.5} className="text-[var(--accent)]" /> Natural Textures
                      </div>
                      <div className="flex items-center gap-2 text-[13px]">
                        <Wind size={14} strokeWidth={1.5} className="text-[var(--accent)]" /> Mindful Creation
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeTab === 'details' && (
                  <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                    <p>{p.details || "Crafted by hand using premium clay. Keep away from direct moisture and clean with a dry, soft cloth."}</p>
                  </motion.div>
                )}
                {activeTab === 'shipping' && (
                  <motion.div key="shipping" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="flex gap-4">
                    <Truck size={18} strokeWidth={1.5} className="text-[var(--accent)] shrink-0 mt-0.5" />
                    <p>Delivered with care across India. Please allow 10–14 days for this handcrafted piece to reach your home.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── RELATED PRODUCTS ── */}
      {relatedProducts.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-8 sm:px-12 py-12 border-t border-[var(--border)] w-full mb-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent)] block">Discover More</span>
                <h2 className="text-[var(--text)] text-2xl md:text-3xl font-bold tracking-tight">You May Also Love</h2>
              </div>
              <Link href="/category/all" className="group flex items-center gap-2 text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors">
                View All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {relatedProducts.map((rp: Product, i: number) => (
                <motion.div
                  key={(rp as any)._id || rp.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: 0.08 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ProductCard product={rp as any} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}
    </div>
  );
}

```

## File: `frontend/src/components/admin/AdminSidebar.tsx`

```typescript
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, 
    ShoppingBag, 
    Users, 
    MessageSquare, 
    LogOut, 
    Package,
    ArrowLeft,
    Layers,
    ShieldCheck,
    Box,
    Globe,
    Inbox
} from 'lucide-react';
import { useAppDispatch } from '@/redux/hooks';
import { logout } from '@/redux/slices/authSlice';

const AdminSidebar = () => {
    const pathname = usePathname();
    const dispatch = useAppDispatch();

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={16} />, path: '/admin' },
        { name: 'Products', icon: <Box size={16} />, path: '/admin/products' },
        { name: 'Collections', icon: <Layers size={16} />, path: '/admin/collections' },
        { name: 'Orders', icon: <ShoppingBag size={16} />, path: '/admin/orders' },
        { name: 'Inquiries', icon: <Inbox size={16} />, path: '/admin/inquiries' },
        { name: 'Customers', icon: <Users size={16} />, path: '/admin/customers' },
    ];

    return (
        <aside className="w-60 h-screen bg-white text-zinc-600 flex flex-col border-r border-zinc-200 flex-shrink-0 relative z-50">
            {/* Professional Logo Area */}
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2 group text-zinc-900 border-b border-zinc-100 pb-5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-bold shadow-md shadow-zinc-900/10 group-hover:scale-105 transition-transform">MG</div>
                    <div>
                        <span className="font-bold tracking-tight text-xs uppercase">Store Admin</span>
                        <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest leading-none mt-0.5 flex items-center gap-1">
                            <ShieldCheck size={8} /> Authorized
                        </div>
                    </div>
                </Link>
            </div>

            {/* Navigation Registry */}
            <nav className="flex-1 px-3 space-y-1 mt-4">
                <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-3 mb-2">Main Menu</div>
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link 
                            key={item.name} 
                            href={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${
                                isActive 
                                    ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/10 font-bold' 
                                    : 'hover:bg-zinc-50 hover:text-zinc-900 text-zinc-500 font-medium'
                            }`}
                        >
                            <span className={`${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-900'} transition-colors`}>{item.icon}</span>
                            <span className="text-[10px] uppercase tracking-[0.1em]">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Protocols Footer */}
            <div className="p-4 space-y-1 border-t border-zinc-100">
                <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900 transition-all font-bold text-[9px] uppercase tracking-widest">
                    <Globe size={14} />
                    <span>View Website</span>
                </Link>
                <button 
                    onClick={() => dispatch(logout())}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-all text-left font-bold text-[9px] uppercase tracking-widest"
                >
                    <LogOut size={14} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;

```

## File: `frontend/src/components/admin/EmptyState.tsx`

```typescript
"use client";

import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
    icon: Icon, 
    title, 
    description, 
    actionLabel, 
    onAction 
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800"
        >
            <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-6 border border-zinc-100 dark:border-zinc-700 shadow-inner">
                <Icon size={40} className="opacity-40" />
            </div>
            
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-serif tracking-tight">
                {title}
            </h3>
            
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed mx-auto font-medium">
                {description}
            </p>

            {actionLabel && (
                <button 
                    onClick={onAction}
                    className="mt-8 flex items-center justify-center gap-2 px-8 py-3.5 bg-zinc-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-zinc-900/20 active:scale-95 transition-all group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    <span>{actionLabel}</span>
                </button>
            )}
        </motion.div>
    );
};

export default EmptyState;

```

## File: `frontend/src/components/admin/ProductModal.tsx`

```typescript
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, 
    Upload, 
    Save, 
    Loader2, 
    Sparkles, 
    PenTool, 
    IndianRupee, 
    Layers, 
    Image as ImageIcon,
    Plus,
    Minus,
    Trash2,
    Palette,
    Camera
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { fetchCollections } from '@/redux/slices/collectionSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { RootState } from '@/redux/store';
import { getImageUrl } from '@/utils/getImageUrl';

const artisanalSchema = z.object({
    name: z.string().min(3, "Name your creation"),
    slug: z.string().min(3, "Unique identifier required"),
    category: z.string().min(1, "Choose a collection"),
    price: z.number().min(1, "Enter artisanal value"),
    mrp: z.number().min(1, "Enter valuation (MRP)"),
    story: z.string().min(10, "Share the inspiration behind this piece"),
    details: z.string().min(5, "Technical details are mandatory"),
    metaDescription: z.string().max(160, "Keep SEO hooks concise").optional(),
    stockStatus: z.enum(['in-stock', 'out-of-stock', 'made-to-order']),
});

type ArtisanalFormData = z.infer<typeof artisanalSchema>;

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => void;
    loading?: boolean;
    initialData?: any; // Data for editing
}

const ArtisanalProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSubmit, loading, initialData }) => {
    const dispatch = useAppDispatch();
    const { collections } = useAppSelector((state: RootState) => state.collections);
    const [mediaItems, setMediaItems] = useState<{ type: 'existing' | 'new', url: string, file?: File }[]>([]);
    const [variants, setVariants] = useState<string[]>(['Small (6 inch)', 'Medium (8 inch)', 'Large (10 inch)']);
    const [colors, setColors] = useState<string[]>([]);
    const [requiresImage, setRequiresImage] = useState(false);

    const COLOR_PALETTE = [
        { name: 'Gold', hex: '#d4af37' },
        { name: 'Red', hex: '#b33a3a' },
        { name: 'Blue', hex: '#3a5ba0' },
        { name: 'Green', hex: '#4a7c59' },
        { name: 'Black', hex: '#1a1a1a' },
        { name: 'White', hex: '#f5f5f5' },
        { name: 'Brown', hex: '#8b5a2b' },
        { name: 'Pink', hex: '#e8a0bf' },
    ];

    const resolveColorHex = (name: string) => {
        const match = COLOR_PALETTE.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (match) return match.hex;
        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(name)) return name;
        return '#d4af37';
    };

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ArtisanalFormData>({
        resolver: zodResolver(artisanalSchema),
        defaultValues: { stockStatus: 'made-to-order' }
    });

    // Auto-Slug Generation Logic
    const productName = watch('name');
    useEffect(() => {
        if (productName) {
            const generatedSlug = productName
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '') // remove special chars
                .replace(/[\s_-]+/g, '-') // replace spaces/underscores with hyphens
                .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
            setValue('slug', generatedSlug);
        }
    }, [productName, setValue]);

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchCollections());
            if (initialData) {
                reset({
                    name: initialData.name,
                    slug: initialData.slug,
                    category: initialData.category,
                    price: initialData.price,
                    mrp: initialData.mrp,
                    story: initialData.story,
                    details: initialData.details,
                    metaDescription: initialData.metaDescription || '',
                    stockStatus: initialData.stockStatus,
                });
                if (initialData.images) {
                    setMediaItems(initialData.images.map((url: string) => ({ type: 'existing', url: getImageUrl(url) })));
                } else {
                    setMediaItems([]);
                }
                const sizeVariants = initialData.variants?.find((v: any) => v.type === 'Size')?.options || [];
                const colorVariants = initialData.variants?.find((v: any) => v.type === 'Color')?.options || [];
                setVariants(Array.isArray(sizeVariants) && sizeVariants.length > 0 ? sizeVariants : []);
                setColors(Array.isArray(colorVariants) ? colorVariants : []);
                setRequiresImage(!!initialData.requiresImage);
            } else {
                reset({ stockStatus: 'made-to-order', name: '', slug: '', category: '', price: 0, mrp: 0, story: '', details: '', metaDescription: '' });
                setMediaItems([]);
                setVariants(['Small (6 inch)', 'Medium (8 inch)', 'Large (10 inch)']);
                setColors([]);
                setRequiresImage(false);
            }
        }
    }, [isOpen, initialData, reset, dispatch]);

    const priceBatch = watch(['price', 'mrp']);
    const discount = priceBatch[1] > priceBatch[0] 
        ? Math.round(((priceBatch[1] - priceBatch[0]) / priceBatch[1]) * 100) 
        : 0;
    const saving = priceBatch[1] - priceBatch[0];

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const newMedia = files.map(file => ({
                type: 'new' as const,
                url: URL.createObjectURL(file), // create temporary URL for preview
                file
            }));
            setMediaItems(prev => [...prev, ...newMedia]);
        }
    };

    const handleRemoveMedia = (index: number) => {
        setMediaItems(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleFormSubmit = (data: ArtisanalFormData) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            formData.append(key, (data as any)[key]);
        });
        
        // Add variants
        const variantPayload: { type: string; options: string[] }[] = [];
        if (variants.length > 0) variantPayload.push({ type: 'Size', options: variants });
        if (colors.length > 0) variantPayload.push({ type: 'Color', options: colors });
        formData.append('variants', JSON.stringify(variantPayload));
        formData.append('requiresImage', String(requiresImage));

        // Add kept existing images
        const existingImagesToKeep = mediaItems.filter(m => m.type === 'existing').map(m => m.url);
        formData.append('existingImages', JSON.stringify(existingImagesToKeep));

        // Add new images
        mediaItems.filter(m => m.type === 'new' && m.file).forEach(m => {
            formData.append('images', m.file as File);
        });
        
        onSubmit(formData);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 30 }}
                        className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Elegant Header */}
                        <div className="px-12 py-10 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30">
                            <div>
                                <h2 className="text-3xl font-bold font-serif italic text-zinc-900 tracking-tight">Artisanal Catalog Intake</h2>
                                <p className="text-zinc-500 text-xs font-medium uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                    <Sparkles size={14} className="text-gold" /> Master Template: Mythris Gleams
                                </p>
                            </div>
                            <button onClick={onClose} className="p-4 rounded-3xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all active:scale-95">
                                <X size={28} />
                            </button>
                        </div>

                        {/* Body - Split Columns */}
                        <div className="flex-1 overflow-y-auto p-12">
                            <form id="artisanal-form" onSubmit={handleSubmit(handleFormSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                                
                                {/* Left Side: Media & Variants (5 cols) */}
                                <div className="lg:col-span-5 space-y-12">
                                    {/* Image Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 flex items-center gap-2">
                                                <ImageIcon size={14} /> Visual Narrative
                                            </label>
                                            <span className="text-[10px] font-medium text-zinc-400 italic">First image is Master Image</span>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {mediaItems.length > 0 ? (
                                                <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-zinc-100 relative group">
                                                    <img src={getImageUrl(mediaItems[0].url)} alt="Master" className="w-full h-full object-cover" />
                                                    <div className="absolute top-4 left-4 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/20">
                                                        Master Visual
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleRemoveMedia(0)}
                                                        className="absolute top-4 right-4 bg-rose-500/80 hover:bg-rose-600 text-white p-2 rounded-full transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 shadow-xl"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="aspect-[4/3] rounded-[2.5rem] border-2 border-dashed border-zinc-200 hover:border-gold hover:bg-gold/5 transition-all flex flex-col items-center justify-center cursor-pointer group">
                                                    <Upload size={40} className="text-zinc-300 group-hover:text-gold group-hover:-translate-y-2 transition-all" />
                                                    <span className="mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Initiate Master Image Upload</span>
                                                    <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                                                </label>
                                            )}

                                            <div className="grid grid-cols-4 gap-4">
                                                {mediaItems.slice(1).map((item, i) => (
                                                    <div key={i} className="aspect-square rounded-2xl border border-zinc-100 overflow-hidden relative group">
                                                        <img src={getImageUrl(item.url)} alt="Sub" className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleRemoveMedia(i + 1)}
                                                            className="absolute inset-0 bg-rose-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {mediaItems.length > 0 && (
                                                    <label className="aspect-square rounded-2xl border-2 border-dashed border-zinc-100 hover:border-gold hover:bg-gold/5 flex items-center justify-center cursor-pointer transition-all">
                                                        <Plus size={20} className="text-zinc-300" />
                                                        <input type="file" multiple onChange={handleImageChange} className="hidden" accept="image/*" />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Variant Section */}
                                    <div className="space-y-6 pt-6">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 flex items-center gap-2">
                                                <Layers size={14} /> Dimensional Variations
                                            </label>
                                            <span className="text-[10px] font-medium text-zinc-400 italic">Select or Create</span>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Predefined Suggestions */}
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    'Small (6 inch)', 
                                                    'Medium (8 inch)', 
                                                    'Large (10 inch)',
                                                    'Miniature (4 inch)',
                                                    'XL (12 inch)'
                                                ].map(suggestion => (
                                                    <button
                                                        key={suggestion}
                                                        type="button"
                                                        onClick={() => {
                                                            if (!variants.includes(suggestion)) {
                                                                setVariants(prev => [...prev, suggestion]);
                                                            }
                                                        }}
                                                        className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-zinc-100 bg-zinc-50 hover:border-gold hover:text-gold hover:bg-gold/5 transition-all text-zinc-400"
                                                    >
                                                        + {suggestion}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Custom Input */}
                                            <div className="flex gap-2">
                                                <input 
                                                    id="custom-variant-input"
                                                    placeholder="Enter custom dimension..."
                                                    className="flex-1 bg-zinc-50 border-none rounded-xl px-4 py-3 text-xs font-medium focus:ring-1 focus:ring-gold/20 outline-none transition-all"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = (e.target as HTMLInputElement).value.trim();
                                                            if (val && !variants.includes(val)) {
                                                                setVariants(prev => [...prev, val]);
                                                                (e.target as HTMLInputElement).value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const input = document.getElementById('custom-variant-input') as HTMLInputElement;
                                                        const val = input.value.trim();
                                                        if (val && !variants.includes(val)) {
                                                            setVariants(prev => [...prev, val]);
                                                            input.value = '';
                                                        }
                                                    }}
                                                    className="bg-gold/10 text-gold p-3 rounded-xl hover:bg-gold hover:text-white transition-all active:scale-95"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>

                                            {/* Active Variants List */}
                                            <div className="grid grid-cols-1 gap-2 pt-2">
                                                <AnimatePresence>
                                                    {variants.map((v, i) => (
                                                        <motion.div 
                                                            key={v}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 10 }}
                                                            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 font-bold text-xs text-zinc-700 shadow-sm group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                                                                {v}
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setVariants(prev => prev.filter(item => item !== v))}
                                                                className="p-1 px-2.5 rounded-lg hover:bg-rose-50 text-zinc-200 hover:text-rose-500 transition-all font-black text-[10px] uppercase tracking-widest"
                                                            >
                                                                Remove
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Color Section */}
                                    <div className="space-y-6 pt-6">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 flex items-center gap-2">
                                                <Palette size={14} /> Colour Palette
                                            </label>
                                            <span className="text-[10px] font-medium text-zinc-400 italic">Select or Create</span>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Predefined Suggestions */}
                                            <div className="flex flex-wrap gap-2">
                                                {COLOR_PALETTE.map(suggestion => (
                                                    <button
                                                        key={suggestion.name}
                                                        type="button"
                                                        onClick={() => {
                                                            if (!colors.includes(suggestion.name)) {
                                                                setColors(prev => [...prev, suggestion.name]);
                                                            }
                                                        }}
                                                        className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-zinc-100 bg-zinc-50 hover:border-gold hover:text-gold hover:bg-gold/5 transition-all text-zinc-400 flex items-center gap-1.5"
                                                    >
                                                        <span className="w-2.5 h-2.5 rounded-full border border-zinc-200" style={{ backgroundColor: suggestion.hex }} />
                                                        + {suggestion.name}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Custom Input */}
                                            <div className="flex gap-2 items-center">
                                                <input 
                                                    id="custom-color-input"
                                                    placeholder="Enter custom colour (name or #hex)..."
                                                    className="flex-1 bg-zinc-50 border-none rounded-xl px-4 py-3 text-xs font-medium focus:ring-1 focus:ring-gold/20 outline-none transition-all"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = (e.target as HTMLInputElement).value.trim();
                                                            if (val && !colors.includes(val)) {
                                                                setColors(prev => [...prev, val]);
                                                                (e.target as HTMLInputElement).value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const input = document.getElementById('custom-color-input') as HTMLInputElement;
                                                        const val = input.value.trim();
                                                        if (val && !colors.includes(val)) {
                                                            setColors(prev => [...prev, val]);
                                                            input.value = '';
                                                        }
                                                    }}
                                                    className="bg-gold/10 text-gold p-3 rounded-xl hover:bg-gold hover:text-white transition-all active:scale-95"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>

                                            {/* Active Colors List */}
                                            <div className="grid grid-cols-1 gap-2 pt-2">
                                                <AnimatePresence>
                                                    {colors.map((c) => (
                                                        <motion.div 
                                                            key={c}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 10 }}
                                                            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 font-bold text-xs text-zinc-700 shadow-sm group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-4 h-4 rounded-full border border-zinc-200" style={{ backgroundColor: resolveColorHex(c) }} />
                                                                {c}
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setColors(prev => prev.filter(item => item !== c))}
                                                                className="p-1 px-2.5 rounded-lg hover:bg-rose-50 text-zinc-200 hover:text-rose-500 transition-all font-black text-[10px] uppercase tracking-widest"
                                                            >
                                                                Remove
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Image Intake Toggle */}
                                    <div className="space-y-6 pt-6">
                                        <div className="p-8 bg-zinc-50 rounded-[2rem] border border-zinc-100 flex items-center justify-between gap-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                                                    <Camera size={18} className="text-gold" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block">Collect Customer Image</label>
                                                    <p className="text-[11px] font-medium text-zinc-400 italic mt-1 max-w-[260px]">Require the buyer to upload a personal image (photo / reference) with this product.</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setRequiresImage(prev => !prev)}
                                                className={`w-16 h-8 rounded-full transition-all flex items-center px-1 ${requiresImage ? 'bg-gold justify-end' : 'bg-zinc-300 justify-start'}`}
                                            >
                                                <span className="w-6 h-6 rounded-full bg-white shadow-md transition-all" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Information Narrative (7 cols) */}
                                <div className="lg:col-span-7 space-y-12">
                                    {/* Core Info */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Creation Name</label>
                                            <input {...register('name')} placeholder="e.g. Traditional Samosa Miniature Clock" className="w-full bg-zinc-50 border-none rounded-2xl p-5 text-zinc-900 font-bold focus:ring-2 focus:ring-gold/20 outline-none transition-all placeholder:text-zinc-200" />
                                            {errors.name && <p className="text-[10px] font-black text-rose-500 ml-1 uppercase">{errors.name.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Reference Slug</label>
                                            <input {...register('slug')} placeholder="slug-path" className="w-full bg-zinc-50 border-none rounded-2xl p-5 text-zinc-900 font-mono text-xs focus:ring-2 focus:ring-gold/20 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Collection</label>
                                            <select {...register('category')} className="w-full bg-zinc-50 border-none rounded-2xl p-5 text-zinc-900 font-bold focus:ring-2 focus:ring-gold/20 outline-none transition-all appearance-none cursor-pointer">
                                                <option value="">Select Gallery...</option>
                                                {collections.map((col: any) => (
                                                    <option key={col._id} value={col.name}>{col.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Pricing Narrative */}
                                    <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white">
                                        <label className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-6 block">Valuation Spectrum</label>
                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black tracking-widest text-zinc-400 ml-1">Artisanal Price</label>
                                                <div className="relative">
                                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" size={18} />
                                                    <input {...register('price', { valueAsNumber: true })} type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-12 text-2xl font-black text-white focus:ring-1 focus:ring-gold outline-none" placeholder="0.00" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black tracking-widest text-zinc-400 ml-1">Valuation (MRP)</label>
                                                <div className="relative">
                                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                                    <input {...register('mrp', { valueAsNumber: true })} type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-12 text-sm font-bold text-zinc-400 focus:ring-1 focus:ring-white/20 outline-none" placeholder="0.00" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {(saving > 0) && (
                                            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Commercial Incentive:</span>
                                                <div className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                                    <span className="bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">Save ₹{saving}</span>
                                                    <span className="text-gold italic font-serif text-lg">({discount}% Off)</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Textual Narrative */}
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                <PenTool size={14} className="text-gold" /> The Story (Inspiration)
                                            </div>
                                            <textarea 
                                                {...register('story')} 
                                                rows={5} 
                                                placeholder="Share the inspiration, the culture, and the artisanal journey that created this piece..." 
                                                className="w-full bg-zinc-50 border-none rounded-[2rem] p-8 text-sm leading-relaxed font-medium italic focus:ring-2 focus:ring-gold/20 outline-none transition-all placeholder:text-zinc-200"
                                            />
                                            {errors.story && <p className="text-[10px] font-black text-rose-500 ml-1 uppercase">{errors.story.message}</p>}
                                        </div>
                                        <div className="space-y-3">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">The Technical Details</div>
                                            <textarea 
                                                {...register('details')} 
                                                rows={3} 
                                                placeholder="Materials: Clay, Resin, etc. Dimensions: ... Weight: ..." 
                                                className="w-full bg-zinc-50 border-none rounded-[1.5rem] p-8 text-xs leading-relaxed font-bold tracking-tight text-zinc-500 focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                                            />
                                            {errors.details && <p className="text-[10px] font-black text-rose-500 ml-1 uppercase">{errors.details.message}</p>}
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                <Sparkles size={14} className="text-gold" /> SEO Meta Narrative (Search View)
                                            </div>
                                            <textarea 
                                                {...register('metaDescription')} 
                                                rows={3} 
                                                placeholder="Brief summary for Google results. Keep this between 50-160 characters for maximum visibility..." 
                                                className="w-full bg-zinc-50 border-none rounded-[1.5rem] p-8 text-xs leading-relaxed font-medium text-zinc-400 focus:ring-2 focus:ring-zinc-900/10 outline-none transition-all italic"
                                            />
                                            {errors.metaDescription && <p className="text-[10px] font-black text-rose-500 ml-1 uppercase">{errors.metaDescription.message}</p>}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Stately Footer */}
                        <div className="px-12 py-10 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-6">
                            <button onClick={onClose} className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 hover:text-zinc-500 transition-colors">Abort Cataloging</button>
                            <button 
                                form="artisanal-form" 
                                type="submit" 
                                disabled={loading}
                                className="px-14 py-5 bg-zinc-900 hover:bg-black text-white rounded-[2rem] font-bold tracking-[0.2em] uppercase text-xs flex items-center gap-4 shadow-2xl shadow-zinc-900/30 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                    <>
                                        <Save size={20} className="text-gold" />
                                        <span>Secure to Gallery</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ArtisanalProductModal;

```

## File: `frontend/src/components/AnnouncementBar.tsx`

```typescript
export default function AnnouncementBar() {
  return (
    <div className="bg-brown text-gold-light text-center text-[0.78rem] tracking-[0.12em] py-[9px] px-4 uppercase overflow-hidden whitespace-nowrap">
      <span>✨ Free shipping on orders above ₹999</span>
      <span className="mx-6">·</span>
      <span>🎁 Custom & Bulk Orders Available</span>
      <span className="mx-6">·</span>
      <span>📦 Pan India Delivery</span>
    </div>
  );
}

```

## File: `frontend/src/components/Breadcrumb.tsx`

```typescript
"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="w-full relative z-40 bg-gradient-to-b from-[#fdfdfb] to-[#fdfdfb]/80 backdrop-blur-md sticky top-0 border-b border-[#e8e4db]/50">
      <nav className="max-w-[1400px] mx-auto px-6 sm:px-12 py-5 flex items-center overflow-x-auto no-scrollbar">
        <ol className="flex items-center space-x-2 sm:space-x-4 min-w-max">
          <motion.li 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center"
          >
            <Link 
              href="/" 
              className="w-9 h-9 rounded-full bg-[#f8f6f3] flex items-center justify-center text-[#8c8273] hover:text-white hover:bg-[#a69076] transition-all duration-300 shadow-sm border border-[#e8e4db]"
              aria-label="Home"
            >
              <Home size={16} />
            </Link>
          </motion.li>

          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: (index + 1) * 0.1 }}
                className="flex items-center space-x-2 sm:space-x-4"
              >
                <ChevronRight size={16} className="text-[#dcd7ce]" />
                {isLast || !item.href ? (
                  <div className="px-5 py-2 rounded-full bg-[#594a3c] text-white text-[11px] font-medium tracking-[0.1em] shadow-md uppercase">
                    {item.label}
                  </div>
                ) : (
                  <Link 
                    href={item.href}
                    className="group relative px-5 py-2 rounded-full bg-[#f8f6f3] text-[#8c8273] text-[11px] font-medium tracking-[0.1em] hover:text-[#594a3c] transition-colors border border-[#e8e4db] uppercase"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-1/2 w-0 h-[2px] bg-[#a69076] transition-all duration-300 group-hover:w-1/2 group-hover:-translate-x-1/2"></span>
                    <span className="absolute -bottom-1 right-1/2 w-0 h-[2px] bg-[#a69076] transition-all duration-300 group-hover:w-1/2 group-hover:translate-x-1/2"></span>
                  </Link>
                )}
              </motion.li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

```

## File: `frontend/src/components/BreadcrumbHero.tsx`

```typescript
"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ChevronRight } from "lucide-react";

export type HeroBreadcrumbItem = {
  label: React.ReactNode;
  href?: string;
};

interface BreadcrumbHeroProps {
  items: HeroBreadcrumbItem[];
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  heightClass?: string;
}

export default function BreadcrumbHero({
  items,
  eyebrow,
  title,
  heightClass = "h-[320px] md:h-[380px]",
}: BreadcrumbHeroProps) {
  return (
    <section className={`relative w-full ${heightClass} flex flex-col items-start justify-end overflow-hidden`}>
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-[1.04]"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      />
      {/* Multi-stop dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />
      {/* Warm terracotta tint */}
      <div className="absolute inset-0 bg-[var(--accent)]/10 mix-blend-multiply" />

      {/* Content anchored to bottom-left */}
      <div className="relative z-10 w-full max-w-[1320px] mx-auto px-8 sm:px-12 pb-12 md:pb-16 flex flex-col gap-5">

        {/* Breadcrumb trail */}
        <motion.nav
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          aria-label="Breadcrumb"
          className="flex items-center gap-2 flex-wrap"
        >
          <Link href="/" className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300">
            <Home size={14} />
          </Link>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight size={14} className="text-white/30" />
              {item.href ? (
                <Link href={item.href} className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase hover:text-white transition-all">
                  {item.label}
                </Link>
              ) : (
                <span className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold tracking-[0.2em] uppercase">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </motion.nav>

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          {eyebrow && (
            <span className="text-white/70 text-[10px] font-bold tracking-[0.25em] uppercase mb-4 block">
              {eyebrow}
            </span>
          )}
          <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-tight">
            {title}
          </h1>
        </motion.div>
      </div>
    </section>
  );
}
```

## File: `frontend/src/components/CartDrawer.tsx`

```typescript
"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { CartItem } from "@/redux/slices/cartSlice";
import { getImageUrl } from '@/utils/getImageUrl';

export default function CartDrawer() {
  const { items, isOpen, close, setQty, remove, totalPrice, totalItems, loading } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[998]"
            onClick={close}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[420px] max-w-[100vw] bg-[var(--bg)] z-[999] flex flex-col shadow-2xl border-l border-[var(--border)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--border)]">
              <div>
                <h2 className="text-[var(--text)] text-xl md:text-2xl font-bold tracking-tight leading-tight">Your Collection</h2>
                <p className="text-[var(--text-faint)] text-[10px] font-bold uppercase tracking-[0.25em] mt-1">{totalItems} piece{totalItems !== 1 ? "s" : ""} selected</p>
              </div>
              <button
                onClick={close}
                className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--text)] hover:text-white transition-all"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-grow overflow-y-auto px-8 py-6 flex flex-col gap-6">
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-[var(--text-faint)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
                  <div className="w-20 h-20 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center">
                    <ShoppingBag size={28} className="text-[var(--text-faint)]/60" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[var(--text)] text-2xl font-bold tracking-tight">Your cart is empty</p>
                    <p className="text-[var(--text-muted)] text-[15px] leading-relaxed mt-1 max-w-[220px]">
                      Discover handcrafted pieces to fill your home with warmth.
                    </p>
                  </div>
                  <button
                    onClick={close}
                    className="mt-2 px-8 py-3 bg-[var(--text)] text-white rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[var(--accent)] transition-all"
                  >
                    Browse Collection
                  </button>
                </div>
              )}

              {!loading && items.map((item: CartItem) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  className="flex gap-4 pb-6 border-b border-[var(--border)] last:border-0"
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[var(--bg-subtle)] border border-[var(--border)] shrink-0">
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-faint)] text-xs font-light italic">No image</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-grow flex flex-col gap-1">
                    <h4 className="text-[var(--text)] text-[15px] font-bold leading-tight">{item.name}</h4>
                    {(item.selectedVariant || item.selectedColor) && (
                      <span className="text-[10px] text-[var(--text-faint)] font-bold uppercase tracking-[0.15em]">
                        {[item.selectedVariant, item.selectedColor].filter(Boolean).join(" · ")}
                      </span>
                    )}
                    {item.customerImage && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <img src={item.customerImage} alt="Your photo" className="w-6 h-6 rounded-md object-cover border border-[var(--border)]" />
                        <span className="text-[9px] text-[var(--text-faint)] font-medium">Your photo</span>
                      </div>
                    )}
                    <span className="text-[14px] font-bold text-[var(--text)] mt-0.5">₹{item.price.toLocaleString()}</span>

                    {/* Qty control */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-[var(--border)] rounded-xl overflow-hidden bg-white">
                        <button
                          onClick={() => setQty(item, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] transition-colors"
                        >
                          <Minus size={12} strokeWidth={2} />
                        </button>
                        <span className="w-8 text-center text-[13px] font-bold text-[var(--text)]">{item.quantity}</span>
                        <button
                          onClick={() => setQty(item, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] transition-colors"
                        >
                          <Plus size={12} strokeWidth={2} />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(item)}
                        className="text-[var(--text-faint)] hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="text-right shrink-0">
                    <span className="text-[var(--text)] text-[15px] font-bold">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-8 py-6 border-t border-[var(--border)] bg-white space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Subtotal</span>
                  <span className="text-[var(--text)] text-xl md:text-2xl font-bold tracking-tight">₹{totalPrice.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-[var(--text-faint)]">Shipping & taxes calculated at checkout.</p>

                <Link
                  href="/checkout"
                  onClick={close}
                  className="w-full h-14 bg-[var(--text)] text-white rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[var(--accent)] transition-all flex items-center justify-center gap-3"
                >
                  Proceed to Checkout <ArrowRight size={15} strokeWidth={1.5} />
                </Link>
                <a
                  href={`https://wa.me/918300034451?text=${encodeURIComponent(`Hi! I'd like to order: ${items.map(c => `${c.name}${[c.selectedVariant, c.selectedColor].filter(Boolean).length ? ` (${[c.selectedVariant, c.selectedColor].filter(Boolean).join(", ")})` : ""} x${c.quantity}${c.customerImage ? " [photo attached]" : ""}`).join(", ")}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 bg-[#25D366] text-white rounded-xl text-[12px] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  💬 Order via WhatsApp
                </a>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

## File: `frontend/src/components/Footer.tsx`

```typescript
"use client";

import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const { collections } = useAppSelector((state: RootState) => state.collections);

  // Fallback collections if none are fetched yet
  const displayCollections = collections.length > 0 
    ? collections.slice(0, 5) 
    : [
        { name: "Miniature Food Clocks", slug: "miniature-food-clocks" },
        { name: "Kawaii Collections", slug: "kawaii-collections" },
        { name: "Personalized Gifts", slug: "personalized-gifts" },
        { name: "Jewellery", slug: "jewellery" },
      ];

  return (
    <footer className="bg-[var(--text)] text-white pt-20 md:pt-32 pb-8 border-t border-[var(--border)] relative overflow-hidden">
      
      {/* Massive Brand Watermark */}
      <div className="absolute top-0 left-0 w-full flex justify-center pointer-events-none select-none overflow-hidden opacity-5">
        <h2 className="font-serif text-[18vw] leading-[0.8] tracking-tighter uppercase whitespace-nowrap pt-8">
          Mythris Gleams
        </h2>
      </div>

      <div className="max-w-[1440px] mx-auto px-8 sm:px-12 relative z-10">
        
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-10 border-b border-white/10 pb-16 mb-16">
          <div className="text-center md:text-left flex flex-col gap-2">
            <Link href="/" className="font-serif text-3xl md:text-4xl font-semibold tracking-wide text-white hover:text-[var(--accent-light)] transition-colors duration-300">
              Mythris Gleams
            </Link>
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/70">Handcrafted in Chennai, India</span>
          </div>
          
          {/* Social Icons */}
          <div className="flex gap-4">
            <a href="https://instagram.com/mythrisgleams" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-[var(--text)] transition-all duration-300 hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="https://facebook.com/mythrisgleams" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-[var(--text)] transition-all duration-300 hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://youtube.com/mythrisgleams" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-[var(--text)] transition-all duration-300 hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.1C2.1 8.4 2 10.2 2 12s.1 3.6.5 4.9a3.2 3.2 0 0 0 2.2 2.2C6 19.5 12 19.5 12 19.5s6 0 7.3-.4a3.2 3.2 0 0 0 2.2-2.2C21.9 15.6 22 13.8 22 12s-.1-3.6-.5-4.9a3.2 3.2 0 0 0-2.2-2.2C18 4.5 12 4.5 12 4.5s-6 0-7.3.4A3.2 3.2 0 0 0 2.5 7.1z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
            </a>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-20">
          
          {/* About */}
          <div className="lg:pr-8">
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--accent-light)] mb-8">
              The Artisan
            </h4>
            <p className="text-[14px] text-white/80 leading-[1.8] font-light">
              Handcrafting souls into clay pieces. Every miniature, every gift is meticulously sculpted and painted by Uma Gayathri in her studio, designed to evoke nostalgia and wonder.
            </p>
          </div>

          {/* Collections */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--accent-light)] mb-8">
              Curated Collections
            </h4>
            <ul className="flex flex-col gap-5">
              {displayCollections.map((col: any) => (
                <li key={col.slug}>
                  <Link href={`/category/${col.slug}`} className="text-[14px] text-white/90 hover:text-[var(--accent-light)] hover:pl-2 transition-all duration-300 font-light block w-max">
                    {col.name}
                  </Link>
                </li>
              ))}
              <li className="pt-3">
                <Link href="/category/all" className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/80 hover:text-white transition-colors duration-300 border-b border-transparent hover:border-white pb-1">
                  Explore All →
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--accent-light)] mb-8">
              Client Care
            </h4>
            <ul className="flex flex-col gap-5">
              {[
                { name: "Track Order", href: "/account/orders" },
                { name: "Custom Orders", href: "/#custom" },
                { name: "Bulk Gifting", href: "/#bulk" },
                { name: "Shipping Policy", href: "/#shipping" },
                { name: "Care Instructions", href: "/#care" },
                { name: "Contact Us", href: "/contact" },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-[14px] text-white/90 hover:text-[var(--accent-light)] hover:pl-2 transition-all duration-300 font-light block w-max">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Studio */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--accent-light)] mb-8">
              The Studio
            </h4>
            <div className="flex flex-col gap-6 text-[14px] text-white/80 font-light">
              <div className="flex items-start gap-4 hover:text-[var(--accent-light)] transition-colors duration-300 cursor-default">
                <MapPin size={18} className="shrink-0 text-white/60 mt-1" strokeWidth={1.5} />
                <p className="leading-relaxed">Mythris Gleams Studio,<br />Chrompet, Chennai,<br />Tamil Nadu - 600044</p>
              </div>
              <div className="flex items-center gap-4 hover:text-[var(--accent-light)] transition-colors duration-300 cursor-default">
                <Mail size={18} className="shrink-0 text-white/60" strokeWidth={1.5} />
                <p>mythrisgleams@gmail.com</p>
              </div>
              <div className="flex items-center gap-4 hover:text-[var(--accent-light)] transition-colors duration-300 cursor-default">
                <Phone size={18} className="shrink-0 text-white/60" strokeWidth={1.5} />
                <p>+91 83000 34451</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 pt-8 pb-4 mt-auto">
        <div className="max-w-[1440px] mx-auto px-8 sm:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[11px] tracking-[0.15em] text-white/60 text-center md:text-left font-semibold uppercase">
            © {new Date().getFullYear()} MYTHRIS GLEAMS. ALL RIGHTS RESERVED. <br className="md:hidden" />
            <span className="hidden md:inline"> · </span> HANDCRAFTED IN INDIA.
          </p>
          <div className="flex gap-8">
            <Link href="/#privacy" className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60 hover:text-[var(--accent-light)] transition-colors duration-300">Privacy Policy</Link>
            <Link href="/#terms" className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60 hover:text-[var(--accent-light)] transition-colors duration-300">Terms of Service</Link>
          </div>
        </div>
      </div>

    </footer>
  );
}

```

## File: `frontend/src/components/Hero.tsx`

```typescript
"use client";

import React from "react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section 
      className="relative w-full min-h-[100svh] flex items-center justify-center overflow-hidden bg-fixed bg-cover bg-center bg-no-repeat" 
      style={{ backgroundImage: "url('/sofa-bg.jpg')" }}
      id="hero"
    >
      {/* Subtle overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/10 mix-blend-multiply z-0"></div>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-8 sm:px-12 h-full flex flex-col md:flex-row pt-32 pb-12">
        
        {/* ── Left Side: Glass Typography Panel ── */}
        <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center h-full min-h-[60vh]">
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/10 backdrop-blur-xl border border-white/30 rounded-[1.5rem] p-10 md:p-14 shadow-2xl flex flex-col items-start relative z-20"
          >
            
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-white/70 text-[10px] font-bold tracking-[0.25em] uppercase mb-4 block"
            >
              Handmade in India
            </motion.span>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="text-white text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-tight mb-6"
            >
              Handcrafted Miniature <br /> Food Clock & <br /> Unique Gift Items
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-white/80 text-[15px] leading-relaxed mb-10 max-w-sm"
            >
              Each piece tells a story. Our collection brings art to your walls — meticulously sculpted by hand, designed to delight, and perfect for gifting.
            </motion.p>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="px-8 py-3 rounded-full border border-white text-white text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors duration-300"
            >
              Shop Now
            </motion.button>
            
          </motion.div>
        </div>

        {/* ── Right Side Bottom: 3 Feature Cards ── */}
        <div className="w-full md:w-[55%] lg:w-[60%] flex items-end justify-end mt-12 md:mt-0 relative z-20">
          <div className="flex flex-wrap md:flex-nowrap items-end gap-4">

            {/* Card 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-36 h-44 md:w-40 md:h-48 overflow-hidden rounded-2xl shadow-xl hover:-translate-y-2 transition-transform duration-300 cursor-pointer group border border-white/20"
            >
              <img
                src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&q=80"
                alt="Wooden Products"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
              <span className="absolute bottom-4 left-0 right-0 text-center text-white text-[10px] font-bold tracking-[0.2em] uppercase">Products</span>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-36 h-44 md:w-40 md:h-48 overflow-hidden rounded-2xl shadow-xl hover:-translate-y-2 transition-transform duration-300 cursor-pointer group border border-white/20"
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
                alt="Features"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                style={{ filter: "sepia(0.3) saturate(0.8)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
              <span className="absolute bottom-4 left-0 right-0 text-center text-white text-[10px] font-bold tracking-[0.2em] uppercase">Features</span>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-36 h-44 md:w-40 md:h-48 overflow-hidden rounded-2xl shadow-xl hover:-translate-y-2 transition-transform duration-300 cursor-pointer group border border-white/20"
            >
              <img
                src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80"
                alt="Bio Plates"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
              <span className="absolute bottom-4 left-0 right-0 text-center text-white text-[10px] font-bold tracking-[0.2em] uppercase">Bio</span>
            </motion.div>

          </div>
        </div>

      </div>
    </section>
  );
}

```

## File: `frontend/src/components/Navbar.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Hexagon, ChevronDown, ShoppingBag } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCollections } from "@/redux/slices/collectionSlice";
import { RootState } from "@/redux/store";
import { useCart } from "@/hooks/useCart";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const dispatch = useAppDispatch();
  const { collections } = useAppSelector((s: RootState) => s.collections);
  const { totalItems, open } = useCart();

  useEffect(() => {
    dispatch(fetchCollections());
    
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dispatch]);

  const staticLinks = [
    { label: "Best Sellers", href: "/#products" },
    { label: "Custom Order", href: "/#custom" },
    { label: "Bulk Orders", href: "/#bulk" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[100] w-full pointer-events-auto transition-all duration-500 ease-in-out flex items-center justify-between ${
        scrolled 
          ? "px-6 py-4 md:px-10 md:py-4 bg-[#b46a36]/95 backdrop-blur-md shadow-xl border-b border-white/10" 
          : "px-8 py-8 md:px-12 md:py-10 bg-transparent"
      }`}
    >
      
      {/* ── Brand Mythrie ── */}
      <Link href="/" className="flex items-center gap-3 text-white">
        <Hexagon size={32} fill="white" strokeWidth={1} />
        <span className="font-sans text-[13px] font-semibold tracking-[0.2em] uppercase">
          Mythrie
        </span>
      </Link>

      {/* ── Desktop Nav ── */}
      <nav className="hidden lg:flex items-center gap-8">
        
        {/* Collections Dropdown */}
        <div className="relative group py-2">
          <button className="flex items-center gap-2 text-[12px] font-medium tracking-[0.15em] uppercase text-white hover:opacity-70 transition-opacity">
            Collections
            <ChevronDown size={14} strokeWidth={2} className="group-hover:rotate-180 transition-transform duration-300" />
          </button>

          {/* Dropdown Menu */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible translate-y-3 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300">
            <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-2 min-w-[200px] flex flex-col">
              <Link 
                href="/category/all" 
                className="px-4 py-3 text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--text)] hover:bg-[#b46a36]/10 hover:text-[#b46a36] rounded-lg transition-colors border-b border-[var(--bg-muted)]"
              >
                All Collections
              </Link>
              {collections?.map((cat: any) => (
                <Link 
                  key={cat.slug} 
                  href={`/category/${cat.slug}`} 
                  className="px-4 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[var(--text-muted)] hover:bg-[#b46a36]/10 hover:text-[#b46a36] rounded-lg transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Static Links */}
        {staticLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-[12px] font-medium tracking-[0.15em] uppercase text-white hover:opacity-70 transition-opacity py-2"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* ── Right Action ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={open}
          className={`relative rounded-full border flex items-center justify-center text-white hover:bg-white hover:text-[#b46a36] transition-all duration-300 ${
            scrolled ? "w-9 h-9 border-white/30" : "w-10 h-10 border-white/50 bg-white/10"
          }`}
        >
          <ShoppingBag size={16} strokeWidth={1.5} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-[#b46a36] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md">
              {totalItems}
            </span>
          )}
        </button>

        <Link
          href="/account"
          className={`rounded-full border flex items-center justify-center text-white hover:bg-white hover:text-[#b46a36] transition-all duration-300 ${
            scrolled ? "w-9 h-9 border-white/30" : "w-10 h-10 border-white/50 bg-white/10"
          }`}
        >
          <User size={16} strokeWidth={1.5} />
        </Link>
      </div>
      
    </header>
  );
}

```

## File: `frontend/src/components/ProductCard.tsx`

```typescript
"use client";

import Link from "next/link";
import { CATEGORIES } from "@/data/categories";
import { type Product } from "@/data/products";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag } from "lucide-react";
import { getImageUrl } from '@/utils/getImageUrl';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const catTitle = (CATEGORIES as any)[product.category]?.title || product.category;
  const { addToCart } = useCart();

  const productSlug  = product.slug || product.id;
  const productId    = (product as any)._id || String(product.id);
  const productImage = (product as any).images?.[0] ?? null;
  const productPrice = product.price;
  const productMRP   = (product as any).mrp || (product as any).oldPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: productId,
      name:      product.name,
      image:     productImage || "",
      price:     productPrice,
      quantity:  1,
    });
  };

  const requiresImage = !!(product as any).requiresImage;

  return (
    <div className="group relative w-full rounded-xl bg-white overflow-hidden shadow-[0_1px_10px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_-6px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out border border-gray-100 flex flex-col">
      <Link href={`/product/${productSlug}`} className="block relative w-full aspect-square overflow-hidden bg-[#faf9f8]">
        {/* Image */}
        {productImage ? (
          <img
            src={getImageUrl(productImage)}
            alt={product.name}
            className="w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-light font-serif italic">
            No Image
          </div>
        )}

        {/* Overlay gradient on hover for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />

        {/* Badges */}
        {((product as any).badge || (productMRP && productMRP > productPrice)) && (
          <div className="absolute top-2 left-2 z-10 transition-transform duration-500 group-hover:translate-y-0.5">
            <span className="px-2 py-1 rounded-full text-[8px] tracking-wider uppercase bg-white/90 backdrop-blur-sm text-gray-900 font-bold shadow-sm">
              {(product as any).badge === "new" ? "New" : (product as any).badge === "hot" ? "Trending" : "Artisanal"}
            </span>
          </div>
        )}

        {/* Hover Quick Add Button (Bottom slide-up) */}
        {requiresImage ? (
          <Link
            href={`/product/${productSlug}`}
            onClick={(e) => { e.stopPropagation(); }}
            className="absolute bottom-2 left-2 right-2 translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20 flex items-center justify-center gap-1.5 bg-white/90 backdrop-blur-md text-[#2d2926] py-2 rounded-lg shadow-md font-bold text-[9px] uppercase tracking-wider hover:bg-[#2d2926] hover:text-white"
          >
            <ShoppingBag size={12} strokeWidth={2} /> Upload Photo
          </Link>
        ) : (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 left-2 right-2 translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20 flex items-center justify-center gap-1.5 bg-white/90 backdrop-blur-md text-[#2d2926] py-2 rounded-lg shadow-md font-bold text-[9px] uppercase tracking-wider hover:bg-[#2d2926] hover:text-white"
          >
            <ShoppingBag size={12} strokeWidth={2} /> Quick Add
          </button>
        )}
      </Link>

      {/* Details Section */}
      <div className="p-3 flex flex-col flex-1 bg-white z-10 relative">
        <div className="flex justify-between items-start gap-2 mb-1">
          <Link href={`/product/${productSlug}`} className="flex-1">
            <h3 className="text-[12px] font-bold text-[#2d2926] leading-snug line-clamp-2 group-hover:text-[#a69076] transition-colors duration-300">
              {product.name}
            </h3>
          </Link>
          <div className="flex flex-col items-end shrink-0 pt-0.5">
            <span className="text-[12px] font-bold text-[#2d2926] leading-none">
              ₹{productPrice.toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-end mt-auto pt-1">
          <span className="text-[8px] uppercase tracking-[0.2em] font-semibold text-[#a69076]/90">
            {catTitle}
          </span>
          {productMRP && productMRP > productPrice && (
            <span className="text-[9px] text-gray-400 line-through font-medium">
              ₹{productMRP.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

```

## File: `frontend/src/components/ReduxProvider.tsx`

```typescript
"use client";

import { Provider } from 'react-redux';
import { store } from '../redux/store';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
}

```

## File: `frontend/src/components/SectionHeader.tsx`

```typescript
import Link from "next/link";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  btnLabel?: string;
  btnHref?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  eyebrow, 
  title, 
  subtitle, 
  btnLabel, 
  btnHref 
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16 scroll-m-20">
      <div className="max-w-[560px]">
        <div className="flex items-center gap-3 text-[11px] tracking-[0.2em] uppercase text-gold mb-5 font-medium">
          <span className="w-8 h-[1px] bg-gold inline-block" />
          {eyebrow}
        </div>
        <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-serif text-brown-dark leading-[1.1] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-txt-muted text-[1rem] leading-relaxed font-light">
            {subtitle}
          </p>
        )}
      </div>
      {btnLabel && btnHref && (
        <Link
          href={btnHref}
          className="group inline-flex items-center gap-2 text-[12px] tracking-[0.12em] uppercase text-brown font-medium hover:text-gold transition-colors mt-4 md:mt-0 w-max"
        >
          {btnLabel}
          <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;

```

## File: `frontend/src/components/ui/Modal.tsx`

```typescript
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import React from 'react';

type ModalType = 'success' | 'error' | 'confirm' | 'info';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string;
    type?: ModalType;
    confirmText?: string;
    cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    type = 'info',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 40 }}
                        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] overflow-hidden border border-black/5"
                    >
                        {/* Status bar */}
                        <div className={`h-2 w-full ${
                            type === 'success' ? 'bg-emerald-500' : 
                            type === 'error' ? 'bg-rose-500' : 
                            type === 'confirm' ? 'bg-zinc-900' : 'bg-gold'
                        }`} />

                        <div className="p-10">
                            <div className="flex flex-col items-center text-center gap-6">
                                <div className={`p-5 rounded-[2rem] ${
                                    type === 'success' ? 'bg-emerald-50 text-emerald-500' : 
                                    type === 'error' ? 'bg-rose-50 text-rose-500' : 
                                    type === 'confirm' ? 'bg-zinc-50 text-zinc-900' : 
                                    'bg-zinc-50 text-gold'
                                }`}>
                                    {type === 'success' && <CheckCircle2 size={42} strokeWidth={1.5} />}
                                    {type === 'error' && <AlertCircle size={42} strokeWidth={1.5} />}
                                    {type === 'confirm' && <HelpCircle size={42} strokeWidth={1.5} />}
                                    {type === 'info' && <CheckCircle2 size={42} strokeWidth={1.5} />}
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black font-serif italic text-zinc-900 tracking-tight leading-tight">{title}</h3>
                                    <p className="text-zinc-600 font-medium leading-relaxed italic px-4">
                                        {message}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                                {type === 'confirm' && (
                                    <button 
                                        onClick={onClose}
                                        className="w-full sm:w-auto px-10 py-5 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                                    >
                                        {cancelText}
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => { 
                                        if (type === 'confirm') onConfirm?.();
                                        onClose(); 
                                    }}
                                    className={`w-full sm:w-auto px-12 py-5 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 ${
                                        type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600' : 
                                        type === 'error' ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600' : 
                                        type === 'confirm' ? 'bg-zinc-900 text-white shadow-zinc-900/20 hover:bg-black' : 
                                        'bg-gold text-white shadow-gold/20 hover:bg-gold/90'
                                    }`}
                                >
                                    {type === 'confirm' ? (confirmText) : type === 'success' ? "Acknowledged" : "Close Portal"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;

```

## File: `frontend/src/context/CartContext.tsx`

```typescript
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/data/products";

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, delta: number) => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem("mg_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem("mg_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      totalItems, 
      totalPrice,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

```

## File: `frontend/src/data/categories.ts`

```typescript
export const CATEGORIES = {
  miniature: {
    title: 'Miniature Collections',
    eyebrow: 'Hand-Sculpted Clay',
    desc: 'Explore our full range of handmade miniature food clocks, magnets, keychains and wall spatulas — each piece sculpted by hand with intricate detail by Uma Gayathri.',
    emoji: '🍱',
    seoTitle: 'Miniature Collections – Handmade Miniature Food Clock & Clay Gifts | Mythris Gleams',
    seoDesc: 'Shop handmade miniature food clocks, keychains, magnets and return gifts. Premium clay handcrafted products in India by Uma Gayathri.',
    subcategories: [
      { key:'all', label:'All Miniatures' },
      { key:'food-clock', label:'Food Clocks' },
      { key:'wall-spatula', label:'Wall Spatulas' },
      { key:'magnets', label:'Food Magnets' },
      { key:'keychains', label:'Keychains' },
      { key:'navaratri', label:'Navaratri' },
    ]
  },
  kawaii: {
    title: 'Kawaii Collections',
    eyebrow: 'Cute & Adorable',
    desc: 'Adorable kawaii-themed clay creations — from fridge magnets and keychains to trinket trays and kids games. Each piece is irresistibly cute and handcrafted.',
    emoji: '🌸',
    seoTitle: 'Kawaii Collections – Cute Clay Keychains & Magnets | Mythris Gleams',
    seoDesc: 'Shop kawaii clay fridge magnets, keychains, trinket trays and kids tic tac toe games handcrafted in India.',
    subcategories: [
      { key:'all', label:'All Kawaii' },
      { key:'magnets', label:'Fridge Magnets' },
      { key:'keychains', label:'Keychains' },
      { key:'games', label:'Kids Games' },
      { key:'trinket', label:'Trinket Trays' },
      { key:'decor', label:'Cute Decor' },
    ]
  },
  gifts: {
    title: 'Gift Collections',
    eyebrow: 'For Every Occasion',
    desc: 'From Valentine\'s Day to housewarming — find the perfect handmade gift for every occasion. Custom and bulk return gift orders welcome.',
    emoji: '🎁',
    seoTitle: 'Gift Collections – Handmade Return Gifts & Custom Gifts India | Mythris Gleams',
    seoDesc: 'Unique handmade clay gifts for Valentine\'s Day, Mother\'s Day, birthday, naming ceremony, and housewarming. Return gifts in bulk available.',
    subcategories: [
      { key:'all', label:'All Gifts' },
      { key:'valentine', label:"Valentine's Day" },
      { key:'mothers', label:"Mother's Day" },
      { key:'fathers', label:"Father's Day" },
      { key:'birthday', label:'Birthday' },
      { key:'naming', label:'Naming Ceremony' },
      { key:'housewarming', label:'Housewarming' },
      { key:'return', label:'Return Gifts' },
    ]
  },
  utility: {
    title: 'Utility & Decor',
    eyebrow: 'Functional Art',
    desc: 'Beautiful clay utility items that add a handmade touch to your home — pen holders, car charms, agarbathi holders and tabletop decor.',
    emoji: '🏺',
    seoTitle: 'Utility & Decor – Handmade Clay Pen Holders, Agarbathi Holders | Mythris Gleams',
    seoDesc: 'Shop handmade clay pen holders, car charms, agarbathi holders and table top decor. Premium clay crafts in India.',
    subcategories: [
      { key:'all', label:'All Utility' },
      { key:'pen-holder', label:'Pen Holders' },
      { key:'car-charm', label:'Car Charms' },
      { key:'agarbathi', label:'Agarbathi Holders' },
      { key:'tabletop', label:'Table Top Decor' },
    ]
  },
  jewellery: {
    title: 'Jewellery Collections',
    eyebrow: 'Wearable Art',
    desc: 'Handcrafted polymer clay, terracotta and air dry clay jewellery — lightweight, vibrant and uniquely artistic. Made to wear and be noticed.',
    emoji: '💍',
    seoTitle: 'Clay Jewellery – Polymer Clay, Terracotta & Air Dry Clay | Mythris Gleams',
    seoDesc: 'Buy handmade polymer clay earrings, terracotta jewellery, and air dry clay necklaces. Unique wearable art from India.',
    subcategories: [
      { key:'all', label:'All Jewellery' },
      { key:'polymer', label:'Polymer Clay' },
      { key:'terracotta', label:'Terracotta' },
      { key:'airdry', label:'Air Dry Clay' },
    ]
  },
  corporate: {
    title: 'Corporate & Bulk Orders',
    eyebrow: 'For Businesses',
    desc: 'Premium handcrafted corporate gifts, return gift sets, and custom bulk orders. Add your brand story to every piece. Pan-India delivery.',
    emoji: '🏢',
    seoTitle: 'Corporate & Bulk Orders – Handmade Return Gifts India | Mythris Gleams',
    seoDesc: 'Bulk handmade return gifts and corporate gifting solutions. Custom clay products for events, offices and ceremonies across India.',
    subcategories: [
      { key:'all', label:'All' },
      { key:'corporate', label:'Corporate Gifts' },
      { key:'bulk', label:'Bulk Return Gifts' },
      { key:'custom', label:'Custom Orders' },
    ]
  }
};

```

## File: `frontend/src/data/products.ts`

```typescript
export interface Product {
  id: number;
  _id?: string; // Backend Mongo ID
  slug?: string; // SEO Slug
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  mrp?: number; // Backend valuation
  oldPrice: number | null;
  emoji: string;
  bg: string;
  badge: string | null;
  rating: number;
  reviews: number;
  custom: boolean;
  desc: string;
  story?: string; // Artisanal Narrative
  details?: string; // Technical details
  metaDescription?: string; // SEO summary
  stockStatus?: 'in-stock' | 'out-of-stock' | 'made-to-order';
  requiresImage?: boolean;
  images?: string[]; // Dynamic image array
  sizes: string[];
  variants?: any[]; // Dynamic variations
  colors: string[];
  specs: Record<string, string>;
  thumb_emojis: string[];
  thumb_bgs: string[];
}

export const ALL_PRODUCTS: Product[] = [
  { id:1, name:'Handmade Miniature Food Clock – Pizza', category:'miniature', subcategory:'food-clock', price:499, oldPrice:699, emoji:'🍕', bg:'prod-bg-1', badge:'hot', rating:4.9, reviews:48, custom:true,
    desc:'A breathtaking handcrafted miniature food clock made from premium air-dry clay, hand-sculpted and painted by Uma Gayathri. This pizza-themed wall clock combines functional timekeeping with whimsical art. Each piece is uniquely made — no two are identical. Perfect for kitchens, kids rooms, gifting, and home decor.\n\nAvailable in pizza, burger, sushi and more themes. Custom themes available on request. Ideal for gifting across India.',
    sizes:['Small (6 inch)','Medium (8 inch)','Large (10 inch)'],
    colors:['#e8c99f','#f5deb3','#ffccbc'],
    specs:{ Material:'Air-dry clay & resin', Finish:'Hand-painted, matte', Size:'Available in 3 sizes', Weight:'~150g (Medium)', 'Clock Mechanism':'Battery-operated (AA)', 'Occasion':'Gifting, Home Decor', 'Delivery Time':'5–7 business days', 'Custom Available':'Yes, all themes' },
    thumb_emojis:['🍕','🍕','🍕'],
    thumb_bgs:['prod-bg-1', 'prod-bg-3', 'prod-bg-5'],
  },
  { id:2, name:'Miniature Burger Clock', category:'miniature', subcategory:'food-clock', price:479, oldPrice:649, emoji:'🍔', bg:'prod-bg-2', badge:'hot', rating:4.8, reviews:35, custom:true,
    desc:'Adorable burger-themed miniature food clock, hand-sculpted from clay by Uma Gayathri. Each layer — bun, patty, cheese, lettuce — is crafted individually for hyper-realistic detail. A show-stopper wall decor item and a one-of-a-kind gift.',
    sizes:['Small (6 inch)','Medium (8 inch)'],
    colors:['#c8e6c9','#e8f5e9','#f5deb3'],
    specs:{ Material:'Air-dry clay', Finish:'Hand-painted', Size:'6 or 8 inch', Weight:'~130g', 'Clock Mechanism':'Battery-operated', 'Custom Available':'Yes' },
    thumb_emojis:['🍔','🍔','🍔'],
    thumb_bgs:['prod-bg-2', 'prod-bg-4', 'prod-bg-7'],
  },
  { id:3, name:'Miniature Sushi Clock', category:'miniature', subcategory:'food-clock', price:529, oldPrice:749, emoji:'🍱', bg:'prod-bg-3', badge:'new', rating:4.9, reviews:19, custom:true,
    desc:'Exquisite sushi bento miniature food clock — an artistic masterpiece for Japanese cuisine lovers. Multiple sushi pieces arranged in a bento box, all hand-sculpted from clay. A truly unique wall decor and gift item.',
    sizes:['Medium (8 inch)','Large (10 inch)'],
    colors:['#e3f2fd','#bbdefb','#E8CFCF'],
    specs:{ Material:'Air-dry clay & polymer clay', Finish:'Hand-painted', Size:'8 or 10 inch', 'Custom Available':'Yes' },
    thumb_emojis:['🍱','🍱','🍱'],
    thumb_bgs:['prod-bg-3','prod-bg-1','prod-bg-8'],
  },
  { id:4, name:'Miniature Donut Clock', category:'miniature', subcategory:'food-clock', price:459, oldPrice:null, emoji:'🍩', bg:'prod-bg-4', badge:null, rating:4.7, reviews:12, custom:true,
    desc:'Delicious looking donut wall clock. Hand-painted with realistic textures and sprinkles.',
    sizes:['Medium (8 inch)'],
    colors:['#fce4ec'],
    specs:{ Material: 'Air-dry clay', Size: '8 inch' },
    thumb_emojis: ['🍩'],
    thumb_bgs: ['prod-bg-4']
  },
  { id:5, name:'Food Wall Spatula – Set of 3', category:'miniature', subcategory:'wall-spatula', price:329, oldPrice:449, emoji:'🍳', bg:'prod-bg-7', badge:'new', rating:4.7, reviews:11, custom:false,
    desc:'Miniature food arranged on wooden spatulas for kitchen wall decor.',
    sizes:['Set of 3'],
    colors:['#E8CFCF'],
    specs:{ Material: 'Wood & Clay', Count: '3 Spatulas' },
    thumb_emojis: ['🍳'],
    thumb_bgs: ['prod-bg-7']
  },
  { id:6, name:'Food Wall Spatula – Set of 5', category:'miniature', subcategory:'wall-spatula', price:549, oldPrice:699, emoji:'🥄', bg:'prod-bg-8', badge:null, rating:4.8, reviews:8, custom:false,
    desc:'Extensive set of 5 miniature food spatulas for a complete kitchen decor look.',
    sizes:['Set of 5'],
    colors:['#e0f7fa'],
    specs:{ Material: 'Wood & Clay', Count: '5 Spatulas' },
    thumb_emojis: ['🥄'],
    thumb_bgs: ['prod-bg-8']
  },
  { id:7, name:'Miniature Food Magnet Set', category:'miniature', subcategory:'magnets', price:249, oldPrice:349, emoji:'🧲', bg:'prod-bg-5', badge:'sale', rating:4.6, reviews:22, custom:false,
    desc:'Strong fridge magnets with hyper-realistic miniature food designs.',
    sizes:['Set of 3'],
    colors:['#E8CFCF'],
    specs:{ Material: 'Clay', Count: '3 Magnets', 'Magnet Type': 'Neodymium' },
    thumb_emojis: ['🧲'],
    thumb_bgs: ['prod-bg-5']
  },
  { id:8, name:'Miniature Food Keychain – Donut', category:'miniature', subcategory:'keychains', price:179, oldPrice:null, emoji:'🍩', bg:'prod-bg-9', badge:null, rating:4.7, reviews:61, custom:false,
    desc:'Carry your favorite food everywhere with this adorable donut keychain.',
    sizes:['Standard'],
    colors:['#f9fbe7'],
    specs:{ Material: 'Polymer Clay', Weight: '20g' },
    thumb_emojis: ['🍩'],
    thumb_bgs: ['prod-bg-9']
  },
  { id:9, name:'Miniature Food Keychain – Strawberry', category:'miniature', subcategory:'keychains', price:189, oldPrice:null, emoji:'🍓', bg:'prod-bg-10', badge:'new', rating:4.8, reviews:17, custom:false,
    desc:'Hand-sculpted strawberry keychain with amazing detail.',
    sizes:['Standard'],
    colors:['#fce4ec'],
    specs:{ Material: 'Polymer Clay', Weight: '15g' },
    thumb_emojis: ['🍓'],
    thumb_bgs: ['prod-bg-10']
  },
  { id:10, name:'Navaratri Thamboolam Return Gift', category:'miniature', subcategory:'navaratri', price:799, oldPrice:999, emoji:'🪔', bg:'prod-bg-1', badge:'hot', rating:5.0, reviews:19, custom:true,
    desc:'Traditional thamboolam set miniature for Navaratri gifting.',
    sizes:['Single Pack', 'Pack of 5'],
    colors:['#fce4ec'],
    specs:{ Material: 'Clay', Occasion: 'Navaratri' },
    thumb_emojis: ['🪔'],
    thumb_bgs: ['prod-bg-1']
  },
  { id:11, name:'Navaratri Golu Display Miniature', category:'miniature', subcategory:'navaratri', price:599, oldPrice:799, emoji:'🌺', bg:'prod-bg-2', badge:'new', rating:4.9, reviews:14, custom:true,
    desc:'Beautiful miniature display items for Navaratri Golu.',
    sizes:['Standard'],
    colors:['#e8f5e9'],
    specs:{ Material: 'Clay', Occasion: 'Navaratri' },
    thumb_emojis: ['🌺'],
    thumb_bgs: ['prod-bg-2']
  },
  // Kawaii
  { id:12, name:'Kawaii Fridge Magnet Set', category:'kawaii', subcategory:'magnets', price:249, oldPrice:349, emoji:'🐣', bg:'prod-bg-4', badge:'new', rating:4.8, reviews:32, custom:false,
    desc:'Super cute kawaii characters as fridge magnets.',
    sizes:['Set of 4'],
    colors:['#e3f2fd'],
    specs:{ Material: 'Polymer Clay' },
    thumb_emojis: ['🐣'],
    thumb_bgs: ['prod-bg-4']
  },
  { id:13, name:'Kawaii Keychain – Bunny', category:'kawaii', subcategory:'keychains', price:199, oldPrice:null, emoji:'🐰', bg:'prod-bg-4', badge:null, rating:4.7, reviews:28, custom:false,
    desc:'Handmade bunny keychain in kawaii style.',
    sizes:['Standard'],
    colors:['#e3f2fd'],
    specs:{ Material: 'Polymer Clay' },
    thumb_emojis: ['🐰'],
    thumb_bgs: ['prod-bg-4']
  },
  { id:14, name:'Kawaii Keychain – Panda', category:'kawaii', subcategory:'keychains', price:199, oldPrice:null, emoji:'🐼', bg:'prod-bg-5', badge:null, rating:4.8, reviews:21, custom:false,
    desc:'Adorable panda keychain for all ages.',
    sizes:['Standard'],
    colors:['#E8CFCF'],
    specs:{ Material: 'Polymer Clay' },
    thumb_emojis: ['🐼'],
    thumb_bgs: ['prod-bg-5']
  },
  { id:15, name:'Tic Tac Toe Clay Game – Kids', category:'kawaii', subcategory:'games', price:449, oldPrice:599, emoji:'🎮', bg:'prod-bg-6', badge:'hot', rating:4.9, reviews:40, custom:false,
    desc:'Functional and cute Tic Tac Toe game board with clay pieces.',
    sizes:['One Size'],
    colors:['#f3e5f5'],
    specs:{ Material: 'Clay & Wood' },
    thumb_emojis: ['🎮'],
    thumb_bgs: ['prod-bg-6']
  },
  { id:16, name:'Kawaii Trinket Tray – Floral', category:'kawaii', subcategory:'trinket', price:399, oldPrice:null, emoji:'🌷', bg:'prod-bg-7', badge:null, rating:4.6, reviews:15, custom:true,
    desc:'Beautiful tray for your jewelry and small items.',
    sizes:['Standard'],
    colors:['#fbe9e7'],
    specs:{ Material: 'Resin & Clay' },
    thumb_emojis: ['🌷'],
    thumb_bgs: ['prod-bg-7']
  },
  { id:17, name:'Cute Mini Decor – Cloud Set', category:'kawaii', subcategory:'decor', price:349, oldPrice:479, emoji:'☁️', bg:'prod-bg-8', badge:'new', rating:4.7, reviews:9, custom:false,
    desc:'Wall decor clouds for kids rooms.',
    sizes:['Set of 3'],
    colors:['#e0f7fa'],
    specs:{ Material: 'Clay' },
    thumb_emojis: ['☁️'],
    thumb_bgs: ['prod-bg-8']
  },
  // Gifts
  { id:18, name:"Valentine's Day Clay Gift Set", category:'gifts', subcategory:'valentine', price:699, oldPrice:899, emoji:'❤️', bg:'prod-bg-9', badge:'hot', rating:4.9, reviews:53, custom:true,
    desc: 'Perfect gift for your loved one.',
    sizes: ['Gift Pack'],
    colors: ['#f9fbe7'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['❤️'],
    thumb_bgs: ['prod-bg-9']
  },
  { id:19, name:"Mother's Day Flower Decor", category:'gifts', subcategory:'mothers', price:599, oldPrice:799, emoji:'💐', bg:'prod-bg-10', badge:'new', rating:4.8, reviews:27, custom:true,
    desc: 'Everlasting flowers for Mother\'s Day.',
    sizes: ['Standard'],
    colors: ['#fce4ec'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['💐'],
    thumb_bgs: ['prod-bg-10']
  },
  { id:20, name:"Father's Day Miniature Gift", category:'gifts', subcategory:'fathers', price:499, oldPrice:649, emoji:'👨', bg:'prod-bg-1', badge:null, rating:4.7, reviews:18, custom:true,
    desc: 'Unique miniature gift for Father\'s Day.',
    sizes: ['Standard'],
    colors: ['#fce4ec'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['👨'],
    thumb_bgs: ['prod-bg-1']
  },
  { id:21, name:'Birthday Gift Clay Set', category:'gifts', subcategory:'birthday', price:649, oldPrice:849, emoji:'🎂', bg:'prod-bg-2', badge:'hot', rating:4.9, reviews:63, custom:true,
    desc: 'Celebrate birthdays with unique handmade gifts.',
    sizes: ['Standard'],
    colors: ['#e8f5e9'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['🎂'],
    thumb_bgs: ['prod-bg-2']
  },
  { id:22, name:'Naming Ceremony Return Gifts', category:'gifts', subcategory:'naming', price:399, oldPrice:499, emoji:'👶', bg:'prod-bg-3', badge:'new', rating:4.8, reviews:22, custom:true,
    desc: 'Adorable return gifts for naming ceremonies.',
    sizes: ['Standard'],
    colors: ['#e3f2fd'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['👶'],
    thumb_bgs: ['prod-bg-3']
  },
  { id:23, name:'Housewarming Clay Gift Set', category:'gifts', subcategory:'housewarming', price:749, oldPrice:999, emoji:'🏠', bg:'prod-bg-4', badge:null, rating:4.9, reviews:16, custom:true,
    desc: 'Handmade home decor for housewarming gifts.',
    sizes: ['Standard'],
    colors: ['#e3f2fd'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['🏠'],
    thumb_bgs: ['prod-bg-4']
  },
  { id:24, name:'Return Gift Bulk Set (25 pcs)', category:'gifts', subcategory:'return', price:4999, oldPrice:6499, emoji:'🎁', bg:'prod-bg-5', badge:'sale', rating:5.0, reviews:11, custom:true,
    desc: 'Bulk set of return gifts for events.',
    sizes: ['Set of 25'],
    colors: ['#E8CFCF'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['🎁'],
    thumb_bgs: ['prod-bg-5']
  },
  // Utility
  { id:25, name:'Clay Pen Holder – Floral', category:'utility', subcategory:'pen-holder', price:349, oldPrice:449, emoji:'✏️', bg:'prod-bg-6', badge:null, rating:4.7, reviews:19, custom:true,
    desc: 'Floral desktop pen holder.',
    sizes: ['Standard'],
    colors: ['#f3e5f5'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['✏️'],
    thumb_bgs: ['prod-bg-6']
  },
  { id:26, name:'Car Charm – Elephant', category:'utility', subcategory:'car-charm', price:279, oldPrice:null, emoji:'🐘', bg:'prod-bg-7', badge:'new', rating:4.8, reviews:31, custom:false,
    desc: 'Protective elephant charm for your car.',
    sizes: ['Standard'],
    colors: ['#fbe9e7'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['🐘'],
    thumb_bgs: ['prod-bg-7']
  },
  { id:27, name:'Agarbathi Holder – Peacock', category:'utility', subcategory:'agarbathi', price:299, oldPrice:399, emoji:'🦚', bg:'prod-bg-8', badge:null, rating:4.8, reviews:22, custom:false,
    desc: 'Exquisite peacock design incense holder.',
    sizes: ['Standard'],
    colors: ['#e0f7fa'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['🦚'],
    thumb_bgs: ['prod-bg-8']
  },
  { id:28, name:'Table Top Decor – Mushroom', category:'utility', subcategory:'tabletop', price:399, oldPrice:549, emoji:'🍄', bg:'prod-bg-9', badge:'hot', rating:4.9, reviews:14, custom:false,
    desc: 'Whimsical mushroom decor for your table.',
    sizes: ['Standard'],
    colors: ['#f9fbe7'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['🍄'],
    thumb_bgs: ['prod-bg-9']
  },
  // Jewellery
  { id:29, name:'Polymer Clay Stud Earrings', category:'jewellery', subcategory:'polymer', price:299, oldPrice:399, emoji:'💫', bg:'prod-bg-10', badge:'new', rating:4.8, reviews:41, custom:true,
    desc: 'Lightweight polymer clay earrings.',
    sizes: ['Standard'],
    colors: ['#fce4ec'],
    specs: { Material: 'Polymer Clay' },
    thumb_emojis: ['💫'],
    thumb_bgs: ['prod-bg-10']
  },
  { id:30, name:'Terracotta Jhumka Earrings', category:'jewellery', subcategory:'terracotta', price:349, oldPrice:499, emoji:'💛', bg:'prod-bg-1', badge:'hot', rating:4.9, reviews:27, custom:true,
    desc: 'Traditional terracotta earrings.',
    sizes: ['Standard'],
    colors: ['#fce4ec'],
    specs: { Material: 'Terracotta' },
    thumb_emojis: ['💛'],
    thumb_bgs: ['prod-bg-1']
  },
  { id:31, name:'Air Dry Clay Necklace', category:'jewellery', subcategory:'airdry', price:449, oldPrice:599, emoji:'💎', bg:'prod-bg-2', badge:null, rating:4.7, reviews:13, custom:true,
    desc: 'Unique air dry clay necklace.',
    sizes: ['Standard'],
    colors: ['#e8f5e9'],
    specs: { Material: 'Air Dry Clay' },
    thumb_emojis: ['💎'],
    thumb_bgs: ['prod-bg-2']
  },
  { id:32, name:'Polymer Clay Bracelet', category:'jewellery', subcategory:'polymer', price:399, oldPrice:null, emoji:'🌸', bg:'prod-bg-3', badge:'new', rating:4.8, reviews:8, custom:true,
    desc: 'Handmade polymer clay bracelet.',
    sizes: ['Standard'],
    colors: ['#e3f2fd'],
    specs: { Material: 'Polymer Clay' },
    thumb_emojis: ['🌸'],
    thumb_bgs: ['prod-bg-3']
  },
  // Corporate
  { id:33, name:'Corporate Gift Box – Premium', category:'corporate', subcategory:'corporate', price:1499, oldPrice:1999, emoji:'🏢', bg:'prod-bg-4', badge:'hot', rating:5.0, reviews:7, custom:true,
    desc: 'Premium corporate gift box.',
    sizes: ['Standard'],
    colors: ['#e3f2fd'],
    specs: { Material: 'Multiple' },
    thumb_emojis: ['🏢'],
    thumb_bgs: ['prod-bg-4']
  },
  { id:34, name:'Bulk Return Gift Set (50 pcs)', category:'corporate', subcategory:'bulk', price:7999, oldPrice:9999, emoji:'📦', bg:'prod-bg-5', badge:'sale', rating:5.0, reviews:5, custom:true,
    desc: 'Bulk set for corporate events.',
    sizes: ['Set of 50'],
    colors: ['#E8CFCF'],
    specs: { Material: 'Multiple' },
    thumb_emojis: ['📦'],
    thumb_bgs: ['prod-bg-5']
  },
  { id:35, name:'Custom Corporate Name Plaque', category:'corporate', subcategory:'custom', price:899, oldPrice:1199, emoji:'🎖️', bg:'prod-bg-6', badge:'new', rating:4.9, reviews:9, custom:true,
    desc: 'Personalized office name plaques.',
    sizes: ['Standard'],
    colors: ['#f3e5f5'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['🎖️'],
    thumb_bgs: ['prod-bg-6']
  },
];

```

## File: `frontend/src/hooks/useCart.ts`

```typescript
"use client";

/**
 * Universal cart hook.
 * - If user is logged in (JWT in Redux auth): dispatches server-side cart thunks.
 * - If guest: uses local Redux guest actions.
 */
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addGuestItem, updateGuestQty, removeGuestItem, clearGuest,
  addItemToCart, updateCartItemQty, removeCartItem, clearCartThunk,
  openCart, closeCart, toggleCart,
  CartItem,
} from "@/redux/slices/cartSlice";

interface AddPayload {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity?: number;
  selectedVariant?: string;
  selectedColor?: string;
  customerImage?: string;
}

export function useCart() {
  const dispatch = useAppDispatch();
  const { items, loading, isOpen } = useAppSelector((s) => s.cart);
  const userInfo = useAppSelector((s) => s.auth.userInfo);
  const isAuth = !!userInfo?.token;

  const addToCart = (payload: AddPayload) => {
    if (isAuth) {
      dispatch(addItemToCart({ ...payload, quantity: payload.quantity ?? 1 }));
    } else {
      dispatch(addGuestItem({
        product: payload.productId,
        name: payload.name,
        image: payload.image,
        price: payload.price,
        quantity: payload.quantity ?? 1,
        selectedVariant: payload.selectedVariant ?? "",
        selectedColor: payload.selectedColor ?? "",
        customerImage: payload.customerImage ?? "",
      }));
    }
    dispatch(openCart());
  };

  const setQty = (item: CartItem, qty: number) => {
    if (isAuth) {
      if (qty <= 0) dispatch(removeCartItem(item._id));
      else dispatch(updateCartItemQty({ itemId: item._id, quantity: qty }));
    } else {
      dispatch(updateGuestQty({ _id: item._id, quantity: qty }));
    }
  };

  const remove = (item: CartItem) => {
    if (isAuth) dispatch(removeCartItem(item._id));
    else dispatch(removeGuestItem(item._id));
  };

  const clear = () => {
    if (isAuth) dispatch(clearCartThunk());
    else dispatch(clearGuest());
  };

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return {
    items, loading, isOpen, isAuth,
    addToCart, setQty, remove, clear,
    totalItems, totalPrice,
    open:   () => dispatch(openCart()),
    close:  () => dispatch(closeCart()),
    toggle: () => dispatch(toggleCart()),
  };
}

```

## File: `frontend/src/redux/hooks.ts`

```typescript
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

```

## File: `frontend/src/redux/slices/authSlice.ts`

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

interface UserInfo {
    id: string;
    name: string;
    email: string;
    role: string;
    token: string;
}

interface AuthState {
    userInfo: UserInfo | null;
    loading: boolean;
    error: string | null;
}

const getSafeUserInfo = () => {
    if (typeof window === 'undefined') return null;
    const info = localStorage.getItem('userInfo');
    if (!info || info === 'undefined') return null;
    try {
        return JSON.parse(info);
    } catch (e) {
        return null;
    }
}

const initialState: AuthState = {
    userInfo: getSafeUserInfo(),
    loading: false,
    error: null
};

export const login = createAsyncThunk(
    'auth/login',
    async (credentials: any, thunkAPI) => {
        try {
            const { data } = await api.post('/auth/login', credentials);
            // Backend returns: { success: true, token, user: { id, name, email, role } }
            const userInfo = { ...data.user, token: data.token };
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            return userInfo;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData: any, thunkAPI) => {
        try {
            const { data } = await api.post('/auth/register', userData);
            // Backend returns: { success: true, token, user: { id, name, email, role } }
            const userInfo = { ...data.user, token: data.token };
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            return userInfo;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const logout = createAsyncThunk('auth/logout', async () => {
    localStorage.removeItem('userInfo');
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        resetAuthError: (state) => {
            state.error = null;
        },
        updateUserInfo: (state, action: PayloadAction<UserInfo>) => {
            state.userInfo = action.payload;
            localStorage.setItem('userInfo', JSON.stringify(action.payload));
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.userInfo = action.payload;
                state.loading = false;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.userInfo = action.payload;
                state.loading = false;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(logout.fulfilled, (state) => {
                state.userInfo = null;
            });
    }
});

export const { resetAuthError, updateUserInfo } = authSlice.actions;
export default authSlice.reducer;

```

## File: `frontend/src/redux/slices/cartSlice.ts`

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

export interface CartItem {
    _id: string;           // server-side item id
    product: string;       // product ObjectId
    name: string;
    image: string;
    price: number;
    quantity: number;
    selectedVariant?: string;
    selectedColor?: string;
    customerImage?: string;
}

interface CartState {
    items: CartItem[];
    loading: boolean;
    error: string | null;
    isOpen: boolean;
}

const initialState: CartState = {
    items: [],
    loading: false,
    error: null,
    isOpen: false,
};

/* ─── Thunks ─────────────────────────────────────────────────── */

export const fetchCart = createAsyncThunk('cart/fetch', async (_, thunkAPI) => {
    try {
        const { data } = await api.get('/cart');
        return data.data as CartItem[];
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message);
    }
});

export const addItemToCart = createAsyncThunk(
    'cart/add',
    async (payload: { productId: string; name: string; image: string; price: number; quantity?: number; selectedVariant?: string; selectedColor?: string; customerImage?: string }, thunkAPI) => {
        try {
            const { data } = await api.post('/cart', payload);
            return data.data as CartItem[];
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const updateCartItemQty = createAsyncThunk(
    'cart/updateQty',
    async ({ itemId, quantity }: { itemId: string; quantity: number }, thunkAPI) => {
        try {
            const { data } = await api.put(`/cart/${itemId}`, { quantity });
            return data.data as CartItem[];
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const removeCartItem = createAsyncThunk(
    'cart/remove',
    async (itemId: string, thunkAPI) => {
        try {
            const { data } = await api.delete(`/cart/${itemId}`);
            return data.data as CartItem[];
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const clearCartThunk = createAsyncThunk('cart/clear', async (_, thunkAPI) => {
    try {
        await api.delete('/cart');
        return [] as CartItem[];
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message);
    }
});

/* ─── Slice ──────────────────────────────────────────────────── */

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        openCart:  (state) => { state.isOpen = true; },
        closeCart: (state) => { state.isOpen = false; },
        toggleCart:(state) => { state.isOpen = !state.isOpen; },
        // Guest cart (no auth) – local only
        addGuestItem: (state, action: PayloadAction<Omit<CartItem, '_id'>>) => {
            const existing = state.items.find(
                i => i.product === action.payload.product
                    && i.selectedVariant === action.payload.selectedVariant
                    && i.selectedColor === action.payload.selectedColor
            );
            if (existing) {
                existing.quantity += action.payload.quantity;
                if (action.payload.customerImage) existing.customerImage = action.payload.customerImage;
            } else {
                state.items.push({ ...action.payload, _id: `guest_${Date.now()}` });
            }
            state.isOpen = true;
        },
        updateGuestQty: (state, action: PayloadAction<{ _id: string; quantity: number }>) => {
            const item = state.items.find(i => i._id === action.payload._id);
            if (item) {
                if (action.payload.quantity <= 0) {
                    state.items = state.items.filter(i => i._id !== action.payload._id);
                } else {
                    item.quantity = action.payload.quantity;
                }
            }
        },
        removeGuestItem: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(i => i._id !== action.payload);
        },
        clearGuest: (state) => { state.items = []; },
    },
    extraReducers: (builder) => {
        const setItems = (state: CartState, action: PayloadAction<CartItem[]>) => {
            state.items = action.payload;
            state.loading = false;
            state.isOpen = true;
        };
        builder
            .addCase(fetchCart.pending,          (state) => { state.loading = true; })
            .addCase(fetchCart.fulfilled,         (state, action) => { state.items = action.payload; state.loading = false; })
            .addCase(fetchCart.rejected,          (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(addItemToCart.pending,       (state) => { state.loading = true; })
            .addCase(addItemToCart.fulfilled,     setItems)
            .addCase(addItemToCart.rejected,      (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(updateCartItemQty.fulfilled, (state, action) => { state.items = action.payload; })
            .addCase(removeCartItem.fulfilled,    (state, action) => { state.items = action.payload; })
            .addCase(clearCartThunk.fulfilled,    (state) => { state.items = []; });
    },
});

export const { openCart, closeCart, toggleCart, addGuestItem, updateGuestQty, removeGuestItem, clearGuest } = cartSlice.actions;
export default cartSlice.reducer;

```

## File: `frontend/src/redux/slices/collectionSlice.ts`

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

interface CollectionState {
    collections: any[];
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: CollectionState = {
    collections: [],
    loading: false,
    error: null,
    success: false
};

export const fetchCollections = createAsyncThunk(
    'collections/fetchAll',
    async (_, thunkAPI) => {
        try {
            const { data } = await api.get('/collections');
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const createCollection = createAsyncThunk(
    'collections/create',
    async (formData: FormData, thunkAPI) => {
        try {
            const { data } = await api.post('/collections', formData);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const deleteCollection = createAsyncThunk(
    'collections/delete',
    async (id: string, thunkAPI) => {
        try {
            await api.delete(`/collections/${id}`);
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const collectionSlice = createSlice({
    name: 'collections',
    initialState,
    reducers: {
        resetCollectionState: (state) => {
            state.success = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCollections.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCollections.fulfilled, (state, action) => {
                state.collections = action.payload;
                state.loading = false;
            })
            .addCase(fetchCollections.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createCollection.fulfilled, (state, action) => {
                state.collections.unshift(action.payload);
                state.success = true;
            })
            .addCase(deleteCollection.fulfilled, (state, action) => {
                state.collections = state.collections.filter(c => c._id !== action.payload);
            });
    }
});

export const { resetCollectionState } = collectionSlice.actions;
export default collectionSlice.reducer;

```

## File: `frontend/src/redux/slices/inquirySlice.ts`

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

interface InquiryState {
    inquiries: any[];
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: InquiryState = {
    inquiries: [],
    loading: false,
    error: null,
    success: false
};

export const fetchInquiries = createAsyncThunk(
    'inquiries/fetchAll',
    async (_, thunkAPI) => {
        try {
            const { data } = await api.get('/inquiries');
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const createInquiry = createAsyncThunk(
    'inquiries/create',
    async (inquiryData: FormData, thunkAPI) => {
        try {
            const { data } = await api.post('/inquiries', inquiryData);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const updateInquiryStatus = createAsyncThunk(
    'inquiries/updateStatus',
    async ({ id, status }: { id: string, status: string }, thunkAPI) => {
        try {
            const { data } = await api.put(`/inquiries/${id}/status`, { status });
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const deleteInquiry = createAsyncThunk(
    'inquiries/delete',
    async (id: string, thunkAPI) => {
        try {
            await api.delete(`/inquiries/${id}`);
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const inquirySlice = createSlice({
    name: 'inquiries',
    initialState,
    reducers: {
        resetInquiryState: (state) => {
            state.success = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchInquiries.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchInquiries.fulfilled, (state, action) => {
                state.inquiries = action.payload;
                state.loading = false;
            })
            .addCase(fetchInquiries.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createInquiry.pending, (state) => {
                state.loading = true;
                state.success = false;
                state.error = null;
            })
            .addCase(createInquiry.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.inquiries.unshift(action.payload);
            })
            .addCase(createInquiry.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateInquiryStatus.fulfilled, (state, action) => {
                state.inquiries = state.inquiries.map(i => i._id === action.payload._id ? action.payload : i);
            })
            .addCase(deleteInquiry.fulfilled, (state, action) => {
                state.inquiries = state.inquiries.filter(i => i._id !== action.payload);
            });
    }
});

export const { resetInquiryState } = inquirySlice.actions;
export default inquirySlice.reducer;

```

## File: `frontend/src/redux/slices/orderSlice.ts`

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

interface OrderState {
    orders: any[];
    currentOrder: any | null;
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: OrderState = {
    orders: [],
    currentOrder: null,
    loading: false,
    error: null,
    success: false,
};

export const createOrder = createAsyncThunk(
    'orders/create',
    async ({ orderData, isGuest: _isGuest }: { orderData: any; isGuest: boolean }, thunkAPI) => {
        try {
            // Unified route: backend handles guest vs authenticated via optionalAuth middleware
            const { data } = await api.post('/orders', orderData);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const getMyOrders = createAsyncThunk(
    'orders/myOrders',
    async (_, thunkAPI) => {
        try {
            const { data } = await api.get('/orders/mine');
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const fetchOrders = createAsyncThunk(
    'orders/fetchAll',
    async (params: { includeUnpaid?: boolean } | undefined, thunkAPI) => {
        try {
            const includeUnpaid = params?.includeUnpaid || false;
            const { data } = await api.get(`/orders?includeUnpaid=${includeUnpaid}`);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const updateOrderStatus = createAsyncThunk(
    'orders/updateStatus',
    async ({ id, status, trackingNumber, deliveryNote }: { id: string, status: string, trackingNumber?: string, deliveryNote?: string }, thunkAPI) => {
        try {
            const { data } = await api.put(`/orders/${id}/status`, { status, trackingNumber, deliveryNote });
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

const orderSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        resetOrderSuccess: (state) => {
            state.success = false;
            state.currentOrder = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchOrders.pending,  (state) => { state.loading = true; })
            .addCase(fetchOrders.fulfilled, (state, action) => { state.orders = action.payload; state.loading = false; })
            .addCase(fetchOrders.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(getMyOrders.pending,   (state) => { state.loading = true; })
            .addCase(getMyOrders.fulfilled, (state, action) => { state.orders = action.payload; state.loading = false; })
            .addCase(getMyOrders.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(createOrder.pending,   (state) => { state.loading = true; state.error = null; })
            .addCase(createOrder.fulfilled, (state, action) => { state.currentOrder = action.payload; state.loading = false; state.success = true; })
            .addCase(createOrder.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(updateOrderStatus.pending, (state) => {
                state.error = null;
                state.success = false;
            })
            .addCase(updateOrderStatus.fulfilled, (state, action) => {
                state.orders = state.orders.map(o => o._id === action.payload._id ? action.payload : o);
                state.success = true;
            })
            .addCase(updateOrderStatus.rejected, (state, action) => {
                state.error = action.payload as string;
                state.success = false;
            });
    }
});

export const { resetOrderSuccess } = orderSlice.actions;
export default orderSlice.reducer;

```

## File: `frontend/src/redux/slices/productSlice.ts`

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

interface ProductState {
    products: any[];
    selectedProduct: any | null; // Single product for detail page
    loading: boolean;
    error: string | null;
    success: boolean;
    deleteSuccess: boolean;
}

const initialState: ProductState = {
    products: [],
    selectedProduct: null,
    loading: false,
    error: null,
    success: false,
    deleteSuccess: false
};

// Fetch Single Product by Slug
export const fetchProductBySlug = createAsyncThunk(
    'products/fetchBySlug',
    async (slug: string, thunkAPI) => {
        try {
            const { data } = await api.get(`/products/${slug}`);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

// Fetch All Products (Admin / User)
export const fetchProducts = createAsyncThunk(
    'products/fetchAll',
    async (params: any, thunkAPI) => {
        try {
            const { data } = await api.get('/products', { params });
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

// Create Product (Admin Only)
export const createProduct = createAsyncThunk(
    'products/create',
    async (productData: any, thunkAPI) => {
        try {
            const { data } = await api.post('/products', productData);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

// Delete Product (Admin Only)
export const deleteProduct = createAsyncThunk(
    'products/delete',
    async (id: string, thunkAPI) => {
        try {
            await api.delete(`/products/${id}`);
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

// Update Product (Admin Only)
export const updateProduct = createAsyncThunk(
    'products/update',
    async ({ id, productData }: { id: string, productData: any }, thunkAPI) => {
        try {
            const { data } = await api.put(`/products/${id}`, productData);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        resetProductState: (state) => {
            state.success = false;
            state.deleteSuccess = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProductBySlug.pending, (state) => {
                state.loading = true;
                state.selectedProduct = null;
            })
            .addCase(fetchProductBySlug.fulfilled, (state, action) => {
                state.selectedProduct = action.payload;
                state.loading = false;
            })
            .addCase(fetchProductBySlug.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.products = action.payload;
                state.loading = false;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createProduct.pending, (state) => {
                state.loading = true;
            })
            .addCase(createProduct.fulfilled, (state, action) => {
                state.success = true;
                state.products.push(action.payload);
                state.loading = false;
            })
            .addCase(updateProduct.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                state.success = true;
                const index = state.products.findIndex(p => p._id === action.payload._id);
                if (index !== -1) {
                    state.products[index] = action.payload;
                }
                state.loading = false;
            })
            .addCase(updateProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.deleteSuccess = true;
                state.products = state.products.filter(p => p._id !== action.payload);
            });
    }
});

export const { resetProductState } = productSlice.actions;
export default productSlice.reducer;

```

## File: `frontend/src/redux/slices/userSlice.ts`

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

interface UserState {
    users: any[];
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    users: [],
    loading: false,
    error: null
};

export const fetchUsers = createAsyncThunk(
    'users/fetchAll',
    async (_, thunkAPI) => {
        try {
            const { data } = await api.get('/users');
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.users = action.payload;
                state.loading = false;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export default userSlice.reducer;

```

## File: `frontend/src/redux/store.ts`

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import orderReducer from './slices/orderSlice';
import inquiryReducer from './slices/inquirySlice';
import userReducer from './slices/userSlice';
import collectionReducer from './slices/collectionSlice';
import cartReducer from './slices/cartSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        products: productReducer,
        orders: orderReducer,
        inquiries: inquiryReducer,
        users: userReducer,
        collections: collectionReducer,
        cart: cartReducer,
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

```

## File: `frontend/src/utils/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
    (config) => {
        let userInfo = null;
        try {
            const stored = localStorage.getItem('userInfo');
            if (stored && stored !== 'undefined') {
                userInfo = JSON.parse(stored);
            }
        } catch (e) {
            console.error("Corrupted session data", e);
        }

        if (userInfo && userInfo.token) {
            config.headers.Authorization = `Bearer ${userInfo.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle global errors (like 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const isAuthPage = path === '/account' || path.startsWith('/admin');

        if (error.response?.status === 401 && !isAuthPage) {
            localStorage.removeItem('userInfo');
            if (typeof window !== 'undefined') {
                window.location.href = '/account';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

```

## File: `frontend/src/utils/compressImage.ts`

```typescript
export const compressImageFile = (file: File, maxSize = 480, quality = 0.72): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                const scale = Math.min(1, maxSize / Math.max(width, height));
                width = Math.round(width * scale);
                height = Math.round(height * scale);

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas not supported'));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => reject(new Error('Invalid image'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(file);
    });
};
```

## File: `frontend/src/utils/getImageUrl.ts`

```typescript
export const getImageUrl = (path: string | undefined | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

```

## File: `frontend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}

```

## File: `frontend/tsconfig.tsbuildinfo`

```
{"fileNames":["./node_modules/typescript/lib/lib.es5.d.ts","./node_modules/typescript/lib/lib.es2015.d.ts","./node_modules/typescript/lib/lib.es2016.d.ts","./node_modules/typescript/lib/lib.es2017.d.ts","./node_modules/typescript/lib/lib.es2018.d.ts","./node_modules/typescript/lib/lib.es2019.d.ts","./node_modules/typescript/lib/lib.es2020.d.ts","./node_modules/typescript/lib/lib.es2021.d.ts","./node_modules/typescript/lib/lib.es2022.d.ts","./node_modules/typescript/lib/lib.es2023.d.ts","./node_modules/typescript/lib/lib.es2024.d.ts","./node_modules/typescript/lib/lib.esnext.d.ts","./node_modules/typescript/lib/lib.dom.d.ts","./node_modules/typescript/lib/lib.dom.iterable.d.ts","./node_modules/typescript/lib/lib.es2015.core.d.ts","./node_modules/typescript/lib/lib.es2015.collection.d.ts","./node_modules/typescript/lib/lib.es2015.generator.d.ts","./node_modules/typescript/lib/lib.es2015.iterable.d.ts","./node_modules/typescript/lib/lib.es2015.promise.d.ts","./node_modules/typescript/lib/lib.es2015.proxy.d.ts","./node_modules/typescript/lib/lib.es2015.reflect.d.ts","./node_modules/typescript/lib/lib.es2015.symbol.d.ts","./node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts","./node_modules/typescript/lib/lib.es2016.array.include.d.ts","./node_modules/typescript/lib/lib.es2016.intl.d.ts","./node_modules/typescript/lib/lib.es2017.arraybuffer.d.ts","./node_modules/typescript/lib/lib.es2017.date.d.ts","./node_modules/typescript/lib/lib.es2017.object.d.ts","./node_modules/typescript/lib/lib.es2017.sharedmemory.d.ts","./node_modules/typescript/lib/lib.es2017.string.d.ts","./node_modules/typescript/lib/lib.es2017.intl.d.ts","./node_modules/typescript/lib/lib.es2017.typedarrays.d.ts","./node_modules/typescript/lib/lib.es2018.asyncgenerator.d.ts","./node_modules/typescript/lib/lib.es2018.asynciterable.d.ts","./node_modules/typescript/lib/lib.es2018.intl.d.ts","./node_modules/typescript/lib/lib.es2018.promise.d.ts","./node_modules/typescript/lib/lib.es2018.regexp.d.ts","./node_modules/typescript/lib/lib.es2019.array.d.ts","./node_modules/typescript/lib/lib.es2019.object.d.ts","./node_modules/typescript/lib/lib.es2019.string.d.ts","./node_modules/typescript/lib/lib.es2019.symbol.d.ts","./node_modules/typescript/lib/lib.es2019.intl.d.ts","./node_modules/typescript/lib/lib.es2020.bigint.d.ts","./node_modules/typescript/lib/lib.es2020.date.d.ts","./node_modules/typescript/lib/lib.es2020.promise.d.ts","./node_modules/typescript/lib/lib.es2020.sharedmemory.d.ts","./node_modules/typescript/lib/lib.es2020.string.d.ts","./node_modules/typescript/lib/lib.es2020.symbol.wellknown.d.ts","./node_modules/typescript/lib/lib.es2020.intl.d.ts","./node_modules/typescript/lib/lib.es2020.number.d.ts","./node_modules/typescript/lib/lib.es2021.promise.d.ts","./node_modules/typescript/lib/lib.es2021.string.d.ts","./node_modules/typescript/lib/lib.es2021.weakref.d.ts","./node_modules/typescript/lib/lib.es2021.intl.d.ts","./node_modules/typescript/lib/lib.es2022.array.d.ts","./node_modules/typescript/lib/lib.es2022.error.d.ts","./node_modules/typescript/lib/lib.es2022.intl.d.ts","./node_modules/typescript/lib/lib.es2022.object.d.ts","./node_modules/typescript/lib/lib.es2022.string.d.ts","./node_modules/typescript/lib/lib.es2022.regexp.d.ts","./node_modules/typescript/lib/lib.es2023.array.d.ts","./node_modules/typescript/lib/lib.es2023.collection.d.ts","./node_modules/typescript/lib/lib.es2023.intl.d.ts","./node_modules/typescript/lib/lib.es2024.arraybuffer.d.ts","./node_modules/typescript/lib/lib.es2024.collection.d.ts","./node_modules/typescript/lib/lib.es2024.object.d.ts","./node_modules/typescript/lib/lib.es2024.promise.d.ts","./node_modules/typescript/lib/lib.es2024.regexp.d.ts","./node_modules/typescript/lib/lib.es2024.sharedmemory.d.ts","./node_modules/typescript/lib/lib.es2024.string.d.ts","./node_modules/typescript/lib/lib.esnext.array.d.ts","./node_modules/typescript/lib/lib.esnext.collection.d.ts","./node_modules/typescript/lib/lib.esnext.intl.d.ts","./node_modules/typescript/lib/lib.esnext.disposable.d.ts","./node_modules/typescript/lib/lib.esnext.promise.d.ts","./node_modules/typescript/lib/lib.esnext.decorators.d.ts","./node_modules/typescript/lib/lib.esnext.iterator.d.ts","./node_modules/typescript/lib/lib.esnext.float16.d.ts","./node_modules/typescript/lib/lib.esnext.error.d.ts","./node_modules/typescript/lib/lib.esnext.sharedmemory.d.ts","./node_modules/typescript/lib/lib.decorators.d.ts","./node_modules/typescript/lib/lib.decorators.legacy.d.ts","./node_modules/@types/react/global.d.ts","./node_modules/csstype/index.d.ts","./node_modules/@types/react/index.d.ts","./node_modules/next/dist/styled-jsx/types/css.d.ts","./node_modules/next/dist/styled-jsx/types/macro.d.ts","./node_modules/next/dist/styled-jsx/types/style.d.ts","./node_modules/next/dist/styled-jsx/types/global.d.ts","./node_modules/next/dist/styled-jsx/types/index.d.ts","./node_modules/next/dist/server/get-page-files.d.ts","./node_modules/@types/node/compatibility/disposable.d.ts","./node_modules/@types/node/compatibility/indexable.d.ts","./node_modules/@types/node/compatibility/iterators.d.ts","./node_modules/@types/node/compatibility/index.d.ts","./node_modules/@types/node/globals.typedarray.d.ts","./node_modules/@types/node/buffer.buffer.d.ts","./node_modules/@types/node/globals.d.ts","./node_modules/@types/node/web-globals/abortcontroller.d.ts","./node_modules/@types/node/web-globals/domexception.d.ts","./node_modules/@types/node/web-globals/events.d.ts","./node_modules/undici-types/header.d.ts","./node_modules/undici-types/readable.d.ts","./node_modules/undici-types/file.d.ts","./node_modules/undici-types/fetch.d.ts","./node_modules/undici-types/formdata.d.ts","./node_modules/undici-types/connector.d.ts","./node_modules/undici-types/client.d.ts","./node_modules/undici-types/errors.d.ts","./node_modules/undici-types/dispatcher.d.ts","./node_modules/undici-types/global-dispatcher.d.ts","./node_modules/undici-types/global-origin.d.ts","./node_modules/undici-types/pool-stats.d.ts","./node_modules/undici-types/pool.d.ts","./node_modules/undici-types/handlers.d.ts","./node_modules/undici-types/balanced-pool.d.ts","./node_modules/undici-types/agent.d.ts","./node_modules/undici-types/mock-interceptor.d.ts","./node_modules/undici-types/mock-agent.d.ts","./node_modules/undici-types/mock-client.d.ts","./node_modules/undici-types/mock-pool.d.ts","./node_modules/undici-types/mock-errors.d.ts","./node_modules/undici-types/proxy-agent.d.ts","./node_modules/undici-types/env-http-proxy-agent.d.ts","./node_modules/undici-types/retry-handler.d.ts","./node_modules/undici-types/retry-agent.d.ts","./node_modules/undici-types/api.d.ts","./node_modules/undici-types/interceptors.d.ts","./node_modules/undici-types/util.d.ts","./node_modules/undici-types/cookies.d.ts","./node_modules/undici-types/patch.d.ts","./node_modules/undici-types/websocket.d.ts","./node_modules/undici-types/eventsource.d.ts","./node_modules/undici-types/filereader.d.ts","./node_modules/undici-types/diagnostics-channel.d.ts","./node_modules/undici-types/content-type.d.ts","./node_modules/undici-types/cache.d.ts","./node_modules/undici-types/index.d.ts","./node_modules/@types/node/web-globals/fetch.d.ts","./node_modules/@types/node/assert.d.ts","./node_modules/@types/node/assert/strict.d.ts","./node_modules/@types/node/async_hooks.d.ts","./node_modules/@types/node/buffer.d.ts","./node_modules/@types/node/child_process.d.ts","./node_modules/@types/node/cluster.d.ts","./node_modules/@types/node/console.d.ts","./node_modules/@types/node/constants.d.ts","./node_modules/@types/node/crypto.d.ts","./node_modules/@types/node/dgram.d.ts","./node_modules/@types/node/diagnostics_channel.d.ts","./node_modules/@types/node/dns.d.ts","./node_modules/@types/node/dns/promises.d.ts","./node_modules/@types/node/domain.d.ts","./node_modules/@types/node/events.d.ts","./node_modules/@types/node/fs.d.ts","./node_modules/@types/node/fs/promises.d.ts","./node_modules/@types/node/http.d.ts","./node_modules/@types/node/http2.d.ts","./node_modules/@types/node/https.d.ts","./node_modules/@types/node/inspector.generated.d.ts","./node_modules/@types/node/module.d.ts","./node_modules/@types/node/net.d.ts","./node_modules/@types/node/os.d.ts","./node_modules/@types/node/path.d.ts","./node_modules/@types/node/perf_hooks.d.ts","./node_modules/@types/node/process.d.ts","./node_modules/@types/node/punycode.d.ts","./node_modules/@types/node/querystring.d.ts","./node_modules/@types/node/readline.d.ts","./node_modules/@types/node/readline/promises.d.ts","./node_modules/@types/node/repl.d.ts","./node_modules/@types/node/sea.d.ts","./node_modules/@types/node/stream.d.ts","./node_modules/@types/node/stream/promises.d.ts","./node_modules/@types/node/stream/consumers.d.ts","./node_modules/@types/node/stream/web.d.ts","./node_modules/@types/node/string_decoder.d.ts","./node_modules/@types/node/test.d.ts","./node_modules/@types/node/timers.d.ts","./node_modules/@types/node/timers/promises.d.ts","./node_modules/@types/node/tls.d.ts","./node_modules/@types/node/trace_events.d.ts","./node_modules/@types/node/tty.d.ts","./node_modules/@types/node/url.d.ts","./node_modules/@types/node/util.d.ts","./node_modules/@types/node/v8.d.ts","./node_modules/@types/node/vm.d.ts","./node_modules/@types/node/wasi.d.ts","./node_modules/@types/node/worker_threads.d.ts","./node_modules/@types/node/zlib.d.ts","./node_modules/@types/node/index.d.ts","./node_modules/@types/react/canary.d.ts","./node_modules/@types/react/experimental.d.ts","./node_modules/@types/react-dom/index.d.ts","./node_modules/@types/react-dom/canary.d.ts","./node_modules/@types/react-dom/experimental.d.ts","./node_modules/next/dist/lib/fallback.d.ts","./node_modules/next/dist/compiled/webpack/webpack.d.ts","./node_modules/next/dist/shared/lib/modern-browserslist-target.d.ts","./node_modules/next/dist/shared/lib/entry-constants.d.ts","./node_modules/next/dist/shared/lib/constants.d.ts","./node_modules/next/dist/lib/bundler.d.ts","./node_modules/next/dist/server/config.d.ts","./node_modules/next/dist/lib/load-custom-routes.d.ts","./node_modules/next/dist/shared/lib/image-config.d.ts","./node_modules/next/dist/build/webpack/plugins/subresource-integrity-plugin.d.ts","./node_modules/next/dist/server/body-streams.d.ts","./node_modules/next/dist/server/request/search-params.d.ts","./node_modules/next/dist/shared/lib/segment-cache/vary-params-decoding.d.ts","./node_modules/next/dist/server/app-render/vary-params.d.ts","./node_modules/next/dist/server/request/params.d.ts","./node_modules/next/dist/server/route-kind.d.ts","./node_modules/next/dist/server/route-definitions/route-definition.d.ts","./node_modules/next/dist/server/route-matches/route-match.d.ts","./node_modules/next/dist/client/components/app-router-headers.d.ts","./node_modules/next/dist/server/lib/cache-control.d.ts","./node_modules/next/dist/shared/lib/app-router-types.d.ts","./node_modules/next/dist/server/lib/cache-handlers/types.d.ts","./node_modules/next/dist/server/use-cache/use-cache-wrapper.d.ts","./node_modules/next/dist/server/resume-data-cache/cache-store.d.ts","./node_modules/next/dist/server/resume-data-cache/resume-data-cache.d.ts","./node_modules/next/dist/lib/constants.d.ts","./node_modules/next/dist/server/render-result.d.ts","./node_modules/next/dist/server/response-cache/types.d.ts","./node_modules/next/dist/server/response-cache/index.d.ts","./node_modules/@types/react/jsx-runtime.d.ts","./node_modules/next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup.d.ts","./node_modules/next/dist/build/static-paths/types.d.ts","./node_modules/next/dist/server/route-definitions/app-page-route-definition.d.ts","./node_modules/next/dist/build/adapter/setup-node-env.external.d.ts","./node_modules/next/dist/server/instrumentation/types.d.ts","./node_modules/next/dist/lib/setup-exception-listeners.d.ts","./node_modules/next/dist/lib/worker.d.ts","./node_modules/next/dist/server/lib/experimental/ppr.d.ts","./node_modules/next/dist/lib/page-types.d.ts","./node_modules/next/dist/build/segment-config/app/app-segment-config.d.ts","./node_modules/next/dist/build/segment-config/pages/pages-segment-config.d.ts","./node_modules/next/dist/build/analysis/get-page-static-info.d.ts","./node_modules/next/dist/build/webpack/loaders/get-module-build-info.d.ts","./node_modules/next/dist/build/webpack/plugins/middleware-plugin.d.ts","./node_modules/next/dist/server/require-hook.d.ts","./node_modules/next/dist/server/node-polyfill-crypto.d.ts","./node_modules/next/dist/server/node-environment-baseline.d.ts","./node_modules/next/dist/server/node-environment-extensions/error-inspect.d.ts","./node_modules/next/dist/server/node-environment-extensions/console-file.d.ts","./node_modules/next/dist/server/node-environment-extensions/console-exit.d.ts","./node_modules/next/dist/server/node-environment-extensions/console-dim.external.d.ts","./node_modules/next/dist/server/node-environment-extensions/unhandled-rejection.external.d.ts","./node_modules/next/dist/server/node-environment-extensions/random.d.ts","./node_modules/next/dist/server/node-environment-extensions/date.d.ts","./node_modules/next/dist/server/node-environment-extensions/web-crypto.d.ts","./node_modules/next/dist/server/node-environment-extensions/node-crypto.d.ts","./node_modules/next/dist/server/node-environment-extensions/fast-set-immediate.external.d.ts","./node_modules/next/dist/server/node-environment.d.ts","./node_modules/next/dist/build/page-extensions-type.d.ts","./node_modules/next/dist/server/route-modules/app-page/module.compiled.d.ts","./node_modules/next/dist/server/route-definitions/app-route-route-definition.d.ts","./node_modules/next/dist/server/lib/i18n-provider.d.ts","./node_modules/next/dist/server/web/next-url.d.ts","./node_modules/next/dist/compiled/@edge-runtime/cookies/index.d.ts","./node_modules/next/dist/server/web/spec-extension/cookies.d.ts","./node_modules/next/dist/server/web/spec-extension/request.d.ts","./node_modules/next/dist/shared/lib/deep-readonly.d.ts","./node_modules/next/dist/server/lib/incremental-cache/index.d.ts","./node_modules/next/dist/shared/lib/router/utils/middleware-route-matcher.d.ts","./node_modules/next/dist/build/webpack/plugins/flight-manifest-plugin.d.ts","./node_modules/next/dist/build/webpack/plugins/next-font-manifest-plugin.d.ts","./node_modules/next/dist/server/route-definitions/locale-route-definition.d.ts","./node_modules/next/dist/server/route-definitions/pages-route-definition.d.ts","./node_modules/next/dist/shared/lib/mitt.d.ts","./node_modules/next/dist/client/with-router.d.ts","./node_modules/next/dist/client/router.d.ts","./node_modules/next/dist/client/route-loader.d.ts","./node_modules/next/dist/client/page-loader.d.ts","./node_modules/next/dist/shared/lib/bloom-filter.d.ts","./node_modules/next/dist/shared/lib/router/router.d.ts","./node_modules/next/dist/shared/lib/router-context.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/loadable-context.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/loadable.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/image-config-context.shared-runtime.d.ts","./node_modules/next/dist/client/components/readonly-url-search-params.d.ts","./node_modules/next/dist/shared/lib/hooks-client-context.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/head-manager-context.shared-runtime.d.ts","./node_modules/next/dist/client/flight-data-helpers.d.ts","./node_modules/next/dist/client/components/segment-cache/cache-key.d.ts","./node_modules/next/dist/client/components/router-reducer/fetch-server-response.d.ts","./node_modules/next/dist/client/components/segment-cache/types.d.ts","./node_modules/next/dist/shared/lib/segment-cache/segment-value-encoding.d.ts","./node_modules/next/dist/client/components/segment-cache/scheduler.d.ts","./node_modules/next/dist/client/components/segment-cache/cache-map.d.ts","./node_modules/next/dist/client/components/segment-cache/vary-path.d.ts","./node_modules/next/dist/client/components/segment-cache/cache.d.ts","./node_modules/next/dist/client/components/router-reducer/ppr-navigations.d.ts","./node_modules/next/dist/client/components/segment-cache/navigation.d.ts","./node_modules/next/dist/client/components/router-reducer/router-reducer-types.d.ts","./node_modules/next/dist/shared/lib/app-router-context.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/server-inserted-html.shared-runtime.d.ts","./node_modules/next/dist/server/route-modules/pages/vendored/contexts/entrypoints.d.ts","./node_modules/next/dist/server/route-modules/pages/module.compiled.d.ts","./node_modules/next/dist/build/templates/pages.d.ts","./node_modules/next/dist/server/route-modules/pages/module.d.ts","./node_modules/next/dist/server/render.d.ts","./node_modules/next/dist/build/webpack/plugins/pages-manifest-plugin.d.ts","./node_modules/next/dist/server/route-definitions/pages-api-route-definition.d.ts","./node_modules/next/dist/server/route-matches/pages-api-route-match.d.ts","./node_modules/next/dist/server/route-matchers/route-matcher.d.ts","./node_modules/next/dist/server/route-matcher-providers/route-matcher-provider.d.ts","./node_modules/next/dist/server/route-matcher-managers/route-matcher-manager.d.ts","./node_modules/next/dist/server/normalizers/normalizer.d.ts","./node_modules/next/dist/server/normalizers/locale-route-normalizer.d.ts","./node_modules/next/dist/server/normalizers/request/pathname-normalizer.d.ts","./node_modules/next/dist/server/normalizers/request/suffix.d.ts","./node_modules/next/dist/server/normalizers/request/rsc.d.ts","./node_modules/next/dist/server/normalizers/request/next-data.d.ts","./node_modules/next/dist/server/after/builtin-request-context.d.ts","./node_modules/next/dist/server/normalizers/request/segment-prefix-rsc.d.ts","./node_modules/next/dist/server/route-modules/pages/builtin/_error.d.ts","./node_modules/next/dist/server/load-default-error-components.d.ts","./node_modules/next/dist/server/base-server.d.ts","./node_modules/next/dist/server/after/after.d.ts","./node_modules/next/dist/server/after/after-context.d.ts","./node_modules/next/dist/server/use-cache/cache-life.d.ts","./node_modules/next/dist/server/app-render/work-async-storage-instance.d.ts","./node_modules/next/dist/server/lib/lazy-result.d.ts","./node_modules/next/dist/server/app-render/create-error-handler.d.ts","./node_modules/next/dist/shared/lib/action-revalidation-kind.d.ts","./node_modules/next/dist/server/app-render/work-async-storage.external.d.ts","./node_modules/next/dist/server/async-storage/work-store.d.ts","./node_modules/next/dist/server/web/http.d.ts","./node_modules/next/dist/client/components/hooks-server-context.d.ts","./node_modules/next/dist/server/route-modules/app-route/shared-modules.d.ts","./node_modules/next/dist/client/components/redirect-status-code.d.ts","./node_modules/next/dist/client/components/redirect-error.d.ts","./node_modules/next/dist/server/web/spec-extension/adapters/request-cookies.d.ts","./node_modules/next/dist/server/async-storage/draft-mode-provider.d.ts","./node_modules/next/dist/server/web/spec-extension/adapters/headers.d.ts","./node_modules/next/dist/server/app-render/cache-signal.d.ts","./node_modules/next/dist/server/app-render/instant-validation/boundary-tracking.d.ts","./node_modules/next/dist/server/app-render/instant-validation/instant-validation-error.d.ts","./node_modules/next/dist/shared/lib/router/utils/parse-relative-url.d.ts","./node_modules/next/dist/server/app-render/instant-validation/instant-samples.d.ts","./node_modules/next/dist/server/app-render/dynamic-rendering.d.ts","./node_modules/next/dist/server/app-render/work-unit-async-storage-instance.d.ts","./node_modules/next/dist/server/lib/implicit-tags.d.ts","./node_modules/next/dist/server/app-render/staged-rendering.d.ts","./node_modules/next/dist/server/app-render/work-unit-async-storage.external.d.ts","./node_modules/next/dist/build/templates/app-route.d.ts","./node_modules/next/dist/server/app-render/action-async-storage-instance.d.ts","./node_modules/next/dist/server/app-render/action-async-storage.external.d.ts","./node_modules/next/dist/server/route-modules/app-route/module.d.ts","./node_modules/next/dist/server/route-modules/app-route/module.compiled.d.ts","./node_modules/next/dist/build/segment-config/app/app-segments.d.ts","./node_modules/next/dist/build/get-supported-browsers.d.ts","./node_modules/next/dist/build/utils.d.ts","./node_modules/next/dist/build/rendering-mode.d.ts","./node_modules/next/dist/server/lib/router-utils/build-prefetch-segment-data-route.d.ts","./node_modules/next/dist/server/lib/cpu-profile.d.ts","./node_modules/next/dist/build/turborepo-access-trace/types.d.ts","./node_modules/next/dist/build/turborepo-access-trace/result.d.ts","./node_modules/next/dist/build/turborepo-access-trace/helpers.d.ts","./node_modules/next/dist/build/turborepo-access-trace/index.d.ts","./node_modules/next/dist/export/routes/types.d.ts","./node_modules/next/dist/export/types.d.ts","./node_modules/next/dist/export/worker.d.ts","./node_modules/next/dist/build/worker.d.ts","./node_modules/next/dist/build/index.d.ts","./node_modules/next/dist/lib/coalesced-function.d.ts","./node_modules/next/dist/server/lib/router-utils/types.d.ts","./node_modules/next/dist/trace/types.d.ts","./node_modules/next/dist/trace/trace.d.ts","./node_modules/next/dist/trace/shared.d.ts","./node_modules/next/dist/trace/index.d.ts","./node_modules/next/dist/build/load-jsconfig.d.ts","./node_modules/@next/env/dist/index.d.ts","./node_modules/next/dist/build/webpack/plugins/telemetry-plugin/use-cache-tracker-utils.d.ts","./node_modules/next/dist/build/webpack/plugins/telemetry-plugin/telemetry-plugin.d.ts","./node_modules/next/dist/telemetry/storage.d.ts","./node_modules/next/dist/build/build-context.d.ts","./node_modules/next/dist/build/webpack-config.d.ts","./node_modules/next/dist/build/swc/generated-native.d.ts","./node_modules/next/dist/build/define-env.d.ts","./node_modules/next/dist/build/swc/index.d.ts","./node_modules/next/dist/build/swc/types.d.ts","./node_modules/next/dist/server/dev/parse-version-info.d.ts","./node_modules/next/dist/next-devtools/shared/types.d.ts","./node_modules/next/dist/server/dev/dev-indicator-server-state.d.ts","./node_modules/next/dist/next-devtools/dev-overlay/cache-indicator.d.ts","./node_modules/next/dist/server/lib/parse-stack.d.ts","./node_modules/next/dist/next-devtools/server/shared.d.ts","./node_modules/next/dist/next-devtools/shared/stack-frame.d.ts","./node_modules/next/dist/next-devtools/dev-overlay/utils/get-error-by-type.d.ts","./node_modules/next/dist/next-devtools/dev-overlay/container/runtime-error/render-error.d.ts","./node_modules/next/dist/next-devtools/dev-overlay/shared.d.ts","./node_modules/next/dist/server/dev/debug-channel.d.ts","./node_modules/next/dist/server/dev/hot-reloader-types.d.ts","./node_modules/next/dist/server/web/spec-extension/fetch-event.d.ts","./node_modules/next/dist/server/web/spec-extension/response.d.ts","./node_modules/next/dist/build/segment-config/middleware/middleware-config.d.ts","./node_modules/next/dist/server/web/types.d.ts","./node_modules/next/dist/shared/lib/router/utils/parse-url.d.ts","./node_modules/next/dist/server/base-http/node.d.ts","./node_modules/next/dist/server/lib/async-callback-set.d.ts","./node_modules/next/dist/shared/lib/router/utils/route-regex.d.ts","./node_modules/next/dist/shared/lib/router/utils/route-matcher.d.ts","./node_modules/sharp/lib/index.d.ts","./node_modules/next/dist/server/image-optimizer.d.ts","./node_modules/next/dist/server/next-server.d.ts","./node_modules/next/dist/server/lib/types.d.ts","./node_modules/next/dist/server/lib/lru-cache.d.ts","./node_modules/next/dist/server/lib/dev-bundler-service.d.ts","./node_modules/next/dist/server/dev/static-paths-worker.d.ts","./node_modules/next/dist/server/dev/next-dev-server.d.ts","./node_modules/next/dist/server/next.d.ts","./node_modules/next/dist/server/lib/render-server.d.ts","./node_modules/next/dist/server/lib/router-server.d.ts","./node_modules/next/dist/shared/lib/router/utils/path-match.d.ts","./node_modules/next/dist/server/lib/router-utils/filesystem.d.ts","./node_modules/next/dist/server/lib/router-utils/setup-dev-bundler.d.ts","./node_modules/next/dist/server/lib/router-utils/router-server-context.d.ts","./node_modules/next/dist/server/route-modules/route-module.d.ts","./node_modules/next/dist/server/load-components.d.ts","./node_modules/next/dist/server/web/adapter.d.ts","./node_modules/next/dist/server/app-render/types.d.ts","./node_modules/next/dist/build/webpack/loaders/metadata/types.d.ts","./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.d.ts","./node_modules/next/dist/server/lib/app-dir-module.d.ts","./node_modules/next/dist/server/app-render/app-render.d.ts","./node_modules/next/dist/server/route-modules/app-page/vendored/contexts/entrypoints.d.ts","./node_modules/next/dist/client/components/error-boundary.d.ts","./node_modules/next/dist/client/components/layout-router.d.ts","./node_modules/next/dist/client/components/render-from-template-context.d.ts","./node_modules/next/dist/client/components/client-page.d.ts","./node_modules/next/dist/client/components/client-segment.d.ts","./node_modules/next/dist/client/components/http-access-fallback/error-boundary.d.ts","./node_modules/next/dist/lib/metadata/types/alternative-urls-types.d.ts","./node_modules/next/dist/lib/metadata/types/extra-types.d.ts","./node_modules/next/dist/lib/metadata/types/metadata-types.d.ts","./node_modules/next/dist/lib/metadata/types/manifest-types.d.ts","./node_modules/next/dist/lib/metadata/types/opengraph-types.d.ts","./node_modules/next/dist/lib/metadata/types/twitter-types.d.ts","./node_modules/next/dist/lib/metadata/types/metadata-interface.d.ts","./node_modules/next/dist/lib/metadata/types/resolvers.d.ts","./node_modules/next/dist/lib/metadata/types/icons.d.ts","./node_modules/next/dist/lib/metadata/resolve-metadata.d.ts","./node_modules/next/dist/lib/metadata/metadata.d.ts","./node_modules/next/dist/lib/framework/boundary-components.d.ts","./node_modules/next/dist/server/app-render/rsc/preloads.d.ts","./node_modules/next/dist/server/app-render/rsc/postpone.d.ts","./node_modules/next/dist/server/app-render/rsc/taint.d.ts","./node_modules/next/dist/server/app-render/collect-segment-data.d.ts","./node_modules/next/dist/server/app-render/instant-validation/instant-validation.d.ts","./node_modules/next/dist/next-devtools/userspace/app/segment-explorer-node.d.ts","./node_modules/next/dist/server/app-render/entry-base.d.ts","./node_modules/next/dist/build/templates/app-page.d.ts","./node_modules/next/dist/server/route-modules/app-page/helpers/prerender-manifest-matcher.d.ts","./node_modules/@types/react/jsx-dev-runtime.d.ts","./node_modules/@types/react/compiler-runtime.d.ts","./node_modules/next/dist/server/route-modules/app-page/vendored/rsc/entrypoints.d.ts","./node_modules/@types/react-dom/client.d.ts","./node_modules/@types/react-dom/static.d.ts","./node_modules/@types/react-dom/server.d.ts","./node_modules/next/dist/server/route-modules/app-page/vendored/ssr/entrypoints.d.ts","./node_modules/next/dist/server/route-modules/app-page/module.d.ts","./node_modules/next/dist/server/request/fallback-params.d.ts","./node_modules/next/dist/server/web/spec-extension/image-response.d.ts","./node_modules/next/dist/server/web/spec-extension/user-agent.d.ts","./node_modules/next/dist/server/web/spec-extension/url-pattern.d.ts","./node_modules/next/dist/server/after/index.d.ts","./node_modules/next/dist/server/request/connection.d.ts","./node_modules/next/dist/server/web/exports/index.d.ts","./node_modules/next/dist/server/request-meta.d.ts","./node_modules/next/dist/cli/next-test.d.ts","./node_modules/next/dist/shared/lib/size-limit.d.ts","./node_modules/next/dist/server/config-shared.d.ts","./node_modules/next/dist/server/base-http/index.d.ts","./node_modules/next/dist/server/api-utils/index.d.ts","./node_modules/next/dist/build/adapter/build-complete.d.ts","./node_modules/next/dist/types.d.ts","./node_modules/next/dist/shared/lib/html-context.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/utils.d.ts","./node_modules/next/dist/pages/_app.d.ts","./node_modules/next/app.d.ts","./node_modules/next/dist/server/web/spec-extension/unstable-cache.d.ts","./node_modules/next/dist/server/web/spec-extension/revalidate.d.ts","./node_modules/next/dist/server/web/spec-extension/unstable-no-store.d.ts","./node_modules/next/dist/server/use-cache/cache-tag.d.ts","./node_modules/next/cache.d.ts","./node_modules/next/dist/pages/_document.d.ts","./node_modules/next/document.d.ts","./node_modules/next/dist/shared/lib/dynamic.d.ts","./node_modules/next/dynamic.d.ts","./node_modules/next/dist/pages/_error.d.ts","./node_modules/next/dist/client/components/catch-error.d.ts","./node_modules/next/dist/api/error.d.ts","./node_modules/next/error.d.ts","./node_modules/next/dist/shared/lib/head.d.ts","./node_modules/next/head.d.ts","./node_modules/next/dist/server/request/cookies.d.ts","./node_modules/next/dist/server/request/headers.d.ts","./node_modules/next/dist/server/request/draft-mode.d.ts","./node_modules/next/headers.d.ts","./node_modules/next/dist/shared/lib/get-img-props.d.ts","./node_modules/next/dist/client/image-component.d.ts","./node_modules/next/dist/shared/lib/image-external.d.ts","./node_modules/next/image.d.ts","./node_modules/next/dist/client/link.d.ts","./node_modules/next/link.d.ts","./node_modules/next/dist/client/components/unrecognized-action-error.d.ts","./node_modules/next/dist/client/components/redirect.d.ts","./node_modules/next/dist/client/components/not-found.d.ts","./node_modules/next/dist/client/components/forbidden.d.ts","./node_modules/next/dist/client/components/unauthorized.d.ts","./node_modules/next/dist/client/components/unstable-rethrow.server.d.ts","./node_modules/next/dist/client/components/unstable-rethrow.d.ts","./node_modules/next/dist/client/components/navigation.react-server.d.ts","./node_modules/next/dist/client/components/navigation.d.ts","./node_modules/next/navigation.d.ts","./node_modules/next/router.d.ts","./node_modules/next/dist/client/script.d.ts","./node_modules/next/script.d.ts","./node_modules/next/dist/compiled/@edge-runtime/primitives/url.d.ts","./node_modules/next/dist/compiled/@vercel/og/satori/index.d.ts","./node_modules/next/dist/compiled/@vercel/og/types.d.ts","./node_modules/next/server.d.ts","./node_modules/next/types/global.d.ts","./node_modules/next/types/compiled.d.ts","./node_modules/next/types.d.ts","./node_modules/next/index.d.ts","./node_modules/next/image-types/global.d.ts","./.next/dev/types/routes.d.ts","./next-env.d.ts","./next.config.ts","./src/data/categories.ts","./src/data/products.ts","./node_modules/redux/dist/redux.d.ts","./node_modules/react-redux/dist/react-redux.d.ts","./node_modules/immer/dist/immer.d.ts","./node_modules/reselect/dist/reselect.d.ts","./node_modules/redux-thunk/dist/redux-thunk.d.ts","./node_modules/@reduxjs/toolkit/dist/uncheckedindexed.ts","./node_modules/@reduxjs/toolkit/dist/index.d.mts","./node_modules/axios/index.d.ts","./src/utils/api.ts","./src/redux/slices/authslice.ts","./src/redux/slices/productslice.ts","./src/redux/slices/orderslice.ts","./src/redux/slices/inquiryslice.ts","./src/redux/slices/userslice.ts","./src/redux/slices/collectionslice.ts","./src/redux/slices/cartslice.ts","./src/redux/store.ts","./src/redux/hooks.ts","./src/hooks/usecart.ts","./src/utils/compressimage.ts","./src/utils/getimageurl.ts","./node_modules/next/dist/compiled/@next/font/dist/types.d.ts","./node_modules/next/dist/compiled/@next/font/dist/google/index.d.ts","./node_modules/next/font/google/index.d.ts","./node_modules/lucide-react/dist/lucide-react.d.ts","./src/components/navbar.tsx","./src/components/footer.tsx","./src/components/announcementbar.tsx","./node_modules/motion-utils/dist/index.d.ts","./node_modules/motion-dom/dist/index.d.ts","./node_modules/framer-motion/dist/types.d-docc-kzb.d.ts","./node_modules/framer-motion/dist/types/index.d.ts","./src/components/cartdrawer.tsx","./src/components/reduxprovider.tsx","./node_modules/goober/goober.d.ts","./node_modules/react-hot-toast/dist/index.d.ts","./src/app/layout.tsx","./src/components/sectionheader.tsx","./src/components/hero.tsx","./src/components/productcard.tsx","./src/app/page.tsx","./src/components/breadcrumbhero.tsx","./src/app/account/page.tsx","./src/components/breadcrumb.tsx","./src/app/account/orders/page.tsx","./src/app/account/orders/[id]/page.tsx","./src/app/account/profile/page.tsx","./src/components/admin/adminsidebar.tsx","./src/app/admin/layout.tsx","./src/app/admin/page.tsx","./node_modules/react-hook-form/dist/constants.d.ts","./node_modules/react-hook-form/dist/utils/createsubject.d.ts","./node_modules/react-hook-form/dist/types/events.d.ts","./node_modules/react-hook-form/dist/types/path/common.d.ts","./node_modules/react-hook-form/dist/types/path/eager.d.ts","./node_modules/react-hook-form/dist/types/path/index.d.ts","./node_modules/react-hook-form/dist/types/fieldarray.d.ts","./node_modules/react-hook-form/dist/types/resolvers.d.ts","./node_modules/react-hook-form/dist/types/form.d.ts","./node_modules/react-hook-form/dist/types/utils.d.ts","./node_modules/react-hook-form/dist/types/fields.d.ts","./node_modules/react-hook-form/dist/types/errors.d.ts","./node_modules/react-hook-form/dist/types/validator.d.ts","./node_modules/react-hook-form/dist/types/controller.d.ts","./node_modules/react-hook-form/dist/types/watch.d.ts","./node_modules/react-hook-form/dist/types/index.d.ts","./node_modules/react-hook-form/dist/controller.d.ts","./node_modules/react-hook-form/dist/form.d.ts","./node_modules/react-hook-form/dist/formstatesubscribe.d.ts","./node_modules/react-hook-form/dist/logic/appenderrors.d.ts","./node_modules/react-hook-form/dist/logic/createformcontrol.d.ts","./node_modules/react-hook-form/dist/logic/index.d.ts","./node_modules/react-hook-form/dist/usecontroller.d.ts","./node_modules/react-hook-form/dist/usefieldarray.d.ts","./node_modules/react-hook-form/dist/useform.d.ts","./node_modules/react-hook-form/dist/useformcontext.d.ts","./node_modules/react-hook-form/dist/useformstate.d.ts","./node_modules/react-hook-form/dist/usewatch.d.ts","./node_modules/react-hook-form/dist/utils/get.d.ts","./node_modules/react-hook-form/dist/utils/set.d.ts","./node_modules/react-hook-form/dist/utils/index.d.ts","./node_modules/react-hook-form/dist/watch.d.ts","./node_modules/react-hook-form/dist/index.d.ts","./node_modules/zod/v3/helpers/typealiases.d.cts","./node_modules/zod/v3/helpers/util.d.cts","./node_modules/zod/v3/zoderror.d.cts","./node_modules/zod/v3/locales/en.d.cts","./node_modules/zod/v3/errors.d.cts","./node_modules/zod/v3/helpers/parseutil.d.cts","./node_modules/zod/v3/helpers/enumutil.d.cts","./node_modules/zod/v3/helpers/errorutil.d.cts","./node_modules/zod/v3/helpers/partialutil.d.cts","./node_modules/zod/v3/standard-schema.d.cts","./node_modules/zod/v3/types.d.cts","./node_modules/zod/v3/external.d.cts","./node_modules/zod/v3/index.d.cts","./node_modules/zod/v4/core/json-schema.d.cts","./node_modules/zod/v4/core/standard-schema.d.cts","./node_modules/zod/v4/core/registries.d.cts","./node_modules/zod/v4/core/to-json-schema.d.cts","./node_modules/zod/v4/core/util.d.cts","./node_modules/zod/v4/core/versions.d.cts","./node_modules/zod/v4/core/schemas.d.cts","./node_modules/zod/v4/core/checks.d.cts","./node_modules/zod/v4/core/errors.d.cts","./node_modules/zod/v4/core/core.d.cts","./node_modules/zod/v4/core/parse.d.cts","./node_modules/zod/v4/core/regexes.d.cts","./node_modules/zod/v4/locales/ar.d.cts","./node_modules/zod/v4/locales/az.d.cts","./node_modules/zod/v4/locales/be.d.cts","./node_modules/zod/v4/locales/bg.d.cts","./node_modules/zod/v4/locales/ca.d.cts","./node_modules/zod/v4/locales/cs.d.cts","./node_modules/zod/v4/locales/da.d.cts","./node_modules/zod/v4/locales/de.d.cts","./node_modules/zod/v4/locales/en.d.cts","./node_modules/zod/v4/locales/eo.d.cts","./node_modules/zod/v4/locales/es.d.cts","./node_modules/zod/v4/locales/fa.d.cts","./node_modules/zod/v4/locales/fi.d.cts","./node_modules/zod/v4/locales/fr.d.cts","./node_modules/zod/v4/locales/fr-ca.d.cts","./node_modules/zod/v4/locales/he.d.cts","./node_modules/zod/v4/locales/hu.d.cts","./node_modules/zod/v4/locales/hy.d.cts","./node_modules/zod/v4/locales/id.d.cts","./node_modules/zod/v4/locales/is.d.cts","./node_modules/zod/v4/locales/it.d.cts","./node_modules/zod/v4/locales/ja.d.cts","./node_modules/zod/v4/locales/ka.d.cts","./node_modules/zod/v4/locales/kh.d.cts","./node_modules/zod/v4/locales/km.d.cts","./node_modules/zod/v4/locales/ko.d.cts","./node_modules/zod/v4/locales/lt.d.cts","./node_modules/zod/v4/locales/mk.d.cts","./node_modules/zod/v4/locales/ms.d.cts","./node_modules/zod/v4/locales/nl.d.cts","./node_modules/zod/v4/locales/no.d.cts","./node_modules/zod/v4/locales/ota.d.cts","./node_modules/zod/v4/locales/ps.d.cts","./node_modules/zod/v4/locales/pl.d.cts","./node_modules/zod/v4/locales/pt.d.cts","./node_modules/zod/v4/locales/ru.d.cts","./node_modules/zod/v4/locales/sl.d.cts","./node_modules/zod/v4/locales/sv.d.cts","./node_modules/zod/v4/locales/ta.d.cts","./node_modules/zod/v4/locales/th.d.cts","./node_modules/zod/v4/locales/tr.d.cts","./node_modules/zod/v4/locales/ua.d.cts","./node_modules/zod/v4/locales/uk.d.cts","./node_modules/zod/v4/locales/ur.d.cts","./node_modules/zod/v4/locales/uz.d.cts","./node_modules/zod/v4/locales/vi.d.cts","./node_modules/zod/v4/locales/zh-cn.d.cts","./node_modules/zod/v4/locales/zh-tw.d.cts","./node_modules/zod/v4/locales/yo.d.cts","./node_modules/zod/v4/locales/index.d.cts","./node_modules/zod/v4/core/doc.d.cts","./node_modules/zod/v4/core/api.d.cts","./node_modules/zod/v4/core/json-schema-processors.d.cts","./node_modules/zod/v4/core/json-schema-generator.d.cts","./node_modules/zod/v4/core/index.d.cts","./node_modules/@hookform/resolvers/zod/dist/zod.d.ts","./node_modules/@hookform/resolvers/zod/dist/index.d.ts","./node_modules/zod/v4/classic/errors.d.cts","./node_modules/zod/v4/classic/parse.d.cts","./node_modules/zod/v4/classic/schemas.d.cts","./node_modules/zod/v4/classic/checks.d.cts","./node_modules/zod/v4/classic/compat.d.cts","./node_modules/zod/v4/classic/from-json-schema.d.cts","./node_modules/zod/v4/classic/iso.d.cts","./node_modules/zod/v4/classic/coerce.d.cts","./node_modules/zod/v4/classic/external.d.cts","./node_modules/zod/index.d.cts","./src/components/admin/emptystate.tsx","./src/components/ui/modal.tsx","./src/app/admin/collections/page.tsx","./src/app/admin/customers/page.tsx","./src/app/admin/inquiries/page.tsx","./src/app/admin/login/page.tsx","./src/app/admin/orders/page.tsx","./src/components/admin/productmodal.tsx","./src/app/admin/products/page.tsx","./src/app/admin/users/page.tsx","./src/app/category/[slug]/page.tsx","./src/app/checkout/page.tsx","./src/app/contact/page.tsx","./src/app/login/page.tsx","./src/app/product/[slug]/page.tsx","./src/context/cartcontext.tsx","./.next/types/cache-life.d.ts","./.next/types/routes.d.ts","./.next/types/validator.ts","./.next/dev/types/cache-life.d.ts","./.next/dev/types/validator.ts","./node_modules/@types/estree/index.d.ts","./node_modules/@types/json-schema/index.d.ts","./node_modules/@types/json5/index.d.ts","./node_modules/@types/use-sync-external-store/index.d.ts"],"fileIdsList":[[97,143,483,484,485,486,726],[97,143,726,729],[97,143,226,527,530,571,575,577,579,580,581,583,584,712,713,714,715,716,718,719,720,721,722,723,724,726,729],[97,143,483,484,485,486,729],[97,143,226,527,571,575,577,579,580,581,583,584,712,713,714,715,716,718,719,720,721,722,723,724,726,727,729],[97,143,528,529,530,726,729],[97,143,226,528,726,729],[97,143,698,726,729],[97,143,617,630,697,726,729],[97,143,535,537,538,539,540,726,729],[97,143,226,726,729],[97,140,143,726,729],[97,142,143,726,729],[143,726,729],[97,143,148,176,726,729],[97,143,144,149,154,162,173,184,726,729],[97,143,144,145,154,162,726,729],[92,93,94,97,143,726,729],[97,143,146,185,726,729],[97,143,147,148,155,163,726,729],[97,143,148,173,181,726,729],[97,143,149,151,154,162,726,729],[97,142,143,150,726,729],[97,143,151,152,726,729],[97,143,153,154,726,729],[97,142,143,154,726,729],[97,143,154,155,156,173,184,726,729],[97,143,154,155,156,169,173,176,726,729],[97,143,151,154,157,162,173,184,726,729],[97,143,154,155,157,158,162,173,181,184,726,729],[97,143,157,159,173,181,184,726,729],[95,96,97,98,99,100,101,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,726,729],[97,143,154,160,726,729],[97,143,161,184,189,726,729],[97,143,151,154,162,173,726,729],[97,143,163,726,729],[97,143,164,726,729],[97,142,143,165,726,729],[97,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,726,729],[97,143,167,726,729],[97,143,168,726,729],[97,143,154,169,170,726,729],[97,143,169,171,185,187,726,729],[97,143,154,173,174,176,726,729],[97,143,175,176,726,729],[97,143,173,174,726,729],[97,143,176,726,729],[97,143,177,726,729],[97,140,143,173,178,726,729],[97,143,154,179,180,726,729],[97,143,179,180,726,729],[97,143,148,162,173,181,726,729],[97,143,182,726,729],[97,143,162,183,726,729],[97,143,157,168,184,726,729],[97,143,148,185,726,729],[97,143,173,186,726,729],[97,143,161,187,726,729],[97,143,188,726,729],[97,138,143,726,729],[97,138,143,154,156,165,173,176,184,187,189,726,729],[97,143,173,190,726,729],[85,89,97,143,192,193,194,196,478,523,726,729],[85,97,143,726,729],[85,89,97,143,192,193,194,195,459,478,523,726,729],[85,89,97,143,192,193,195,196,478,523,726,729],[85,97,143,196,459,460,726,729],[85,97,143,196,459,726,729],[85,89,97,143,193,194,195,196,478,523,726,729],[85,89,97,143,192,194,195,196,478,523,726,729],[83,84,97,143,726,729],[85,97,143,564,726,729],[85,97,143,226,563,564,565,726,729],[84,97,143,726,729],[97,143,563,726,729],[97,143,481,726,729],[97,143,483,484,485,486,726,729],[97,143,429,492,493,726,729],[97,143,201,202,204,216,240,355,366,474,726,729],[97,143,204,235,236,237,239,474,726,729],[97,143,204,372,374,376,377,379,474,476,726,729],[97,143,204,238,275,474,726,729],[97,143,202,204,215,216,222,228,233,354,355,356,365,474,476,726,729],[97,143,474,726,729],[97,143,211,217,236,256,351,726,729],[97,143,204,726,729],[97,143,197,211,217,726,729],[97,143,383,726,729],[97,143,380,381,383,726,729],[97,143,380,382,474,726,729],[97,143,157,256,453,471,726,729],[97,143,157,327,330,346,351,471,726,729],[97,143,157,299,471,726,729],[97,143,359,726,729],[97,143,358,359,360,726,729],[97,143,358,726,729],[91,97,143,157,197,204,216,222,228,234,236,240,241,254,255,322,352,353,366,474,478,726,729],[97,143,201,204,238,275,372,373,378,474,526,726,729],[97,143,238,526,726,729],[97,143,201,255,424,474,526,726,729],[97,143,526,726,729],[97,143,204,238,239,526,726,729],[97,143,375,526,726,729],[97,143,241,354,357,364,726,729],[85,97,143,429,726,729],[97,143,168,211,226,726,729],[97,143,211,226,726,729],[85,97,143,296,726,729],[85,97,143,226,726,729],[85,97,143,217,226,429,726,729],[97,143,211,282,296,297,508,515,726,729],[97,143,281,509,510,511,512,514,726,729],[97,143,332,726,729],[97,143,332,333,726,729],[97,143,215,217,284,285,726,729],[97,143,217,291,292,726,729],[97,143,217,286,294,726,729],[97,143,291,726,729],[97,143,209,217,284,285,286,287,288,289,290,291,294,726,729],[97,143,217,284,291,292,293,295,726,729],[97,143,217,285,287,288,726,729],[97,143,285,287,290,292,726,729],[97,143,513,726,729],[97,143,217,726,729],[85,97,143,205,502,726,729],[85,97,143,184,726,729],[85,97,143,238,273,726,729],[85,97,143,238,366,726,729],[97,143,271,276,726,729],[85,97,143,272,480,726,729],[97,143,556,726,729],[85,89,97,143,157,192,193,194,195,196,478,522,726,729],[97,143,157,217,726,729],[97,143,157,216,221,302,319,361,362,366,421,423,474,475,726,729],[97,143,254,363,726,729],[97,143,478,726,729],[97,143,203,726,729],[85,97,143,208,211,426,442,444,726,729],[97,143,168,211,426,441,442,443,525,726,729],[97,143,435,436,437,438,439,440,726,729],[97,143,437,726,729],[97,143,441,726,729],[97,143,226,390,391,393,726,729],[85,97,143,217,384,385,386,387,392,726,729],[97,143,390,392,726,729],[97,143,388,726,729],[97,143,389,726,729],[85,97,143,226,272,480,726,729],[85,97,143,226,479,480,726,729],[85,97,143,226,480,726,729],[97,143,319,320,726,729],[97,143,320,726,729],[97,143,157,475,480,726,729],[97,143,349,726,729],[97,142,143,348,726,729],[97,143,211,217,223,225,327,340,344,346,423,426,463,464,471,475,726,729],[97,143,217,266,288,726,729],[97,143,327,338,341,346,726,729],[85,97,143,208,211,327,330,346,349,383,430,431,432,433,434,445,446,447,448,449,450,451,452,526,726,729],[97,143,208,211,236,327,334,335,336,339,340,726,729],[97,143,173,217,236,338,345,426,427,471,726,729],[97,143,342,726,729],[97,143,157,168,205,217,221,231,263,264,267,319,322,387,421,422,463,474,475,476,478,526,726,729],[97,143,208,209,211,726,729],[97,143,327,726,729],[97,142,143,236,263,264,321,322,323,324,325,326,475,726,729],[97,143,346,726,729],[97,142,143,210,211,221,225,261,327,334,335,336,337,338,341,342,343,344,345,464,726,729],[97,143,157,261,262,334,475,476,726,729],[97,143,236,264,319,322,327,423,475,726,729],[97,143,157,474,476,726,729],[97,143,157,173,471,475,476,726,729],[97,143,157,168,197,211,216,223,225,228,231,238,258,263,264,265,266,267,302,303,305,308,310,313,314,315,316,318,366,421,423,471,474,475,476,726,729],[97,143,157,173,726,729],[97,143,204,205,206,234,471,472,473,478,480,526,726,729],[97,143,201,202,474,726,729],[97,143,395,726,729],[97,143,157,173,184,213,379,383,384,385,386,387,393,394,526,726,729],[97,143,168,184,197,211,213,225,228,264,303,308,318,319,372,399,400,401,407,410,411,421,423,471,474,726,729],[97,143,228,234,241,254,264,322,474,726,729],[97,143,157,184,205,216,225,264,405,471,474,726,729],[97,143,425,726,729],[97,143,157,395,408,409,418,726,729],[97,143,471,474,726,729],[97,143,324,464,726,729],[97,143,225,263,366,480,726,729],[97,143,157,168,203,308,368,372,401,407,410,413,471,726,729],[97,143,157,241,254,372,414,726,729],[97,143,204,265,366,416,474,476,726,729],[97,143,157,184,387,474,726,729],[97,143,157,238,265,366,367,368,377,395,415,417,474,726,729],[91,97,143,157,263,420,478,480,726,729],[97,143,317,421,726,729],[97,143,157,168,211,214,216,217,223,225,231,240,241,254,264,267,303,305,315,318,319,366,399,400,401,402,404,406,421,423,471,480,726,729],[97,143,157,173,241,407,412,418,471,726,729],[97,143,244,245,246,247,248,249,250,251,252,253,726,729],[97,143,258,309,726,729],[97,143,311,726,729],[97,143,309,726,729],[97,143,311,312,726,729],[97,143,157,215,216,217,221,222,475,726,729],[97,143,157,168,203,205,223,227,263,266,267,301,421,471,476,478,480,726,729],[97,143,157,168,184,207,214,215,225,227,264,419,464,470,475,726,729],[97,143,334,726,729],[97,143,335,726,729],[97,143,217,228,463,726,729],[97,143,336,726,729],[97,143,210,726,729],[97,143,212,224,726,729],[97,143,157,212,216,223,726,729],[97,143,219,224,726,729],[97,143,220,726,729],[97,143,212,213,726,729],[97,143,212,268,726,729],[97,143,212,726,729],[97,143,214,258,307,726,729],[97,143,306,726,729],[97,143,211,213,214,726,729],[97,143,214,304,726,729],[97,143,211,213,726,729],[97,143,263,366,726,729],[97,143,463,726,729],[97,143,157,184,223,225,229,263,366,420,423,426,427,428,454,455,458,462,464,471,475,726,729],[97,143,277,280,282,283,296,297,726,729],[85,97,143,194,196,226,456,457,726,729],[85,97,143,194,196,226,456,457,461,726,729],[97,143,350,726,729],[97,143,236,257,262,263,327,328,329,330,331,333,346,347,349,352,420,423,474,476,726,729],[97,143,296,726,729],[97,143,157,301,471,726,729],[97,143,301,726,729],[97,143,157,223,269,298,300,302,420,471,478,480,726,729],[97,143,277,278,279,280,282,283,296,297,479,726,729],[91,97,143,157,168,184,212,213,225,231,263,264,267,366,418,419,421,471,474,475,478,726,729],[97,143,208,211,218,726,729],[97,143,262,264,396,399,726,729],[97,143,262,397,465,466,467,468,469,726,729],[97,143,157,258,474,726,729],[97,143,157,726,729],[97,143,261,346,726,729],[97,143,260,726,729],[97,143,262,315,726,729],[97,143,259,261,474,726,729],[97,143,157,207,262,396,397,398,471,474,475,726,729],[85,97,143,211,217,295,726,729],[85,97,143,209,726,729],[97,143,199,200,726,729],[85,97,143,205,726,729],[85,97,143,211,281,726,729],[85,91,97,143,263,267,478,480,726,729],[97,143,205,502,503,726,729],[85,97,143,276,726,729],[85,97,143,168,184,203,270,272,274,275,480,726,729],[97,143,211,238,475,726,729],[97,143,211,403,726,729],[85,97,143,155,157,168,201,203,276,374,478,479,726,729],[85,97,143,192,193,194,195,196,478,523,726,729],[85,86,87,88,89,97,143,726,729],[97,143,148,726,729],[97,143,369,370,371,726,729],[97,143,369,726,729],[85,89,97,143,157,159,168,191,192,193,194,195,196,197,203,231,236,413,441,476,477,480,523,726,729],[97,143,488,726,729],[97,143,490,726,729],[97,143,494,726,729],[97,143,557,726,729],[97,143,496,726,729],[97,143,498,499,500,726,729],[97,143,504,726,729],[90,97,143,482,487,489,491,495,497,501,505,507,517,518,520,524,525,526,527,726,729],[97,143,506,726,729],[97,143,516,726,729],[97,143,272,726,729],[97,143,519,726,729],[97,142,143,262,396,397,399,465,466,468,469,521,523,726,729],[97,143,191,726,729],[85,97,143,600,726,729],[97,143,600,601,602,603,606,607,608,609,610,611,612,615,616,726,729],[97,143,600,726,729],[97,143,604,605,726,729],[85,97,143,597,600,726,729],[97,143,594,595,597,726,729],[97,143,590,593,595,597,726,729],[97,143,594,597,726,729],[85,97,143,585,586,587,590,591,592,594,595,596,597,726,729],[97,143,587,590,591,592,593,594,595,596,597,598,599,726,729],[97,143,594,726,729],[97,143,588,594,595,726,729],[97,143,588,589,726,729],[97,143,593,595,596,726,729],[97,143,593,726,729],[97,143,585,590,593,595,596,726,729],[85,97,143,590,593,594,595,726,729],[97,143,613,614,726,729],[85,97,143,569,726,729],[85,97,143,535,726,729],[97,143,535,726,729],[97,143,173,191,726,729],[97,110,114,143,184,726,729],[97,110,143,173,184,726,729],[97,105,143,726,729],[97,107,110,143,181,184,726,729],[97,143,162,181,726,729],[97,105,143,191,726,729],[97,107,110,143,162,184,726,729],[97,102,103,106,109,143,154,173,184,726,729],[97,110,117,143,726,729],[97,102,108,143,726,729],[97,110,131,132,143,726,729],[97,106,110,143,176,184,191,726,729],[97,131,143,191,726,729],[97,104,105,143,191,726,729],[97,110,143,726,729],[97,104,105,106,107,108,109,110,111,112,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,132,133,134,135,136,137,143,726,729],[97,110,125,143,726,729],[97,110,117,118,143,726,729],[97,108,110,118,119,143,726,729],[97,109,143,726,729],[97,102,105,110,143,726,729],[97,110,114,118,119,143,726,729],[97,114,143,726,729],[97,108,110,113,143,184,726,729],[97,102,107,110,117,143,726,729],[97,143,173,726,729],[97,105,110,131,143,189,191,726,729],[97,143,708,726,729],[97,143,620,621,726,729],[97,143,618,619,620,622,623,628,726,729],[97,143,619,620,726,729],[97,143,628,726,729],[97,143,629,726,729],[97,143,620,726,729],[97,143,618,619,620,623,624,625,626,627,726,729],[97,143,618,619,630,726,729],[97,143,697,726,729],[97,143,697,702,726,729],[97,143,692,695,697,700,701,702,703,704,705,706,707,726,729],[97,143,631,633,702,726,729],[97,143,697,700,726,729],[97,143,632,697,701,726,729],[97,143,633,635,637,638,639,640,726,729],[97,143,635,637,639,640,726,729],[97,143,635,637,639,726,729],[97,143,632,635,637,638,640,726,729],[97,143,631,633,634,635,636,637,638,639,640,641,642,692,693,694,695,696,726,729],[97,143,631,633,634,637,726,729],[97,143,633,634,637,726,729],[97,143,637,640,726,729],[97,143,631,632,634,635,636,638,639,640,726,729],[97,143,631,632,633,637,697,726,729],[97,143,637,638,639,640,726,729],[97,143,639,726,729],[97,143,643,644,645,646,647,648,649,650,651,652,653,654,655,656,657,658,659,660,661,662,663,664,665,666,667,668,669,670,671,672,673,674,675,676,677,678,679,680,681,682,683,684,685,686,687,688,689,690,691,726,729],[85,97,143,226,507,517,543,552,555,559,566,578,726,729],[85,97,143,226,507,517,546,552,555,559,566,578,726,729],[85,97,143,226,507,517,544,550,552,559,566,576,726,729],[85,97,143,226,517,543,544,552,559,566,578,726,729],[85,97,143,226,549,551,552,555,559,566,570,617,699,709,710,711,726,729],[85,97,143,226,548,551,552,559,566,570,710,726,729],[85,97,143,226,547,551,552,555,559,566,570,710,726,729],[85,97,143,226,517,552,566,582,726,729],[85,97,143,226,507,517,544,552,559,566,617,699,709,726,729],[85,97,143,226,517,546,551,552,555,559,566,570,711,726,729],[85,97,143,226,507,545,546,552,559,726,729],[85,97,143,226,545,551,552,555,559,566,570,710,711,717,726,729],[85,97,143,226,507,548,551,552,559,570,710,726,729],[85,97,143,226,507,534,545,549,551,552,559,566,574,726,729],[85,97,143,226,507,517,520,543,546,550,552,553,555,559,566,576,726,729],[85,97,143,226,507,547,552,559,566,726,729],[85,97,143,226,517,525,558,560,561,562,567,568,570,726,729],[85,97,143,226,507,534,545,547,549,551,552,553,555,559,566,572,573,574,726,729],[85,97,143,226,507,534,545,552,553,554,555,559,566,574,726,729],[85,97,143,226,507,517,544,552,559,726,729],[85,97,143,226,559,566,726,729],[85,97,143,226,549,551,552,555,559,566,617,699,709,726,729],[85,97,143,226,507,559,566,726,729],[85,97,143,226,507,550,553,555,559,566,726,729],[97,143,226,507,551,552,559,726,729],[85,97,143,226,566,726,729],[85,97,143,226,507,549,551,552,553,559,726,729],[97,143,226,507,533,534,553,555,559,726,729],[97,143,226,536,551,726,729],[97,143,226,507,726,729],[85,97,143,226,534,726,729],[97,143,226,550,552,726,729],[97,143,226,541,543,726,729],[97,143,226,541,544,545,546,547,548,549,550,726,729],[97,143,226,542,726,729]],"fileInfos":[{"version":"c430d44666289dae81f30fa7b2edebf186ecc91a2d4c71266ea6ae76388792e1","affectsGlobalScope":true,"impliedFormat":1},{"version":"45b7ab580deca34ae9729e97c13cfd999df04416a79116c3bfb483804f85ded4","impliedFormat":1},{"version":"3facaf05f0c5fc569c5649dd359892c98a85557e3e0c847964caeb67076f4d75","impliedFormat":1},{"version":"e44bb8bbac7f10ecc786703fe0a6a4b952189f908707980ba8f3c8975a760962","impliedFormat":1},{"version":"5e1c4c362065a6b95ff952c0eab010f04dcd2c3494e813b493ecfd4fcb9fc0d8","impliedFormat":1},{"version":"68d73b4a11549f9c0b7d352d10e91e5dca8faa3322bfb77b661839c42b1ddec7","impliedFormat":1},{"version":"5efce4fc3c29ea84e8928f97adec086e3dc876365e0982cc8479a07954a3efd4","impliedFormat":1},{"version":"feecb1be483ed332fad555aff858affd90a48ab19ba7272ee084704eb7167569","impliedFormat":1},{"version":"ee7bad0c15b58988daa84371e0b89d313b762ab83cb5b31b8a2d1162e8eb41c2","impliedFormat":1},{"version":"27bdc30a0e32783366a5abeda841bc22757c1797de8681bbe81fbc735eeb1c10","impliedFormat":1},{"version":"8fd575e12870e9944c7e1d62e1f5a73fcf23dd8d3a321f2a2c74c20d022283fe","impliedFormat":1},{"version":"2ab096661c711e4a81cc464fa1e6feb929a54f5340b46b0a07ac6bbf857471f0","impliedFormat":1},{"version":"080941d9f9ff9307f7e27a83bcd888b7c8270716c39af943532438932ec1d0b9","affectsGlobalScope":true,"impliedFormat":1},{"version":"2e80ee7a49e8ac312cc11b77f1475804bee36b3b2bc896bead8b6e1266befb43","affectsGlobalScope":true,"impliedFormat":1},{"version":"c57796738e7f83dbc4b8e65132f11a377649c00dd3eee333f672b8f0a6bea671","affectsGlobalScope":true,"impliedFormat":1},{"version":"dc2df20b1bcdc8c2d34af4926e2c3ab15ffe1160a63e58b7e09833f616efff44","affectsGlobalScope":true,"impliedFormat":1},{"version":"515d0b7b9bea2e31ea4ec968e9edd2c39d3eebf4a2d5cbd04e88639819ae3b71","affectsGlobalScope":true,"impliedFormat":1},{"version":"0559b1f683ac7505ae451f9a96ce4c3c92bdc71411651ca6ddb0e88baaaad6a3","affectsGlobalScope":true,"impliedFormat":1},{"version":"0dc1e7ceda9b8b9b455c3a2d67b0412feab00bd2f66656cd8850e8831b08b537","affectsGlobalScope":true,"impliedFormat":1},{"version":"ce691fb9e5c64efb9547083e4a34091bcbe5bdb41027e310ebba8f7d96a98671","affectsGlobalScope":true,"impliedFormat":1},{"version":"8d697a2a929a5fcb38b7a65594020fcef05ec1630804a33748829c5ff53640d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"4ff2a353abf8a80ee399af572debb8faab2d33ad38c4b4474cff7f26e7653b8d","affectsGlobalScope":true,"impliedFormat":1},{"version":"fb0f136d372979348d59b3f5020b4cdb81b5504192b1cacff5d1fbba29378aa1","affectsGlobalScope":true,"impliedFormat":1},{"version":"d15bea3d62cbbdb9797079416b8ac375ae99162a7fba5de2c6c505446486ac0a","affectsGlobalScope":true,"impliedFormat":1},{"version":"68d18b664c9d32a7336a70235958b8997ebc1c3b8505f4f1ae2b7e7753b87618","affectsGlobalScope":true,"impliedFormat":1},{"version":"eb3d66c8327153d8fa7dd03f9c58d351107fe824c79e9b56b462935176cdf12a","affectsGlobalScope":true,"impliedFormat":1},{"version":"38f0219c9e23c915ef9790ab1d680440d95419ad264816fa15009a8851e79119","affectsGlobalScope":true,"impliedFormat":1},{"version":"69ab18c3b76cd9b1be3d188eaf8bba06112ebbe2f47f6c322b5105a6fbc45a2e","affectsGlobalScope":true,"impliedFormat":1},{"version":"a680117f487a4d2f30ea46f1b4b7f58bef1480456e18ba53ee85c2746eeca012","affectsGlobalScope":true,"impliedFormat":1},{"version":"2f11ff796926e0832f9ae148008138ad583bd181899ab7dd768a2666700b1893","affectsGlobalScope":true,"impliedFormat":1},{"version":"4de680d5bb41c17f7f68e0419412ca23c98d5749dcaaea1896172f06435891fc","affectsGlobalScope":true,"impliedFormat":1},{"version":"954296b30da6d508a104a3a0b5d96b76495c709785c1d11610908e63481ee667","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac9538681b19688c8eae65811b329d3744af679e0bdfa5d842d0e32524c73e1c","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a969edff4bd52585473d24995c5ef223f6652d6ef46193309b3921d65dd4376","affectsGlobalScope":true,"impliedFormat":1},{"version":"9e9fbd7030c440b33d021da145d3232984c8bb7916f277e8ffd3dc2e3eae2bdb","affectsGlobalScope":true,"impliedFormat":1},{"version":"811ec78f7fefcabbda4bfa93b3eb67d9ae166ef95f9bff989d964061cbf81a0c","affectsGlobalScope":true,"impliedFormat":1},{"version":"717937616a17072082152a2ef351cb51f98802fb4b2fdabd32399843875974ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"d7e7d9b7b50e5f22c915b525acc5a49a7a6584cf8f62d0569e557c5cfc4b2ac2","affectsGlobalScope":true,"impliedFormat":1},{"version":"71c37f4c9543f31dfced6c7840e068c5a5aacb7b89111a4364b1d5276b852557","affectsGlobalScope":true,"impliedFormat":1},{"version":"576711e016cf4f1804676043e6a0a5414252560eb57de9faceee34d79798c850","affectsGlobalScope":true,"impliedFormat":1},{"version":"89c1b1281ba7b8a96efc676b11b264de7a8374c5ea1e6617f11880a13fc56dc6","affectsGlobalScope":true,"impliedFormat":1},{"version":"74f7fa2d027d5b33eb0471c8e82a6c87216223181ec31247c357a3e8e2fddc5b","affectsGlobalScope":true,"impliedFormat":1},{"version":"d6d7ae4d1f1f3772e2a3cde568ed08991a8ae34a080ff1151af28b7f798e22ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"063600664504610fe3e99b717a1223f8b1900087fab0b4cad1496a114744f8df","affectsGlobalScope":true,"impliedFormat":1},{"version":"934019d7e3c81950f9a8426d093458b65d5aff2c7c1511233c0fd5b941e608ab","affectsGlobalScope":true,"impliedFormat":1},{"version":"52ada8e0b6e0482b728070b7639ee42e83a9b1c22d205992756fe020fd9f4a47","affectsGlobalScope":true,"impliedFormat":1},{"version":"3bdefe1bfd4d6dee0e26f928f93ccc128f1b64d5d501ff4a8cf3c6371200e5e6","affectsGlobalScope":true,"impliedFormat":1},{"version":"59fb2c069260b4ba00b5643b907ef5d5341b167e7d1dbf58dfd895658bda2867","affectsGlobalScope":true,"impliedFormat":1},{"version":"639e512c0dfc3fad96a84caad71b8834d66329a1f28dc95e3946c9b58176c73a","affectsGlobalScope":true,"impliedFormat":1},{"version":"368af93f74c9c932edd84c58883e736c9e3d53cec1fe24c0b0ff451f529ceab1","affectsGlobalScope":true,"impliedFormat":1},{"version":"af3dd424cf267428f30ccfc376f47a2c0114546b55c44d8c0f1d57d841e28d74","affectsGlobalScope":true,"impliedFormat":1},{"version":"995c005ab91a498455ea8dfb63aa9f83fa2ea793c3d8aa344be4a1678d06d399","affectsGlobalScope":true,"impliedFormat":1},{"version":"959d36cddf5e7d572a65045b876f2956c973a586da58e5d26cde519184fd9b8a","affectsGlobalScope":true,"impliedFormat":1},{"version":"965f36eae237dd74e6cca203a43e9ca801ce38824ead814728a2807b1910117d","affectsGlobalScope":true,"impliedFormat":1},{"version":"3925a6c820dcb1a06506c90b1577db1fdbf7705d65b62b99dce4be75c637e26b","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a3d63ef2b853447ec4f749d3f368ce642264246e02911fcb1590d8c161b8005","affectsGlobalScope":true,"impliedFormat":1},{"version":"8cdf8847677ac7d20486e54dd3fcf09eda95812ac8ace44b4418da1bbbab6eb8","affectsGlobalScope":true,"impliedFormat":1},{"version":"8444af78980e3b20b49324f4a16ba35024fef3ee069a0eb67616ea6ca821c47a","affectsGlobalScope":true,"impliedFormat":1},{"version":"3287d9d085fbd618c3971944b65b4be57859f5415f495b33a6adc994edd2f004","affectsGlobalScope":true,"impliedFormat":1},{"version":"b4b67b1a91182421f5df999988c690f14d813b9850b40acd06ed44691f6727ad","affectsGlobalScope":true,"impliedFormat":1},{"version":"df83c2a6c73228b625b0beb6669c7ee2a09c914637e2d35170723ad49c0f5cd4","affectsGlobalScope":true,"impliedFormat":1},{"version":"436aaf437562f276ec2ddbee2f2cdedac7664c1e4c1d2c36839ddd582eeb3d0a","affectsGlobalScope":true,"impliedFormat":1},{"version":"8e3c06ea092138bf9fa5e874a1fdbc9d54805d074bee1de31b99a11e2fec239d","affectsGlobalScope":true,"impliedFormat":1},{"version":"87dc0f382502f5bbce5129bdc0aea21e19a3abbc19259e0b43ae038a9fc4e326","affectsGlobalScope":true,"impliedFormat":1},{"version":"b1cb28af0c891c8c96b2d6b7be76bd394fddcfdb4709a20ba05a7c1605eea0f9","affectsGlobalScope":true,"impliedFormat":1},{"version":"2fef54945a13095fdb9b84f705f2b5994597640c46afeb2ce78352fab4cb3279","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac77cb3e8c6d3565793eb90a8373ee8033146315a3dbead3bde8db5eaf5e5ec6","affectsGlobalScope":true,"impliedFormat":1},{"version":"56e4ed5aab5f5920980066a9409bfaf53e6d21d3f8d020c17e4de584d29600ad","affectsGlobalScope":true,"impliedFormat":1},{"version":"4ece9f17b3866cc077099c73f4983bddbcb1dc7ddb943227f1ec070f529dedd1","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a6282c8827e4b9a95f4bf4f5c205673ada31b982f50572d27103df8ceb8013c","affectsGlobalScope":true,"impliedFormat":1},{"version":"1c9319a09485199c1f7b0498f2988d6d2249793ef67edda49d1e584746be9032","affectsGlobalScope":true,"impliedFormat":1},{"version":"e3a2a0cee0f03ffdde24d89660eba2685bfbdeae955a6c67e8c4c9fd28928eeb","affectsGlobalScope":true,"impliedFormat":1},{"version":"811c71eee4aa0ac5f7adf713323a5c41b0cf6c4e17367a34fbce379e12bbf0a4","affectsGlobalScope":true,"impliedFormat":1},{"version":"51ad4c928303041605b4d7ae32e0c1ee387d43a24cd6f1ebf4a2699e1076d4fa","affectsGlobalScope":true,"impliedFormat":1},{"version":"60037901da1a425516449b9a20073aa03386cce92f7a1fd902d7602be3a7c2e9","affectsGlobalScope":true,"impliedFormat":1},{"version":"d4b1d2c51d058fc21ec2629fff7a76249dec2e36e12960ea056e3ef89174080f","affectsGlobalScope":true,"impliedFormat":1},{"version":"22adec94ef7047a6c9d1af3cb96be87a335908bf9ef386ae9fd50eeb37f44c47","affectsGlobalScope":true,"impliedFormat":1},{"version":"196cb558a13d4533a5163286f30b0509ce0210e4b316c56c38d4c0fd2fb38405","affectsGlobalScope":true,"impliedFormat":1},{"version":"73f78680d4c08509933daf80947902f6ff41b6230f94dd002ae372620adb0f60","affectsGlobalScope":true,"impliedFormat":1},{"version":"c5239f5c01bcfa9cd32f37c496cf19c61d69d37e48be9de612b541aac915805b","affectsGlobalScope":true,"impliedFormat":1},{"version":"8e7f8264d0fb4c5339605a15daadb037bf238c10b654bb3eee14208f860a32ea","affectsGlobalScope":true,"impliedFormat":1},{"version":"782dec38049b92d4e85c1585fbea5474a219c6984a35b004963b00beb1aab538","affectsGlobalScope":true,"impliedFormat":1},{"version":"7e29f41b158de217f94cb9676bf9cbd0cd9b5a46e1985141ed36e075c52bf6ad","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac51dd7d31333793807a6abaa5ae168512b6131bd41d9c5b98477fc3b7800f9f","impliedFormat":1},{"version":"dc0a7f107690ee5cd8afc8dbf05c4df78085471ce16bdd9881642ec738bc81fe","impliedFormat":1},{"version":"acd8fd5090ac73902278889c38336ff3f48af6ba03aa665eb34a75e7ba1dccc4","impliedFormat":1},{"version":"d6258883868fb2680d2ca96bc8b1352cab69874581493e6d52680c5ffecdb6cc","impliedFormat":1},{"version":"1b61d259de5350f8b1e5db06290d31eaebebc6baafd5f79d314b5af9256d7153","impliedFormat":1},{"version":"f258e3960f324a956fc76a3d3d9e964fff2244ff5859dcc6ce5951e5413ca826","impliedFormat":1},{"version":"643f7232d07bf75e15bd8f658f664d6183a0efaca5eb84b48201c7671a266979","impliedFormat":1},{"version":"21da358700a3893281ce0c517a7a30cbd46be020d9f0c3f2834d0a8ad1f5fc75","impliedFormat":1},{"version":"70521b6ab0dcba37539e5303104f29b721bfb2940b2776da4cc818c07e1fefc1","affectsGlobalScope":true,"impliedFormat":1},{"version":"ab41ef1f2cdafb8df48be20cd969d875602483859dc194e9c97c8a576892c052","affectsGlobalScope":true,"impliedFormat":1},{"version":"d153a11543fd884b596587ccd97aebbeed950b26933ee000f94009f1ab142848","affectsGlobalScope":true,"impliedFormat":1},{"version":"21d819c173c0cf7cc3ce57c3276e77fd9a8a01d35a06ad87158781515c9a438a","impliedFormat":1},{"version":"98cffbf06d6bab333473c70a893770dbe990783904002c4f1a960447b4b53dca","affectsGlobalScope":true,"impliedFormat":1},{"version":"ba481bca06f37d3f2c137ce343c7d5937029b2468f8e26111f3c9d9963d6568d","affectsGlobalScope":true,"impliedFormat":1},{"version":"6d9ef24f9a22a88e3e9b3b3d8c40ab1ddb0853f1bfbd5c843c37800138437b61","affectsGlobalScope":true,"impliedFormat":1},{"version":"1db0b7dca579049ca4193d034d835f6bfe73096c73663e5ef9a0b5779939f3d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"9798340ffb0d067d69b1ae5b32faa17ab31b82466a3fc00d8f2f2df0c8554aaa","affectsGlobalScope":true,"impliedFormat":1},{"version":"f26b11d8d8e4b8028f1c7d618b22274c892e4b0ef5b3678a8ccbad85419aef43","affectsGlobalScope":true,"impliedFormat":1},{"version":"5929864ce17fba74232584d90cb721a89b7ad277220627cc97054ba15a98ea8f","impliedFormat":1},{"version":"763fe0f42b3d79b440a9b6e51e9ba3f3f91352469c1e4b3b67bfa4ff6352f3f4","impliedFormat":1},{"version":"25c8056edf4314820382a5fdb4bb7816999acdcb929c8f75e3f39473b87e85bc","impliedFormat":1},{"version":"c464d66b20788266e5353b48dc4aa6bc0dc4a707276df1e7152ab0c9ae21fad8","impliedFormat":1},{"version":"78d0d27c130d35c60b5e5566c9f1e5be77caf39804636bc1a40133919a949f21","impliedFormat":1},{"version":"c6fd2c5a395f2432786c9cb8deb870b9b0e8ff7e22c029954fabdd692bff6195","impliedFormat":1},{"version":"1d6e127068ea8e104a912e42fc0a110e2aa5a66a356a917a163e8cf9a65e4a75","impliedFormat":1},{"version":"5ded6427296cdf3b9542de4471d2aa8d3983671d4cac0f4bf9c637208d1ced43","impliedFormat":1},{"version":"7f182617db458e98fc18dfb272d40aa2fff3a353c44a89b2c0ccb3937709bfb5","impliedFormat":1},{"version":"cadc8aced301244057c4e7e73fbcae534b0f5b12a37b150d80e5a45aa4bebcbd","impliedFormat":1},{"version":"385aab901643aa54e1c36f5ef3107913b10d1b5bb8cbcd933d4263b80a0d7f20","impliedFormat":1},{"version":"9670d44354bab9d9982eca21945686b5c24a3f893db73c0dae0fd74217a4c219","impliedFormat":1},{"version":"0b8a9268adaf4da35e7fa830c8981cfa22adbbe5b3f6f5ab91f6658899e657a7","impliedFormat":1},{"version":"11396ed8a44c02ab9798b7dca436009f866e8dae3c9c25e8c1fbc396880bf1bb","impliedFormat":1},{"version":"ba7bc87d01492633cb5a0e5da8a4a42a1c86270e7b3d2dea5d156828a84e4882","impliedFormat":1},{"version":"4893a895ea92c85345017a04ed427cbd6a1710453338df26881a6019432febdd","impliedFormat":1},{"version":"c21dc52e277bcfc75fac0436ccb75c204f9e1b3fa5e12729670910639f27343e","impliedFormat":1},{"version":"13f6f39e12b1518c6650bbb220c8985999020fe0f21d818e28f512b7771d00f9","impliedFormat":1},{"version":"9b5369969f6e7175740bf51223112ff209f94ba43ecd3bb09eefff9fd675624a","impliedFormat":1},{"version":"4fe9e626e7164748e8769bbf74b538e09607f07ed17c2f20af8d680ee49fc1da","impliedFormat":1},{"version":"24515859bc0b836719105bb6cc3d68255042a9f02a6022b3187948b204946bd2","impliedFormat":1},{"version":"ea0148f897b45a76544ae179784c95af1bd6721b8610af9ffa467a518a086a43","impliedFormat":1},{"version":"24c6a117721e606c9984335f71711877293a9651e44f59f3d21c1ea0856f9cc9","impliedFormat":1},{"version":"dd3273ead9fbde62a72949c97dbec2247ea08e0c6952e701a483d74ef92d6a17","impliedFormat":1},{"version":"405822be75ad3e4d162e07439bac80c6bcc6dbae1929e179cf467ec0b9ee4e2e","impliedFormat":1},{"version":"0db18c6e78ea846316c012478888f33c11ffadab9efd1cc8bcc12daded7a60b6","impliedFormat":1},{"version":"e61be3f894b41b7baa1fbd6a66893f2579bfad01d208b4ff61daef21493ef0a8","impliedFormat":1},{"version":"bd0532fd6556073727d28da0edfd1736417a3f9f394877b6d5ef6ad88fba1d1a","impliedFormat":1},{"version":"89167d696a849fce5ca508032aabfe901c0868f833a8625d5a9c6e861ef935d2","impliedFormat":1},{"version":"615ba88d0128ed16bf83ef8ccbb6aff05c3ee2db1cc0f89ab50a4939bfc1943f","impliedFormat":1},{"version":"a4d551dbf8746780194d550c88f26cf937caf8d56f102969a110cfaed4b06656","impliedFormat":1},{"version":"8bd86b8e8f6a6aa6c49b71e14c4ffe1211a0e97c80f08d2c8cc98838006e4b88","impliedFormat":1},{"version":"317e63deeb21ac07f3992f5b50cdca8338f10acd4fbb7257ebf56735bf52ab00","impliedFormat":1},{"version":"4732aec92b20fb28c5fe9ad99521fb59974289ed1e45aecb282616202184064f","impliedFormat":1},{"version":"2e85db9e6fd73cfa3d7f28e0ab6b55417ea18931423bd47b409a96e4a169e8e6","impliedFormat":1},{"version":"c46e079fe54c76f95c67fb89081b3e399da2c7d109e7dca8e4b58d83e332e605","impliedFormat":1},{"version":"bf67d53d168abc1298888693338cb82854bdb2e69ef83f8a0092093c2d562107","impliedFormat":1},{"version":"b52476feb4a0cbcb25e5931b930fc73cb6643fb1a5060bf8a3dda0eeae5b4b68","affectsGlobalScope":true,"impliedFormat":1},{"version":"e2677634fe27e87348825bb041651e22d50a613e2fdf6a4a3ade971d71bac37e","impliedFormat":1},{"version":"7394959e5a741b185456e1ef5d64599c36c60a323207450991e7a42e08911419","impliedFormat":1},{"version":"8c0bcd6c6b67b4b503c11e91a1fb91522ed585900eab2ab1f61bba7d7caa9d6f","impliedFormat":1},{"version":"8cd19276b6590b3ebbeeb030ac271871b9ed0afc3074ac88a94ed2449174b776","affectsGlobalScope":true,"impliedFormat":1},{"version":"696eb8d28f5949b87d894b26dc97318ef944c794a9a4e4f62360cd1d1958014b","impliedFormat":1},{"version":"3f8fa3061bd7402970b399300880d55257953ee6d3cd408722cb9ac20126460c","impliedFormat":1},{"version":"35ec8b6760fd7138bbf5809b84551e31028fb2ba7b6dc91d95d098bf212ca8b4","affectsGlobalScope":true,"impliedFormat":1},{"version":"5524481e56c48ff486f42926778c0a3cce1cc85dc46683b92b1271865bcf015a","impliedFormat":1},{"version":"68bd56c92c2bd7d2339457eb84d63e7de3bd56a69b25f3576e1568d21a162398","affectsGlobalScope":true,"impliedFormat":1},{"version":"3e93b123f7c2944969d291b35fed2af79a6e9e27fdd5faa99748a51c07c02d28","impliedFormat":1},{"version":"9d19808c8c291a9010a6c788e8532a2da70f811adb431c97520803e0ec649991","impliedFormat":1},{"version":"87aad3dd9752067dc875cfaa466fc44246451c0c560b820796bdd528e29bef40","impliedFormat":1},{"version":"4aacb0dd020eeaef65426153686cc639a78ec2885dc72ad220be1d25f1a439df","impliedFormat":1},{"version":"f0bd7e6d931657b59605c44112eaf8b980ba7f957a5051ed21cb93d978cf2f45","impliedFormat":1},{"version":"8db0ae9cb14d9955b14c214f34dae1b9ef2baee2fe4ce794a4cd3ac2531e3255","affectsGlobalScope":true,"impliedFormat":1},{"version":"15fc6f7512c86810273af28f224251a5a879e4261b4d4c7e532abfbfc3983134","impliedFormat":1},{"version":"58adba1a8ab2d10b54dc1dced4e41f4e7c9772cbbac40939c0dc8ce2cdb1d442","impliedFormat":1},{"version":"641942a78f9063caa5d6b777c99304b7d1dc7328076038c6d94d8a0b81fc95c1","impliedFormat":1},{"version":"714435130b9015fae551788df2a88038471a5a11eb471f27c4ede86552842bc9","impliedFormat":1},{"version":"855cd5f7eb396f5f1ab1bc0f8580339bff77b68a770f84c6b254e319bbfd1ac7","impliedFormat":1},{"version":"5650cf3dace09e7c25d384e3e6b818b938f68f4e8de96f52d9c5a1b3db068e86","impliedFormat":1},{"version":"1354ca5c38bd3fd3836a68e0f7c9f91f172582ba30ab15bb8c075891b91502b7","affectsGlobalScope":true,"impliedFormat":1},{"version":"27fdb0da0daf3b337c5530c5f266efe046a6ceb606e395b346974e4360c36419","impliedFormat":1},{"version":"2d2fcaab481b31a5882065c7951255703ddbe1c0e507af56ea42d79ac3911201","impliedFormat":1},{"version":"a192fe8ec33f75edbc8d8f3ed79f768dfae11ff5735e7fe52bfa69956e46d78d","impliedFormat":1},{"version":"ca867399f7db82df981d6915bcbb2d81131d7d1ef683bc782b59f71dda59bc85","affectsGlobalScope":true,"impliedFormat":1},{"version":"372413016d17d804e1d139418aca0c68e47a83fb6669490857f4b318de8cccb3","affectsGlobalScope":true,"impliedFormat":1},{"version":"9e043a1bc8fbf2a255bccf9bf27e0f1caf916c3b0518ea34aa72357c0afd42ec","impliedFormat":1},{"version":"b4f70ec656a11d570e1a9edce07d118cd58d9760239e2ece99306ee9dfe61d02","impliedFormat":1},{"version":"3bc2f1e2c95c04048212c569ed38e338873f6a8593930cf5a7ef24ffb38fc3b6","impliedFormat":1},{"version":"6e70e9570e98aae2b825b533aa6292b6abd542e8d9f6e9475e88e1d7ba17c866","impliedFormat":1},{"version":"f9d9d753d430ed050dc1bf2667a1bab711ccbb1c1507183d794cc195a5b085cc","impliedFormat":1},{"version":"9eece5e586312581ccd106d4853e861aaaa1a39f8e3ea672b8c3847eedd12f6e","impliedFormat":1},{"version":"47ab634529c5955b6ad793474ae188fce3e6163e3a3fb5edd7e0e48f14435333","impliedFormat":1},{"version":"37ba7b45141a45ce6e80e66f2a96c8a5ab1bcef0fc2d0f56bb58df96ec67e972","impliedFormat":1},{"version":"45650f47bfb376c8a8ed39d4bcda5902ab899a3150029684ee4c10676d9fbaee","impliedFormat":1},{"version":"fad4e3c207fe23922d0b2d06b01acbfb9714c4f2685cf80fd384c8a100c82fd0","affectsGlobalScope":true,"impliedFormat":1},{"version":"74cf591a0f63db318651e0e04cb55f8791385f86e987a67fd4d2eaab8191f730","impliedFormat":1},{"version":"5eab9b3dc9b34f185417342436ec3f106898da5f4801992d8ff38ab3aff346b5","impliedFormat":1},{"version":"12ed4559eba17cd977aa0db658d25c4047067444b51acfdcbf38470630642b23","affectsGlobalScope":true,"impliedFormat":1},{"version":"f3ffabc95802521e1e4bcba4c88d8615176dc6e09111d920c7a213bdda6e1d65","impliedFormat":1},{"version":"809821b8a065e3234a55b3a9d7846231ed18d66dd749f2494c66288d890daf7f","impliedFormat":1},{"version":"ae56f65caf3be91108707bd8dfbccc2a57a91feb5daabf7165a06a945545ed26","impliedFormat":1},{"version":"a136d5de521da20f31631a0a96bf712370779d1c05b7015d7019a9b2a0446ca9","impliedFormat":1},{"version":"c3b41e74b9a84b88b1dca61ec39eee25c0dbc8e7d519ba11bb070918cfacf656","affectsGlobalScope":true,"impliedFormat":1},{"version":"4737a9dc24d0e68b734e6cfbcea0c15a2cfafeb493485e27905f7856988c6b29","affectsGlobalScope":true,"impliedFormat":1},{"version":"36d8d3e7506b631c9582c251a2c0b8a28855af3f76719b12b534c6edf952748d","impliedFormat":1},{"version":"1ca69210cc42729e7ca97d3a9ad48f2e9cb0042bada4075b588ae5387debd318","impliedFormat":1},{"version":"f5ebe66baaf7c552cfa59d75f2bfba679f329204847db3cec385acda245e574e","impliedFormat":1},{"version":"ed59add13139f84da271cafd32e2171876b0a0af2f798d0c663e8eeb867732cf","affectsGlobalScope":true,"impliedFormat":1},{"version":"b7c5e2ea4a9749097c347454805e933844ed207b6eefec6b7cfd418b5f5f7b28","impliedFormat":1},{"version":"b1810689b76fd473bd12cc9ee219f8e62f54a7d08019a235d07424afbf074d25","impliedFormat":1},{"version":"2beff543f6e9a9701df88daeee3cdd70a34b4a1c11cb4c734472195a5cb2af54","impliedFormat":1},{"version":"2e07abf27aa06353d46f4448c0bbac73431f6065eef7113128a5cd804d0c384d","impliedFormat":1},{"version":"be1cc4d94ea60cbe567bc29ed479d42587bf1e6cba490f123d329976b0fe4ee5","impliedFormat":1},{"version":"42bc0e1a903408137c3df2b06dfd7e402cdab5bbfa5fcfb871b22ebfdb30bd0b","impliedFormat":1},{"version":"9894dafe342b976d251aac58e616ac6df8db91fb9d98934ff9dd103e9e82578f","impliedFormat":1},{"version":"413df52d4ea14472c2fa5bee62f7a40abd1eb49be0b9722ee01ee4e52e63beb2","impliedFormat":1},{"version":"db6d2d9daad8a6d83f281af12ce4355a20b9a3e71b82b9f57cddcca0a8964a96","impliedFormat":1},{"version":"446a50749b24d14deac6f8843e057a6355dd6437d1fac4f9e5ce4a5071f34bff","impliedFormat":1},{"version":"182e9fcbe08ac7c012e0a6e2b5798b4352470be29a64fdc114d23c2bab7d5106","impliedFormat":1},{"version":"2f4e6b4d39426a1b85ecf4bdeb9dddbf4d9b3397d95d8555d46f925c9519ec7d","impliedFormat":1},{"version":"78a2869ad0cbf3f9045dda08c0d4562b7e1b2bfe07b19e0db072f5c3c56e9584","impliedFormat":1},{"version":"89d5d28d4f57e000b836ac273079be1b75710e28ce14750d081fb420d37e2ca5","impliedFormat":1},{"version":"fd4e24ccff3966390600d7f5d6aa1fed5a512e92ada735ea5fbc933d313ad3d3","impliedFormat":1},{"version":"b7cddfe1aa6b86b5fad3c9ccb30d05b3ccb165aebbf112f48d2d8a5f69dd98b1","impliedFormat":1},{"version":"a86f82d646a739041d6702101afa82dcb935c416dd93cbca7fd754fd0282ce1f","impliedFormat":1},{"version":"ad0d1d75d129b1c80f911be438d6b61bfa8703930a8ff2be2f0e1f8a91841c64","impliedFormat":1},{"version":"bd2c7ada3dee03653d3f601011d30072194bc3970cd93208f9588fbdc0c69347","impliedFormat":1},{"version":"e480da45d32313e7174b265674da504f075f59ef326852f0c5a5d863b438ae85","impliedFormat":1},{"version":"ad54850f61fcf5d014e11be80d2f46fea9265cfa7e77456da876f7833ef81769","impliedFormat":1},{"version":"6f7c9e8bd2b5b6a080b07080065f94900bd3c7e5ebbd3047bc33fcce2fab1dd8","impliedFormat":1},{"version":"3e7efde639c6a6c3edb9847b3f61e308bf7a69685b92f665048c45132f51c218","impliedFormat":1},{"version":"df45ca1176e6ac211eae7ddf51336dc075c5314bc5c253651bae639defd5eec5","impliedFormat":1},{"version":"8a0e762ceb20c7e72504feef83d709468a70af4abccb304f32d6b9bac1129b2c","impliedFormat":1},{"version":"da5950ee2a90721df6f3fba45f5d05308f7e4c35835392215dd2cd404505e2de","impliedFormat":1},{"version":"ce75b1aebb33d510ff28af960a9221410a3eaf7f18fc5f21f9404075fba77256","impliedFormat":1},{"version":"f42d5fed19610d485c646a0c430e768115567d078c7fc855c57b0c578b3d6cd3","impliedFormat":1},{"version":"ee8df1cb8d0faaca4013a1b442e99130769ce06f438d18d510fed95890067563","impliedFormat":1},{"version":"d5630f2ad9b4541e5ce891648121022f9412ecdca1820baa1f0104f70fd7eff7","impliedFormat":1},{"version":"4d15375ab13497104bc8fe56fdef2b5fd6853f29255737d23a33fa306ff7fd69","impliedFormat":1},{"version":"2cd3fc1d0d6a1e85baffd2d4f50f5efb192b5446eef567e97c94765402f0aad4","impliedFormat":1},{"version":"e4cbf2f1e89ecccaddd2c045e600ae41b732295953fb06247c7dcbc2d281ed30","impliedFormat":1},{"version":"27bbdb7509a5bb564020321fc5485764d0db3230a10d2336ae5ce2c1d401b0e7","impliedFormat":1},{"version":"8c1697d90c394a6fd955b98eae01238eff628e129b987a68aea10f898a48e7da","impliedFormat":1},{"version":"7580e62139cb2b44a0270c8d01abcbfcba2819a02514a527342447fa69b34ef1","impliedFormat":1},{"version":"42c169fb8c2d42f4f668c624a9a11e719d5d07dacbebb63cbcf7ef365b0a75b3","impliedFormat":1},{"version":"f374cb24e93e7798c4d9e83ff872fa52d2cdb36306392b840a6ddf46cb925cb6","impliedFormat":1},{"version":"d10d63718e1646c2279e3b33831f82c60e31f622b2b7020f1196409ca4c09242","impliedFormat":1},{"version":"106c6025f1d99fd468fd8bf6e5bda724e11e5905a4076c5d29790b6c3745e50c","impliedFormat":1},{"version":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","impliedFormat":1},{"version":"148679c6d0f449210a96e7d2e562d589e56fcde87f843a92808b3ff103f1a774","impliedFormat":1},{"version":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","impliedFormat":1},{"version":"02436d7e9ead85e09a2f8e27d5f47d9464bced31738dec138ca735390815c9f0","impliedFormat":1},{"version":"f8d5ff8eafd37499f2b6a98659dd9b45a321de186b8db6b6142faed0fea3de77","impliedFormat":1},{"version":"c86fe861cf1b4c46a0fb7d74dffe596cf679a2e5e8b1456881313170f092e3fa","impliedFormat":1},{"version":"a22dd55aa4d39906252000ab8e8a1b83b195eef7f4274eb51e457c1f11cf6580","impliedFormat":1},{"version":"540cc83ab772a2c6bc509fe1354f314825b5dba3669efdfbe4693ecd3048e34f","impliedFormat":1},{"version":"121b0696021ab885c570bbeb331be8ad82c6efe2f3b93a6e63874901bebc13e3","impliedFormat":1},{"version":"612d9da66bb046a9c1e2e8d026245ded881fc4b9f98cbfae714415d57ee0ae0b","impliedFormat":1},{"version":"32c2ad9494dad5d11b0564a619fee18f388db6c1e9e2cd3c360b3122549691eb","impliedFormat":1},{"version":"6c301d40aec56a74ec7bd7324e31a728dadf9bfba3e96def02938d3d973534ec","impliedFormat":1},{"version":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","impliedFormat":1},{"version":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","impliedFormat":1},{"version":"8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881","impliedFormat":1},{"version":"8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881","impliedFormat":1},{"version":"aa14cee20aa0db79f8df101fc027d929aec10feb5b8a8da3b9af3895d05b7ba2","impliedFormat":1},{"version":"493c700ac3bd317177b2eb913805c87fe60d4e8af4fb39c41f04ba81fae7e170","impliedFormat":1},{"version":"aeb554d876c6b8c818da2e118d8b11e1e559adbe6bf606cc9a611c1b6c09f670","impliedFormat":1},{"version":"acf5a2ac47b59ca07afa9abbd2b31d001bf7448b041927befae2ea5b1951d9f9","impliedFormat":1},{"version":"8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881","impliedFormat":1},{"version":"d71291eff1e19d8762a908ba947e891af44749f3a2cbc5bd2ec4b72f72ea795f","impliedFormat":1},{"version":"c0480e03db4b816dff2682b347c95f2177699525c54e7e6f6aa8ded890b76be7","impliedFormat":1},{"version":"25a5f6fd3a2243c859eddc99ab5fba11d970af2fe7a5df9c32b7668f76f97b01","impliedFormat":1},{"version":"8d207e1f9d2c30d6f77dfa693f3827c3fbf0d89240297e10bdfe1041d433df68","impliedFormat":1},{"version":"b620391fe8060cf9bedc176a4d01366e6574d7a71e0ac0ab344a4e76576fcbb8","impliedFormat":1},{"version":"6ac6715916fa75a1f7ebdfeacac09513b4d904b667d827b7535e84ff59679aff","impliedFormat":1},{"version":"2652448ac55a2010a1f71dd141f828b682298d39728f9871e1cdf8696ef443fd","impliedFormat":1},{"version":"d682336018141807fb602709e2d95a192828fcb8d5ba06dda3833a8ea98f69e3","impliedFormat":1},{"version":"6124e973eab8c52cabf3c07575204efc1784aca6b0a30c79eb85fe240a857efa","impliedFormat":1},{"version":"0d891735a21edc75df51f3eb995e18149e119d1ce22fd40db2b260c5960b914e","impliedFormat":1},{"version":"3b414b99a73171e1c4b7b7714e26b87d6c5cb03d200352da5342ab4088a54c85","impliedFormat":1},{"version":"4fbd3116e00ed3a6410499924b6403cc9367fdca303e34838129b328058ede40","impliedFormat":1},{"version":"9c82171d836c47486074e4ca8e059735bf97b205e70b196535b5efd40cbe1bc5","impliedFormat":1},{"version":"8c70ddc0c22d85e56011d49fddfaae3405eb53d47b59327b9dd589e82df672e7","impliedFormat":1},{"version":"2f9c89cbb29d362290531b48880a4024f258c6033aaeb7e59fbc62db26819650","impliedFormat":1},{"version":"a365c4d3bed3be4e4e20793c999c51f5cd7e6792322f14650949d827fbcd170f","impliedFormat":1},{"version":"c5426dbfc1cf90532f66965a7aa8c1136a78d4d0f96d8180ecbfc11d7722f1a5","impliedFormat":1},{"version":"65a15fc47900787c0bd18b603afb98d33ede930bed1798fc984d5ebb78b26cf9","impliedFormat":1},{"version":"9d202701f6e0744adb6314d03d2eb8fc994798fc83d91b691b75b07626a69801","impliedFormat":1},{"version":"de9d2df7663e64e3a91bf495f315a7577e23ba088f2949d5ce9ec96f44fba37d","impliedFormat":1},{"version":"c7af78a2ea7cb1cd009cfb5bdb48cd0b03dad3b54f6da7aab615c2e9e9d570c5","impliedFormat":1},{"version":"1ee45496b5f8bdee6f7abc233355898e5bf9bd51255db65f5ff7ede617ca0027","impliedFormat":1},{"version":"273782b8454e78f6a8b30d2cfbf6860499c930595095fcc1689637115f0eddda","affectsGlobalScope":true,"impliedFormat":1},{"version":"3fbdd025f9d4d820414417eeb4107ffa0078d454a033b506e22d3a23bc3d9c41","affectsGlobalScope":true,"impliedFormat":1},{"version":"dba114fb6a32b355a9cfc26ca2276834d72fe0e94cd2c3494005547025015369","impliedFormat":1},{"version":"a8f8e6ab2fa07b45251f403548b78eaf2022f3c2254df3dc186cb2671fe4996d","affectsGlobalScope":true,"impliedFormat":1},{"version":"fa6c12a7c0f6b84d512f200690bfc74819e99efae69e4c95c4cd30f6884c526e","impliedFormat":1},{"version":"f1c32f9ce9c497da4dc215c3bc84b722ea02497d35f9134db3bb40a8d918b92b","impliedFormat":1},{"version":"b73c319af2cc3ef8f6421308a250f328836531ea3761823b4cabbd133047aefa","affectsGlobalScope":true,"impliedFormat":1},{"version":"e433b0337b8106909e7953015e8fa3f2d30797cea27141d1c5b135365bb975a6","impliedFormat":1},{"version":"9f9bb6755a8ce32d656ffa4763a8144aa4f274d6b69b59d7c32811031467216e","impliedFormat":1},{"version":"5c32bdfbd2d65e8fffbb9fbda04d7165e9181b08dad61154961852366deb7540","impliedFormat":1},{"version":"ddff7fc6edbdc5163a09e22bf8df7bef75f75369ebd7ecea95ba55c4386e2441","impliedFormat":1},{"version":"0c05e9842ec4f8b7bfebfd3ca61604bb8c914ba8da9b5337c4f25da427a005f2","impliedFormat":1},{"version":"faed7a5153215dbd6ebe76dfdcc0af0cfe760f7362bed43284be544308b114cf","impliedFormat":1},{"version":"7029e566b8df176f703fb59fd437a38670c7a0e02c58b2d66dfb5b2e2b2defdb","impliedFormat":1},{"version":"7f2aa4d4989a82530aaac3f72b3dceca90e9c25bee0b1a327e8a08a1262435ad","impliedFormat":1},{"version":"d96b39301d0ded3f1a27b47759676a33a02f6f5049bfcbde81e533fd10f50dcb","impliedFormat":1},{"version":"e9f147ecca73d9346a4c073432843c159ccbe50bdcb678a78f6da10eae2cecf4","impliedFormat":1},{"version":"de061f7d72bd65c06fc1419f841dfdcb29a8e22fe6fa527d1e6eb20b897d4de0","impliedFormat":1},{"version":"663beafc2446079574570cba86e9b15f986f908ddb1b01274509970126fee945","impliedFormat":1},{"version":"a3102887d5058bf4cb5b37fa6964c09e9527c42053b3b5c642b89878620748de","impliedFormat":1},{"version":"0aaaa1727edd29673d85c9b26d7ca4d54e5407a48586903c51b48b7f7d196f61","impliedFormat":1},{"version":"d35bca0b261bff02635758c48e8ab99c61c420d0dfabbcf467e847171d876b7d","impliedFormat":1},{"version":"3bc12c40d90c342ff88a3d876996c555ed5cbee5fe8c3308a240b321f401ee46","impliedFormat":1},{"version":"ba130768aae855a5477e9e148e5c879548e6e7ccbcc56fd1934c8a18ea5b7569","impliedFormat":1},{"version":"2e4f37ffe8862b14d8e24ae8763daaa8340c0df0b859d9a9733def0eee7562d9","impliedFormat":1},{"version":"d38530db0601215d6d767f280e3a3c54b2a83b709e8d9001acb6f61c67e965fc","impliedFormat":1},{"version":"6ac6715916fa75a1f7ebdfeacac09513b4d904b667d827b7535e84ff59679aff","impliedFormat":1},{"version":"b499af2054a037a162b3b72cd886f48bbf32a3502c865c6e29fac7d2ab3ce0b5","impliedFormat":1},{"version":"b83cb14474fa60c5f3ec660146b97d122f0735627f80d82dd03e8caa39b4388c","impliedFormat":1},{"version":"d87f90d2df7b638204d81d6c57e1f2a8cc9317c45ca331c691c375649aa9255c","impliedFormat":1},{"version":"7274fbffbd7c9589d8d0ffba68157237afd5cecff1e99881ea3399127e60572f","impliedFormat":1},{"version":"b73cbf0a72c8800cf8f96a9acfe94f3ad32ca71342a8908b8ae484d61113f647","impliedFormat":1},{"version":"bae6dd176832f6423966647382c0d7ba9e63f8c167522f09a982f086cd4e8b23","impliedFormat":1},{"version":"20865ac316b8893c1a0cc383ccfc1801443fbcc2a7255be166cf90d03fac88c9","impliedFormat":1},{"version":"c9958eb32126a3843deedda8c22fb97024aa5d6dd588b90af2d7f2bfac540f23","impliedFormat":1},{"version":"461d0ad8ae5f2ff981778af912ba71b37a8426a33301daa00f21c6ccb27f8156","impliedFormat":1},{"version":"e927c2c13c4eaf0a7f17e6022eee8519eb29ef42c4c13a31e81a611ab8c95577","impliedFormat":1},{"version":"fcafff163ca5e66d3b87126e756e1b6dfa8c526aa9cd2a2b0a9da837d81bbd72","impliedFormat":1},{"version":"70246ad95ad8a22bdfe806cb5d383a26c0c6e58e7207ab9c431f1cb175aca657","impliedFormat":1},{"version":"f00f3aa5d64ff46e600648b55a79dcd1333458f7a10da2ed594d9f0a44b76d0b","impliedFormat":1},{"version":"772d8d5eb158b6c92412c03228bd9902ccb1457d7a705b8129814a5d1a6308fc","impliedFormat":1},{"version":"802e797bcab5663b2c9f63f51bdf67eff7c41bc64c0fd65e6da3e7941359e2f7","impliedFormat":1},{"version":"b01bd582a6e41457bc56e6f0f9de4cb17f33f5f3843a7cf8210ac9c18472fb0f","impliedFormat":1},{"version":"8b4327413e5af38cd8cb97c59f48c3c866015d5d642f28518e3a891c469f240e","impliedFormat":1},{"version":"4cceef18d7f088e797a463e90b7a9dad10c6bc667724b7686e3e740ae00122be","impliedFormat":1},{"version":"7ee86fbb3754388e004de0ef9e6505485ddfb3be7640783d6d015711c03d302d","impliedFormat":1},{"version":"cc1954b539604b1e562319119ac7e888172208b32ca873f9a357a92c826bd046","impliedFormat":1},{"version":"a67b87d0281c97dfc1197ef28dfe397fc2c865ccd41f7e32b53f647184cc7307","impliedFormat":1},{"version":"771ffb773f1ddd562492a6b9aaca648192ac3f056f0e1d997678ff97dbb6bf9b","impliedFormat":1},{"version":"43e96a3d5d1411ab40ba2f61d6a3192e58177bcf3b133a80ad2a16591611726d","impliedFormat":1},{"version":"232f70c0cf2b432f3a6e56a8dc3417103eb162292a9fd376d51a3a9ea5fbbf6f","impliedFormat":1},{"version":"bb8f2dbc03533abca2066ce4655c119bff353dd4514375beb93c08590c03e023","impliedFormat":1},{"version":"706dd95827e7ebaabda91d5db2b755233e0952d98570e9c032b0f066a15c1177","affectsGlobalScope":true,"impliedFormat":1},{"version":"0b103e9abfe82d14c0ad06a55d9f91d6747154ef7cacc73cf27ecad2bfb3afcf","impliedFormat":1},{"version":"990b8fad2327b77e6920cc792af320e8867e68f02ce849b12c0a6ab9a1aebb09","impliedFormat":1},{"version":"5eb8cd1cb0c9143d74a8190b577c522720878c31aef67d866fcd29973f83e955","impliedFormat":1},{"version":"120599fd965257b1f4d0ff794bc696162832d9d8467224f4665f713a3119078b","impliedFormat":1},{"version":"43ba4f2fa8c698f5c304d21a3ef596741e8e85a810b7c1f9b692653791d8d97a","impliedFormat":1},{"version":"5433f33b0a20300cca35d2f229a7fc20b0e8477c44be2affeb21cb464af60c76","impliedFormat":1},{"version":"db036c56f79186da50af66511d37d9fe77fa6793381927292d17f81f787bb195","impliedFormat":1},{"version":"a6805fcafed712aea7759f8bc731014f9d22738c1d6ef9d43b8091d1d48346d5","impliedFormat":1},{"version":"c49469a5349b3cc1965710b5b0f98ed6c028686aa8450bcb3796728873eb923e","impliedFormat":1},{"version":"4a889f2c763edb4d55cb624257272ac10d04a1cad2ed2948b10ed4a7fda2a428","impliedFormat":1},{"version":"7bb79aa2fead87d9d56294ef71e056487e848d7b550c9a367523ee5416c44cfa","impliedFormat":1},{"version":"d88ea80a6447d7391f52352ec97e56b52ebec934a4a4af6e2464cfd8b39c3ba8","impliedFormat":1},{"version":"142617b3cdf902b69c6464c9fbd942b60ab3e733ca18c032b19e0f7e2adbefe8","impliedFormat":1},{"version":"0b603555f1881f87256ffd6344d3e3ed6d466c2e701eabf381f28be8c2125892","impliedFormat":1},{"version":"897e4f7662488e3ecc79e743bdd3b78f13bdb69a97851afa5b440c4211e32ea9","impliedFormat":1},{"version":"e2e1c6d3b2d93add5200bd7bc1a8cccb4e446836b2111ece45db8683a2c765de","impliedFormat":1},{"version":"251b03d5cd243854ce870d9a9a39f491faf69898c5d6b5eee28cc7649c57417b","impliedFormat":1},{"version":"27ff4196654e6373c9af16b6165120e2dd2169f9ad6abb5c935af5abd8c7938c","impliedFormat":1},{"version":"2c4de79f406d137390608e8c0a44fba2ff8e00bacfcae7c9d1781fef10e9440d","impliedFormat":1},{"version":"07ba23a10465791be5d22deaf5ef7de7658774ddff53721e5ea17fedea1bc721","impliedFormat":1},{"version":"dca8c645c5afeb03b1ecedbf16323f33e7d0afaa6256c8e047e6e38087a97f53","impliedFormat":1},{"version":"775f181bd4a533d6f8b5e55ec1d9f1624559720ae8a70e9432258da26b38d27c","impliedFormat":1},{"version":"796273b2edc72e78a04e86d7c58ae94d370ab93a0ddf40b1aa85a37a1c29ecd7","impliedFormat":1},{"version":"5df15a69187d737d6d8d066e189ae4f97e41f4d53712a46b2710ff9f8563ec9f","impliedFormat":1},{"version":"9109a1291dd4b9f1541bea81ee11c247a2ca9e1ea89f87f13aa1811c3c069616","impliedFormat":1},{"version":"6ac6715916fa75a1f7ebdfeacac09513b4d904b667d827b7535e84ff59679aff","impliedFormat":1},{"version":"622694a8522b46f6310c2a9b5d2530dde1e2854cb5829354e6d1ff8f371cf469","impliedFormat":1},{"version":"cd8ce8d68567f62dd580b3c3c37777ac3f5b81944c7417f5ea83030eab533385","impliedFormat":1},{"version":"e374d1eaa05b7dc38580062942ac8351ce79cbe11f6dbce4946a582a5680582d","impliedFormat":1},{"version":"9e2739b32f741859263fdba0244c194ca8e96da49b430377930b8f721d77c000","impliedFormat":1},{"version":"a9e6c0ff3f8186fccd05752cf75fc94e147c02645087ac6de5cc16403323d870","impliedFormat":1},{"version":"49af4b52f0d4d2304c5f2c6fe5fab3e153e0acc38830d0202821b877c097dd02","impliedFormat":1},{"version":"49c346823ba6d4b12278c12c977fb3a31c06b9ca719015978cb145eb86da1c61","impliedFormat":1},{"version":"bfac6e50eaa7e73bb66b7e052c38fdc8ccfc8dbde2777648642af33cf349f7f1","impliedFormat":1},{"version":"92f7c1a4da7fbfd67a2228d1687d5c2e1faa0ba865a94d3550a3941d7527a45d","impliedFormat":1},{"version":"f53b120213a9289d9a26f5af90c4c686dd71d91487a0aa5451a38366c70dc64b","impliedFormat":1},{"version":"e68b8e5a1df7c1be2bc105141456ecba70215806e1c28bfbc5c12bfce4be6e68","impliedFormat":1},{"version":"511c8f02329808d47d00b859c532ae9115590048b17325a946c74dac48428650","impliedFormat":1},{"version":"57d67b72e06059adc5e9454de26bbfe567d412b962a501d263c75c2db430f40e","impliedFormat":1},{"version":"b5f9e66625783eefcbe3d2da074b2e7ba2066d61ce3fc6ef4f22805ad946cab4","impliedFormat":1},{"version":"e37115962d284b9f7a37c2bdd2add50f88365dde41f5e0ff591ffc48a8ec7575","impliedFormat":1},{"version":"6459054aabb306821a043e02b89d54da508e3a6966601a41e71c166e4ea1474f","impliedFormat":1},{"version":"bb37588926aba35c9283fe8d46ebf4e79ffe976343105f5c6d45f282793352b2","impliedFormat":1},{"version":"f89488602bec98a142072fae7ea5ba99431a569ff580c64b7be39896474799d8","impliedFormat":1},{"version":"bbbc47961f39a57df103cf4ca3bb8f8732b4b6678a18225a0aa76d59c466956c","impliedFormat":1},{"version":"2e6114a7dd6feeef85b2c80120fdbfb59a5529c0dcc5bfa8447b6996c97a69f5","impliedFormat":1},{"version":"2ffb043dc5163458e473b7010859f86e01dc4edffcae0a93d885d028b426a546","impliedFormat":1},{"version":"c8f004e6036aa1c764ad4ec543cf89a5c1893a9535c80ef3f2b653e370de45e6","impliedFormat":1},{"version":"dd80b1e600d00f5c6a6ba23f455b84a7db121219e68f89f10552c54ba46e4dc9","impliedFormat":1},{"version":"b064c36f35de7387d71c599bfcf28875849a1dbc733e82bd26cae3d1cd060521","impliedFormat":1},{"version":"05c7280d72f3ed26f346cbe7cbbbb002fb7f15739197cbbee6ab3fd1a6cb9347","impliedFormat":1},{"version":"8de9fe97fa9e00ec00666fa77ab6e91b35d25af8ca75dabcb01e14ad3299b150","impliedFormat":1},{"version":"04b7b2e0832dfd3c31e81df3975e8d8fda28e7ff999b0aa2932608a8f6661d5c","impliedFormat":1},{"version":"ca2d34c6ed5cbd3070b8b6f32f42ae54adcc6499c1e4b99f0a5798b3f27cc653","impliedFormat":1},{"version":"9ec68995e66dd6b9dac834bf5ae85fde802714ea2e82151a5d1d53ef01b463ef","impliedFormat":1},{"version":"5c4d626b4902f2ef8a1cc146d761d276cef988016dc674e3b98fbad70e64bc9f","impliedFormat":1},{"version":"fdfaa0aad899524962e2955287b5b991ffe3be50f64e02eb60c933ca44644a94","impliedFormat":1},{"version":"53c972a0f9bc3a4ec70fff7314123ea8cfcf75b3703046f767d2dc1eea87b2fb","impliedFormat":1},{"version":"f974e4a06953682a2c15d5bd5114c0284d5abf8bc0fe4da25cb9159427b70072","impliedFormat":1},{"version":"50256e9c31318487f3752b7ac12ff365c8949953e04568009c8705db802776fb","impliedFormat":1},{"version":"7d73b24e7bf31dfb8a931ca6c4245f6bb0814dfae17e4b60c9e194a631fe5f7b","impliedFormat":1},{"version":"d130c5f73768de51402351d5dc7d1b36eaec980ca697846e53156e4ea9911476","impliedFormat":1},{"version":"413586add0cfe7369b64979d4ec2ed56c3f771c0667fbde1bf1f10063ede0b08","impliedFormat":1},{"version":"06472528e998d152375ad3bd8ebcb69ff4694fd8d2effaf60a9d9f25a37a097a","impliedFormat":1},{"version":"7303b45138d2511035056a5901a1490ebdcbf055cbb1276f8629c5121cbe733e","impliedFormat":1},{"version":"27f874cd5327507eeff699a74567f60c1215b94509f4308633a7b01922471ed2","impliedFormat":1},{"version":"a401617604fa1f6ce437b81689563dfdc377069e4c58465dbd8d16069aede0a5","impliedFormat":1},{"version":"2c6cf04bc525caf6546e859e8ef10bfb9573837ec0bc5ec7b53a7b1b8ca72781","impliedFormat":1},{"version":"8695dec09ad439b0ceef3776ea68a232e381135b516878f0901ed2ea114fd0fe","impliedFormat":1},{"version":"304b44b1e97dd4c94697c3313df89a578dca4930a104454c99863f1784a54357","impliedFormat":1},{"version":"0a437ae178f999b46b6153d79095b60c42c996bc0458c04955f1c996dc68b971","impliedFormat":1},{"version":"74b2a5e5197bd0f2e0077a1ea7c07455bbea67b87b0869d9786d55104006784f","impliedFormat":1},{"version":"4a7baeb6325920044f66c0f8e5e6f1f52e06e6d87588d837bdf44feb6f35c664","impliedFormat":1},{"version":"87cc05fe13108f02e12da7e3efd8e360fef78d96a0c9e11408ea1b1b9fb3e03d","impliedFormat":1},{"version":"1abbf67c218d23c2ce76887caac2df6c7dab3d97ba2b65348432b876f510002a","impliedFormat":1},{"version":"1a82deef4c1d39f6882f28d275cad4c01f907b9b39be9cbc472fcf2cf051e05b","impliedFormat":1},{"version":"4b20fcf10a5413680e39f5666464859fc56b1003e7dfe2405ced82371ebd49b6","impliedFormat":1},{"version":"c06ef3b2569b1c1ad99fcd7fe5fba8d466e2619da5375dfa940a94e0feea899b","impliedFormat":1},{"version":"f7d628893c9fa52ba3ab01bcb5e79191636c4331ee5667ecc6373cbccff8ae12","impliedFormat":1},{"version":"1d879125d1ec570bf04bc1f362fdbe0cb538315c7ac4bcfcdf0c1e9670846aa6","impliedFormat":1},{"version":"8bd496cf710d4873d15e4891a5dbf945673e3321ca74cf75187e347fd5ed295e","impliedFormat":1},{"version":"a6dba407fc287f1e25454e75028c91bbc00675f2d1c4e8b3edcc36c08611a486","impliedFormat":1},{"version":"d663134457d8d669ae0df34eabd57028bddc04fc444c4bc04bc5215afc91e1f4","impliedFormat":1},{"version":"e91f7b1344577a02f051b9b471f33044fef8334a76dc9e1de003d17595a5219b","impliedFormat":1},{"version":"c0723195c85e19656d6b5b9fdb81d3f3403c1ae4679e722c6ea058c516b38d12","impliedFormat":1},{"version":"186eea74805194f04e41038fc5eca653788b9dedbab7c2d7d17e10139622dd92","impliedFormat":1},{"version":"71d9eb4c4e99456b78ae182fb20a5dfc20eb1667f091dbb9335b3c017dd1c783","impliedFormat":1},{"version":"cfa846a7b7847a1d973605fbb8c91f47f3a0f0643c18ac05c47077ebc72e71c7","impliedFormat":1},{"version":"1594da19968752a22b2ac48c2d0e60575700e745c577a8a4a676b841238ad5bb","impliedFormat":1},{"version":"e0cee12109e0a10a4c3d6769fcc7644b7c1ea7f52365bea51728f5af29f8a137","impliedFormat":1},{"version":"7d4254b4c6c67a29d5e7f65e67d72540480ac2cfb041ca484847f5ae70480b62","impliedFormat":1},{"version":"3536968defef8a75514f547ead5e2e9c1e984820290ec9b00c5fdfb6ef786535","impliedFormat":1},{"version":"d83773870080c30a230e322ce13a9c6f3398e8dacea4ea8a83e26370f3bac23e","impliedFormat":1},{"version":"dcfeaf98d66314fec29a9076c4290e45d0b196a65827becc19138e9c7b855f37","impliedFormat":1},{"version":"6849fe9210fe4946d5f085bfed36758f33dc6ae15a751338d178dd4daa017c46","impliedFormat":1},{"version":"888cda0fa66d7f74e985a3f7b1af1f64b8ff03eb3d5e80d051c3cbdeb7f32ab7","impliedFormat":1},{"version":"60681e13f3545be5e9477acb752b741eae6eaf4cc01658a25ec05bff8b82a2ef","impliedFormat":1},{"version":"ffae4e1e06aa848a1e4bcef162cd1c48e5909b26223515981310af9c036bdfc7","impliedFormat":1},{"version":"a57b1802794433adec9ff3fed12aa79d671faed86c49b09e02e1ac41b4f1d33a","impliedFormat":1},{"version":"34e16eb7c31768a11a08aebcfb3d70d7b8f0b016197e98d8419e566ceae6d6c8","impliedFormat":1},{"version":"f94ec1f7e4b709d26960306c9082a7a1b728a6e13089346aa48ba57c74cbf47e","impliedFormat":1},{"version":"9a11cb4033405e96c247cd5aa29790212aaffdd127869e8a5219103f0b389fd5","impliedFormat":1},{"version":"01479d9d5a5dda16d529b91811375187f61a06e74be294a35ecce77e0b9e8d6c","impliedFormat":1},{"version":"aff5213585cb72e94054dfe17250ff315f3569b3919d1ef1ad235f37c4ee894e","impliedFormat":1},{"version":"fb2ea35e1be6388d722d7725e2b49c697d34d9c890c3b96758faaeb86d35cef8","impliedFormat":1},{"version":"ce0df82a9ae6f914ba08409d4d883983cc08e6d59eb2df02d8e4d68309e7848b","impliedFormat":1},{"version":"1a4dc28334a926d90ba6a2d811ba0ff6c22775fcc13679521f034c124269fd40","impliedFormat":1},{"version":"f05315ff85714f0b87cc0b54bcd3dde2716e5a6b99aedcc19cad02bf2403e08c","impliedFormat":1},{"version":"5fad3b31fc17a5bc58095118a8b160f5260964787c52e7eb51e3d4fcf5d4a6f0","impliedFormat":1},{"version":"72105519d0390262cf0abe84cf41c926ade0ff475d35eb21307b2f94de985778","impliedFormat":1},{"version":"456006a6975b26c0a1785feddae165f6d307e2d601ffde27e21fc4a790e448a4","impliedFormat":1},{"version":"c857e0aae3f5f444abd791ec81206020fbcc1223e187316677e026d1c1d6fe08","impliedFormat":1},{"version":"ccf6dd45b708fb74ba9ed0f2478d4eb9195c9dfef0ff83a6092fa3cf2ff53b4f","impliedFormat":1},{"version":"1fe0d18b111e1145a7e7601855bccd4ca20f24e3b9a5aba6bb1fa9d1a7059170","impliedFormat":1},{"version":"5632c3c26d420c063eebe64c45b1248b9492a67bf44f1d0c57e9dc8f6cf449bb","impliedFormat":1},{"version":"0df5aa619ab12993a39ea6dae062ee46eadbb4d738916460e636ada52bced75b","impliedFormat":1},{"version":"8fca3039857709484e5893c05c1f9126ab7451fa6c29e19bb8c2411a2e937345","impliedFormat":1},{"version":"35069c2c417bd7443ae7c7cafd1de02f665bf015479fec998985ffbbf500628c","impliedFormat":1},{"version":"10ab7be91f87ebe8916b62cf28af2e45b5601fc7b0e311adf838f912c6b31dd8","impliedFormat":1},{"version":"bc636fbc08e0979ceb7eb0731a33000283d77a33b62e1f71ee65be50394e40ba","impliedFormat":1},{"version":"7e0b7f91c5ab6e33f511efc640d36e6f933510b11be24f98836a20a2dc914c2d","impliedFormat":1},{"version":"045b752f44bf9bbdcaffd882424ab0e15cb8d11fa94e1448942e338c8ef19fba","impliedFormat":1},{"version":"2894c56cad581928bb37607810af011764a2f511f575d28c9f4af0f2ef02d1ab","impliedFormat":1},{"version":"0a72186f94215d020cb386f7dca81d7495ab6c17066eb07d0f44a5bf33c1b21a","impliedFormat":1},{"version":"75bbd3be047d539988a0ff0b56384ef7a6a25f3b676ad96bee547d44c31622a7","impliedFormat":1},{"version":"42960001a776b089ade681ab5cfddc936e0afb0615133ec1841f3dee89d3e1bf","impliedFormat":1},{"version":"0aedb02516baf3e66b2c1db9fef50666d6ed257edac0f866ea32f1aa05aa474f","impliedFormat":1},{"version":"da47712b394d944328245482603bc6f416d3949b67c9392279caab595076b510","affectsGlobalScope":true,"impliedFormat":1},{"version":"37d0071d8f0a06dc55c2c5e0ec3391affd4fd107c53410bf358196ec0bf3923f","impliedFormat":1},{"version":"b213dad76ca37fd552274c9499056e1c0d9c1bd38a55bb7f68b22ba6b84c3ad7","impliedFormat":1},{"version":"56ccb49443bfb72e5952f7012f0de1a8679f9f75fc93a5c1ac0bafb28725fc5f","impliedFormat":1},{"version":"20fa37b636fdcc1746ea0738f733d0aed17890d1cd7cb1b2f37010222c23f13e","impliedFormat":1},{"version":"d90b9f1520366d713a73bd30c5a9eb0040d0fb6076aff370796bc776fd705943","impliedFormat":1},{"version":"bc03c3c352f689e38c0ddd50c39b1e65d59273991bfc8858a9e3c0ebb79c023b","impliedFormat":1},{"version":"19df3488557c2fc9b4d8f0bac0fd20fb59aa19dec67c81f93813951a81a867f8","affectsGlobalScope":true,"impliedFormat":1},{"version":"b25350193e103ae90423c5418ddb0ad1168dc9c393c9295ef34980b990030617","affectsGlobalScope":true,"impliedFormat":1},{"version":"bef86adb77316505c6b471da1d9b8c9e428867c2566270e8894d4d773a1c4dc2","impliedFormat":1},{"version":"5a49adaef698b7ad7e6127949fa1b0bbd3d46b7cbd11c54e392a4dcdd51f5190","impliedFormat":1},{"version":"96171c03c2e7f314d66d38acd581f9667439845865b7f85da8df598ff9617476","impliedFormat":1},{"version":"27be6622e2922a1b412eb057faa854831b95db9db5035c3f6d4b677b902ab3b7","impliedFormat":1},{"version":"5c634644d45a1b6bc7b05e71e05e52ec04f3d73d9ac85d5927f647a5f965181a","impliedFormat":1},{"version":"2489bf04d77dc025ba67f49f1a56eb24b9db477d5ff88123d887e163ed1776aa","impliedFormat":1},{"version":"63a7595a5015e65262557f883463f934904959da563b4f788306f699411e9bac","impliedFormat":1},{"version":"4ba137d6553965703b6b55fd2000b4e07ba365f8caeb0359162ad7247f9707a6","impliedFormat":1},{"version":"0b77b819b5417775fccb20c678293cf614c054a5b1a65421a5b933a9124ba998","impliedFormat":1},{"version":"e1f6076688a95bd82deaac740fccbe3cdea0d8a22057cccc9c5bce4398bdd33b","impliedFormat":1},{"version":"9252d498a77517aab5d8d4b5eb9d71e4b225bbc7123df9713e08181de63180f6","impliedFormat":1},{"version":"b1f1d57fde8247599731b24a733395c880a6561ec0c882efaaf20d7df968c5af","impliedFormat":1},{"version":"d7c1bbcddb06dcc8c9184013ace33c0dc71af715ab5987ccb42b903d2ec91193","impliedFormat":1},{"version":"35e6379c3f7cb27b111ad4c1aa69538fd8e788ab737b8ff7596a1b40e96f4f90","impliedFormat":1},{"version":"1fffe726740f9787f15b532e1dc870af3cd964dbe29e191e76121aa3dd8693f2","impliedFormat":1},{"version":"5a3ea721d03a361ccbdd7390ccd75f6e84cbca3a3f01f4b331ecc9af31890c49","impliedFormat":1},{"version":"e7dfaee4af38d45b1cab8a1ee0b3bc1f85ddcf64545ed391d675d78ae6526274","affectsGlobalScope":true,"impliedFormat":1},{"version":"98e2b197bf7fe7800f89c87825e2556d66474869845e97ad9c2b36f347c43539","impliedFormat":1},{"version":"af48e58339188d5737b608d41411a9c054685413d8ae88b8c1d0d9bfabdf6e7e","impliedFormat":1},{"version":"616775f16134fa9d01fc677ad3f76e68c051a056c22ab552c64cc281a9686790","impliedFormat":1},{"version":"65c24a8baa2cca1de069a0ba9fba82a173690f52d7e2d0f1f7542d59d5eb4db0","impliedFormat":1},{"version":"f9fe6af238339a0e5f7563acee3178f51db37f32a2e7c09f85273098cee7ec49","impliedFormat":1},{"version":"1de8c302fd35220d8f29dea378a4ae45199dc8ff83ca9923aca1400f2b28848a","impliedFormat":1},{"version":"77e71242e71ebf8528c5802993697878f0533db8f2299b4d36aa015bae08a79c","impliedFormat":1},{"version":"98a787be42bd92f8c2a37d7df5f13e5992da0d967fab794adbb7ee18370f9849","impliedFormat":1},{"version":"332248ee37cca52903572e66c11bef755ccc6e235835e63d3c3e60ddda3e9b93","impliedFormat":1},{"version":"94e8cc88ae2ef3d920bb3bdc369f48436db123aa2dc07f683309ad8c9968a1e1","impliedFormat":1},{"version":"4545c1a1ceca170d5d83452dd7c4994644c35cf676a671412601689d9a62da35","impliedFormat":1},{"version":"320f4091e33548b554d2214ce5fc31c96631b513dffa806e2e3a60766c8c49d9","impliedFormat":1},{"version":"a2d648d333cf67b9aeac5d81a1a379d563a8ffa91ddd61c6179f68de724260ff","impliedFormat":1},{"version":"d90d5f524de38889d1e1dbc2aeef00060d779f8688c02766ddb9ca195e4a713d","impliedFormat":1},{"version":"07ed3ddab975995eea41b22f3010506fb9f5fb301d04820b07d7a1aee5477d7c","impliedFormat":1},{"version":"969d8b0965849f4bae7cab0ba90bd1e1220e95999c2c6f01117fa7500901c017","impliedFormat":1},{"version":"6ec840ee5e2bc103f557fe38b1d585ee250540468713d7634ee066de372bf332","impliedFormat":1},{"version":"b0309e1eda99a9e76f87c18992d9c3689b0938266242835dd4611f2b69efe456","impliedFormat":1},{"version":"47699512e6d8bebf7be488182427189f999affe3addc1c87c882d36b7f2d0b0e","impliedFormat":1},{"version":"6ceb10ca57943be87ff9debe978f4ab73593c0c85ee802c051a93fc96aaf7a20","impliedFormat":1},{"version":"1de3ffe0cc28a9fe2ac761ece075826836b5a02f340b412510a59ba1d41a505a","impliedFormat":1},{"version":"e46d6cc08d243d8d0d83986f609d830991f00450fb234f5b2f861648c42dc0d8","impliedFormat":1},{"version":"1c0a98de1323051010ce5b958ad47bc1c007f7921973123c999300e2b7b0ecc0","impliedFormat":1},{"version":"ff863d17c6c659440f7c5c536e4db7762d8c2565547b2608f36b798a743606ca","impliedFormat":1},{"version":"5412ad0043cd60d1f1406fc12cb4fb987e9a734decbdd4db6f6acf71791e36fe","impliedFormat":1},{"version":"ad036a85efcd9e5b4f7dd5c1a7362c8478f9a3b6c3554654ca24a29aa850a9c5","impliedFormat":1},{"version":"fedebeae32c5cdd1a85b4e0504a01996e4a8adf3dfa72876920d3dd6e42978e7","impliedFormat":1},{"version":"e297c0a524edee7677939122f90027bfbe5f2698939d9a85728e5044b39c7124","impliedFormat":1},{"version":"cdf21eee8007e339b1b9945abf4a7b44930b1d695cc528459e68a3adc39a622e","impliedFormat":1},{"version":"bc9ee0192f056b3d5527bcd78dc3f9e527a9ba2bdc0a2c296fbc9027147df4b2","impliedFormat":1},{"version":"b62381cae176db34f003cc6172ee8f3e0122014889d66391aa73698105cf4934","impliedFormat":1},{"version":"1d9c0a9a6df4e8f29dc84c25c5aa0bb1da5456ebede7a03e03df08bb8b27bae6","impliedFormat":1},{"version":"84380af21da938a567c65ef95aefb5354f676368ee1a1cbb4cae81604a4c7d17","impliedFormat":1},{"version":"1af3e1f2a5d1332e136f8b0b95c0e6c0a02aaabd5092b36b64f3042a03debf28","impliedFormat":1},{"version":"30d8da250766efa99490fc02801047c2c6d72dd0da1bba6581c7e80d1d8842a4","impliedFormat":1},{"version":"03566202f5553bd2d9de22dfab0c61aa163cabb64f0223c08431fb3fc8f70280","impliedFormat":1},{"version":"41eb514d9ce0a6e87957f08a4b7af70d93f87637f37dee706e2d92a6601c25a9","impliedFormat":1},{"version":"e7765aa8bcb74a38b3230d212b4547686eb9796621ffb4367a104451c3f9614f","impliedFormat":1},{"version":"1de80059b8078ea5749941c9f863aa970b4735bdbb003be4925c853a8b6b4450","impliedFormat":1},{"version":"1d079c37fa53e3c21ed3fa214a27507bda9991f2a41458705b19ed8c2b61173d","impliedFormat":1},{"version":"5bf5c7a44e779790d1eb54c234b668b15e34affa95e78eada73e5757f61ed76a","impliedFormat":1},{"version":"5835a6e0d7cd2738e56b671af0e561e7c1b4fb77751383672f4b009f4e161d70","impliedFormat":1},{"version":"4b7f74b772140395e7af67c4841be1ab867c11b3b82a51b1aeb692822b76c872","impliedFormat":1},{"version":"7bd01f0f28cd3aeb2046274d85208e245965f6f2948edf4f7b2057bcf9f22ccc","impliedFormat":99},{"version":"d2f2cf2b8cc92bea913cda4a076e0f790b23a21e84f989d12f0116a7fe3906e0","impliedFormat":99},{"version":"6de125ea94866c736c6d58d68eb15272cf7d1020a5b459fea1c660027eca9a90","affectsGlobalScope":true,"impliedFormat":1},{"version":"f5b20bc288ee49989c95b20847fc93b96bf61cc0845598897a6a53a967dd7d07","affectsGlobalScope":true,"impliedFormat":1},{"version":"064ac1c2ac4b2867c2ceaa74bbdce0cb6a4c16e7c31a6497097159c18f74aa7c","impliedFormat":1},{"version":"3dc14e1ab45e497e5d5e4295271d54ff689aeae00b4277979fdd10fa563540ae","impliedFormat":1},{"version":"d3b315763d91265d6b0e7e7fa93cfdb8a80ce7cdd2d9f55ba0f37a22db00bdb8","impliedFormat":1},{"version":"b789bf89eb19c777ed1e956dbad0925ca795701552d22e68fd130a032008b9f9","impliedFormat":1},{"version":"87e2285f451bd76dc827bd822abeba40ec03baa7adc4ca4f894f84e9b8219fb9","affectsGlobalScope":true},"7ad303e40d4fddf44f156129e397511953a71481c5cfd86b1862649aaaf240cc","13831e0eacf11fd886906b8b9a21dc27cd48d368460528f7e889ed6c2c561a03","b34644a748b8f76c8834de829fdd953a97004bfb1cc08c4a13506020045b3c5e",{"version":"222ca75200369213041c9aa71c8d305c9aff8d63627da5b14c2dfa158d1051df","signature":"823219d4793c8d7f0c7e3435c85eed47ba5923cce6a35b43bcbd722a52feb77b"},{"version":"f734b58ea162765ff4d4a36f671ee06da898921e985a2064510f4925ec1ed062","affectsGlobalScope":true,"impliedFormat":1},{"version":"9b643d11b5bca11af760795e56096beae0ed29e9027fec409481f2ee1cb54bbc","impliedFormat":1},{"version":"55c0569d0b70dbc0bb9a811469a1e2a7b8e2bab2d70c013f2e40dfb2d2803d05","impliedFormat":1},{"version":"37f96daaddc2dd96712b2e86f3901f477ac01a5c2539b1bc07fd609d62039ee1","impliedFormat":1},{"version":"9c5c84c449a3d74e417343410ba9f1bd8bfeb32abd16945a1b3d0592ded31bc8","impliedFormat":1},{"version":"a7f09d2aaf994dbfd872eda4f2411d619217b04dbe0916202304e7a3d4b0f5f8","impliedFormat":1},{"version":"a66ebe9a1302d167b34d302dd6719a83697897f3104d255fe02ff65c47c5814e","impliedFormat":99},{"version":"faf770b3935c2ba6558b2bb65af5d5de58945d81f496dc1a5938c41a1abb358b","impliedFormat":99},"04d516ea781ae5712f84453b5d93a28dbd1aea2f592f09a218e4573d6a45dde3","a43c022e94a6b3186bef5503b526cbffaa6a7f5bd54c5e0efc5c8c7b7450f636","168f5f465976626d7bdc0545b75747dc8a4bd0c2e90be982984c4bdebdcd7cf6","f671aa9488f28c0d4efc3fb16db9e9e92c7712674beb5165e9eaadada2dee1c5","047a205de787565f14994d6fad569a362a206e394442467846a7a780d7746473","bd759af437e926d7fadc4c44e854859ee5a6031584d908e0e0c011f3e5494b24","dc6975f365cebab2a744402eaf8f74318ebf557b266eb318b45806ca7f7e2866",{"version":"c013ac1b810e831533fcb367242aaf86198a5307a21088825385841aaa90f83b","signature":"96154145493bea154784d1bdb8141e6fc053a835979da3fc46b0cb9ff01752b2"},"52c4c01ba7f55919ebe7be86d08da8436ceb9acb127bbe2945720e2509083b2b","250b0d7e089b19e6efcda749df4794a02b95103ca6f886a2920e1bfebe263d74",{"version":"b831d284fa29da76025551cea3746b30d025ee6c1a9dabd6fe92ff156016d0c0","signature":"3c5d9be6798520f8dfb5b7fd201acd41444feddd734ee12110b7fa705354ba64"},{"version":"5ac0b6a9397fb1062d289a30a0413d1bcdf07a1dc7cf5e42536f147490dd7f5b","signature":"d90fedf8cebefdb033b5b0e1989d56892378763e11097cc522b29ff5e0824ff8"},"02b96bfc76e45754990a86de0c4ca96922e75ecddd85fa457853d5c45f3edf6c",{"version":"fe93c474ab38ac02e30e3af073412b4f92b740152cf3a751fdaee8cbea982341","impliedFormat":1},{"version":"3255b97f3f24af29c79cc1aa88004efb13b6285ebdde0a567bf32e19bb65250d","impliedFormat":1},{"version":"1e00b8bf9e3766c958218cd6144ffe08418286f89ff44ba5a2cc830c03dd22c7","impliedFormat":1},{"version":"23874b6d249b9780eb941f5abb1b4c578219dcaaaad8783be2e731f922bdf291","impliedFormat":1},"ac4132ba1471ce5cda676e9ac606ca58eacadb3a8a4d1649eff44e89cd126579","640a2a37463cc24aebdb853c5fe2c634906f65c329ebb35587864f081fe2cde0","05e5cd95fc99f298937998e711000aefb84b9a964193ef6b7afbd31b58f5bab0",{"version":"37c7961117708394f64361ade31a41f96cef7f2a6606300821c72438dd4abda3","impliedFormat":1},{"version":"f5a0ca672513d5a3e303b36801e4573bb17ae002da225c28c1723eeee0f97145","affectsGlobalScope":true,"impliedFormat":1},{"version":"3d9189f26f01d4e36d3fb380810ef5999992235282e3c293da77d1d8aed09d9f","impliedFormat":1},{"version":"d9bf522aa42728ab077c4675515f5c2d1b739cb37a07d2903f3a0227219fd58f","impliedFormat":1},{"version":"6faa48cae74d411d179da717a8d61fd69d3f1fc279f7a093722dfc1f8661dd19","signature":"94ebdee4b8642e7a875b57cad30b42a2679489e75a790def0a48b01799257502"},"cd47990eb1b2ce5505f41ac71377eba2286bfe872a732477b9c440a1850f7c2c",{"version":"c652e3653150b8ee84ffc9034860d9183e6b4c34be28e3ba41b34b1417941982","impliedFormat":99},{"version":"e1f2b02372cd5acf5bebee18d578e0bd41151097a8afa0a1c536355c361628b8","impliedFormat":1},"ac2ad19c3ef8fcf6fd81eebd5dc367e72e9716867339a5f32ec7a84d44bbc77f","81537139c943d8256e7f5328b899146868c6eb90a8868db8df74dd74e0ed15ef","c688540c4b76649777f8413f6a8e5512d4c35585d24b510d07d7253ce111fa03",{"version":"16d3cc58c07e69113534a3b8b4b6d60228df872439954b51db36bad206a78d72","signature":"d1970d78871edd843a289ca4e25c0e2311e631bef5ae21545a47bd139261bea0"},{"version":"754e7eb3c5d3d8be176f150ffb6a4e8c4980168a4f5495057b6b5759a3187f93","signature":"ff6dfda5378fc7b1ffb6f75724fa0b04c32109d9459a9df45de1ae5186b44a1c"},{"version":"f9d9485f3794f9488ca10430ab7e9210b54a46a729c2fa68ae794e55383d6c4f","signature":"3f2cef8e84b1552df60bc9b5ceb253f9daedd2f9cb2255075ae28b1cccd3812e"},{"version":"1c80e42d55a28b4d9f304a639db2fc8406be3cb6c8ecbd841dd522084dfa6ba4","signature":"c1c0fdbb129948e18a8b11c893490ee3ce0055631ad8de1eee247343d8359ce6"},"bf83ae8b72f9ab9ccbc506710f0d16d28fd2dcdb815013e9a9c1bb6a8853917b","c18b3e2ffae38e7b7e141b720270dfb1431ad53f6d3a84f12ae4650293e32d2c","ae4be18fea4424c5e0b866dc6f1bed0b5bf488404a5688afaf369bce5f301286",{"version":"4a406e20a117726a325eac8204e18065d09c94c5b71315ecc54a79d8ece84ad4","signature":"cb35f32ada4c9518afd80bd03570d27e50a966ddf376683c9fe282db1b577ed3"},"a8409a1cbc4c116f6b317bf7398aeb3845b5100ef93d9d0d2ab55c72c65b4fea","6a50a89b0ed2d1ba69eded69c69d90b8cbaa0bcff2959edb02254823cdf57842","a676eb12eeaae4dbb73cb6d4837555357f685627cfbe9b0c2f5d25bb6f83772f",{"version":"6ce55335012d76737df504baabc950805760acf3be988142d1985aa4893f919e","impliedFormat":1},{"version":"88efe27bebddb62da9655a9f093e0c27719647e96747f16650489dc9671075d6","impliedFormat":1},{"version":"e348f128032c4807ad9359a1fff29fcbc5f551c81be807bfa86db5a45649b7ba","impliedFormat":1},{"version":"8ee6b07974528da39b7835556e12dd3198c0a13e4a9de321217cd2044f3de22e","impliedFormat":1},{"version":"deefd8c43b40f9797c3921d78d3f9243959621a17b817be7f5d95c149f23a9dd","impliedFormat":1},{"version":"5f12132800d430adbe59b49c2c0354d85a71ada7d756e34250a655baa8ad4ae5","impliedFormat":1},{"version":"1996d1cd7d585a8359a35878f67abdd73cc35b1f675c9c6b147b202fdd8dfc3f","impliedFormat":1},{"version":"b16e757e4c35434065120a2b3bf13a518fc9e621dc9c2ed668f91635a9dc4e75","impliedFormat":1},{"version":"d22cd2e880dc30d21cf20b26b6341e0478f3505ea645d1504c7e9c14cdff1198","impliedFormat":1},{"version":"d02ced7accb512e6198b796b8d284e7979abde0f089b0a77969747a5f27bfb23","impliedFormat":1},{"version":"4374cefdde5c6e9bad52b0436e887b8325b8f407c12035194ad02c28f1553a3a","impliedFormat":1},{"version":"5f1ba0898eb0a54a644cb9c95c2240beaa961d87fd080cbb90807a6cc03daeb3","impliedFormat":1},{"version":"8e92ee8710ba85b158c5d91b0bbc9d0d033f5e062b6e70178063f01b20f63a14","impliedFormat":1},{"version":"ee933420aacba1f60aa70fb8ba47c5e69001b005073b71973114587089a13c7f","impliedFormat":1},{"version":"0a0714999d0a5bdfacd15c7b34cffbcc6f263f6cb0ccb42076cdc541c6987797","impliedFormat":1},{"version":"56584bfc655f9df64afc0f22f7d1122c29e5b74b342c203b891e19de9fa37de8","impliedFormat":1},{"version":"40ec58f0fadd0b3981b3d383e1c12fa0680115ae9f018387fc2cfc0bbcf23204","impliedFormat":1},{"version":"849b9e7283b7309a4556c9b90bb8e2dfc27751f157798065bbc513dcddb09a8c","impliedFormat":1},{"version":"76bba0c97594248c1be19af32d5799f7eff51cec2926d8e4dd59267d7636a0b4","impliedFormat":1},{"version":"10e109212c7be8a9f66e988e5d6c2a8900c9d14bf6beadf5fa70d32ada3425cf","impliedFormat":1},{"version":"2b821aeb31e690092f8eae671dd961a9d0fd598ff4883ce0a600c90e9e8fa716","impliedFormat":1},{"version":"26602933b613e4df3868a6c82e14fffa2393a08531cb333ed27b151923462981","impliedFormat":1},{"version":"f57a588d8f6b3ce5c8b494f2dc759a8885eaee18e80a4952df47de45403fedbe","impliedFormat":1},{"version":"34735727b3fe7a0ed0651a0f88d06449163d1989a2b2de7f047473adc7c1c383","impliedFormat":1},{"version":"a5b13abc88ab3186e713c445e59e2f6eee20c6167943517bc2f56985d89b8c55","impliedFormat":1},{"version":"c8a206a6ba4e32710ebb4a389187772423de0f4f6180b95a7ef1a5a1934c1be6","impliedFormat":1},{"version":"7ae65fe95b18205e241e6695cb2c61c0828d660aca7d08f68781b439a800e6b8","impliedFormat":1},{"version":"c2c8c166199d3a7bd093152437d1f6399d05e458a9ca9364456feecba920cda4","impliedFormat":1},{"version":"369b7270eeeb37982203b2cb18c7302947b89bf5818c1d3d2e95a0418f02b74e","impliedFormat":1},{"version":"94f95d223e2783b0aef4d15d7f6990a6a550fe17d099c501395f690337f7105e","impliedFormat":1},{"version":"039bd8d1e0d151570b66e75ee152877fb0e2f42eca43718632ac195e6884be34","impliedFormat":1},{"version":"d565d66b38d54de037c9d46dede1f12630010d9b45fd9c6b432c7a40b2e30502","impliedFormat":1},{"version":"d7386a1ebe9a3eae227a5561c898c10cacb61a49f941c5a18cdf593f979c693c","impliedFormat":1},{"version":"d3cfde44f8089768ebb08098c96d01ca260b88bccf238d55eee93f1c620ff5a5","impliedFormat":1},{"version":"293eadad9dead44c6fd1db6de552663c33f215c55a1bfa2802a1bceed88ff0ec","impliedFormat":1},{"version":"36eb5babc665b890786550d4a8cb20ef7105673a6d5551fbdd7012877bb26942","impliedFormat":1},{"version":"fec412ded391a7239ef58f455278154b62939370309c1fed322293d98c8796a6","impliedFormat":1},{"version":"e3498cf5e428e6c6b9e97bd88736f26d6cf147dedbfa5a8ad3ed8e05e059af8a","impliedFormat":1},{"version":"dba3f34531fd9b1b6e072928b6f885aa4d28dd6789cbd0e93563d43f4b62da53","impliedFormat":1},{"version":"f672c876c1a04a223cf2023b3d91e8a52bb1544c576b81bf64a8fec82be9969c","impliedFormat":1},{"version":"e4b03ddcf8563b1c0aee782a185286ed85a255ce8a30df8453aade2188bbc904","impliedFormat":1},{"version":"2329d90062487e1eaca87b5e06abcbbeeecf80a82f65f949fd332cfcf824b87b","impliedFormat":1},{"version":"25b3f581e12ede11e5739f57a86e8668fbc0124f6649506def306cad2c59d262","impliedFormat":1},{"version":"93c3e73824ad57f98fd23b39335dbdae2db0bd98199b0dc0b9ccc60bf3c5134a","impliedFormat":1},{"version":"a9ebb67d6bbead6044b43714b50dcb77b8f7541ffe803046fdec1714c1eba206","impliedFormat":1},{"version":"833e92c058d033cde3f29a6c7603f517001d1ddd8020bc94d2067a3bc69b2a8e","impliedFormat":1},{"version":"c1a2e05eb6d7ca8d7e4a7f4c93ccf0c2857e842a64c98eaee4d85841ee9855e6","impliedFormat":1},{"version":"835fb2909ce458740fb4a49fc61709896c6864f5ce3db7f0a88f06c720d74d02","impliedFormat":1},{"version":"6e5857f38aa297a859cab4ec891408659218a5a2610cd317b6dcbef9979459cc","impliedFormat":1},{"version":"ead8e39c2e11891f286b06ae2aa71f208b1802661fcdb2425cffa4f494a68854","impliedFormat":1},{"version":"82919acbb38870fcf5786ec1292f0f5afe490f9b3060123e48675831bd947192","impliedFormat":1},{"version":"e222701788ec77bd57c28facbbd142eadf5c749a74d586bc2f317db7e33544b1","impliedFormat":1},{"version":"09154713fae0ed7befacdad783e5bd1970c06fc41a5f866f7f933b96312ce764","impliedFormat":1},{"version":"8d67b13da77316a8a2fabc21d340866ddf8a4b99e76a6c951cc45189142df652","impliedFormat":1},{"version":"a91c8d28d10fee7fe717ddf3743f287b68770c813c98f796b6e38d5d164bd459","impliedFormat":1},{"version":"68add36d9632bc096d7245d24d6b0b8ad5f125183016102a3dad4c9c2438ccb0","impliedFormat":1},{"version":"3a819c2928ee06bbcc84e2797fd3558ae2ebb7e0ed8d87f71732fb2e2acc87b4","impliedFormat":1},{"version":"f6f827cd43e92685f194002d6b52a9408309cda1cec46fb7ca8489a95cbd2fd4","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"e0bfe601a9fdf6defe94ed62dc60ac71597566001a1f86e705c95e431a9c816d","impliedFormat":1},{"version":"a270a1a893d1aee5a3c1c8c276cd2778aa970a2741ee2ccf29cc3210d7da80f5","impliedFormat":1},{"version":"add0ce7b77ba5b308492fa68f77f24d1ed1d9148534bdf05ac17c30763fc1a79","impliedFormat":1},{"version":"8926594ee895917e90701d8cbb5fdf77fc238b266ac540f929c7253f8ad6233d","impliedFormat":1},{"version":"2f67911e4bf4e0717dc2ded248ce2d5e4398d945ee13889a6852c1233ea41508","impliedFormat":1},{"version":"d8430c275b0f59417ea8e173cfb888a4477b430ec35b595bf734f3ec7a7d729f","impliedFormat":1},{"version":"69364df1c776372d7df1fb46a6cb3a6bf7f55e700f533a104e3f9d70a32bec18","impliedFormat":1},{"version":"8e6427dd1a4321b0857499739c641b98657ea6dc7cc9a02c9b2c25a845c3c8e6","impliedFormat":1},{"version":"58da08d1fe876c79c47dcf88be37c5c3fab55d97b34c8c09a666599a2191208d","impliedFormat":1},{"version":"6042774c61ece4ba77b3bf375f15942eb054675b7957882a00c22c0e4fe5865c","impliedFormat":1},{"version":"5a3bd57ed7a9d9afef74c75f77fce79ba3c786401af9810cdf45907c4e93f30e","impliedFormat":1},{"version":"ed8763205f02fb65e84eff7432155258df7f93b7d938f01785cb447d043d53f3","impliedFormat":1},{"version":"30db853bb2e60170ba11e39ab48bacecb32d06d4def89eedf17e58ebab762a65","impliedFormat":1},{"version":"e27451b24234dfed45f6cf22112a04955183a99c42a2691fb4936d63cfe42761","impliedFormat":1},{"version":"2316301dd223d31962d917999acf8e543e0119c5d24ec984c9f22cb23247160c","impliedFormat":1},{"version":"58d65a2803c3b6629b0e18c8bf1bc883a686fcf0333230dd0151ab6e85b74307","impliedFormat":1},{"version":"e818471014c77c103330aee11f00a7a00b37b35500b53ea6f337aefacd6174c9","impliedFormat":1},{"version":"d4a5b1d2ff02c37643e18db302488cd64c342b00e2786e65caac4e12bda9219b","impliedFormat":1},{"version":"29f823cbe0166e10e7176a94afe609a24b9e5af3858628c541ff8ce1727023cd","impliedFormat":1},"ef199d5fdc234ac6e74d97830709a176aca59ef15416d353e98052d487c6f4a1","f317cab60803426a36ddf639c3ca8656a77680874a6974b1208568910b00223f","789689ee3d7c5fe1d7912311ff418063bc915d822627aaf925f27d65958506db","114b426af1d29db97181f9034777d6e4ad95eb1b8a6be884bdad7906535b89e8","7246f2eacd085588c633c43bc2e497fcb9916ff60797edf27b38f57e1323181a","ca88e94ee6376344f7f7274c5f70ddf3c6b00bcf87fa7307e76d33fd49922d81",{"version":"c719f9aab2c7f8a74a971ec53a8980ff7c59d5bbf76bf6fc7ecd4de97ea0afda","signature":"392f2e06ee257cac742ecd07f3983b3f6af1a5244b510c8cf0afe42868762561"},{"version":"443543952676fc7fc1df73033f4ff4d3cdf756771d52aa0e8ba8e6ba9b3bb2dc","signature":"df1eaffded25d254dd98cc565273c1caf348f75cd7bd2155786ae175952a66b5"},{"version":"c6dfadb84cef23b20c9a55e74af7b870be64912d365bcd18b44d0836ad4ed635","signature":"31fc6caa7c71b180347b884b9bf133b8e252765bf9cbe47f90eca52e353284d7"},"e58e722b9d7e6fd0b2539a11d9caeecffdd975466368640f6036b082b5ea2dc5","39b9cec8cf81019515d1948370860eade709dceb6272039729e69b5d555e2b28",{"version":"b815943a90ae25de210d64989e597f5f8072a028b95f48537bff7d7b3feb8244","signature":"8648e45571a83c67e32c1a8094b4dad16ff165269fd21845b4749d9e9a463519"},"caaedbb8fe193083fe7ce3d465a8ea15d8d32f7b1fa61ca11facac66c6becf85","65836c4ce93c65b1646c3a27895433fd14e2b1c0750c5c258a09789d71e7188b",{"version":"0a685b119d9be3ab40771fd01ab6c7011ba4142a534a7381956d589d4a0e2382","signature":"b7f38df2ae00a792b5793cbdfce2d18660e04795981569bd71c2f1f88aac4d1e"},"7d5f5894b116f9e7444bdfad0c7210302b2c2c7b06ffab2020d6dcab0e6cd34f","d1986184a09a52db8228cb2bb2a61a8c05c9354e5b93cec8e2628d8579c892d7",{"version":"87e2285f451bd76dc827bd822abeba40ec03baa7adc4ca4f894f84e9b8219fb9","affectsGlobalScope":true},"84c00a301e6243f47f5d1fde505ae08579b268646ecfd8143308b5a1ebaebbe0","d1986184a09a52db8228cb2bb2a61a8c05c9354e5b93cec8e2628d8579c892d7","dbd7d44bd7420c016c714ed64479fd80a43d91cd2e8ecfa64a2047b8fe9dda52",{"version":"151ff381ef9ff8da2da9b9663ebf657eac35c4c9a19183420c05728f31a6761d","impliedFormat":1},{"version":"f3d8c757e148ad968f0d98697987db363070abada5f503da3c06aefd9d4248c1","impliedFormat":1},{"version":"96d14f21b7652903852eef49379d04dbda28c16ed36468f8c9fa08f7c14c9538","impliedFormat":1},{"version":"7fa8d75d229eeaee235a801758d9c694e94405013fe77d5d1dd8e3201fc414f1","impliedFormat":1}],"root":[[530,534],[543,555],[560,562],567,568,[571,584],[710,730]],"options":{"allowJs":true,"esModuleInterop":true,"jsx":4,"module":99,"skipLibCheck":true,"strict":true,"target":4},"referencedMap":[[729,1],[530,2],[730,3],[726,4],[727,2],[728,5],[531,6],[532,7],[699,8],[698,9],[374,2],[541,10],[540,11],[731,2],[732,2],[733,2],[140,12],[141,12],[142,13],[97,14],[143,15],[144,16],[145,17],[92,2],[95,18],[93,2],[94,2],[146,19],[147,20],[148,21],[149,22],[150,23],[151,24],[152,24],[153,25],[154,26],[155,27],[156,28],[98,2],[96,2],[157,29],[158,30],[159,31],[191,32],[160,33],[161,34],[162,35],[163,36],[164,37],[165,38],[166,39],[167,40],[168,41],[169,42],[170,42],[171,43],[172,2],[173,44],[175,45],[174,46],[176,47],[177,48],[178,49],[179,50],[180,51],[181,52],[182,53],[183,54],[184,55],[185,56],[186,57],[187,58],[188,59],[99,2],[100,2],[101,2],[139,60],[189,61],[190,62],[195,63],[459,64],[196,65],[194,66],[461,67],[460,68],[192,69],[457,2],[193,70],[83,2],[85,71],[456,64],[226,64],[734,2],[542,2],[84,2],[565,72],[566,73],[569,74],[537,2],[559,64],[564,75],[563,2],[482,76],[487,77],[494,78],[477,79],[230,2],[238,80],[378,81],[381,82],[353,2],[366,83],[373,84],[255,2],[355,2],[236,2],[352,85],[398,86],[237,2],[228,87],[380,88],[382,89],[383,90],[454,91],[347,92],[300,93],[360,94],[361,95],[359,96],[358,2],[354,97],[379,98],[239,99],[424,2],[425,100],[266,101],[240,102],[267,101],[303,101],[206,101],[376,103],[375,2],[365,104],[472,2],[215,2],[493,105],[432,106],[433,107],[429,108],[511,2],[330,2],[434,109],[430,110],[516,111],[515,112],[510,2],[281,2],[333,113],[332,2],[509,114],[431,64],[286,115],[293,116],[295,117],[285,2],[290,118],[292,119],[294,120],[289,121],[287,2],[291,122],[512,2],[508,2],[514,123],[513,2],[284,124],[503,125],[506,126],[274,127],[273,128],[272,129],[519,64],[271,130],[260,2],[521,2],[557,131],[556,2],[522,64],[523,132],[198,2],[362,133],[363,134],[364,135],[202,2],[367,2],[222,136],[197,2],[446,64],[204,137],[445,138],[444,139],[435,2],[436,2],[443,2],[438,2],[441,140],[437,2],[439,141],[442,142],[440,141],[235,2],[232,2],[233,101],[387,2],[392,143],[393,144],[391,145],[389,146],[390,147],[385,2],[452,109],[227,109],[481,148],[488,149],[492,150],[321,151],[320,2],[315,2],[468,152],[476,153],[348,154],[349,155],[427,156],[337,2],[450,157],[325,64],[342,158],[453,159],[338,2],[341,160],[339,2],[451,161],[448,162],[447,2],[449,2],[345,2],[423,163],[210,164],[323,165],[327,166],[343,167],[346,168],[335,169],[328,170],[475,171],[401,172],[319,173],[207,174],[474,175],[203,176],[394,177],[386,2],[395,178],[412,179],[384,2],[411,180],[91,2],[406,181],[231,2],[426,182],[402,2],[216,2],[218,2],[357,2],[410,183],[234,2],[258,184],[344,185],[264,186],[324,2],[409,2],[388,2],[414,187],[415,188],[356,2],[417,189],[419,190],[418,191],[368,2],[408,174],[421,192],[318,193],[407,194],[413,195],[243,2],[247,2],[246,2],[245,2],[250,2],[244,2],[253,2],[252,2],[249,2],[248,2],[251,2],[254,196],[242,2],[310,197],[309,2],[314,198],[311,199],[313,200],[316,198],[312,199],[223,201],[302,202],[471,203],[469,2],[498,204],[500,205],[464,206],[499,207],[211,208],[208,208],[241,2],[225,209],[224,210],[220,211],[221,212],[229,213],[257,213],[268,213],[304,214],[269,214],[213,215],[212,2],[308,216],[307,217],[306,218],[305,219],[214,220],[455,221],[256,222],[463,223],[428,224],[458,225],[462,226],[351,227],[350,228],[331,229],[317,230],[299,231],[301,232],[298,233],[420,234],[322,2],[486,2],[219,235],[422,236],[470,237],[329,2],[259,238],[336,239],[334,240],[261,241],[396,242],[465,2],[262,243],[397,243],[484,2],[483,2],[485,2],[467,2],[466,2],[399,244],[326,2],[296,245],[217,246],[275,2],[201,247],[263,2],[490,64],[200,2],[502,248],[283,64],[496,109],[282,249],[479,250],[280,248],[205,2],[504,251],[278,64],[279,64],[270,2],[199,2],[277,252],[276,253],[265,254],[340,41],[400,41],[416,2],[404,255],[403,2],[288,124],[209,2],[297,64],[473,136],[480,256],[86,64],[89,257],[90,258],[87,64],[88,2],[377,259],[372,260],[371,2],[370,261],[369,2],[478,262],[489,263],[491,264],[495,265],[558,266],[497,267],[501,268],[529,269],[505,269],[528,270],[507,271],[517,272],[518,273],[520,274],[524,275],[527,136],[526,2],[525,276],[585,2],[601,277],[602,277],[603,277],[617,278],[604,279],[605,279],[606,280],[598,281],[596,282],[587,2],[591,283],[595,284],[593,285],[600,286],[588,287],[589,288],[590,289],[592,290],[594,291],[597,292],[599,293],[607,279],[608,279],[609,279],[610,277],[611,279],[612,279],[586,279],[613,2],[615,294],[614,279],[616,277],[570,295],[536,296],[539,297],[535,2],[538,2],[405,298],[81,2],[82,2],[13,2],[14,2],[16,2],[15,2],[2,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[3,2],[25,2],[26,2],[4,2],[27,2],[31,2],[28,2],[29,2],[30,2],[32,2],[33,2],[34,2],[5,2],[35,2],[36,2],[37,2],[38,2],[6,2],[42,2],[39,2],[40,2],[41,2],[43,2],[7,2],[44,2],[49,2],[50,2],[45,2],[46,2],[47,2],[48,2],[8,2],[54,2],[51,2],[52,2],[53,2],[55,2],[9,2],[56,2],[57,2],[58,2],[60,2],[59,2],[61,2],[62,2],[10,2],[63,2],[64,2],[65,2],[11,2],[66,2],[67,2],[68,2],[69,2],[70,2],[1,2],[71,2],[72,2],[12,2],[76,2],[74,2],[79,2],[78,2],[73,2],[77,2],[75,2],[80,2],[117,299],[127,300],[116,299],[137,301],[108,302],[107,303],[136,276],[130,304],[135,305],[110,306],[124,307],[109,308],[133,309],[105,310],[104,276],[134,311],[106,312],[111,313],[112,2],[115,313],[102,2],[138,314],[128,315],[119,316],[120,317],[122,318],[118,319],[121,320],[131,276],[113,321],[114,322],[123,323],[103,324],[126,315],[125,313],[129,2],[132,325],[709,326],[622,327],[629,328],[624,2],[625,2],[623,329],[626,330],[618,2],[619,2],[630,331],[621,332],[627,2],[628,333],[620,334],[703,335],[707,336],[704,336],[700,335],[708,337],[705,338],[706,336],[701,339],[702,340],[694,341],[638,342],[640,343],[693,2],[639,344],[697,345],[696,346],[695,347],[631,2],[641,342],[642,2],[633,348],[637,349],[632,2],[634,350],[635,351],[636,2],[643,352],[644,352],[645,352],[646,352],[647,352],[648,352],[649,352],[650,352],[651,352],[652,352],[653,352],[654,352],[655,352],[657,352],[656,352],[658,352],[659,352],[660,352],[661,352],[692,353],[662,352],[663,352],[664,352],[665,352],[666,352],[667,352],[668,352],[669,352],[670,352],[671,352],[672,352],[673,352],[674,352],[676,352],[675,352],[677,352],[678,352],[679,352],[680,352],[681,352],[682,352],[683,352],[684,352],[685,352],[686,352],[687,352],[688,352],[691,352],[689,352],[690,352],[580,354],[579,355],[577,356],[581,357],[712,358],[713,359],[714,360],[583,361],[715,362],[716,363],[584,364],[718,365],[719,366],[720,367],[721,368],[722,369],[571,370],[723,362],[575,371],[724,372],[582,373],[710,374],[717,375],[562,11],[578,376],[576,376],[567,377],[561,378],[573,379],[560,380],[574,381],[568,382],[572,383],[711,374],[725,384],[533,11],[534,11],[553,385],[552,382],[544,386],[550,386],[549,386],[547,386],[546,386],[545,386],[548,386],[551,387],[543,388],[554,11],[555,11]],"affectedFilesPendingEmit":[730,728,532,580,579,577,581,712,713,714,583,715,716,584,718,719,720,721,722,571,723,575,724,582,710,717,562,578,576,567,561,573,560,574,568,572,711,725,533,534,553,552,544,550,549,547,546,545,548,551,543,554,555],"version":"5.9.3"}
```

