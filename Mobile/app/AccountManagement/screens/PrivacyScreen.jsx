import React from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
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
 * PrivacyScreen Component
 *
 * Displays privacy and data protection settings with informational cards
 * about privacy policy, data protection, and security measures.
 *
 * @param {Object} props - Component props
 * @param {Function} props.goBack - Function to navigate back to menu
 * @returns {JSX.Element} Privacy screen component
 */
export const PrivacyScreen = ({ goBack }) => (
  <View style={styles.screen}>
    {renderHeader("Privacy", "Data protection & privacy", true, goBack)}

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
