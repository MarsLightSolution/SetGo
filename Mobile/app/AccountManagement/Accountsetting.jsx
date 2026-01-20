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

import { useState } from "react"
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
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Feather from "@expo/vector-icons/Feather"
import {
  AnimatedCard,
  AnimatedButton,
  AnimatedInput,
  AnimatedToggle,
  SettingCard,
  PulseIcon,
} from "../../Components/ui"
import { accountService } from '../../services/accountService';
import { MENU_ITEMS, STORAGE_KEYS } from '../../constants/accountSettings';
import { getUserData, saveUserData } from '../../utils/storage';
import {
  useUserData,
  useBackHandler,
  useProfileUpdate,
  useSecurityUpdate,
  useNotificationSettings,
} from '../../hooks/account';
import {
  MenuScreen,
  ProfileScreen,
  SecurityScreen,
  NotificationsScreen,
  PaymentsScreen,
  PrivacyScreen,
} from './screens';
import {
  UsernameModal,
  EmailModal,
  AddressModal,
  PhoneModal,
  BillingModal,
  PasswordModal,
} from './modals';

// ==================== API CONFIGURATION ====================

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://your-api-url.com/api"

// ==================== EXTRACTED CODE - PHASE 2 ====================
// The following items have been extracted to separate files:
// - STORAGE_KEYS → constants/accountSettings.js
// - getUserData() → utils/storage.js
// - saveUserData() → utils/storage.js
// - apiService → services/accountService.js (exported as 'accountService')
// - MENU_ITEMS → constants/accountSettings.js
//
// Import statements added at top of file.
// All apiService calls have been replaced with accountService calls.
// ================================================================

// Export for use in login component (re-export from utils/storage.js)
export { saveUserData, getUserData }

// ==================== STYLES ====================

export const styles = StyleSheet.create({
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

// NOTE: The following components have been extracted to Components/ui/:
// - AnimatedCard
// - PulseIcon
// - AnimatedButton
// - AnimatedInput
// - SettingCard
// - AnimatedToggle
// These components are now imported from "../../Components/ui" (see imports at top of file)

// ==================== MAIN APP ====================

export default function EnhancedSettingsApp() {
  // ==================== PHASE 3 REFACTOR - Custom Hooks ====================
  // The following state and logic have been extracted to custom hooks:
  // - userData, initialLoading, userAds, formData state → hooks/account/useUserData.js
  // - initializeApp, loadUserAds functions → hooks/account/useUserData.js
  // - BackHandler effect → hooks/account/useBackHandler.js
  // - Profile update handlers → hooks/account/useProfileUpdate.js
  // - Security update handlers (phone, password) → hooks/account/useSecurityUpdate.js
  // - Notification toggles → hooks/account/useNotificationSettings.js
  // =========================================================================

  // Custom hooks for state management
  const {
    userData,
    setUserData,
    userAds,
    setUserAds,
    initialLoading,
    formData,
    setFormData,
    loadUserAds,
  } = useUserData();

  const { loading: profileLoading, updateUsername, updateEmail, updateDeliveryAddress, updateBillingAddress } = useProfileUpdate(userData, setUserData, formData, setFormData);

  const { loading: securityLoading, phoneStep, setPhoneStep, sendOTP, verifyOTP, updatePassword } = useSecurityUpdate(userData, setUserData, formData, setFormData);

  const { toggleLoading, toggleNewsletter, toggleMessages } = useNotificationSettings(userData, setUserData, formData, setFormData);

  // Local component state (not extracted)
  const [currentScreen, setCurrentScreen] = useState("menu")
  const [modalOpen, setModalOpen] = useState(null)
  const [loading, setLoading] = useState(false)
  const [addressStep, setAddressStep] = useState(1) // 1: landing, 2: form
  const [tempUsername, setTempUsername] = useState("")

  // Navigation functions
  const navigateTo = (screen) => setCurrentScreen(screen)
  const goBack = () => setCurrentScreen("menu")

  // Back handler hook
  useBackHandler(currentScreen, goBack)

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

  // Profile - Username Update (uses hook)
  const handleUsernameUpdate = async () => {
    await updateUsername(tempUsername, () => {
      setModalOpen(null)
      setTempUsername("")
    })
  }

  // Profile - Email Update (uses hook)
  const handleEmailUpdate = async () => {
    await updateEmail(() => setModalOpen(null))
  }

  // Profile - Delivery Address Update (uses hook)
  const handleAddressUpdate = async () => {
    await updateDeliveryAddress(() => {
      setModalOpen(null)
      setAddressStep(1)
    })
  }

  // Billing Address Update (uses hook)
  const handleBillingUpdate = async () => {
    await updateBillingAddress(() => setModalOpen(null))
  }

  // Security - Phone Update (uses hook)
  const handleSendOTP = async () => {
    await sendOTP()
  }

  const handleVerifyOTP = async () => {
    await verifyOTP(() => setModalOpen(null))
  }

  // Security - Password Update (uses hook)
  const handlePasswordUpdate = async () => {
    await updatePassword(() => setModalOpen(null))
  }

  // Notifications - Toggle Newsletter (uses hook)
  const handleNewsletterToggle = async (value) => {
    await toggleNewsletter(value)
  }

  // Notifications - Toggle Messages (uses hook)
  const handleMessagesToggle = async (value) => {
    await toggleMessages(value)
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
              await accountService.deleteUser(userData._id)
              
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

  // ==================== PHASE 4 REFACTOR - Screen Components ====================
  // The following render functions have been extracted to separate screen components:
  // - renderHeader → Kept in main file, still used by modals
  // - renderMenu → screens/MenuScreen.jsx
  // - renderProfile → screens/ProfileScreen.jsx
  // - renderSecurity → screens/SecurityScreen.jsx
  // - renderNotifications → screens/NotificationsScreen.jsx
  // - renderPayments → screens/PaymentsScreen.jsx
  // - renderPrivacy → screens/PrivacyScreen.jsx
  // ===============================================================================

  // ==================== PHASE 5 REFACTOR - Modal Components ====================
  // The following modal render functions have been extracted to separate modal components:
  // - renderUsernameModal() → modals/UsernameModal.jsx
  // - renderEmailModal() → modals/EmailModal.jsx
  // - renderAddressModal() → modals/AddressModal.jsx
  // - renderPhoneModal() → modals/PhoneModal.jsx
  // - renderBillingModal() → modals/BillingModal.jsx
  // - renderPasswordModal() → modals/PasswordModal.jsx
  // All modals are now imported from './modals' and used as components in the return statement.
  // ===============================================================================

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {currentScreen === "menu" && (
        <MenuScreen formData={formData} navigateTo={navigateTo} />
      )}
      {currentScreen === "profile" && (
        <ProfileScreen
          formData={formData}
          setModalOpen={setModalOpen}
          setTempUsername={setTempUsername}
          goBack={goBack}
        />
      )}
      {currentScreen === "security" && (
        <SecurityScreen
          formData={formData}
          userAds={userAds}
          setModalOpen={setModalOpen}
          handleDeleteAccount={handleDeleteAccount}
          goBack={goBack}
        />
      )}
      {currentScreen === "notifications" && (
        <NotificationsScreen
          formData={formData}
          toggleLoading={toggleLoading}
          handleNewsletterToggle={handleNewsletterToggle}
          handleMessagesToggle={handleMessagesToggle}
          goBack={goBack}
        />
      )}
      {currentScreen === "payments" && <PaymentsScreen goBack={goBack} />}
      {currentScreen === "privacy" && <PrivacyScreen goBack={goBack} />}

      {/* Modals - Extracted to modals/ for better organization */}
      <UsernameModal
        visible={modalOpen === "username"}
        onClose={() => { setModalOpen(null); setTempUsername(""); }}
        tempUsername={tempUsername}
        setTempUsername={setTempUsername}
        onSave={handleUsernameUpdate}
        loading={profileLoading}
      />

      <EmailModal
        visible={modalOpen === "email"}
        onClose={() => setModalOpen(null)}
        formData={formData}
        setFormData={setFormData}
        onUpdate={handleEmailUpdate}
        loading={profileLoading}
      />

      <AddressModal
        visible={modalOpen === "address"}
        onClose={() => { setModalOpen(null); setAddressStep(1); }}
        formData={formData}
        setFormData={setFormData}
        addressStep={addressStep}
        setAddressStep={setAddressStep}
        onSave={handleAddressUpdate}
        loading={profileLoading}
      />

      <PhoneModal
        visible={modalOpen === "phone"}
        onClose={() => { setModalOpen(null); setPhoneStep(1); }}
        formData={formData}
        setFormData={setFormData}
        phoneStep={phoneStep}
        setPhoneStep={setPhoneStep}
        onSendOTP={handleSendOTP}
        onVerifyOTP={handleVerifyOTP}
        loading={securityLoading}
      />

      <BillingModal
        visible={modalOpen === "billing"}
        onClose={() => setModalOpen(null)}
        formData={formData}
        setFormData={setFormData}
        onUpdate={handleBillingUpdate}
        loading={profileLoading}
      />

      <PasswordModal
        visible={modalOpen === "password"}
        onClose={() => setModalOpen(null)}
        formData={formData}
        setFormData={setFormData}
        onUpdate={handlePasswordUpdate}
        loading={securityLoading}
      />
    </SafeAreaView>
  )
}