import { Order } from '../orders/order.model.js';
import { Product, PRODUCT_CATEGORIES } from '../products/product.model.js';
import { ORDER_STATUS } from '../../constants/orderStatus.js';

const PERIOD_DAYS = {
  '7d': 7,
  '30d': 30,
  '90d': 90
};

const CATEGORY_LABELS = {
  'new-arrivals': 'New Arrivals',
  summer: 'Summer',
  'ready-to-wear': 'Ready To Wear',
  unstitched: 'Unstitched',
  festive: 'Festive',
  bridal: 'Bridal'
};

const formatCurrency = (amount) => {
  if (amount >= 1_000_000) {
    return `PKR ${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `PKR ${(amount / 1_000).toFixed(1)}K`;
  }
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`;
};

const getTrend = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 'up' : 'neutral';
  }
  return current >= previous ? 'up' : 'down';
};

const formatChange = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? '+100%' : '0%';
  }
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

const getPeriodRange = (period) => {
  const days = PERIOD_DAYS[period] || 30;
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const previousToDate = new Date(fromDate);
  const previousFromDate = new Date(fromDate);
  previousFromDate.setDate(previousFromDate.getDate() - days);

  return { fromDate, toDate, previousFromDate, previousToDate, days };
};

function resolveLimit(value, fallback = 5) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, 20);
}

const activeOrderMatch = (fromDate, toDate) => ({
  status: { $ne: ORDER_STATUS.CANCELLED },
  deletedAt: null,
  createdAt: { $gte: fromDate, $lte: toDate }
});

const aggregatePeriod = async (fromDate, toDate) => {
  const [result] = await Order.aggregate([
    { $match: activeOrderMatch(fromDate, toDate) },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
        delivered: {
          $sum: {
            $cond: [{ $in: ['$status', [ORDER_STATUS.DELIVERED, ORDER_STATUS.SHIPPED]] }, 1, 0]
          }
        }
      }
    }
  ]);

  return {
    revenue: result?.revenue ?? 0,
    orders: result?.orders ?? 0,
    delivered: result?.delivered ?? 0
  };
};

const buildDailySeries = async (fromDate, toDate, field) => {
  const groupField = field === 'revenue' ? '$total' : 1;

  const buckets = await Order.aggregate([
    { $match: activeOrderMatch(fromDate, toDate) },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        value: { $sum: groupField }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const lookup = new Map(buckets.map((bucket) => [bucket._id, bucket.value]));
  const labels = [];
  const series = [];
  const cursor = new Date(fromDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(23, 59, 59, 999);
  const step = Math.max(1, Math.ceil((end - cursor) / (1000 * 60 * 60 * 24) / 6));

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    const value = lookup.get(key) ?? 0;
    const showLabel = series.length % step === 0 || cursor.toDateString() === end.toDateString();

    labels.push(
      showLabel
        ? cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : ''
    );
    series.push(field === 'revenue' ? value : value);
    cursor.setDate(cursor.getDate() + 1);
  }

  if (field === 'revenue') {
    return {
      labels,
      series: series.map((value) => Number(value))
    };
  }

  return { labels, series };
};

const buildWeeklySeries = async (fromDate, toDate, field) => {
  const daily = await buildDailySeries(fromDate, toDate, field);
  const labels = [];
  const series = [];

  for (let index = 0; index < daily.series.length; index += 7) {
    const chunk = daily.series.slice(index, index + 7);
    series.push(chunk.reduce((sum, value) => sum + value, 0));
    labels.push(daily.labels[index] || daily.labels[daily.labels.length - 1] || '');
  }

  return { labels, series };
};

const ensureChartPoints = ({ labels, series }) => {
  if (series.length >= 2) {
    return { labels, series };
  }

  if (series.length === 1) {
    return {
      labels: ['', labels[0] || ''],
      series: [0, series[0]]
    };
  }

  return {
    labels: ['', ''],
    series: [0, 0]
  };
};

const buildSparklineSeries = async (fromDate, toDate, field) => {
  const { series } = await buildDailySeries(fromDate, toDate, field);

  if (field === 'revenue') {
    return series.map((value) => Number((value / 1_000_000).toFixed(2)));
  }

  return series;
};

const aggregateTopProducts = async (fromDate, toDate, limit) => {
  const safeLimit = resolveLimit(limit);

  return Order.aggregate([
    { $match: activeOrderMatch(fromDate, toDate) },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        orders: { $sum: '$items.quantity' }
      }
    },
    { $sort: { revenue: -1 } }
  ]).limit(safeLimit);
};

const PERIOD_CHART_META = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days'
};

export class AnalyticsService {
  async getKpis(period = '30d') {
    const { fromDate, toDate, previousFromDate, previousToDate } = getPeriodRange(period);

    const [current, previous] = await Promise.all([
      aggregatePeriod(fromDate, toDate),
      aggregatePeriod(previousFromDate, previousToDate)
    ]);

    const avgOrderValue = current.orders > 0 ? current.revenue / current.orders : 0;
    const prevAvgOrderValue = previous.orders > 0 ? previous.revenue / previous.orders : 0;
    const conversionRate =
      current.orders > 0 ? (current.delivered / current.orders) * 100 : 0;
    const prevConversionRate =
      previous.orders > 0 ? (previous.delivered / previous.orders) * 100 : 0;

    const [revenueSeries, ordersSeries] = await Promise.all([
      buildSparklineSeries(fromDate, toDate, 'revenue'),
      buildSparklineSeries(fromDate, toDate, 'orders')
    ]);

    const avgOrderSeries =
      ordersSeries.length > 0
        ? ordersSeries.map((count, index) => {
            const revenuePoint = revenueSeries[index] ?? 0;
            return count > 0 ? Number(((revenuePoint * 1_000_000) / count / 1000).toFixed(1)) : 0;
          })
        : [];

    const conversionSeriesData =
      ordersSeries.length > 0
        ? ordersSeries.map((count) =>
            count > 0 ? Number(((current.delivered / current.orders) * 100).toFixed(1)) : 0
          )
        : [];

    return [
      {
        id: 'revenue',
        label: 'Revenue',
        value: formatCurrency(current.revenue),
        change: formatChange(current.revenue, previous.revenue),
        trend: getTrend(current.revenue, previous.revenue),
        series: revenueSeries.length ? revenueSeries : [0]
      },
      {
        id: 'orders',
        label: 'Orders',
        value: String(current.orders),
        change: formatChange(current.orders, previous.orders),
        trend: getTrend(current.orders, previous.orders),
        series: ordersSeries.length ? ordersSeries : [0]
      },
      {
        id: 'conversion',
        label: 'Conversion Rate',
        value: `${conversionRate.toFixed(1)}%`,
        change: formatChange(conversionRate, prevConversionRate),
        trend: getTrend(conversionRate, prevConversionRate),
        series: conversionSeriesData.length ? conversionSeriesData : [conversionRate]
      },
      {
        id: 'avg-order',
        label: 'Avg. Order Value',
        value: formatCurrency(avgOrderValue),
        change: formatChange(avgOrderValue, prevAvgOrderValue),
        trend: getTrend(avgOrderValue, prevAvgOrderValue),
        series: avgOrderSeries.length ? avgOrderSeries : [Number((avgOrderValue / 1000).toFixed(1))]
      }
    ];
  }

  async getRevenueChart(period = '30d') {
    const { fromDate, toDate, days } = getPeriodRange(period);
    const chart =
      days > 30
        ? await buildWeeklySeries(fromDate, toDate, 'revenue')
        : await buildDailySeries(fromDate, toDate, 'revenue');

    return {
      ...ensureChartPoints(chart),
      meta: PERIOD_CHART_META[period] || PERIOD_CHART_META['30d']
    };
  }

  async getOrdersChart(period = '30d') {
    const { fromDate, toDate, days } = getPeriodRange(period);
    const chart =
      days > 30
        ? await buildWeeklySeries(fromDate, toDate, 'orders')
        : await buildDailySeries(fromDate, toDate, 'orders');

    return {
      ...ensureChartPoints(chart),
      meta: PERIOD_CHART_META[period] || PERIOD_CHART_META['30d']
    };
  }

  async getCategoryBreakdown(period = '30d') {
    const { fromDate, toDate } = getPeriodRange(period);

    const breakdown = await Order.aggregate([
      { $match: activeOrderMatch(fromDate, toDate) },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    const totalRevenue = breakdown.reduce((sum, item) => sum + item.revenue, 0) || 1;

    return breakdown.map((item) => ({
      label: CATEGORY_LABELS[item._id] || item._id,
      value: Math.round((item.revenue / totalRevenue) * 100),
      category: item._id
    }));
  }

  async getTopProducts(period = '30d', limit = 5) {
    const { fromDate, toDate, previousFromDate, previousToDate } = getPeriodRange(period);
    const safeLimit = resolveLimit(limit);

    const [topProducts, previousProducts] = await Promise.all([
      aggregateTopProducts(fromDate, toDate, safeLimit),
      aggregateTopProducts(previousFromDate, previousToDate, safeLimit * 3)
    ]);

    const previousLookup = new Map(
      previousProducts.map((product) => [String(product._id), product.revenue])
    );

    return topProducts.map((product) => {
      const previousRevenue = previousLookup.get(String(product._id)) ?? 0;

      return {
        id: product._id?.toString?.() ?? String(product._id ?? ''),
        name: product.name || 'Unknown product',
        revenue: formatCurrency(product.revenue ?? 0),
        orders: product.orders ?? 0,
        change: formatChange(product.revenue ?? 0, previousRevenue),
        trend: getTrend(product.revenue ?? 0, previousRevenue)
      };
    });
  }

  async getProductCount() {
    return Product.countDocuments({ deletedAt: null });
  }

  async getCategoryOptions() {
    return PRODUCT_CATEGORIES;
  }
}

export const analyticsService = new AnalyticsService();
