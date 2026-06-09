import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  adminLoginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  revokeSessionSchema,
  verifyEmailParamsSchema
} from './auth.validator.js';
import * as authController from './auth.controller.js';
import { avatarUpload } from '../uploads/upload.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/admin/login', validate(adminLoginSchema), authController.adminLogin);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);
router.get(
  '/verify-email/:token',
  validate(verifyEmailParamsSchema, 'params'),
  authController.verifyEmail
);
router.post('/resend-verification', authenticate, authController.resendVerification);
router.get('/me', authenticate, authController.getMe);
router.post('/me/avatar', authenticate, avatarUpload.single('file'), authController.uploadAvatar);
router.get('/sessions', authenticate, authController.getSessions);
router.delete(
  '/sessions',
  authenticate,
  validate(revokeSessionSchema),
  authController.revokeSession
);
router.delete('/sessions/all', authenticate, authController.revokeAllSessions);

export default router;
