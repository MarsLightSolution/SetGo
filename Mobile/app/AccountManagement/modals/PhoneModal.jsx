/**
 * PhoneModal Component
 *
 * Two-step modal dialog for phone verification.
 * Step 1: Enter phone number and send OTP
 * Step 2: Enter OTP code for verification
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Object} props.formData - Form data object containing phone fields
 * @param {Function} props.setFormData - Function to update form data
 * @param {number} props.phoneStep - Current step (1 or 2)
 * @param {Function} props.setPhoneStep - Function to update current step
 * @param {Function} props.onSendOTP - Callback when send OTP is clicked
 * @param {Function} props.onVerifyOTP - Callback when verify OTP is clicked
 * @param {boolean} props.loading - Loading state for operations
 */

import React from "react";
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { AnimatedButton, AnimatedInput } from "../../../Components/ui";
import { styles } from "../Accountsetting";

export const PhoneModal = ({
  visible,
  onClose,
  formData,
  setFormData,
  phoneStep,
  setPhoneStep,
  onSendOTP,
  onVerifyOTP,
  loading,
}) => {
  /**
   * Handles modal close and resets to step 1
   */
  const handleClose = () => {
    onClose();
    setPhoneStep(1);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <View style={styles.modalContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modal}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {phoneStep === 1 ? "Verify Phone" : "Enter OTP"}
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.modalCloseButton}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Modal Content */}
                <View style={styles.modalContent}>
                  {phoneStep === 1 ? (
                    /* Step 1: Phone Number Input */
                    <>
                      <Text style={styles.modalDesc}>
                        We&apos;ll send a verification code to your phone
                      </Text>

                      {/* Country Code and Phone Number Row */}
                      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                        <TextInput
                          style={styles.countryCodeInput}
                          value={formData.countryCode}
                          onChangeText={(val) => setFormData({ ...formData, countryCode: val })}
                          placeholder="+91"
                        />
                        <View style={{ flex: 1 }}>
                          <AnimatedInput
                            value={formData.phoneNumber}
                            onChangeText={(val) => setFormData({ ...formData, phoneNumber: val })}
                            icon="smartphone"
                            placeholder="1234567890"
                          />
                        </View>
                      </View>
                    </>
                  ) : (
                    /* Step 2: OTP Input */
                    <>
                      <Text style={styles.modalDesc}>
                        Enter the 6-digit code sent to {formData.countryCode} {formData.phoneNumber}
                      </Text>

                      {/* OTP Input Field */}
                      <TextInput
                        style={styles.otpInput}
                        value={formData.otp}
                        onChangeText={(val) => setFormData({ ...formData, otp: val })}
                        placeholder="000000"
                        placeholderTextColor="#D1D5DB"
                        keyboardType="number-pad"
                        maxLength={6}
                      />

                      {/* Resend Code Button */}
                      <TouchableOpacity style={styles.resendBtn} onPress={onSendOTP}>
                        <Text style={styles.resendText}>Resend Code</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <AnimatedButton
                    title="Cancel"
                    onPress={handleClose}
                    variant="secondary"
                    style={styles.modalButton}
                  />
                  <AnimatedButton
                    title={phoneStep === 1 ? "Send Code" : "Verify"}
                    onPress={phoneStep === 1 ? onSendOTP : onVerifyOTP}
                    loading={loading}
                    style={styles.modalButton}
                  />
                </View>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};
