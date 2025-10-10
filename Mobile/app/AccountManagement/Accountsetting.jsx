"use client"

import { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native"
import Feather from "@expo/vector-icons/Feather"

export default function MobileSettingsApp() {
  const [currentScreen, setCurrentScreen] = useState("menu")

  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showBillingModal, setShowBillingModal] = useState(false)

  const [phoneStep, setPhoneStep] = useState(1)

  const [phoneData, setPhoneData] = useState({
    countryCode: "+91",
    phoneNumber: "",
    otp: "",
  })
  const [emailData, setEmailData] = useState({
    currentEmail: "tiwariraj1202@gmail.com",
    newEmail: "",
    repeatEmail: "",
    password: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [addressData, setAddressData] = useState({
    firstName: "",
    lastName: "",
    addressSuffix: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    location: "",
  })
  const [billingAddress, setBillingAddress] = useState({
    firstName: "",
    lastName: "",
    addressSuffix: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    location: "",
  })

  // toggles for password visibility in RN aren't typical; we'll keep text fields simple/secure
  const [newsletter, setNewsletter] = useState(false)
  const [messages, setMessages] = useState(true)

  const navigateTo = (screen) => setCurrentScreen(screen)
  const goBack = () => setCurrentScreen("menu")

  const renderScreen = () => {
    switch (currentScreen) {
      case "menu":
        return <MenuScreen navigateTo={navigateTo} />
      case "profile":
        return <ProfileScreen goBack={goBack} setShowAddressModal={setShowAddressModal} />
      case "account":
        return (
          <AccountScreen
            goBack={goBack}
            openPhone={() => setShowPhoneModal(true)}
            openEmail={() => setShowEmailModal(true)}
            openPassword={() => setShowPasswordModal(true)}
            openBilling={() => setShowBillingModal(true)}
          />
        )
      case "payments":
        return <PaymentsScreen goBack={goBack} />
      case "data":
        return <DataProtectionScreen goBack={goBack} />
      case "emails":
        return (
          <EmailsScreen
            goBack={goBack}
            newsletter={newsletter}
            setNewsletter={setNewsletter}
            messages={messages}
            setMessages={setMessages}
          />
        )
      case "classified":
        return <ClassifiedAdsScreen goBack={goBack} />
      default:
        return <MenuScreen navigateTo={navigateTo} />
    }
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      {renderScreen()}

      {/* Phone Modal */}
      <Modal transparent visible={showPhoneModal} animationType="slide">
        <ModalBackdrop
          onClose={() => {
            setShowPhoneModal(false)
            setPhoneStep(1)
          }}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{phoneStep === 1 ? "Add Phone Number" : "Verify OTP"}</Text>
              <Pressable
                onPress={() => {
                  setShowPhoneModal(false)
                  setPhoneStep(1)
                }}
                style={styles.modalClose}
              >
                <Feather name="x" size={20} color="#6B7280" />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              {phoneStep === 1 ? (
                <>
                  <Text style={styles.modalDesc}>We'll send you a verification code</Text>
                  <View style={styles.rowGap12}>
                    <TextInput
                      placeholder="+91"
                      value={phoneData.countryCode}
                      onChangeText={(t) => setPhoneData({ ...phoneData, countryCode: t })}
                      style={[styles.input, { width: 100 }]}
                      keyboardType="phone-pad"
                    />
                    <TextInput
                      placeholder="Phone number"
                      value={phoneData.phoneNumber}
                      onChangeText={(t) => setPhoneData({ ...phoneData, phoneNumber: t })}
                      style={[styles.input, { flex: 1 }]}
                      keyboardType="phone-pad"
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.modalDesc}>
                    Code sent to {phoneData.countryCode} {phoneData.phoneNumber}
                  </Text>
                  <TextInput
                    placeholder="Enter 6-digit code"
                    value={phoneData.otp}
                    onChangeText={(t) => setPhoneData({ ...phoneData, otp: t })}
                    style={[styles.input, styles.otpInput]}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
                    <Text style={styles.linkGreen}>Resend code</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            <View style={styles.modalFooter}>
              <SecondaryButton
                title="Cancel"
                onPress={() => {
                  setShowPhoneModal(false)
                  setPhoneStep(1)
                }}
              />
              <PrimaryButton
                title={phoneStep === 1 ? "Send Code" : "Verify"}
                onPress={() => (phoneStep === 1 ? setPhoneStep(2) : setShowPhoneModal(false))}
              />
            </View>
          </View>
        </ModalBackdrop>
      </Modal>

      {/* Email Modal */}
      <Modal transparent visible={showEmailModal} animationType="slide">
        <ModalBackdrop onClose={() => setShowEmailModal(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Email</Text>
              <Pressable onPress={() => setShowEmailModal(false)} style={styles.modalClose}>
                <Feather name="x" size={20} color="#6B7280" />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.infoBanner}>
                <Feather name="shield" size={18} color="#3B82F6" />
                <Text style={styles.infoBannerText}>You'll receive confirmation emails at both addresses</Text>
              </View>

              <LabeledInput
                label="Current email"
                value={emailData.currentEmail}
                onChangeText={() => {}}
                editable={false}
              />
              <LabeledInput
                label="New email"
                placeholder="Enter new email"
                value={emailData.newEmail}
                onChangeText={(t) => setEmailData({ ...emailData, newEmail: t })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <LabeledInput
                label="Confirm email"
                placeholder="Confirm new email"
                value={emailData.repeatEmail}
                onChangeText={(t) => setEmailData({ ...emailData, repeatEmail: t })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <LabeledInput
                label="Password"
                placeholder="Enter password"
                value={emailData.password}
                onChangeText={(t) => setEmailData({ ...emailData, password: t })}
                secureTextEntry
              />
            </View>
            <View style={styles.modalFooter}>
              <SecondaryButton title="Cancel" onPress={() => setShowEmailModal(false)} />
              <PrimaryButton title="Save Changes" onPress={() => setShowEmailModal(false)} />
            </View>
          </View>
        </ModalBackdrop>
      </Modal>

      {/* Password Modal */}
      <Modal transparent visible={showPasswordModal} animationType="slide">
        <ModalBackdrop onClose={() => setShowPasswordModal(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Pressable onPress={() => setShowPasswordModal(false)} style={styles.modalClose}>
                <Feather name="x" size={20} color="#6B7280" />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <LabeledInput
                label="Current password"
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChangeText={(t) => setPasswordData({ ...passwordData, currentPassword: t })}
                secureTextEntry
              />
              <LabeledInput
                label="New password"
                placeholder="Enter new password"
                value={passwordData.newPassword}
                onChangeText={(t) => setPasswordData({ ...passwordData, newPassword: t })}
                secureTextEntry
              />
              <LabeledInput
                label="Confirm password"
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChangeText={(t) => setPasswordData({ ...passwordData, confirmPassword: t })}
                secureTextEntry
              />
            </View>
            <View style={styles.modalFooter}>
              <SecondaryButton title="Cancel" onPress={() => setShowPasswordModal(false)} />
              <PrimaryButton title="Update Password" onPress={() => setShowPasswordModal(false)} />
            </View>
          </View>
        </ModalBackdrop>
      </Modal>

      {/* Address Modal (Delivery) */}
      <Modal transparent visible={showAddressModal} animationType="slide">
        <ModalBackdrop onClose={() => setShowAddressModal(false)}>
          <AddressForm
            title="Edit delivery address"
            addressData={addressData}
            setAddressData={setAddressData}
            onClose={() => setShowAddressModal(false)}
          />
        </ModalBackdrop>
      </Modal>

      {/* Address Modal (Billing) */}
      <Modal transparent visible={showBillingModal} animationType="slide">
        <ModalBackdrop onClose={() => setShowBillingModal(false)}>
          <AddressForm
            title="Edit billing address"
            addressData={billingAddress}
            setAddressData={setBillingAddress}
            onClose={() => setShowBillingModal(false)}
          />
        </ModalBackdrop>
      </Modal>
    </SafeAreaView>
  )
}

/* Screens */

function MenuScreen({ navigateTo }) {
  const menuItems = [
    {
      id: "profile",
      icon: "user",
      label: "Profile information",
      desc: "Manage your personal details",
      color: "#8B5CF6",
      bg: "#F5F3FF",
    },
    {
      id: "account",
      icon: "settings",
      label: "Account settings",
      desc: "Email, password & security",
      color: "#6B7280",
      bg: "#F9FAFB",
    },
    {
      id: "payments",
      icon: "credit-card",
      label: "Payments",
      desc: "Payout accounts & billing",
      color: "#3B82F6",
      bg: "#EFF6FF",
    },
    {
      id: "data",
      icon: "shield",
      label: "Data protection",
      desc: "Privacy & data settings",
      color: "#10B981",
      bg: "#ECFDF5",
    },
    {
      id: "emails",
      icon: "mail",
      label: "Email preferences",
      desc: "Notifications & updates",
      color: "#F59E0B",
      bg: "#FFFBEB",
    },
    {
      id: "classified",
      icon: "heart",
      label: "Classified Ads",
      desc: "About this feature",
      color: "#EF4444",
      bg: "#FEF2F2",
    },
  ]

  return (
    <View style={styles.screen}>
      <View style={styles.headerGreen}>
        <View style={styles.headerRow}>
          <View style={{ width: 40, height: 40 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Manage your preferences</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={() => navigateTo(item.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
              <Feather name={item.icon} size={24} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

function ScreenHeader({ title, subtitle, onBack }) {
  return (
    <View style={styles.screenHeader}>
      <TouchableOpacity onPress={onBack} style={styles.headerBack} activeOpacity={0.7}>
        <Feather name="chevron-left" size={22} color="#111827" />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.screenTitle}>{title}</Text>
        {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  )
}

function ProfileScreen({ goBack, setShowAddressModal }) {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Profile" subtitle="Your personal information" onBack={goBack} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Feather name="user" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Profile name</Text>
          </View>
          <Text style={styles.infoValue}>OscorTech</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Feather name="map-pin" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Delivery address</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.infoValue}>Not set</Text>
            <TouchableOpacity onPress={() => setShowAddressModal(true)} activeOpacity={0.7}>
              <Text style={styles.linkGreen}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

function AccountScreen({ goBack, openPhone, openEmail, openPassword, openBilling }) {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Account" subtitle="Security & authentication" onBack={goBack} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionLabel}>Security</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Feather name="phone" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Phone verification</Text>
          </View>
          <TouchableOpacity onPress={openPhone} activeOpacity={0.7}>
            <Text style={styles.linkGreen}>Add number</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Feather name="mail" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Email address</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.infoValue}>tiwariraj1202@gmail.com</Text>
            <TouchableOpacity onPress={openEmail} activeOpacity={0.7}>
              <Text style={styles.linkGreen}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Feather name="lock" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Password</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.infoValue}>••••••••</Text>
            <TouchableOpacity onPress={openPassword} activeOpacity={0.7}>
              <Text style={styles.linkGreen}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Activity</Text>
        <View style={styles.activityBadge}>
          <Feather name="bell" size={18} color="#10B981" />
          <Text style={styles.activityText}>You have 4 active ads</Text>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Billing</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Feather name="map-pin" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Billing address</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.infoValue}>Not set</Text>
            <TouchableOpacity onPress={openBilling} activeOpacity={0.7}>
              <Text style={styles.linkGreen}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.btnDanger}>
          <Text style={styles.btnDangerText}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

function PaymentsScreen({ goBack }) {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Payments" subtitle="Payment methods" onBack={goBack} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Feather name="credit-card" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Payout account</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.infoValue}>•••• •••• •••• 1234</Text>
            <Text style={styles.linkGreen}>Change</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

function DataProtectionScreen({ goBack }) {
  const items = ["Privacy Settings & Analysis", "Privacy Policy", "Data Protection"]
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Data Protection" subtitle="Privacy settings" onBack={goBack} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {items.map((label, i) => (
          <TouchableOpacity key={i} activeOpacity={0.8} style={styles.linkCard}>
            <Feather name="shield" size={20} color="#10B981" />
            <Text style={styles.linkText}>{label}</Text>
            <Feather name="chevron-right" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

function EmailsScreen({ goBack, newsletter, setNewsletter, messages, setMessages }) {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Email Preferences" subtitle="Manage notifications" onBack={goBack} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.toggleCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Newsletter</Text>
            <Text style={styles.toggleDesc}>Receive updates, tips, and promotions</Text>
          </View>
          <Switch value={newsletter} onValueChange={setNewsletter} />
        </View>

        <View style={styles.toggleCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>User messages</Text>
            <Text style={styles.toggleDesc}>Get notified when users message you</Text>
          </View>
          <Switch value={messages} onValueChange={setMessages} />
        </View>
      </ScrollView>
    </View>
  )
}

function ClassifiedAdsScreen({ goBack }) {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Classified Ads" subtitle="Information" onBack={goBack} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>Learn about classified ads features and how to use them effectively.</Text>
        </View>
      </ScrollView>
    </View>
  )
}

/* Reusable UI */

function ModalBackdrop({ children, onClose }) {
  return (
    <Pressable onPress={onClose} style={styles.backdrop}>
      <Pressable onPress={(e) => e.stopPropagation()} style={{ width: "100%", alignItems: "center" }}>
        <View style={styles.modalWrap}>{children}</View>
      </Pressable>
    </Pressable>
  )
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize,
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={editable}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  )
}

function PrimaryButton({ title, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.btnPrimary}>
      <Text style={styles.btnPrimaryText}>{title}</Text>
    </TouchableOpacity>
  )
}

function SecondaryButton({ title, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.btnSecondary}>
      <Text style={styles.btnSecondaryText}>{title}</Text>
    </TouchableOpacity>
  )
}

function AddressForm({ title, addressData, setAddressData, onClose }) {
  return (
    <View style={styles.modalCard}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Pressable onPress={onClose} style={styles.modalClose}>
          <Feather name="x" size={20} color="#6B7280" />
        </Pressable>
      </View>
      <View style={styles.modalBody}>
        <TextInput
          style={styles.input}
          placeholder="First name *"
          value={addressData.firstName}
          onChangeText={(t) => setAddressData({ ...addressData, firstName: t })}
        />
        <View style={{ height: 12 }} />
        <TextInput
          style={styles.input}
          placeholder="Last name *"
          value={addressData.lastName}
          onChangeText={(t) => setAddressData({ ...addressData, lastName: t })}
        />
        <View style={{ height: 12 }} />
        <TextInput
          style={styles.input}
          placeholder="Address suffix"
          value={addressData.addressSuffix}
          onChangeText={(t) => setAddressData({ ...addressData, addressSuffix: t })}
        />
        <View style={styles.rowGap12}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Street *"
            value={addressData.street}
            onChangeText={(t) => setAddressData({ ...addressData, street: t })}
          />
          <TextInput
            style={[styles.input, { width: 120 }]}
            placeholder="No. *"
            value={addressData.houseNumber}
            onChangeText={(t) => setAddressData({ ...addressData, houseNumber: t })}
          />
        </View>
        <View style={styles.rowGap12}>
          <TextInput
            style={[styles.input, { width: 140 }]}
            placeholder="Postal *"
            value={addressData.postalCode}
            onChangeText={(t) => setAddressData({ ...addressData, postalCode: t })}
            keyboardType="number-pad"
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Location *"
            value={addressData.location}
            onChangeText={(t) => setAddressData({ ...addressData, location: t })}
          />
        </View>
      </View>
      <View style={styles.modalFooter}>
        <SecondaryButton title="Cancel" onPress={onClose} />
        <PrimaryButton title="Save Address" onPress={onClose} />
      </View>
    </View>
  )
}

/* Styles */

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  headerGreen: {
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: "#10B981",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginTop: 2,
  },

  screenHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  screenSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
  },

  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  menuIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  menuDesc: {
    fontSize: 13,
    color: "#9CA3AF",
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  infoCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
    gap: 8,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  linkGreen: {
    color: "#10B981",
    fontSize: 15,
    fontWeight: "600",
  },

  activityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  activityText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#059669",
  },

  btnDanger: {
    backgroundColor: "#FEE2E2",
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    alignItems: "center",
  },
  btnDangerText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "700",
  },

  linkCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
  },

  toggleCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
  infoText: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },

  /* Modal */
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalWrap: {
    width: "100%",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    width: "100%",
    paddingBottom: 8,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: 20,
  },
  modalDesc: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
    flexDirection: "row",
    gap: 12,
  },

  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoBannerText: {
    fontSize: 13,
    color: "#1E40AF",
    flex: 1,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#F9FAFB",
    color: "#9CA3AF",
  },
  rowGap12: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  otpInput: {
    textAlign: "center",
    letterSpacing: 4,
    fontWeight: "600",
  },

  btnSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  btnSecondaryText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "700",
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
})
