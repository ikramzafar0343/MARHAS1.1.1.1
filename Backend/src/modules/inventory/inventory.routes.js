import { Router } from 'express';
import { authenticate, authorizeAdmin, authorizePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  listInventory,
  getInventoryItem,
  updateInventory,
  updateStock,
  restockItem,
  deleteInventoryItem
} from './inventory.controller.js';
import {
  listInventorySchema,
  updateInventorySchema,
  updateStockSchema,
  restockSchema,
  uuidParamSchema
} from './inventory.validator.js';

const router = Router();

router.use(authenticate, authorizeAdmin);

router.get('/', validate(listInventorySchema, 'query'), listInventory);
router.get('/:id', validate(uuidParamSchema, 'params'), getInventoryItem);
router.patch(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateInventorySchema),
  authorizePermission('MANAGE_INVENTORY'),
  updateInventory
);
router.patch(
  '/:id/stock',
  validate(uuidParamSchema, 'params'),
  validate(updateStockSchema),
  authorizePermission('MANAGE_INVENTORY'),
  updateStock
);
router.post(
  '/:id/restock',
  validate(uuidParamSchema, 'params'),
  validate(restockSchema),
  authorizePermission('MANAGE_INVENTORY'),
  restockItem
);
router.delete(
  '/:id',
  validate(uuidParamSchema, 'params'),
  authorizePermission('MANAGE_INVENTORY'),
  deleteInventoryItem
);

export default router;
