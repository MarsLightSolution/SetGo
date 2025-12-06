import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';

// Toast helper functions
const showSuccessToast = (message) => {
  Toast.show({
    type: 'success',
    text1: 'Success',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
  });
};

const showErrorToast = (message) => {
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 50,
  });
};

const showInfoToast = (message) => {
  Toast.show({
    type: 'info',
    text1: 'Info',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
  });
};

const showWarningToast = (message) => {
  Toast.show({
    type: 'warning',
    text1: 'Warning',
    text2: message,
    position: 'top',
    visibilityTime: 3500,
    autoHide: true,
    topOffset: 50,
  });
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function RaiseQuery() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    issueType: 'order_issue',
    orderId: '',
    transactionId: '',
    walletId: '',
    sellerId: '',
    adId: '',
    message: '',
    images: [], // This will store image objects with uri, type, name
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const issueTypes = [
    { value: 'order_issue', label: 'Order Issue', icon: '📦', requiresOrderId: true },
    { value: 'payment_issue', label: 'Payment Issue', icon: '💳', requiresTransactionId: true },
    { value: 'tracking_issue', label: 'Tracking Issue', icon: '📍', requiresOrderId: true },
    { value: 'cancellation_issue', label: 'Cancellation Request', icon: '❌', requiresOrderId: true },
    { value: 'wallet_issue', label: 'Wallet Issue', icon: '💰', requiresWalletId: true },
    { value: 'seller_buyer_issue', label: 'Seller/Buyer Issue', icon: '👥', requiresSellerId: true },
    { value: 'ad_report', label: 'Report Ad/Seller', icon: '🚩', requiresAdId: true },
    { value: 'others', label: 'Others', icon: '📝', requiresNothing: true },
  ];

  useEffect(() => {
    loadUserId();
    requestPermissions();
  }, []);

  const loadUserId = async () => {
    try {
      if (__DEV__) console.log('Loading userId from AsyncStorage...');
      const id = await AsyncStorage.getItem('userId');
      
      if (!id) {
        if (__DEV__) console.log('No userId found in AsyncStorage');
        showErrorToast('Please log in to raise a query');
        router.replace('/auth');
        return;
      }
      
      if (__DEV__) console.log('UserId loaded successfully:', id);
      setUserId(id);
    } catch (error) {
      if (__DEV__) console.log('Error loading userId:', error);
      showErrorToast('Failed to load user data');
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      if (__DEV__) console.log('Requesting media library permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        if (__DEV__) console.log('Media library permission denied');
        showErrorToast('Camera roll permission is required to upload images');
      } else {
        if (__DEV__) console.log('Media library permission granted');
      }
    }
  };

  // Compress and resize image using expo-image-manipulator
  const compressImage = async (uri) => {
    try {
      if (__DEV__) console.log('Compressing image:', uri);
      const manipulatedImage = await manipulateAsync(
        uri,
        [{ resize: { width: 1920 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      if (__DEV__) console.log('Image compressed successfully:', manipulatedImage.uri);
      return manipulatedImage;
    } catch (error) {
      if (__DEV__) console.error('Image compression error:', error);
      throw error;
    }
  };

  // Handle image picker with compression
  const handleImagePicker = async () => {
    try {
      // Check if we can add more images
      if (formData.images.length >= 3) {
        if (__DEV__) console.log('Maximum image limit reached');
        showErrorToast('Maximum 3 images allowed');
        return;
      }

      if (__DEV__) console.log('Opening image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        if (__DEV__) console.log(`${result.assets.length} image(s) selected`);
        setImageLoading(true);
        const newImages = [];
        const newPreviews = [];

        for (const asset of result.assets) {
          // Check if adding this image would exceed the limit
          if (formData.images.length + newImages.length >= 3) {
            if (__DEV__) console.log('Image limit reached during processing');
            showWarningToast('Maximum 3 images allowed');
            break;
          }

          try {
            const uri = asset.uri;
            if (__DEV__) console.log('Processing image:', uri);
            
            // Check file size (approximate - 2MB limit)
            if (asset.fileSize) {
              const sizeInMB = asset.fileSize / 1024 / 1024;
              if (__DEV__) console.log(`Image size: ${sizeInMB.toFixed(2)} MB`);
              
              if (sizeInMB > 2) {
                if (__DEV__) console.log('Image exceeds 2MB limit');
                showErrorToast(`Image exceeds 2 MB (${sizeInMB.toFixed(2)} MB). Please compress it first`);
                continue;
              }
            }

            // Compress the image
            const compressed = await compressImage(uri);
            
            // Get filename and extension
            const filename = uri.split('/').pop() || `query_${Date.now()}.jpg`;
            const extension = filename.toLowerCase().split('.').pop();
            
            // Determine MIME type based on extension
            let mimeType = 'image/jpeg';
            if (extension === 'png') mimeType = 'image/png';
            else if (extension === 'gif') mimeType = 'image/gif';
            else if (extension === 'webp') mimeType = 'image/webp';
            else if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg';

            if (__DEV__) console.log(`Image MIME type: ${mimeType}`);

            // Format image object properly (same as Form component)
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
            
            if (__DEV__) console.log('Image processed successfully:', filename);
          } catch (error) {
            if (__DEV__) console.warn('Error processing image:', error);
            showErrorToast('Failed to process image. Please try another');
          }
        }

        if (newImages.length > 0) {
          if (__DEV__) console.log(`Adding ${newImages.length} image(s) to form`);
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...newImages],
          }));
          setImagePreviews((prev) => [...prev, ...newPreviews]);
          showSuccessToast(`${newImages.length} image(s) added successfully!`);
        }

        setImageLoading(false);
      } else {
        if (__DEV__) console.log('Image picker cancelled');
      }
    } catch (error) {
      if (__DEV__) console.error('Image picker error:', error);
      setImageLoading(false);
      showErrorToast('Error picking images. Please try again.');
    }
  };

  const removeImage = (indexToRemove) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (__DEV__) console.log('Removing image at index:', indexToRemove);
            const updatedImages = formData.images.filter(
              (_, idx) => idx !== indexToRemove
            );
            const updatedPreviews = imagePreviews.filter(
              (_, idx) => idx !== indexToRemove
            );

            setFormData((prev) => ({ ...prev, images: updatedImages }));
            setImagePreviews(updatedPreviews);
            showSuccessToast('Image removed');
            if (__DEV__) console.log('Image removed successfully');
          },
        },
      ]
    );
  };

  const handleChange = (field, value) => {
    if (__DEV__) console.log(`Field changed: ${field} = ${value}`);
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = () => {
    if (__DEV__) console.log('Validating form...');
    const issue = formData.issueType;
    
    if (!userId) {
      if (__DEV__) console.log('Validation failed: User ID missing');
      showErrorToast('User ID missing. Please log in again.');
      return false;
    }

    if (issue === 'order_issue' && !formData.orderId.trim()) {
      if (__DEV__) console.log('Validation failed: Order ID required');
      showErrorToast('Order ID is required for order issues');
      return false;
    }

    if (issue === 'tracking_issue' && !formData.orderId.trim()) {
      if (__DEV__) console.log('Validation failed: Order ID required for tracking');
      showErrorToast('Order ID is required for tracking issues');
      return false;
    }

    if (issue === 'cancellation_issue' && !formData.orderId.trim()) {
      if (__DEV__) console.log('Validation failed: Order ID required for cancellation');
      showErrorToast('Order ID is required for cancellation requests');
      return false;
    }

    if (issue === 'payment_issue' && !formData.transactionId.trim()) {
      if (__DEV__) console.log('Validation failed: Transaction ID required');
      showErrorToast('Transaction ID is required for payment issues');
      return false;
    }

    if (issue === 'wallet_issue' && !formData.walletId.trim()) {
      if (__DEV__) console.log('Validation failed: Wallet ID required');
      showErrorToast('Wallet ID is required for wallet issues');
      return false;
    }

    if (issue === 'seller_buyer_issue' && !formData.sellerId.trim()) {
      if (__DEV__) console.log('Validation failed: Seller ID required');
      showErrorToast('Seller ID is required for seller/buyer issues');
      return false;
    }

    if (issue === 'ad_report' && !formData.adId.trim()) {
      if (__DEV__) console.log('Validation failed: Ad ID required');
      showErrorToast('Ad/Product ID is required to report');
      return false;
    }

    if (!formData.message.trim()) {
      if (__DEV__) console.log('Validation failed: Message empty');
      showErrorToast('Please describe your issue');
      return false;
    }

    if (formData.message.trim().length < 10) {
      if (__DEV__) console.log('Validation failed: Message too short');
      showErrorToast('Description must be at least 10 characters');
      return false;
    }

    if (formData.message.length > 500) {
      if (__DEV__) console.log('Validation failed: Message too long');
      showErrorToast('Description cannot exceed 500 characters');
      return false;
    }

    if (formData.images.length > 3) {
      if (__DEV__) console.log('Validation failed: Too many images');
      showErrorToast('Maximum 3 images allowed');
      return false;
    }

    if (__DEV__) console.log('Form validation passed ✓');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (__DEV__) {
        console.log('=== DEBUG: Submitting Query ===');
        console.log('UserId:', userId);
        console.log('Issue Type:', formData.issueType);
        console.log('Number of images:', formData.images.length);
        console.log('API URL:', `${API_BASE_URL}/concern/raise`);
      }

      // Create FormData for submission (similar to Form component)
      const submitData = new FormData();

      // Append userId
      submitData.append('userId', userId);

      // Append all text fields
      submitData.append('issueType', formData.issueType);
      submitData.append('orderId', formData.orderId || '');
      submitData.append('transactionId', formData.transactionId || '');
      submitData.append('walletId', formData.walletId || '');
      submitData.append('sellerId', formData.sellerId || '');
      submitData.append('adId', formData.adId || '');
      submitData.append('message', formData.message);

      // Append images using FormData (same logic as Form component)
      if (__DEV__) {
        console.log('=== Appending Images to FormData ===');
        console.log('Number of images:', formData.images.length);
      }

      for (let index = 0; index < formData.images.length; index++) {
        const pic = formData.images[index];
        
        if (Platform.OS === 'web') {
          // For web, convert to blob and create File object
          try {
            const response = await fetch(pic.uri);
            const blob = await response.blob();
            const file = new File([blob], pic.name, { type: pic.type });
            submitData.append('images', file);
            
            if (__DEV__) {
              console.log(`Appended image ${index} (web):`, {
                name: file.name,
                type: file.type,
                size: file.size,
              });
            }
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
          submitData.append('images', file);
          
          if (__DEV__) {
            console.log(`Appended image ${index} (mobile):`, {
              name: file.name,
              type: file.type,
              uri: file.uri.substring(0, 50) + '...',
            });
          }
        }
      }

      if (__DEV__) {
        console.log('=== FormData prepared ===');
        console.log('Sending request to:', `${API_BASE_URL}/concern/raise`);
      }

      // Send using FormData (NOT JSON)
      const response = await fetch(`${API_BASE_URL}/concern/raise`, {
        method: 'POST',
        body: submitData,
        credentials: 'include',
        // DO NOT set Content-Type header - let browser/RN set it with boundary
      });

      if (__DEV__) console.log('Response status:', response.status);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        if (__DEV__) console.log('Response data:', result);

        if (response.ok) {
          if (__DEV__) console.log('Query submitted successfully ✓');
          setSuccess(true);
          showSuccessToast('✅ Query raised successfully!');
          
          if (result.estimatedResolutionTime) {
            setTimeout(() => {
              showInfoToast(`Expected response time: ${result.estimatedResolutionTime}`);
            }, 1500);
          }

          setTimeout(() => {
            if (__DEV__) console.log('Navigating to home...');
            router.replace('/');
          }, 3000);
        } else {
          if (__DEV__) console.log('Server returned error:', result.message);
          showErrorToast(result.message || 'Failed to submit query');
        }
      } else {
        // Not JSON response
        const textResponse = await response.text();
        if (__DEV__) console.error('Non-JSON response:', textResponse.substring(0, 200));
        showErrorToast('Server error. Please try again later');
      }
    } catch (error) {
      if (__DEV__) console.log('Submit error:', error);
      
      if (error.message && error.message.includes('Network request failed')) {
        if (__DEV__) console.log('Network error detected');
        showErrorToast('Cannot reach server. Please check your internet connection.');
      } else if (error.message && error.message.includes('timeout')) {
        if (__DEV__) console.log('Request timeout detected');
        showErrorToast('Request timed out. Please try again.');
      } else {
        if (__DEV__) console.log('Unknown error:', error.message);
        showErrorToast('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
      if (__DEV__) console.log('=== Submit process completed ===');
    }
  };

  const selectedIssue = issueTypes.find((t) => t.value === formData.issueType);

  const selectIssueType = (value) => {
    if (__DEV__) console.log('Issue type selected:', value);
    handleChange('issueType', value);
    setShowDropdown(false);
    
    setFormData({
      ...formData,
      issueType: value,
      orderId: '',
      transactionId: '',
      walletId: '',
      sellerId: '',
      adId: '',
    });
    
    showInfoToast(`Issue type changed to: ${issueTypes.find(t => t.value === value)?.label}`);
  };

  if (success) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#059669', '#16a34a']}
          style={styles.successContainer}
        >
          <Ionicons name="checkmark-circle" size={80} color="#fff" />
          <Text style={styles.successTitle}>Query Submitted!</Text>
          <Text style={styles.successText}>
            We'll respond within 24-48 hours via email or your query dashboard.
          </Text>
          <TouchableOpacity
            style={styles.successButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.successButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#059669', '#16a34a']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Raise a Query</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Issue Type Dropdown */}
        <View style={styles.card}>
          <Text style={styles.label}>
            🎯 What can we help you with? <Text style={styles.required}>*</Text>
          </Text>
          
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(!showDropdown)}
            activeOpacity={0.7}
          >
            <View style={styles.dropdownButtonContent}>
              <Text style={styles.dropdownButtonIcon}>{selectedIssue?.icon}</Text>
              <Text style={styles.dropdownButtonText}>{selectedIssue?.label}</Text>
            </View>
            <Ionicons 
              name={showDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#059669" 
            />
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownMenu}>
              {issueTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.dropdownItem,
                    formData.issueType === type.value && styles.dropdownItemActive,
                  ]}
                  onPress={() => selectIssueType(type.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemIcon}>{type.icon}</Text>
                  <Text style={styles.dropdownItemText}>{type.label}</Text>
                  {formData.issueType === type.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Dynamic Input Fields */}
        <View style={styles.card}>
          {selectedIssue?.requiresOrderId && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                📦 Order ID <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., ORD123456789"
                placeholderTextColor="#9ca3af"
                value={formData.orderId}
                onChangeText={(text) => handleChange('orderId', text)}
              />
            </View>
          )}

          {selectedIssue?.requiresTransactionId && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                💳 Transaction ID <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., TXN987654321"
                placeholderTextColor="#9ca3af"
                value={formData.transactionId}
                onChangeText={(text) => handleChange('transactionId', text)}
              />
            </View>
          )}

          {selectedIssue?.requiresWalletId && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                💰 Wallet ID <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., WAL123456789"
                placeholderTextColor="#9ca3af"
                value={formData.walletId}
                onChangeText={(text) => handleChange('walletId', text)}
              />
            </View>
          )}

          {selectedIssue?.requiresSellerId && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                👤 Seller ID <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., SEL123456789"
                placeholderTextColor="#9ca3af"
                value={formData.sellerId}
                onChangeText={(text) => handleChange('sellerId', text)}
              />
            </View>
          )}

          {selectedIssue?.requiresAdId && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                🏷️ Ad/Product ID <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., AD123456789"
                placeholderTextColor="#9ca3af"
                value={formData.adId}
                onChangeText={(text) => handleChange('adId', text)}
              />
            </View>
          )}
        </View>

        {/* Message */}
        <View style={styles.card}>
          <Text style={styles.label}>
            ✍️ Describe Your Issue <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Please provide as much detail as possible..."
            placeholderTextColor="#9ca3af"
            value={formData.message}
            onChangeText={(text) => handleChange('message', text)}
            multiline
            numberOfLines={6}
            maxLength={500}
            textAlignVertical="top"
          />
          <View style={styles.charCount}>
            <Text
              style={[
                styles.charCountText,
                formData.message.length < 10 && styles.charCountError,
              ]}
            >
              {formData.message.length < 10
                ? 'Minimum 10 characters required'
                : `${formData.message.length}/500`}
            </Text>
          </View>
        </View>

        {/* Image Upload */}
        <View style={styles.card}>
          <Text style={styles.label}>
            📸 Upload Images <Text style={styles.optional}>(Optional, Max 3)</Text>
          </Text>
          
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={handleImagePicker}
            activeOpacity={0.7}
            disabled={imageLoading || imagePreviews.length >= 3}
          >
            {imageLoading ? (
              <ActivityIndicator size="large" color="#059669" />
            ) : (
              <>
                <Ionicons 
                  name="cloud-upload-outline" 
                  size={32} 
                  color={imagePreviews.length >= 3 ? "#9ca3af" : "#059669"} 
                />
                <Text style={[
                  styles.uploadText,
                  imagePreviews.length >= 3 && styles.uploadTextDisabled
                ]}>
                  {imagePreviews.length >= 3 ? 'Maximum images reached' : 'Tap to upload images'}
                </Text>
                <Text style={styles.uploadSubtext}>PNG, JPG or JPEG (Auto-compressed, Max 2MB per image)</Text>
                {imagePreviews.length > 0 && (
                  <Text style={styles.uploadCount}>{imagePreviews.length}/3 images selected</Text>
                )}
              </>
            )}
          </TouchableOpacity>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <View style={styles.imageGrid}>
              {imagePreviews.map((uri, index) => (
                <View key={index} style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: uri }} 
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                  <View style={styles.imageLabel}>
                    <Text style={styles.imageName}>Image {index + 1}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#059669" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Quick Response Tips</Text>
            <Text style={styles.infoText}>
              • Provide order/transaction IDs for faster resolution{'\n'}
              • Include screenshots if applicable{'\n'}
              • Check your email for updates
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? ['#9ca3af', '#9ca3af'] : ['#059669', '#16a34a']}
            style={styles.submitGradient}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitText}>Submitting...</Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.submitText}>Submit Query</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  optional: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: 'normal',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1fae5',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownButtonIcon: {
    fontSize: 22,
  },
  dropdownButtonText: {
    fontSize: 15,
    color: '#047857',
    fontWeight: '600',
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0fdf4',
    gap: 10,
  },
  dropdownItemActive: {
    backgroundColor: '#f0fdf4',
  },
  dropdownItemIcon: {
    fontSize: 20,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: '#047857',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#d1fae5',
    color: '#1f2937',
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#d1fae5',
    color: '#1f2937',
    minHeight: 120,
  },
  charCount: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  charCountText: {
    fontSize: 12,
    color: '#6b7280',
  },
  charCountError: {
    color: '#ef4444',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1fae5',
    borderStyle: 'dashed',
    paddingVertical: 32,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    marginTop: 8,
  },
  uploadTextDisabled: {
    color: '#9ca3af',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  uploadCount: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  imagePreviewContainer: {
    width: '30%',
    aspectRatio: 1,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  imageName: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.9,
  },
  successButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  successButtonText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '700',
  },
});