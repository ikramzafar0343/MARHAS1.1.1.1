import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerContent } from '../../context/CustomerContentContext';
import { formatPrice, getOrderTotal, getShippingFee, getTaxAmount } from '../../utils/cart';

const OrderSummary = ({
  subtotal,
  itemCount,
  checkoutHref = '/checkout',
  continueShoppingHref = '/collections/all'
}) => {
  const [coupon, setCoupon] = useState('');
  const { commerceSettings } = useCustomerContent();
  const shipping = getShippingFee(subtotal, commerceSettings);
  const tax = getTaxAmount(subtotal, commerceSettings);
  const total = getOrderTotal(subtotal, commerceSettings);
  const taxLabel = commerceSettings?.taxLabel || 'GST';

  return (
    <aside className="order-summary" aria-label="Order summary">
      <h2 className="order-summary-title">Order Summary</h2>

      <div className="order-summary-rows">
        <div className="order-summary-row">
          <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="order-summary-row order-summary-row--stacked">
          <div>
            <span>Shipping</span>
            <p className="order-summary-note">
              {shipping === 0 ? 'Free shipping applied' : 'Standard nationwide delivery'}
            </p>
          </div>
          <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
        </div>
        {tax > 0 && (
          <div className="order-summary-row">
            <span>
              {taxLabel} ({commerceSettings?.taxRate ?? 0}%)
            </span>
            <span>{formatPrice(tax)}</span>
          </div>
        )}
      </div>

      <div className="order-summary-total">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      <div className="order-summary-coupon">
        <input
          type="text"
          value={coupon}
          onChange={(event) => setCoupon(event.target.value)}
          placeholder="Enter Coupon Code"
          className="order-summary-coupon-input"
          aria-label="Coupon code"
        />
        <button type="button" className="order-summary-coupon-apply">
          Apply
        </button>
      </div>

      <Link to={checkoutHref} className="order-summary-checkout luxury-button-solid">
        Proceed to Checkout
      </Link>

      <Link to={continueShoppingHref} className="order-summary-continue">
        Continue Shopping
      </Link>
    </aside>
  );
};

export default OrderSummary;
