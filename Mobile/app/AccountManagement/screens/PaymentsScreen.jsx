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
 * PaymentsScreen Component
 *
 * Displays payment and billing information with informational cards.
 * Payment methods and billing address updates require admin access.
 *
 * @param {Object} props - Component props
 * @param {Function} props.goBack - Function to navigate back to menu
 * @returns {JSX.Element} Payments screen component
 */
export const PaymentsScreen = ({ goBack }) => (
  <View style={styles.screen}>
    {renderHeader("Payments", "Billing & payment methods", true, goBack)}

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
