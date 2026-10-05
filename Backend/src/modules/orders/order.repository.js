import { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { normalizeOrder, softDeleteFilter } from '../../database/mapper.js';
import { ORDER_STATUS } from '../../constants/orderStatus.js';
import { AppError } from '../../utils/AppError.js';

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 0,
  hasNext: page * limit < total,
  hasPrev: page > 1
});

const formatOrderNumber = (sequence) => `#MH-${String(sequence).padStart(5, '0')}`;

const itemInclude = {
  items: { include: { product: true } },
  user: true
};

const toOrderBy = (sort = { createdAt: -1 }) =>
  Object.entries(sort).map(([key, value]) => ({
    [key]: value === 1 || value === 'asc' ? 'asc' : 'desc'
  }));

export class OrderRepository {
  constructor(client = prisma) {
    this.db = client;
  }

  async generateOrderNumber(tx = this.db) {
    const latest = await tx.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true }
    });

    if (!latest?.orderNumber) {
      return formatOrderNumber(1);
    }

    const match = latest.orderNumber.match(/#MH-(\d+)/i);
    const lastSequence = match ? parseInt(match[1], 10) : 0;
    return formatOrderNumber(lastSequence + 1);
  }

  async create(data, options = {}) {
    const { items = [], ...orderData } = data;
    const orderNumber = orderData.orderNumber || (await this.generateOrderNumber());

    const created = await this.db.order.create({
      data: {
        ...orderData,
        orderNumber,
        updatedBy: options.updatedBy ?? orderData.updatedBy ?? null,
        createdBy: options.updatedBy ?? orderData.createdBy ?? null,
        items: {
          create: items.map((item) => ({
            productId: item.productId?.id ?? item.productId?._id ?? item.productId,
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            size: item.size ?? null,
            color: item.color ?? null,
            colorHex: item.colorHex ?? null,
            price: item.price,
            imageUrl: item.imageUrl ?? null
          }))
        }
      },
      include: itemInclude
    });

    return normalizeOrder(created);
  }

  async createInTransaction(tx, data, options = {}) {
    const { items = [], ...orderData } = data;
    const orderNumber = orderData.orderNumber || (await this.generateOrderNumber(tx));

    const created = await tx.order.create({
      data: {
        ...orderData,
        orderNumber,
        updatedBy: options.updatedBy ?? null,
        createdBy: options.updatedBy ?? null,
        items: {
          create: items.map((item) => ({
            productId: item.productId?.id ?? item.productId?._id ?? item.productId,
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            size: item.size ?? null,
            color: item.color ?? null,
            colorHex: item.colorHex ?? null,
            price: item.price,
            imageUrl: item.imageUrl ?? null
          }))
        }
      },
      include: itemInclude
    });

    return normalizeOrder(created);
  }

  async findById(id, options = {}) {
    const order = await this.db.order.findFirst({
      where: { id, ...softDeleteFilter(options.includeDeleted) },
      include: {
        items: options.populateItems ? { include: { product: true } } : true,
        user: options.populateUser ? true : false
      }
    });
    return normalizeOrder(order);
  }

  async findByOrderNumber(orderNumber, options = {}) {
    const order = await this.db.order.findFirst({
      where: {
        orderNumber: orderNumber.toUpperCase().trim(),
        ...softDeleteFilter(options.includeDeleted)
      },
      include: {
        items: options.populateItems ? { include: { product: true } } : true,
        user: options.populateUser ? true : false
      }
    });
    return normalizeOrder(order);
  }

  buildFilter({ status, userId, email, search, fromDate, toDate } = {}) {
    const where = { deletedAt: null };

    if (status && status !== 'all') where.status = status;
    if (userId) where.userId = userId;
    if (email) where.email = email.toLowerCase().trim();

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
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
    const where = { deletedAt: null, ...filter };

    const [docs, total] = await Promise.all([
      this.db.order.findMany({
        where,
        orderBy: toOrderBy(sort),
        skip,
        take: safeLimit,
        include: { items: true }
      }),
      this.db.order.count({ where })
    ]);

    return {
      docs: docs.map(normalizeOrder),
      pagination: buildPagination(safePage, safeLimit, total)
    };
  }

  async findByUser(userId, options = {}) {
    const filter = this.buildFilter({ userId, status: options.status });
    return this.findPaginated({
      page: options.page,
      limit: options.limit,
      filter,
      sort: { createdAt: -1 }
    });
  }

  async findRecent(limit = 10) {
    const docs = await this.db.order.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
      include: { items: true }
    });
    return docs.map(normalizeOrder);
  }

  async updateById(id, data, options = {}) {
    const update = { ...data };
    if (options.updatedBy) update.updatedBy = options.updatedBy;
    delete update.items;

    try {
      const order = await this.db.order.update({
        where: { id },
        data: update,
        include: itemInclude
      });
      return normalizeOrder(order);
    } catch {
      return null;
    }
  }

  async updateStatus(id, status, options = {}) {
    const update = { status };
    if (status === ORDER_STATUS.CANCELLED) {
      update.cancelledAt = new Date();
      if (options.cancellationReason) {
        update.cancellationReason = options.cancellationReason;
      }
    }
    return this.updateById(id, update, options);
  }

  async updateShipping(id, shipping, updatedBy = null) {
    return this.updateById(id, { shipping }, { updatedBy });
  }

  async cancel(id, reason = null, updatedBy = null) {
    return this.updateStatus(id, ORDER_STATUS.CANCELLED, {
      cancellationReason: reason,
      updatedBy
    });
  }

  async softDeleteById(id, updatedBy = null) {
    return this.updateById(id, { deletedAt: new Date() }, { updatedBy });
  }

  async assertExists(id) {
    const order = await this.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    return order;
  }

  async assertByOrderNumber(orderNumber) {
    const order = await this.findByOrderNumber(orderNumber);
    if (!order) throw new AppError('Order not found', 404);
    return order;
  }

  async aggregateRevenue({ fromDate, toDate, groupBy = 'day' } = {}) {
    const trunc = groupBy === 'month' ? 'month' : 'day';
    const rows = await this.db.$queryRaw`
      SELECT
        to_char(date_trunc(${trunc}, "createdAt"), ${groupBy === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD'}) AS period,
        COALESCE(SUM(total), 0)::float AS revenue,
        COUNT(*)::int AS orders
      FROM orders
      WHERE "deletedAt" IS NULL
        AND status <> 'cancelled'::"OrderStatus"
        ${fromDate ? Prisma.sql`AND "createdAt" >= ${new Date(fromDate)}` : Prisma.empty}
        ${toDate ? Prisma.sql`AND "createdAt" <= ${new Date(toDate)}` : Prisma.empty}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return rows.map((row) => ({
      _id: row.period,
      revenue: Number(row.revenue),
      orders: row.orders
    }));
  }

  async countByStatus() {
    const rows = await this.db.order.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true }
    });

    return rows.map((row) => ({
      _id: row.status,
      count: row._count._all
    }));
  }
}

export const orderRepository = new OrderRepository();
