import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate, authorizePermission } from '../../middlewares/auth.middleware.js';
import {
  adminOrdersQuerySchema,
  cancelOrderSchema,
  orderIdParamSchema,
  updateOrderSchema,
  updateOrderStatusSchema
} from './order.validator.js';
import * as orderController from './order.controller.js';

const router = Router();

router.use(authenticate, authorizePermission('MANAGE_ORDERS'));

router.get('/', validate(adminOrdersQuerySchema, 'query'), orderController.listAdminOrders);
router.get(
  '/:id',
  validate(orderIdParamSchema, 'params'),
  orderController.getAdminOrder
);
router.patch(
  '/:id',
  validate(orderIdParamSchema, 'params'),
  validate(updateOrderSchema),
  orderController.updateAdminOrder
);
router.patch(
  '/:id/status',
  validate(orderIdParamSchema, 'params'),
  validate(updateOrderStatusSchema),
  orderController.updateAdminOrderStatus
);
router.post(
  '/:id/cancel',
  validate(orderIdParamSchema, 'params'),
  validate(cancelOrderSchema),
  orderController.cancelAdminOrder
);

export default router;
