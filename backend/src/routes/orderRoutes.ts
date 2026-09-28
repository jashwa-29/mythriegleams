import { Router } from 'express';
import { addOrderItems, getOrderById, updateOrderStatus, markOrderPaidManually, getOrders, getMyOrders } from '../controllers/orderController';
import {
    createAdminCustomOrder,
    getAdminCustomOrder,
    getPublicOrderForPayment,
    createPublicRazorpayOrder,
    verifyPublicRazorpayPayment,
} from '../controllers/customOrderController';
import { reconcilePublicPayOrder } from '../controllers/webhookController';
import { createAdminOfflineOrder, getAdminOfflineOrders } from '../controllers/offlineOrderController';
import { protect, admin, optionalAuth } from '../middlewares/authMiddleware';

const router = Router();

// NOTE: these must stay above '/:id' so they are not swallowed by the id param route.
router.get('/public/pay/:id', getPublicOrderForPayment);
router.post('/public/pay/:id/razorpay/create', createPublicRazorpayOrder);
router.post('/public/pay/:id/razorpay/verify', verifyPublicRazorpayPayment);
router.post('/public/pay/:id/reconcile', reconcilePublicPayOrder);

// Admin — bespoke order with a shareable payment link
router.post('/admin/custom', protect, admin, createAdminCustomOrder);
router.get('/admin/custom/:id', protect, admin, getAdminCustomOrder);

// Admin — order taken over the phone/WhatsApp and paid outside the gateway
router.post('/admin/offline', protect, admin, createAdminOfflineOrder);
router.get('/admin/offline', protect, admin, getAdminOfflineOrders);

router.post('/',        optionalAuth, addOrderItems);    // Public (Guest) / Auth checkout
router.get('/',         protect, admin, getOrders);      // Admin list
router.get('/mine',     protect, getMyOrders);           // My orders
router.get('/:id',      optionalAuth, getOrderById);     // Tracking (Secure)
router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/paid', protect, admin, markOrderPaidManually);

export default router;
