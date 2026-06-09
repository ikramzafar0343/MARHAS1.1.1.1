import { Product, PRODUCT_STATUS } from './product.model.js';
import { AppError } from '../../utils/AppError.js';

const slugify = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 0,
  hasNext: page * limit < total,
  hasPrev: page > 1
});

export class ProductRepository {
  constructor(model = Product) {
    this.model = model;
  }

  async create(data, options = {}) {
    const payload = { ...data };

    if (!payload.slug && payload.title) {
      payload.slug = slugify(payload.title);
    }

    if (options.updatedBy) {
      payload.updatedBy = options.updatedBy;
    }

    const product = new this.model(payload);
    return product.save();
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

  async findBySlug(slug, options = {}) {
    let query = this.model.findOne({ slug: slug.toLowerCase().trim() });

    if (options.includeDeleted) {
      query = query.setOptions({ includeDeleted: true });
    }
    if (options.lean) {
      query = query.lean();
    }

    return query.exec();
  }

  async findBySku(sku, options = {}) {
    let query = this.model.findOne({ sku: sku.toUpperCase().trim() });

    if (options.includeDeleted) {
      query = query.setOptions({ includeDeleted: true });
    }

    return query.exec();
  }

  async findByIds(ids, options = {}) {
    let query = this.model.find({ _id: { $in: ids } });

    if (options.lean) {
      query = query.lean();
    }

    return query.exec();
  }

  buildFilter({
    category,
    status = PRODUCT_STATUS.PUBLISHED,
    bestSeller,
    minPrice,
    maxPrice,
    stockStatus,
    search,
    includeDraft = false
  } = {}) {
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = includeDraft ? status : status;
    } else if (!includeDraft) {
      filter.status = PRODUCT_STATUS.PUBLISHED;
    }

    if (typeof bestSeller === 'boolean') {
      filter.bestSeller = bestSeller;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) {
        filter.price.$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        filter.price.$lte = maxPrice;
      }
    }

    if (stockStatus === 'in-stock') {
      filter.stock = { $gt: 0 };
    } else if (stockStatus === 'out-of-stock') {
      filter.stock = { $lte: 0 };
    } else if (stockStatus === 'low-stock') {
      filter.$expr = {
        $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }]
      };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    return filter;
  }

  async findPaginated({
    page = 1,
    limit = 20,
    filter = {},
    sort = { createdAt: -1 },
    lean = true
  } = {}) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (safePage - 1) * safeLimit;

    let query = this.model.find(filter).sort(sort).skip(skip).limit(safeLimit);
    if (lean) {
      query = query.lean();
    }

    const [docs, total] = await Promise.all([query.exec(), this.model.countDocuments(filter)]);

    return {
      docs,
      pagination: buildPagination(safePage, safeLimit, total)
    };
  }

  async findPublished(options = {}) {
    const filter = this.buildFilter({
      category: options.category,
      bestSeller: options.bestSeller,
      minPrice: options.minPrice,
      maxPrice: options.maxPrice,
      stockStatus: options.stockStatus
    });

    const sort = options.sort || { createdAt: -1 };

    return this.findPaginated({
      page: options.page,
      limit: options.limit,
      filter,
      sort
    });
  }

  async findBestSellers({ page = 1, limit = 8 } = {}) {
    return this.findPaginated({
      page,
      limit,
      filter: {
        status: PRODUCT_STATUS.PUBLISHED,
        bestSeller: true
      },
      sort: { createdAt: -1 }
    });
  }

  async search(query, { page = 1, limit = 20, category } = {}) {
    const trimmed = query?.trim();
    if (!trimmed) {
      return this.findPublished({ page, limit, category });
    }

    const filter = this.buildFilter({ category, search: trimmed });

    try {
      return this.findPaginated({
        page,
        limit,
        filter,
        sort: { score: { $meta: 'textScore' }, createdAt: -1 }
      });
    } catch {
      const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      delete filter.$text;
      filter.$or = [{ title: regex }, { sku: regex }, { 'description.intro': regex }];

      return this.findPaginated({
        page,
        limit,
        filter,
        sort: { createdAt: -1 }
      });
    }
  }

  async updateById(id, data, options = {}) {
    const update = { ...data };

    if (update.title && !update.slug) {
      update.slug = slugify(update.title);
    }

    if (options.updatedBy) {
      update.updatedBy = options.updatedBy;
    }

    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  async updateStock(id, stock, options = {}) {
    const update = { stock };
    if (options.updatedBy) {
      update.updatedBy = options.updatedBy;
    }

    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  async adjustStock(id, quantityDelta, options = {}) {
    const normalizedId = id?._id ?? id;
    const product = await this.findById(normalizedId, { lean: true });
    if (!product) {
      return null;
    }

    const previousStock = product.stock;
    const newStock = Math.max(0, previousStock + quantityDelta);
    const update = { stock: newStock };
    if (options.updatedBy) {
      update.updatedBy = options.updatedBy;
    }

    const saved = await this.model
      .findByIdAndUpdate(normalizedId, update, { new: true, runValidators: false })
      .exec();

    if (!saved) {
      return null;
    }

    return { product: saved, previousStock, newStock: saved.stock };
  }

  async softDeleteById(id, updatedBy = null) {
    const product = await this.findById(id);
    if (!product) {
      return null;
    }
    return product.softDelete(updatedBy);
  }

  async restoreById(id, updatedBy = null) {
    const product = await this.model
      .findById(id)
      .setOptions({ includeDeleted: true })
      .exec();
    if (!product) {
      return null;
    }
    return product.restore(updatedBy);
  }

  async slugExists(slug, excludeId = null) {
    const filter = { slug: slug.toLowerCase().trim() };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const count = await this.model.countDocuments(filter);
    return count > 0;
  }

  async skuExists(sku, excludeId = null) {
    const filter = { sku: sku.toUpperCase().trim() };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const count = await this.model.countDocuments(filter);
    return count > 0;
  }

  async generateUniqueSlug(title, excludeId = null) {
    let baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;

    while (await this.slugExists(slug, excludeId)) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    return slug;
  }

  async assertExists(id) {
    const product = await this.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }
}

export const productRepository = new ProductRepository();
