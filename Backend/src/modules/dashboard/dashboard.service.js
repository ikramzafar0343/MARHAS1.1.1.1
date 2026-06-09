import { Order } from '../orders/order.model.js';
import { Product, PRODUCT_STATUS } from '../products/product.model.js';
import { orderRepository } from '../orders/order.repository.js';
import { ORDER_STATUS } from '../../constants/orderStatus.js';

const formatCurrency = (amount) => {
  if (amount >= 1_000_000) {
    return `PKR ${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `PKR ${(amount / 1_000).toFixed(1)}K`;
  }
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`;
};

const formatChange = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? '+100%' : '0%';
  }
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

const getTrend = (current, previous) => (current >= previous ? 'up' : 'down');

const fillMonthlyKeys = (months = 10) => {
  const keys = [];
  const now = new Date();

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }

  return keys;
};

const mapMonthlyBuckets = (buckets, months = 10) => {
  const lookup = new Map(buckets.map((bucket) => [bucket._id, bucket.value]));
  return fillMonthlyKeys(months).map((key) => lookup.get(key) ?? 0);
};

const buildSalesSparkline = async (months = 10) => {
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - (months - 1));
  fromDate.setDate(1);

  const buckets = await Order.aggregate([
    {
      $match: {
        status: { $ne: ORDER_STATUS.CANCELLED },
        deletedAt: null,
        createdAt: { $gte: fromDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        value: { $sum: '$total' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const series = mapMonthlyBuckets(
    buckets.map((bucket) => ({ _id: bucket._id, value: Number((bucket.value / 1_000_000).toFixed(2)) })),
    months
  );

  return series.some((value) => value > 0) ? series : Array(months).fill(0);
};

const buildListingsSparkline = async (months = 10) => {
  const keys = fillMonthlyKeys(months);
  const now = new Date();
  const series = await Promise.all(
    keys.map(async (_key, index) => {
      const monthOffset = months - 1 - index;
      const end = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0, 23, 59, 59);

      return Product.countDocuments({
        status: PRODUCT_STATUS.PUBLISHED,
        deletedAt: null,
        createdAt: { $lte: end }
      });
    })
  );

  return series;
};

const buildActiveOrdersSparkline = async (months = 10) => {
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - (months - 1));
  fromDate.setDate(1);

  const buckets = await Order.aggregate([
    {
      $match: {
        status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED] },
        deletedAt: null,
        createdAt: { $gte: fromDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        value: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return mapMonthlyBuckets(buckets, months);
};

const formatOrderDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

export class DashboardService {
  constructor(orders = orderRepository) {
    this.orders = orders;
  }

  async getMetrics() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalSalesResult,
      prevMonthSalesResult,
      activeListings,
      prevListings,
      activeOrders,
      prevActiveOrders,
      monthlyRevenueResult,
      prevMonthlyRevenueResult,
      totalProducts,
      avgRatingResult,
      pendingOrders,
      prevPendingOrders,
      salesSeries,
      listingsSeries,
      activeOrdersSeries
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            status: { $ne: ORDER_STATUS.CANCELLED },
            deletedAt: null
          }
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        {
          $match: {
            status: { $ne: ORDER_STATUS.CANCELLED },
            deletedAt: null,
            createdAt: { $lte: prevMonthEnd }
          }
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Product.countDocuments({ status: PRODUCT_STATUS.PUBLISHED, deletedAt: null }),
      Product.countDocuments({
        status: PRODUCT_STATUS.PUBLISHED,
        deletedAt: null,
        createdAt: { $lte: prevMonthEnd }
      }),
      Order.countDocuments({
        status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED] },
        deletedAt: null
      }),
      Order.countDocuments({
        status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED] },
        deletedAt: null,
        createdAt: { $lte: prevMonthEnd }
      }),
      Order.aggregate([
        {
          $match: {
            status: { $ne: ORDER_STATUS.CANCELLED },
            deletedAt: null,
            createdAt: { $gte: monthStart }
          }
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        {
          $match: {
            status: { $ne: ORDER_STATUS.CANCELLED },
            deletedAt: null,
            createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd }
          }
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Product.countDocuments({ deletedAt: null }),
      Product.aggregate([
        { $match: { deletedAt: null, reviewCount: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]),
      Order.countDocuments({ status: ORDER_STATUS.PENDING, deletedAt: null }),
      Order.countDocuments({
        status: ORDER_STATUS.PENDING,
        deletedAt: null,
        createdAt: { $lte: prevMonthEnd }
      }),
      buildSalesSparkline(),
      buildListingsSparkline(),
      buildActiveOrdersSparkline()
    ]);

    const totalSales = totalSalesResult[0]?.total ?? 0;
    const prevMonthSales = prevMonthSalesResult[0]?.total ?? 0;
    const monthlyRevenue = monthlyRevenueResult[0]?.total ?? 0;
    const prevMonthlyRevenue = prevMonthlyRevenueResult[0]?.total ?? 0;
    const avgRating = avgRatingResult[0]?.avgRating ?? 0;
    const prevMonthProductCount = await Product.countDocuments({
      deletedAt: null,
      createdAt: { $lte: prevMonthEnd }
    });

    return {
      primary: [
        {
          id: 'sales',
          label: 'Total Sales',
          value: formatCurrency(totalSales),
          change: formatChange(totalSales, prevMonthSales),
          trend: getTrend(totalSales, prevMonthSales),
          series: salesSeries.length ? salesSeries : [0]
        },
        {
          id: 'listings',
          label: 'Active Listings',
          value: String(activeListings),
          change: formatChange(activeListings, prevListings),
          trend: getTrend(activeListings, prevListings),
          series: listingsSeries.length ? listingsSeries : [activeListings]
        },
        {
          id: 'active-orders',
          label: 'Active Orders',
          value: String(activeOrders),
          change: formatChange(activeOrders, prevActiveOrders),
          trend: getTrend(activeOrders, prevActiveOrders),
          series: activeOrdersSeries.length ? activeOrdersSeries : [activeOrders]
        }
      ],
      secondary: [
        {
          id: 'revenue',
          label: 'Monthly Revenue',
          value: formatCurrency(monthlyRevenue),
          change: formatChange(monthlyRevenue, prevMonthlyRevenue),
          trend: getTrend(monthlyRevenue, prevMonthlyRevenue),
          icon: 'bag'
        },
        {
          id: 'products',
          label: 'Total Products',
          value: String(totalProducts),
          change: formatChange(totalProducts, prevMonthProductCount),
          trend: getTrend(totalProducts, prevMonthProductCount),
          icon: 'box'
        },
        {
          id: 'avg-rating',
          label: 'Average Rating',
          value: avgRating.toFixed(1),
          change: '+0.0',
          trend: 'up',
          icon: 'star'
        },
        {
          id: 'pending-orders',
          label: 'Pending Orders',
          value: String(pendingOrders),
          change: formatChange(pendingOrders, prevPendingOrders),
          trend: getTrend(pendingOrders, prevPendingOrders),
          icon: 'list'
        }
      ]
    };
  }

  async getRecentOrders(limit = 5) {
    const orders = await this.orders.findRecent(limit);

    return orders.map((order) => ({
      id: order._id,
      orderId: order.orderNumber,
      customer: order.customer,
      status: order.status,
      date: formatOrderDate(order.createdAt),
      total: order.total
    }));
  }
}

export const dashboardService = new DashboardService();
