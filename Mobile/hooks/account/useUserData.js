/**
 * useUserData Hook
 *
 * Manages user data loading, initialization, and user ads.
 * Extracted from app/AccountManagement/Accountsetting.jsx.
 */

import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getUserData } from '../../utils/storage';
import { accountService } from '../../services/accountService';
import logger from '../../utils/logger';

const log = logger.create('UserData');

/**
 * Custom hook for managing user data and initialization
 *
 * @returns {Object} User data state and methods
 * @property {Object|null} userData - Current user data
 * @property {Function} setUserData - Update user data
 * @property {Array} userAds - User's posted ads
 * @property {Function} setUserAds - Update user ads
 * @property {boolean} initialLoading - Initial loading state
 * @property {Object} formData - Form data state
 * @property {Function} setFormData - Update form data
 * @property {Function} loadUserAds - Load user's ads
 * @property {Function} initializeApp - Initialize app data
 */
export const useUserData = () => {
  const [userData, setUserData] = useState(null);
  const [userAds, setUserAds] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentEmail: '',
    newEmail: '',
    emailPassword: '',
    phoneNumber: '',
    countryCode: '+91',
    otp: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    deliveryAddress: {
      firstName: '',
      lastName: '',
      suffix: '',
      street: '',
      houseNumber: '',
      postalCode: '',
      location: '',
    },
    billingAddress: '',
    newsletter: false,
    messageforuser: false,
  });

  /**
   * Load user's posted ads
   *
   * @param {string} userId - User ID
   */
  const loadUserAds = async (userId) => {
    try {
      const ads = await accountService.getUserAds(userId);
      setUserAds(ads);
    } catch (error) {
      log.error('Load ads error:', error);
      setUserAds([]);
    }
  };

  /**
   * Initialize app by loading user data from storage
   */
  const initializeApp = async () => {
    try {
      setInitialLoading(true);

      const storedUserData = await getUserData();

      if (!storedUserData) {
        Alert.alert('No User Data Found', 'Please log in first.', [{ text: 'OK' }]);
        setInitialLoading(false);
        return;
      }

      setUserData(storedUserData);

      // Parse delivery address
      let parsedDeliveryAddress = {
        firstName: '',
        lastName: '',
        suffix: '',
        street: '',
        houseNumber: '',
        postalCode: '',
        location: '',
      };

      if (storedUserData.deliveryAddress && storedUserData.deliveryAddress !== 'NA') {
        try {
          parsedDeliveryAddress =
            typeof storedUserData.deliveryAddress === 'string'
              ? JSON.parse(storedUserData.deliveryAddress)
              : storedUserData.deliveryAddress;
        } catch (e) {
          log.debug('Could not parse delivery address');
        }
      }

      // Update form data with stored user data
      setFormData((prev) => ({
        ...prev,
        username: storedUserData.username || storedUserData.chatDisplayName || '',
        email: storedUserData.email || '',
        currentEmail: storedUserData.email || '',
        phoneNumber: storedUserData.phoneNumber || '',
        deliveryAddress: parsedDeliveryAddress,
        billingAddress: storedUserData.billingAddress || '',
        newsletter: storedUserData.newsletter || false,
        messageforuser: storedUserData.messageforuser || false,
      }));

      // Load user ads if user ID exists
      if (storedUserData._id) {
        loadUserAds(storedUserData._id);
      }
    } catch (error) {
      log.error('Initialize app error:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setInitialLoading(false);
    }
  };

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  return {
    userData,
    setUserData,
    userAds,
    setUserAds,
    initialLoading,
    formData,
    setFormData,
    loadUserAds,
    initializeApp,
  };
};
