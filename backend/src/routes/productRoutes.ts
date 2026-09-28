import { Router } from 'express';
import { getProducts, getProductBySlug, createProduct, deleteProduct, updateProduct } from '../controllers/productController';
import { protect, admin, optionalAuth } from '../middlewares/authMiddleware';
import upload from '../middlewares/uploadMiddleware';

const router = Router();

// Public Routes
// optionalAuth lets an admin preview paused products with ?includePaused=true without
// exposing them to shoppers (req.user stays undefined for anonymous visitors).
router.get('/', optionalAuth, getProducts);
router.get('/:slug', optionalAuth, getProductBySlug);

// Admin Routes
router.post('/', protect, admin, upload.array('images', 10), createProduct);
router.put('/:id', protect, admin, upload.array('images', 10), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;
