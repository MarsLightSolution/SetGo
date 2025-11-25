// Get API URL from environment variable
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.148.94.234:8080';

// Ensure no trailing slash
const baseURL = API_BASE_URL.replace(/\/$/, '');

export const API_ENDPOINTS = {
  GET_PRODUCTS: `${baseURL}/api/products/getProducts`,
  GET_NEARBY: `${baseURL}/api/products/nearby`,
  GET_PRIORITY: `${baseURL}/api/products/priority`,
  LOGIN: `${baseURL}/api/auth/login`,
  REGISTER: `${baseURL}/api/auth/register`,
  PRODUCT_DETAIL: (id) => `${baseURL}/api/products/${id}`,
  USER_PROFILE: `${baseURL}/api/user/profile`,
  ORDERS: `${baseURL}/api/orders`,
  CHAT: `${baseURL}/api/chat`,
};

export { API_BASE_URL, baseURL as API_URL };
