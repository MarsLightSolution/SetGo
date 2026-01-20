/**
 * Account Settings Constants
 *
 * Constants and configuration for the Account Management feature.
 * Extracted from app/AccountManagement/Accountsetting.jsx for better organization.
 */

/**
 * Menu items for the account settings main screen
 */
export const MENU_ITEMS = [
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
];

/**
 * AsyncStorage keys used for account data persistence
 */
export const STORAGE_KEYS = {
  USER_DATA: "userData",
};
