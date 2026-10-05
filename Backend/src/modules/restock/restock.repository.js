import { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { toEntity, normalizeProduct } from '../../database/mapper.js';

const mapEvent = (row) => {
  if (!row) return null;
  const entity = toEntity(row);
  if (row.product) {
    entity.productId = normalizeProduct(row.product);
  }
  return entity;
};

const toOrderBy = (sort = { createdAt: -1 }) =>
  Object.entries(sort).map(([key, value]) => ({
    [key]: value === 1 || value === 'asc' ? 'asc' : 'desc'
  }));

export class RestockRepository {
  constructor(client = prisma) {
    this.db = client;
  }

  async create(data) {
    const event = await this.db.restockEvent.create({
      data: {
        ...data,
        sku: data.sku?.toUpperCase?.() ?? data.sku
      }
    });
    return mapEvent(event);
  }

  async findById(id, options = {}) {
    const event = await this.db.restockEvent.findUnique({
      where: { id },
      include: options.populateProduct ? { product: true } : undefined
    });
    return mapEvent(event);
  }

  async findByProduct(productId, options = {}) {
    const safeLimit = Math.min(Math.max(1, options.limit || 20), 100);
    const events = await this.db.restockEvent.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      include: options.populateProduct ? { product: true } : undefined
    });
    return events.map(mapEvent);
  }

  async findPaginated({
    page = 1,
    limit = 20,
    filter = {},
    sort = { createdAt: -1 },
    populateProduct = false
  } = {}) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (safePage - 1) * safeLimit;

    const [docs, total] = await Promise.all([
      this.db.restockEvent.findMany({
        where: filter,
        orderBy: toOrderBy(sort),
        skip,
        take: safeLimit,
        include: populateProduct ? { product: true } : undefined
      }),
      this.db.restockEvent.count({ where: filter })
    ]);

    return {
      docs: docs.map(mapEvent),
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

  async findRecent(limit = 10) {
    const events = await this.db.restockEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
      include: { product: true }
    });
    return events.map(mapEvent);
  }

  async countByProduct(productId) {
    return this.db.restockEvent.count({ where: { productId } });
  }

  async aggregateByProduct({ fromDate, toDate } = {}) {
    const rows = await this.db.$queryRaw`
      SELECT
        "productId" AS id,
        SUM(quantity)::int AS "totalRestocked",
        COUNT(*)::int AS events
      FROM restock_events
      WHERE 1=1
        ${fromDate ? Prisma.sql`AND "createdAt" >= ${new Date(fromDate)}` : Prisma.empty}
        ${toDate ? Prisma.sql`AND "createdAt" <= ${new Date(toDate)}` : Prisma.empty}
      GROUP BY "productId"
      ORDER BY "totalRestocked" DESC
    `;

    return rows.map((row) => ({
      _id: row.id,
      totalRestocked: row.totalRestocked,
      events: row.events
    }));
  }
}

export const restockRepository = new RestockRepository();
