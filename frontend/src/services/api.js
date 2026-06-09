import axios from 'axios';
import {
  CUSTOMER_TOKEN_KEY,
  ADMIN_TOKEN_KEY,
  setCustomerToken
} from './tokenStorage';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const AUTH_PATHS_WITHOUT_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/admin/login',
  '/auth/refresh'
];

const shouldSkipTokenRefresh = (url = '') =>
  AUTH_PATHS_WITHOUT_REFRESH.some((path) => url.includes(path));

const createClient = (tokenKey) => {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
};

export const api = createClient(CUSTOMER_TOKEN_KEY);
export const adminApi = createClient(ADMIN_TOKEN_KEY);

export const unwrap = (response) => response.data?.data;

export const getApiErrorMessage = (error) => {
  if (!error?.response) {
    return 'Unable to reach the API server. Make sure the backend is running, then try again.';
  }

  const data = error.response.data;
  if (data?.errors?.length) {
    return data.errors.map((item) => item.message || item).join('. ');
  }
  return data?.message || error.message || 'Something went wrong';
};

let refreshPromise = null;

export const refreshCustomerToken = async () => {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh')
      .then((response) => {
        const data = unwrap(response);
        if (data?.accessToken) {
          setCustomerToken(data.accessToken);
        }
        return data?.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const attachRefreshInterceptor = (client, tokenKey) => {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      const status = error.response?.status;

      if (
        status !== 401 ||
        original._retry ||
        tokenKey !== CUSTOMER_TOKEN_KEY ||
        shouldSkipTokenRefresh(original.url)
      ) {
        return Promise.reject(error);
      }

      original._retry = true;

      try {
        const token = await refreshCustomerToken();
        if (!token) {
          return Promise.reject(error);
        }

        original.headers.Authorization = `Bearer ${token}`;
        return client(original);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
  );
};

attachRefreshInterceptor(api, CUSTOMER_TOKEN_KEY);

export default api;
