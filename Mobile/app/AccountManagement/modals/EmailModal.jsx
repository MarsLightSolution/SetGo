/**
 * EmailModal Component
 *
 * Modal dialog for updating the user's email address.
 * Requires password confirmation and displays verification information.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Object} props.formData - Form data object containing email fields
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

export const EmailModal = ({
  visible,
  onClose,
  formData,
  setFormData,
  onUpdate,
  loading,
}) => {
  /**
   * Handles modal close and resets email fields
   */
  const handleClose = () => {
    onClose();
    setFormData({ ...formData, newEmail: "", emailPassword: "" });
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
                  <Text style={styles.modalTitle}>Change Email</Text>
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
                  {/* Info Box */}
                  <View style={styles.infoBox}>
                    <Feather name="info" size={18} color="#3B82F6" />
                    <Text style={styles.infoText}>
                      Verification emails will be sent to both addresses
                    </Text>
                  </View>

                  {/* Current Email (Read-only) */}
                  <AnimatedInput
                    label="Current Email"
                    value={formData.currentEmail}
                    onChangeText={() => {}}
                    icon="mail"
                    editable={false}
                  />

                  {/* New Email */}
                  <AnimatedInput
                    label="New Email"
                    value={formData.newEmail}
                    onChangeText={(val) => setFormData({ ...formData, newEmail: val })}
                    icon="mail"
                    placeholder="new@email.com"
                  />

                  {/* Password Confirmation */}
                  <AnimatedInput
                    label="Password"
                    value={formData.emailPassword}
                    onChangeText={(val) => setFormData({ ...formData, emailPassword: val })}
                    icon="lock"
                    secureTextEntry
                    placeholder="Enter your password"
                  />
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
                    title="Update Email"
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
