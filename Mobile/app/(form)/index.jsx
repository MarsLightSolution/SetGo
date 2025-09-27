"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"
import { Picker } from "@react-native-picker/picker"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Toast from "react-native-toast-message"
import { Ionicons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

export default function CreateAdForm() {
  const [formData, setFormData] = useState({
    offerType: "offer",
    title: "",
    category: "",
    condition: "",
    price: "",
    description: "",
    postalCode: "",
    location: "",
    streetNo: "",
    showFullAddress: false,
    name: "",
    termsAccepted: false,
    subscribe: false,
    pictures: [],
    latitude: "",
    longitude: "",
    inputLanguage: "en",
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)

  const maxDescriptionLength = 1000

  // Get user data and location on load
  useEffect(() => {
    const initializeForm = async () => {
      try {
        const username = await AsyncStorage.getItem("userName")
        if (username) {
          setFormData((prev) => ({ ...prev, name: username }))
        }

        // Request location permission and get current location
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({})
          setFormData((prev) => ({
            ...prev,
            latitude: location.coords.latitude.toString(),
            longitude: location.coords.longitude.toString(),
          }))
        } else {
          Toast.show({
            type: "error",
            text1: "Location Error",
            text2: "Location permission denied",
          })
        }
      } catch (error) {
        console.error("Initialization error:", error)
      }
    }

    initializeForm()
  }, [])

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleImagePicker = async () => {
    if (formData.pictures.length >= 8) {
      Toast.show({
        type: "error",
        text1: "Maximum Images",
        text2: "You can only upload up to 8 images",
      })
      return
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Permission to access camera roll is required!")
      return
    }

    setImageLoading(true)

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [4, 3],
    })

    if (!result.canceled) {
      const newImages = result.assets.slice(0, 8 - formData.pictures.length)
      setFormData((prev) => ({
        ...prev,
        pictures: [...prev.pictures, ...newImages],
      }))
    }

    setImageLoading(false)
  }

  const removeImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      pictures: prev.pictures.filter((_, index) => index !== indexToRemove),
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (formData.title.length > 24) newErrors.title = "Title must be 24 characters or less"
    if (!formData.category) newErrors.category = "Category is required"
    if (!formData.price.trim()) newErrors.price = "Price is required"
    else if (!/^\d+$/.test(formData.price)) newErrors.price = "Price must contain only numbers"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.postalCode.trim()) newErrors.postalCode = "Postal code is required"
    else if (!/^\d{6}$/.test(formData.postalCode)) newErrors.postalCode = "Postal code must be 6 digits"
    if (formData.location.length > 50) newErrors.location = "Location must be 50 characters or less"
    if (!/^[A-Za-z\s]+$/.test(formData.name)) newErrors.name = "Name must contain only letters"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: "error",
        text1: "Form Error",
        text2: "Please fix the form errors",
      })
      return
    }

    if (!formData.termsAccepted) {
      Toast.show({
        type: "error",
        text1: "Terms Required",
        text2: "Please accept the terms and conditions",
      })
      return
    }

    if (formData.pictures.length === 0) {
      Toast.show({
        type: "error",
        text1: "Images Required",
        text2: "Please add at least one image",
      })
      return
    }

    setLoading(true)

    try {
      const formDataToSend = new FormData()

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "pictures") {
          value.forEach((image, index) => {
            formDataToSend.append("pictures", {
              uri: image.uri,
              type: "image/jpeg",
              name: `image_${index}.jpg`,
            })
          })
        } else {
          formDataToSend.append(key, typeof value === "boolean" ? String(value) : value)
        }
      })

      // Replace with your actual API endpoint
      const response = await fetch("YOUR_API_ENDPOINT/api/products/add", {
        method: "POST",
        body: formDataToSend,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const data = await response.json()

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Ad submitted successfully!",
        })

        // Reset form
        setFormData({
          offerType: "offer",
          title: "",
          category: "",
          condition: "",
          price: "",
          description: "",
          postalCode: "",
          location: "",
          streetNo: "",
          showFullAddress: false,
          name: formData.name, // Keep the name
          termsAccepted: false,
          subscribe: false,
          pictures: [],
          latitude: formData.latitude,
          longitude: formData.longitude,
          inputLanguage: "en",
        })
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: data.message || "Something went wrong",
        })
      }
    } catch (error) {
      console.error("Submit error:", error)
      Toast.show({
        type: "error",
        text1: "Network Error",
        text2: "Failed to submit form",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Ad Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ad Details</Text>

            {/* Offer Type */}
            <View style={styles.radioGroup}>
              <Text style={styles.label}>Bid/Request</Text>
              <View style={styles.radioContainer}>
                <TouchableOpacity
                  style={[styles.radioButton, formData.offerType === "offer" && styles.radioSelected]}
                  onPress={() => handleInputChange("offerType", "offer")}
                >
                  <Text style={[styles.radioText, formData.offerType === "offer" && styles.radioTextSelected]}>
                    I Offer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioButton, formData.offerType === "looking" && styles.radioSelected]}
                  onPress={() => handleInputChange("offerType", "looking")}
                >
                  <Text style={[styles.radioText, formData.offerType === "looking" && styles.radioTextSelected]}>
                    I Am Looking For
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Language Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Language of Input</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.inputLanguage}
                  onValueChange={(value) => handleInputChange("inputLanguage", value)}
                  style={styles.picker}
                >
                  <Picker.Item label="English" value="en" />
                  <Picker.Item label="Azərbaycan" value="az" />
                  <Picker.Item label="Русский" value="ru" />
                </Picker>
              </View>
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={formData.title}
                onChangeText={(text) => handleInputChange("title", text)}
                placeholder="Enter title (max 24 characters)"
                maxLength={24}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.category}
                  onValueChange={(value) => handleInputChange("category", value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Choose Category" value="" />
                  <Picker.Item label="Cars & Motorcycles" value="Cars & Motorcycles" />
                  <Picker.Item label="Real Estate" value="Real Estate" />
                  <Picker.Item label="Jobs" value="Jobs" />
                  <Picker.Item label="Household & Furniture" value="Household & Furniture" />
                  <Picker.Item label="Electronics" value="Electronics" />
                  <Picker.Item label="Leisure, Hobby & Neighborhood" value="Leisure, Hobby & Neighborhood" />
                  <Picker.Item label="Service" value="Service" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>

            {/* Price */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={[styles.input, errors.price && styles.inputError]}
                value={formData.price}
                onChangeText={(text) => handleInputChange("price", text)}
                placeholder="Enter price"
                keyboardType="numeric"
              />
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            </View>

            {/* Condition */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Condition</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.condition}
                  onValueChange={(value) => handleInputChange("condition", value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select condition" value="" />
                  <Picker.Item label="New" value="New" />
                  <Picker.Item label="Like New" value="Like New" />
                  <Picker.Item label="Used" value="Used" />
                  <Picker.Item label="Defective / Needs Repair" value="Defective / Needs Repair" />
                </Picker>
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.textArea, errors.description && styles.inputError]}
                value={formData.description}
                onChangeText={(text) => handleInputChange("description", text)}
                placeholder="Enter description"
                multiline
                numberOfLines={4}
                maxLength={maxDescriptionLength}
              />
              <Text style={styles.characterCount}>
                {maxDescriptionLength - formData.description.length} characters left
              </Text>
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>

            {/* Image Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pictures * (Max 8)</Text>
              <TouchableOpacity style={styles.imageUploadButton} onPress={handleImagePicker} disabled={imageLoading}>
                {imageLoading ? (
                  <ActivityIndicator size="large" color="#16a34a" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={40} color="#666" />
                    <Text style={styles.uploadText}>Tap to upload images</Text>
                    <Text style={styles.uploadSubText}>Max 8 images, 2MB each</Text>
                  </>
                )}
              </TouchableOpacity>

              {formData.pictures.length > 0 && (
                <View style={styles.imageGrid}>
                  {formData.pictures.map((image, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                      <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                        <Ionicons name="close" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Postal Code *</Text>
                <TextInput
                  style={[styles.input, errors.postalCode && styles.inputError]}
                  value={formData.postalCode}
                  onChangeText={(text) => handleInputChange("postalCode", text)}
                  placeholder="6 digits"
                  keyboardType="numeric"
                  maxLength={6}
                />
                {errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={[styles.input, errors.location && styles.inputError]}
                  value={formData.location}
                  onChangeText={(text) => handleInputChange("location", text)}
                  placeholder="Enter city"
                  maxLength={50}
                />
                {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street No.</Text>
              <TextInput
                style={styles.input}
                value={formData.streetNo}
                onChangeText={(text) => handleInputChange("streetNo", text)}
                placeholder="Optional"
              />
            </View>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleInputChange("showFullAddress", !formData.showFullAddress)}
            >
              <View style={[styles.checkbox, formData.showFullAddress && styles.checkboxChecked]}>
                {formData.showFullAddress && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>Show full address</Text>
            </TouchableOpacity>
          </View>

          {/* Your Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput style={[styles.input, styles.disabledInput]} value={formData.name} editable={false} />
              <Text style={styles.helperText}>
                Please enter your full name{"\n"}
                <Text style={styles.boldText}>Note:</Text> For more info, visit Help Center
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleInputChange("subscribe", !formData.subscribe)}
            >
              <View style={[styles.checkbox, formData.subscribe && styles.checkboxChecked]}>
                {formData.subscribe && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>Subscribe to updates</Text>
            </TouchableOpacity>
          </View>

          {/* Terms Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleInputChange("termsAccepted", !formData.termsAccepted)}
            >
              <View style={[styles.checkbox, formData.termsAccepted && styles.checkboxChecked]}>
                {formData.termsAccepted && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>I accept the terms and conditions *</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}>
              By submitting this form, you agree to our Terms of Use and Privacy Policy.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Publish Ad</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#16a34a",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  disabledInput: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
    minHeight: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "white",
  },
  picker: {
    height: 50,
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioContainer: {
    flexDirection: "row",
    gap: 12,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    alignItems: "center",
  },
  radioSelected: {
    borderColor: "#16a34a",
    backgroundColor: "#f0fdf4",
  },
  radioText: {
    fontSize: 14,
    color: "#6b7280",
  },
  radioTextSelected: {
    color: "#16a34a",
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 4,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  imageUploadButton: {
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  uploadText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 8,
  },
  uploadSubText: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  imageContainer: {
    position: "relative",
    width: (width - 80) / 3,
    height: (width - 80) / 3,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    backgroundColor: "#16a34a",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  boldText: {
    fontWeight: "600",
  },
  termsText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
    lineHeight: 16,
  },
})
