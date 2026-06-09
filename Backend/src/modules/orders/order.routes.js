import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import {
  checkoutSchema,
  myOrdersQuerySchema,
  orderNumberParam
} from './order.validator.js';
import * as orderController from './order.controller.js';

const router = Router();

router.post('/', optionalAuthenticate, validate(checkoutSchema), orderController.checkout);
router.get('/my', authenticate, validate(myOrdersQuerySchema, 'query'), orderController.getMyOrders);
router.get(
  '/:orderNumber',
  optionalAuthenticate,
  validate(orderNumberParam, 'params'),
  orderController.getOrderByNumber
);

export default router;
