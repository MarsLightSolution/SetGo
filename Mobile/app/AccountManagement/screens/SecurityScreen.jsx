import React from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native"
import Feather from "@expo/vector-icons/Feather"
import { AnimatedCard, SettingCard } from "../../../Components/ui"
import { styles } from "../Accountsetting"

/**
 * Renders the header section with title, subtitle, and optional back button
 *
 * @param {string} title - Header title
 * @param {string} subtitle - Header subtitle
 * @param {boolean} showBack - Whether to show back button
 * @param {Function} goBack - Function to call when back button is pressed
 * @returns {JSX.Element} Header component
 */
const renderHeader = (title, subtitle, showBack, goBack) => (
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

/**
 * SecurityScreen Component
 *
 * Displays security and account management options including phone number,
 * password, billing address, and account deletion. Shows active ads count.
 *
 * @param {Object} props - Component props
 * @param {Object} props.formData - User form data containing security information
 * @param {Array} props.userAds - User's active advertisements
 * @param {Function} props.setModalOpen - Function to open modal dialogs
 * @param {Function} props.handleDeleteAccount - Function to handle account deletion
 * @param {Function} props.goBack - Function to navigate back to menu
 * @returns {JSX.Element} Security screen component
 */
export const SecurityScreen = ({ formData, userAds, setModalOpen, handleDeleteAccount, goBack }) => (
  <View style={styles.screen}>
    {renderHeader("Security", "Account security", true, goBack)}

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
