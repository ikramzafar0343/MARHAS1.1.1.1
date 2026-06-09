import { adminApi, api, getApiErrorMessage, unwrap } from './api';
import { setAdminToken, setCustomerToken } from './tokenStorage';

export const authService = {
  async register({ name, email, password, confirmPassword }) {
    setCustomerToken(null);
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      confirmPassword
    });
    const data = unwrap(response);
    setCustomerToken(data.accessToken);
    return data;
  },

  async login({ email, password }) {
    setCustomerToken(null);
    const response = await api.post('/auth/login', { email, password });
    const data = unwrap(response);
    setCustomerToken(data.accessToken);
    return data;
  },

  async adminLogin({ email, password }) {
    const response = await adminApi.post('/auth/admin/login', { email, password });
    const data = unwrap(response);
    setAdminToken(data.accessToken);
    return data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setCustomerToken(null);
    }
  },

  async adminLogout() {
    try {
      await adminApi.post('/auth/logout');
    } finally {
      setAdminToken(null);
    }
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return unwrap(response);
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return unwrap(response);
  }
};

export { getApiErrorMessage };
