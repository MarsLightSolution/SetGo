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
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
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

import { API_ENDPOINTS } from '../../config/api';

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
    images: [],
  });

  const [imageUris, setImageUris] = useState([]);
  const [loading, setLoading] = useState(false);
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
      const id = await AsyncStorage.getItem('userId');
      if (!id) {
        showErrorToast('Please log in to raise a query');
        router.replace('/auth');
        return;
      }
      setUserId(id);
    } catch (error) {
      // Silent error - log for debugging only
      if (__DEV__) console.log('Error loading userId:', error);
      showErrorToast('Failed to load user data');
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showErrorToast('Camera roll permission is required to upload images');
      }
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const pickImage = async () => {
    if (imageUris.length >= 3) {
      showErrorToast('Maximum 3 images allowed');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // ✅ Fixed deprecation warning
        allowsMultipleSelection: false,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        setImageUris([...imageUris, imageUri]);
        setFormData({
          ...formData,
          images: [...formData.images, imageUri],
        });
        
        showSuccessToast('Image added successfully!');
      }
    } catch (error) {
      // Silent error - only show user-friendly message
      if (__DEV__) console.log('Image picker error:', error);
      showErrorToast('Failed to pick image. Please try again.');
    }
  };

  const removeImage = (index) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newUris = imageUris.filter((_, i) => i !== index);
            const newImages = formData.images.filter((_, i) => i !== index);
            setImageUris(newUris);
            setFormData({ ...formData, images: newImages });
            showSuccessToast('Image removed');
          },
        },
      ]
    );
  };

  const validateForm = () => {
    const issue = formData.issueType;
    
    if (!userId) {
      showErrorToast('User ID missing. Please log in again.');
      return false;
    }

    if (issue === 'order_issue' && !formData.orderId.trim()) {
      showErrorToast('Order ID is required for order issues');
      return false;
    }

    if (issue === 'tracking_issue' && !formData.orderId.trim()) {
      showErrorToast('Order ID is required for tracking issues');
      return false;
    }

    if (issue === 'cancellation_issue' && !formData.orderId.trim()) {
      showErrorToast('Order ID is required for cancellation requests');
      return false;
    }

    if (issue === 'payment_issue' && !formData.transactionId.trim()) {
      showErrorToast('Transaction ID is required for payment issues');
      return false;
    }

    if (issue === 'wallet_issue' && !formData.walletId.trim()) {
      showErrorToast('Wallet ID is required for wallet issues');
      return false;
    }

    if (issue === 'seller_buyer_issue' && !formData.sellerId.trim()) {
      showErrorToast('Seller ID is required for seller/buyer issues');
      return false;
    }

    if (issue === 'ad_report' && !formData.adId.trim()) {
      showErrorToast('Ad/Product ID is required to report');
      return false;
    }

    if (!formData.message.trim()) {
      showErrorToast('Please describe your issue');
      return false;
    }

    if (formData.message.trim().length < 10) {
      showErrorToast('Description must be at least 10 characters');
      return false;
    }

    if (formData.message.length > 500) {
      showErrorToast('Description cannot exceed 500 characters');
      return false;
    }

    if (formData.images.length > 3) {
      showErrorToast('Maximum 3 images allowed');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data } = await axios.post(
        API_ENDPOINTS.CONCERN_RAISE,
        {
          userId,
          issueType: formData.issueType,
          orderId: formData.orderId || null,
          transactionId: formData.transactionId || null,
          walletId: formData.walletId || null,
          sellerId: formData.sellerId || null,
          adId: formData.adId || null,
          message: formData.message,
          images: formData.images,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      // Silent logging (only in dev mode)
      if (__DEV__) console.log('Backend response:', data);

      if (data.success) {
        setSuccess(true);
        showSuccessToast('✅ Query raised successfully!');
        
        if (data.estimatedResolutionTime) {
          setTimeout(() => {
            showSuccessToast(`Expected response time: ${data.estimatedResolutionTime}`);
          }, 1500);
        }

        setTimeout(() => {
          router.replace('/');
        }, 3000);
      } else {
        showErrorToast(data.message || 'Failed to submit query');
      }
    } catch (error) {
      // Silent error logging for debugging (only in dev mode)
      if (__DEV__) console.log('Submit error:', error.code, error.response?.status);
      
      // Show only user-friendly messages
      if (error.code === 'ECONNABORTED') {
        showErrorToast('Request timed out. Please check your connection and try again.');
      } else if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;
        
        switch (status) {
          case 400:
            showErrorToast(message || 'Invalid data. Please check your inputs.');
            break;
          case 401:
            showErrorToast('Session expired. Please log in again.');
            setTimeout(() => router.replace('/auth'), 2000);
            break;
          case 404:
            showErrorToast('Service not found. Please try again later.');
            break;
          case 500:
            if (message && message.includes('Valid ID')) {
              showErrorToast('Invalid Order/Transaction ID. Please verify and try again.');
            } else {
              showErrorToast(message || 'Server error. Please try again later.');
            }
            break;
          default:
            showErrorToast(message || 'Something went wrong. Please try again.');
        }
      } else if (error.request) {
        showErrorToast('Cannot reach server. Please check your internet connection.');
      } else {
        showErrorToast('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedIssue = issueTypes.find((t) => t.value === formData.issueType);

  const selectIssueType = (value) => {
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
            onPress={pickImage}
            activeOpacity={0.7}
            disabled={imageUris.length >= 3}
          >
            <Ionicons 
              name="cloud-upload-outline" 
              size={32} 
              color={imageUris.length >= 3 ? "#9ca3af" : "#059669"} 
            />
            <Text style={[
              styles.uploadText,
              imageUris.length >= 3 && styles.uploadTextDisabled
            ]}>
              {imageUris.length >= 3 ? 'Maximum images reached' : 'Tap to upload images'}
            </Text>
            <Text style={styles.uploadSubtext}>PNG, JPG or JPEG</Text>
            {imageUris.length > 0 && (
              <Text style={styles.uploadCount}>{imageUris.length}/3 images selected</Text>
            )}
          </TouchableOpacity>

          {imageUris.length > 0 && (
            <View style={styles.imageGrid}>
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                  <Image 
                    source={{ uri: uri }} 
                    style={styles.imageDisplay}
                    resizeMode="cover"
                  />
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


// ... (rest of your styles remain the same)
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
  imagePreview: {
    width: '30%',
    aspectRatio: 1,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageDisplay: {
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