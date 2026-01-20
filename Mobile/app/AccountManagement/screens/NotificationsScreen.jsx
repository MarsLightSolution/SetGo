import React from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native"
import Feather from "@expo/vector-icons/Feather"
import { AnimatedCard, AnimatedToggle } from "../../../Components/ui"
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
 * NotificationsScreen Component
 *
 * Displays notification preferences with toggle switches for newsletter
 * and user messages. Users can enable/disable notification types.
 *
 * @param {Object} props - Component props
 * @param {Object} props.formData - User form data containing notification preferences
 * @param {Object} props.toggleLoading - Loading states for toggle switches
 * @param {Function} props.handleNewsletterToggle - Function to toggle newsletter setting
 * @param {Function} props.handleMessagesToggle - Function to toggle messages setting
 * @param {Function} props.goBack - Function to navigate back to menu
 * @returns {JSX.Element} Notifications screen component
 */
export const NotificationsScreen = ({ formData, toggleLoading, handleNewsletterToggle, handleMessagesToggle, goBack }) => (
  <View style={styles.screen}>
    {renderHeader("Notifications", "Manage preferences", true, goBack)}

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
