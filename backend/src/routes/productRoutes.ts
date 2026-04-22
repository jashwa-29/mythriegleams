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
