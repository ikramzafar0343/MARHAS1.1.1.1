import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import BrandWordmark from '../components/ui/BrandWordmark';
import { Container } from '../components/ui/Layout';
import SectionIntro from '../components/ui/SectionIntro';
import CheckoutForm from '../components/checkout/CheckoutForm';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import { useCustomerContent } from '../context/CustomerContentContext';
import { useGlobalContext } from '../context/GlobalContext';
import { getFreeShippingNote } from '../constants/commerceDefaults';
import { getApiErrorMessage } from '../services/authService';
import { resolveCartItems } from '../utils/cart';

const CHECKOUT_FORM_ID = 'checkout-form';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartCount, cartSubtotal, user, placeOrder } = useGlobalContext();
  const { commerceSettings } = useCustomerContent();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const freeShippingNote = getFreeShippingNote(commerceSettings);

  const resolvedItems = useMemo(() => resolveCartItems(cartItems), [cartItems]);

  if (cartCount === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handlePlaceOrder = async (formData) => {
    setSubmitting(true);
    setError('');

    try {
      const orderId = await placeOrder(formData);
      navigate(`/order-confirmation/${orderId}`, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <Container>
        <SectionIntro
          centered={false}
          className="checkout-intro"
          eyebrow="Checkout"
          title="Complete Your Order"
          description={
            <>
              Enter your details to finalize your <BrandWordmark context="copy" priority={false} />{' '}
              purchase.
            </>
          }
        />

        {error && <p className="auth-form-error checkout-error">{error}</p>}

        <div className="checkout-layout">
          <CheckoutForm
            formId={CHECKOUT_FORM_ID}
            defaultEmail={user?.email || ''}
            defaultName={user?.name || ''}
            onSubmit={handlePlaceOrder}
            submitting={submitting}
          />

          <CheckoutSummary
            formId={CHECKOUT_FORM_ID}
            items={resolvedItems}
            subtotal={cartSubtotal}
            itemCount={cartCount}
            submitting={submitting}
          />
        </div>

        <p className="checkout-note">
          {freeShippingNote ? `${freeShippingNote} ` : null}
          <Link to="/collections/all" className="checkout-note-link">
            Continue shopping
          </Link>
        </p>
      </Container>
    </div>
  );
};

export default Checkout;
