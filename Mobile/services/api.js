// services/api.js
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { getAuthToken, setAuthToken, getRefreshToken } from './secureAuthService';
import { BASE_URL, API_ENDPOINTS } from '../config/api';

// Create Axios Instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // Enable cookies for refresh token
});

// Axios Retry for transient failures (skip 401 — handled by refresh interceptor)
axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    if (error.response?.status === 401) return false; // Don't retry 401s
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

// --- Refresh Token Logic ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor - 401 Auto-Refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh for auth endpoints themselves
      const url = originalRequest.url || '';
      if (url.includes('/login') || url.includes('/refreshAccessToken') || url.includes('/signup')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh using stored refresh token as cookie
        const refreshToken = await getRefreshToken();

        const refreshResponse = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(refreshToken ? { Cookie: `refreshToken=${refreshToken}` } : {}),
          },
          credentials: 'include',
        });

        if (!refreshResponse.ok) {
          throw new Error('Refresh failed');
        }

        const data = await refreshResponse.json();

        if (data.success && data.accessToken) {
          // Strip "Bearer " prefix if present
          const newToken = data.accessToken.replace(/^Bearer\s+/i, '');
          await setAuthToken(newToken);

          // Update the failed request and queued requests
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);

          return api(originalRequest);
        } else {
          throw new Error('Invalid refresh response');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Force logout — import dynamically to avoid circular dependency
        try {
          const { useAuthStore } = require('../Store/authStore');
          useAuthStore.getState().logout();
        } catch (e) {
          // Fallback: clear session directly
          const { clearSession } = require('./secureAuthService');
          clearSession();
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Log non-401 errors in development
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
