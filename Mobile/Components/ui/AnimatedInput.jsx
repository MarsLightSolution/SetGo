import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

/**
 * AnimatedInput Component
 *
 * An input field with animated border on focus, optional icon, password toggle, and error display.
 * Extracted from app/AccountManagement/Accountsetting.jsx for reusability.
 *
 * @param {string} label - Input label
 * @param {string} value - Input value
 * @param {function} onChangeText - Change handler
 * @param {string} icon - Feather icon name (optional)
 * @param {boolean} secureTextEntry - Password field (optional)
 * @param {string} error - Error message (optional)
 * @param {string} placeholder - Placeholder text (optional)
 * @param {boolean} editable - Whether input is editable (default: true)
 */
export function AnimatedInput({
  label,
  value,
  onChangeText,
  icon,
  secureTextEntry,
  error,
  placeholder,
  editable = true
}) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: error ? ["#FCA5A5", "#EF4444"] : ["#E5E7EB", "#10B981"],
  });

  return (
    <View style={styles.inputGroup}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor },
          !editable && styles.inputDisabled
        ]}
      >
        {icon && (
          <Feather
            name={icon}
            size={20}
            color={focused ? "#10B981" : "#9CA3AF"}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !showPassword}
          placeholder={placeholder}
          placeholderTextColor="#D1D5DB"
          editable={editable}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Feather
              name={showPassword ? "eye" : "eye-off"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
  },
});
