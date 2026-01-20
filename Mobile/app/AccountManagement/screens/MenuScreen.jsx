import React from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native"
import Feather from "@expo/vector-icons/Feather"
import { AnimatedCard, PulseIcon } from "../../../Components/ui"
import { MENU_ITEMS } from "../../../constants/accountSettings"
import { styles } from "../Accountsetting"

/**
 * MenuScreen Component
 *
 * Main menu screen that displays the user profile and navigation options
 * to all settings sections.
 *
 * @param {Object} props - Component props
 * @param {Object} props.formData - User form data containing username and email
 * @param {Function} props.navigateTo - Function to navigate to different screens
 * @returns {JSX.Element} Menu screen component
 */
export const MenuScreen = ({ formData, navigateTo }) => (
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
