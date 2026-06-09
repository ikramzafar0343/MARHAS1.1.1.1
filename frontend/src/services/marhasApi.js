import { adminApi, api, unwrap } from './api';

export const productsService = {
  async list(params = {}) {
    const response = await api.get('/products', { params: { limit: 100, ...params } });
    return unwrap(response);
  },

  async getBestSellers(params = {}) {
    const response = await api.get('/products/best-sellers', { params: { limit: 12, ...params } });
    return unwrap(response);
  },

  async getById(id) {
    const response = await api.get(`/products/${id}`);
    return unwrap(response);
  },

  async create(formData) {
    const response = await adminApi.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return unwrap(response);
  }
};

export const ordersService = {
  async checkout(payload) {
    const response = await api.post('/orders', payload);
    return unwrap(response);
  },

  async getByNumber(orderNumber) {
    const response = await api.get(`/orders/${encodeURIComponent(orderNumber)}`);
    return unwrap(response);
  },

  async getMyOrders(params = {}) {
    const response = await api.get('/orders/my', { params: { limit: 20, ...params } });
    return {
      orders: unwrap(response) || [],
      pagination: response.data?.meta?.pagination || null
    };
  }
};

export const adminOrdersService = {
  async list(params = {}) {
    const response = await adminApi.get('/admin/orders', { params: { limit: 100, ...params } });
    return unwrap(response);
  },

  async getById(id) {
    const response = await adminApi.get(`/admin/orders/${id}`);
    return unwrap(response);
  },

  async update(id, payload) {
    const response = await adminApi.patch(`/admin/orders/${id}`, payload);
    return unwrap(response);
  },

  async updateStatus(id, status) {
    const response = await adminApi.patch(`/admin/orders/${id}/status`, { status });
    return unwrap(response);
  },

  async cancel(id, reason = null) {
    const response = await adminApi.post(`/admin/orders/${id}/cancel`, { reason });
    return unwrap(response);
  }
};

export const inventoryService = {
  async list(params = {}) {
    const response = await adminApi.get('/admin/inventory', { params: { limit: 100, ...params } });
    return unwrap(response);
  },

  async update(id, payload) {
    const response = await adminApi.patch(`/admin/inventory/${id}`, payload);
    return unwrap(response);
  },

  async updateStock(id, stock) {
    const response = await adminApi.patch(`/admin/inventory/${id}/stock`, { stock });
    return unwrap(response);
  },

  async restock(id, quantity) {
    const response = await adminApi.post(`/admin/inventory/${id}/restock`, { quantity });
    return unwrap(response);
  },

  async remove(id) {
    const response = await adminApi.delete(`/admin/inventory/${id}`);
    return unwrap(response);
  }
};

export const storefrontService = {
  async getPublic() {
    const response = await api.get('/content/storefront');
    return unwrap(response);
  },

  async getAdmin() {
    const response = await adminApi.get('/content/admin/storefront');
    return unwrap(response);
  },

  async update(payload) {
    const response = await adminApi.put('/content/admin/storefront', payload);
    return unwrap(response);
  },

  async reset() {
    const response = await adminApi.post('/content/admin/storefront/reset');
    return unwrap(response);
  }
};

export const dashboardService = {
  async getMetrics() {
    const response = await adminApi.get('/admin/dashboard/metrics');
    return unwrap(response);
  },

  async getRecentOrders(limit = 5) {
    const response = await adminApi.get('/admin/dashboard/recent-orders', { params: { limit } });
    return unwrap(response);
  }
};

export const analyticsService = {
  async getKpis(period = '30d') {
    const response = await adminApi.get('/admin/analytics/kpis', { params: { period } });
    return unwrap(response);
  },

  async getRevenueChart(period = '30d') {
    const response = await adminApi.get('/admin/analytics/revenue', { params: { period } });
    return unwrap(response);
  },

  async getOrdersChart(period = '30d') {
    const response = await adminApi.get('/admin/analytics/orders', { params: { period } });
    return unwrap(response);
  },

  async getCategoryBreakdown(period = '30d') {
    const response = await adminApi.get('/admin/analytics/categories', { params: { period } });
    return unwrap(response);
  },

  async getTopProducts(period = '30d', limit = 5) {
    const response = await adminApi.get('/admin/analytics/top-products', {
      params: { period, limit }
    });
    return unwrap(response);
  }
};

export const newsletterService = {
  async subscribe({ email, source = 'footer' }) {
    const response = await api.post('/newsletter/subscribe', { email, source });
    return unwrap(response);
  }
};

export const uploadsService = {
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await adminApi.post('/uploads/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return unwrap(response);
  }
};
