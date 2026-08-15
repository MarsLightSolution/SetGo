/**
 * Account Service
 *
 * API service layer for account management operations.
 * Extracted from app/AccountManagement/Accountsetting.jsx for reusability.
 *
 * Uses the shared `api` axios instance (services/api.js) instead of raw
 * fetch(), so every call here gets:
 *  - Authorization headers attached automatically (proactive token refresh)
 *  - The 401 → refresh → retry safety net
 *  - Automatic retry on transient network/5xx failures
 *  - 5xx errors reported to errorReporter (crash/error dashboard)
 * consistent with the rest of the app's data layer.
 */

import api from './api';
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
      const { data } = await api.get(API_ENDPOINTS.USER_DATA(userId));
      return data;
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
      const { data } = await api.patch(API_ENDPOINTS.UPDATE_PROFILE_NAME(userId), { profileName });
      return data.data; // Return the updated user data
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
      const { data } = await api.post(API_ENDPOINTS.EMAIL_VERIFY, { userId, password, newEmail });
      return data.data || data; // Return updated user data if available
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
      const { data } = await api.patch(API_ENDPOINTS.UPDATE_DELIVERY_ADDRESS(userId), { deliveryAddress });
      return data.data; // Return the updated user data
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
      const { data } = await api.patch(API_ENDPOINTS.UPDATE_BILLING_ADDRESS(userId), { billingAddress });
      return data.data || data; // Return updated user data if available
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
      const { data } = await api.post(API_ENDPOINTS.SEND_OTP, phoneData);
      return data;
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
      const { data } = await api.post(API_ENDPOINTS.VERIFY_OTP, otpData);
      return data.data || data; // Return updated user data if available
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
      const { data } = await api.patch(API_ENDPOINTS.UPDATE_PASSWORD(userId), passwordData);
      return data.data || data; // Return updated user data if available
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
      const { data } = await api.get(API_ENDPOINTS.NEWSLETTER(userId));
      return data.data || data; // Return updated user data if available
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
      const { data } = await api.get(API_ENDPOINTS.USER_MESSAGES(userId));
      return data.data || data; // Return updated user data if available
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
      const { data } = await api.get(API_ENDPOINTS.USER_ADS(userId));
      return Array.isArray(data.data) ? data.data : [];
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
      const { data } = await api.delete(API_ENDPOINTS.DELETE_USER(userId));
      return data;
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
