import { Router } from 'express';
import { addOrderItems, getOrderById, updateOrderStatus, getOrders, getMyOrders } from '../controllers/orderController';
import { protect, admin, optionalAuth } from '../middlewares/authMiddleware';

const router = Router();

router.post('/',        optionalAuth, addOrderItems);    // Public (Guest) / Auth checkout
router.get('/',         protect, admin, getOrders);      // Admin list
router.get('/mine',     protect, getMyOrders);           // My orders
router.get('/:id',      optionalAuth, getOrderById);     // Tracking (Secure)
router.put('/:id/status', protect, admin, updateOrderStatus);

export default router;
