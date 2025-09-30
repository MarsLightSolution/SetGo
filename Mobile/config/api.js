const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  GET_PRODUCTS: `${API_BASE_URL}/api/products/getProducts`,
  GET_NEARBY: `${API_BASE_URL}/api/products/nearby`,
  GET_PRIORITY: `${API_BASE_URL}/api/products/priority`,
};

export { API_BASE_URL };