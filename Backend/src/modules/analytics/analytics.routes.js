import { Router } from 'express';
import { z } from 'zod';
import {
  authenticate,
  authorizeAdmin,
  authorizePermission
} from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  getKpis,
  getRevenueChart,
  getOrdersChart,
  getCategoryBreakdown,
  getTopProducts
} from './analytics.controller.js';

const periodSchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
  limit: z.coerce.number().int().min(1).max(20).default(5)
});

const router = Router();

router.use(authenticate, authorizeAdmin, authorizePermission('VIEW_ANALYTICS'));

router.get('/kpis', validate(periodSchema, 'query'), getKpis);
router.get('/revenue', validate(periodSchema, 'query'), getRevenueChart);
router.get('/orders', validate(periodSchema, 'query'), getOrdersChart);
router.get('/categories', validate(periodSchema, 'query'), getCategoryBreakdown);
router.get('/top-products', validate(periodSchema, 'query'), getTopProducts);

export default router;
