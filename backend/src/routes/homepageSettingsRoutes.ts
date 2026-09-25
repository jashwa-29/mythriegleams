import { Router } from 'express';
import { getHomepageSettings, updateHomepageSettings } from '../controllers/homepageSettingsController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getHomepageSettings);
router.put('/', protect, admin, updateHomepageSettings);

export default router;
