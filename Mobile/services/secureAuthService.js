/**
 * Secure Authentication Service
 *
 * This is the SINGLE SOURCE OF TRUTH for auth token management.
 * Uses expo-secure-store for encrypted storage on both iOS and Android.
 *
 * IMPORTANT: All auth-related storage operations should use this service.
 * Do NOT use AsyncStorage directly for tokens or sensitive user data.
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Standardized key names for secure storage
const SECURE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
};

// Non-sensitive data can use AsyncStorage
const STORAGE_KEYS = {
  USER_DATA: 'userData',
  USER_PREFERENCES: 'userPreferences',
};

/**
 * Check if SecureStore is available on this device
 * Falls back to AsyncStorage on unsupported platforms (web)
 */
const isSecureStoreAvailable = async () => {
  try {
    await SecureStore.getItemAsync('__test__');
    return true;
  } catch {
    return false;
  }
};

// ==================== TOKEN MANAGEMENT ====================

/**
 * Store authentication token securely
 * @param {string} token - The JWT access token
 */
export const setAuthToken = async (token) => {
  if (!token) {
    throw new Error('Token is required');
  }

  try {
    const secureAvailable = await isSecureStoreAvailable();
    if (secureAvailable) {
      await SecureStore.setItemAsync(SECURE_KEYS.AUTH_TOKEN, token);
    } else {
      // Fallback for web/unsupported platforms (less secure)
      await AsyncStorage.setItem(SECURE_KEYS.AUTH_TOKEN, token);
    }
  } catch (error) {
    throw new Error(`Failed to store auth token: ${error.message}`);
  }
};

/**
 * Retrieve authentication token
 * @returns {Promise<string|null>} The stored token or null
 */
export const getAuthToken = async () => {
  try {
    const secureAvailable = await isSecureStoreAvailable();
    if (secureAvailable) {
      return await SecureStore.getItemAsync(SECURE_KEYS.AUTH_TOKEN);
    } else {
      return await AsyncStorage.getItem(SECURE_KEYS.AUTH_TOKEN);
    }
  } catch (error) {
    return null;
  }
};

/**
 * Remove authentication token (for logout)
 */
export const removeAuthToken = async () => {
  try {
    const secureAvailable = await isSecureStoreAvailable();
    if (secureAvailable) {
      await SecureStore.deleteItemAsync(SECURE_KEYS.AUTH_TOKEN);
    } else {
      await AsyncStorage.removeItem(SECURE_KEYS.AUTH_TOKEN);
    }
  } catch (error) {
    // Silently fail on removal errors
  }
};

// ==================== REFRESH TOKEN MANAGEMENT ====================

/**
 * Store refresh token securely
 * @param {string} token - The JWT refresh token
 */
export const setRefreshToken = async (token) => {
  if (!token) return;

  try {
    const secureAvailable = await isSecureStoreAvailable();
    if (secureAvailable) {
      await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, token);
    } else {
      await AsyncStorage.setItem(SECURE_KEYS.REFRESH_TOKEN, token);
    }
  } catch (error) {
    throw new Error(`Failed to store refresh token: ${error.message}`);
  }
};

/**
 * Retrieve refresh token
 * @returns {Promise<string|null>} The stored refresh token or null
 */
export const getRefreshToken = async () => {
  try {
    const secureAvailable = await isSecureStoreAvailable();
    if (secureAvailable) {
      return await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    } else {
      return await AsyncStorage.getItem(SECURE_KEYS.REFRESH_TOKEN);
    }
  } catch (error) {
    return null;
  }
};

/**
 * Remove refresh token (for logout)
 */
export const removeRefreshToken = async () => {
  try {
    const secureAvailable = await isSecureStoreAvailable();
    if (secureAvailable) {
      await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    } else {
      await AsyncStorage.removeItem(SECURE_KEYS.REFRESH_TOKEN);
    }
  } catch (error) {
    // Silently fail on removal errors
  }
};

// ==================== USER ID MANAGEMENT ====================

/**
 * Store user ID securely
 * @param {string} userId - The user's ID
 */
export const setUserId = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const secureAvailable = await isSecureStoreAvailable();
    if (secureAvailable) {
      await SecureStore.setItemAsync(SECURE_KEYS.USER_ID, userId);
    } else {
      await AsyncStorage.setItem(SECURE_KEYS.USER_ID, userId);
    }
  } catch (error) {
    throw new Error(`Failed to store user ID: ${error.message}`);
  }
};

/**
 * Retrieve user ID
 * @returns {Promise<string|null>} The stored user ID or null
 */
export const getUserId = async () => {
  try {
    const secureAvailable = await isSecureStoreAvailable();
    if (secureAvailable) {
      return await SecureStore.getItemAsync(SECURE_KEYS.USER_ID);
    } else {
      return await AsyncStorage.getItem(SECURE_KEYS.USER_ID);
    }
  } catch (error) {
    return null;
  }
};

/**
 * Remove user ID (for logout)
 */
export const removeUserId = async () => {
  try {
    const secureAvailable = await isSecureStoreAvailable();
    if (secureAvailable) {
      await SecureStore.deleteItemAsync(SECURE_KEYS.USER_ID);
    } else {
      await AsyncStorage.removeItem(SECURE_KEYS.USER_ID);
    }
  } catch (error) {
    // Silently fail on removal errors
  }
};

// ==================== USER DATA MANAGEMENT ====================
// Non-sensitive user data (name, email, preferences) uses AsyncStorage

/**
 * Store user data (non-sensitive profile info)
 * @param {Object} userData - User profile data
 */
export const setUserData = async (userData) => {
  if (!userData) {
    throw new Error('User data is required');
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  } catch (error) {
    throw new Error(`Failed to store user data: ${error.message}`);
  }
};

/**
 * Retrieve user data
 * @returns {Promise<Object|null>} The stored user data or null
 */
export const getUserData = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Remove user data (for logout)
 */
export const removeUserData = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    // Silently fail on removal errors
  }
};

// ==================== SESSION MANAGEMENT ====================

/**
 * Store all auth session data at once (after login)
 * @param {Object} session - Session data containing token, userId, userData
 */
export const setSession = async ({ token, refreshToken, userId, userData }) => {
  try {
    // Store sensitive data securely
    if (token) {
      await setAuthToken(token);
    }
    if (refreshToken) {
      await setRefreshToken(refreshToken);
    }
    if (userId) {
      await setUserId(userId);
    }
    // Store non-sensitive data
    if (userData) {
      await setUserData(userData);
    }
  } catch (error) {
    throw new Error(`Failed to store session: ${error.message}`);
  }
};

/**
 * Retrieve complete session data
 * @returns {Promise<Object>} Session with token, userId, userData
 */
export const getSession = async () => {
  try {
    const [token, refreshToken, userId, userData] = await Promise.all([
      getAuthToken(),
      getRefreshToken(),
      getUserId(),
      getUserData(),
    ]);

    return {
      token,
      refreshToken,
      userId,
      userData,
      isAuthenticated: !!(token && userId),
    };
  } catch (error) {
    return {
      token: null,
      refreshToken: null,
      userId: null,
      userData: null,
      isAuthenticated: false,
    };
  }
};

/**
 * Clear all auth session data (for logout)
 */
export const clearSession = async () => {
  try {
    await Promise.all([
      removeAuthToken(),
      removeRefreshToken(),
      removeUserId(),
      removeUserData(),
    ]);
  } catch (error) {
    // Attempt individual removals if parallel fails
    await removeAuthToken().catch(() => {});
    await removeRefreshToken().catch(() => {});
    await removeUserId().catch(() => {});
    await removeUserData().catch(() => {});
  }
};

// ==================== MIGRATION HELPER ====================

/**
 * Migrate tokens from old AsyncStorage keys to new secure storage
 * Call this once on app startup to migrate existing users
 */
export const migrateFromAsyncStorage = async () => {
  try {
    // Check for old token format
    const oldToken = await AsyncStorage.getItem('token');
    const oldUserId = await AsyncStorage.getItem('userId');
    const oldUser = await AsyncStorage.getItem('user');

    if (oldToken || oldUserId) {
      // Migrate to secure storage
      if (oldToken) {
        await setAuthToken(oldToken);
        await AsyncStorage.removeItem('token');
      }

      if (oldUserId) {
        await setUserId(oldUserId);
        await AsyncStorage.removeItem('userId');
      }

      if (oldUser) {
        try {
          const userData = JSON.parse(oldUser);
          await setUserData(userData);
        } catch {
          // Invalid JSON, skip
        }
        await AsyncStorage.removeItem('user');
      }

      return true; // Migration performed
    }

    return false; // No migration needed
  } catch (error) {
    return false;
  }
};

// Export key constants for reference
export { SECURE_KEYS, STORAGE_KEYS };

// Default export with all methods
export default {
  // Access Token
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  // Refresh Token
  setRefreshToken,
  getRefreshToken,
  removeRefreshToken,
  // User ID
  setUserId,
  getUserId,
  removeUserId,
  // User Data
  setUserData,
  getUserData,
  removeUserData,
  // Session
  setSession,
  getSession,
  clearSession,
  // Migration
  migrateFromAsyncStorage,
  // Constants
  SECURE_KEYS,
  STORAGE_KEYS,
};
