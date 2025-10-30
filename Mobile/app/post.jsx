import React, { useState, useRef, useEffect } from "react";
const API_URL = process.env.EXPO_PUBLIC_API_URL;
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/Feather";
import { useRouter } from "expo-router";
import {
  showSuccessToast,
  showErrorToast,
} from "../hooks/tostify.js";

const Form = () => {
  const router = useRouter();
  const maxDescriptionLength = 1000;

  // State declarations
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [authToken, setAuthToken] = useState(""); // For JWT token if you use it
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
  });

  const [errors, setErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load userId, username, and auth token from AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log("=== Loading User Data from AsyncStorage ===");
        
        // Get userId
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          console.log("Found userId:", storedUserId);
          setUserId(storedUserId);
        } else {
          console.warn("No userId found in AsyncStorage");
        }

        // Get auth token (if you're using JWT)
        const storedToken = await AsyncStorage.getItem("authToken");
        if (storedToken) {
          console.log("Found auth token");
          setAuthToken(storedToken);
        }

        // Get user object (if stored as JSON)
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          console.log("Found user object:", userObj);
          
          if (userObj && userObj.userName) {
            setUsername(userObj.userName);
            setFormData((prev) => ({ ...prev, name: userObj.userName }));
          }
          
          // If userId is in the user object
          if (userObj && userObj._id && !storedUserId) {
            console.log("Using userId from user object:", userObj._id);
            setUserId(userObj._id);
          }
        }

        // Alternative: If username is stored separately
        const storedUsername = await AsyncStorage.getItem("userName");
        if (storedUsername && !username) {
          setUsername(storedUsername);
          setFormData((prev) => ({ ...prev, name: storedUsername }));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        showErrorToast("Failed to load user data");
      }
    };
    loadUserData();
  }, []);

  // Request permissions and get geolocation
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          showErrorToast("Permission to access location was denied");
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setFormData((prev) => ({
          ...prev,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
      } catch (error) {
        console.error("Geolocation error:", error);
        showErrorToast("Unable to get your location");
      }
    };

    getLocation();
  }, []);

  // Request media library permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Sorry, we need camera roll permissions to upload images!"
          );
        }
      }
    })();
  }, []);

  // Compress and resize image using expo-image-manipulator
  const compressImage = async (uri) => {
    try {
      const manipulatedImage = await manipulateAsync(
        uri,
        [{ resize: { width: 1920 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      return manipulatedImage;
    } catch (error) {
      console.error("Image compression error:", error);
      throw error;
    }
  };

  // Handle image picker
  const handleImagePicker = async () => {
    try {
      // Check if we can add more images
      if (formData.pictures.length >= 8) {
        showErrorToast("Maximum 8 pictures allowed");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        setLoading(true);
        const newImages = [];
        const newPreviews = [];

        for (const asset of result.assets) {
          // Check if adding this image would exceed the limit
          if (formData.pictures.length + newImages.length >= 8) {
            showErrorToast("Maximum 8 pictures allowed");
            break;
          }

          try {
            const uri = asset.uri;
            
            // Check file size (approximate - 2MB limit)
            if (asset.fileSize && asset.fileSize / 1024 / 1024 > 2) {
              showErrorToast("Image exceeds 2 MB. Please compress it first");
              continue;
            }

            // Compress the image
            const compressed = await compressImage(uri);
            
            // Get filename and extension
            const filename = uri.split('/').pop() || `photo_${Date.now()}.jpg`;
            const extension = filename.toLowerCase().split('.').pop();
            
            // Determine MIME type based on extension
            let mimeType = 'image/jpeg';
            if (extension === 'png') mimeType = 'image/png';
            else if (extension === 'gif') mimeType = 'image/gif';
            else if (extension === 'webp') mimeType = 'image/webp';
            else if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg';

            // Format image object properly
            const imageObject = {
              uri: Platform.OS === 'ios' 
                ? compressed.uri.replace('file://', '') 
                : compressed.uri,
              type: mimeType,
              name: filename,
              width: compressed.width,
              height: compressed.height,
            };

            newImages.push(imageObject);
            newPreviews.push(compressed.uri);
          } catch (error) {
            console.warn("Error processing image:", error);
            showErrorToast("Failed to process image. Please try another");
          }
        }

        if (newImages.length > 0) {
          setFormData((prev) => ({
            ...prev,
            pictures: [...prev.pictures, ...newImages],
          }));
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }

        setLoading(false);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      setLoading(false);
      showErrorToast("Error picking images");
    }
  };

  const removeImage = (indexToRemove) => {
    const updatedPictures = formData.pictures.filter(
      (_, idx) => idx !== indexToRemove
    );
    const updatedPreviews = imagePreviews.filter(
      (_, idx) => idx !== indexToRemove
    );

    setFormData((prev) => ({ ...prev, pictures: updatedPictures }));
    setImagePreviews(updatedPreviews);
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleCheckboxChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleSubmit = async () => {
    console.log("Submit button clicked");
    
    // Check if userId is available
    if (!userId) {
      showErrorToast("User not authenticated. Please login again");
      console.error("No userId available. User needs to login");
      return;
    }

    // Validation
    const currentErrors = {};
    if (!formData.title.trim())
      currentErrors.title = "Title is required";
    if (formData.title.length > 24)
      currentErrors.title = "Title must be 24 characters or less";
    if (!formData.category.trim())
      currentErrors.category = "Category is required";
    if (!formData.price.trim())
      currentErrors.price = "Price is required";
    else if (!/^\d+$/.test(formData.price))
      currentErrors.price = "Price must contain only numbers";
    if (!formData.description.trim())
      currentErrors.description = "Description is required";
    if (!formData.postalCode.trim())
      currentErrors.postalCode = "Postal code is required";
    else if (!/^\d{6}$/.test(formData.postalCode))
      currentErrors.postalCode = "Postal code must be 6 digits";
    if (formData.location.length > 50)
      currentErrors.location = "Location must be 50 characters or less";

    setErrors(currentErrors);
    console.log("Validation Errors:", currentErrors);

    if (Object.keys(currentErrors).length > 0) {
      showErrorToast("Please fix the errors in the form");
      return;
    }

    if (!formData.termsAccepted) {
      showErrorToast("Please accept the terms and conditions");
      return;
    }

    if (formData.pictures.length === 0) {
      showErrorToast("Please add at least one picture");
      return;
    }

    // Create FormData for submission
    const submitData = new FormData();

    // IMPORTANT: Append userId first
    submitData.append("user", userId);
    console.log("=== User Authentication ===");
    console.log("Sending userId:", userId);

    // Append all text fields
    Object.keys(formData).forEach((key) => {
      if (key !== "pictures") {
        submitData.append(key, formData[key].toString());
      }
    });

    // Debug: Log images before append
    console.log("=== DEBUG: Images to Upload ===");
    console.log("Number of images:", formData.pictures.length);

    try {
      setLoading(true);

      // Append pictures in a format multer can recognize
      for (let index = 0; index < formData.pictures.length; index++) {
        const pic = formData.pictures[index];
        
        if (Platform.OS === 'web') {
          // For web, we need to fetch the blob and create a File object
          try {
            const response = await fetch(pic.uri);
            const blob = await response.blob();
            const file = new File([blob], pic.name, { type: pic.type });
            submitData.append("pictures", file);
            console.log(`Appended image ${index} (web):`, {
              name: file.name,
              type: file.type,
              size: file.size,
            });
          } catch (error) {
            console.error(`Error converting image ${index} to blob:`, error);
            showErrorToast(`Failed to process image ${index + 1}`);
            setLoading(false);
            return;
          }
        } else {
          // For mobile (iOS/Android), use the original format
          const file = {
            uri: pic.uri,
            type: pic.type,
            name: pic.name,
          };
          submitData.append("pictures", file);
          console.log(`Appended image ${index} (mobile):`, {
            name: file.name,
            type: file.type,
          });
        }
      }

      console.log("=== Sending API Request ===");
      console.log("URL:", `${API_URL}/api/products/add`);
      console.log("Number of images being sent:", formData.pictures.length);
      
      // Prepare headers
      const headers = {};
      
      // Option 1: Send userId in Authorization header (if using token-based auth)
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log("Using Authorization header with token");
      }
      
      // Option 2: Send userId as custom header (alternative approach)
      // headers['X-User-Id'] = userId;
      // console.log("Using X-User-Id header:", userId);

      // Important: Don't set Content-Type header
      // React Native will set it with proper boundary
      const response = await fetch(`${API_URL}/api/products/add`, {
        method: "POST",
        headers: headers,
        body: submitData,
        credentials:"include",
      });

      console.log("Response status:", response.status);
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        console.log("Response data:", result);

        if (response.ok) {
          showSuccessToast("Ad published successfully!");
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
            name: username,
            termsAccepted: false,
            subscribe: false,
            pictures: [],
            latitude: formData.latitude,
            longitude: formData.longitude,
            inputLanguage: "en",
          });
          setImagePreviews([]);
          router.back();
        } else {
          showErrorToast(result.message || "Failed to publish ad");
        }
      } else {
        // Not JSON response (possibly HTML error page)
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse.substring(0, 200));
        showErrorToast("Server error. Please try again later");
      }
    } catch (error) {
      console.error("Submit error:", error);
      showErrorToast("Network error. Please check your connection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post an Ad</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formContainer}>
        {/* User Info Debug (Remove in production) */}
        {__DEV__ && userId && (
          <View style={[styles.section, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.debugText}>Debug Info:</Text>
            <Text style={styles.debugText}>User ID: {userId}</Text>
            <Text style={styles.debugText}>Username: {username}</Text>
          </View>
        )}

        {/* Offer Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offer Type</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => handleChange("offerType", "offer")}
            >
              <View
                style={[
                  styles.radioCircle,
                  formData.offerType === "offer" && styles.radioCircleSelected,
                ]}
              >
                {formData.offerType === "offer" && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text style={styles.radioLabel}>Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => handleChange("offerType", "request")}
            >
              <View
                style={[
                  styles.radioCircle,
                  formData.offerType === "request" && styles.radioCircleSelected,
                ]}
              >
                {formData.offerType === "request" && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text style={styles.radioLabel}>Request</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ad Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ad Details</Text>

          {/* Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.title ? styles.inputError : null]}
              value={formData.title}
              onChangeText={(text) => handleChange("title", text)}
              placeholder="What are you selling?"
              maxLength={24}
            />
            {errors.title ? (
              <Text style={styles.errorText}>{errors.title}</Text>
            ) : null}
            <Text style={styles.helperText}>
              {24 - formData.title.length} characters left
            </Text>
          </View>

          {/* Category */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[styles.pickerContainer, errors.category ? styles.inputError : null]}
            >
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) => handleChange("category", value)}
                style={styles.picker}
              >
                <Picker.Item label="Select a category" value="" />
                <Picker.Item label="Family, Kids & Baby" value="Family, Kids & Baby" />
                <Picker.Item label="Fashion & Beauty" value="Fashion & Beauty" />
                <Picker.Item label="Mobility & Vehicles" value="Mobility & Vehicles" />
                <Picker.Item label="Jobs" value="Jobs" />
                <Picker.Item label="Household & Furniture" value="Household & Furniture" />
                <Picker.Item label="Electronics" value="Electronics" />
                <Picker.Item label="Leisure, Hobby & Neighborhood" value="Leisure, Hobby & Neighborhood" />
                <Picker.Item label="Service" value="Service" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
            {errors.category ? (
              <Text style={styles.errorText}>{errors.category}</Text>
            ) : null}
          </View>

          {/* Price */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Price <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={[styles.input, styles.priceInput, errors.price ? styles.inputError : null]}
                value={formData.price}
                onChangeText={(text) => handleChange("price", text)}
                placeholder="0"
                keyboardType="numeric"
              />
              <Text style={styles.currency}>€</Text>
            </View>
            {errors.price ? (
              <Text style={styles.errorText}>{errors.price}</Text>
            ) : null}
          </View>

          {/* Condition */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Condition</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.condition}
                onValueChange={(value) => handleChange("condition", value)}
                style={styles.picker}
              >
                <Picker.Item label="Select condition" value="" />
                <Picker.Item label="New" value="New" />
                <Picker.Item label="Like New" value="Like New" />
                <Picker.Item label="Used" value="Used" />
                <Picker.Item
                  label="Defective / Needs Repair"
                  value="Defective / Needs Repair"
                />
              </Picker>
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.description ? styles.inputError : null,
              ]}
              value={formData.description}
              onChangeText={(text) => handleChange("description", text)}
              placeholder="Describe your item"
              multiline
              numberOfLines={4}
              maxLength={maxDescriptionLength}
            />
            <Text style={styles.helperText}>
              {errors.description
                ? errors.description
                : `${maxDescriptionLength - formData.description.length} characters left`}
            </Text>
          </View>
        </View>

        {/* Upload Pictures */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Pictures <Text style={styles.required}>*</Text>
          </Text>

          <TouchableOpacity
            style={styles.uploadBox}
            onPress={handleImagePicker}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#008235" />
            ) : (
              <View style={styles.uploadContent}>
                <Icon name="upload-cloud" size={40} color="#9CA3AF" />
                <Text style={styles.uploadText}>Tap to upload images</Text>
                <Text style={styles.uploadSubtext}>
                  Up to 8 images, JPEG/PNG
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <View style={styles.imageGrid}>
              {imagePreviews.map((uri, idx) => (
                <View key={idx} style={styles.imagePreviewContainer}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(idx)}
                  >
                    <Icon name="x" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.flex1]}>
              <Text style={styles.label}>
                Postal Code <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.postalCode ? styles.inputError : null]}
                value={formData.postalCode}
                onChangeText={(text) => handleChange("postalCode", text)}
                placeholder="123456"
                keyboardType="numeric"
                maxLength={6}
              />
              {errors.postalCode ? (
                <Text style={styles.errorText}>{errors.postalCode}</Text>
              ) : null}
            </View>

            <View style={[styles.inputContainer, styles.flex1]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={[styles.input, errors.location ? styles.inputError : null]}
                value={formData.location}
                onChangeText={(text) => handleChange("location", text)}
                placeholder="Enter city name"
                maxLength={50}
              />
              {errors.location ? (
                <Text style={styles.errorText}>{errors.location}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={styles.input}
              value={formData.streetNo}
              onChangeText={(text) => handleChange("streetNo", text)}
              placeholder="Enter street address (optional)"
            />
            <Text style={styles.helperText}>
              Optional: Helps buyers find your location
            </Text>
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleCheckboxChange("showFullAddress")}
          >
            <View
              style={[
                styles.checkbox,
                formData.showFullAddress ? styles.checkboxChecked : null,
              ]}
            >
              {formData.showFullAddress && (
                <Icon name="check" size={16} color="white" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              Show full address in ad
            </Text>
          </TouchableOpacity>
        </View>

        {/* Your Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={username}
              editable={false}
            />
            <Text style={styles.helperText}>
              Name cannot be changed. Update it in account settings
            </Text>
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleCheckboxChange("subscribe")}
          >
            <View
              style={[
                styles.checkbox,
                formData.subscribe ? styles.checkboxChecked : null,
              ]}
            >
              {formData.subscribe && (
                <Icon name="check" size={16} color="white" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              Subscribe to updates about your ads
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms & Conditions */}
        <View style={[styles.section, styles.termsSection]}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleCheckboxChange("termsAccepted")}
          >
            <View
              style={[
                styles.checkbox,
                formData.termsAccepted ? styles.checkboxChecked : null,
              ]}
            >
              {formData.termsAccepted && (
                <Icon name="check" size={16} color="white" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              I accept the terms and conditions
            </Text>
          </TouchableOpacity>
          <Text style={styles.termsText}>
            By posting this ad, you agree to our Terms of Use and Privacy Policy
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading ? styles.submitButtonDisabled : null]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Publish Ad</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    backgroundColor: "#008235",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  formContainer: {
    padding: 16,
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },
  section: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    color: "#008235",
  },
  debugText: {
    fontSize: 12,
    color: "#2E7D32",
    marginBottom: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#374151",
  },
  required: {
    color: "#DC2626",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  disabledInput: {
    backgroundColor: "#F3F4F6",
    color: "#6B7280",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceInput: {
    flex: 1,
  },
  currency: {
    marginLeft: 8,
    color: "#6B7280",
    fontSize: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
  radioGroup: {
    flexDirection: "row",
    gap: 16,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: "#008235",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#008235",
  },
  radioLabel: {
    fontSize: 16,
    color: "#374151",
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  uploadContent: {
    alignItems: "center",
  },
  uploadText: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 8,
  },
  uploadSubtext: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  imagePreviewContainer: {
    width: "48%",
    aspectRatio: 1,
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  flex1: {
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
    borderColor: "#D1D5DB",
    borderRadius: 4,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#008235",
    borderColor: "#008235",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  termsSection: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 16,
  },
  termsText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: "#008235",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 16,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Form;