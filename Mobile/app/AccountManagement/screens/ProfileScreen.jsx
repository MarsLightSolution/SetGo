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
 * ProfileScreen Component
 *
 * Displays user profile information including personal details and delivery address.
 * Allows users to update username, email, and delivery address.
 *
 * @param {Object} props - Component props
 * @param {Object} props.formData - User form data containing profile information
 * @param {Function} props.setModalOpen - Function to open modal dialogs
 * @param {Function} props.setTempUsername - Function to set temporary username for editing
 * @param {Function} props.goBack - Function to navigate back to menu
 * @returns {JSX.Element} Profile screen component
 */
export const ProfileScreen = ({ formData, setModalOpen, setTempUsername, goBack }) => (
  <View style={styles.screen}>
    {renderHeader("Profile", "Manage your information", true, goBack)}

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
