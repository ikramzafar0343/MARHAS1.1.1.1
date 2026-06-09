import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminRoute from '../../components/admin/AdminRoute';
import AdminHeader from '../../components/admin/AdminHeader';
import { AdminRecentOrderModals } from '../../components/admin/AdminRecentOrderModals';
import {
  AdminPrimaryMetrics,
  AdminQuickActions,
  AdminRecentOrders,
  AdminWelcomeBar
} from '../../components/admin/AdminDashboardSections';
import {
  ADMIN_QUICK_ACTIONS,
  ADMIN_ORDER_STATUS_LABELS,
  getRecentOrderModalType
} from '../../constants/adminDashboard';
import { useAdminContext } from '../../context/AdminContext';
import { getApiErrorMessage } from '../../services/authService';
import { adminOrdersService, dashboardService } from '../../services/marhasApi';
import { mapApiOrder } from '../../utils/apiMappers';
import { formatOrderDate } from '../../utils/cart';

const mapRecentOrderRow = (order) => {
  const orderNumber = order.orderId || order.orderNumber || '';
  const normalizedId = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber.replace(/^#/, '')}`;

  return {
    id: order.id || order._id,
    orderId: normalizedId,
    customer: order.customer,
    status: order.status,
    date: order.date || formatOrderDate(order.createdAt)
  };
};

const AdminDashboardContent = () => {
  const navigate = useNavigate();
  const { adminUser, adminLogout } = useAdminContext();
  const [recentOrders, setRecentOrders] = useState([]);
  const [primaryMetrics, setPrimaryMetrics] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [metricsError, setMetricsError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadRecentOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError('');

    try {
      const data = await dashboardService.getRecentOrders(5);
      const list = Array.isArray(data) ? data : [];
      setRecentOrders(list.map(mapRecentOrderRow).filter((row) => row.id));
    } catch (error) {
      setOrdersError(getApiErrorMessage(error));
      setRecentOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    setMetricsError('');

    try {
      const data = await dashboardService.getMetrics();
      setPrimaryMetrics(Array.isArray(data?.primary) ? data.primary : []);
    } catch (error) {
      setMetricsError(getApiErrorMessage(error));
      setPrimaryMetrics([]);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    loadRecentOrders();
    loadMetrics();
  }, [loadRecentOrders, loadMetrics]);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedOrder(null);
  };

  const handleOrderAction = async (row) => {
    setActionLoadingId(row.id);
    setOrdersError('');

    try {
      const order = await adminOrdersService.getById(row.id);
      const mapped = mapApiOrder(order);
      setSelectedOrder(mapped);
      setActiveModal(getRecentOrderModalType(row.status));
    } catch (error) {
      setOrdersError(getApiErrorMessage(error));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFulfill = async (orderId) => {
    setSubmitting(true);
    setOrdersError('');

    try {
      await adminOrdersService.updateStatus(orderId, 'processing');
      closeModal();
      await Promise.all([loadRecentOrders(), loadMetrics()]);
    } catch (error) {
      setOrdersError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-shell">
      <AdminHeader adminUser={adminUser} onLogout={handleLogout} />

      <main className="admin-shell-main">
        <AdminWelcomeBar adminUser={adminUser} />
        <AdminQuickActions actions={ADMIN_QUICK_ACTIONS} />
        {metricsError && <p className="admin-login-error">{metricsError}</p>}
        <AdminPrimaryMetrics metrics={primaryMetrics} loading={loadingMetrics} />
        {ordersError && <p className="admin-login-error">{ordersError}</p>}
        <AdminRecentOrders
          rows={recentOrders}
          statusLabels={ADMIN_ORDER_STATUS_LABELS}
          loading={loadingOrders}
          actionLoadingId={actionLoadingId}
          onAction={handleOrderAction}
        />
      </main>

      <AdminRecentOrderModals
        activeModal={activeModal}
        selectedOrder={selectedOrder}
        onClose={closeModal}
        onFulfill={handleFulfill}
        submitting={submitting}
      />
    </div>
  );
};

const AdminDashboard = () => (
  <AdminRoute>
    <AdminDashboardContent />
  </AdminRoute>
);

export default AdminDashboard;
