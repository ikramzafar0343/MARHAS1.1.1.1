import React, { useMemo } from 'react';
import {
  formatOrderDate,
  formatPaymentMethod,
  formatPrice,
  resolveCartItems
} from '../../utils/cart';

const OrderConfirmationDetails = ({ order }) => {
  const resolvedItems = useMemo(
    () => (order?.items ? resolveCartItems(order.items) : []),
    [order?.items]
  );

  if (!order) {
    return null;
  }

  const shipping = order.shippingFee ?? 0;
  const tax = order.taxAmount ?? 0;
  const taxLabel = order.taxLabel || 'GST';
  const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="order-confirmation-card">
      <div className="order-confirmation-meta">
        <div className="order-confirmation-meta-item">
          <span className="order-confirmation-meta-label">Order Reference</span>
          <span className="order-confirmation-meta-value">{order.id}</span>
        </div>
        <div className="order-confirmation-meta-item">
          <span className="order-confirmation-meta-label">Order Date</span>
          <span className="order-confirmation-meta-value">{formatOrderDate(order.createdAt)}</span>
        </div>
        <div className="order-confirmation-meta-item">
          <span className="order-confirmation-meta-label">Payment</span>
          <span className="order-confirmation-meta-value">
            {formatPaymentMethod(order.paymentMethod)}
          </span>
        </div>
      </div>

      <ul className="order-confirmation-items">
        {resolvedItems.map(({ item, product }) => (
          <li key={item.lineId} className="order-confirmation-item">
            <div className="order-confirmation-thumb">
              <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
            </div>
            <div className="order-confirmation-item-body">
              <p className="order-confirmation-item-name">{product.name}</p>
              <p className="order-confirmation-item-meta">
                {item.color} · Size {item.size} · Qty {item.quantity}
              </p>
            </div>
            <span className="order-confirmation-item-price">
              {formatPrice(product.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="order-confirmation-totals">
        <div className="order-confirmation-total-row">
          <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div className="order-confirmation-total-row">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
        </div>
        {tax > 0 && (
          <div className="order-confirmation-total-row">
            <span>
              {taxLabel}
              {order.taxRate ? ` (${order.taxRate}%)` : ''}
            </span>
            <span>{formatPrice(tax)}</span>
          </div>
        )}
        <div className="order-confirmation-total-row order-confirmation-total-row--final">
          <span>Total Paid</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {(order.fullName || order.address) && (
        <div className="order-confirmation-shipping">
          <h2 className="order-confirmation-shipping-title">Delivery Details</h2>
          <p className="order-confirmation-shipping-name">{order.fullName}</p>
          <p className="order-confirmation-shipping-text">{order.address}</p>
          <p className="order-confirmation-shipping-text">
            {[order.city, order.postalCode].filter(Boolean).join(', ')}
          </p>
          {order.phone && <p className="order-confirmation-shipping-text">{order.phone}</p>}
        </div>
      )}
    </div>
  );
};

export default OrderConfirmationDetails;
