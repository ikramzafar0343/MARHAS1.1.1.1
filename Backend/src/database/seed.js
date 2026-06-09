import { connectDatabase, disconnectDatabase } from './connection.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { User } from '../modules/users/user.model.js';
import { Product, PRODUCT_STATUS } from '../modules/products/product.model.js';
import { Order } from '../modules/orders/order.model.js';
import { StorefrontContent } from '../modules/storefront/storefront.model.js';
import { STOREFRONT_DEFAULTS } from '../constants/storefrontDefaults.js';
import { ROLES } from '../constants/roles.js';
import { ORDER_STATUS, PAYMENT_METHODS } from '../constants/orderStatus.js';

const CATEGORY_MAP = {
  new: 'new-arrivals',
  summer: 'summer',
  rtw: 'ready-to-wear',
  unstitched: 'unstitched',
  luxury: 'festive'
};

const CATEGORY_COPY = {
  new: {
    detail:
      'The design celebrates traditional artistry while embracing modern sensibilities, making it perfect for formal occasions and sophisticated gatherings.',
    highlights: [
      'Hand-finished embellishments with premium threads',
      'Luxury fabric selected for comfort and drape',
      'Contemporary silhouette with timeless elements',
      'Designed exclusively for the MARHAS woman'
    ],
    composition: 'Premium silk-blend base with intricate embroidered overlays.',
    includes: 'Complete ensemble as shown in product imagery.'
  },
  summer: {
    detail:
      'Lightweight construction and breathable fabrics keep the look effortless through warmer seasons without compromising polish.',
    highlights: [
      'Airy textiles for all-day comfort',
      'Soft structure with refined finishing',
      'Easy elegance for daytime and evening wear',
      'Curated for the modern MARHAS wardrobe'
    ],
    composition: 'Breathable cotton-silk and lawn blends with soft lining.',
    includes: 'Outfit components as displayed in imagery.'
  },
  rtw: {
    detail:
      'Ready-to-wear tailoring delivers an polished silhouette straight from the box, ideal for everyday luxury and special moments alike.',
    highlights: [
      'Precision pret construction',
      'Comfort-first fit with elevated detailing',
      'Minimal styling required',
      'Made for repeat wear'
    ],
    composition: 'Premium pret fabric with structured yet soft hand-feel.',
    includes: 'Ready-to-wear piece as shown in product imagery.'
  },
  unstitched: {
    detail:
      'Premium unstitched fabric offers the freedom to customize your fit while preserving MARHAS signature craftsmanship and finish.',
    highlights: [
      'Generous fabric meterage for custom tailoring',
      'Rich texture with artisan-inspired detailing',
      'Ideal for bespoke festive and formal looks',
      'Crafted for personalization'
    ],
    composition: 'Fine unstitched fabric with optional embroidered panels.',
    includes: 'Fabric set as listed; stitching not included.'
  },
  luxury: {
    detail:
      'An elevated festive statement piece with couture-level finishing, created for occasions that call for exceptional presence.',
    highlights: [
      'Statement craftsmanship and rich texture',
      'Limited-edition construction',
      'Designed for milestone celebrations',
      'Finished to luxury standards'
    ],
    composition: 'Luxury brocade and silk blends with detailed embellishment.',
    includes: 'Full festive set as shown in product imagery.'
  }
};

const PRODUCT_GALLERY = [
  ['/assets/images/product1.1.jpg', '/assets/images/product1.2.jpg'],
  ['/assets/images/product2.1.jpg', '/assets/images/product2.2.jpg'],
  ['/assets/images/product3.jpg'],
  ['/assets/images/product4.1.jpg', '/assets/images/product4.2.jpg']
];

const CATALOG_PRODUCTS = [
  { name: 'Embroidered Silk Ensemble', price: 45000, originalPrice: 52000, category: 'new', sku: 'M.0001', stock: 24, bestSeller: true },
  { name: 'Velvet Luxury Kurta', price: 38500, originalPrice: 44000, category: 'summer', sku: 'M.0002', stock: 8 },
  { name: 'Chiffon Draped Saree', price: 52000, originalPrice: 59000, category: 'summer', sku: 'M.0003', stock: 0 },
  { name: 'Pearl Embellished Gown', price: 65000, originalPrice: 72000, category: 'new', sku: 'M.0004', stock: 15, bestSeller: true },
  { name: 'Organza Evening Suit', price: 42000, originalPrice: 48000, category: 'rtw', sku: 'M.0005', stock: 6 },
  { name: 'Brocade Lehenga Set', price: 78000, originalPrice: 85000, category: 'luxury', sku: 'M.0006', stock: 19 },
  { name: 'Cotton Silk Kameez', price: 28500, originalPrice: 32000, category: 'rtw', sku: 'M.0007', stock: 32 },
  { name: 'Zardozi Anarkali', price: 55000, originalPrice: 62000, category: 'unstitched', sku: 'M.0008', stock: 4 }
];

const slugify = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildDescription = (product) => {
  const copy = CATEGORY_COPY[product.category] || CATEGORY_COPY.new;
  return {
    intro: `Introducing our ${product.name}, a MARHAS piece that embodies contemporary elegance with refined craftsmanship and premium fabrics.`,
    detail: copy.detail,
    highlights: copy.highlights
  };
};

const buildSpecifications = (product) => {
  const copy = CATEGORY_COPY[product.category] || CATEGORY_COPY.new;
  return {
    composition: copy.composition,
    care: 'Dry clean only. Steam iron at medium temperature.',
    includes: copy.includes
  };
};

const buildProductPayload = (product, index) => {
  const gallery = PRODUCT_GALLERY[index % PRODUCT_GALLERY.length];
  const images = gallery.map((url, order) => ({ url, alt: product.name, order }));
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return {
    title: product.name,
    slug: slugify(product.name),
    sku: product.sku,
    category: CATEGORY_MAP[product.category],
    price: product.price,
    originalPrice: product.originalPrice,
    discount,
    discountType: 'percentage',
    description: buildDescription(product),
    specifications: buildSpecifications(product),
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Ivory', hex: '#FFFFF0' },
      { name: 'Noir', hex: '#1A1A1A' }
    ],
    variants: [
      {
        colorName: 'Ivory',
        colorHex: '#FFFFF0',
        images: images.slice(0, 2).map((image) => ({ url: image.url, alt: image.alt }))
      }
    ],
    images,
    bestSeller: product.bestSeller ?? false,
    stock: product.stock,
    lowStockThreshold: 10,
    rating: 4.5 + (index % 5) * 0.1,
    reviewCount: 12 + index * 3,
    status: PRODUCT_STATUS.PUBLISHED
  };
};

const SAMPLE_ORDERS = [
  {
    orderNumber: '#MH-10241',
    customer: 'Ayesha Khan',
    email: 'ayesha.khan@example.com',
    phone: '+92 300 1234567',
    status: ORDER_STATUS.PROCESSING,
    daysAgo: 1,
    items: [{ sku: 'M.0001', quantity: 1, size: 'M', color: 'Ivory' }]
  },
  {
    orderNumber: '#MH-10238',
    customer: 'Sara Malik',
    email: 'sara.malik@example.com',
    phone: '+92 301 2345678',
    status: ORDER_STATUS.PENDING,
    daysAgo: 2,
    items: [{ sku: 'M.0002', quantity: 1, size: 'S', color: 'Noir' }]
  },
  {
    orderNumber: '#MH-10235',
    customer: 'Fatima Noor',
    email: 'fatima.noor@example.com',
    phone: '+92 302 3456789',
    status: ORDER_STATUS.SHIPPED,
    daysAgo: 3,
    items: [{ sku: 'M.0004', quantity: 1, size: 'L', color: 'Ivory' }]
  },
  {
    orderNumber: '#MH-10229',
    customer: 'Zainab Ali',
    email: 'zainab.ali@example.com',
    phone: '+92 303 4567890',
    status: ORDER_STATUS.DELIVERED,
    daysAgo: 4,
    items: [{ sku: 'M.0005', quantity: 2, size: 'M', color: 'Ivory' }]
  },
  {
    orderNumber: '#MH-10224',
    customer: 'Hira Shah',
    email: 'hira.shah@example.com',
    phone: '+92 304 5678901',
    status: ORDER_STATUS.PROCESSING,
    daysAgo: 5,
    items: [
      { sku: 'M.0007', quantity: 1, size: 'S', color: 'Ivory' },
      { sku: 'M.0008', quantity: 1, size: 'M', color: 'Noir' }
    ]
  }
];

const seedAdmin = async () => {
  const existing = await User.findOne({ email: env.SEED_ADMIN_EMAIL });

  if (existing) {
    logger.info({ email: env.SEED_ADMIN_EMAIL }, 'Admin user already exists');
    return existing;
  }

  const passwordHash = await User.hashPassword(env.SEED_ADMIN_PASSWORD);
  const admin = await User.create({
    name: env.SEED_ADMIN_NAME,
    email: env.SEED_ADMIN_EMAIL,
    passwordHash,
    role: ROLES.SUPER_ADMIN,
    isEmailVerified: true
  });

  logger.info({ email: admin.email, role: admin.role }, 'Admin user created');
  return admin;
};

const seedProducts = async () => {
  const products = [];

  for (let index = 0; index < CATALOG_PRODUCTS.length; index += 1) {
    const catalogItem = CATALOG_PRODUCTS[index];
    const existing = await Product.findOne({ sku: catalogItem.sku });

    if (existing) {
      products.push(existing);
      continue;
    }

    const payload = buildProductPayload(catalogItem, index);
    const product = await Product.create(payload);
    products.push(product);
    logger.info({ sku: product.sku, title: product.title }, 'Product seeded');
  }

  return products;
};

const seedStorefront = async (adminId) => {
  const existing = await StorefrontContent.findOne({ key: 'default' });

  if (existing) {
    logger.info('Storefront content already exists');
    return existing;
  }

  const content = await StorefrontContent.create({
    key: 'default',
    isPublished: true,
    publishedAt: new Date(),
    navigation: STOREFRONT_DEFAULTS.navigation,
    heroSlides: STOREFRONT_DEFAULTS.heroSlides,
    showcase: STOREFRONT_DEFAULTS.showcase,
    collectionHeroes: new Map(Object.entries(STOREFRONT_DEFAULTS.collectionHeroes)),
    shopTheLook: STOREFRONT_DEFAULTS.shopTheLook,
    footerSocial: STOREFRONT_DEFAULTS.footerSocial,
    authPages: STOREFRONT_DEFAULTS.authPages,
    commerceSettings: STOREFRONT_DEFAULTS.commerceSettings,
    createdBy: adminId,
    updatedBy: adminId
  });

  logger.info('Storefront content seeded');
  return content;
};

const buildOrderItems = (orderTemplate, productMap) =>
  orderTemplate.items.map((item) => {
    const product = productMap.get(item.sku);
    return {
      productId: product._id,
      name: product.title,
      sku: product.sku,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      colorHex: item.color === 'Ivory' ? '#FFFFF0' : '#1A1A1A',
      price: product.price,
      imageUrl: product.images?.[0]?.url || null
    };
  });

const seedOrders = async (products, adminId) => {
  const existingCount = await Order.countDocuments();
  if (existingCount >= SAMPLE_ORDERS.length) {
    logger.info({ count: existingCount }, 'Orders already seeded');
    return;
  }

  const productMap = new Map(products.map((product) => [product.sku, product]));

  for (const template of SAMPLE_ORDERS) {
    const exists = await Order.findOne({ orderNumber: template.orderNumber });
    if (exists) {
      continue;
    }

    const items = buildOrderItems(template, productMap);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal >= 50000 ? 0 : 1500;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - template.daysAgo);

    await Order.create({
      orderNumber: template.orderNumber,
      customer: template.customer,
      email: template.email,
      phone: template.phone,
      shipping: {
        address: '12 Mall Road',
        city: 'Lahore',
        postalCode: '54000'
      },
      paymentMethod: PAYMENT_METHODS.COD,
      status: template.status,
      items,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      createdBy: adminId,
      updatedBy: adminId,
      createdAt,
      updatedAt: createdAt
    });

    logger.info({ orderNumber: template.orderNumber }, 'Order seeded');
  }
};

const runSeed = async () => {
  await connectDatabase();

  const admin = await seedAdmin();
  const adminId = admin._id.toString();
  const products = await seedProducts();
  await seedStorefront(adminId);
  await seedOrders(products, adminId);

  logger.info('Database seed completed successfully');
};

runSeed()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error({ err: error }, 'Database seed failed');
    await disconnectDatabase();
    process.exit(1);
  });
