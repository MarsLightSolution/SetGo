import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../Store/onboardingStore';
import { useAuthStore } from '../../Store/authStore';
import { useTranslation } from 'react-i18next';

export default function GateScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLocalSearchParams();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // If the user completes auth (sign up / log in) and returns to this screen,
  // auto-redirect them to Home.
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated]);

  const handleSignUp = async () => {
    await completeOnboarding(language || 'en');
    router.push('/auth');
  };

  const handleLogIn = async () => {
    await completeOnboarding(language || 'en');
    router.push('/auth');
  };

  const handleGuest = async () => {
    await completeOnboarding(language || 'en');
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D2E" />

      <LinearGradient
        colors={['#0A4D2E', '#008235', '#00A843']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safe}>

        {/* Logo area */}
        <View style={styles.logoArea}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.logoIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="leaf" size={36} color="#ffffff" />
          </LinearGradient>
          <Text style={styles.appName}>SetGo</Text>
          <Text style={styles.tagline}>{t('onboarding.tagline')}</Text>
        </View>

        {/* Action card */}
        <BlurView intensity={20} tint="light" style={styles.blurWrapper}>
          <View style={styles.card}>

            {/* Sign Up */}
            <TouchableOpacity
              style={styles.signupBtn}
              onPress={handleSignUp}
              activeOpacity={0.85}
            >
              <Text style={styles.signupText}>{t('onboarding.signUp')}</Text>
            </TouchableOpacity>

            {/* Log In */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogIn}
              activeOpacity={0.85}
            >
              <Text style={styles.loginText}>{t('onboarding.logIn')}</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.line} />
            </View>

            {/* Guest */}
            <TouchableOpacity onPress={handleGuest} activeOpacity={0.7}>
              <Text style={styles.guestText}>{t('onboarding.continueAsGuest')} →</Text>
              <Text style={styles.guestSub}>{t('onboarding.guestNote')}</Text>
            </TouchableOpacity>

          </View>
        </BlurView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  logoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    width: 84,
    height: 84,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },
  blurWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 28,
    borderRadius: 20,
    gap: 12,
  },
  signupBtn: {
    backgroundColor: '#008235',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signupText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginBtn: {
    borderWidth: 1.5,
    borderColor: '#008235',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginText: {
    color: '#008235',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  guestText: {
    textAlign: 'center',
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  guestSub: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
});
