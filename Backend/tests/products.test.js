import request from 'supertest';
import { createApp } from '../src/app.js';
import { Product, PRODUCT_STATUS } from '../src/modules/products/product.model.js';

describe('Products API', () => {
  const app = createApp();

  beforeEach(async () => {
    await Product.create({
      title: 'Embroidered Silk Ensemble',
      slug: 'embroidered-silk-ensemble',
      sku: 'M.0001',
      category: 'new-arrivals',
      price: 45000,
      originalPrice: 52000,
      stock: 10,
      status: PRODUCT_STATUS.PUBLISHED,
      sizes: ['S', 'M', 'L'],
      colors: [{ name: 'Ivory Gold', hex: '#F5F5F4' }],
      images: [{ url: 'https://cdn.marhas.com/test.jpg', alt: 'Test', order: 0 }],
      description: { intro: 'Test', detail: 'Detail', highlights: [] },
      specifications: { composition: 'Silk', care: 'Dry clean', includes: 'Ensemble' }
    });
  });

  it('lists published products', async () => {
    const response = await request(app).get('/api/v1/products');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].category).toBe('new');
  });

  it('filters by frontend category slug', async () => {
    const response = await request(app).get('/api/v1/products?category=new');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(1);
  });
});
