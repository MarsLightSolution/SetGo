import { useRef } from 'react';
import { Animated, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * AnimatedButton Component
 *
 * A button with spring animation on press.
 * Extracted from app/AccountManagement/Accountsetting.jsx for reusability.
 *
 * @param {string} title - Button text
 * @param {function} onPress - Press handler
 * @param {boolean} loading - Show loading indicator
 * @param {string} variant - Button style variant: "primary" | "secondary" (default: "primary")
 * @param {object} style - Additional styles
 */
export function AnimatedButton({ title, onPress, loading, variant = "primary", style }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
        style={[
          styles.button,
          variant === "primary" ? styles.buttonPrimary : styles.buttonSecondary,
          loading && styles.buttonDisabled,
          style,
        ]}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color={variant === "primary" ? "#fff" : "#10B981"} />
        ) : (
          <Text style={[
            styles.buttonText,
            variant === "primary" ? styles.buttonTextPrimary : styles.buttonTextSecondary
          ]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonPrimary: {
    backgroundColor: '#10B981',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#fff',
  },
  buttonTextSecondary: {
    color: '#10B981',
  },
});
