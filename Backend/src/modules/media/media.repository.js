import { MediaAsset, STORAGE_PROVIDERS } from './media.model.js';
import { AppError } from '../../utils/AppError.js';

export class MediaRepository {
  constructor(model = MediaAsset) {
    this.model = model;
  }

  async create(data) {
    const asset = new this.model(data);
    return asset.save();
  }

  async findById(id, options = {}) {
    let query = this.model.findById(id);

    if (options.includeDeleted) {
      query = query.setOptions({ includeDeleted: true });
    }
    if (options.lean) {
      query = query.lean();
    }

    return query.exec();
  }

  async findByFilename(filename, options = {}) {
    let query = this.model.findOne({ filename });

    if (options.includeDeleted) {
      query = query.setOptions({ includeDeleted: true });
    }

    return query.exec();
  }

  async findByStorageKey(storageKey) {
    return this.model.findOne({ storageKey }).exec();
  }

  async findPaginated({
    page = 1,
    limit = 30,
    filter = {},
    sort = { createdAt: -1 }
  } = {}) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (safePage - 1) * safeLimit;

    const [docs, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(safeLimit).lean(),
      this.model.countDocuments(filter)
    ]);

    return {
      docs,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 0,
        hasNext: safePage * safeLimit < total,
        hasPrev: safePage > 1
      }
    };
  }

  async findByFolder(folder, options = {}) {
    return this.findPaginated({
      page: options.page,
      limit: options.limit,
      filter: { folder }
    });
  }

  async findByUploader(uploadedBy, options = {}) {
    return this.findPaginated({
      page: options.page,
      limit: options.limit,
      filter: { uploadedBy }
    });
  }

  async findByMimeTypePrefix(prefix, options = {}) {
    const regex = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    return this.findPaginated({
      page: options.page,
      limit: options.limit,
      filter: { mimeType: regex }
    });
  }

  async updateById(id, data) {
    return this.model
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .exec();
  }

  async softDeleteById(id) {
    const asset = await this.findById(id);
    if (!asset) {
      return null;
    }
    return asset.softDelete();
  }

  async restoreById(id) {
    const asset = await this.model
      .findById(id)
      .setOptions({ includeDeleted: true })
      .exec();
    if (!asset) {
      return null;
    }
    return asset.restore();
  }

  async assertExists(id) {
    const asset = await this.findById(id);
    if (!asset) {
      throw new AppError('Media asset not found', 404);
    }
    return asset;
  }

  async totalStorageUsed(filter = {}) {
    const [result] = await this.model.aggregate([
      { $match: { ...filter, deletedAt: null } },
      { $group: { _id: null, totalBytes: { $sum: '$size' }, count: { $sum: 1 } } }
    ]);

    return {
      totalBytes: result?.totalBytes ?? 0,
      count: result?.count ?? 0
    };
  }
}

export { STORAGE_PROVIDERS };
export const mediaRepository = new MediaRepository();
