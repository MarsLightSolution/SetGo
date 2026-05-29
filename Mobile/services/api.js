// services/api.js
import axios from 'axios';
import axiosRetry from 'axios-retry';
import {
  getAuthToken,
  setAuthToken,
  getRefreshToken,
  setRefreshToken,
  isTokenExpiringSoon,
} from './secureAuthService';
import { BASE_URL, API_ENDPOINTS } from '../config/api';
import { captureException } from './errorReporter';
import logger from '../utils/logger';

const log = logger.create('API');

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

// ==================== REFRESH LOGIC ====================

// Single in-flight refresh promise — all callers share it to avoid duplicate requests
let refreshPromise = null;

/**
 * Call the refresh endpoint and persist the new access token.
 * Returns the new token string on success, throws on failure.
 */
const performRefresh = async () => {
  const refreshToken = await getRefreshToken();

  const response = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Send in both Cookie header and body — works regardless of backend expectation
      ...(refreshToken ? { Cookie: `refreshToken=${refreshToken}` } : {}),
    },
    // Also pass in body so backends that read from body work too
    body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Refresh failed');

  const data = await response.json();
  if (!data.success || !data.accessToken) throw new Error('Invalid refresh response');

  const newToken = data.accessToken.replace(/^Bearer\s+/i, '');
  await setAuthToken(newToken); // also persists expiry via parseJwtExpiry
  if (data.refreshToken) {
    await setRefreshToken(data.refreshToken); // store rotated token
  }
  return newToken;
};

/**
 * Ensure a fresh token. If a refresh is already in-flight, the caller
 * joins that promise instead of firing a second request.
 */
const getOrRefreshToken = async (forceRefresh = false) => {
  if (refreshPromise) return await refreshPromise;

  if (!forceRefresh && !(await isTokenExpiringSoon())) {
    return await getAuthToken();
  }

  refreshPromise = performRefresh().finally(() => {
    refreshPromise = null;
  });

  return await refreshPromise;
};

/**
 * Signal session expiry to the rest of the app.
 * Calls authStore without creating a circular import by requiring lazily.
 */
const signalSessionExpired = () => {
  try {
    const { useAuthStore } = require('../Store/authStore');
    const store = useAuthStore.getState();
    store.logout();
    store.setSessionExpired(true);
  } catch {
    // authStore not ready — clear session directly as fallback
    const { clearSession } = require('./secureAuthService');
    clearSession().catch(() => {});
  }
};

// ==================== REQUEST INTERCEPTOR ====================
// Proactively refresh the token if it expires within 5 minutes
// so requests never fail mid-flight due to an expired token.

const AUTH_SKIP_URLS = ['/login', '/refreshAccessToken', '/signup'];

api.interceptors.request.use(
  async (config) => {
    try {
      const url = config.url || '';
      if (AUTH_SKIP_URLS.some((u) => url.includes(u))) return config;

      const token = await getOrRefreshToken().catch(async (err) => {
        // Proactive refresh failed → session expired
        log.warn('Proactive token refresh failed:', err?.message);
        signalSessionExpired();
        return null;
      });

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      // Continue without token — the 401 interceptor will catch it if needed
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== RESPONSE INTERCEPTOR ====================
// Safety net: if a 401 slips through (e.g., server-side token invalidation),
// attempt a forced refresh once. If that also fails, sign the user out.

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || '';
      if (AUTH_SKIP_URLS.some((u) => url.includes(u))) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const newToken = await getOrRefreshToken(true); // force refresh
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        signalSessionExpired();
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      log.warn('API Error:', { status: error.response.status, url: error.config?.url });
      // Report 5xx server errors to our error logger
      if (error.response.status >= 500) {
        captureException(error, {
          type: 'api',
          module: 'API',
          extra: { status: error.response.status, url: error.config?.url, method: error.config?.method },
        });
      }
    } else if (error.request) {
      log.warn('API No Response:', { message: error.message, url: error.config?.url });
    }

    return Promise.reject(error);
  }
);

export default api;
