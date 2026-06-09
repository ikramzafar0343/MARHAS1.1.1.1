import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AdminAnalyticsCategoryBars,
  AdminAnalyticsCharts,
  AdminAnalyticsIntro,
  AdminAnalyticsKpis,
  AdminAnalyticsTopProducts
} from '../../components/admin/AdminAnalyticsSections';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminRoute from '../../components/admin/AdminRoute';
import { ADMIN_ANALYTICS_PERIODS } from '../../constants/adminAnalytics';
import { useAdminContext } from '../../context/AdminContext';
import { getApiErrorMessage } from '../../services/authService';
import { analyticsService } from '../../services/marhasApi';

const EMPTY_CHART = { labels: [], series: [], meta: '' };

const AdminAnalyticsContent = () => {
  const navigate = useNavigate();
  const { adminUser, adminLogout } = useAdminContext();
  const [activePeriod, setActivePeriod] = useState('30d');
  const [kpis, setKpis] = useState([]);
  const [revenueChart, setRevenueChart] = useState(EMPTY_CHART);
  const [ordersChart, setOrdersChart] = useState(EMPTY_CHART);
  const [categories, setCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async (period, signal) => {
    setLoading(true);
    setError('');

    try {
      const [kpiData, revenueData, ordersData, categoryData, productData] = await Promise.all([
        analyticsService.getKpis(period),
        analyticsService.getRevenueChart(period),
        analyticsService.getOrdersChart(period),
        analyticsService.getCategoryBreakdown(period),
        analyticsService.getTopProducts(period, 5)
      ]);

      if (signal?.aborted) {
        return;
      }

      setKpis(Array.isArray(kpiData) ? kpiData : []);
      setRevenueChart(revenueData || EMPTY_CHART);
      setOrdersChart(ordersData || EMPTY_CHART);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setTopProducts(Array.isArray(productData) ? productData : []);
    } catch (fetchError) {
      if (signal?.aborted) {
        return;
      }

      setError(getApiErrorMessage(fetchError));
      setKpis([]);
      setRevenueChart(EMPTY_CHART);
      setOrdersChart(EMPTY_CHART);
      setCategories([]);
      setTopProducts([]);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadAnalytics(activePeriod, controller.signal);

    return () => {
      controller.abort();
    };
  }, [activePeriod, loadAnalytics]);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <AdminHeader adminUser={adminUser} onLogout={handleLogout} />

      <main className="admin-shell-main admin-analytics-page">
        <nav className="admin-product-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/admin">Dashboard</Link>
          <span aria-hidden="true">&gt;</span>
          <span className="admin-product-breadcrumbs-current">Analytics</span>
        </nav>

        <AdminAnalyticsIntro
          activePeriod={activePeriod}
          onPeriodChange={setActivePeriod}
          periods={ADMIN_ANALYTICS_PERIODS}
          loading={loading}
        />

        {error && <p className="admin-login-error">{error}</p>}

        <AdminAnalyticsKpis metrics={kpis} loading={loading} />
        <AdminAnalyticsCharts
          revenueChart={revenueChart}
          ordersChart={ordersChart}
          loading={loading}
        />

        <section className="admin-analytics-panels">
          <AdminAnalyticsCategoryBars categories={categories} loading={loading} />
          <AdminAnalyticsTopProducts products={topProducts} loading={loading} />
        </section>
      </main>
    </div>
  );
};

const AdminAnalytics = () => (
  <AdminRoute>
    <AdminAnalyticsContent />
  </AdminRoute>
);

export default AdminAnalytics;
