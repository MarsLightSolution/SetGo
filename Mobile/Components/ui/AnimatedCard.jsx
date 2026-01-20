import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * AnimatedCard Component
 *
 * A card wrapper that fades in and slides up when mounted.
 * Extracted from app/AccountManagement/Accountsetting.jsx for reusability.
 *
 * @param {ReactNode} children - Content to display inside the card
 * @param {number} delay - Animation delay in milliseconds (default: 0)
 */
export function AnimatedCard({ children, delay = 0 }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
}
