import React from 'react';
import OrderItemsList from '../orders/OrderItemsList';
import CustomerModal from './CustomerModal';
import {
  CUSTOMER_ORDER_STATUS_LABELS,
  formatCustomerPrice
} from '../../constants/customerDashboard';

const TRACKING_STEPS = [
  { key: 'pending', label: 'Placed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' }
];

const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered'];

const getTrackingStepState = (stepKey, currentStatus) => {
  if (currentStatus === 'cancelled') {
    return 'cancelled';
  }

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const stepIndex = STATUS_ORDER.indexOf(stepKey);

  if (currentIndex === -1 || stepIndex === -1) {
    return 'upcoming';
  }

  if (stepIndex < currentIndex) {
    return 'complete';
  }

  if (stepIndex === currentIndex) {
    return 'active';
  }

  return 'upcoming';
};

const getLineItemTotal = (order) => {
  if (typeof order.subtotal === 'number') {
    return order.subtotal;
  }

  return (order.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
};

const CustomerOrderDetailsModal = ({ order, open, onClose }) => {
  if (!order) {
    return null;
  }

  const subtotal = getLineItemTotal(order);
  const shipping = order.shipping || {};

  return (
    <CustomerModal
      open={open}
      onClose={onClose}
      title="Order Details"
      footer={
        <button type="button" className="luxury-button-outline customer-dashboard-btn" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="customer-order-modal-head">
        <div>
          <p className="customer-order-modal-id">{order.orderId}</p>
          <p className="customer-order-modal-date">{order.date}</p>
        </div>
        <span className={`customer-order-status customer-order-status--${order.status}`}>
          {CUSTOMER_ORDER_STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {order.status !== 'cancelled' && (
        <div className="customer-order-track" aria-label="Order progress">
          {TRACKING_STEPS.map((step) => {
            const state = getTrackingStepState(step.key, order.status);
            return (
              <div key={step.key} className={`customer-order-track-step customer-order-track-step--${state}`}>
                <span className="customer-order-track-dot" aria-hidden="true" />
                <span className="customer-order-track-label">{step.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {order.status === 'cancelled' && (
        <p className="customer-order-modal-note">This order was cancelled.</p>
      )}

      <dl className="customer-order-modal-details">
        <div>
          <dt>Payment</dt>
          <dd>{order.paymentMethod || 'Cash on Delivery'}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{order.phone || '—'}</dd>
        </div>
        <div className="customer-order-modal-details-wide">
          <dt>Shipping Address</dt>
          <dd>
            {shipping.address
              ? `${shipping.address}, ${shipping.city || ''} ${shipping.postalCode || ''}`.trim()
              : '—'}
          </dd>
        </div>
      </dl>

      <OrderItemsList
        items={order.items}
        formatPrice={formatCustomerPrice}
        labelClassName="customer-order-modal-items-label"
        listClassName="order-item-list customer-order-modal-item-list"
        itemClassName="order-item-row customer-order-modal-item"
      />

      <dl className="customer-order-modal-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatCustomerPrice(subtotal)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{order.shippingFee === 0 ? 'Free' : formatCustomerPrice(order.shippingFee)}</dd>
        </div>
        {(order.taxAmount ?? 0) > 0 && (
          <div>
            <dt>
              {order.taxLabel || 'GST'}
              {order.taxRate ? ` (${order.taxRate}%)` : ''}
            </dt>
            <dd>{formatCustomerPrice(order.taxAmount)}</dd>
          </div>
        )}
        <div className="customer-order-modal-total-row">
          <dt>Total</dt>
          <dd>{formatCustomerPrice(order.total)}</dd>
        </div>
      </dl>
    </CustomerModal>
  );
};

export default CustomerOrderDetailsModal;
