import { RestockEvent } from './restock.model.js';

export class RestockRepository {
  constructor(model = RestockEvent) {
    this.model = model;
  }

  async create(data) {
    const event = new this.model(data);
    return event.save();
  }

  async findById(id, options = {}) {
    let query = this.model.findById(id);

    if (options.populateProduct) {
      query = query.populate('productId', 'title sku category stock images');
    }
    if (options.lean) {
      query = query.lean();
    }

    return query.exec();
  }

  async findByProduct(productId, options = {}) {
    const safeLimit = Math.min(Math.max(1, options.limit || 20), 100);

    let query = this.model
      .find({ productId })
      .sort({ createdAt: -1 })
      .limit(safeLimit);

    if (options.populateProduct) {
      query = query.populate('productId', 'title sku category stock');
    }
    if (options.lean) {
      query = query.lean();
    }

    return query.exec();
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

    let query = this.model.find(filter).sort(sort).skip(skip).limit(safeLimit);

    if (populateProduct) {
      query = query.populate('productId', 'title sku category stock images');
    }

    const [docs, total] = await Promise.all([
      query.lean().exec(),
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

  async findRecent(limit = 10) {
    return this.model
      .find({})
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 50))
      .populate('productId', 'title sku')
      .lean()
      .exec();
  }

  async countByProduct(productId) {
    return this.model.countDocuments({ productId });
  }

  async aggregateByProduct({ fromDate, toDate } = {}) {
    const match = {};

    if (fromDate || toDate) {
      match.createdAt = {};
      if (fromDate) {
        match.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        match.createdAt.$lte = new Date(toDate);
      }
    }

    return this.model.aggregate([
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      {
        $group: {
          _id: '$productId',
          totalRestocked: { $sum: '$quantity' },
          events: { $sum: 1 }
        }
      },
      { $sort: { totalRestocked: -1 } }
    ]);
  }
}

export const restockRepository = new RestockRepository();
