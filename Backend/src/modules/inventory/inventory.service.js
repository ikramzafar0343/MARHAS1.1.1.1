import { productRepository } from '../products/product.repository.js';
import { restockRepository } from '../restock/restock.repository.js';
import { AppError } from '../../utils/AppError.js';

const getInventoryStatus = (stock, threshold = 10) => {
  if (stock <= 0) {
    return 'out-of-stock';
  }
  if (stock <= threshold) {
    return 'low-stock';
  }
  return 'in-stock';
};

const toInventoryItem = (product) => ({
  id: product._id,
  name: product.title,
  sku: product.sku,
  category: product.category,
  stock: product.stock,
  price: product.price,
  lowStockThreshold: product.lowStockThreshold,
  image: product.images?.[0]?.url || null,
  status: getInventoryStatus(product.stock, product.lowStockThreshold),
  updatedAt: product.updatedAt
});

export class InventoryService {
  constructor(products = productRepository, restocks = restockRepository) {
    this.products = products;
    this.restocks = restocks;
  }

  async listInventory(query = {}) {
    const filter = this.products.buildFilter({
      includeDraft: true,
      stockStatus: query.filter === 'all' ? undefined : query.filter,
      search: query.search
    });

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    } else {
      delete filter.status;
    }

    const sortField = query.sort || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    const result = await this.products.findPaginated({
      page: query.page,
      limit: query.limit,
      filter,
      sort: { [sortField]: sortOrder }
    });

    return {
      items: result.docs.map(toInventoryItem),
      pagination: result.pagination
    };
  }

  async getInventoryItem(id) {
    const product = await this.products.assertExists(id);
    const restockHistory = await this.restocks.findByProduct(id, { limit: 10 });

    return {
      item: toInventoryItem(product.toObject ? product.toObject() : product),
      restockHistory
    };
  }

  async updateInventory(id, data, userId) {
    const product = await this.products.assertExists(id);

    const updates = {};
    if (data.sku !== undefined) {
      const normalizedSku = data.sku.toUpperCase().trim();
      if (normalizedSku !== product.sku && (await this.products.skuExists(normalizedSku, id))) {
        throw new AppError('SKU already exists', 409);
      }
      updates.sku = normalizedSku;
    }
    if (data.lowStockThreshold !== undefined) {
      updates.lowStockThreshold = data.lowStockThreshold;
    }
    if (data.title !== undefined) {
      updates.title = data.title;
    }
    if (data.category !== undefined) {
      updates.category = data.category;
    }

    const updated = await this.products.updateById(id, updates, { updatedBy: userId });
    return toInventoryItem(updated.toObject ? updated.toObject() : updated);
  }

  async updateStock(id, stock, userId) {
    await this.products.assertExists(id);
    const updated = await this.products.updateStock(id, stock, { updatedBy: userId });
    return toInventoryItem(updated.toObject ? updated.toObject() : updated);
  }

  async restock(id, quantity, note, userId) {
    const product = await this.products.assertExists(id);
    const result = await this.products.adjustStock(id, quantity, { updatedBy: userId });

    if (!result) {
      throw new AppError('Failed to restock product', 500);
    }

    const restockEvent = await this.restocks.create({
      productId: id,
      sku: product.sku,
      quantity,
      note: note || null,
      previousStock: result.previousStock,
      newStock: result.newStock,
      createdBy: userId
    });

    return {
      item: toInventoryItem(result.product.toObject ? result.product.toObject() : result.product),
      restockEvent
    };
  }

  async deleteInventory(id, userId) {
    await this.products.assertExists(id);
    await this.products.softDeleteById(id, userId);
    return { deleted: true };
  }
}

export const inventoryService = new InventoryService();
