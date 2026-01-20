/**
 * useNotificationSettings Hook
 *
 * Manages notification preference toggles (newsletter, messages).
 * Extracted from app/AccountManagement/Accountsetting.jsx.
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { accountService } from '../../services/accountService';
import { STORAGE_KEYS } from '../../constants/accountSettings';

/**
 * Custom hook for notification settings
 *
 * @param {Object} userData - Current user data
 * @param {Function} setUserData - Function to update user data
 * @param {Object} formData - Form data state
 * @param {Function} setFormData - Function to update form data
 * @returns {Object} Notification toggle methods and loading states
 */
export const useNotificationSettings = (userData, setUserData, formData, setFormData) => {
  const [toggleLoading, setToggleLoading] = useState({
    newsletter: false,
    messageforuser: false,
  });

  /**
   * Toggle newsletter subscription
   *
   * @param {boolean} value - New newsletter value
   */
  const toggleNewsletter = async (value) => {
    if (!userData || !userData._id) {
      Alert.alert('Error', 'User data not found. Please log in again.');
      return;
    }

    setToggleLoading({ ...toggleLoading, newsletter: true });
    try {
      const result = await accountService.toggleNewsletter(userData._id);

      let updatedUser = result;
      if (!result._id) {
        updatedUser = { ...userData, newsletter: value };
      }

      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setFormData({ ...formData, newsletter: updatedUser.newsletter });
    } catch (error) {
      Alert.alert('Error', 'Failed to update newsletter preference');
    } finally {
      setToggleLoading({ ...toggleLoading, newsletter: false });
    }
  };

  /**
   * Toggle message notifications
   *
   * @param {boolean} value - New message notification value
   */
  const toggleMessages = async (value) => {
    if (!userData || !userData._id) {
      Alert.alert('Error', 'User data not found. Please log in again.');
      return;
    }

    setToggleLoading({ ...toggleLoading, messageforuser: true });
    try {
      const result = await accountService.toggleMessages(userData._id);

      let updatedUser = result;
      if (!result._id) {
        updatedUser = { ...userData, messageforuser: value };
      }

      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setFormData({ ...formData, messageforuser: updatedUser.messageforuser });
    } catch (error) {
      Alert.alert('Error', 'Failed to update messages preference');
    } finally {
      setToggleLoading({ ...toggleLoading, messageforuser: false });
    }
  };

  return {
    toggleLoading,
    toggleNewsletter,
    toggleMessages,
  };
};
