import { prisma } from '../../database/prisma.js';
import { toEntity } from '../../database/mapper.js';
import { AppError } from '../../utils/AppError.js';

const mapSub = (row) => toEntity(row);

const toOrderBy = (sort = { subscribedAt: -1 }) =>
  Object.entries(sort).map(([key, value]) => ({
    [key]: value === 1 || value === 'asc' ? 'asc' : 'desc'
  }));

export class NewsletterRepository {
  constructor(client = prisma) {
    this.db = client;
  }

  async subscribe(email, source = 'footer') {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.db.newsletterSubscriber.findFirst({
      where: { email: normalizedEmail }
    });

    if (existing) {
      const updated = await this.db.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          deletedAt: null,
          isActive: true,
          source,
          subscribedAt: new Date(),
          unsubscribedAt: null
        }
      });
      return mapSub(updated);
    }

    const created = await this.db.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        source,
        subscribedAt: new Date(),
        isActive: true
      }
    });
    return mapSub(created);
  }

  async findByEmail(email) {
    const row = await this.db.newsletterSubscriber.findFirst({
      where: { email: email.toLowerCase().trim(), deletedAt: null }
    });
    return mapSub(row);
  }

  async findById(id) {
    const row = await this.db.newsletterSubscriber.findFirst({
      where: { id, deletedAt: null }
    });
    return mapSub(row);
  }

  async findPaginated({ page = 1, limit = 50, filter = {}, sort = { subscribedAt: -1 } } = {}) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 200);
    const skip = (safePage - 1) * safeLimit;
    const where = { deletedAt: null, ...filter };

    const [docs, total] = await Promise.all([
      this.db.newsletterSubscriber.findMany({
        where,
        orderBy: toOrderBy(sort),
        skip,
        take: safeLimit
      }),
      this.db.newsletterSubscriber.count({ where })
    ]);

    return {
      docs: docs.map(mapSub),
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

  async findActive(options = {}) {
    return this.findPaginated({
      page: options.page,
      limit: options.limit,
      filter: { isActive: true }
    });
  }

  async unsubscribe(email) {
    const existing = await this.findByEmail(email);
    if (!existing) return null;
    const updated = await this.db.newsletterSubscriber.update({
      where: { id: existing.id },
      data: { isActive: false, unsubscribedAt: new Date() }
    });
    return mapSub(updated);
  }

  async softDeleteByEmail(email) {
    const existing = await this.findByEmail(email);
    if (!existing) return null;
    const updated = await this.db.newsletterSubscriber.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() }
    });
    return mapSub(updated);
  }

  async countActive() {
    return this.db.newsletterSubscriber.count({
      where: { isActive: true, deletedAt: null }
    });
  }

  async emailExists(email) {
    const count = await this.db.newsletterSubscriber.count({
      where: { email: email.toLowerCase().trim(), deletedAt: null }
    });
    return count > 0;
  }

  async assertByEmail(email) {
    const subscriber = await this.findByEmail(email);
    if (!subscriber) throw new AppError('Subscriber not found', 404);
    return subscriber;
  }
}

export const newsletterRepository = new NewsletterRepository();
