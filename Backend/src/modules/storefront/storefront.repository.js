import { prisma } from '../../database/prisma.js';
import { toEntity, softDeleteFilter } from '../../database/mapper.js';
import { AppError } from '../../utils/AppError.js';

const mapStorefront = (row) => {
  if (!row) return null;
  return toEntity(row);
};

export class StorefrontRepository {
  constructor(client = prisma) {
    this.db = client;
  }

  normalizeCollectionHeroes(data) {
    if (!data?.collectionHeroes) return data;
    const heroes = data.collectionHeroes;
    if (heroes instanceof Map) {
      return { ...data, collectionHeroes: Object.fromEntries(heroes) };
    }
    return { ...data, collectionHeroes: { ...heroes } };
  }

  async create(data, options = {}) {
    const payload = this.normalizeCollectionHeroes({ ...data });
    if (options.updatedBy) {
      payload.updatedBy = options.updatedBy;
      payload.createdBy = options.updatedBy;
    }
    const doc = await this.db.storefrontContent.create({ data: payload });
    return mapStorefront(doc);
  }

  async findByKey(key = 'default', options = {}) {
    const doc = await this.db.storefrontContent.findFirst({
      where: {
        key: key.toLowerCase().trim(),
        ...softDeleteFilter(options.includeDeleted)
      }
    });
    return mapStorefront(doc);
  }

  async findPublished(key = 'default') {
    const doc = await this.db.storefrontContent.findFirst({
      where: {
        key: key.toLowerCase().trim(),
        isPublished: true,
        deletedAt: null
      }
    });
    return mapStorefront(doc);
  }

  async findById(id, options = {}) {
    const doc = await this.db.storefrontContent.findFirst({
      where: { id, ...softDeleteFilter(options.includeDeleted) }
    });
    return mapStorefront(doc);
  }

  async upsertByKey(key, data, options = {}) {
    const normalizedKey = key.toLowerCase().trim();
    const payload = this.normalizeCollectionHeroes({ ...data, key: normalizedKey });
    if (options.updatedBy) payload.updatedBy = options.updatedBy;
    if (payload.isPublished) payload.publishedAt = new Date();

    const existing = await this.findByKey(normalizedKey, { includeDeleted: true });
    if (existing) {
      const updated = await this.db.storefrontContent.update({
        where: { id: existing.id },
        data: { ...payload, deletedAt: null }
      });
      return mapStorefront(updated);
    }

    const created = await this.db.storefrontContent.create({
      data: {
        ...payload,
        createdBy: options.updatedBy ?? null
      }
    });
    return mapStorefront(created);
  }

  async updateByKey(key, data, options = {}) {
    const payload = this.normalizeCollectionHeroes({ ...data });
    if (options.updatedBy) payload.updatedBy = options.updatedBy;
    if (payload.isPublished === true) payload.publishedAt = new Date();

    const existing = await this.findByKey(key);
    if (!existing) return null;

    const updated = await this.db.storefrontContent.update({
      where: { id: existing.id },
      data: payload
    });
    return mapStorefront(updated);
  }

  async publish(key = 'default', updatedBy = null) {
    return this.updateByKey(key, { isPublished: true, publishedAt: new Date() }, { updatedBy });
  }

  async unpublish(key = 'default', updatedBy = null) {
    return this.updateByKey(key, { isPublished: false }, { updatedBy });
  }

  async resetToDefaults(defaults, { key = 'default', isPublished = true, updatedBy = null } = {}) {
    return this.upsertByKey(
      key,
      {
        ...defaults,
        key,
        isPublished,
        publishedAt: isPublished ? new Date() : null
      },
      { updatedBy }
    );
  }

  async softDeleteByKey(key, updatedBy = null) {
    return this.updateByKey(key, { deletedAt: new Date() }, { updatedBy });
  }

  async assertByKey(key = 'default') {
    const doc = await this.findByKey(key);
    if (!doc) throw new AppError('Storefront content not found', 404);
    return doc;
  }
}

export const storefrontRepository = new StorefrontRepository();
