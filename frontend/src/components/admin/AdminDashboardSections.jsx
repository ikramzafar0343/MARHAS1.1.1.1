import AdminMetricSparkline from './AdminMetricSparkline';
import BrandWordmark from '../ui/BrandWordmark';
import { replaceBrandInText } from '../../utils/brandText';
import { Link } from 'react-router-dom';
import {
  HiOutlineBookOpen,
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlineCube,
  HiOutlineGlobeAlt,
  HiOutlinePlus,
  HiOutlineQuestionMarkCircle,
  HiOutlineShoppingBag,
  HiOutlineStar,
  HiOutlineSupport
} from 'react-icons/hi';

const quickActionIcons = {
  plus: HiOutlinePlus,
  chart: HiOutlineChartBar,
  box: HiOutlineCube,
  cart: HiOutlineShoppingBag,
  globe: HiOutlineGlobeAlt
};

const secondaryIcons = {
  bag: HiOutlineShoppingBag,
  box: HiOutlineCube,
  star: HiOutlineStar,
  list: HiOutlineClipboardList
};

const footerIcons = {
  help: HiOutlineQuestionMarkCircle,
  book: HiOutlineBookOpen,
  support: HiOutlineSupport
};

export const AdminWelcomeBar = ({ adminUser }) => (
  <section className="admin-welcome-bar">
    <h1 className="admin-welcome-title">
      Welcome, {replaceBrandInText(adminUser?.name || 'MARHAS Admin')}!
    </h1>
  </section>
);

const AdminQuickActionCard = ({ action, Icon }) => {
  const content = (
    <>
      <span className="admin-quick-action-icon">
        <Icon size={22} strokeWidth={1.6} />
      </span>
      <span className="admin-quick-action-title">{action.title}</span>
      <span className="admin-quick-action-desc">{action.description}</span>
    </>
  );

  if (action.to) {
    return (
      <Link to={action.to} className="admin-quick-action-card">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className="admin-quick-action-card">
      {content}
    </button>
  );
};

export const AdminQuickActions = ({ actions }) => (
  <section className="admin-quick-actions" aria-label="Quick actions">
    {actions.map((action) => {
      const Icon = quickActionIcons[action.icon];

      return <AdminQuickActionCard key={action.id} action={action} Icon={Icon} />;
    })}
  </section>
);

export const AdminPrimaryMetrics = ({ metrics, loading = false }) => (
  <section className="admin-metrics-grid" aria-label="Primary metrics">
    {loading ? (
      <>
        {['Total Sales', 'Active Listings', 'Active Orders'].map((label) => (
          <article key={label} className="admin-metric-card">
            <p className="admin-metric-label">{label}</p>
            <div className="admin-metric-row">
              <span className="admin-metric-value admin-metric-value--loading">—</span>
              <span className="admin-metric-change admin-metric-change--up">...</span>
            </div>
          </article>
        ))}
      </>
    ) : metrics.length === 0 ? (
      <p className="admin-inventory-empty">No metrics available.</p>
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
          <AdminMetricSparkline data={metric.series} trend={metric.trend} chartId={metric.id} />
        </article>
      ))
    )}
  </section>
);

import { getRecentOrderAction } from '../../constants/adminDashboard';

export const AdminRecentOrders = ({
  rows,
  statusLabels,
  loading = false,
  actionLoadingId = null,
  onAction
}) => (
  <section className="admin-orders-card">
    <h2 className="admin-section-title">Recent Orders</h2>

    <div className="admin-orders-table-wrap">
      <table className="admin-orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="admin-inventory-empty">
                Loading recent orders...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="admin-inventory-empty">
                No recent orders yet.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const actionLabel = getRecentOrderAction(row.status);
              const isLoading = actionLoadingId === row.id;

              return (
                <tr key={row.id}>
                  <td className="admin-orders-id">{row.orderId}</td>
                  <td>{row.customer}</td>
                  <td>
                    <span className={`admin-status-pill admin-status-pill--${row.status}`}>
                      {statusLabels[row.status]}
                    </span>
                  </td>
                  <td>{row.date}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-table-action"
                      disabled={isLoading}
                      onClick={() => onAction?.(row)}
                    >
                      {isLoading ? 'Loading...' : `${actionLabel} >`}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export const AdminSecondaryMetrics = ({ metrics }) => (
  <section className="admin-secondary-grid" aria-label="Secondary metrics">
    {metrics.map((metric) => {
      const Icon = secondaryIcons[metric.icon];

      return (
        <article key={metric.id} className="admin-secondary-card">
          <span className="admin-secondary-icon">
            <Icon size={20} strokeWidth={1.6} />
          </span>
          <div>
            <p className="admin-secondary-label">{metric.label}</p>
            <div className="admin-secondary-row">
              <span className="admin-secondary-value">{metric.value}</span>
              <span className={`admin-secondary-change admin-secondary-change--${metric.trend}`}>
                {metric.change}
              </span>
            </div>
          </div>
        </article>
      );
    })}
  </section>
);

export const AdminDashboardFooter = ({ links }) => (
  <footer className="admin-shell-footer">
    <div className="admin-shell-footer-links">
      {links.map((link) => {
        const Icon = footerIcons[link.icon];

        return (
          <button key={link.id} type="button" className="admin-shell-footer-link">
            <Icon size={15} strokeWidth={1.6} />
            {link.label}
          </button>
        );
      })}
    </div>

    <p className="admin-shell-footer-copy">
      <span>&copy; 2026</span>
      <BrandWordmark context="copyright" priority={false} />
      <span>. All rights reserved.</span>
    </p>
  </footer>
);
