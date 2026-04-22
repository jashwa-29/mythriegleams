import { Router } from 'express';
import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/paymentController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Routes
router.post('/razorpay/create', createRazorpayOrder); // Public/Guest (as guest orders are allowed)
router.post('/razorpay/verify', verifyRazorpayPayment); // Public/Guest

export default router;
