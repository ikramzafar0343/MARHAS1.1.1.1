import React, { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineTruck } from 'react-icons/hi';
import BrandWordmark from '../components/ui/BrandWordmark';
import { Container } from '../components/ui/Layout';
import OrderConfirmationDetails from '../components/checkout/OrderConfirmationDetails';
import { useGlobalContext } from '../context/GlobalContext';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const { lastOrder, clearCart } = useGlobalContext();
  const order = lastOrder?.id === orderId ? lastOrder : null;

  useEffect(() => {
    if (order?.id === orderId) {
      clearCart();
    }
  }, [order, orderId, clearCart]);

  if (!orderId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="order-confirmation-page">
      <Container>
        <header className="order-confirmation-hero">
          <span className="order-confirmation-eyebrow">Order Confirmed</span>
          <h1 className="order-confirmation-title">Thank You For Your Order</h1>
          <p className="order-confirmation-lead">
            {order?.email ? (
              <>
                A confirmation has been sent to{' '}
                <span className="order-confirmation-email">{order.email}</span>.
              </>
            ) : (
              <>
                Your <BrandWordmark context="copy" priority={false} /> order has been placed successfully.
              </>
            )}
          </p>
        </header>

        {order ? (
          <OrderConfirmationDetails order={order} />
        ) : (
          <div className="order-confirmation-card order-confirmation-card--fallback">
            <p className="order-confirmation-fallback-label">Order Reference</p>
            <p className="order-confirmation-fallback-id">{orderId}</p>
            <p className="order-confirmation-fallback-text">
              Your order details are no longer available in this session. Please check your
              confirmation email or account for full order information.
            </p>
          </div>
        )}

        <div className="order-confirmation-assurance">
          <div className="order-confirmation-assurance-item">
            <HiOutlineTruck size={18} strokeWidth={1.5} aria-hidden="true" />
            <span>Nationwide delivery within 3–5 working days</span>
          </div>
          <div className="order-confirmation-assurance-item">
            <HiOutlineShieldCheck size={18} strokeWidth={1.5} aria-hidden="true" />
            <span>Secure checkout and protected transactions</span>
          </div>
        </div>

        <div className="order-confirmation-actions">
          <Link to="/collections/all" className="luxury-button-solid">
            Continue Shopping
          </Link>
          <Link to="/account" className="luxury-button-outline">
            View Account
          </Link>
        </div>
      </Container>
    </div>
  );
};

export default OrderConfirmation;
