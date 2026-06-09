import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware.js';
import { uploadService } from '../../services/upload.service.js';
import {
  productIdParamSchema,
  productListQuerySchema,
  productSearchQuerySchema
} from './product.validator.js';
import * as productController from './product.controller.js';

const router = Router();
const productImageUpload = uploadService.imageUploader('products').array('images', 5);

router.get('/', validate(productListQuerySchema, 'query'), productController.listProducts);
router.get(
  '/best-sellers',
  validate(productListQuerySchema, 'query'),
  productController.getBestSellers
);
router.get(
  '/search',
  validate(productSearchQuerySchema, 'query'),
  productController.searchProducts
);
router.get(
  '/:id',
  validate(productIdParamSchema, 'params'),
  productController.getProduct
);
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  productImageUpload,
  productController.createProduct
);
router.patch(
  '/:id',
  authenticate,
  authorizeAdmin,
  validate(productIdParamSchema, 'params'),
  productImageUpload,
  productController.updateProduct
);
router.delete(
  '/:id',
  authenticate,
  authorizeAdmin,
  validate(productIdParamSchema, 'params'),
  productController.deleteProduct
);

export default router;
