import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware.js';
import { getMetrics, getRecentOrders } from './dashboard.controller.js';

const router = Router();

router.use(authenticate, authorizeAdmin);

router.get('/metrics', getMetrics);
router.get('/recent-orders', getRecentOrders);

export default router;
