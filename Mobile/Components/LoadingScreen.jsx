import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';

/**
 * Reusable Loading Screen Component
 * Provides consistent loading UI across the app
 */
const LoadingScreen = ({
  message = '',
  size = 'large',
  color = '#16a34a',
  fullScreen = true,
  transparent = false,
}) => {
  const containerStyle = [
    styles.container,
    fullScreen && styles.fullScreen,
    transparent && styles.transparent,
  ];

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

/**
 * Inline loading indicator for buttons and small areas
 */
export const InlineLoader = ({ color = '#ffffff', size = 'small' }) => (
  <ActivityIndicator size={size} color={color} />
);

/**
 * Overlay loading indicator
 */
export const LoadingOverlay = ({ message = 'Loading...' }) => (
  <View style={styles.overlay}>
    <View style={styles.overlayContent}>
      <ActivityIndicator size="large" color="#16a34a" />
      <Text style={styles.overlayMessage}>{message}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 150,
  },
  overlayMessage: {
    marginTop: 12,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});

export default LoadingScreen;
