/**
 * UsernameModal Component
 *
 * Modal dialog for updating the user's username.
 * Provides a simple input field for entering a new username with validation.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {string} props.tempUsername - Temporary username value
 * @param {Function} props.setTempUsername - Function to update temporary username
 * @param {Function} props.onSave - Callback when save button is clicked
 * @param {boolean} props.loading - Loading state for save operation
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
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { AnimatedButton, AnimatedInput } from "../../../Components/ui";
import { styles } from "../Accountsetting";

export const UsernameModal = ({
  visible,
  onClose,
  tempUsername,
  setTempUsername,
  onSave,
  loading,
}) => {
  /**
   * Handles modal close and resets the temporary username
   */
  const handleClose = () => {
    onClose();
    setTempUsername("");
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
                  <Text style={styles.modalTitle}>Change Username</Text>
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
                  <AnimatedInput
                    label="Username"
                    value={tempUsername}
                    onChangeText={(val) => setTempUsername(val)}
                    icon="user"
                    placeholder="Enter your username"
                  />
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
                    title="Save"
                    onPress={onSave}
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
