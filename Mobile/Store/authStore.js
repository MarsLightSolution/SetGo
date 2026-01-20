import { create } from 'zustand';
import {
  setSession,
  getSession,
  clearSession,
  migrateFromAsyncStorage,
  setUserData,
} from '../services/secureAuthService';

// Get API URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  initialized: false,

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

    if (!API_URL) {
      return { success: false, message: 'API configuration error' };
    }

    set({ loading: true });

    try {
      // 1. Login request
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // 2. Check login success
      if (response.status === 200 || response.status === 201) {
        const userId = data.userId;
        const accessToken = data.accessToken;

        if (!accessToken || !userId) {
          set({ loading: false });
          return { success: false, message: 'Invalid server response' };
        }

        // 3. Create initial user object
        const basicUser = {
          _id: userId,
          userName: data.userName,
          userId: data.userId,
        };

        // 4. Store session securely
        await setSession({
          token: accessToken,
          userId: userId,
          userData: basicUser,
        });

        // 5. Fetch full user data
        const userRes = await fetch(`${API_URL}/userdata/${userId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const userData = await userRes.json();

        if (userRes.ok && userData.data) {
          // Update with full user data
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
        // Invalid credentials or server error
        set({ loading: false });
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      set({ loading: false });
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  /**
   * Logout user and clear all session data
   */
  logout: async () => {
    try {
      await clearSession();
      set({ isAuthenticated: false, user: null });
    } catch (error) {
      // Force clear state even if storage fails
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
