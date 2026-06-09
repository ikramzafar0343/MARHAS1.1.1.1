import request from 'supertest';
import { createApp } from '../src/app.js';
import { Product, PRODUCT_STATUS } from '../src/modules/products/product.model.js';
import { User } from '../src/modules/users/user.model.js';
import { Order } from '../src/modules/orders/order.model.js';
import { ORDER_STATUS, PAYMENT_METHODS } from '../src/constants/orderStatus.js';
import { ROLES } from '../src/constants/roles.js';

describe('Analytics API', () => {
  const app = createApp();
  let adminToken;

  beforeEach(async () => {
    const passwordHash = await User.hashPassword('AdminPass123');
    const admin = await User.create({
      name: 'Analytics Admin',
      email: 'analytics-admin@marhas.com',
      passwordHash,
      role: ROLES.SUPER_ADMIN
    });

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: admin.email, password: 'AdminPass123' });

    adminToken = login.body.data.accessToken;

    const product = await Product.create({
      title: 'Embroidered Silk Ensemble',
      slug: 'embroidered-silk-ensemble',
      sku: 'M.0101',
      category: 'new-arrivals',
      price: 15000,
      stock: 10,
      status: PRODUCT_STATUS.PUBLISHED,
      sizes: ['S', 'M'],
      colors: [{ name: 'Ivory', hex: '#FFFFF0' }],
      images: [{ url: 'https://cdn.marhas.com/test.jpg', alt: 'Test', order: 0 }],
      description: { intro: 'Test', detail: 'Detail', highlights: [] },
      specifications: { composition: 'Silk', care: 'Dry clean', includes: 'Ensemble' }
    });

    const createdAt = new Date();
    await Order.create({
      orderNumber: '#MH-TEST-001',
      customer: 'Test Customer',
      email: 'customer@marhas.com',
      phone: '+92 300 1112233',
      shipping: { address: '12 Mall Road', city: 'Lahore', postalCode: '54000' },
      paymentMethod: PAYMENT_METHODS.COD,
      status: ORDER_STATUS.DELIVERED,
      items: [
        {
          productId: product._id,
          name: product.title,
          sku: product.sku,
          quantity: 2,
          price: product.price,
          color: 'Ivory'
        }
      ],
      subtotal: 30000,
      shippingFee: 0,
      total: 30000,
      createdBy: admin._id,
      updatedBy: admin._id,
      createdAt,
      updatedAt: createdAt
    });
  });

  it('returns top products for the selected period', async () => {
    const response = await request(app)
      .get('/api/v1/admin/analytics/top-products')
      .query({ period: '30d', limit: 5 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data[0].name).toBe('Embroidered Silk Ensemble');
  });
});
