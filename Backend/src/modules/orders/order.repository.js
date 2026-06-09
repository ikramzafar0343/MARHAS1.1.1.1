import { Order } from './order.model.js';
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

export class OrderRepository {
  constructor(model = Order) {
    this.model = model;
  }

  async generateOrderNumber() {
    const latest = await this.model
      .findOne({}, { orderNumber: 1 })
      .sort({ createdAt: -1 })
      .setOptions({ includeDeleted: true })
      .lean();

    if (!latest?.orderNumber) {
      return formatOrderNumber(1);
    }

    const match = latest.orderNumber.match(/#MH-(\d+)/i);
    const lastSequence = match ? parseInt(match[1], 10) : 0;
    return formatOrderNumber(lastSequence + 1);
  }

  async create(data, options = {}) {
    const payload = { ...data };

    if (!payload.orderNumber) {
      payload.orderNumber = await this.generateOrderNumber();
    }

    if (options.updatedBy) {
      payload.updatedBy = options.updatedBy;
    }

    const order = new this.model(payload);
    return order.save();
  }

  async findById(id, options = {}) {
    let query = this.model.findById(id);

    if (options.populateItems) {
      query = query.populate('items.productId', 'title slug images sku');
    }
    if (options.populateUser) {
      query = query.populate('userId', 'name email');
    }
    if (options.includeDeleted) {
      query = query.setOptions({ includeDeleted: true });
    }
    if (options.lean) {
      query = query.lean();
    }

    return query.exec();
  }

  async findByOrderNumber(orderNumber, options = {}) {
    let query = this.model.findOne({
      orderNumber: orderNumber.toUpperCase().trim()
    });

    if (options.populateItems) {
      query = query.populate('items.productId', 'title slug images sku');
    }
    if (options.populateUser) {
      query = query.populate('userId', 'name email');
    }
    if (options.includeDeleted) {
      query = query.setOptions({ includeDeleted: true });
    }
    if (options.lean) {
      query = query.lean();
    }

    return query.exec();
  }

  buildFilter({ status, userId, email, search, fromDate, toDate } = {}) {
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (email) {
      filter.email = email.toLowerCase().trim();
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ orderNumber: regex }, { customer: regex }, { email: regex }, { phone: regex }];
    }

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.createdAt.$lte = new Date(toDate);
      }
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
    return this.model.find({}).sort({ createdAt: -1 }).limit(limit).lean().exec();
  }

  async updateById(id, data, options = {}) {
    const update = { ...data };
    if (options.updatedBy) {
      update.updatedBy = options.updatedBy;
    }

    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  async updateStatus(id, status, options = {}) {
    const update = { status };

    if (status === ORDER_STATUS.CANCELLED) {
      update.cancelledAt = new Date();
      if (options.cancellationReason) {
        update.cancellationReason = options.cancellationReason;
      }
    }

    if (options.updatedBy) {
      update.updatedBy = options.updatedBy;
    }

    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  async updateShipping(id, shipping, updatedBy = null) {
    const update = { shipping };
    if (updatedBy) {
      update.updatedBy = updatedBy;
    }

    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  async cancel(id, reason = null, updatedBy = null) {
    return this.updateStatus(id, ORDER_STATUS.CANCELLED, {
      cancellationReason: reason,
      updatedBy
    });
  }

  async softDeleteById(id, updatedBy = null) {
    const order = await this.findById(id);
    if (!order) {
      return null;
    }
    return order.softDelete(updatedBy);
  }

  async assertExists(id) {
    const order = await this.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    return order;
  }

  async assertByOrderNumber(orderNumber) {
    const order = await this.findByOrderNumber(orderNumber);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    return order;
  }

  async aggregateRevenue({ fromDate, toDate, groupBy = 'day' } = {}) {
    const match = {
      status: { $ne: ORDER_STATUS.CANCELLED },
      deletedAt: null
    };

    if (fromDate || toDate) {
      match.createdAt = {};
      if (fromDate) {
        match.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        match.createdAt.$lte = new Date(toDate);
      }
    }

    const dateFormat =
      groupBy === 'month'
        ? { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
        : { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    return this.model.aggregate([
      { $match: match },
      {
        $group: {
          _id: dateFormat,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  async countByStatus() {
    return this.model.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
  }
}

export const orderRepository = new OrderRepository();
