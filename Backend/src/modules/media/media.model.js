import mongoose from 'mongoose';
import { auditFields, applySoftDelete } from '../../database/plugins/auditPlugin.js';

export const STORAGE_PROVIDERS = {
  LOCAL: 'local',
  CLOUDINARY: 'cloudinary',
  S3: 's3'
};

const mediaSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true
    },
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    mimeType: {
      type: String,
      required: true,
      trim: true
    },
    size: {
      type: Number,
      required: true,
      min: [0, 'File size cannot be negative']
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    storageProvider: {
      type: String,
      enum: Object.values(STORAGE_PROVIDERS),
      default: STORAGE_PROVIDERS.LOCAL
    },
    storageKey: {
      type: String,
      trim: true,
      default: null
    },
    folder: {
      type: String,
      trim: true,
      default: 'general'
    },
    uploadedBy: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    ...auditFields
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

mediaSchema.index({ filename: 1 });
mediaSchema.index({ storageProvider: 1, createdAt: -1 });
mediaSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaSchema.index({ folder: 1, createdAt: -1 });
mediaSchema.index({ mimeType: 1, deletedAt: 1 });

applySoftDelete(mediaSchema);

export const MediaAsset =
  mongoose.models.MediaAsset || mongoose.model('MediaAsset', mediaSchema, 'media_assets');
