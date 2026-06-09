import React from 'react';
import { Link } from 'react-router-dom';
import { useCustomerContent } from '../../context/CustomerContentContext';
import {
  formatPrice,
  getOrderTotal,
  getShippingFee,
  getTaxAmount
} from '../../utils/cart';

const CheckoutSummary = ({
  items,
  subtotal,
  itemCount,
  formId = 'checkout-form',
  submitting = false
}) => {
  const { commerceSettings } = useCustomerContent();
  const shipping = getShippingFee(subtotal, commerceSettings);
  const tax = getTaxAmount(subtotal, commerceSettings);
  const total = getOrderTotal(subtotal, commerceSettings);
  const taxLabel = commerceSettings?.taxLabel || 'GST';

  return (
    <aside className="checkout-summary" aria-label="Order summary">
      <h2 className="checkout-summary-title">Order Summary</h2>

      <ul className="checkout-summary-items">
        {items.map(({ item, product }) => (
          <li key={item.lineId} className="checkout-summary-item">
            <div className="checkout-summary-thumb">
              <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
              <span className="checkout-summary-qty">{item.quantity}</span>
            </div>
            <div className="checkout-summary-details">
              <p className="checkout-summary-name">{product.name}</p>
              <p className="checkout-summary-meta">
                {item.color} · Size {item.size}
              </p>
            </div>
            <span className="checkout-summary-price">
              {formatPrice(product.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="checkout-summary-rows">
        <div className="checkout-summary-row">
          <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="checkout-summary-row">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
        </div>
        {tax > 0 && (
          <div className="checkout-summary-row">
            <span>
              {taxLabel} ({commerceSettings?.taxRate ?? 0}%)
            </span>
            <span>{formatPrice(tax)}</span>
          </div>
        )}
      </div>

      <div className="checkout-summary-total">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      <button
        type="submit"
        form={formId}
        className="checkout-submit luxury-button-solid hidden lg:inline-flex"
        disabled={submitting}
      >
        {submitting ? 'Placing Order...' : 'Place Order'}
      </button>

      <Link to="/cart" className="checkout-back-link">
        Return to Cart
      </Link>
    </aside>
  );
};

export default CheckoutSummary;
