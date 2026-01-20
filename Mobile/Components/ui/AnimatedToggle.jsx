import { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * AnimatedToggle Component
 *
 * A custom toggle switch with smooth animation and loading state.
 * Extracted from app/AccountManagement/Accountsetting.jsx for reusability.
 *
 * @param {boolean} value - Toggle state
 * @param {function} onValueChange - Change handler
 * @param {boolean} loading - Show loading indicator (optional)
 */
export function AnimatedToggle({ value, onValueChange, loading }) {
  const translateAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(translateAnim, {
      toValue: value ? 1 : 0,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [value]);

  const thumbTranslate = translateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26],
  });

  if (loading) {
    return <ActivityIndicator color="#10B981" size="small" />;
  }

  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      style={[styles.toggleTrack, value && styles.toggleTrackActive]}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.toggleThumb,
          {
            transform: [{ translateX: thumbTranslate }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggleTrack: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    padding: 2,
  },
  toggleTrackActive: {
    backgroundColor: '#10B981',
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
