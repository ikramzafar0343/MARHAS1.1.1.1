import { StorefrontContent } from './storefront.model.js';
import { AppError } from '../../utils/AppError.js';

export class StorefrontRepository {
  constructor(model = StorefrontContent) {
    this.model = model;
  }

  normalizeCollectionHeroes(data) {
    if (!data?.collectionHeroes) {
      return data;
    }

    const heroes = data.collectionHeroes;

    if (heroes instanceof Map) {
      return {
        ...data,
        collectionHeroes: Object.fromEntries(heroes)
      };
    }

    return {
      ...data,
      collectionHeroes: { ...heroes }
    };
  }

  async create(data, options = {}) {
    const payload = this.normalizeCollectionHeroes({ ...data });

    if (options.updatedBy) {
      payload.updatedBy = options.updatedBy;
    }

    const doc = new this.model(payload);
    return doc.save();
  }

  async findByKey(key = 'default', options = {}) {
    let query = this.model.findOne({ key: key.toLowerCase().trim() });

    if (options.includeDeleted) {
      query = query.setOptions({ includeDeleted: true });
    }
    if (options.lean) {
      query = query.lean();
    }

    return query.exec();
  }

  async findPublished(key = 'default') {
    return this.model
      .findOne({
        key: key.toLowerCase().trim(),
        isPublished: true
      })
      .lean()
      .exec();
  }

  async findById(id, options = {}) {
    let query = this.model.findById(id);

    if (options.includeDeleted) {
      query = query.setOptions({ includeDeleted: true });
    }

    return query.exec();
  }

  async upsertByKey(key, data, options = {}) {
    const normalizedKey = key.toLowerCase().trim();
    const payload = this.normalizeCollectionHeroes({ ...data, key: normalizedKey });

    if (options.updatedBy) {
      payload.updatedBy = options.updatedBy;
    }

    if (payload.isPublished) {
      payload.publishedAt = new Date();
    }

    return this.model
      .findOneAndUpdate({ key: normalizedKey }, payload, {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        lean: true
      })
      .exec();
  }

  async updateByKey(key, data, options = {}) {
    const payload = this.normalizeCollectionHeroes({ ...data });

    if (options.updatedBy) {
      payload.updatedBy = options.updatedBy;
    }

    if (payload.isPublished === true) {
      payload.publishedAt = new Date();
    }

    return this.model
      .findOneAndUpdate({ key: key.toLowerCase().trim() }, payload, {
        new: true,
        runValidators: true
      })
      .exec();
  }

  async publish(key = 'default', updatedBy = null) {
    const update = { isPublished: true, publishedAt: new Date() };
    if (updatedBy) {
      update.updatedBy = updatedBy;
    }

    return this.model
      .findOneAndUpdate({ key: key.toLowerCase().trim() }, update, {
        new: true,
        runValidators: true
      })
      .exec();
  }

  async unpublish(key = 'default', updatedBy = null) {
    const update = { isPublished: false };
    if (updatedBy) {
      update.updatedBy = updatedBy;
    }

    return this.model
      .findOneAndUpdate({ key: key.toLowerCase().trim() }, update, {
        new: true,
        runValidators: true
      })
      .exec();
  }

  async resetToDefaults(defaults, options = {}) {
    const key = (options.key || 'default').toLowerCase().trim();
    const payload = this.normalizeCollectionHeroes({
      ...defaults,
      key,
      isPublished: options.isPublished ?? false,
      updatedBy: options.updatedBy ?? null
    });

    return this.model
      .findOneAndUpdate({ key }, payload, {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        lean: true
      })
      .exec();
  }

  async softDeleteByKey(key, updatedBy = null) {
    const doc = await this.findByKey(key);
    if (!doc) {
      return null;
    }
    return doc.softDelete(updatedBy);
  }

  async assertByKey(key) {
    const doc = await this.findByKey(key);
    if (!doc) {
      throw new AppError('Storefront content not found', 404);
    }
    return doc;
  }
}

export const storefrontRepository = new StorefrontRepository();
