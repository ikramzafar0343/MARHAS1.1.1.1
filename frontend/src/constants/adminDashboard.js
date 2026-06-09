export const ADMIN_QUICK_ACTIONS = [
  {
    id: 'add-product',
    title: 'Add New Product',
    description: 'Create a new listing',
    icon: 'plus',
    to: '/admin/products/new'
  },
  {
    id: 'analytics',
    title: 'View Analytics',
    description: 'Track performance',
    icon: 'chart',
    to: '/admin/analytics'
  },
  {
    id: 'inventory',
    title: 'Manage Inventory',
    description: 'Update stock levels',
    icon: 'box',
    to: '/admin/inventory'
  },
  {
    id: 'orders',
    title: 'Orders Overview',
    description: 'Review all orders',
    icon: 'cart',
    to: '/admin/orders'
  },
  {
    id: 'customer-side',
    title: 'Dynamic Customer Side',
    description: 'Manage storefront content',
    icon: 'globe',
    to: '/admin/customer-side'
  }
];

export const ADMIN_PRIMARY_METRICS = [
  {
    id: 'sales',
    label: 'Total Sales',
    value: 'PKR 4.52M',
    change: '+12.5%',
    trend: 'up',
    series: [3.12, 3.28, 3.35, 3.31, 3.48, 3.62, 3.89, 4.05, 4.28, 4.52]
  },
  {
    id: 'listings',
    label: 'Active Listings',
    value: '124',
    change: '+5.2%',
    trend: 'up',
    series: [98, 102, 105, 108, 110, 112, 115, 118, 121, 124]
  },
  {
    id: 'active-orders',
    label: 'Active Orders',
    value: '47',
    change: '+8.1%',
    trend: 'up',
    series: [28, 31, 33, 32, 36, 38, 41, 43, 45, 47]
  }
];

export const getRecentOrderAction = (status) => {
  switch (status) {
    case 'pending':
      return 'Fulfill';
    case 'shipped':
      return 'Track Order';
    case 'delivered':
      return 'View Invoice';
    default:
      return 'View Order';
  }
};

export const getRecentOrderModalType = (status) => {
  switch (status) {
    case 'pending':
      return 'fulfill';
    case 'shipped':
      return 'track';
    case 'delivered':
      return 'invoice';
    default:
      return 'details';
  }
};

export const ADMIN_SECONDARY_METRICS = [
  {
    id: 'revenue',
    label: 'Monthly Revenue',
    value: 'PKR 1.24M',
    change: '+8.3%',
    trend: 'up',
    icon: 'bag'
  },
  {
    id: 'products',
    label: 'Total Products',
    value: '156',
    change: '+12',
    trend: 'up',
    icon: 'box'
  },
  {
    id: 'avg-rating',
    label: 'Average Rating',
    value: '4.8',
    change: '+0.2',
    trend: 'up',
    icon: 'star'
  },
  {
    id: 'pending-orders',
    label: 'Pending Orders',
    value: '23',
    change: '-5',
    trend: 'down',
    icon: 'list'
  }
];

export const ADMIN_ORDER_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export const ADMIN_FOOTER_LINKS = [
  { id: 'help', label: 'Help Center', icon: 'help' },
  { id: 'guidelines', label: 'Seller Guidelines', icon: 'book' },
  { id: 'support', label: 'Contact Support', icon: 'support' }
];
