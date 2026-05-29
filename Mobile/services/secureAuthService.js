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
  TOKEN_EXPIRY: 'token_expiry', // Unix ms timestamp when access token expires
};

// Non-sensitive data can use AsyncStorage
const STORAGE_KEYS = {
  USER_DATA: 'userData',
  USER_PREFERENCES: 'userPreferences',
};

// Cached once — avoids repeated async I/O on every token read/write
let _secureAvailable = null;
const isSecureStoreAvailable = async () => {
  if (_secureAvailable !== null) return _secureAvailable;
  try {
    await SecureStore.getItemAsync('__test__');
    _secureAvailable = true;
  } catch {
    _secureAvailable = false;
  }
  return _secureAvailable;
};

// ==================== JWT HELPERS ====================

/**
 * Parse the expiry timestamp from a JWT without any external library.
 * Returns a Unix timestamp in milliseconds, or null if parsing fails.
 * @param {string} token - The JWT access token
 * @returns {number|null}
 */
export const parseJwtExpiry = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    // Convert URL-safe base64 → standard base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    const decoded = JSON.parse(jsonPayload);
    return decoded.exp ? decoded.exp * 1000 : null; // seconds → milliseconds
  } catch {
    return null;
  }
};

// ==================== TOKEN MANAGEMENT ====================

/**
 * Store authentication token securely and persist its expiry timestamp.
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
    // Always persist expiry so proactive refresh can work without re-decoding JWT
    const expiry = parseJwtExpiry(token);
    if (expiry) {
      await setTokenExpiry(expiry);
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

// ==================== TOKEN EXPIRY MANAGEMENT ====================

/**
 * Persist token expiry timestamp (Unix ms).
 * Called automatically by setAuthToken — no need to call manually.
 */
export const setTokenExpiry = async (expiresAtMs) => {
  try {
    const secureAvailable = await isSecureStoreAvailable();
    const value = String(expiresAtMs);
    if (secureAvailable) {
      await SecureStore.setItemAsync(SECURE_KEYS.TOKEN_EXPIRY, value);
    } else {
      await AsyncStorage.setItem(SECURE_KEYS.TOKEN_EXPIRY, value);
    }
  } catch {
    // Non-critical — expiry just won't be tracked
  }
};

/**
 * Retrieve token expiry timestamp in Unix ms, or null.
 */
export const getTokenExpiry = async () => {
  try {
    const secureAvailable = await isSecureStoreAvailable();
    const raw = secureAvailable
      ? await SecureStore.getItemAsync(SECURE_KEYS.TOKEN_EXPIRY)
      : await AsyncStorage.getItem(SECURE_KEYS.TOKEN_EXPIRY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
};

/** Remove expiry on logout */
export const removeTokenExpiry = async () => {
  try {
    const secureAvailable = await isSecureStoreAvailable();
    if (secureAvailable) {
      await SecureStore.deleteItemAsync(SECURE_KEYS.TOKEN_EXPIRY);
    } else {
      await AsyncStorage.removeItem(SECURE_KEYS.TOKEN_EXPIRY);
    }
  } catch {
    // Silently fail
  }
};

/**
 * Returns true if the stored access token expires within `bufferMs` milliseconds.
 * Defaults to a 5-minute buffer so refresh happens proactively.
 * Returns false if no expiry is stored (can't tell → optimistic).
 */
export const isTokenExpiringSoon = async (bufferMs = 5 * 60 * 1000) => {
  try {
    const expiry = await getTokenExpiry();
    if (!expiry) return false;
    return Date.now() >= expiry - bufferMs;
  } catch {
    return false;
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
      removeTokenExpiry(),
    ]);
  } catch (error) {
    // Attempt individual removals if parallel fails
    await removeAuthToken().catch(() => {});
    await removeRefreshToken().catch(() => {});
    await removeUserId().catch(() => {});
    await removeUserData().catch(() => {});
    await removeTokenExpiry().catch(() => {});
  }
};

// ==================== MIGRATION HELPER ====================

/**
 * Migrate tokens from old AsyncStorage keys to new secure storage
 * Call this once on app startup to migrate existing users
 */
export const migrateFromAsyncStorage = async () => {
  try {
    const done = await AsyncStorage.getItem('__migration_done__');
    if (done) return false;

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

      await AsyncStorage.setItem('__migration_done__', '1');
      return true; // Migration performed
    }

    await AsyncStorage.setItem('__migration_done__', '1');
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
  // Token Expiry
  setTokenExpiry,
  getTokenExpiry,
  removeTokenExpiry,
  isTokenExpiringSoon,
  parseJwtExpiry,
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
