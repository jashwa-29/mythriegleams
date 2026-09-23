import { Router } from 'express';
import { getOccasions, createOccasion, updateOccasion, deleteOccasion } from '../controllers/occasionController';
import { protect, admin } from '../middlewares/authMiddleware';
import upload from '../middlewares/uploadMiddleware';

const router = Router();

// Public Routes
router.get('/', getOccasions);

// Admin Routes
router.post('/', protect, admin, upload.single('image'), createOccasion);
router.put('/:id', protect, admin, upload.single('image'), updateOccasion);
router.delete('/:id', protect, admin, deleteOccasion);

export default router;