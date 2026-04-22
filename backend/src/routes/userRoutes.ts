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
