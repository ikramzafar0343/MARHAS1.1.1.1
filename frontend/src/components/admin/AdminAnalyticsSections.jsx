import React from 'react';
import { replaceBrandInText } from '../../utils/brandText';
import AdminAreaChart from './AdminAreaChart';
import AdminMetricSparkline from './AdminMetricSparkline';

const KPI_PLACEHOLDERS = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'orders', label: 'Orders' },
  { id: 'conversion', label: 'Conversion Rate' },
  { id: 'avg-order', label: 'Avg. Order Value' }
];

export const AdminAnalyticsIntro = ({ activePeriod, onPeriodChange, periods, loading = false }) => (
  <header className="admin-analytics-intro">
    <div>
      <h1 className="admin-analytics-title">Analytics Overview</h1>
      <p className="admin-analytics-subtitle">
        {replaceBrandInText(
          'Track revenue, orders, and product performance across your MARHAS storefront.'
        )}
      </p>
    </div>

    <div className="admin-analytics-periods" role="group" aria-label="Analytics period">
      {periods.map((period) => (
        <button
          key={period.id}
          type="button"
          className={`admin-analytics-period ${activePeriod === period.id ? 'admin-analytics-period--active' : ''}`}
          onClick={() => onPeriodChange(period.id)}
        >
          {period.label}
        </button>
      ))}
    </div>
  </header>
);

export const AdminAnalyticsKpis = ({ metrics, loading = false }) => (
  <section className="admin-analytics-kpi-grid" aria-label="Analytics summary">
    {loading ? (
      KPI_PLACEHOLDERS.map((metric) => (
        <article key={metric.id} className="admin-metric-card">
          <p className="admin-metric-label">{metric.label}</p>
          <div className="admin-metric-row">
            <span className="admin-metric-value admin-metric-value--loading">—</span>
            <span className="admin-metric-change admin-metric-change--up">...</span>
          </div>
        </article>
      ))
    ) : metrics.length === 0 ? (
      <p className="admin-inventory-empty">No analytics data for this period.</p>
    ) : (
      metrics.map((metric) => (
        <article key={metric.id} className="admin-metric-card">
          <p className="admin-metric-label">{metric.label}</p>
          <div className="admin-metric-row">
            <span className="admin-metric-value">{metric.value}</span>
            <span className={`admin-metric-change admin-metric-change--${metric.trend}`}>
              {metric.change}
            </span>
          </div>
          <AdminMetricSparkline data={metric.series} trend={metric.trend} chartId={`analytics-${metric.id}`} />
        </article>
      ))
    )}
  </section>
);

export const AdminAnalyticsCharts = ({ revenueChart, ordersChart, loading = false }) => (
  <section className="admin-analytics-charts" aria-label="Performance charts">
    <article className="admin-analytics-chart-card">
      <div className="admin-analytics-chart-head">
        <h2 className="admin-analytics-chart-title">Revenue Trend</h2>
        <span className="admin-analytics-chart-meta">
          {loading ? 'Loading...' : revenueChart.meta || 'Selected period'}
        </span>
      </div>
      {loading ? (
        <p className="admin-inventory-empty">Loading chart...</p>
      ) : (
        <AdminAreaChart
          data={revenueChart.series}
          labels={revenueChart.labels}
          chartId="revenue-trend"
          trend="up"
          emptyLabel="No revenue data for this period."
        />
      )}
    </article>

    <article className="admin-analytics-chart-card">
      <div className="admin-analytics-chart-head">
        <h2 className="admin-analytics-chart-title">Orders Trend</h2>
        <span className="admin-analytics-chart-meta">
          {loading ? 'Loading...' : ordersChart.meta || 'Selected period'}
        </span>
      </div>
      {loading ? (
        <p className="admin-inventory-empty">Loading chart...</p>
      ) : (
        <AdminAreaChart
          data={ordersChart.series}
          labels={ordersChart.labels}
          chartId="orders-trend"
          trend="up"
          formatValue={(value) => String(Math.round(value))}
          emptyLabel="No order data for this period."
        />
      )}
    </article>
  </section>
);

export const AdminAnalyticsCategoryBars = ({ categories, loading = false }) => {
  const maxValue = Math.max(...categories.map((item) => item.value), 1);

  return (
    <article className="admin-analytics-panel">
      <h2 className="admin-analytics-panel-title">Sales by Category</h2>
      {loading ? (
        <p className="admin-inventory-empty">Loading categories...</p>
      ) : categories.length === 0 ? (
        <p className="admin-inventory-empty">No category sales in this period.</p>
      ) : (
        <div className="admin-analytics-bars">
          {categories.map((category) => (
            <div key={category.label} className="admin-analytics-bar-row">
              <span className="admin-analytics-bar-label">{category.label}</span>
              <div className="admin-analytics-bar-track">
                <span
                  className="admin-analytics-bar-fill"
                  style={{ width: `${(category.value / maxValue) * 100}%` }}
                />
              </div>
              <span className="admin-analytics-bar-value">{category.value}%</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};

export const AdminAnalyticsTopProducts = ({ products, loading = false }) => (
  <article className="admin-analytics-panel">
    <h2 className="admin-analytics-panel-title">Top Products</h2>
    {loading ? (
      <p className="admin-inventory-empty">Loading products...</p>
    ) : products.length === 0 ? (
      <p className="admin-inventory-empty">No product sales in this period.</p>
    ) : (
      <div className="admin-analytics-products">
        {products.map((product, index) => (
          <div key={product.id} className="admin-analytics-product-row">
            <span className="admin-analytics-product-rank">{String(index + 1).padStart(2, '0')}</span>
            <div className="admin-analytics-product-copy">
              <p className="admin-analytics-product-name">{product.name}</p>
              <p className="admin-analytics-product-meta">
                {product.orders} orders · {product.revenue}
              </p>
            </div>
            <span className={`admin-analytics-product-trend admin-analytics-product-trend--${product.trend}`}>
              {product.change || (product.trend === 'up' ? '+0%' : '-0%')}
            </span>
          </div>
        ))}
      </div>
    )}
  </article>
);
