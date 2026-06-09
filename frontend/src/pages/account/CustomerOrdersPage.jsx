import React, { useEffect, useState } from 'react';
import { ordersService } from '../../services/marhasApi';
import { getApiErrorMessage } from '../../services/authService';
import { mapApiOrder } from '../../utils/apiMappers';
import { CustomerOrdersList } from '../../components/customer/CustomerDashboardSections';

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await ordersService.getMyOrders({ limit: 50 });
        const list = data.orders || [];
        if (active) {
          setOrders(list.map(mapApiOrder).filter(Boolean));
        }
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err));
          setOrders([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="customer-dashboard-section">
      <div className="customer-dashboard-section-head">
        <div>
          <p className="customer-dashboard-section-eyebrow">Order History</p>
          <h1 className="customer-dashboard-section-title">My Orders</h1>
        </div>
      </div>
      <CustomerOrdersList orders={orders} loading={loading} error={error} />
    </section>
  );
};

export default CustomerOrdersPage;
