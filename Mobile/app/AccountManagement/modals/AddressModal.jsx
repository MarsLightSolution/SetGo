/**
 * AddressModal Component
 *
 * Multi-step modal dialog for managing delivery address.
 * Step 1: Display current address and option to add/edit
 * Step 2: Form to enter detailed address information
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Object} props.formData - Form data object containing address fields
 * @param {Function} props.setFormData - Function to update form data
 * @param {number} props.addressStep - Current step (1 or 2)
 * @param {Function} props.setAddressStep - Function to update current step
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
  ScrollView,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { AnimatedButton, AnimatedInput } from "../../../Components/ui";
import { styles } from "../Accountsetting";

export const AddressModal = ({
  visible,
  onClose,
  formData,
  setFormData,
  addressStep,
  setAddressStep,
  onSave,
  loading,
}) => {
  /**
   * Handles modal close and resets to step 1
   */
  const handleClose = () => {
    onClose();
    setAddressStep(1);
  };

  /**
   * Updates a specific field in the delivery address
   */
  const updateAddressField = (field, value) => {
    setFormData({
      ...formData,
      deliveryAddress: { ...formData.deliveryAddress, [field]: value },
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
                  <Text style={styles.modalTitle}>
                    {addressStep === 1 ? "Delivery Address" : "Enter Address"}
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
                <ScrollView
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                >
                  {addressStep === 1 ? (
                    /* Step 1: Landing Page */
                    <>
                      <Text style={styles.modalDesc}>
                        Manage your saved delivery address here.
                      </Text>

                      {/* Add/Edit Address Button */}
                      <TouchableOpacity
                        onPress={() => setAddressStep(2)}
                        style={styles.addAddressButton}
                        activeOpacity={0.7}
                      >
                        <Feather name="plus-circle" size={20} color="#10B981" />
                        <Text style={styles.addAddressText}>
                          {formData.deliveryAddress.street ? "Edit address" : "Add address"}
                        </Text>
                      </TouchableOpacity>

                      {/* Current Address Display */}
                      {formData.deliveryAddress.street && (
                        <View style={styles.currentAddressBox}>
                          <Text style={styles.currentAddressLabel}>Current Address:</Text>
                          <Text style={styles.currentAddressText}>
                            {`${formData.deliveryAddress.firstName} ${formData.deliveryAddress.lastName}${formData.deliveryAddress.suffix ? ', ' + formData.deliveryAddress.suffix : ''}, ${formData.deliveryAddress.street} ${formData.deliveryAddress.houseNumber}, ${formData.deliveryAddress.postalCode}, ${formData.deliveryAddress.location}`}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    /* Step 2: Address Form */
                    <>
                      {/* First Name */}
                      <AnimatedInput
                        label="First Name*"
                        value={formData.deliveryAddress.firstName}
                        onChangeText={(val) => updateAddressField("firstName", val)}
                        icon="user"
                        placeholder="First name"
                      />

                      {/* Last Name */}
                      <AnimatedInput
                        label="Last Name*"
                        value={formData.deliveryAddress.lastName}
                        onChangeText={(val) => updateAddressField("lastName", val)}
                        icon="user"
                        placeholder="Last name"
                      />

                      {/* Address Suffix */}
                      <AnimatedInput
                        label="Address Suffix (Optional)"
                        value={formData.deliveryAddress.suffix}
                        onChangeText={(val) => updateAddressField("suffix", val)}
                        icon="tag"
                        placeholder="Apt, Suite, etc."
                      />

                      {/* Street and House Number Row */}
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <View style={{ flex: 2 }}>
                          <AnimatedInput
                            label="Street*"
                            value={formData.deliveryAddress.street}
                            onChangeText={(val) => updateAddressField("street", val)}
                            icon="map-pin"
                            placeholder="Street name"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <AnimatedInput
                            label="No.*"
                            value={formData.deliveryAddress.houseNumber}
                            onChangeText={(val) => updateAddressField("houseNumber", val)}
                            icon="hash"
                            placeholder="123"
                          />
                        </View>
                      </View>

                      {/* Postal Code and Location Row */}
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <AnimatedInput
                            label="Postal Code*"
                            value={formData.deliveryAddress.postalCode}
                            onChangeText={(val) => updateAddressField("postalCode", val)}
                            icon="mail"
                            placeholder="12345"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <AnimatedInput
                            label="Location*"
                            value={formData.deliveryAddress.location}
                            onChangeText={(val) => updateAddressField("location", val)}
                            icon="home"
                            placeholder="City"
                          />
                        </View>
                      </View>
                    </>
                  )}
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  {addressStep === 1 ? (
                    /* Step 1: Close Button Only */
                    <AnimatedButton
                      title="Close"
                      onPress={handleClose}
                      style={{ flex: 1 }}
                    />
                  ) : (
                    /* Step 2: Back and Save Buttons */
                    <>
                      <AnimatedButton
                        title="Back"
                        onPress={() => setAddressStep(1)}
                        variant="secondary"
                        style={styles.modalButton}
                      />
                      <AnimatedButton
                        title="Save"
                        onPress={onSave}
                        loading={loading}
                        style={styles.modalButton}
                      />
                    </>
                  )}
                </View>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};
