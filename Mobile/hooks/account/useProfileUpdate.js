/**
 * useProfileUpdate Hook
 *
 * Manages profile update operations (username, email, addresses).
 * Extracted from app/AccountManagement/Accountsetting.jsx.
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { accountService } from '../../services/accountService';
import { STORAGE_KEYS } from '../../constants/accountSettings';

/**
 * Custom hook for profile update operations
 *
 * @param {Object} userData - Current user data
 * @param {Function} setUserData - Function to update user data
 * @param {Object} formData - Form data state
 * @param {Function} setFormData - Function to update form data
 * @returns {Object} Profile update methods and loading state
 */
export const useProfileUpdate = (userData, setUserData, formData, setFormData) => {
  const [loading, setLoading] = useState(false);

  /**
   * Update username
   *
   * @param {string} tempUsername - New username
   * @param {Function} onSuccess - Callback on success
   */
  const updateUsername = async (tempUsername, onSuccess) => {
    if (!userData || !userData._id) {
      Alert.alert('Error', 'User data not found. Please log in again.');
      return;
    }

    if (!tempUsername || tempUsername.trim() === '') {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await accountService.updateProfileName(userData._id, tempUsername);

      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setFormData({ ...formData, username: tempUsername });

      Alert.alert('Success', 'Username updated successfully!');
      if (onSuccess) onSuccess();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update email with password verification
   *
   * @param {Function} onSuccess - Callback on success
   */
  const updateEmail = async (onSuccess) => {
    if (!userData || !userData._id) {
      Alert.alert('Error', 'User data not found. Please log in again.');
      return;
    }

    if (!formData.newEmail || !formData.emailPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await accountService.verifyEmail(
        userData._id,
        formData.emailPassword,
        formData.newEmail
      );

      let updatedUser = result;
      if (!result._id) {
        updatedUser = { ...userData, email: formData.newEmail };
      }

      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setFormData({
        ...formData,
        email: formData.newEmail,
        currentEmail: formData.newEmail,
        newEmail: '',
        emailPassword: '',
      });

      Alert.alert('Success', 'Email updated successfully! Please check your inbox for verification.');
      if (onSuccess) onSuccess();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update delivery address
   *
   * @param {Function} onSuccess - Callback on success
   */
  const updateDeliveryAddress = async (onSuccess) => {
    if (!userData || !userData._id) {
      Alert.alert('Error', 'User data not found. Please log in again.');
      return;
    }

    const { firstName, lastName, street, houseNumber, postalCode, location } =
      formData.deliveryAddress;

    if (!firstName || !lastName || !street || !houseNumber || !postalCode || !location) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const addressString = `${formData.deliveryAddress.firstName} ${formData.deliveryAddress.lastName}${
        formData.deliveryAddress.suffix ? ', ' + formData.deliveryAddress.suffix : ''
      }, ${formData.deliveryAddress.street} ${formData.deliveryAddress.houseNumber}, ${
        formData.deliveryAddress.postalCode
      }, ${formData.deliveryAddress.location}`;

      const updatedUser = await accountService.updateDeliveryAddress(userData._id, addressString);

      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setFormData({ ...formData, deliveryAddress: formData.deliveryAddress });

      Alert.alert('Success', 'Delivery address updated successfully!');
      if (onSuccess) onSuccess();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update address');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update billing address
   *
   * @param {Function} onSuccess - Callback on success
   */
  const updateBillingAddress = async (onSuccess) => {
    if (!userData || !userData._id) {
      Alert.alert('Error', 'User data not found. Please log in again.');
      return;
    }

    if (!formData.billingAddress || formData.billingAddress.trim() === '') {
      Alert.alert('Error', 'Please enter billing address');
      return;
    }

    setLoading(true);
    try {
      const result = await accountService.updateBillingAddress(
        userData._id,
        formData.billingAddress
      );

      let updatedUser = result;
      if (!result._id) {
        updatedUser = { ...userData, billingAddress: formData.billingAddress };
      }

      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      setUserData(updatedUser);

      Alert.alert('Success', 'Billing address updated successfully!');
      if (onSuccess) onSuccess();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update billing address');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    updateUsername,
    updateEmail,
    updateDeliveryAddress,
    updateBillingAddress,
  };
};
