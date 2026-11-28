/**
 * useSecurityUpdate Hook
 *
 * Manages security operations (phone verification, password update).
 * Extracted from app/AccountManagement/Accountsetting.jsx.
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import { accountService } from '../../services/accountService';
import { saveAccountUser } from './saveAccountUser';

/**
 * Phone number in international format for SMS (e.g. "+994" + "050 123 45 67" →
 * "+994501234567"), or null if it doesn't look like a phone number. The app used to send the
 * local number alone, which the SMS provider can't deliver to.
 */
export const toInternational = (countryCode, phone) => {
  const raw = String(phone || '').trim();
  // Already a full international number typed into the phone field ("+994 50 ...")
  if (raw.startsWith('+')) {
    const full = raw.replace(/\D/g, '');
    return full.length >= 8 && full.length <= 15 ? `+${full}` : null;
  }
  const cc = String(countryCode || '').replace(/\D/g, '');
  const local = String(phone || '').replace(/\D/g, '').replace(/^0+/, '');
  if (!cc || cc.length > 4 || local.length < 7 || local.length > 12) return null;
  return `+${cc}${local}`;
};

// The server's own message (e.g. "Current password is incorrect.") over axios's generic one.
const serverMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

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
    if (!toInternational(formData.countryCode, formData.phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      await accountService.sendOTP({
        email: userData?.email,
        phoneNumber: toInternational(formData.countryCode, formData.phoneNumber),
      });
      setPhoneStep(2);
      Alert.alert('Success', 'OTP sent successfully to your phone');
      if (onSuccess) onSuccess();
    } catch (error) {
      Alert.alert('Error', serverMessage(error, 'Failed to send OTP'));
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

    const phoneNumber = toInternational(formData.countryCode, formData.phoneNumber);
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await accountService.verifyOTP({
        userId: userData._id,
        email: userData.email,
        phoneNumber,
        code: formData.otp,
      });

      const updatedUser = result?._id ? { ...userData, ...result } : { ...userData, phoneNumber };
      await saveAccountUser(updatedUser);
      setUserData(updatedUser);

      Alert.alert('Success', 'Phone number verified successfully!');
      setPhoneStep(1);
      setFormData({ ...formData, otp: '' });
      if (onSuccess) onSuccess();
    } catch (error) {
      Alert.alert('Error', serverMessage(error, 'Invalid OTP'));
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

    // Same rules as signup (and the server's change-password check)
    if (formData.newPassword.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      Alert.alert('Error', 'Password must be at least 8 characters with an uppercase letter, a lowercase letter and a number');
      return;
    }

    setLoading(true);
    try {
      // The password endpoints answer with a message only; nothing to store.
      await accountService.updatePassword(userData._id, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      Alert.alert('Success', 'Password updated successfully!');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      Alert.alert('Error', serverMessage(error, 'Failed to update password'));
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
