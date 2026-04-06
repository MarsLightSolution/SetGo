import { create } from 'zustand';
import {
  setSession,
  getSession,
  clearSession,
  migrateFromAsyncStorage,
  setUserData,
} from '../services/secureAuthService';
import { API_ENDPOINTS } from '../config/api';
import logger from '../utils/logger';

const log = logger.create('Auth');

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  initialized: false,
  sessionExpired: false,

  /** Called by api.js when a token refresh fails. Triggers redirect in _layout. */
  setSessionExpired: (value) => set({ sessionExpired: value }),

  /**
   * Initialize auth state - call this on app startup
   * Handles migration from old storage and restores session
   */
  initialize: async () => {
    set({ loading: true });
    try {
      // Migrate old tokens to secure storage (one-time operation)
      await migrateFromAsyncStorage();

      // Check for existing session
      const session = await getSession();

      if (session.isAuthenticated && session.userData) {
        set({
          isAuthenticated: true,
          user: session.userData,
          loading: false,
          initialized: true,
        });
      } else {
        set({
          isAuthenticated: false,
          user: null,
          loading: false,
          initialized: true,
        });
      }
    } catch (error) {
      set({
        isAuthenticated: false,
        user: null,
        loading: false,
        initialized: true,
      });
    }
  },

  /**
   * Check authentication status
   * @deprecated Use initialize() on app startup instead
   */
  checkAuth: async () => {
    const { initialize } = get();
    await initialize();
  },

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{success: boolean, message: string}>}
   */
  login: async (email, password) => {
    // Input validation
    if (!email || !password) {
      return { success: false, message: 'Email and password are required' };
    }

    if (!API_ENDPOINTS.LOGIN) {
      return { success: false, message: 'API configuration error' };
    }

    set({ loading: true });

    try {
      const loginUrl = API_ENDPOINTS.LOGIN;
      log.info('🔐 Login attempt to:', loginUrl);

      // 1. Login request (credentials: 'include' to receive Set-Cookie)
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      log.info('🔐 Login response status:', response.status);

      const data = await response.json();

      // 2. Check login success
      if (response.status === 200 || response.status === 201) {
        const userId = data.userId;
        // Backend sends "Bearer <token>" — strip the prefix for clean storage
        const rawToken = data.accessToken || '';
        const accessToken = rawToken.replace(/^Bearer\s+/i, '');

        if (!accessToken || !userId) {
          set({ loading: false });
          return { success: false, message: 'Invalid server response' };
        }

        // 3. Extract refresh token from Set-Cookie header (if available)
        // On React Native, HttpOnly cookies are managed by the native cookie jar,
        // but we also store it locally as a fallback for the refresh interceptor.
        let refreshToken = null;
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          const match = setCookie.match(/refreshToken=([^;]+)/);
          if (match) {
            refreshToken = match[1];
          }
        }

        // 4. Create initial user object
        const basicUser = {
          _id: userId,
          userName: data.userName,
          userId: data.userId,
        };

        // 5. Store session securely (access token + refresh token + userId)
        await setSession({
          token: accessToken,
          refreshToken,
          userId: userId,
          userData: basicUser,
        });

        // 6. Fetch full user data
        const userRes = await fetch(API_ENDPOINTS.USER_DATA(userId), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
        });

        const userData = await userRes.json();

        if (userRes.ok && userData.data) {
          await setUserData(userData.data);

          set({
            isAuthenticated: true,
            user: userData.data,
            loading: false,
          });
          return { success: true, message: 'Login successful!' };
        } else {
          // Use basic user info if full fetch fails
          set({
            isAuthenticated: true,
            user: basicUser,
            loading: false,
          });
          return { success: true, message: 'Login successful!' };
        }
      } else {
        set({ loading: false });
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      log.error('🔐 Login error:', error.message, error);
      set({ loading: false });
      return { success: false, message: `Network error: ${error.message}` };
    }
  },

  /**
   * Logout user and clear all session data
   */
  logout: async () => {
    try {
      // Invalidate refresh token on the backend
      await fetch(API_ENDPOINTS.LOGOUT, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {});

      await clearSession();
      set({ isAuthenticated: false, user: null });
    } catch (error) {
      // Force clear state even if storage/network fails
      set({ isAuthenticated: false, user: null });
    }
  },

  /**
   * Update user data in store and storage
   * @param {Object} userData - Updated user data
   */
  updateUser: async (userData) => {
    if (!userData) return;

    try {
      await setUserData(userData);
      set({ user: userData });
    } catch (error) {
      // Update store even if storage fails
      set({ user: userData });
    }
  },
}));
