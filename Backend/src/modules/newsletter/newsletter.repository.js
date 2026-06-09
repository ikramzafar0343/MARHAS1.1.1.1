import { NewsletterSubscriber } from './newsletter.model.js';
import { AppError } from '../../utils/AppError.js';

export class NewsletterRepository {
  constructor(model = NewsletterSubscriber) {
    this.model = model;
  }

  async subscribe(email, source = 'footer') {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.model
      .findOne({ email: normalizedEmail })
      .setOptions({ includeDeleted: true })
      .exec();

    if (existing) {
      if (existing.deletedAt) {
        existing.deletedAt = null;
      }
      existing.isActive = true;
      existing.source = source;
      existing.subscribedAt = new Date();
      existing.unsubscribedAt = null;
      return existing.save();
    }

    const subscriber = new this.model({
      email: normalizedEmail,
      source,
      subscribedAt: new Date(),
      isActive: true
    });

    return subscriber.save();
  }

  async findByEmail(email) {
    return this.model.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findById(id) {
    return this.model.findById(id).exec();
  }

  async findPaginated({ page = 1, limit = 50, filter = {}, sort = { subscribedAt: -1 } } = {}) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 200);
    const skip = (safePage - 1) * safeLimit;

    const [docs, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(safeLimit).lean(),
      this.model.countDocuments(filter)
    ]);

    return {
      docs,
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
    return this.model
      .findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { isActive: false, unsubscribedAt: new Date() },
        { new: true, runValidators: true }
      )
      .exec();
  }

  async softDeleteByEmail(email) {
    const subscriber = await this.findByEmail(email);
    if (!subscriber) {
      return null;
    }
    return subscriber.softDelete();
  }

  async countActive() {
    return this.model.countDocuments({ isActive: true });
  }

  async emailExists(email) {
    const count = await this.model.countDocuments({ email: email.toLowerCase().trim() });
    return count > 0;
  }

  async assertByEmail(email) {
    const subscriber = await this.findByEmail(email);
    if (!subscriber) {
      throw new AppError('Newsletter subscriber not found', 404);
    }
    return subscriber;
  }
}

export const newsletterRepository = new NewsletterRepository();
