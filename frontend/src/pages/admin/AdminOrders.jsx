import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AdminOrdersIntro,
  AdminOrdersModals,
  AdminOrdersStats,
  AdminOrdersTable,
  AdminOrdersToolbar,
  filterAdminOrders
} from '../../components/admin/AdminOrdersSections';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminRoute from '../../components/admin/AdminRoute';
import { useAdminContext } from '../../context/AdminContext';
import { adminOrdersService } from '../../services/marhasApi';
import { getApiErrorMessage } from '../../services/authService';
import { mapApiOrder } from '../../utils/apiMappers';

const AdminOrdersContent = () => {
  const navigate = useNavigate();
  const { adminUser, adminLogout } = useAdminContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await adminOrdersService.list({ limit: 100 });
      const list = Array.isArray(data) ? data : data?.orders || [];
      setOrders(list.map(mapApiOrder).filter(Boolean));
    } catch (err) {
      setError(getApiErrorMessage(err));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = filterAdminOrders(orders, search, activeFilter);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  const openModal = (type, order) => {
    setSelectedOrder(order);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedOrder(null);
  };

  const handleEditOrder = async (orderId, updates) => {
    try {
      const updated = await adminOrdersService.update(orderId, updates);
      const mapped = mapApiOrder(updated);
      setOrders((prev) => prev.map((order) => (order.id === orderId ? mapped : order)));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const updated = await adminOrdersService.updateStatus(orderId, status);
      const mapped = mapApiOrder(updated);
      setOrders((prev) => prev.map((order) => (order.id === orderId ? mapped : order)));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const updated = await adminOrdersService.cancel(orderId);
      const mapped = mapApiOrder(updated);
      setOrders((prev) => prev.map((order) => (order.id === orderId ? mapped : order)));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="admin-shell">
      <AdminHeader adminUser={adminUser} onLogout={handleLogout} />

      <main className="admin-shell-main admin-inventory-page">
        <nav className="admin-product-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/admin">Dashboard</Link>
          <span aria-hidden="true">&gt;</span>
          <span className="admin-product-breadcrumbs-current">Orders Overview</span>
        </nav>

        <AdminOrdersIntro />
        {error && <p className="admin-login-error">{error}</p>}
        {loading ? (
          <p className="admin-inventory-empty">Loading orders...</p>
        ) : (
          <>
            <AdminOrdersStats orders={orders} />
            <AdminOrdersToolbar
              search={search}
              onSearchChange={setSearch}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
            <AdminOrdersTable
              orders={filteredOrders}
              onView={(order) => openModal('details', order)}
              onEdit={(order) => openModal('edit', order)}
              onUpdateStatus={(order) => openModal('status', order)}
              onCancel={(order) => openModal('cancel', order)}
            />
          </>
        )}
      </main>

      <AdminOrdersModals
        activeModal={activeModal}
        selectedOrder={selectedOrder}
        onClose={closeModal}
        onEdit={handleEditOrder}
        onUpdateStatus={handleUpdateStatus}
        onCancel={handleCancelOrder}
      />
    </div>
  );
};

const AdminOrders = () => (
  <AdminRoute>
    <AdminOrdersContent />
  </AdminRoute>
);

export default AdminOrders;
