import { Router } from 'express';
import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/paymentController';
import { razorpayWebhook, reconcileRazorpayOrder } from '../controllers/webhookController';
import { protect, optionalAuth } from '../middlewares/authMiddleware';

const router = Router();

// Routes
router.post('/razorpay/create', createRazorpayOrder); // Public/Guest (as guest orders are allowed)
router.post('/razorpay/verify', verifyRazorpayPayment); // Public/Guest

// Server-to-server confirmation. Registered in Razorpay Dashboard -> Settings -> Webhooks as
// https://<your-domain>/api/payments/razorpay/webhook with the same secret as
// RAZORPAY_WEBHOOK_SECRET. This is the path that saves a payment when the customer's browser dies.
router.post('/razorpay/webhook', razorpayWebhook);

// Recovery path: re-asks Razorpay about an order. Owner, admin, or payment-token holder only.
router.post('/razorpay/check/:orderId', optionalAuth, reconcileRazorpayOrder);

export default router;
