import { ProductRepository } from './product.repository.js';
import { DISCOUNT_TYPES, PRODUCT_STATUS } from './product.model.js';
import { AppError } from '../../utils/AppError.js';
import { uploadService } from '../../services/upload.service.js';
import { normalizeCategoryFilter, toFrontendCategory } from '../../constants/categoryMap.js';
import { createProductSchema, normalizeProductBody, updateProductSchema } from './product.validator.js';

const generateSku = (title) => {
  const base = title
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  const suffix = Date.now().toString(36).toUpperCase().slice(-4);
  return `MH-${base || 'PROD'}-${suffix}`;
};

const getEffectivePrice = (product) => {
  if (!product.discount || product.discount <= 0) {
    return product.price;
  }

  if (product.discountType === DISCOUNT_TYPES.FIXED) {
    return Math.max(0, product.price - product.discount);
  }

  return Math.max(0, product.price - (product.price * product.discount) / 100);
};

const serializeProduct = (product) => {
  const doc = product?.toObject ? product.toObject() : product;
  return {
    ...doc,
    category: toFrontendCategory(doc.category),
    effectivePrice: getEffectivePrice(doc)
  };
};

export class ProductService {
  constructor(productRepository = new ProductRepository()) {
    this.productRepository = productRepository;
  }

  mapUploadedImages(files = [], title = '') {
    return files.map((file, index) => {
      const mapped = uploadService.mapMulterFile(file, 'products');
      return {
        url: mapped.url,
        alt: title || mapped.originalName,
        order: index
      };
    });
  }

  async listProducts(query) {
    const filter = this.productRepository.buildFilter({
      category: normalizeCategoryFilter(query.category),
      status: query.status || PRODUCT_STATUS.PUBLISHED,
      bestSeller: query.bestSeller,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      stockStatus: query.stockStatus,
      includeDraft: Boolean(query.status)
    });

    const sortField = query.sort || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;
    const sort = query.search ? { score: { $meta: 'textScore' }, createdAt: -1 } : { [sortField]: sortOrder };

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const result = await this.productRepository.findPaginated({
      page: query.page,
      limit: query.limit,
      filter,
      sort
    });

    return {
      products: result.docs.map(serializeProduct),
      pagination: result.pagination
    };
  }

  async getBestSellers(query) {
    const result = await this.productRepository.findBestSellers({
      page: query.page,
      limit: query.limit
    });

    return {
      products: result.docs.map(serializeProduct),
      pagination: result.pagination
    };
  }

  async searchProducts(query) {
    const result = await this.productRepository.search(query.q, {
      page: query.page,
      limit: query.limit,
      category: query.category
    });

    return {
      products: result.docs.map(serializeProduct),
      pagination: result.pagination
    };
  }

  async getProductById(id) {
    const product = await this.productRepository.assertExists(id);

    if (product.status !== PRODUCT_STATUS.PUBLISHED) {
      throw new AppError('Product not found', 404);
    }

    return serializeProduct(product);
  }

  async createProduct(rawBody, files = [], userId = null) {
    const normalized = normalizeProductBody(rawBody);
    const parsed = createProductSchema.safeParse(normalized);

    if (!parsed.success) {
      throw new AppError('Validation failed', 400, parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      })));
    }

    const payload = { ...parsed.data };
    const uploadedImages = this.mapUploadedImages(files, payload.title);
    payload.images = [...uploadedImages, ...(payload.images || [])];

    if (!payload.sku) {
      payload.sku = generateSku(payload.title);
    }

    payload.sku = payload.sku.toUpperCase();

    if (await this.productRepository.skuExists(payload.sku)) {
      payload.sku = await this.generateUniqueSku(payload.title);
    }

    payload.slug = await this.productRepository.generateUniqueSlug(payload.title);

    if (payload.originalPrice === undefined || payload.originalPrice === null) {
      payload.originalPrice = payload.price;
    }

    const product = await this.productRepository.create(payload, { updatedBy: userId });
    return serializeProduct(product);
  }

  async updateProduct(id, rawBody, files = [], userId = null) {
    const existing = await this.productRepository.assertExists(id);
    const normalized = normalizeProductBody(rawBody);
    const parsed = updateProductSchema.safeParse(normalized);

    if (!parsed.success) {
      throw new AppError('Validation failed', 400, parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      })));
    }

    const payload = { ...parsed.data };
    const uploadedImages = this.mapUploadedImages(files, payload.title || existing.title);

    if (uploadedImages.length) {
      payload.images = [...(existing.images || []), ...uploadedImages];
    }

    if (payload.sku && payload.sku !== existing.sku) {
      if (await this.productRepository.skuExists(payload.sku, id)) {
        throw new AppError('SKU already exists', 409);
      }
      payload.sku = payload.sku.toUpperCase();
    }

    if (payload.title && !payload.slug) {
      payload.slug = await this.productRepository.generateUniqueSlug(payload.title, id);
    }

    const product = await this.productRepository.updateById(id, payload, { updatedBy: userId });
    return serializeProduct(product);
  }

  async deleteProduct(id, userId = null) {
    const product = await this.productRepository.softDeleteById(id, userId);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return { id: product._id, deleted: true };
  }

  async generateUniqueSku(title) {
    let sku = generateSku(title);
    let attempts = 0;

    while (await this.productRepository.skuExists(sku) && attempts < 5) {
      sku = generateSku(title);
      attempts += 1;
    }

    if (await this.productRepository.skuExists(sku)) {
      throw new AppError('Unable to generate unique SKU', 500);
    }

    return sku;
  }
}

export const productService = new ProductService();
