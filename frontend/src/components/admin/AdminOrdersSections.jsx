import React, { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineRefresh,
  HiOutlineXCircle
} from 'react-icons/hi';
import OrderItemsList from '../orders/OrderItemsList';
import AdminModal from './AdminModal';
import {
  ADMIN_ORDER_FILTERS,
  ADMIN_ORDER_STATUS_LABELS,
  ADMIN_ORDER_STATUS_OPTIONS,
  formatOrderPrice,
  getOrderSubtotal
} from '../../constants/adminOrders';

const AdminOrderIconAction = ({ label, onClick, children, tone = 'default', disabled = false }) => (
  <button
    type="button"
    className={`admin-inventory-icon-btn admin-inventory-icon-btn--${tone}`}
    aria-label={label}
    title={label}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

export const AdminOrdersIntro = () => (
  <header className="admin-inventory-intro">
    <h1 className="admin-inventory-title">Orders Overview</h1>
    <p className="admin-inventory-subtitle">
      Review customer orders, update fulfillment status, and manage delivery details.
    </p>
  </header>
);

export const AdminOrdersStats = ({ orders }) => {
  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => order.status === 'pending').length,
      processing: orders.filter((order) => order.status === 'processing').length,
      delivered: orders.filter((order) => order.status === 'delivered').length
    }),
    [orders]
  );

  return (
    <section className="admin-inventory-stats" aria-label="Orders summary">
      <article className="admin-inventory-stat-card">
        <p className="admin-inventory-stat-label">Total Orders</p>
        <p className="admin-inventory-stat-value">{stats.total}</p>
      </article>
      <article className="admin-inventory-stat-card">
        <p className="admin-inventory-stat-label">Pending</p>
        <p className="admin-inventory-stat-value admin-inventory-stat-value--warn">{stats.pending}</p>
      </article>
      <article className="admin-inventory-stat-card">
        <p className="admin-inventory-stat-label">Processing</p>
        <p className="admin-inventory-stat-value">{stats.processing}</p>
      </article>
      <article className="admin-inventory-stat-card">
        <p className="admin-inventory-stat-label">Delivered</p>
        <p className="admin-inventory-stat-value">{stats.delivered}</p>
      </article>
    </section>
  );
};

export const AdminOrdersToolbar = ({ search, onSearchChange, activeFilter, onFilterChange }) => (
  <div className="admin-inventory-toolbar">
    <label className="admin-inventory-search">
      <span className="sr-only">Search orders</span>
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by order ID or customer..."
        className="admin-product-input"
      />
    </label>

    <div className="admin-inventory-filters" role="group" aria-label="Order filters">
      {ADMIN_ORDER_FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={`admin-analytics-period ${
            activeFilter === filter.id ? 'admin-analytics-period--active' : ''
          }`}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  </div>
);

export const AdminOrdersTable = ({ orders, onView, onEdit, onUpdateStatus, onCancel }) => (
  <section className="admin-inventory-card">
    <h2 className="admin-section-title">All Orders</h2>

    <div className="admin-inventory-table-wrap">
      <table className="admin-inventory-table admin-orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={6} className="admin-inventory-empty">
                No orders match your search.
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id}>
                <td className="admin-orders-id">{order.orderId}</td>
                <td>{order.customer}</td>
                <td>{order.date}</td>
                <td>{formatOrderPrice(order.total)}</td>
                <td>
                  <span className={`admin-status-pill admin-status-pill--${order.status}`}>
                    {ADMIN_ORDER_STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td>
                  <div className="admin-inventory-actions">
                    <AdminOrderIconAction label="View order" onClick={() => onView(order)}>
                      <HiOutlineEye size={17} strokeWidth={1.6} />
                    </AdminOrderIconAction>
                    <AdminOrderIconAction label="Edit order" onClick={() => onEdit(order)}>
                      <HiOutlinePencil size={17} strokeWidth={1.6} />
                    </AdminOrderIconAction>
                    <AdminOrderIconAction label="Update status" onClick={() => onUpdateStatus(order)}>
                      <HiOutlineRefresh size={17} strokeWidth={1.6} />
                    </AdminOrderIconAction>
                    <AdminOrderIconAction
                      label="Cancel order"
                      tone="danger"
                      disabled={order.status === 'delivered' || order.status === 'cancelled'}
                      onClick={() => onCancel(order)}
                    >
                      <HiOutlineXCircle size={17} strokeWidth={1.6} />
                    </AdminOrderIconAction>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export const AdminOrderDetailsModal = ({ order, open, onClose }) => {
  if (!order) {
    return null;
  }

  const subtotal = getOrderSubtotal(order);

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Order Details"
      wide
      footer={
        <button type="button" className="luxury-button-outline admin-product-btn" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="admin-orders-modal-head">
        <div>
          <p className="admin-orders-modal-id">{order.orderId}</p>
          <p className="admin-inventory-modal-meta">{order.date}</p>
        </div>
        <span className={`admin-status-pill admin-status-pill--${order.status}`}>
          {ADMIN_ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <dl className="admin-inventory-details admin-orders-details">
        <div>
          <dt>Customer</dt>
          <dd>{order.customer}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{order.email}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{order.phone}</dd>
        </div>
        <div>
          <dt>Payment</dt>
          <dd>{order.paymentMethod}</dd>
        </div>
        <div>
          <dt>Shipping Address</dt>
          <dd>
            {order.shipping.address}, {order.shipping.city} {order.shipping.postalCode}
          </dd>
        </div>
      </dl>

      <OrderItemsList
        items={order.items}
        formatPrice={(amount) => formatOrderPrice(amount)}
        labelClassName="admin-product-label"
        listClassName="order-item-list admin-orders-item-list"
        itemClassName="order-item-row admin-orders-item-row"
      />

      <dl className="admin-orders-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatOrderPrice(subtotal)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{order.shippingFee === 0 ? 'Free' : formatOrderPrice(order.shippingFee)}</dd>
        </div>
        {(order.taxAmount ?? 0) > 0 && (
          <div>
            <dt>
              {order.taxLabel || 'GST'}
              {order.taxRate ? ` (${order.taxRate}%)` : ''}
            </dt>
            <dd>{formatOrderPrice(order.taxAmount)}</dd>
          </div>
        )}
        <div className="admin-orders-total-row">
          <dt>Total</dt>
          <dd>{formatOrderPrice(order.total)}</dd>
        </div>
      </dl>
    </AdminModal>
  );
};

const AdminOrderEditModal = ({ order, open, onClose, onSave }) => {
  const [form, setForm] = useState({
    customer: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  useEffect(() => {
    if (order) {
      setForm({
        customer: order.customer,
        email: order.email,
        phone: order.phone,
        address: order.shipping.address,
        city: order.shipping.city,
        postalCode: order.shipping.postalCode
      });
    }
  }, [order]);

  if (!order) {
    return null;
  }

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(order.id, {
      customer: form.customer.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      shipping: {
        address: form.address.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim()
      }
    });
    onClose();
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Edit Order"
      footer={
        <>
          <button type="button" className="admin-product-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="admin-edit-order-form" className="luxury-button-accent admin-product-btn">
            Save Changes
          </button>
        </>
      }
    >
      <form id="admin-edit-order-form" className="admin-inventory-modal-form" onSubmit={handleSubmit}>
        <label className="admin-product-field">
          <span className="admin-product-label">Customer Name</span>
          <input
            type="text"
            value={form.customer}
            onChange={updateField('customer')}
            required
            className="admin-product-input"
          />
        </label>

        <label className="admin-product-field">
          <span className="admin-product-label">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={updateField('email')}
            required
            className="admin-product-input"
          />
        </label>

        <label className="admin-product-field">
          <span className="admin-product-label">Phone</span>
          <input
            type="tel"
            value={form.phone}
            onChange={updateField('phone')}
            required
            className="admin-product-input"
          />
        </label>

        <label className="admin-product-field">
          <span className="admin-product-label">Address</span>
          <input
            type="text"
            value={form.address}
            onChange={updateField('address')}
            required
            className="admin-product-input"
          />
        </label>

        <label className="admin-product-field">
          <span className="admin-product-label">City</span>
          <input
            type="text"
            value={form.city}
            onChange={updateField('city')}
            required
            className="admin-product-input"
          />
        </label>

        <label className="admin-product-field">
          <span className="admin-product-label">Postal Code</span>
          <input
            type="text"
            value={form.postalCode}
            onChange={updateField('postalCode')}
            required
            className="admin-product-input"
          />
        </label>
      </form>
    </AdminModal>
  );
};

const AdminOrderStatusModal = ({ order, open, onClose, onSave }) => {
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    if (order) {
      setStatus(order.status);
    }
  }, [order]);

  if (!order) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(order.id, status);
    onClose();
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Update Order Status"
      footer={
        <>
          <button type="button" className="admin-product-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="admin-order-status-form" className="luxury-button-accent admin-product-btn">
            Update Status
          </button>
        </>
      }
    >
      <form id="admin-order-status-form" className="admin-inventory-modal-form" onSubmit={handleSubmit}>
        <p className="admin-inventory-modal-copy">
          Update fulfillment status for <strong>{order.orderId}</strong>.
        </p>
        <label className="admin-product-field">
          <span className="admin-product-label">Order Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="admin-product-input admin-product-select"
          >
            {ADMIN_ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </form>
    </AdminModal>
  );
};

const AdminOrderCancelModal = ({ order, open, onClose, onConfirm }) => {
  if (!order) {
    return null;
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Cancel Order"
      footer={
        <>
          <button type="button" className="admin-product-cancel" onClick={onClose}>
            Keep Order
          </button>
          <button
            type="button"
            className="luxury-button-accent admin-product-btn admin-inventory-delete-btn"
            onClick={() => {
              onConfirm(order.id);
              onClose();
            }}
          >
            Cancel Order
          </button>
        </>
      }
    >
      <p className="admin-inventory-modal-copy">
        Cancel order <strong>{order.orderId}</strong> for {order.customer}? This will mark the order as cancelled.
      </p>
    </AdminModal>
  );
};

export const AdminOrdersModals = ({
  activeModal,
  selectedOrder,
  onClose,
  onEdit,
  onUpdateStatus,
  onCancel
}) => (
  <>
    <AdminOrderDetailsModal order={selectedOrder} open={activeModal === 'details'} onClose={onClose} />
    <AdminOrderEditModal order={selectedOrder} open={activeModal === 'edit'} onClose={onClose} onSave={onEdit} />
    <AdminOrderStatusModal
      order={selectedOrder}
      open={activeModal === 'status'}
      onClose={onClose}
      onSave={onUpdateStatus}
    />
    <AdminOrderCancelModal
      order={selectedOrder}
      open={activeModal === 'cancel'}
      onClose={onClose}
      onConfirm={onCancel}
    />
  </>
);

export const filterAdminOrders = (orders, search, activeFilter) => {
  const query = search.trim().toLowerCase();

  return orders.filter((order) => {
    const matchesFilter = activeFilter === 'all' || order.status === activeFilter;
    const matchesSearch =
      !query ||
      order.orderId.toLowerCase().includes(query) ||
      order.customer.toLowerCase().includes(query) ||
      order.email.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });
};
