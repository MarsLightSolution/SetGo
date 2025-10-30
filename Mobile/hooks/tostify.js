import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

// Toast types configuration
const TOAST_TYPES = {
  success: {
    backgroundColor: '#10B981',
    icon: 'check-circle',
    iconColor: '#FFFFFF',
  },
  error: {
    backgroundColor: '#EF4444',
    icon: 'x-circle',
    iconColor: '#FFFFFF',
  },
  info: {
    backgroundColor: '#3B82F6',
    icon: 'info',
    iconColor: '#FFFFFF',
  },
  warning: {
    backgroundColor: '#F59E0B',
    icon: 'alert-triangle',
    iconColor: '#FFFFFF',
  },
};

// Global state to manage toasts
class ToastManager {
  constructor() {
    this.toasts = [];
    this.listeners = [];
    this.nextId = 0;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.toasts));
  }

  show(message, type = 'success', duration = 3000) {
    const id = this.nextId++;
    const toast = { id, message, type, duration };
    this.toasts = [...this.toasts, toast];
    this.notify();
    return id;
  }

  hide(id) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }
}

const toastManager = new ToastManager();

// Individual Toast Component
const Toast = ({ id, message, type, duration, onRemove }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    // Slide in and fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    const timer = setTimeout(() => {
      hideToast();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onRemove(id);
    });
  };

  const toastConfig = TOAST_TYPES[type] || TOAST_TYPES.success;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: toastConfig.backgroundColor,
        },
      ]}
    >
      <View style={styles.toastContent}>
        <View style={styles.toastIconContainer}>
          <Icon name={toastConfig.icon} size={20} color={toastConfig.iconColor} />
        </View>
        <Text style={styles.toastMessage} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Icon name="x" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Toast Container Component
export const ToastifyContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const handleRemove = (id) => {
    toastManager.hide(id);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onRemove={handleRemove}
        />
      ))}
    </View>
  );
};

// Public API functions
export const showSuccessToast = (message, duration = 3000) => {
  return toastManager.show(message, 'success', duration);
};

export const showErrorToast = (message, duration = 3500) => {
  return toastManager.show(message, 'error', duration);
};

export const showInfoToast = (message, duration = 3000) => {
  return toastManager.show(message, 'info', duration);
};

export const showWarningToast = (message, duration = 3000) => {
  return toastManager.show(message, 'warning', duration);
};

export const hideToast = (id) => {
  toastManager.hide(id);
};

// Styles
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  toastContainer: {
    width: width - 32,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  toastIconContainer: {
    marginRight: 12,
  },
  toastMessage: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
  hideToast,
  ToastifyContainer,
};