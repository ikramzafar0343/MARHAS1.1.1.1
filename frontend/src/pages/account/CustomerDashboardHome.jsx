import React, { useEffect, useState } from 'react';
import { useGlobalContext } from '../../context/GlobalContext';
import { ordersService } from '../../services/marhasApi';
import { getApiErrorMessage } from '../../services/authService';
import { mapApiOrder } from '../../utils/apiMappers';
import {
  CustomerDashboardStats,
  CustomerDashboardWelcome,
  CustomerRecentOrders
} from '../../components/customer/CustomerDashboardSections';

const CustomerDashboardHome = () => {
  const { user, wishlistCount, cartCount } = useGlobalContext();
  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await ordersService.getMyOrders({ limit: 3 });
        const list = data.orders || [];
        if (active) {
          setOrders(list.map(mapApiOrder).filter(Boolean));
          setOrdersTotal(data.pagination?.total ?? list.length);
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
    <>
      <CustomerDashboardWelcome name={user?.name} email={user?.email} />
      <CustomerDashboardStats
        ordersCount={ordersTotal}
        wishlistCount={wishlistCount}
        cartCount={cartCount}
      />
      <CustomerRecentOrders orders={orders} loading={loading} error={error} />
    </>
  );
};

export default CustomerDashboardHome;
