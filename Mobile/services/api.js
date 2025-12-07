// services/api.js
import axios from 'axios';
import Constants from 'expo-constants';
import axiosRetry from 'axios-retry';
import * as SecureStore from 'expo-secure-store';

// 1️⃣ Read API URL from app.json > expo.extra.apiUrl
const extra = (Constants.expoConfig || Constants.manifest || {}).extra || {};
export const API_URL = extra.apiUrl || "http://51.20.123.49/api";

// 2️⃣ Create Axios Instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: false, // Change only if your backend needs cookies
});

// 3️⃣ Axios Retry
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
  onRetry: (count, error, config) => {
    console.log(`Retry ${count} → ${config?.url}`);
  },
});

// 4️⃣ Request Interceptor (Add Token)
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Auth token error:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 5️⃣ Response Interceptor (Error Logging)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response) {
      console.error("API Error:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      console.error("API No Response:", {
        message: error.message,
        url: error.config?.url,
      });
    } else {
      console.error("API Request Setup Error:", error.message);
    }
    return Promise.reject(error);
  }
);

// 6️⃣ Export final axios instance
export default api;
