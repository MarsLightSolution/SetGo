/**
 * API Configuration
 *
 * IMPORTANT: Set your API URL in the .env file:
 * EXPO_PUBLIC_API_URL=https://your-api-domain.com
 *
 * Do NOT hardcode API URLs in this file.
 */

// Get API URL from environment variable (required)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Validate configuration in development
if (!API_BASE_URL && __DEV__) {
  console.error(
    'EXPO_PUBLIC_API_URL is not set. Create a .env file with your API URL.'
  );
}

// Ensure no trailing slash
const baseURL = API_BASE_URL ? API_BASE_URL.replace(/\/$/, '') : '';

export const API_ENDPOINTS = {
  // Products
  GET_PRODUCTS: `${baseURL}/api/products/getProducts`,
  GET_NEARBY: `${baseURL}/api/products/nearby`,
  GET_PRIORITY: `${baseURL}/api/products/priority`,
  PRODUCT_DETAIL: (id) => `${baseURL}/api/products/${id}`,

  // Auth
  LOGIN: `${baseURL}/api/auth/login`,
  REGISTER: `${baseURL}/api/auth/register`,

  // User
  USER_PROFILE: `${baseURL}/api/user/profile`,

  // Orders
  ORDERS: `${baseURL}/api/orders`,

  // Chat
  CHAT: `${baseURL}/api/chat`,
};

export { API_BASE_URL, baseURL as API_URL };
