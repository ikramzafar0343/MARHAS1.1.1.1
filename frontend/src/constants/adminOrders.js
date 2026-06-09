export const ADMIN_ORDER_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export const ADMIN_ORDER_FILTERS = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' }
];

export const ADMIN_ORDER_STATUS_OPTIONS = Object.entries(ADMIN_ORDER_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const formatOrderPrice = (amount) => `PKR ${amount.toLocaleString('en-PK')}`;

export const ADMIN_ORDERS = [
  {
    id: 1,
    orderId: '#MH-10241',
    customer: 'Ayesha Khan',
    email: 'ayesha.khan@email.com',
    phone: '+92 300 1234567',
    status: 'processing',
    date: 'Jan 15, 2026',
    total: 45500,
    shippingFee: 0,
    paymentMethod: 'Cash on Delivery',
    shipping: {
      address: '12 Gulberg III',
      city: 'Lahore',
      postalCode: '54000'
    },
    items: [
      {
        name: 'Embroidered Silk Ensemble',
        quantity: 1,
        size: 'M',
        color: 'Ivory Gold',
        price: 45000
      }
    ]
  },
  {
    id: 2,
    orderId: '#MH-10238',
    customer: 'Sara Malik',
    email: 'sara.malik@email.com',
    phone: '+92 321 9876543',
    status: 'pending',
    date: 'Jan 14, 2026',
    total: 39000,
    shippingFee: 500,
    paymentMethod: 'Cash on Delivery',
    shipping: {
      address: '45 DHA Phase 5',
      city: 'Karachi',
      postalCode: '75500'
    },
    items: [
      {
        name: 'Velvet Luxury Kurta',
        quantity: 1,
        size: 'S',
        color: 'Soft Sand',
        price: 38500
      }
    ]
  },
  {
    id: 3,
    orderId: '#MH-10235',
    customer: 'Fatima Noor',
    email: 'fatima.noor@email.com',
    phone: '+92 333 5551212',
    status: 'shipped',
    date: 'Jan 13, 2026',
    total: 52000,
    shippingFee: 0,
    paymentMethod: 'Cash on Delivery',
    shipping: {
      address: '8 F-7 Markaz',
      city: 'Islamabad',
      postalCode: '44000'
    },
    items: [
      {
        name: 'Chiffon Draped Saree',
        quantity: 1,
        size: 'M',
        color: 'Rose Blush',
        price: 52000
      }
    ]
  },
  {
    id: 4,
    orderId: '#MH-10229',
    customer: 'Zainab Ali',
    email: 'zainab.ali@email.com',
    phone: '+92 345 2228899',
    status: 'delivered',
    date: 'Jan 12, 2026',
    total: 65000,
    shippingFee: 0,
    paymentMethod: 'Cash on Delivery',
    shipping: {
      address: '22 Model Town',
      city: 'Lahore',
      postalCode: '54700'
    },
    items: [
      {
        name: 'Pearl Embellished Gown',
        quantity: 1,
        size: 'L',
        color: 'Ivory Gold',
        price: 65000
      }
    ]
  },
  {
    id: 5,
    orderId: '#MH-10224',
    customer: 'Hira Shah',
    email: 'hira.shah@email.com',
    phone: '+92 312 7788990',
    status: 'processing',
    date: 'Jan 11, 2026',
    total: 84500,
    shippingFee: 0,
    paymentMethod: 'Cash on Delivery',
    shipping: {
      address: '3 Bahria Town',
      city: 'Rawalpindi',
      postalCode: '46000'
    },
    items: [
      {
        name: 'Organza Evening Suit',
        quantity: 1,
        size: 'M',
        color: 'Deep Charcoal',
        price: 42000
      },
      {
        name: 'Cotton Silk Kameez',
        quantity: 1,
        size: 'S',
        color: 'Soft Sand',
        price: 28500
      }
    ]
  },
  {
    id: 6,
    orderId: '#MH-10218',
    customer: 'Mariam Siddiqui',
    email: 'mariam.s@email.com',
    phone: '+92 301 4455667',
    status: 'cancelled',
    date: 'Jan 10, 2026',
    total: 55000,
    shippingFee: 0,
    paymentMethod: 'Cash on Delivery',
    shipping: {
      address: '17 Clifton Block 2',
      city: 'Karachi',
      postalCode: '75600'
    },
    items: [
      {
        name: 'Zardozi Anarkali',
        quantity: 1,
        size: 'M',
        color: 'Onyx Black',
        price: 55000
      }
    ]
  },
  {
    id: 7,
    orderId: '#MH-10212',
    customer: 'Noor Fatima',
    email: 'noor.f@email.com',
    phone: '+92 322 3344556',
    status: 'pending',
    date: 'Jan 9, 2026',
    total: 78500,
    shippingFee: 0,
    paymentMethod: 'Cash on Delivery',
    shipping: {
      address: '9 Satellite Town',
      city: 'Gujranwala',
      postalCode: '52250'
    },
    items: [
      {
        name: 'Brocade Lehenga Set',
        quantity: 1,
        size: 'L',
        color: 'Ivory Gold',
        price: 78000
      }
    ]
  },
  {
    id: 8,
    orderId: '#MH-10208',
    customer: 'Amna Raza',
    email: 'amna.raza@email.com',
    phone: '+92 300 9988776',
    status: 'shipped',
    date: 'Jan 8, 2026',
    total: 42500,
    shippingFee: 500,
    paymentMethod: 'Cash on Delivery',
    shipping: {
      address: '4 Mall Road',
      city: 'Multan',
      postalCode: '60000'
    },
    items: [
      {
        name: 'Organza Evening Suit',
        quantity: 1,
        size: 'XS',
        color: 'Rose Blush',
        price: 42000
      }
    ]
  }
];

export const getOrderSubtotal = (order) =>
  order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
