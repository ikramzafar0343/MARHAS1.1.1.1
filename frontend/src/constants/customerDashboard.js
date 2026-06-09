export const CUSTOMER_DASHBOARD_NAV = [
  { id: 'dashboard', label: 'Dashboard', path: '/account' },
  { id: 'orders', label: 'Orders', path: '/account/orders' },
  { id: 'wishlist', label: 'Wishlist', path: '/wishlist', external: true },
  { id: 'settings', label: 'Settings', path: '/account/settings' }
];

export const CUSTOMER_ORDER_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export const formatCustomerPrice = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString('en-PK')}`;

export const getCustomerFirstName = (name = '') => {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Member';
  }
  return trimmed.split(/\s+/)[0];
};
