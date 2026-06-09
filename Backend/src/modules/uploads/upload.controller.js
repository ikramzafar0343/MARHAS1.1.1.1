import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/apiResponse.js';
import { mediaRepository } from '../media/media.repository.js';
import { STORAGE_PROVIDERS } from '../media/media.model.js';

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const createStorage = (folder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const destination = path.join(uploadRoot, folder);
      ensureDir(destination);
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    }
  });

const imageFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new AppError('Only JPEG, PNG, WebP, and GIF images are allowed', 400));
};

const videoFilter = (_req, file, cb) => {
  const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new AppError('Only MP4, WebM, and MOV videos are allowed', 400));
};

const documentFilter = (_req, file, cb) => {
  const allowed = ['application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new AppError('Only PDF documents are allowed', 400));
};

const createUploader = (folder, fileFilter) =>
  multer({
    storage: createStorage(folder),
    limits: { fileSize: env.UPLOAD_MAX_FILE_SIZE },
    fileFilter
  });

export const imageUpload = createUploader('images', imageFilter);
export const videoUpload = createUploader('videos', videoFilter);
export const documentUpload = createUploader('documents', documentFilter);

const saveMediaAsset = async (file, folder, userId) => {
  const url = `/uploads/${folder}/${file.filename}`;

  const asset = await mediaRepository.create({
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url,
    storageProvider: STORAGE_PROVIDERS.LOCAL,
    storageKey: path.join(folder, file.filename),
    folder,
    uploadedBy: userId
  });

  return asset;
};

const handleUpload =
  (folder) =>
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const asset = await saveMediaAsset(req.file, folder, req.user._id.toString());

    return successResponse(res, {
      message: 'File uploaded successfully',
      data: asset,
      statusCode: 201
    });
  });

export const uploadImage = handleUpload('images');
export const uploadVideo = handleUpload('videos');
export const uploadDocument = handleUpload('documents');

export const avatarUpload = multer({
  storage: createStorage('avatars'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter
});
