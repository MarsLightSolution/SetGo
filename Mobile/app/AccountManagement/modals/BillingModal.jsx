/**
 * BillingModal Component
 *
 * Modal dialog for updating the billing address.
 * Provides a single text input for entering the complete billing address.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Object} props.formData - Form data object containing billing address
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
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { AnimatedButton, AnimatedInput } from "../../../Components/ui";
import { styles } from "../Accountsetting";

export const BillingModal = ({
  visible,
  onClose,
  formData,
  setFormData,
  onUpdate,
  loading,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <View style={styles.modalContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modal}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Billing Address</Text>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.modalCloseButton}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Modal Content */}
                <View style={styles.modalContent}>
                  {/* Billing Address Input */}
                  <AnimatedInput
                    label="Billing Address"
                    value={formData.billingAddress}
                    onChangeText={(val) => setFormData({ ...formData, billingAddress: val })}
                    icon="map-pin"
                    placeholder="Enter complete billing address"
                  />

                  {/* Info Box */}
                  <View style={styles.infoBox}>
                    <Feather name="info" size={18} color="#3B82F6" />
                    <Text style={styles.infoText}>
                      This address will be used for billing and invoicing purposes
                    </Text>
                  </View>
                </View>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <AnimatedButton
                    title="Cancel"
                    onPress={onClose}
                    variant="secondary"
                    style={styles.modalButton}
                  />
                  <AnimatedButton
                    title="Save Address"
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
