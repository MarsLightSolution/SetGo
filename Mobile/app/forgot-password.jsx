import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config/api';
import { validateEmail } from '../utils/validation';
import { showErrorToast } from '../utils/toastify';
import logger from '../utils/logger';

/**
 * Forgot password: asks the server to email a reset link. The link opens the website, where
 * the new password is set (valid for 1 hour).
 */
export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const check = validateEmail(email);
    if (!check.isValid) {
      showErrorToast(check.error);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.FORGOT_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // 404 (no such account) gets the same answer as success, so this screen doesn't reveal
      // which emails have accounts.
      if (res.ok || res.status === 404) {
        setSent(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      showErrorToast(
        res.status === 429 ? 'Too many attempts. Please try again later.' : data?.message || 'Could not send the reset link'
      );
    } catch (err) {
      logger.error('Forgot password error:', err);
      showErrorToast('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) + 8 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.back} onPress={() => router.back()} accessibilityLabel={t('auth.backToLogin')}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <Ionicons name={sent ? 'mail-open-outline' : 'key-outline'} size={36} color="#008235" />
        </View>
        <Text style={styles.title}>{t('auth.forgotTitle')}</Text>

        {sent ? (
          <>
            <Text style={styles.subtitle}>{t('auth.forgotSent')}</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={styles.buttonText}>{t('auth.backToLogin')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>{t('auth.forgotSubtitle')}</Text>
            <Text style={styles.label}>{t('auth.emailLabel')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail" size={20} color="#008235" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="send"
                onSubmitEditing={handleSubmit}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>{t('auth.forgotButton')}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  back: { width: 44, height: 44, justifyContent: 'center', marginBottom: 16 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#4B5563', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#111827' },
  button: {
    backgroundColor: '#008235',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
