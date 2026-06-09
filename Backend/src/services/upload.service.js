import fs from 'node:fs/promises';
import path from 'node:path';
import crypto, { randomUUID } from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { STORAGE_PROVIDERS } from '../modules/media/media.model.js';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const ensureDirectory = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const resolveUploadRoot = () => path.resolve(process.cwd(), env.UPLOAD_DIR);

const buildStorageKey = (folder, filename) => path.posix.join(folder, filename);

class LocalStorageAdapter {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.provider = STORAGE_PROVIDERS.LOCAL;
  }

  async save({ buffer, filename, folder }) {
    const targetDir = path.join(this.rootDir, folder);
    await ensureDirectory(targetDir);

    const filePath = path.join(targetDir, filename);
    await fs.writeFile(filePath, buffer);

    return {
      url: `/uploads/${folder}/${filename}`,
      storageKey: buildStorageKey(folder, filename),
      storageProvider: this.provider
    };
  }

  async delete(storageKey) {
    if (!storageKey) {
      return false;
    }

    const filePath = path.join(this.rootDir, storageKey);
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }
}

class CloudinaryStorageAdapter {
  constructor() {
    this.provider = STORAGE_PROVIDERS.CLOUDINARY;
  }

  isConfigured() {
    return Boolean(
      env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
    );
  }

  async save({ buffer, filename, folder, mimeType }) {
    if (!this.isConfigured()) {
      throw new AppError('Cloudinary is not configured', 500);
    }

    const resourceType = mimeType?.startsWith('video/') ? 'video' : 'image';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    const publicId = filename.replace(/\.[^.]+$/, '');
    const cloudFolder = `marhas/${folder}`;
    const timestamp = Math.round(Date.now() / 1000);
    const signature = crypto
      .createHash('sha1')
      .update(`folder=${cloudFolder}&public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`)
      .digest('hex');

    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: mimeType }), filename);
    formData.append('folder', cloudFolder);
    formData.append('public_id', publicId);
    formData.append('api_key', env.CLOUDINARY_API_KEY);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error({ errorBody }, 'Cloudinary upload failed');
      throw new AppError('Cloudinary upload failed', 502);
    }

    const result = await response.json();
    return {
      url: result.secure_url,
      storageKey: result.public_id,
      storageProvider: this.provider,
      metadata: {
        version: result.version,
        format: result.format,
        bytes: result.bytes
      }
    };
  }

  async delete(storageKey) {
    if (!this.isConfigured() || !storageKey) {
      return false;
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signature = crypto
      .createHash('sha1')
      .update(`public_id=${storageKey}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`)
      .digest('hex');

    const destroyUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`;
    const formData = new FormData();
    formData.append('public_id', storageKey);
    formData.append('api_key', env.CLOUDINARY_API_KEY);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    const response = await fetch(destroyUrl, {
      method: 'POST',
      body: formData
    });

    return response.ok;
  }
}

class S3StorageAdapter {
  constructor() {
    this.provider = STORAGE_PROVIDERS.S3;
  }

  isConfigured() {
    return Boolean(
      env.AWS_REGION && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET
    );
  }

  async save({ buffer, filename, folder, mimeType }) {
    if (!this.isConfigured()) {
      throw new AppError('S3 is not configured', 500);
    }

    const key = buildStorageKey(folder, filename);

    throw new AppError(
      'S3 storage adapter is configured but requires @aws-sdk/client-s3 integration. Use STORAGE_PROVIDER=local or cloudinary.',
      501
    );
  }

  async delete(storageKey) {
    if (!this.isConfigured() || !storageKey) {
      return false;
    }

    const url = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${storageKey}`;
    const response = await fetch(url, { method: 'DELETE' });
    return response.ok;
  }
}

const createStorageAdapter = (provider, rootDir) => {
  switch (provider) {
    case STORAGE_PROVIDERS.CLOUDINARY:
      return new CloudinaryStorageAdapter();
    case STORAGE_PROVIDERS.S3:
      return new S3StorageAdapter();
    case STORAGE_PROVIDERS.LOCAL:
    default:
      return new LocalStorageAdapter(rootDir);
  }
};

const sanitizeFilename = (originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  const base = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

  return `${base || 'file'}-${randomUUID().slice(0, 8)}${ext}`;
};

const fileFilter = (allowedMimeTypes) => (_req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new AppError(`Unsupported file type: ${file.mimetype}`, 400));
};

export class UploadService {
  constructor(options = {}) {
    this.uploadRoot = options.uploadRoot ?? resolveUploadRoot();
    this.maxFileSize = options.maxFileSize ?? env.UPLOAD_MAX_FILE_SIZE;
    this.provider = options.provider ?? env.STORAGE_PROVIDER;
    this.adapter = options.adapter ?? createStorageAdapter(this.provider, this.uploadRoot);
  }

  getMulterStorage(folder = 'general') {
    const diskStorage = multer.diskStorage({
      destination: async (_req, _file, cb) => {
        try {
          const targetDir = path.join(this.uploadRoot, folder);
          await ensureDirectory(targetDir);
          cb(null, targetDir);
        } catch (error) {
          cb(error);
        }
      },
      filename: (_req, file, cb) => {
        cb(null, sanitizeFilename(file.originalname));
      }
    });

    return diskStorage;
  }

  createUploader({ folder = 'general', allowedMimeTypes = IMAGE_MIME_TYPES, maxCount = 10 } = {}) {
    return multer({
      storage: this.getMulterStorage(folder),
      limits: { fileSize: this.maxFileSize, files: maxCount },
      fileFilter: fileFilter(allowedMimeTypes)
    });
  }

  imageUploader(folder = 'images') {
    return this.createUploader({ folder, allowedMimeTypes: IMAGE_MIME_TYPES });
  }

  videoUploader(folder = 'videos') {
    return this.createUploader({
      folder,
      allowedMimeTypes: VIDEO_MIME_TYPES,
      maxCount: 3
    });
  }

  documentUploader(folder = 'documents') {
    return this.createUploader({
      folder,
      allowedMimeTypes: DOCUMENT_MIME_TYPES,
      maxCount: 5
    });
  }

  async saveFile(file, folder = 'general') {
    if (!file) {
      throw new AppError('No file provided', 400);
    }

    let buffer;
    if (file.buffer) {
      buffer = file.buffer;
    } else if (file.path) {
      buffer = await fs.readFile(file.path);
    } else {
      throw new AppError('Invalid file payload', 400);
    }

    const filename = sanitizeFilename(file.originalname);
    const result = await this.adapter.save({
      buffer,
      filename,
      folder,
      mimeType: file.mimetype
    });

    return {
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size ?? buffer.length,
      folder,
      ...result
    };
  }

  async saveFiles(files, folder = 'general') {
    const list = Array.isArray(files) ? files : [files];
    return Promise.all(list.map((file) => this.saveFile(file, folder)));
  }

  mapMulterFile(file, folder = 'general') {
    const filename = path.basename(file.path || file.filename);
    const storageKey = buildStorageKey(folder, filename);

    return {
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      folder,
      url: `/uploads/${storageKey}`,
      storageKey,
      storageProvider: STORAGE_PROVIDERS.LOCAL
    };
  }

  async deleteFile(storageKey, storageProvider = this.provider) {
    const adapter = createStorageAdapter(storageProvider, this.uploadRoot);
    return adapter.delete(storageKey);
  }

  async ensureUploadDirectories() {
    const folders = ['images', 'videos', 'documents', 'general'];
    await Promise.all(folders.map((folder) => ensureDirectory(path.join(this.uploadRoot, folder))));
  }
}

export const uploadService = new UploadService();

export { IMAGE_MIME_TYPES, VIDEO_MIME_TYPES, DOCUMENT_MIME_TYPES, sanitizeFilename };
