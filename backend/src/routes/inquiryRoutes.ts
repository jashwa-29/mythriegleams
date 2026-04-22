import { Router } from 'express';
import { createInquiry, getInquiries, updateInquiryStatus } from '../controllers/inquiryController';
import upload from '../middlewares/uploadMiddleware';
import { protect, admin } from '../middlewares/authMiddleware';

const router = Router();

// Public Routes
router.post('/', upload.single('image'), createInquiry); // Submit inquiry with image

// Admin Routes
router.get('/', protect, admin, getInquiries); // Admin list
router.put('/:id/status', protect, admin, updateInquiryStatus); // Update status (Admin)

export default router;
