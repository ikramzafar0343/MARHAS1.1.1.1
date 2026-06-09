export const CUSTOMER_TOKEN_KEY = 'luxury_token';
export const ADMIN_TOKEN_KEY = 'marhas_admin_token';

export const getCustomerToken = () => localStorage.getItem(CUSTOMER_TOKEN_KEY);
export const setCustomerToken = (token) => {
  if (token) {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    return;
  }
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
};

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);
export const setAdminToken = (token) => {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    return;
  }
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const clearAllTokens = () => {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};
