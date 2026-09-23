import { Router } from 'express';
import { getCollections, createCollection, updateCollection, deleteCollection } from '../controllers/collectionController';
import { protect, admin } from '../middlewares/authMiddleware';
import upload from '../middlewares/uploadMiddleware';

const router = Router();

// Public Routes
router.get('/', getCollections);

// Admin Routes
router.post('/', protect, admin, upload.single('image'), createCollection);
router.put('/:id', protect, admin, upload.single('image'), updateCollection);
router.delete('/:id', protect, admin, deleteCollection);

export default router;