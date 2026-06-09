import { resolveAssetUrl } from './assetUrl';
import { formatOrderDate, formatPaymentMethod } from './cart';

const BACKEND_TO_FRONTEND_CATEGORY = {
  'new-arrivals': 'new',
  summer: 'summer',
  'ready-to-wear': 'rtw',
  unstitched: 'unstitched',
  festive: 'luxury',
  bridal: 'luxury'
};

export const toFrontendCategory = (category) =>
  BACKEND_TO_FRONTEND_CATEGORY[category] || category;

export const toBackendCategory = (category) => {
  const map = {
    new: 'new-arrivals',
    summer: 'summer',
    rtw: 'ready-to-wear',
    unstitched: 'unstitched',
    luxury: 'festive'
  };

  return map[category] || category;
};

const normalizeDescription = (description, name) => {
  if (!description) {
    return {
      intro: name ? `Introducing our ${name}.` : '',
      detail: '',
      highlights: []
    };
  }

  if (typeof description === 'string') {
    return { intro: description, detail: '', highlights: [] };
  }

  return {
    intro: description.intro || '',
    detail: description.detail || '',
    highlights: description.highlights || []
  };
};

const normalizeSpecifications = (specifications) => ({
  composition: specifications?.composition || '',
  care: specifications?.care || 'Dry clean only.',
  includes: specifications?.includes || ''
});

export const mapApiProduct = (product) => {
  if (!product) {
    return null;
  }

  const id = product._id || product.id;
  const images = (product.images || [])
    .map((image) => resolveAssetUrl(typeof image === 'string' ? image : image.url))
    .filter(Boolean);

  const mapped = {
    id,
    name: product.title || product.name,
    price: product.effectivePrice ?? product.price ?? 0,
    originalPrice: product.originalPrice ?? product.price ?? 0,
    category: toFrontendCategory(product.category),
    images,
    image: images[0] || null,
    hoverImage: images[1] || images[0] || null,
    description: normalizeDescription(product.description, product.title),
    specifications: normalizeSpecifications(product.specifications),
    sizes: product.sizes || [],
    colors: product.colors || [],
    variants: product.variants || [],
    sku: product.sku,
    stock: product.stock ?? 0,
    bestSeller: Boolean(product.bestSeller),
    slug: product.slug
  };

  return mapped;
};

export const mapApiProducts = (products = []) => products.map(mapApiProduct).filter(Boolean);

export const mapApiOrder = (order) => {
  if (!order) {
    return null;
  }

  const orderNumber = order.orderNumber || '';
  const id = order._id || order.id;

  return {
    id,
    orderId: orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`,
    customer: order.customer,
    email: order.email,
    phone: order.phone,
    status: order.status,
    date: formatOrderDate(order.createdAt),
    createdAt: order.createdAt,
    total: order.total,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    taxAmount: order.taxAmount ?? 0,
    taxRate: order.taxRate ?? 0,
    taxLabel: order.taxLabel || 'GST',
    paymentMethod: formatPaymentMethod(order.paymentMethod),
    shipping: order.shipping,
    items: (order.items || []).map((item) => {
      const productRef = item.productId;
      const imageSource =
        item.imageUrl ||
        (typeof productRef === 'object'
          ? productRef?.images?.[0]?.url || productRef?.images?.[0]
          : null);

      return {
        name: item.name,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: item.price,
        productId: productRef?._id || productRef,
        image: resolveAssetUrl(imageSource)
      };
    })
  };
};

export const mapApiInventoryItem = (item) => ({
  id: item._id || item.id,
  name: item.name || item.title,
  sku: item.sku,
  category: toFrontendCategory(item.category),
  stock: item.stock ?? 0,
  price: item.price ?? 0,
  image: resolveAssetUrl(item.image || item.images?.[0]?.url)
});

export const mapCheckoutOrder = (order, cartItems = []) => {
  const orderNumber = (order.orderNumber || '').replace(/^#/, '');

  return {
    id: orderNumber,
    orderNumber: order.orderNumber,
    email: order.email,
    phone: order.phone,
    fullName: order.customer,
    address: order.shipping?.address,
    city: order.shipping?.city,
    postalCode: order.shipping?.postalCode,
    paymentMethod: order.paymentMethod,
    items: cartItems,
    subtotal: order.subtotal,
    total: order.total,
    shippingFee: order.shippingFee,
    taxAmount: order.taxAmount ?? 0,
    taxRate: order.taxRate ?? 0,
    taxLabel: order.taxLabel || 'GST',
    createdAt: order.createdAt || new Date().toISOString()
  };
};
