import { Router } from 'express';
import { getCollections, createCollection, updateCollection, deleteCollection, setCollectionPause } from '../controllers/collectionController';
import { protect, admin, optionalAuth } from '../middlewares/authMiddleware';
import upload from '../middlewares/uploadMiddleware';

const router = Router();

// Public Routes (optionalAuth enables ?all=1 for admins)
router.get('/', optionalAuth, getCollections);

// Admin Routes
router.post('/', protect, admin, upload.single('image'), createCollection);
router.put('/:id', protect, admin, upload.single('image'), updateCollection);
router.put('/:id/pause', protect, admin, setCollectionPause);
router.delete('/:id', protect, admin, deleteCollection);

export default router;
