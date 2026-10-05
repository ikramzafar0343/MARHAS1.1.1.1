import { prisma } from '../../database/prisma.js';
import { OrderRepository } from './order.repository.js';
import { ProductRepository } from '../products/product.repository.js';
import { DISCOUNT_TYPES, PRODUCT_STATUS } from '../../constants/product.js';
import { ADMIN_ROLES } from '../../constants/roles.js';
import {
  ORDER_STATUS,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_METHODS
} from '../../constants/orderStatus.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import {
  calculateShippingFee,
  calculateTaxAmount
} from '../../constants/commerceDefaults.js';
import { storefrontRepository } from '../storefront/storefront.repository.js';
import { sendOrderConfirmationNotifications } from './order.notifications.js';
import { normalizeProduct, decimalToNumber } from '../../database/mapper.js';

const getEffectivePrice = (product) => {
  if (!product.discount || product.discount <= 0) {
    return product.price;
  }

  if (product.discountType === DISCOUNT_TYPES.FIXED) {
    return Math.max(0, product.price - product.discount);
  }

  return Math.max(0, product.price - (product.price * product.discount) / 100);
};

const getPrimaryImage = (product) => product.images?.[0]?.url || null;

export class OrderService {
  constructor(
    orderRepository = new OrderRepository(),
    productRepository = new ProductRepository(),
    storefrontRepo = storefrontRepository
  ) {
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
    this.storefrontRepository = storefrontRepo;
  }

  async getCommerceSettings() {
    const published = await this.storefrontRepository.findPublished('default');
    if (!published?.commerceSettings) {
      throw new AppError('Published storefront commerce settings are required', 503);
    }
    const { resolveCommerceSettings } = await import('../../constants/commerceDefaults.js');
    return resolveCommerceSettings(published.commerceSettings);
  }

  async buildOrderItems(items, txProducts) {
    const productMap = new Map(txProducts.map((product) => [product.id, product]));

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product || product.deletedAt) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }

      if (product.status !== PRODUCT_STATUS.PUBLISHED) {
        throw new AppError(`Product is not available: ${product.title}`, 400);
      }

      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${product.title}`, 400);
      }

      if (item.size && product.sizes?.length && !product.sizes.includes(item.size)) {
        throw new AppError(`Size "${item.size}" is not available for ${product.title}`, 400);
      }

      const unitPrice = getEffectivePrice(product);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        productId: product.id,
        name: product.title,
        sku: product.sku,
        quantity: item.quantity,
        size: item.size || null,
        color: item.color || null,
        colorHex: item.colorHex || null,
        price: unitPrice,
        imageUrl: getPrimaryImage(product)
      });
    }

    return { orderItems, subtotal };
  }

  async checkout(payload, userId = null) {
    const commerceSettings = await this.getCommerceSettings();

    const created = await prisma.$transaction(async (tx) => {
      const productIds = [...new Set(payload.items.map((item) => item.productId))];

      const lockedRows = await tx.$queryRawUnsafe(
        `SELECT id, title, slug, sku, category, price, "originalPrice", discount, "discountType",
                description, specifications, "returnPolicy", sizes, colors, variants, images,
                "bestSeller", stock, "lowStockThreshold", rating, "reviewCount", status,
                "deletedAt", "createdBy", "updatedBy", "createdAt", "updatedAt"
         FROM products
         WHERE id = ANY($1::uuid[])
           AND "deletedAt" IS NULL
         FOR UPDATE`,
        productIds
      );

      const products = lockedRows.map((row) =>
        normalizeProduct({
          ...row,
          price: decimalToNumber(row.price),
          discount: decimalToNumber(row.discount),
          originalPrice: decimalToNumber(row.originalPrice),
          rating: decimalToNumber(row.rating)
        })
      );

      if (products.length !== productIds.length) {
        throw new AppError('One or more products were not found', 404);
      }

      const { orderItems, subtotal } = await this.buildOrderItems(payload.items, products);
      const shippingFee = calculateShippingFee(subtotal, commerceSettings);
      const taxAmount = calculateTaxAmount(subtotal, commerceSettings);
      const total = subtotal + shippingFee + taxAmount;

      for (const item of payload.items) {
        const product = products.find((p) => p.id === item.productId);
        const newStock = product.stock - item.quantity;
        if (newStock < 0) {
          throw new AppError(`Insufficient stock for ${product.title}`, 400);
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock, updatedBy: userId }
        });
        product.stock = newStock;
      }

      const orderRepo = new OrderRepository(tx);
      return orderRepo.createInTransaction(
        tx,
        {
          userId,
          customer: payload.fullName.trim(),
          email: payload.email.toLowerCase().trim(),
          phone: payload.phone.trim(),
          shipping: {
            address: payload.address.trim(),
            city: payload.city.trim(),
            postalCode: payload.postalCode.trim()
          },
          paymentMethod: payload.paymentMethod || PAYMENT_METHODS.COD,
          status: ORDER_STATUS.PENDING,
          items: orderItems,
          subtotal,
          shippingFee,
          taxAmount,
          taxRate: commerceSettings.taxEnabled ? commerceSettings.taxRate : 0,
          taxLabel: commerceSettings.taxLabel,
          total,
          notes: payload.notes || null
        },
        { updatedBy: userId }
      );
    });

    void sendOrderConfirmationNotifications(created);
    return created;
  }

  async getMyOrders(userId, query) {
    const status = query.status === 'all' ? undefined : query.status;
    const result = await this.orderRepository.findByUser(userId, {
      page: query.page,
      limit: query.limit,
      status
    });

    return {
      orders: result.docs,
      pagination: result.pagination
    };
  }

  canAccessOrder(order, user) {
    if (!order) {
      return false;
    }

    if (user && ADMIN_ROLES.includes(user.role)) {
      return true;
    }

    if (!order.userId) {
      return true;
    }

    const orderUserId =
      typeof order.userId === 'object' ? order.userId.id || order.userId._id : order.userId;

    if (user && String(orderUserId) === String(user._id || user.id)) {
      return true;
    }

    return false;
  }

  async getOrderByNumber(orderNumber, user = null) {
    const order = await this.orderRepository.findByOrderNumber(orderNumber, {
      populateItems: true
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!this.canAccessOrder(order, user)) {
      throw new AppError('Access denied', 403);
    }

    return order;
  }

  async listAdminOrders(query) {
    const filter = this.orderRepository.buildFilter({
      status: query.status === 'all' ? undefined : query.status,
      email: query.email,
      search: query.search,
      fromDate: query.fromDate,
      toDate: query.toDate
    });

    const sortField = query.sort || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    const result = await this.orderRepository.findPaginated({
      page: query.page,
      limit: query.limit,
      filter,
      sort: { [sortField]: sortOrder }
    });

    return {
      orders: result.docs,
      pagination: result.pagination
    };
  }

  async getAdminOrderById(id) {
    const order = await this.orderRepository.findById(id, {
      populateItems: true,
      populateUser: true
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  async updateAdminOrder(id, payload, userId) {
    const order = await this.orderRepository.assertExists(id);

    if (order.status === ORDER_STATUS.CANCELLED) {
      throw new AppError('Cancelled orders cannot be updated', 400);
    }

    const update = { ...payload };

    if (update.email) {
      update.email = update.email.toLowerCase().trim();
    }

    return this.orderRepository.updateById(id, update, {
      updatedBy: userId
    });
  }

  assertValidStatusTransition(currentStatus, nextStatus) {
    const allowed = ORDER_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(nextStatus)) {
      throw new AppError(
        `Cannot transition order from "${currentStatus}" to "${nextStatus}"`,
        400
      );
    }
  }

  async updateOrderStatus(id, status, userId) {
    const order = await this.orderRepository.assertExists(id);
    this.assertValidStatusTransition(order.status, status);

    return this.orderRepository.updateStatus(id, status, { updatedBy: userId });
  }

  async cancelOrder(id, reason = null, userId) {
    const order = await this.orderRepository.assertExists(id);

    if (order.status === ORDER_STATUS.CANCELLED) {
      throw new AppError('Order is already cancelled', 400);
    }

    if (order.status === ORDER_STATUS.DELIVERED) {
      throw new AppError('Delivered orders cannot be cancelled', 400);
    }

    this.assertValidStatusTransition(order.status, ORDER_STATUS.CANCELLED);

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const productId =
          typeof item.productId === 'object'
            ? item.productId.id || item.productId._id
            : item.productId;

        const rows = await tx.$queryRawUnsafe(
          `SELECT id, stock FROM products
           WHERE id = $1::uuid AND "deletedAt" IS NULL
           FOR UPDATE`,
          productId
        );

        if (!rows.length) {
          logger.warn(
            { orderId: id, productId, itemName: item.name },
            'Skipped stock restore during cancel because product was not found'
          );
          continue;
        }

        await tx.product.update({
          where: { id: productId },
          data: {
            stock: rows[0].stock + item.quantity,
            updatedBy: userId
          }
        });
      }

      await tx.order.update({
        where: { id },
        data: {
          status: ORDER_STATUS.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason,
          updatedBy: userId
        }
      });
    });

    return this.orderRepository.findById(id, { populateItems: true });
  }
}

export const orderService = new OrderService();
