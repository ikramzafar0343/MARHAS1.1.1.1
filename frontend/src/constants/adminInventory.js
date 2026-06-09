import product11 from '../assets/images/product1.1.jpg';
import product21 from '../assets/images/product2.1.jpg';
import product3 from '../assets/images/product3.jpg';
import product41 from '../assets/images/product4.1.jpg';

export const ADMIN_INVENTORY_FILTERS = [
  { id: 'all', label: 'All Items' },
  { id: 'in-stock', label: 'In Stock' },
  { id: 'low-stock', label: 'Low Stock' },
  { id: 'out-of-stock', label: 'Out of Stock' }
];

export const ADMIN_INVENTORY_CATEGORY_LABELS = {
  new: 'New Arrivals',
  summer: 'Summer',
  rtw: 'Ready To Wear',
  unstitched: 'Unstitched',
  luxury: 'Luxury'
};

export const ADMIN_INVENTORY_CATEGORIES = Object.entries(ADMIN_INVENTORY_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const ADMIN_INVENTORY_LOW_STOCK_THRESHOLD = 10;

export const getInventoryStatus = (stock, threshold = ADMIN_INVENTORY_LOW_STOCK_THRESHOLD) => {
  if (stock <= 0) {
    return 'out-of-stock';
  }

  if (stock <= threshold) {
    return 'low-stock';
  }

  return 'in-stock';
};

export const ADMIN_INVENTORY_STATUS_LABELS = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock'
};

export const ADMIN_INVENTORY_ITEMS = [
  {
    id: 1,
    name: 'Embroidered Silk Ensemble',
    sku: 'M.0001',
    category: 'new',
    stock: 24,
    price: 45000,
    image: product11
  },
  {
    id: 2,
    name: 'Velvet Luxury Kurta',
    sku: 'M.0002',
    category: 'summer',
    stock: 8,
    price: 38500,
    image: product21
  },
  {
    id: 3,
    name: 'Chiffon Draped Saree',
    sku: 'M.0003',
    category: 'summer',
    stock: 0,
    price: 52000,
    image: product3
  },
  {
    id: 4,
    name: 'Pearl Embellished Gown',
    sku: 'M.0004',
    category: 'new',
    stock: 15,
    price: 65000,
    image: product41
  },
  {
    id: 5,
    name: 'Organza Evening Suit',
    sku: 'M.0005',
    category: 'rtw',
    stock: 6,
    price: 42000,
    image: product11
  },
  {
    id: 6,
    name: 'Brocade Lehenga Set',
    sku: 'M.0006',
    category: 'luxury',
    stock: 19,
    price: 78000,
    image: product21
  },
  {
    id: 7,
    name: 'Cotton Silk Kameez',
    sku: 'M.0007',
    category: 'rtw',
    stock: 32,
    price: 28500,
    image: product3
  },
  {
    id: 8,
    name: 'Zardozi Anarkali',
    sku: 'M.0008',
    category: 'unstitched',
    stock: 4,
    price: 55000,
    image: product41
  }
];

export const formatInventoryPrice = (value) =>
  `PKR ${value.toLocaleString('en-PK')}`;
