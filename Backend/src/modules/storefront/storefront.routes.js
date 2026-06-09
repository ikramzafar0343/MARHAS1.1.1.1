import { Router } from 'express';
import {
  authenticate,
  authorizeAdmin,
  authorizePermission
} from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  getPublicStorefront,
  getAdminStorefront,
  updateStorefront,
  resetStorefront
} from './storefront.controller.js';
import { updateStorefrontSchema } from './storefront.validator.js';

const router = Router();

router.get('/storefront', getPublicStorefront);

router.get('/admin/storefront', authenticate, authorizeAdmin, getAdminStorefront);
router.put(
  '/admin/storefront',
  authenticate,
  authorizeAdmin,
  authorizePermission('MANAGE_CMS'),
  validate(updateStorefrontSchema),
  updateStorefront
);
router.post(
  '/admin/storefront/reset',
  authenticate,
  authorizeAdmin,
  authorizePermission('RESET_CMS'),
  resetStorefront
);

export default router;
