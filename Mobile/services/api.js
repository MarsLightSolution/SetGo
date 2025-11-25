// services/api.js
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { API_URL } from '../config/api';

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Enable cookies only if your backend requires it
  withCredentials: false,
});

// Configure retry logic
axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response?.status >= 500 && error.response?.status <= 599);
  },
  shouldResetTimeout: true,
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`Retry attempt ${retryCount} for ${requestConfig.url}`);
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // Add auth token if available
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      // Request made but no response received
      console.error('API No Response:', {
        url: error.config?.url,
        message: error.message,
      });
    } else {
      // Error in request setup
      console.error('API Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Helper function to get auth token
async function getAuthToken() {
  try {
    // Import SecureStore dynamically to avoid circular dependencies
    const { default: * as SecureStore } = await import('expo-secure-store');
    return await SecureStore.getItemAsync('authToken');
  } catch (error) {
    console.error('Error accessing SecureStore:', error);
    return null;
  }
}

export default api;
