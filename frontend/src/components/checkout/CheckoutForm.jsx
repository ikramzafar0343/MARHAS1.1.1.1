import React, { useState } from 'react';

const CheckoutForm = ({ formId = 'checkout-form', defaultEmail = '', defaultName = '', onSubmit, submitting = false }) => {
  const [form, setForm] = useState({
    email: defaultEmail,
    phone: '',
    fullName: defaultName,
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'cod'
  });

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form id={formId} className="checkout-form" onSubmit={handleSubmit}>
      <section className="checkout-section">
        <h2 className="checkout-section-title">Contact</h2>
        <div className="checkout-fields">
          <label className="checkout-field checkout-field--full">
            <span className="checkout-label">Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField('email')}
              placeholder="Email Address"
              autoComplete="email"
              required
              className="checkout-input"
            />
          </label>
          <label className="checkout-field checkout-field--full">
            <span className="checkout-label">Phone</span>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={updateField('phone')}
              placeholder="Phone Number"
              autoComplete="tel"
              required
              className="checkout-input"
            />
          </label>
        </div>
      </section>

      <section className="checkout-section">
        <h2 className="checkout-section-title">Shipping</h2>
        <div className="checkout-fields">
          <label className="checkout-field checkout-field--full">
            <span className="checkout-label">Full Name</span>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={updateField('fullName')}
              placeholder="Full Name"
              autoComplete="name"
              required
              className="checkout-input"
            />
          </label>
          <label className="checkout-field checkout-field--full">
            <span className="checkout-label">Address</span>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={updateField('address')}
              placeholder="Street Address"
              autoComplete="street-address"
              required
              className="checkout-input"
            />
          </label>
          <label className="checkout-field">
            <span className="checkout-label">City</span>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={updateField('city')}
              placeholder="City"
              autoComplete="address-level2"
              required
              className="checkout-input"
            />
          </label>
          <label className="checkout-field">
            <span className="checkout-label">Postal Code</span>
            <input
              type="text"
              name="postalCode"
              value={form.postalCode}
              onChange={updateField('postalCode')}
              placeholder="Postal Code"
              autoComplete="postal-code"
              required
              className="checkout-input"
            />
          </label>
        </div>
      </section>

      <section className="checkout-section">
        <h2 className="checkout-section-title">Payment</h2>
        <div className="checkout-payment-options">
          <label className="checkout-payment-option">
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={form.paymentMethod === 'cod'}
              onChange={updateField('paymentMethod')}
            />
            <span>Cash on Delivery</span>
          </label>
          <label className="checkout-payment-option">
            <input
              type="radio"
              name="paymentMethod"
              value="online"
              checked={form.paymentMethod === 'online'}
              onChange={updateField('paymentMethod')}
            />
            <span>Online Payment</span>
          </label>
        </div>
      </section>

      <button type="submit" className="checkout-submit luxury-button-solid lg:hidden" disabled={submitting}>
        {submitting ? 'Placing Order...' : 'Place Order'}
      </button>
    </form>
  );
};

export default CheckoutForm;
