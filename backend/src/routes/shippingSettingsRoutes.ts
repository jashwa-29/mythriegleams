import { Router } from 'express';
import { getShippingSettingsConfig, updateShippingSettingsConfig } from '../controllers/shippingSettingsController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getShippingSettingsConfig);
router.put('/', protect, admin, updateShippingSettingsConfig);

export default router;
