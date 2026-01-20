/**
 * Storage Utilities
 *
 * Helper functions for AsyncStorage operations.
 * Extracted from app/AccountManagement/Accountsetting.jsx for reusability.
 *
 * NOTE: These functions currently use AsyncStorage.
 * TODO: Migrate to expo-secure-store for sensitive data (auth tokens, user credentials).
 * See PRODUCTION_READINESS_AUDIT.md for security requirements.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/accountSettings';

/**
 * Get user data from AsyncStorage
 *
 * @returns {Promise<Object|null>} User data object or null if not found
 */
export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!userData) {
      console.warn('No user data found in storage');
      return null;
    }
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error getting user data from storage:', error);
    return null;
  }
};

/**
 * Save user data to AsyncStorage
 *
 * Call this after successful login to persist user information.
 *
 * @param {Object} userData - User data object to save
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    console.log('User data saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

/**
 * Remove user data from AsyncStorage
 *
 * Call this on logout to clear stored user information.
 *
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const clearUserData = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    console.log('User data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    return false;
  }
};
