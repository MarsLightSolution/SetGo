import { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

/**
 * SettingCard Component
 *
 * A touchable card for settings items with icon, label, value, and optional chevron/lock.
 * Extracted from app/AccountManagement/Accountsetting.jsx for reusability.
 *
 * @param {string} icon - Feather icon name
 * @param {string} label - Setting label
 * @param {string} value - Setting value to display (optional)
 * @param {function} onPress - Press handler (optional if isStatic)
 * @param {string} iconColor - Icon color
 * @param {string} iconBg - Icon background color
 * @param {boolean} isStatic - Whether card is non-interactive (default: false)
 */
export function SettingCard({
  icon,
  label,
  value,
  onPress,
  iconColor,
  iconBg,
  isStatic = false
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!isStatic) {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!isStatic) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    }
  };

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
  );
}

const styles = StyleSheet.create({
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingCardStatic: {
    opacity: 0.6,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
  },
});
