import React, { useState, useEffect } from "react";
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
  Switch,
  Modal,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/Feather";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

// Toast helper functions
const showSuccessToast = (message) => {
  Toast.show({
    type: 'success',
    text1: 'Success',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
};

const showErrorToast = (message) => {
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    position: 'top',
    visibilityTime: 3500,
  });
};

const showInfoToast = (message) => {
  Toast.show({
    type: 'info',
    text1: 'Info',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
};
import { getAuthToken, getUserId, getUserData } from "../services/secureAuthService";
import logger from "../utils/logger";
import { API_ENDPOINTS } from "../config/api";

const log = logger.create('PostForm');

const Form = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const maxDescriptionLength = 1000;

  // Auth check state
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // User state
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [authToken, setAuthToken] = useState("");

  // Location permission state
  const [locationStatus, setLocationStatus] = useState("pending"); // pending, granted, denied

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState("");

  // Shop state
  const [userShop, setUserShop] = useState(null);
  const [hasShop, setHasShop] = useState(false);
  const [loadingShop, setLoadingShop] = useState(true);
  const [postToShop, setPostToShop] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
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
    quantity: 1,
  });

  const [errors, setErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBulkListing, setIsBulkListing] = useState(false);

  // Check auth and load user data
  useEffect(() => {
    const checkAuthAndLoadUser = async () => {
      try {
        setIsCheckingAuth(true);

        const storedToken = await getAuthToken();
        const storedUserId = await getUserId();

        // If no token or userId, redirect to login
        if (!storedToken || !storedUserId) {
          showErrorToast("Please login to post an ad");
          router.replace("/auth");
          return;
        }

        setAuthToken(storedToken);
        setUserId(storedUserId);

        const userData = await getUserData();
        log.info("User data loaded:", userData);
        if (userData) {
          // Try different possible field names for username
          const name = userData.userName || userData.username || userData.name || userData.fullName || "";
          if (name) {
            setUsername(name);
            setFormData((prev) => ({ ...prev, name: name }));
            log.info("Username set to:", name);
          } else {
            log.warn("No username found in user data");
          }
          if (userData._id && !storedUserId) {
            setUserId(userData._id);
          }
        }
      } catch (error) {
        log.error("Error loading user data:", error);
        showErrorToast("Authentication error. Please login again.");
        router.replace("/auth");
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuthAndLoadUser();
  }, []);

  // Fetch user's shop data
  useEffect(() => {
    const fetchUserShop = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          setHasShop(false);
          setPostToShop(false);
          setLoadingShop(false);
          return;
        }

        const res = await fetch(API_ENDPOINTS.MY_SHOP, {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        });

        if (res.status === 401 || res.status === 404) {
          setHasShop(false);
          setPostToShop(false);
          setLoadingShop(false);
          return;
        }

        // Check if response is JSON before parsing
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          log.warn("Shop API did not return JSON, user may not have a shop");
          setHasShop(false);
          setPostToShop(false);
          setLoadingShop(false);
          return;
        }

        const data = await res.json();

        if (data.hasShop && data.data) {
          setUserShop(data.data);
          setHasShop(true);

          // Auto-fill form with shop data
          setFormData((prev) => ({
            ...prev,
            postalCode: data.data.address?.postalCode || prev.postalCode,
            location: data.data.address?.city || prev.location,
            streetNo: data.data.address?.street || prev.streetNo,
            latitude: data.data.location?.coordinates?.[1] || prev.latitude,
            longitude: data.data.location?.coordinates?.[0] || prev.longitude,
          }));
        } else {
          setHasShop(false);
          setPostToShop(false);
        }
      } catch (error) {
        log.warn("Error fetching shop (user may not have one):", error.message);
        setHasShop(false);
        setPostToShop(false);
      } finally {
        setLoadingShop(false);
      }
    };

    fetchUserShop();
  }, []);

  // Get geolocation with explicit permission request
  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      setLocationStatus("granted");
      return;
    }

    const requestLocationPermission = async () => {
      try {
        setLocationStatus("pending");

        // First check current permission status
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

        if (existingStatus === "granted") {
          setLocationStatus("granted");
          await fetchCurrentLocation();
          return;
        }

        // Request permission with alert
        Alert.alert(
          "Location Permission",
          "SetGo needs your location to help buyers find products near them. This makes your ad more visible to local buyers.",
          [
            {
              text: "Not Now",
              style: "cancel",
              onPress: () => {
                setLocationStatus("denied");
                showInfoToast("You can enable location later in settings");
              },
            },
            {
              text: "Enable Location",
              onPress: async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === "granted") {
                  setLocationStatus("granted");
                  showSuccessToast("Location enabled");
                  await fetchCurrentLocation();
                } else {
                  setLocationStatus("denied");
                  showErrorToast("Location permission denied");
                }
              },
            },
          ]
        );
      } catch (error) {
        log.error("Location permission error:", error);
        setLocationStatus("denied");
      }
    };

    const fetchCurrentLocation = async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setFormData((prev) => ({
          ...prev,
          latitude: prev.latitude || location.coords.latitude,
          longitude: prev.longitude || location.coords.longitude,
        }));
      } catch (error) {
        log.error("Geolocation fetch error:", error);
        showErrorToast("Could not get current location");
      }
    };

    requestLocationPermission();
  }, [formData.latitude, formData.longitude]);

  // Request media and camera permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaStatus !== "granted") {
          Alert.alert(
            "Permission Required",
            "Camera roll permission is needed to upload images"
          );
        }
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== "granted") {
          Alert.alert(
            "Permission Required",
            "Camera permission is needed to take photos"
          );
        }
      }
    })();
  }, []);

  // Compress image
  const compressImage = async (uri) => {
    try {
      const manipulatedImage = await manipulateAsync(
        uri,
        [{ resize: { width: 1920 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      return manipulatedImage;
    } catch (error) {
      log.error("Image compression error:", error);
      throw error;
    }
  };

  // Launch camera to take a photo
  const handleCamera = async () => {
    try {
      if (formData.pictures.length >= 8) {
        showErrorToast("Maximum 8 pictures allowed");
        return;
      }

      const { status } = await ImagePicker.getCameraPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (newStatus !== "granted") {
          showErrorToast("Camera permission is required to take photos");
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setLoading(true);
        const asset = result.assets[0];

        try {
          const uri = asset.uri;

          if (asset.fileSize && asset.fileSize / 1024 / 1024 > 2) {
            showErrorToast("Image exceeds 2 MB limit");
            setLoading(false);
            return;
          }

          const compressed = await compressImage(uri);
          const filename = uri.split('/').pop() || `photo_${Date.now()}.jpg`;

          const imageObject = {
            uri: Platform.OS === 'ios'
              ? compressed.uri.replace('file://', '')
              : compressed.uri,
            type: 'image/jpeg',
            name: filename,
            width: compressed.width,
            height: compressed.height,
          };

          setFormData((prev) => ({
            ...prev,
            pictures: [...prev.pictures, imageObject],
          }));
          setImagePreviews((prev) => [...prev, compressed.uri]);

          const totalImages = formData.pictures.length + 1;
          showSuccessToast(`Photo taken (${totalImages}/8)`);
        } catch (error) {
          log.warn("Error processing camera image:", error);
          showErrorToast("Failed to process photo");
        }

        setLoading(false);
      }
    } catch (error) {
      log.error("Camera error:", error);
      setLoading(false);
      showErrorToast("Error taking photo: " + error.message);
    }
  };

  // Show picker options (camera or gallery)
  const handleAddImage = () => {
    if (formData.pictures.length >= 8) {
      showErrorToast("Maximum 8 pictures allowed");
      return;
    }

    Alert.alert(
      "Add Photo",
      "Choose how to add a photo",
      [
        { text: "Take Photo", onPress: handleCamera },
        { text: "Choose from Gallery", onPress: handleImagePicker },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  // Handle image picker (gallery)
  const handleImagePicker = async () => {
    try {
      if (formData.pictures.length >= 8) {
        showErrorToast("Maximum 8 pictures allowed");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        setLoading(true);
        const newImages = [];
        const newPreviews = [];

        for (const asset of result.assets) {
          if (formData.pictures.length + newImages.length >= 8) {
            showErrorToast("Maximum 8 pictures allowed");
            break;
          }

          try {
            const uri = asset.uri;

            // Check file size (2MB limit)
            if (asset.fileSize && asset.fileSize / 1024 / 1024 > 2) {
              showErrorToast(`Image exceeds 2 MB limit`);
              continue;
            }

            // Check dimensions
            if (asset.width > 5000 || asset.height > 5000) {
              showErrorToast("Image exceeds max dimensions (5000x5000)");
              continue;
            }

            // Compress the image
            const compressed = await compressImage(uri);

            const filename = uri.split('/').pop() || `photo_${Date.now()}.jpg`;
            const extension = filename.toLowerCase().split('.').pop();

            let mimeType = 'image/jpeg';
            if (extension === 'png') mimeType = 'image/png';
            else if (extension === 'webp') mimeType = 'image/webp';

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
            log.warn("Error processing image:", error);
            showErrorToast("Failed to process image");
          }
        }

        if (newImages.length > 0) {
          setFormData((prev) => ({
            ...prev,
            pictures: [...prev.pictures, ...newImages],
          }));
          setImagePreviews((prev) => [...prev, ...newPreviews]);

          // Show success feedback
          const totalImages = formData.pictures.length + newImages.length;
          showSuccessToast(`${newImages.length} image${newImages.length > 1 ? 's' : ''} added (${totalImages}/8)`);
          log.info(`Images added: ${newImages.length}, Total: ${totalImages}`);
        } else {
          showInfoToast("No images were added");
        }

        setLoading(false);
      }
    } catch (error) {
      log.error("Image picker error:", error);
      setLoading(false);
      showErrorToast("Error picking images: " + error.message);
    }
  };

  const removeImage = (indexToRemove) => {
    const updatedPictures = formData.pictures.filter((_, idx) => idx !== indexToRemove);
    const updatedPreviews = imagePreviews.filter((_, idx) => idx !== indexToRemove);

    setFormData((prev) => ({ ...prev, pictures: updatedPictures }));
    setImagePreviews(updatedPreviews);
    showInfoToast(`Image removed (${updatedPictures.length}/8 remaining)`);
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCheckboxChange = (name) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSubmit = async () => {
    if (!userId) {
      showErrorToast("Please login to post an ad");
      return;
    }

    // Validation
    const currentErrors = {};
    if (!formData.title.trim()) currentErrors.title = "Title is required";
    if (formData.title.length > 24) currentErrors.title = "Title must be 24 characters or less";
    if (!formData.category.trim()) currentErrors.category = "Category is required";
    if (!formData.price.trim()) currentErrors.price = "Price is required";
    else if (!/^\d+$/.test(formData.price)) currentErrors.price = "Price must be a number";
    if (!formData.description.trim()) currentErrors.description = "Description is required";
    if (!formData.postalCode.trim()) currentErrors.postalCode = "Postal code is required";
    else if (!/^\d{6}$/.test(formData.postalCode)) currentErrors.postalCode = "Postal code must be 6 digits";
    if (formData.location.length > 50) currentErrors.location = "Location must be 50 characters or less";

    // Quantity validation
    if (!formData.quantity || formData.quantity < 1) {
      currentErrors.quantity = "Quantity must be at least 1";
    } else if (formData.quantity > 10000) {
      currentErrors.quantity = "Quantity cannot exceed 10,000";
    }

    setErrors(currentErrors);

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

    // Get the name - ensure it's not empty
    const sellerName = formData.name || username || "User";
    if (!sellerName || sellerName.trim() === "") {
      showErrorToast("Name is required. Please update your profile.");
      return;
    }

    // Create FormData - matching backend controller requirements
    const submitData = new FormData();

    // Required fields for backend controller
    submitData.append("user", userId);
    submitData.append("title", formData.title);
    submitData.append("category", formData.category);
    submitData.append("price", formData.price);
    submitData.append("condition", formData.condition || "");
    submitData.append("description", formData.description);
    submitData.append("postalCode", formData.postalCode);
    submitData.append("streetNo", formData.streetNo || "");
    submitData.append("name", sellerName);
    submitData.append("termsAccepted", String(formData.termsAccepted));
    submitData.append("offerType", "offer");
    submitData.append("showFullAddress", String(formData.showFullAddress));
    submitData.append("subscribe", String(formData.subscribe));
    submitData.append("quantity", String(formData.quantity || 1));
    submitData.append("latitude", String(formData.latitude || ""));
    submitData.append("longitude", String(formData.longitude || ""));
    submitData.append("inputLanguage", formData.inputLanguage || "en");

    // Optional fields
    submitData.append("isBuy", "false");
    submitData.append("isSell", "false");

    // Add shop-related fields
    if (hasShop && postToShop && userShop) {
      submitData.append("shop", userShop._id);
      submitData.append("listingType", "shop");
    } else {
      submitData.append("listingType", "individual");
    }

    try {
      setLoading(true);
      setIsSubmitting(true);
      setSubmissionStatus("Preparing images...");

      log.info("=== SUBMIT START ===");
      log.info("Pictures count:", formData.pictures.length);

      // Append pictures - backend expects field name "pictures"
      for (let index = 0; index < formData.pictures.length; index++) {
        const pic = formData.pictures[index];
        setSubmissionStatus(`Processing image ${index + 1} of ${formData.pictures.length}...`);
        log.info(`Image ${index}:`, {
          uri: pic.uri?.substring(0, 100),
          type: pic.type,
          name: pic.name,
          hasUri: !!pic.uri,
        });

        try {
          if (Platform.OS === 'web') {
            const response = await fetch(pic.uri);
            const blob = await response.blob();
            const file = new File([blob], pic.name, { type: pic.type });
            submitData.append("pictures", file);
          } else {
            // For React Native, ensure proper URI format
            const imageUri = pic.uri.startsWith('file://') ? pic.uri : `file://${pic.uri}`;
            submitData.append("pictures", {
              uri: imageUri,
              type: pic.type || 'image/jpeg',
              name: pic.name || `photo_${index}.jpg`,
            });
          }
          log.info(`Image ${index} appended to FormData`);
        } catch (imgError) {
          log.error(`CRASH at image ${index}:`, imgError.message, imgError);
          showErrorToast(`Failed to process image ${index + 1}`);
          setLoading(false);
          setIsSubmitting(false);
          return;
        }
      }

      log.info("All images appended, getting auth token...");
      setSubmissionStatus("Uploading to server...");

      // Get fresh token before submitting
      const currentToken = authToken || await getAuthToken();

      // Headers for multipart/form-data - don't set Content-Type, let fetch handle it
      const headers = {};
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
        log.info("Auth token present:", currentToken.substring(0, 20) + "...");
      } else {
        log.error("No auth token available!");
        showErrorToast("Please login again to post an ad");
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      const endpoint = API_ENDPOINTS.ADD_PRODUCT;
      log.info("Submitting to:", endpoint);
      log.info("Form fields:", {
        user: userId,
        title: formData.title,
        category: formData.category,
        price: formData.price,
        pictureCount: formData.pictures.length,
        listingType: hasShop && postToShop ? "shop" : "individual",
        shopId: hasShop && postToShop ? userShop?._id : "none",
      });

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        log.error("Upload timed out after 60s");
        controller.abort();
      }, 60000);

      log.info("Calling fetch...");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: headers,
        body: submitData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      log.info("Response received, status:", response.status);
      setSubmissionStatus("Processing response...");

      const contentType = response.headers.get("content-type");
      log.info("Response content-type:", contentType);

      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        log.info("Response JSON:", JSON.stringify(result).substring(0, 200));

        if (response.ok) {
          setSubmissionStatus("Success!");
          const successMessage = hasShop && postToShop
            ? "Product added to your shop!"
            : "Ad published successfully!";
          showSuccessToast(successMessage);

          // Reset form
          setFormData({
            title: "",
            category: "",
            condition: "",
            price: "",
            description: "",
            postalCode: hasShop && userShop ? userShop.address?.postalCode || "" : "",
            location: hasShop && userShop ? userShop.address?.city || "" : "",
            streetNo: hasShop && userShop ? userShop.address?.street || "" : "",
            showFullAddress: false,
            name: username,
            termsAccepted: false,
            subscribe: false,
            pictures: [],
            latitude: formData.latitude,
            longitude: formData.longitude,
            inputLanguage: "en",
            quantity: 1,
          });
          setImagePreviews([]);
          setIsBulkListing(false);
          router.back();
        } else {
          log.error("Server error:", result);
          showErrorToast(result.message || "Failed to publish ad");
        }
      } else {
        const errorText = await response.text();
        log.error("Non-JSON response:", response.status, errorText?.substring(0, 300));
        showErrorToast(`Server error (${response.status}). Please try again`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        log.error("Upload timed out - server may be unreachable");
        showErrorToast("Upload timed out. Check your connection and try again.");
      } else {
        log.error("Submit CRASH:", error.message);
        log.error("Error stack:", error.stack);
        showErrorToast(`Error: ${error.message || "Network error. Please check your connection"}`);
      }
    } finally {
      log.info("=== SUBMIT END ===");
      setLoading(false);
      setIsSubmitting(false);
      setSubmissionStatus("");
    }
  };

  // Loading state while checking auth or fetching shop
  if (isCheckingAuth || loadingShop) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#008235" />
        <Text style={styles.loadingText}>
          {isCheckingAuth ? "Checking authentication..." : "Loading..."}
        </Text>
      </View>
    );
  }

  return (
    <>
      {/* Submission Loading Overlay */}
      <Modal
        visible={isSubmitting}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#008235" />
            <Text style={styles.modalTitle}>Publishing Your Ad</Text>
            <Text style={styles.modalStatus}>{submissionStatus}</Text>
            <Text style={styles.modalHint}>Please wait, do not close the app</Text>
          </View>
        </View>
      </Modal>

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
        {/* Shop Toggle */}
        {hasShop && userShop && (
          <View style={styles.shopToggleSection}>
            <View style={styles.shopInfo}>
              <View style={styles.shopIconContainer}>
                <Ionicons name="storefront" size={24} color="#008235" />
              </View>
              <View style={styles.shopDetails}>
                <Text style={styles.shopName}>
                  {userShop.shopName?.en || userShop.shopName?.az || "Your Shop"}
                </Text>
                <Text style={styles.shopHint}>
                  {postToShop
                    ? "Product will be posted to your shop"
                    : "Product will be posted individually"}
                </Text>
              </View>
            </View>
            <View style={styles.toggleContainer}>
              <Text style={[styles.toggleLabel, !postToShop && styles.toggleLabelActive]}>
                Individual
              </Text>
              <Switch
                value={postToShop}
                onValueChange={setPostToShop}
                trackColor={{ false: "#D1D5DB", true: "#86efac" }}
                thumbColor={postToShop ? "#008235" : "#9CA3AF"}
              />
              <Text style={[styles.toggleLabel, postToShop && styles.toggleLabelActive]}>
                Shop
              </Text>
            </View>
          </View>
        )}

        {/* Ad Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ad Details</Text>

          {/* Input Language */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Language of Input</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.inputLanguage}
                onValueChange={(value) => handleChange("inputLanguage", value)}
                style={styles.picker}
              >
                <Picker.Item label="English" value="en" />
                <Picker.Item label="Azərbaycan" value="az" />
                <Picker.Item label="Русский" value="ru" />
              </Picker>
            </View>
          </View>

          {/* Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={formData.title}
              onChangeText={(text) => handleChange("title", text)}
              placeholder="What are you selling?"
              placeholderTextColor="#9CA3AF"
              maxLength={24}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            <Text style={styles.helperText}>{24 - formData.title.length} characters left</Text>
          </View>

          {/* Category */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.pickerContainer, errors.category && styles.inputError]}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) => handleChange("category", value)}
                style={styles.picker}
              >
                <Picker.Item label="Select a category" value="" />
                <Picker.Item label={t('post.categories.cars')} value="Cars & Motorcycles" />
                <Picker.Item label={t('post.categories.realEstate')} value="Real Estate" />
                <Picker.Item label={t('post.categories.jobs')} value="Jobs" />
                <Picker.Item label={t('post.categories.household')} value="Household & Furniture" />
                <Picker.Item label={t('post.categories.electronics')} value="Electronics" />
                <Picker.Item label={t('post.categories.leisure')} value="Leisure, Hobby & Neighborhood" />
                <Picker.Item label={t('post.categories.service')} value="Service" />
                <Picker.Item label={t('post.categories.other')} value="Other" />
              </Picker>
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          {/* Price */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Price <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={[styles.input, styles.priceInput, errors.price && styles.inputError]}
                value={formData.price}
                onChangeText={(text) => handleChange("price", text)}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
              <Text style={styles.currency}>₼</Text>
            </View>
            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          </View>

          {/* Quantity Section */}
          <View style={styles.quantitySection}>
            <View style={styles.quantityHeader}>
              <Text style={styles.quantityLabel}>Available Units</Text>
              <View style={styles.bulkToggle}>
                <Text style={[styles.toggleLabel, !isBulkListing && styles.toggleLabelActive]}>
                  Single
                </Text>
                <Switch
                  value={isBulkListing}
                  onValueChange={(value) => {
                    setIsBulkListing(value);
                    if (!value) {
                      setFormData((prev) => ({ ...prev, quantity: 1 }));
                    }
                  }}
                  trackColor={{ false: "#D1D5DB", true: "#86efac" }}
                  thumbColor={isBulkListing ? "#008235" : "#9CA3AF"}
                />
                <Text style={[styles.toggleLabel, isBulkListing && styles.toggleLabelActive]}>
                  Bulk
                </Text>
              </View>
            </View>

            {isBulkListing ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.quantity && styles.inputError]}
                  value={formData.quantity.toString()}
                  onChangeText={(text) => handleChange("quantity", parseInt(text) || 1)}
                  placeholder="Number of units"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
                <Text style={styles.helperText}>Enter the number of units available</Text>
              </View>
            ) : (
              <View style={styles.singleUnitDisplay}>
                <View style={styles.unitBadge}>
                  <Text style={styles.unitBadgeText}>1</Text>
                </View>
                <Text style={styles.singleUnitText}>This listing is for 1 unit</Text>
              </View>
            )}
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
                <Picker.Item label="Defective / Needs Repair" value="Defective / Needs Repair" />
              </Picker>
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.description && styles.inputError]}
              value={formData.description}
              onChangeText={(text) => handleChange("description", text)}
              placeholder="Describe your item"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              maxLength={maxDescriptionLength}
            />
            <Text style={styles.helperText}>
              {maxDescriptionLength - formData.description.length} characters left
            </Text>
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>
        </View>

        {/* Upload Pictures */}
        <View style={styles.section}>
          <View style={styles.picturesHeader}>
            <Text style={styles.label}>
              Pictures <Text style={styles.required}>*</Text>
            </Text>
            {imagePreviews.length > 0 && (
              <View style={styles.imageCountBadge}>
                <Ionicons name="images" size={14} color="#008235" />
                <Text style={styles.imageCountText}>
                  {imagePreviews.length}/8 attached
                </Text>
              </View>
            )}
          </View>

          {/* Success Banner when images are attached */}
          {imagePreviews.length > 0 && (
            <View style={styles.imageSuccessBanner}>
              <Ionicons name="checkmark-circle" size={24} color="#008235" />
              <View style={styles.imageSuccessBannerText}>
                <Text style={styles.imageSuccessTitle}>
                  {imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''} attached
                </Text>
                <Text style={styles.imageSuccessSubtitle}>
                  Scroll down to see previews • Tap to add more
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.uploadBox,
              imagePreviews.length > 0 && styles.uploadBoxWithImages,
            ]}
            onPress={handleAddImage}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.uploadContent}>
                <ActivityIndicator size="large" color="#008235" />
                <Text style={styles.uploadText}>Processing images...</Text>
              </View>
            ) : (
              <View style={styles.uploadContent}>
                <Icon
                  name={imagePreviews.length > 0 ? "plus-circle" : "upload-cloud"}
                  size={40}
                  color={imagePreviews.length > 0 ? "#008235" : "#9CA3AF"}
                />
                <Text
                  style={[
                    styles.uploadText,
                    imagePreviews.length > 0 && styles.uploadTextActive,
                  ]}
                >
                  {imagePreviews.length > 0
                    ? "Tap to add more images"
                    : "Tap to upload images"}
                </Text>
                <Text style={styles.uploadSubtext}>
                  {imagePreviews.length > 0
                    ? `${8 - imagePreviews.length} more slots available`
                    : "Up to 8 images, max 2MB each"}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {imagePreviews.length > 0 && (
            <>
              <View style={styles.attachedImagesHeader}>
                <Text style={styles.attachedImagesLabel}>Image Previews:</Text>
              </View>
              <View style={styles.imageGrid}>
                {imagePreviews.map((uri, idx) => (
                  <View key={idx} style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                      onError={(e) => log.warn('Image preview error:', e.nativeEvent?.error)}
                    />
                    <View style={styles.imageIndexBadge}>
                      <Text style={styles.imageIndexText}>{idx + 1}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage(idx)}
                    >
                      <Icon name="x" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Location
            {hasShop && postToShop && (
              <Text style={styles.autoFillHint}> (Auto-filled from shop)</Text>
            )}
          </Text>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.flex1]}>
              <Text style={styles.label}>
                Postal Code <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.postalCode && styles.inputError]}
                value={formData.postalCode}
                onChangeText={(text) => handleChange("postalCode", text)}
                placeholder="123456"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={6}
              />
              {errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}
            </View>

            <View style={[styles.inputContainer, styles.flex1]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                value={formData.location}
                onChangeText={(text) => handleChange("location", text)}
                placeholder="Enter city"
                placeholderTextColor="#9CA3AF"
                maxLength={50}
              />
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={styles.input}
              value={formData.streetNo}
              onChangeText={(text) => handleChange("streetNo", text)}
              placeholder="Enter street address (optional)"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleCheckboxChange("showFullAddress")}
          >
            <View style={[styles.checkbox, formData.showFullAddress && styles.checkboxChecked]}>
              {formData.showFullAddress && <Icon name="check" size={16} color="white" />}
            </View>
            <Text style={styles.checkboxLabel}>Show full address in ad</Text>
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
            <Text style={styles.helperText}>Name cannot be changed</Text>
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleCheckboxChange("subscribe")}
          >
            <View style={[styles.checkbox, formData.subscribe && styles.checkboxChecked]}>
              {formData.subscribe && <Icon name="check" size={16} color="white" />}
            </View>
            <Text style={styles.checkboxLabel}>Subscribe to updates about your ads</Text>
          </TouchableOpacity>
        </View>

        {/* Terms & Conditions */}
        <View style={[styles.section, styles.termsSection]}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleCheckboxChange("termsAccepted")}
          >
            <View style={[styles.checkbox, formData.termsAccepted && styles.checkboxChecked]}>
              {formData.termsAccepted && <Icon name="check" size={16} color="white" />}
            </View>
            <Text style={styles.checkboxLabel}>I accept the terms and conditions</Text>
          </TouchableOpacity>
          <Text style={styles.termsText}>
            By posting this ad, you agree to our Terms of Use and Privacy Policy
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={styles.submitButtonContent}>
              {hasShop && postToShop && (
                <Ionicons name="storefront" size={20} color="white" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.submitButtonText}>
                {hasShop && postToShop ? "Publish to Shop" : "Publish Ad"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Create Shop CTA */}
        {!hasShop && (
          <View style={styles.createShopCTA}>
            <View style={styles.shopIconContainer}>
              <Ionicons name="storefront" size={24} color="#008235" />
            </View>
            <View style={styles.createShopContent}>
              <Text style={styles.createShopTitle}>Want to sell more?</Text>
              <Text style={styles.createShopText}>
                Create your own shop and reach more customers
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
    </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },
  header: {
    backgroundColor: "#008235",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
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
    borderRadius: 12,
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
  autoFillHint: {
    fontSize: 12,
    fontWeight: "400",
    color: "#6B7280",
  },
  shopToggleSection: {
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  shopInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  shopIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  shopHint: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  toggleLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  toggleLabelActive: {
    color: "#008235",
  },
  bulkToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quantitySection: {
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  quantityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  singleUnitDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  unitBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  unitBadgeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#008235",
  },
  singleUnitText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
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
    color: "#1F2937",
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
    backgroundColor: "white",
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
    marginLeft: 12,
    color: "#6B7280",
    fontSize: 18,
    fontWeight: "600",
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
  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
    backgroundColor: "#FAFAFA",
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
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  createShopCTA: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  createShopContent: {
    flex: 1,
    marginLeft: 12,
  },
  createShopTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  createShopText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 32,
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  modalStatus: {
    fontSize: 14,
    color: "#008235",
    textAlign: "center",
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  // Pictures header styles
  picturesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  imageCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  imageCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#008235",
    marginLeft: 4,
  },
  uploadBoxWithImages: {
    borderColor: "#008235",
    backgroundColor: "#F0FDF4",
  },
  uploadTextActive: {
    color: "#008235",
    fontWeight: "500",
  },
  attachedImagesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  attachedImagesText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#008235",
    marginLeft: 6,
  },
  imageIndexBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0, 130, 53, 0.9)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  imageIndexText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "white",
  },
  // Image success banner
  imageSuccessBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  imageSuccessBannerText: {
    marginLeft: 12,
    flex: 1,
  },
  imageSuccessTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#065F46",
  },
  imageSuccessSubtitle: {
    fontSize: 12,
    color: "#047857",
    marginTop: 2,
  },
  attachedImagesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
});

export default Form;
