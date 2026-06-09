import request from 'supertest';
import { createApp } from '../src/app.js';
import { Product, PRODUCT_STATUS } from '../src/modules/products/product.model.js';
import { User } from '../src/modules/users/user.model.js';
import { Order } from '../src/modules/orders/order.model.js';
import { ORDER_STATUS } from '../src/constants/orderStatus.js';
import { ROLES } from '../src/constants/roles.js';

describe('Orders API', () => {
  const app = createApp();
  let productId;

  beforeEach(async () => {
    const product = await Product.create({
      title: 'Velvet Luxury Kurta',
      slug: 'velvet-luxury-kurta',
      sku: 'M.0002',
      category: 'summer',
      price: 8000,
      stock: 5,
      status: PRODUCT_STATUS.PUBLISHED,
      sizes: ['S', 'M'],
      colors: [{ name: 'Soft Sand', hex: '#D4C4A8' }],
      images: [{ url: 'https://cdn.marhas.com/test2.jpg', alt: 'Test', order: 0 }],
      description: { intro: 'Test', detail: 'Detail', highlights: [] },
      specifications: { composition: 'Velvet', care: 'Dry clean', includes: 'Kurta' }
    });
    productId = product._id.toString();
  });

  it('creates a guest checkout order', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .send({
        email: 'guest@marhas.com',
        phone: '+92 300 1234567',
        fullName: 'Guest Customer',
        address: '12 Gulberg III',
        city: 'Lahore',
        postalCode: '54000',
        paymentMethod: 'cod',
        items: [
          {
            productId,
            quantity: 1,
            size: 'M',
            color: 'Soft Sand',
            colorHex: '#D4C4A8'
          }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.orderNumber).toMatch(/^#MH-/);
    expect(response.body.data.shippingFee).toBe(500);
    expect(response.body.data.taxAmount).toBe(1360);
    expect(response.body.data.total).toBe(9860);
  });

  it('applies free shipping for orders >= 15000 subtotal', async () => {
    await Product.findByIdAndUpdate(productId, { price: 20000 });

    const response = await request(app)
      .post('/api/v1/orders')
      .send({
        email: 'guest2@marhas.com',
        phone: '+92 300 1234567',
        fullName: 'Guest Customer',
        address: '12 Gulberg III',
        city: 'Lahore',
        postalCode: '54000',
        paymentMethod: 'cod',
        items: [{ productId, quantity: 1, size: 'M', color: 'Soft Sand' }]
      });

    expect(response.status).toBe(201);
    expect(response.body.data.shippingFee).toBe(0);
    expect(response.body.data.taxAmount).toBe(3400);
    expect(response.body.data.total).toBe(23400);
  });

  it('cancels a pending admin order and restores stock', async () => {
    const passwordHash = await User.hashPassword('AdminPass123');
    await User.create({
      name: 'Admin User',
      email: 'admin@marhas.com',
      passwordHash,
      role: ROLES.ADMIN,
      isEmailVerified: true
    });

    const login = await request(app).post('/api/v1/auth/admin/login').send({
      email: 'admin@marhas.com',
      password: 'AdminPass123'
    });

    expect(login.status).toBe(200);
    const token = login.body.data.accessToken;

    const checkout = await request(app)
      .post('/api/v1/orders')
      .send({
        email: 'cancel@marhas.com',
        phone: '+92 300 1234567',
        fullName: 'Cancel Test',
        address: '12 Gulberg III',
        city: 'Lahore',
        postalCode: '54000',
        paymentMethod: 'cod',
        items: [{ productId, quantity: 2, size: 'M', color: 'Soft Sand' }]
      });

    expect(checkout.status).toBe(201);
    const orderId = checkout.body.data._id;
    const stockAfterCheckout = (await Product.findById(productId)).stock;
    expect(stockAfterCheckout).toBe(3);

    const cancel = await request(app)
      .post(`/api/v1/admin/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Customer request' });

    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe(ORDER_STATUS.CANCELLED);

    const stockAfterCancel = (await Product.findById(productId)).stock;
    expect(stockAfterCancel).toBe(5);

    const order = await Order.findById(orderId);
    expect(order.status).toBe(ORDER_STATUS.CANCELLED);
    expect(order.cancellationReason).toBe('Customer request');
  });

  it('cancels an order even when product document has legacy invalid fields', async () => {
    const passwordHash = await User.hashPassword('AdminPass123');
    await User.create({
      name: 'Admin User',
      email: 'admin@marhas.com',
      passwordHash,
      role: ROLES.ADMIN,
      isEmailVerified: true
    });

    await Product.collection.insertOne({
      title: 'Legacy Product',
      slug: 'legacy-product',
      sku: 'M.LEGACY',
      category: 'summer',
      price: 5000,
      stock: 4,
      status: PRODUCT_STATUS.PUBLISHED,
      sizes: ['M'],
      colors: [{ name: 'Bad', hex: 'not-a-hex' }],
      images: [{ url: 'https://cdn.marhas.com/legacy.jpg', alt: 'Legacy', order: 0 }],
      description: { intro: 'Legacy', detail: 'Legacy', highlights: [] },
      specifications: { composition: 'Silk', care: 'Dry clean', includes: 'Set' },
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const legacyProduct = await Product.findOne({ sku: 'M.LEGACY' });
    const legacyProductId = legacyProduct._id.toString();

    const login = await request(app).post('/api/v1/auth/admin/login').send({
      email: 'admin@marhas.com',
      password: 'AdminPass123'
    });
    const token = login.body.data.accessToken;

    const checkout = await request(app)
      .post('/api/v1/orders')
      .send({
        email: 'legacy@marhas.com',
        phone: '+92 300 1234567',
        fullName: 'Legacy Customer',
        address: '12 Gulberg III',
        city: 'Lahore',
        postalCode: '54000',
        paymentMethod: 'cod',
        items: [{ productId: legacyProductId, quantity: 1, size: 'M', color: 'Bad' }]
      });

    expect(checkout.status).toBe(201);
    const orderId = checkout.body.data._id;

    const cancel = await request(app)
      .post(`/api/v1/admin/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Test legacy cancel' });

    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe(ORDER_STATUS.CANCELLED);

    const stockAfterCancel = (await Product.findOne({ sku: 'M.LEGACY' })).stock;
    expect(stockAfterCancel).toBe(4);
  });
});
