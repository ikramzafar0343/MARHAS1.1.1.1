import { prisma } from '../../database/prisma.js';
import { toEntity, softDeleteFilter } from '../../database/mapper.js';
import { AppError } from '../../utils/AppError.js';

const mapMedia = (row) => toEntity(row);

const toOrderBy = (sort = { createdAt: -1 }) =>
  Object.entries(sort).map(([key, value]) => ({
    [key]: value === 1 || value === 'asc' ? 'asc' : 'desc'
  }));

export class MediaRepository {
  constructor(client = prisma) {
    this.db = client;
  }

  async create(data) {
    const asset = await this.db.mediaAsset.create({ data });
    return mapMedia(asset);
  }

  async findById(id, options = {}) {
    const asset = await this.db.mediaAsset.findFirst({
      where: { id, ...softDeleteFilter(options.includeDeleted) }
    });
    return mapMedia(asset);
  }

  async findByFilename(filename, options = {}) {
    const asset = await this.db.mediaAsset.findFirst({
      where: { filename, ...softDeleteFilter(options.includeDeleted) }
    });
    return mapMedia(asset);
  }

  async findByStorageKey(storageKey) {
    const asset = await this.db.mediaAsset.findFirst({
      where: { storageKey, deletedAt: null }
    });
    return mapMedia(asset);
  }

  async findPaginated({ page = 1, limit = 30, filter = {}, sort = { createdAt: -1 } } = {}) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (safePage - 1) * safeLimit;
    const where = { deletedAt: null, ...filter };

    const [docs, total] = await Promise.all([
      this.db.mediaAsset.findMany({
        where,
        orderBy: toOrderBy(sort),
        skip,
        take: safeLimit
      }),
      this.db.mediaAsset.count({ where })
    ]);

    return {
      docs: docs.map(mapMedia),
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
    return this.findPaginated({
      page: options.page,
      limit: options.limit,
      filter: { mimeType: { startsWith: prefix } }
    });
  }

  async updateById(id, data) {
    try {
      const asset = await this.db.mediaAsset.update({ where: { id }, data });
      return mapMedia(asset);
    } catch {
      return null;
    }
  }

  async softDeleteById(id) {
    return this.updateById(id, { deletedAt: new Date() });
  }

  async restoreById(id) {
    return this.updateById(id, { deletedAt: null });
  }

  async assertExists(id) {
    const asset = await this.findById(id);
    if (!asset) throw new AppError('Media asset not found', 404);
    return asset;
  }

  async totalStorageUsed() {
    const result = await this.db.mediaAsset.aggregate({
      where: { deletedAt: null },
      _sum: { size: true },
      _count: { _all: true }
    });
    return {
      totalBytes: result._sum.size || 0,
      count: result._count._all
    };
  }
}

export const mediaRepository = new MediaRepository();
