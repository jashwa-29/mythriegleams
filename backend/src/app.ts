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
import occasionRoutes from './routes/occasionRoutes';
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
app.use('/api/occasions', occasionRoutes);
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
