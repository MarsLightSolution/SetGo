/**
 * Account Service
 *
 * API service layer for account management operations.
 * Extracted from app/AccountManagement/Accountsetting.jsx for reusability.
 *
 * TODO: Security improvements needed before production:
 * 1. Replace fetch() with axios instance from services/api.js for consistent auth headers
 * 2. Add request/response interceptors for error handling
 * 3. Migrate from HTTP to HTTPS endpoints
 * 4. Add request retry logic for failed calls
 * 5. Implement proper error tracking (Sentry)
 *
 * See PRODUCTION_READINESS_AUDIT.md for full security requirements.
 */

import { API_ENDPOINTS } from '../config/api';
import logger from '../utils/logger';

const log = logger.create('Account');

/**
 * Account Service
 *
 * Provides methods for managing user account data, security settings,
 * notifications, and account operations.
 */
export const accountService = {
  // ==================== PROFILE APIs ====================

  /**
   * Get user profile data
   *
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile data
   */
  getUserProfile: async (userId) => {
    try {
      const response = await fetch(API_ENDPOINTS.USER_DATA(userId));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();

      try {
        return JSON.parse(text);
      } catch (e) {
        log.error('API returned non-JSON response:', text);
        throw new Error('Server error: Invalid response format');
      }
    } catch (error) {
      log.error('getUserProfile error:', error);
      throw error;
    }
  },

  /**
   * Update user's profile name
   *
   * @param {string} userId - User ID
   * @param {string} profileName - New profile name
   * @returns {Promise<Object>} Updated user data
   */
  updateProfileName: async (userId, profileName) => {
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_PROFILE_NAME(userId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileName: profileName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return data.data; // Return the updated user data
      } catch (e) {
        throw new Error('Server error: Invalid response format');
      }
    } catch (error) {
      log.error('updateProfileName error:', error);
      throw error;
    }
  },

  /**
   * Verify and update user email
   *
   * Sends verification emails to both old and new email addresses.
   *
   * @param {string} userId - User ID
   * @param {string} password - Current password for verification
   * @param {string} newEmail - New email address
   * @returns {Promise<Object>} Updated user data
   */
  verifyEmail: async (userId, password, newEmail) => {
    try {
      const response = await fetch(API_ENDPOINTS.EMAIL_VERIFY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          password: password,
          newEmail: newEmail,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return data.data || data; // Return updated user data if available
      } catch (e) {
        throw new Error('Server error: Invalid response format');
      }
    } catch (error) {
      log.error('verifyEmail error:', error);
      throw error;
    }
  },

  /**
   * Update delivery address
   *
   * @param {string} userId - User ID
   * @param {Object} deliveryAddress - Delivery address object with fields:
   *   firstName, lastName, suffix, street, houseNumber, postalCode, location
   * @returns {Promise<Object>} Updated user data
   */
  updateDeliveryAddress: async (userId, deliveryAddress) => {
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_DELIVERY_ADDRESS(userId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryAddress: deliveryAddress }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return data.data; // Return the updated user data
      } catch (e) {
        throw new Error('Server error: Invalid response format');
      }
    } catch (error) {
      log.error('updateDeliveryAddress error:', error);
      throw error;
    }
  },

  /**
   * Update billing address
   *
   * @param {string} userId - User ID
   * @param {string} billingAddress - Billing address string
   * @returns {Promise<Object>} Updated user data
   */
  updateBillingAddress: async (userId, billingAddress) => {
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_BILLING_ADDRESS(userId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingAddress: billingAddress }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return data.data || data; // Return updated user data if available
      } catch (e) {
        throw new Error('Server error: Invalid response format');
      }
    } catch (error) {
      log.error('updateBillingAddress error:', error);
      throw error;
    }
  },

  // ==================== SECURITY APIs ====================

  /**
   * Send OTP to phone number
   *
   * @param {Object} phoneData - Phone data object: { userId, countryCode, phoneNumber }
   * @returns {Promise<Object>} API response
   */
  sendOTP: async (phoneData) => {
    try {
      const response = await fetch(API_ENDPOINTS.SEND_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(phoneData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error('Server error: Invalid response format');
      }
    } catch (error) {
      log.error('sendOTP error:', error);
      throw error;
    }
  },

  /**
   * Verify OTP code
   *
   * @param {Object} otpData - OTP data object: { userId, phoneNumber, otp }
   * @returns {Promise<Object>} Updated user data
   */
  verifyOTP: async (otpData) => {
    try {
      const response = await fetch(API_ENDPOINTS.VERIFY_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(otpData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return data.data || data; // Return updated user data if available
      } catch (e) {
        throw new Error('Server error: Invalid response format');
      }
    } catch (error) {
      log.error('verifyOTP error:', error);
      throw error;
    }
  },

  /**
   * Update user password
   *
   * @param {string} userId - User ID
   * @param {Object} passwordData - Password data: { currentPassword, newPassword }
   * @returns {Promise<Object>} Updated user data
   */
  updatePassword: async (userId, passwordData) => {
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_PASSWORD(userId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return data.data || data; // Return updated user data if available
      } catch (e) {
        throw new Error('Server error: Invalid response format');
      }
    } catch (error) {
      log.error('updatePassword error:', error);
      throw error;
    }
  },

  // ==================== NOTIFICATION APIs ====================

  /**
   * Toggle newsletter subscription
   *
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user data with newsletter status
   */
  toggleNewsletter: async (userId) => {
    try {
      const response = await fetch(API_ENDPOINTS.NEWSLETTER(userId));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return data.data || data; // Return updated user data if available
      } catch (e) {
        throw new Error('Server error: Invalid response format');
      }
    } catch (error) {
      log.error('toggleNewsletter error:', error);
      throw error;
    }
  },

  /**
   * Toggle message notifications
   *
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user data with message notification status
   */
  toggleMessages: async (userId) => {
    try {
      const response = await fetch(API_ENDPOINTS.USER_MESSAGES(userId));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return data.data || data; // Return updated user data if available
      } catch (e) {
        throw new Error('Server error: Invalid response format');
      }
    } catch (error) {
      log.error('toggleMessages error:', error);
      throw error;
    }
  },

  // ==================== USER ADS APIs ====================

  /**
   * Get user's posted ads/products
   *
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of user's ads
   */
  getUserAds: async (userId) => {
    try {
      const response = await fetch(API_ENDPOINTS.USER_ADS(userId));
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return Array.isArray(data.data) ? data.data : [];
      } catch (e) {
        throw new Error('Server error: Invalid response format');
      }
    } catch (error) {
      log.error('getUserAds error:', error);
      return [];
    }
  },

  // ==================== ACCOUNT MANAGEMENT APIs ====================

  /**
   * Delete user account
   *
   * WARNING: This action is irreversible!
   *
   * @param {string} userId - User ID
   * @returns {Promise<Object>} API response
   */
  deleteUser: async (userId) => {
    try {
      const response = await fetch(API_ENDPOINTS.DELETE_USER(userId), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error('Server error: Invalid response format');
      }
    } catch (error) {
      log.error('deleteUser error:', error);
      throw error;
    }
  },
};

/**
 * Export default for convenient importing
 */
export default accountService;
