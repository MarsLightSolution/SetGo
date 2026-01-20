/**
 * useSecurityUpdate Hook
 *
 * Manages security operations (phone verification, password update).
 * Extracted from app/AccountManagement/Accountsetting.jsx.
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { accountService } from '../../services/accountService';
import { STORAGE_KEYS } from '../../constants/accountSettings';

/**
 * Custom hook for security update operations
 *
 * @param {Object} userData - Current user data
 * @param {Function} setUserData - Function to update user data
 * @param {Object} formData - Form data state
 * @param {Function} setFormData - Function to update form data
 * @returns {Object} Security update methods and state
 */
export const useSecurityUpdate = (userData, setUserData, formData, setFormData) => {
  const [loading, setLoading] = useState(false);
  const [phoneStep, setPhoneStep] = useState(1); // 1: enter phone, 2: verify OTP

  /**
   * Send OTP to phone number
   *
   * @param {Function} onSuccess - Callback on success
   */
  const sendOTP = async (onSuccess) => {
    if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      await accountService.sendOTP({
        countryCode: formData.countryCode,
        phoneNumber: formData.phoneNumber,
      });
      setPhoneStep(2);
      Alert.alert('Success', 'OTP sent successfully to your phone');
      if (onSuccess) onSuccess();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify OTP code
   *
   * @param {Function} onSuccess - Callback on success
   */
  const verifyOTP = async (onSuccess) => {
    if (!userData || !userData._id) {
      Alert.alert('Error', 'User data not found. Please log in again.');
      return;
    }

    if (!formData.otp || formData.otp.length !== 6) {
      Alert.alert('Error', 'Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await accountService.verifyOTP({
        countryCode: formData.countryCode,
        phoneNumber: formData.phoneNumber,
        otp: formData.otp,
      });

      let updatedUser = result;
      if (!result._id) {
        updatedUser = { ...userData, phoneNumber: formData.phoneNumber };
      }

      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      setUserData(updatedUser);

      Alert.alert('Success', 'Phone number verified successfully!');
      setPhoneStep(1);
      setFormData({ ...formData, otp: '' });
      if (onSuccess) onSuccess();
    } catch (error) {
      Alert.alert('Error', error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update password
   *
   * @param {Function} onSuccess - Callback on success
   */
  const updatePassword = async (onSuccess) => {
    if (!userData || !userData._id) {
      Alert.alert('Error', 'User data not found. Please log in again.');
      return;
    }

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await accountService.updatePassword(userData._id, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (result._id) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(result));
        setUserData(result);
      }

      Alert.alert('Success', 'Password updated successfully!');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    phoneStep,
    setPhoneStep,
    sendOTP,
    verifyOTP,
    updatePassword,
  };
};
