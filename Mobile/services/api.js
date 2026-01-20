// services/api.js
import axios from 'axios';
import Constants from 'expo-constants';
import axiosRetry from 'axios-retry';
import { getAuthToken } from './secureAuthService';

// Read API URL from environment or app.config.js extra
const extra = (Constants.expoConfig || Constants.manifest || {}).extra || {};
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;

// Use environment variable first, then app config
export const API_URL = envApiUrl || extra.apiUrl;

// Validate API URL is configured
if (!API_URL) {
  if (__DEV__) {
    console.warn(
      'API_URL is not configured. Set EXPO_PUBLIC_API_URL in your .env file.'
    );
  }
}

// Create Axios Instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: false,
});

// Axios Retry for transient failures
axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network + 5xx server errors
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status >= 500 && error.response?.status <= 599)
    );
  },
  shouldResetTimeout: true,
});

// Request Interceptor - Add Auth Token
api.interceptors.request.use(
  async (config) => {
    try {
      // Use centralized secure auth service
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      // Continue without token if retrieval fails
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Error Handling
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Only log errors in development
    if (__DEV__) {
      if (error.response) {
        console.warn('API Error:', {
          status: error.response.status,
          url: error.config?.url,
        });
      } else if (error.request) {
        console.warn('API No Response:', {
          message: error.message,
          url: error.config?.url,
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
