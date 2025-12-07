"use client"

/**
 * COMPLETE MOBILE SETTINGS APP - IMPROVED UI/UX VERSION
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Set your API URL in .env file:
 *    EXPO_PUBLIC_API_URL=http://your-api-url.com/api
 * 
 * 2. After user login, save the complete user object to AsyncStorage:
 *    import { saveUserData } from './path-to-this-file'
 *    await saveUserData(userDataFromLoginResponse)
 * 
 * 3. The app will automatically:
 *    - Load user data from AsyncStorage on mount
 *    - Make API calls to update data on the server
 *    - Update AsyncStorage ONLY if API call succeeds
 *    - Show error message if API fails
 * 
 * 4. To clear user data on logout:
 *    await AsyncStorage.removeItem('userData')
 */

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
  ActivityIndicator,
  StatusBar,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Feather from "@expo/vector-icons/Feather"

// ==================== API CONFIGURATION ====================

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://your-api-url.com/api"

// Storage keys
const STORAGE_KEYS = {
  USER_DATA: "userData",
}

// Helper function to get user data from AsyncStorage
const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA)
    if (!userData) {
      console.warn("No user data found in storage")
      return null
    }
    return JSON.parse(userData)
  } catch (error) {
    console.error("Error getting user data from storage:", error)
    return null
  }
}

// Helper function to save user data to AsyncStorage (call this after login)
const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
    console.log("User data saved successfully")
    return true
  } catch (error) {
    console.error("Error saving user data:", error)
    return false
  }
}

// Export for use in login component
export { saveUserData, getUserData }

const apiService = {
  // Profile APIs
  getUserProfile: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/userdata/${userId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const text = await response.text()
      
      try {
        return JSON.parse(text)
      } catch (e) {
        console.error("API returned non-JSON response:", text)
        throw new Error("Server error: Invalid response format")
      }
    } catch (error) {
      console.error("getUserProfile error:", error)
      throw error
    }
  },

  // Profile Name Update (matches web version)
  updateProfileName: async (userId, profileName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/nameupdate/${userId}/profileName`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileName: profileName }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return data.data // Return the updated user data
      } catch (e) {
        throw new Error("Server error: Invalid response format")
      }
    } catch (error) {
      console.error("updateProfileName error:", error)
      throw error
    }
  },

  // Email verification (matches web version)
  verifyEmail: async (userId, password, newEmail) => {
    try {
      const response = await fetch(`${API_BASE_URL}/emailverify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: userId,
          password: password,
          newEmail: newEmail 
        }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return data.data || data // Return updated user data if available
      } catch (e) {
        throw new Error("Server error: Invalid response format")
      }
    } catch (error) {
      console.error("verifyEmail error:", error)
      throw error
    }
  },

  // Delivery Address Update (matches web version)
  updateDeliveryAddress: async (userId, deliveryAddress) => {
    try {
      const response = await fetch(`${API_BASE_URL}/deliveryaddress/${userId}/delivery-Address`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryAddress: deliveryAddress }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return data.data // Return the updated user data
      } catch (e) {
        throw new Error("Server error: Invalid response format")
      }
    } catch (error) {
      console.error("updateDeliveryAddress error:", error)
      throw error
    }
  },

  // Billing address update (matches web version)
  updateBillingAddress: async (userId, billingAddress) => {
    try {
      const response = await fetch(`${API_BASE_URL}/billingaddress/${userId}/billingAddress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingAddress: billingAddress }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return data.data || data // Return updated user data if available
      } catch (e) {
        throw new Error("Server error: Invalid response format")
      }
    } catch (error) {
      console.error("updateBillingAddress error:", error)
      throw error
    }
  },

  // Security APIs - Phone
  sendOTP: async (phoneData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/twilio/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(phoneData),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch (e) {
        throw new Error("Server error: Invalid response format")
      }
    } catch (error) {
      console.error("sendOTP error:", error)
      throw error
    }
  },

  verifyOTP: async (otpData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/twilio/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(otpData),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return data.data || data // Return updated user data if available
      } catch (e) {
        throw new Error("Server error: Invalid response format")
      }
    } catch (error) {
      console.error("verifyOTP error:", error)
      throw error
    }
  },

  // Security APIs - Password
  updatePassword: async (userId, passwordData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/updatepassword/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return data.data || data // Return updated user data if available
      } catch (e) {
        throw new Error("Server error: Invalid response format")
      }
    } catch (error) {
      console.error("updatePassword error:", error)
      throw error
    }
  },

  // Notification APIs
  toggleNewsletter: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/newsletter/${userId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return data.data || data // Return updated user data if available
      } catch (e) {
        throw new Error("Server error: Invalid response format")
      }
    } catch (error) {
      console.error("toggleNewsletter error:", error)
      throw error
    }
  },

  toggleMessages: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/messageforuser/${userId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return data.data || data // Return updated user data if available
      } catch (e) {
        throw new Error("Server error: Invalid response format")
      }
    } catch (error) {
      console.error("toggleMessages error:", error)
      throw error
    }
  },

  // Get user ads (matches web version)
  getUserAds: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/user/${userId}/ads`)
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return Array.isArray(data.data) ? data.data : []
      } catch (e) {
        throw new Error("Server error: Invalid response format")
      }
    } catch (error) {
      console.error("getUserAds error:", error)
      return []
    }
  },

  // Account Deletion (matches web version)
  deleteUser: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/deleteuser/${userId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch (e) {
        throw new Error("Server error: Invalid response format")
      }
    } catch (error) {
      console.error("deleteUser error:", error)
      throw error
    }
  },
}

// ==================== MENU ITEMS ====================
const MENU_ITEMS = [
  {
    id: "profile",
    icon: "user",
    label: "Profile",
    desc: "Personal details & preferences",
    color: "#8B5CF6",
    bg: "#F5F3FF",
  },
  {
    id: "security",
    icon: "shield",
    label: "Security",
    desc: "Password & authentication",
    color: "#EF4444",
    bg: "#FEF2F2",
  },
  {
    id: "payments",
    icon: "credit-card",
    label: "Payments",
    desc: "Billing & payout methods",
    color: "#3B82F6",
    bg: "#EFF6FF",
  },
  {
    id: "notifications",
    icon: "bell",
    label: "Notifications",
    desc: "Email preferences",
    color: "#F59E0B",
    bg: "#FFFBEB",
  },
  {
    id: "privacy",
    icon: "lock",
    label: "Privacy",
    desc: "Data protection settings",
    color: "#10B981",
    bg: "#ECFDF5",
  },
]

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  // Header
  menuHeader: {
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },

  // Menu
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    padding: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1.2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 13,
    color: "#9CA3AF",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 24,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },

  // Content
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 12,
  },
  cardGroup: {
    gap: 12,
  },

  // Setting Card
  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  settingCardStatic: {
    opacity: 0.7,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Activity
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  activityText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#059669",
    flex: 1,
  },

  // Toggle
  toggleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  toggleContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  toggleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  toggleDesc: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  toggleTrack: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D1D5DB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // Danger Button
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
    borderWidth: 2,
    borderColor: "#FEE2E2",
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    marginBottom: 0,
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 24,
  },
  modalDesc: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },

  // Info Box
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1E40AF",
    lineHeight: 18,
  },

  // Input
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: "#F3F4F6",
  },
  inputIcon: {
    marginRight: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    paddingVertical: 14,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
  },

  // OTP Input
  otpInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#10B981",
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 16,
  },

  resendBtn: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  resendText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },

  // Country Code Input
  countryCodeInput: {
    width: 75,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1F2937",
    textAlign: "center",
    fontWeight: "600",
  },

  // Button
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOpacity: 0.3,
  },
  buttonSecondary: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  buttonTextPrimary: {
    color: "#fff",
  },
  buttonTextSecondary: {
    color: "#1F2937",
  },

  // Modal Button
  modalButton: {
    flex: 1,
  },

  // Loading State
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },

  // Payment Info Card
  paymentInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  paymentInfoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E40AF",
    marginBottom: 4,
  },
  paymentInfoDesc: {
    fontSize: 13,
    color: "#3B82F6",
    lineHeight: 18,
  },

  // Privacy Card
  privacyCard: {
    backgroundColor: "#ECFDF5",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#D1FAE5",
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
    marginTop: 12,
    marginBottom: 8,
  },
  privacyDesc: {
    fontSize: 14,
    color: "#047857",
    textAlign: "center",
    lineHeight: 20,
  },

  // Address Modal Styles
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#10B981",
    borderStyle: "dashed",
  },
  addAddressText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#10B981",
  },
  currentAddressBox: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  currentAddressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  currentAddressText: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 20,
  },
})

// ==================== ANIMATED COMPONENTS ====================

function AnimatedCard({ children, delay = 0 }) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  )
}

function PulseIcon({ size = 6, color = "#10B981" }) {
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View
      style={{
        width: size * 4,
        height: size * 4,
        borderRadius: size * 2,
        backgroundColor: color,
        transform: [{ scale: pulseAnim }],
      }}
    />
  )
}

function AnimatedButton({ title, onPress, loading, variant = "primary", style }) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
        style={[
          styles.button,
          variant === "primary" ? styles.buttonPrimary : styles.buttonSecondary,
          loading && styles.buttonDisabled,
          style,
        ]}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color={variant === "primary" ? "#fff" : "#10B981"} />
        ) : (
          <Text style={[styles.buttonText, variant === "primary" ? styles.buttonTextPrimary : styles.buttonTextSecondary]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

function AnimatedInput({ label, value, onChangeText, icon, secureTextEntry, error, placeholder, editable = true }) {
  const [focused, setFocused] = useState(false)
  const borderAnim = useRef(new Animated.Value(0)).current
  const [showPassword, setShowPassword] = useState(false)

  const handleFocus = () => {
    setFocused(true)
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }

  const handleBlur = () => {
    setFocused(false)
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: error ? ["#FCA5A5", "#EF4444"] : ["#E5E7EB", "#10B981"],
  })

  return (
    <View style={styles.inputGroup}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <Animated.View style={[styles.inputContainer, { borderColor }, !editable && styles.inputDisabled]}>
        {icon && <Feather name={icon} size={20} color={focused ? "#10B981" : "#9CA3AF"} style={styles.inputIcon} />}
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !showPassword}
          placeholder={placeholder}
          placeholderTextColor="#D1D5DB"
          editable={editable}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  )
}

function SettingCard({ icon, label, value, onPress, iconColor, iconBg, isStatic = false }) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    if (!isStatic) {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start()
    }
  }

  const handlePressOut = () => {
    if (!isStatic) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start()
    }
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.settingCard, isStatic && styles.settingCardStatic]}
        onPress={isStatic ? null : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={isStatic ? 1 : 0.9}
        disabled={isStatic}
      >
        <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
          <Feather name={icon} size={22} color={iconColor} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingLabel}>{label}</Text>
          {value && <Text style={styles.settingValue}>{value}</Text>}
        </View>
        {!isStatic && <Feather name="chevron-right" size={20} color="#D1D5DB" />}
        {isStatic && <Feather name="lock" size={18} color="#9CA3AF" />}
      </TouchableOpacity>
    </Animated.View>
  )
}

function AnimatedToggle({ value, onValueChange, loading }) {
  const translateAnim = useRef(new Animated.Value(value ? 1 : 0)).current

  useEffect(() => {
    Animated.spring(translateAnim, {
      toValue: value ? 1 : 0,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }, [value])

  const thumbTranslate = translateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26],
  })

  if (loading) {
    return <ActivityIndicator color="#10B981" size="small" />
  }

  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      style={[styles.toggleTrack, value && styles.toggleTrackActive]}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.toggleThumb,
          {
            transform: [{ translateX: thumbTranslate }],
          },
        ]}
      />
    </TouchableOpacity>
  )
}

// ==================== MAIN APP ====================

export default function EnhancedSettingsApp() {
  const [currentScreen, setCurrentScreen] = useState("menu")
  const [modalOpen, setModalOpen] = useState(null)
  const [loading, setLoading] = useState(false)
  const [phoneStep, setPhoneStep] = useState(1)
  const [addressStep, setAddressStep] = useState(1) // 1: landing, 2: form
  const [userData, setUserData] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [userAds, setUserAds] = useState([])
  const [tempUsername, setTempUsername] = useState("")
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentEmail: "",
    newEmail: "",
    emailPassword: "",
    phoneNumber: "",
    countryCode: "+91",
    otp: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    deliveryAddress: {
      firstName: "",
      lastName: "",
      suffix: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      location: "",
    },
    billingAddress: "",
    newsletter: false,
    messageforuser: false,
  })

  const [toggleLoading, setToggleLoading] = useState({
    newsletter: false,
    messageforuser: false,
  })

  // Load user data from storage on mount
  useEffect(() => {
    initializeApp()
  }, [])

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentScreen !== "menu") {
        goBack()
        return true
      }
      return false
    })

    return () => backHandler.remove()
  }, [currentScreen])

  const initializeApp = async () => {
    try {
      setInitialLoading(true)
      
      const storedUserData = await getUserData()
      
      if (!storedUserData) {
        Alert.alert(
          "No User Data Found",
          "Please log in first.",
          [{ text: "OK" }]
        )
        setInitialLoading(false)
        return
      }
      
      setUserData(storedUserData)
      
      let parsedDeliveryAddress = {
        firstName: "",
        lastName: "",
        suffix: "",
        street: "",
        houseNumber: "",
        postalCode: "",
        location: "",
      }
      
      if (storedUserData.deliveryAddress && storedUserData.deliveryAddress !== "NA") {
        try {
          parsedDeliveryAddress = typeof storedUserData.deliveryAddress === 'string' 
            ? JSON.parse(storedUserData.deliveryAddress) 
            : storedUserData.deliveryAddress
        } catch (e) {
          console.log("Could not parse delivery address")
        }
      }
      
      setFormData({
        ...formData,
        username: storedUserData.username || storedUserData.chatDisplayName || "",
        email: storedUserData.email || "",
        currentEmail: storedUserData.email || "",
        phoneNumber: storedUserData.phoneNumber || "",
        deliveryAddress: parsedDeliveryAddress,
        billingAddress: storedUserData.billingAddress || "",
        newsletter: storedUserData.newsletter || false,
        messageforuser: storedUserData.messageforuser || false,
      })
      
      if (storedUserData._id) {
        loadUserAds(storedUserData._id)
      }
    } catch (error) {
      console.error("Initialize app error:", error)
      Alert.alert("Error", "Failed to load user data")
    } finally {
      setInitialLoading(false)
    }
  }

  const loadUserAds = async (userId) => {
    try {
      const ads = await apiService.getUserAds(userId)
      setUserAds(ads)
    } catch (error) {
      console.error("Load ads error:", error)
      setUserAds([])
    }
  }

  const navigateTo = (screen) => setCurrentScreen(screen)
  const goBack = () => setCurrentScreen("menu")

  // Logout Handler
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA)
              Alert.alert("Success", "Logged out successfully")
              // Navigate to login screen
              // navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
            } catch (error) {
              Alert.alert("Error", "Failed to logout")
            }
          },
        },
      ]
    )
  }

  // Profile - Username Update (matches web version)
  const handleUsernameUpdate = async () => {
    if (!userData || !userData._id) {
      Alert.alert("Error", "User data not found. Please log in again.")
      return
    }
    
    if (!tempUsername || tempUsername.trim() === "") {
      Alert.alert("Error", "Please enter a username")
      return
    }
    
    setLoading(true)
    try {
      const updatedUser = await apiService.updateProfileName(userData._id, tempUsername)
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser))
      setUserData(updatedUser)
      setFormData({ ...formData, username: tempUsername })
      
      Alert.alert("Success", "Username updated successfully!")
      setModalOpen(null)
      setTempUsername("")
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update username")
    } finally {
      setLoading(false)
    }
  }

  // Profile - Email Update (matches web version)
  const handleEmailUpdate = async () => {
    if (!userData || !userData._id) {
      Alert.alert("Error", "User data not found. Please log in again.")
      return
    }
    
    if (!formData.newEmail || !formData.emailPassword) {
      Alert.alert("Error", "Please fill all fields")
      return
    }
    
    setLoading(true)
    try {
      const result = await apiService.verifyEmail(userData._id, formData.emailPassword, formData.newEmail)
      
      let updatedUser = result
      if (!result._id) {
        updatedUser = { ...userData, email: formData.newEmail }
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser))
      setUserData(updatedUser)
      setFormData({ ...formData, email: formData.newEmail, currentEmail: formData.newEmail, newEmail: "", emailPassword: "" })
      
      Alert.alert("Success", "Email updated successfully! Please check your inbox for verification.")
      setModalOpen(null)
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update email")
    } finally {
      setLoading(false)
    }
  }

  // Profile - Delivery Address Update (matches web version)
  const handleAddressUpdate = async () => {
    if (!userData || !userData._id) {
      Alert.alert("Error", "User data not found. Please log in again.")
      return
    }
    
    const { firstName, lastName, street, houseNumber, postalCode, location } = formData.deliveryAddress
    
    if (!firstName || !lastName || !street || !houseNumber || !postalCode || !location) {
      Alert.alert("Error", "Please fill all required fields")
      return
    }
    
    setLoading(true)
    try {
      const addressString = `${formData.deliveryAddress.firstName} ${formData.deliveryAddress.lastName}${formData.deliveryAddress.suffix ? ', ' + formData.deliveryAddress.suffix : ''}, ${formData.deliveryAddress.street} ${formData.deliveryAddress.houseNumber}, ${formData.deliveryAddress.postalCode}, ${formData.deliveryAddress.location}`
      
      const updatedUser = await apiService.updateDeliveryAddress(userData._id, addressString)
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser))
      setUserData(updatedUser)
      setFormData({ ...formData, deliveryAddress: formData.deliveryAddress })
      
      Alert.alert("Success", "Delivery address updated successfully!")
      setModalOpen(null)
      setAddressStep(1)
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update address")
    } finally {
      setLoading(false)
    }
  }

  // Billing Address Update (matches web version)
  const handleBillingUpdate = async () => {
    if (!userData || !userData._id) {
      Alert.alert("Error", "User data not found. Please log in again.")
      return
    }
    
    if (!formData.billingAddress || formData.billingAddress.trim() === "") {
      Alert.alert("Error", "Please enter billing address")
      return
    }
    
    setLoading(true)
    try {
      const result = await apiService.updateBillingAddress(userData._id, formData.billingAddress)
      
      let updatedUser = result
      if (!result._id) {
        updatedUser = { ...userData, billingAddress: formData.billingAddress }
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser))
      setUserData(updatedUser)
      
      Alert.alert("Success", "Billing address updated successfully!")
      setModalOpen(null)
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update billing address")
    } finally {
      setLoading(false)
    }
  }

  // Security - Phone Update
  const handleSendOTP = async () => {
    if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number")
      return
    }
    
    setLoading(true)
    try {
      await apiService.sendOTP({
        countryCode: formData.countryCode,
        phoneNumber: formData.phoneNumber,
      })
      setPhoneStep(2)
      Alert.alert("Success", "OTP sent successfully to your phone")
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!userData || !userData._id) {
      Alert.alert("Error", "User data not found. Please log in again.")
      return
    }
    
    if (!formData.otp || formData.otp.length !== 6) {
      Alert.alert("Error", "Please enter 6-digit OTP")
      return
    }
    
    setLoading(true)
    try {
      const result = await apiService.verifyOTP({
        countryCode: formData.countryCode,
        phoneNumber: formData.phoneNumber,
        otp: formData.otp,
      })
      
      let updatedUser = result
      if (!result._id) {
        updatedUser = { ...userData, phoneNumber: formData.phoneNumber }
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser))
      setUserData(updatedUser)
      
      Alert.alert("Success", "Phone number verified successfully!")
      setModalOpen(null)
      setPhoneStep(1)
      setFormData({ ...formData, otp: "" })
    } catch (error) {
      Alert.alert("Error", error.message || "Invalid OTP")
    } finally {
      setLoading(false)
    }
  }

  // Security - Password Update
  const handlePasswordUpdate = async () => {
    if (!userData || !userData._id) {
      Alert.alert("Error", "User data not found. Please log in again.")
      return
    }
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      Alert.alert("Error", "Please fill all fields")
      return
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert("Error", "New passwords do not match")
      return
    }
    
    if (formData.newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters")
      return
    }
    
    setLoading(true)
    try {
      const result = await apiService.updatePassword(userData._id, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })
      
      if (result._id) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(result))
        setUserData(result)
      }
      
      Alert.alert("Success", "Password updated successfully!")
      setModalOpen(null)
      setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  // Notifications - Toggle Newsletter
  const handleNewsletterToggle = async (value) => {
    if (!userData || !userData._id) {
      Alert.alert("Error", "User data not found. Please log in again.")
      return
    }
    
    setToggleLoading({ ...toggleLoading, newsletter: true })
    try {
      const result = await apiService.toggleNewsletter(userData._id)
      
      let updatedUser = result
      if (!result._id) {
        updatedUser = { ...userData, newsletter: value }
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser))
      setUserData(updatedUser)
      setFormData({ ...formData, newsletter: updatedUser.newsletter })
    } catch (error) {
      Alert.alert("Error", "Failed to update newsletter preference")
    } finally {
      setToggleLoading({ ...toggleLoading, newsletter: false })
    }
  }

  // Notifications - Toggle Messages
  const handleMessagesToggle = async (value) => {
    if (!userData || !userData._id) {
      Alert.alert("Error", "User data not found. Please log in again.")
      return
    }
    
    setToggleLoading({ ...toggleLoading, messageforuser: true })
    try {
      const result = await apiService.toggleMessages(userData._id)
      
      let updatedUser = result
      if (!result._id) {
        updatedUser = { ...userData, messageforuser: value }
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser))
      setUserData(updatedUser)
      setFormData({ ...formData, messageforuser: updatedUser.messageforuser })
    } catch (error) {
      Alert.alert("Error", "Failed to update messages preference")
    } finally {
      setToggleLoading({ ...toggleLoading, messageforuser: false })
    }
  }

  // Delete Account
  const handleDeleteAccount = () => {
    if (!userData || !userData._id) {
      Alert.alert("Error", "User data not found. Please log in again.")
      return
    }
    
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. Are you sure you want to delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true)
              await apiService.deleteUser(userData._id)
              
              await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA)
              
              Alert.alert("Success", "Account deleted successfully", [
                {
                  text: "OK",
                  onPress: () => {
                    // Navigate to login screen
                    // navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
                  }
                }
              ])
            } catch (error) {
              Alert.alert("Error", "Failed to delete account")
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const renderHeader = (title, subtitle, showBack) => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {showBack && (
          <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  )

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    )
  }

  const renderMenu = () => (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.menuHeader}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {formData.username?.charAt(0)?.toUpperCase() || "U"}
            </Text>
            <View style={styles.onlineBadge}>
              <PulseIcon size={3} color="#10B981" />
            </View>
          </View>
          <View>
            <Text style={styles.profileName}>{formData.username || "User"}</Text>
            <Text style={styles.profileEmail}>{formData.email}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.menuScroll} contentContainerStyle={styles.menuContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <Feather name="settings" size={16} color="#9CA3AF" />
        </View>

        {MENU_ITEMS.map((item, index) => (
          <AnimatedCard key={item.id} delay={index * 100}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                <Feather name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              <Feather name="chevron-right" size={22} color="#D1D5DB" />
            </TouchableOpacity>
          </AnimatedCard>
        ))}

        <View style={styles.divider} />
      </ScrollView>
    </View>
  )

  const renderProfile = () => (
    <View style={styles.screen}>
      {renderHeader("Profile", "Manage your information", true)}
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <AnimatedCard>
          <Text style={styles.sectionLabel}>PERSONAL INFORMATION</Text>
          <View style={styles.cardGroup}>
            <SettingCard
              icon="user"
              label="Username"
              value={formData.username}
              iconColor="#8B5CF6"
              iconBg="#F5F3FF"
              onPress={() => {
                setTempUsername(formData.username)
                setModalOpen("username")
              }}
            />
            <SettingCard
              icon="mail"
              label="Email Address"
              value={formData.email}
              iconColor="#3B82F6"
              iconBg="#EFF6FF"
              onPress={() => setModalOpen("email")}
            />
          </View>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <Text style={styles.sectionLabel}>ADDRESS</Text>
          <SettingCard
            icon="map-pin"
            label="Delivery Address"
            value={
              formData.deliveryAddress.street 
                ? `${formData.deliveryAddress.street} ${formData.deliveryAddress.houseNumber}, ${formData.deliveryAddress.location}` 
                : "Not set"
            }
            iconColor="#10B981"
            iconBg="#ECFDF5"
            onPress={() => setModalOpen("address")}
          />
        </AnimatedCard>
      </ScrollView>
    </View>
  )

  const renderSecurity = () => (
    <View style={styles.screen}>
      {renderHeader("Security", "Account security", true)}
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <AnimatedCard>
          <Text style={styles.sectionLabel}>AUTHENTICATION</Text>
          <View style={styles.cardGroup}>
            <SettingCard
              icon="smartphone"
              label="Phone Number"
              value={formData.phoneNumber || "Add phone number"}
              iconColor="#8B5CF6"
              iconBg="#F5F3FF"
              onPress={() => setModalOpen("phone")}
            />
            <SettingCard
              icon="lock"
              label="Password"
              value="••••••••"
              iconColor="#EF4444"
              iconBg="#FEF2F2"
              onPress={() => setModalOpen("password")}
            />
          </View>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <Text style={styles.sectionLabel}>BILLING</Text>
          <SettingCard
            icon="credit-card"
            label="Billing Address"
            value={formData.billingAddress || "Not set"}
            iconColor="#F59E0B"
            iconBg="#FFFBEB"
            onPress={() => setModalOpen("billing")}
          />
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <Text style={styles.sectionLabel}>ACTIVITY</Text>
          <View style={styles.activityCard}>
            <Feather name="activity" size={20} color="#10B981" />
            <Text style={styles.activityText}>
              {userAds.length > 0 
                ? `You have ${userAds.length} active ad${userAds.length > 1 ? 's' : ''}` 
                : "No active ads"}
            </Text>
          </View>
        </AnimatedCard>

        <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount} activeOpacity={0.7}>
          <Feather name="trash-2" size={20} color="#EF4444" />
          <Text style={styles.dangerButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )

  const renderNotifications = () => (
    <View style={styles.screen}>
      {renderHeader("Notifications", "Manage preferences", true)}
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <AnimatedCard>
          <View style={styles.toggleItem}>
            <View style={styles.toggleContent}>
              <View style={styles.toggleIconContainer}>
                <Feather name="mail" size={20} color="#10B981" />
              </View>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Newsletter</Text>
                <Text style={styles.toggleDesc}>Weekly updates and tips</Text>
              </View>
            </View>
            <AnimatedToggle
              value={formData.newsletter}
              onValueChange={handleNewsletterToggle}
              loading={toggleLoading.newsletter}
            />
          </View>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <View style={styles.toggleItem}>
            <View style={styles.toggleContent}>
              <View style={styles.toggleIconContainer}>
                <Feather name="message-circle" size={20} color="#10B981" />
              </View>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Messages from Users</Text>
                <Text style={styles.toggleDesc}>Direct messages from other users</Text>
              </View>
            </View>
            <AnimatedToggle
              value={formData.messageforuser}
              onValueChange={handleMessagesToggle}
              loading={toggleLoading.messageforuser}
            />
          </View>
        </AnimatedCard>
      </ScrollView>
    </View>
  )

  const renderPayments = () => (
    <View style={styles.screen}>
      {renderHeader("Payments", "Billing & payment methods", true)}
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <AnimatedCard>
          <Text style={styles.sectionLabel}>PAYMENT METHODS</Text>
          <SettingCard
            icon="credit-card"
            label="Payout Account"
            value="Contact admin to update"
            iconColor="#3B82F6"
            iconBg="#EFF6FF"
            isStatic={true}
          />
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <Text style={styles.sectionLabel}>BILLING ADDRESS</Text>
          <SettingCard
            icon="map-pin"
            label="Billing Address"
            value="Contact admin to update"
            iconColor="#F59E0B"
            iconBg="#FFFBEB"
            isStatic={true}
          />
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <View style={styles.paymentInfoCard}>
            <Feather name="info" size={20} color="#3B82F6" />
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentInfoTitle}>Admin Access Required</Text>
              <Text style={styles.paymentInfoDesc}>
                Please contact your administrator to update payment and billing information
              </Text>
            </View>
          </View>
        </AnimatedCard>
      </ScrollView>
    </View>
  )

  const renderPrivacy = () => (
    <View style={styles.screen}>
      {renderHeader("Privacy", "Data protection & privacy", true)}
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <AnimatedCard>
          <Text style={styles.sectionLabel}>PRIVACY & SECURITY</Text>
          <View style={styles.cardGroup}>
            {[
              { icon: "settings", label: "Privacy Settings", desc: "Manage your privacy" },
              { icon: "file-text", label: "Privacy Policy", desc: "Read our policy" },
              { icon: "shield", label: "Data Protection", desc: "How we protect you" },
            ].map((item, index) => (
              <SettingCard
                key={index}
                icon={item.icon}
                label={item.label}
                value={item.desc}
                iconColor="#10B981"
                iconBg="#ECFDF5"
                onPress={() => Alert.alert(item.label, `${item.label} information will be displayed here`)}
              />
            ))}
          </View>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <View style={styles.privacyCard}>
            <Feather name="lock" size={24} color="#10B981" />
            <Text style={styles.privacyTitle}>Your Data is Safe</Text>
            <Text style={styles.privacyDesc}>
              We use industry-standard encryption to protect your personal information
            </Text>
          </View>
        </AnimatedCard>
      </ScrollView>
    </View>
  )

  // Username Modal
  const renderUsernameModal = () => (
    <Modal visible={modalOpen === "username"} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.backdrop} onPress={() => {
          setModalOpen(null)
          setTempUsername("")
        }}>
          <View style={styles.modalContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Change Username</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setModalOpen(null)
                      setTempUsername("")
                    }}
                    style={styles.modalCloseButton}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  <AnimatedInput
                    label="Username"
                    value={tempUsername}
                    onChangeText={(val) => setTempUsername(val)}
                    icon="user"
                    placeholder="Enter your username"
                  />
                </View>

                <View style={styles.modalFooter}>
                  <AnimatedButton
                    title="Cancel"
                    onPress={() => {
                      setModalOpen(null)
                      setTempUsername("")
                    }}
                    variant="secondary"
                    style={styles.modalButton}
                  />
                  <AnimatedButton
                    title="Save"
                    onPress={handleUsernameUpdate}
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
  )

  // Email Modal
  const renderEmailModal = () => (
    <Modal visible={modalOpen === "email"} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.backdrop} onPress={() => {
          setModalOpen(null)
          setFormData({ ...formData, newEmail: "", emailPassword: "" })
        }}>
          <View style={styles.modalContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Change Email</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setModalOpen(null)
                      setFormData({ ...formData, newEmail: "", emailPassword: "" })
                    }}
                    style={styles.modalCloseButton}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                >
                  <View style={styles.infoBox}>
                    <Feather name="info" size={18} color="#3B82F6" />
                    <Text style={styles.infoText}>
                      Verification emails will be sent to both addresses
                    </Text>
                  </View>
                  <AnimatedInput
                    label="Current Email"
                    value={formData.currentEmail}
                    onChangeText={() => {}}
                    icon="mail"
                    editable={false}
                  />
                  <AnimatedInput
                    label="New Email"
                    value={formData.newEmail}
                    onChangeText={(val) => setFormData({ ...formData, newEmail: val })}
                    icon="mail"
                    placeholder="new@email.com"
                  />
                  <AnimatedInput
                    label="Password"
                    value={formData.emailPassword}
                    onChangeText={(val) => setFormData({ ...formData, emailPassword: val })}
                    icon="lock"
                    secureTextEntry
                    placeholder="Enter your password"
                  />
                </ScrollView>

                <View style={styles.modalFooter}>
                  <AnimatedButton
                    title="Cancel"
                    onPress={() => {
                      setModalOpen(null)
                      setFormData({ ...formData, newEmail: "", emailPassword: "" })
                    }}
                    variant="secondary"
                    style={styles.modalButton}
                  />
                  <AnimatedButton
                    title="Update Email"
                    onPress={handleEmailUpdate}
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
  )

  // Address Modal
  const renderAddressModal = () => (
    <Modal visible={modalOpen === "address"} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.backdrop} onPress={() => {
          setModalOpen(null)
          setAddressStep(1)
        }}>
          <View style={styles.modalContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {addressStep === 1 ? "Delivery Address" : "Enter Address"}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setModalOpen(null)
                      setAddressStep(1)
                    }}
                    style={styles.modalCloseButton}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                >
                  {addressStep === 1 ? (
                    <>
                      <Text style={styles.modalDesc}>
                        Manage your saved delivery address here.
                      </Text>
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
                    <>
                      <AnimatedInput
                        label="First Name*"
                        value={formData.deliveryAddress.firstName}
                        onChangeText={(val) => setFormData({
                          ...formData,
                          deliveryAddress: { ...formData.deliveryAddress, firstName: val }
                        })}
                        icon="user"
                        placeholder="First name"
                      />
                      <AnimatedInput
                        label="Last Name*"
                        value={formData.deliveryAddress.lastName}
                        onChangeText={(val) => setFormData({
                          ...formData,
                          deliveryAddress: { ...formData.deliveryAddress, lastName: val }
                        })}
                        icon="user"
                        placeholder="Last name"
                      />
                      <AnimatedInput
                        label="Address Suffix (Optional)"
                        value={formData.deliveryAddress.suffix}
                        onChangeText={(val) => setFormData({
                          ...formData,
                          deliveryAddress: { ...formData.deliveryAddress, suffix: val }
                        })}
                        icon="tag"
                        placeholder="Apt, Suite, etc."
                      />
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <View style={{ flex: 2 }}>
                          <AnimatedInput
                            label="Street*"
                            value={formData.deliveryAddress.street}
                            onChangeText={(val) => setFormData({
                              ...formData,
                              deliveryAddress: { ...formData.deliveryAddress, street: val }
                            })}
                            icon="map-pin"
                            placeholder="Street name"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <AnimatedInput
                            label="No.*"
                            value={formData.deliveryAddress.houseNumber}
                            onChangeText={(val) => setFormData({
                              ...formData,
                              deliveryAddress: { ...formData.deliveryAddress, houseNumber: val }
                            })}
                            icon="hash"
                            placeholder="123"
                          />
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <AnimatedInput
                            label="Postal Code*"
                            value={formData.deliveryAddress.postalCode}
                            onChangeText={(val) => setFormData({
                              ...formData,
                              deliveryAddress: { ...formData.deliveryAddress, postalCode: val }
                            })}
                            icon="mail"
                            placeholder="12345"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <AnimatedInput
                            label="Location*"
                            value={formData.deliveryAddress.location}
                            onChangeText={(val) => setFormData({
                              ...formData,
                              deliveryAddress: { ...formData.deliveryAddress, location: val }
                            })}
                            icon="home"
                            placeholder="City"
                          />
                        </View>
                      </View>
                    </>
                  )}
                </ScrollView>

                <View style={styles.modalFooter}>
                  {addressStep === 1 ? (
                    <AnimatedButton
                      title="Close"
                      onPress={() => {
                        setModalOpen(null)
                        setAddressStep(1)
                      }}
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <>
                      <AnimatedButton
                        title="Back"
                        onPress={() => setAddressStep(1)}
                        variant="secondary"
                        style={styles.modalButton}
                      />
                      <AnimatedButton
                        title="Save"
                        onPress={handleAddressUpdate}
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
  )

  // Phone Modal
  const renderPhoneModal = () => (
    <Modal visible={modalOpen === "phone"} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.backdrop} onPress={() => { setModalOpen(null); setPhoneStep(1); }}>
          <View style={styles.modalContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{phoneStep === 1 ? "Verify Phone" : "Enter OTP"}</Text>
                  <TouchableOpacity 
                    onPress={() => { setModalOpen(null); setPhoneStep(1); }}
                    style={styles.modalCloseButton}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  {phoneStep === 1 ? (
                    <>
                      <Text style={styles.modalDesc}>We'll send a verification code to your phone</Text>
                      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                        <TextInput
                          style={styles.countryCodeInput}
                          value={formData.countryCode}
                          onChangeText={(val) => setFormData({ ...formData, countryCode: val })}
                          placeholder="+91"
                        />
                        <View style={{ flex: 1 }}>
                          <AnimatedInput
                            value={formData.phoneNumber}
                            onChangeText={(val) => setFormData({ ...formData, phoneNumber: val })}
                            icon="smartphone"
                            placeholder="1234567890"
                          />
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.modalDesc}>
                        Enter the 6-digit code sent to {formData.countryCode} {formData.phoneNumber}
                      </Text>
                      <TextInput
                        style={styles.otpInput}
                        value={formData.otp}
                        onChangeText={(val) => setFormData({ ...formData, otp: val })}
                        placeholder="000000"
                        placeholderTextColor="#D1D5DB"
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                      <TouchableOpacity style={styles.resendBtn} onPress={handleSendOTP}>
                        <Text style={styles.resendText}>Resend Code</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                <View style={styles.modalFooter}>
                  <AnimatedButton
                    title="Cancel"
                    onPress={() => { setModalOpen(null); setPhoneStep(1); }}
                    variant="secondary"
                    style={styles.modalButton}
                  />
                  <AnimatedButton
                    title={phoneStep === 1 ? "Send Code" : "Verify"}
                    onPress={phoneStep === 1 ? handleSendOTP : handleVerifyOTP}
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
  )

  // Billing Address Modal
  const renderBillingModal = () => (
    <Modal visible={modalOpen === "billing"} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.backdrop} onPress={() => setModalOpen(null)}>
          <View style={styles.modalContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Billing Address</Text>
                  <TouchableOpacity 
                    onPress={() => setModalOpen(null)}
                    style={styles.modalCloseButton}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  <AnimatedInput
                    label="Billing Address"
                    value={formData.billingAddress}
                    onChangeText={(val) => setFormData({ ...formData, billingAddress: val })}
                    icon="map-pin"
                    placeholder="Enter complete billing address"
                  />
                  <View style={styles.infoBox}>
                    <Feather name="info" size={18} color="#3B82F6" />
                    <Text style={styles.infoText}>
                      This address will be used for billing and invoicing purposes
                    </Text>
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <AnimatedButton
                    title="Cancel"
                    onPress={() => setModalOpen(null)}
                    variant="secondary"
                    style={styles.modalButton}
                  />
                  <AnimatedButton
                    title="Save Address"
                    onPress={handleBillingUpdate}
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
  )

  // Password Modal
  const renderPasswordModal = () => (
    <Modal visible={modalOpen === "password"} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.backdrop} onPress={() => {
          setModalOpen(null)
          setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" })
        }}>
          <View style={styles.modalContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Change Password</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setModalOpen(null)
                      setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" })
                    }}
                    style={styles.modalCloseButton}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                >
                  <AnimatedInput
                    label="Current Password"
                    value={formData.currentPassword}
                    onChangeText={(val) => setFormData({ ...formData, currentPassword: val })}
                    icon="lock"
                    secureTextEntry
                    placeholder="Enter current password"
                  />
                  <AnimatedInput
                    label="New Password"
                    value={formData.newPassword}
                    onChangeText={(val) => setFormData({ ...formData, newPassword: val })}
                    icon="key"
                    secureTextEntry
                    placeholder="Enter new password"
                  />
                  <AnimatedInput
                    label="Confirm New Password"
                    value={formData.confirmPassword}
                    onChangeText={(val) => setFormData({ ...formData, confirmPassword: val })}
                    icon="check-circle"
                    secureTextEntry
                    placeholder="Confirm new password"
                  />
                  <View style={styles.infoBox}>
                    <Feather name="info" size={18} color="#3B82F6" />
                    <Text style={styles.infoText}>
                      Password must be at least 8 characters with uppercase, lowercase, and numbers.
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <AnimatedButton
                    title="Cancel"
                    onPress={() => {
                      setModalOpen(null)
                      setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" })
                    }}
                    variant="secondary"
                    style={styles.modalButton}
                  />
                  <AnimatedButton
                    title="Update Password"
                    onPress={handlePasswordUpdate}
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
  )

  return (
    <SafeAreaView style={styles.container}>
      {currentScreen === "menu" && renderMenu()}
      {currentScreen === "profile" && renderProfile()}
      {currentScreen === "security" && renderSecurity()}
      {currentScreen === "notifications" && renderNotifications()}
      {currentScreen === "payments" && renderPayments()}
      {currentScreen === "privacy" && renderPrivacy()}
      
      {renderUsernameModal()}
      {renderEmailModal()}
      {renderAddressModal()}
      {renderPhoneModal()}
      {renderPasswordModal()}
      {renderBillingModal()}
    </SafeAreaView>
  )
}