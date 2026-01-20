/**
 * PasswordModal Component
 *
 * Modal dialog for changing the user's password.
 * Requires current password and confirmation of new password.
 * Displays password requirements information.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Object} props.formData - Form data object containing password fields
 * @param {Function} props.setFormData - Function to update form data
 * @param {Function} props.onUpdate - Callback when update button is clicked
 * @param {boolean} props.loading - Loading state for update operation
 */

import React from "react";
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { AnimatedButton, AnimatedInput } from "../../../Components/ui";
import { styles } from "../Accountsetting";

export const PasswordModal = ({
  visible,
  onClose,
  formData,
  setFormData,
  onUpdate,
  loading,
}) => {
  /**
   * Handles modal close and resets password fields
   */
  const handleClose = () => {
    onClose();
    setFormData({
      ...formData,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
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
                  <Text style={styles.modalTitle}>Change Password</Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.modalCloseButton}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Modal Content */}
                <ScrollView
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                >
                  {/* Current Password */}
                  <AnimatedInput
                    label="Current Password"
                    value={formData.currentPassword}
                    onChangeText={(val) => setFormData({ ...formData, currentPassword: val })}
                    icon="lock"
                    secureTextEntry
                    placeholder="Enter current password"
                  />

                  {/* New Password */}
                  <AnimatedInput
                    label="New Password"
                    value={formData.newPassword}
                    onChangeText={(val) => setFormData({ ...formData, newPassword: val })}
                    icon="key"
                    secureTextEntry
                    placeholder="Enter new password"
                  />

                  {/* Confirm New Password */}
                  <AnimatedInput
                    label="Confirm New Password"
                    value={formData.confirmPassword}
                    onChangeText={(val) => setFormData({ ...formData, confirmPassword: val })}
                    icon="check-circle"
                    secureTextEntry
                    placeholder="Confirm new password"
                  />

                  {/* Password Requirements Info */}
                  <View style={styles.infoBox}>
                    <Feather name="info" size={18} color="#3B82F6" />
                    <Text style={styles.infoText}>
                      Password must be at least 8 characters with uppercase, lowercase, and numbers.
                    </Text>
                  </View>
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <AnimatedButton
                    title="Cancel"
                    onPress={handleClose}
                    variant="secondary"
                    style={styles.modalButton}
                  />
                  <AnimatedButton
                    title="Update Password"
                    onPress={onUpdate}
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
