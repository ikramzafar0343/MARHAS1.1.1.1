import { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { normalizeProduct, softDeleteFilter } from '../../database/mapper.js';
import { PRODUCT_STATUS } from '../../constants/product.js';
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

const toOrderBy = (sort = { createdAt: -1 }) =>
  Object.entries(sort).map(([key, value]) => ({
    [key]: value === 1 || value === 'asc' ? 'asc' : 'desc'
  }));

export class ProductRepository {
  constructor(client = prisma) {
    this.db = client;
  }

  async create(data, options = {}) {
    const payload = { ...data };
    if (!payload.slug && payload.title) {
      payload.slug = slugify(payload.title);
    }
    if (payload.sku) payload.sku = payload.sku.toUpperCase().trim();
    if (payload.slug) payload.slug = payload.slug.toLowerCase().trim();
    if (options.updatedBy) {
      payload.updatedBy = options.updatedBy;
      payload.createdBy = options.updatedBy;
    }

    const product = await this.db.product.create({ data: payload });
    return normalizeProduct(product);
  }

  async findById(id, options = {}) {
    const product = await this.db.product.findFirst({
      where: { id, ...softDeleteFilter(options.includeDeleted) }
    });
    return normalizeProduct(product);
  }

  async findBySlug(slug, options = {}) {
    const product = await this.db.product.findFirst({
      where: {
        slug: slug.toLowerCase().trim(),
        ...softDeleteFilter(options.includeDeleted)
      }
    });
    return normalizeProduct(product);
  }

  async findBySku(sku, options = {}) {
    const product = await this.db.product.findFirst({
      where: {
        sku: sku.toUpperCase().trim(),
        ...softDeleteFilter(options.includeDeleted)
      }
    });
    return normalizeProduct(product);
  }

  async findByIds(ids) {
    const products = await this.db.product.findMany({
      where: { id: { in: ids }, deletedAt: null }
    });
    return products.map(normalizeProduct);
  }

  buildFilter({
    category,
    status = PRODUCT_STATUS.PUBLISHED,
    bestSeller,
    minPrice,
    maxPrice,
    stockStatus,
    includeDraft = false
  } = {}) {
    const where = { deletedAt: null };

    if (category) where.category = category;

    if (status) {
      where.status = status;
    } else if (!includeDraft) {
      where.status = PRODUCT_STATUS.PUBLISHED;
    }

    if (typeof bestSeller === 'boolean') where.bestSeller = bestSeller;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (stockStatus === 'in-stock') {
      where.stock = { gt: 0 };
    } else if (stockStatus === 'out-of-stock') {
      where.stock = { lte: 0 };
    } else if (stockStatus === 'low-stock') {
      where.AND = [
        { stock: { gt: 0 } },
        { stock: { lte: this.db.product.fields ? undefined : undefined } }
      ];
      // Prisma cannot compare two columns in where — use raw filter via AND in findPaginated
      where.__lowStock = true;
      delete where.AND;
    }

    return where;
  }

  async findPaginated({
    page = 1,
    limit = 20,
    filter = {},
    sort = { createdAt: -1 }
  } = {}) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (safePage - 1) * safeLimit;

    const where = { ...filter };
    const lowStock = where.__lowStock;
    delete where.__lowStock;
    delete where.$text;
    delete where.$or;
    delete where.$expr;

    if (lowStock) {
      const rows = await this.db.$queryRaw`
        SELECT id, title, slug, sku, category, price, "originalPrice", discount, "discountType",
               description, specifications, "returnPolicy", sizes, colors, variants, images,
               "bestSeller", stock, "lowStockThreshold", rating, "reviewCount", status,
               "deletedAt", "createdBy", "updatedBy", "createdAt", "updatedAt"
        FROM products
        WHERE "deletedAt" IS NULL
          AND stock > 0
          AND stock <= "lowStockThreshold"
          ${where.status ? Prisma.sql`AND status = ${where.status}::"ProductStatus"` : Prisma.empty}
        ORDER BY "createdAt" DESC
        LIMIT ${safeLimit} OFFSET ${skip}
      `;
      const totalRows = await this.db.$queryRaw`
        SELECT COUNT(*)::int AS count FROM products
        WHERE "deletedAt" IS NULL
          AND stock > 0
          AND stock <= "lowStockThreshold"
          ${where.status ? Prisma.sql`AND status = ${where.status}::"ProductStatus"` : Prisma.empty}
      `;
      const total = totalRows[0]?.count || 0;
      return {
        docs: rows.map(normalizeProduct),
        pagination: buildPagination(safePage, safeLimit, total)
      };
    }

    const [docs, total] = await Promise.all([
      this.db.product.findMany({
        where,
        orderBy: toOrderBy(sort),
        skip,
        take: safeLimit
      }),
      this.db.product.count({ where })
    ]);

    return {
      docs: docs.map(normalizeProduct),
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

    return this.findPaginated({
      page: options.page,
      limit: options.limit,
      filter,
      sort: options.sort || { createdAt: -1 }
    });
  }

  async findBestSellers({ page = 1, limit = 8 } = {}) {
    return this.findPaginated({
      page,
      limit,
      filter: {
        deletedAt: null,
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

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (safePage - 1) * safeLimit;

    const rows = await this.db.$queryRaw`
      SELECT id, title, slug, sku, category, price, "originalPrice", discount, "discountType",
             description, specifications, "returnPolicy", sizes, colors, variants, images,
             "bestSeller", stock, "lowStockThreshold", rating, "reviewCount", status,
             "deletedAt", "createdBy", "updatedBy", "createdAt", "updatedAt",
             ts_rank("searchVector", plainto_tsquery('english', ${trimmed})) AS rank
      FROM products
      WHERE "deletedAt" IS NULL
        AND status = 'published'::"ProductStatus"
        AND "searchVector" @@ plainto_tsquery('english', ${trimmed})
        ${category ? Prisma.sql`AND category = ${category}` : Prisma.empty}
      ORDER BY rank DESC, "createdAt" DESC
      LIMIT ${safeLimit} OFFSET ${skip}
    `;

    const countRows = await this.db.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM products
      WHERE "deletedAt" IS NULL
        AND status = 'published'::"ProductStatus"
        AND "searchVector" @@ plainto_tsquery('english', ${trimmed})
        ${category ? Prisma.sql`AND category = ${category}` : Prisma.empty}
    `;

    const total = countRows[0]?.count || 0;
    return {
      docs: rows.map(normalizeProduct),
      pagination: buildPagination(safePage, safeLimit, total)
    };
  }

  async updateById(id, data, options = {}) {
    const update = { ...data };
    if (update.title && !update.slug) {
      update.slug = slugify(update.title);
    }
    if (update.sku) update.sku = update.sku.toUpperCase().trim();
    if (update.slug) update.slug = update.slug.toLowerCase().trim();
    if (options.updatedBy) update.updatedBy = options.updatedBy;

    try {
      const product = await this.db.product.update({ where: { id }, data: update });
      return normalizeProduct(product);
    } catch {
      return null;
    }
  }

  async updateStock(id, stock, options = {}) {
    return this.updateById(id, { stock }, options);
  }

  async adjustStock(id, quantityDelta, options = {}) {
    const normalizedId = id?.id ?? id?._id ?? id;
    const product = await this.findById(normalizedId);
    if (!product) return null;

    const previousStock = product.stock;
    const newStock = Math.max(0, previousStock + quantityDelta);
    const saved = await this.updateStock(normalizedId, newStock, options);
    if (!saved) return null;
    return { product: saved, previousStock, newStock: saved.stock };
  }

  async softDeleteById(id, updatedBy = null) {
    return this.updateById(id, { deletedAt: new Date() }, { updatedBy });
  }

  async restoreById(id, updatedBy = null) {
    return this.updateById(id, { deletedAt: null }, { updatedBy });
  }

  async slugExists(slug, excludeId = null) {
    const count = await this.db.product.count({
      where: {
        slug: slug.toLowerCase().trim(),
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    });
    return count > 0;
  }

  async skuExists(sku, excludeId = null) {
    const count = await this.db.product.count({
      where: {
        sku: sku.toUpperCase().trim(),
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    });
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
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  async count(filter = {}) {
    const where = { deletedAt: null, ...filter };
    delete where.__lowStock;
    return this.db.product.count({ where });
  }
}

export const productRepository = new ProductRepository();
