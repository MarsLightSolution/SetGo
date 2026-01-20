import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * PulseIcon Component
 *
 * A pulsing animated icon/dot indicator.
 * Extracted from app/AccountManagement/Accountsetting.jsx for reusability.
 *
 * @param {number} size - Base size multiplier (default: 6, actual size = size * 4)
 * @param {string} color - Background color (default: "#10B981")
 */
export function PulseIcon({ size = 6, color = "#10B981" }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: size * 4,
        height: size * 4,
        borderRadius: size * 2,
        backgroundColor: color,
        transform: [{ scale: pulseAnim }],
      }}
    />
  );
}
