import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandWordmark from '../ui/BrandWordmark';
import {
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineSparkles,
  HiOutlineTruck
} from 'react-icons/hi';
import CustomerAvatar from './CustomerAvatar';
import CustomerOrderDetailsModal from './CustomerOrderDetailsModal';
import {
  CUSTOMER_ORDER_STATUS_LABELS,
  formatCustomerPrice,
  getCustomerFirstName
} from '../../constants/customerDashboard';

export const CustomerDashboardWelcome = ({ name, email }) => (
  <section className="customer-dashboard-hero">
    <div>
      <p className="customer-dashboard-eyebrow">Member Dashboard</p>
      <h1 className="customer-dashboard-title">Welcome back, {getCustomerFirstName(name)}</h1>
      <p className="customer-dashboard-lead">{email || 'Manage your orders and saved pieces.'}</p>
    </div>
    <div className="customer-dashboard-hero-actions">
      <Link to="/collections/all" className="luxury-button-solid customer-dashboard-btn">
        Shop New
      </Link>
      <Link to="/account/orders" className="luxury-button-outline customer-dashboard-btn">
        View Orders
      </Link>
    </div>
  </section>
);

export const CustomerDashboardStats = ({ ordersCount, wishlistCount, cartCount }) => {
  const stats = [
    { id: 'orders', label: 'Orders', value: ordersCount, icon: HiOutlineTruck },
    { id: 'wishlist', label: 'Wishlist', value: wishlistCount, icon: HiOutlineHeart },
    { id: 'cart', label: 'Cart Items', value: cartCount, icon: HiOutlineShoppingBag }
  ];

  return (
    <section className="customer-dashboard-stats" aria-label="Account overview">
      {stats.map(({ id, label, value, icon: Icon }) => (
        <article key={id} className="customer-dashboard-stat">
          <span className="customer-dashboard-stat-icon" aria-hidden="true">
            <Icon size={18} strokeWidth={1.6} />
          </span>
          <p className="customer-dashboard-stat-value">{value}</p>
          <p className="customer-dashboard-stat-label">{label}</p>
        </article>
      ))}
    </section>
  );
};

const CustomerOrderStatusPill = ({ status }) => (
  <span className={`customer-order-status customer-order-status--${status}`}>
    {CUSTOMER_ORDER_STATUS_LABELS[status] || status}
  </span>
);

export const CustomerOrderCard = ({ order, onViewDetails }) => (
  <article className="customer-order-card">
    <div className="customer-order-card-head">
      <div>
        <p className="customer-order-card-id">{order.orderId}</p>
        <p className="customer-order-card-date">{order.date}</p>
      </div>
      <CustomerOrderStatusPill status={order.status} />
    </div>

    <ul className="customer-order-card-items">
      {(order.items || []).slice(0, 2).map((item, index) => (
        <li key={`${item.name}-${index}`}>
          {item.name}
          {item.quantity > 1 ? ` × ${item.quantity}` : ''}
        </li>
      ))}
      {order.items?.length > 2 && (
        <li className="customer-order-card-more">+{order.items.length - 2} more items</li>
      )}
    </ul>

    <div className="customer-order-card-foot">
      <p className="customer-order-card-total">{formatCustomerPrice(order.total)}</p>
      {onViewDetails ? (
        <button type="button" className="customer-order-card-link" onClick={() => onViewDetails(order)}>
          View details
        </button>
      ) : (
        <Link to="/account/orders" className="customer-order-card-link">
          View details
        </Link>
      )}
    </div>
  </article>
);

export const CustomerRecentOrders = ({ orders, loading, error }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
  <section className="customer-dashboard-section">
    <div className="customer-dashboard-section-head">
      <div>
        <p className="customer-dashboard-section-eyebrow">Recent Activity</p>
        <h2 className="customer-dashboard-section-title">Your Orders</h2>
      </div>
      <Link to="/account/orders" className="customer-dashboard-section-link">
        View all
      </Link>
    </div>

    {loading && <p className="customer-dashboard-empty">Loading orders...</p>}
    {!loading && error && <p className="customer-dashboard-error">{error}</p>}
    {!loading && !error && orders.length === 0 && (
      <div className="customer-dashboard-empty-card">
        <HiOutlineSparkles size={22} strokeWidth={1.5} />
        <p>No orders yet. Explore the latest collection.</p>
        <Link to="/collections/all" className="luxury-button-outline customer-dashboard-btn">
          Browse Collections
        </Link>
      </div>
    )}
    {!loading && !error && orders.length > 0 && (
      <div className="customer-dashboard-orders">
        {orders.map((order) => (
          <CustomerOrderCard key={order.id} order={order} onViewDetails={setSelectedOrder} />
        ))}
      </div>
    )}

    <CustomerOrderDetailsModal
      order={selectedOrder}
      open={Boolean(selectedOrder)}
      onClose={() => setSelectedOrder(null)}
    />
  </section>
  );
};

export const CustomerOrdersList = ({ orders, loading, error }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  if (loading) {
    return <p className="customer-dashboard-empty">Loading orders...</p>;
  }

  if (error) {
    return <p className="customer-dashboard-error">{error}</p>;
  }

  if (!orders.length) {
    return (
      <div className="customer-dashboard-empty-card">
        <p>You have not placed any orders yet.</p>
        <Link to="/collections/all" className="luxury-button-outline customer-dashboard-btn">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="customer-dashboard-orders customer-dashboard-orders--stack">
        {orders.map((order) => (
          <CustomerOrderCard key={order.id} order={order} onViewDetails={setSelectedOrder} />
        ))}
      </div>

      <CustomerOrderDetailsModal
        order={selectedOrder}
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      />
    </>
  );
};

export const CustomerSettingsPanel = ({ user, onSignOut, onAvatarUpload, avatarUploading = false, avatarError = '' }) => {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !onAvatarUpload) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const result = await onAvatarUpload(file);
    URL.revokeObjectURL(objectUrl);

    if (result?.success) {
      setPreviewUrl(null);
    }
  };

  const displayUser = previewUrl ? { ...user, avatarUrl: previewUrl } : user;

  return (
  <section className="customer-dashboard-section">
    <div className="customer-dashboard-section-head">
      <div>
        <p className="customer-dashboard-section-eyebrow">Account</p>
        <h2 className="customer-dashboard-section-title">Profile Settings</h2>
      </div>
    </div>

    <div className="customer-settings-card">
      <div className="customer-settings-avatar-block">
        <button
          type="button"
          className="customer-settings-avatar-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={avatarUploading}
          aria-label="Upload profile photo"
        >
          <span className="customer-settings-avatar">
            <CustomerAvatar
              user={displayUser}
              className="customer-settings-avatar-initial"
              imageClassName="customer-settings-avatar-image"
            />
          </span>
          <span className="customer-settings-avatar-overlay">
            {avatarUploading ? 'Uploading...' : 'Change photo'}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="customer-settings-avatar-input"
          onChange={handleFileChange}
        />
        <p className="customer-settings-avatar-hint">JPG, PNG or WebP · Max 2MB</p>
        {avatarError && <p className="customer-dashboard-error">{avatarError}</p>}
      </div>

      <dl className="customer-settings-fields">
        <div className="customer-settings-field">
          <dt>Full Name</dt>
          <dd>{user?.name || '—'}</dd>
        </div>
        <div className="customer-settings-field">
          <dt>Email</dt>
          <dd>{user?.email || '—'}</dd>
        </div>
        <div className="customer-settings-field">
          <dt>Member Since</dt>
          <dd className="customer-settings-brand">
            <BrandWordmark context="copy" priority={false} /> Client
          </dd>
        </div>
      </dl>

      <div className="customer-settings-actions">
        <Link to="/contact" className="luxury-button-outline customer-dashboard-btn">
          Contact Support
        </Link>
        <button type="button" className="luxury-button-solid customer-dashboard-btn" onClick={onSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  </section>
  );
};
