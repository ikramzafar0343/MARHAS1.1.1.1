import {
  DEFAULT_COMMERCE_SETTINGS,
  calculateOrderTotal,
  calculateShippingFee,
  calculateTaxAmount
} from '../constants/commerceDefaults';
import { lookupProduct } from './productLookup';

export const buildCartLineId = (productId, size, color) =>
  `${String(productId)}::${size}::${color}`;

export const DEFAULT_CART_OPTIONS = {
  quantity: 1,
  size: 'M',
  color: 'Ivory Gold',
  colorHex: '#EAE0D5'
};

export const getCartSubtotal = (cartItems, getProductById = lookupProduct) =>
  cartItems.reduce((sum, item) => {
    const product = getProductById(item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

export const getCartItemCount = (cartItems) =>
  cartItems.reduce((sum, item) => sum + item.quantity, 0);

export const FREE_SHIPPING_THRESHOLD = DEFAULT_COMMERCE_SETTINGS.freeShippingThreshold;
export const STANDARD_SHIPPING_FEE = DEFAULT_COMMERCE_SETTINGS.standardShippingFee;

export const getShippingFee = (subtotal, settings = DEFAULT_COMMERCE_SETTINGS) =>
  calculateShippingFee(subtotal, settings);

export const getTaxAmount = (subtotal, settings = DEFAULT_COMMERCE_SETTINGS) =>
  calculateTaxAmount(subtotal, settings);

export const getOrderTotal = (subtotal, settings = DEFAULT_COMMERCE_SETTINGS) =>
  calculateOrderTotal(subtotal, settings);

export const formatPrice = (amount) => `PKR ${amount?.toLocaleString()}`;

export const formatPaymentMethod = (method) => {
  if (method === 'online') {
    return 'Online Payment';
  }

  return 'Cash on Delivery';
};

export const formatOrderDate = (isoDate) => {
  if (!isoDate) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(isoDate));
};

export const resolveCartItems = (cartItems, getProductById = lookupProduct) =>
  cartItems
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) {
        return null;
      }

      return { item, product };
    })
    .filter(Boolean);
