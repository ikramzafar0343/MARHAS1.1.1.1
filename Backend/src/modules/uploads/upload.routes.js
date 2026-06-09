import { Router } from 'express';
import {
  authenticate,
  authorizeAdmin,
  authorizePermission
} from '../../middlewares/auth.middleware.js';
import {
  imageUpload,
  videoUpload,
  documentUpload,
  uploadImage,
  uploadVideo,
  uploadDocument
} from './upload.controller.js';

const router = Router();

router.use(authenticate, authorizeAdmin, authorizePermission('MANAGE_PRODUCTS'));

router.post('/images', imageUpload.single('file'), uploadImage);
router.post('/videos', videoUpload.single('file'), uploadVideo);
router.post('/documents', documentUpload.single('file'), uploadDocument);

export default router;
