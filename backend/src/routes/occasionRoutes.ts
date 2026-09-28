import { Router } from 'express';
import { getOccasions, createOccasion, updateOccasion, deleteOccasion, setOccasionPause } from '../controllers/occasionController';
import { protect, admin, optionalAuth } from '../middlewares/authMiddleware';
import upload from '../middlewares/uploadMiddleware';

const router = Router();

// Public Routes (optionalAuth enables ?all=1 for admins)
router.get('/', optionalAuth, getOccasions);

// Admin Routes
router.post('/', protect, admin, upload.single('image'), createOccasion);
router.put('/:id', protect, admin, upload.single('image'), updateOccasion);
router.put('/:id/pause', protect, admin, setOccasionPause);
router.delete('/:id', protect, admin, deleteOccasion);

export default router;
