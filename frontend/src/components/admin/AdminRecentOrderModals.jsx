import React from 'react';
import OrderItemsList from '../orders/OrderItemsList';
import BrandWordmark from '../ui/BrandWordmark';
import AdminModal from './AdminModal';
import { AdminOrderDetailsModal } from './AdminOrdersSections';
import {
  ADMIN_ORDER_STATUS_LABELS,
  formatOrderPrice,
  getOrderSubtotal
} from '../../constants/adminOrders';

const TRACKING_STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' }
];

const getTrackingStepState = (stepKey, currentStatus) => {
  const order = ['pending', 'processing', 'shipped', 'delivered'];
  const currentIndex = order.indexOf(currentStatus);
  const stepIndex = order.indexOf(stepKey);

  if (currentStatus === 'cancelled') {
    return 'cancelled';
  }

  if (stepIndex < currentIndex) {
    return 'complete';
  }

  if (stepIndex === currentIndex) {
    return 'active';
  }

  return 'upcoming';
};

export const AdminOrderFulfillModal = ({ order, open, onClose, onConfirm, submitting = false }) => {
  if (!order) {
    return null;
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Fulfill Order"
      footer={
        <>
          <button type="button" className="admin-product-cancel" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="luxury-button-accent admin-product-btn"
            disabled={submitting}
            onClick={() => onConfirm(order.id)}
          >
            {submitting ? 'Updating...' : 'Start Fulfillment'}
          </button>
        </>
      }
    >
      <p className="admin-inventory-modal-copy">
        Mark order <strong>{order.orderId}</strong> for {order.customer} as processing and begin
        fulfillment?
      </p>
      <dl className="admin-inventory-details admin-orders-details">
        <div>
          <dt>Items</dt>
          <dd>{order.items?.length || 0}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{formatOrderPrice(order.total)}</dd>
        </div>
        <div>
          <dt>Ship To</dt>
          <dd>
            {order.shipping?.address}, {order.shipping?.city}
          </dd>
        </div>
      </dl>
    </AdminModal>
  );
};

export const AdminOrderTrackModal = ({ order, open, onClose }) => {
  if (!order) {
    return null;
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Track Order"
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

      <div className="admin-orders-track-shipping">
        <p className="admin-product-label">Delivery Address</p>
        <p className="admin-inventory-modal-copy">
          {order.customer}
          <br />
          {order.shipping?.address}
          <br />
          {order.shipping?.city} {order.shipping?.postalCode}
          <br />
          {order.phone}
        </p>
      </div>

      <ol className="admin-orders-track-steps">
        {TRACKING_STEPS.map((step) => {
          const state = getTrackingStepState(step.key, order.status);

          return (
            <li key={step.key} className={`admin-orders-track-step admin-orders-track-step--${state}`}>
              <span className="admin-orders-track-dot" aria-hidden="true" />
              <span className="admin-orders-track-label">{step.label}</span>
            </li>
          );
        })}
      </ol>

      <p className="admin-orders-track-note">
        Estimated delivery within 3–5 working days after dispatch.
      </p>
    </AdminModal>
  );
};

export const AdminOrderInvoiceModal = ({ order, open, onClose }) => {
  if (!order) {
    return null;
  }

  const subtotal = order.subtotal ?? getOrderSubtotal(order);

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Order Invoice"
      wide
      footer={
        <button type="button" className="luxury-button-outline admin-product-btn" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="admin-orders-invoice">
        <header className="admin-orders-invoice-head">
          <div>
            <div className="admin-orders-invoice-brand">
              <BrandWordmark context="invoice" priority={false} />
            </div>
            <p className="admin-inventory-modal-meta">Luxury Fashion</p>
          </div>
          <div className="admin-orders-invoice-meta">
            <p className="admin-orders-modal-id">{order.orderId}</p>
            <p className="admin-inventory-modal-meta">{order.date}</p>
          </div>
        </header>

        <div className="admin-orders-invoice-columns">
          <div>
            <p className="admin-product-label">Bill To</p>
            <p className="admin-inventory-modal-copy">
              {order.customer}
              <br />
              {order.email}
              <br />
              {order.phone}
            </p>
          </div>
          <div>
            <p className="admin-product-label">Ship To</p>
            <p className="admin-inventory-modal-copy">
              {order.shipping?.address}
              <br />
              {order.shipping?.city} {order.shipping?.postalCode}
            </p>
          </div>
        </div>

        <OrderItemsList
          items={order.items}
          formatPrice={(amount) => formatOrderPrice(amount)}
          label=""
          listClassName="order-item-list admin-orders-item-list admin-orders-invoice-items"
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
          <div>
            <dt>Payment</dt>
            <dd>{order.paymentMethod}</dd>
          </div>
          <div className="admin-orders-total-row">
            <dt>Total Paid</dt>
            <dd>{formatOrderPrice(order.total)}</dd>
          </div>
        </dl>
      </div>
    </AdminModal>
  );
};

export const AdminRecentOrderModals = ({
  activeModal,
  selectedOrder,
  onClose,
  onFulfill,
  submitting = false
}) => (
  <>
    <AdminOrderDetailsModal order={selectedOrder} open={activeModal === 'details'} onClose={onClose} />
    <AdminOrderFulfillModal
      order={selectedOrder}
      open={activeModal === 'fulfill'}
      onClose={onClose}
      onConfirm={onFulfill}
      submitting={submitting}
    />
    <AdminOrderTrackModal order={selectedOrder} open={activeModal === 'track'} onClose={onClose} />
    <AdminOrderInvoiceModal order={selectedOrder} open={activeModal === 'invoice'} onClose={onClose} />
  </>
);
