import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import productRoutes from '../modules/products/product.routes.js';
import orderRoutes from '../modules/orders/order.routes.js';
import adminOrderRoutes from '../modules/orders/admin-order.routes.js';
import healthRoutes from '../modules/health/health.routes.js';
import newsletterRoutes from '../modules/newsletter/newsletter.routes.js';
import storefrontRoutes from '../modules/storefront/storefront.routes.js';
import inventoryRoutes from '../modules/inventory/inventory.routes.js';
import analyticsRoutes from '../modules/analytics/analytics.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import uploadRoutes from '../modules/uploads/upload.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/admin/orders', adminOrderRoutes);
router.use('/health', healthRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/content', storefrontRoutes);
router.use('/admin/inventory', inventoryRoutes);
router.use('/admin/analytics', analyticsRoutes);
router.use('/admin/dashboard', dashboardRoutes);
router.use('/uploads', uploadRoutes);

export default router;
