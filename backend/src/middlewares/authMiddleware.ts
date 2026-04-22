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
