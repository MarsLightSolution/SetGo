import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../Store/authStore';
import { showErrorToast, showSuccessToast } from '../utils/toastify';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [showLogin, setShowLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const toggleForm = (isLogin) => {
    setShowLogin(isLogin);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showErrorToast('Please enter email & password');
      return;
    }

    try {
      const { success, message } = await login(email, password);

      if (success) {
        showSuccessToast(message);
        router.back();
      } else {
        showErrorToast(message);
      }
    } catch (err) {
      showErrorToast('Network error. Please try again');
      console.error('Login error:', err);
    }
  };

  const handleSignup = async () => {
    if (!username || !email || !password) {
      showErrorToast('⚠️ Please fill all fields');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!usernameRegex.test(username)) {
      showErrorToast('🙅 Username must be 3-16 characters (letters, numbers, underscore)');
      return;
    }

    if (!emailRegex.test(email)) {
      showErrorToast('📧 Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      showErrorToast('🔑 Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.status === 200 || res.status === 201) {
        showSuccessToast('🎉 Account created! Please check your email for confirmation.');
        setUsername('');
        setEmail('');
        setPassword('');
        setShowLogin(true);
        router.push({
          pathname: '/confirm',
          params: { email, password },
        });
      } else {
        showErrorToast(data?.error || data?.message || '❌ Signup failed');
      }
    } catch (error) {
      setLoading(false);
      console.error('Signup error:', error);
      showErrorToast('🌐 Network error. Please check your connection.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0A4D2E', '#008235', '#00A843']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="leaf" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.logoText}>SATGO</Text>
          </View>
        </View>

        {/* Card */}
        <View style={styles.cardWrapper}>
          <BlurView intensity={20} tint="light" style={styles.blurContainer}>
            <View style={styles.card}>
              {/* Tabs */}
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, showLogin && styles.tabActive]}
                  onPress={() => toggleForm(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={showLogin ? ['#008235', '#00A843'] : ['transparent', 'transparent']}
                    style={styles.tabGradient}
                  >
                    <Ionicons
                      name="log-in-outline"
                      size={20}
                      color={showLogin ? '#FFFFFF' : '#6B7280'}
                      style={styles.tabIcon}
                    />
                    <Text style={[styles.tabText, showLogin && styles.tabTextActive]}>Login</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tab, !showLogin && styles.tabActive]}
                  onPress={() => toggleForm(false)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={!showLogin ? ['#008235', '#00A843'] : ['transparent', 'transparent']}
                    style={styles.tabGradient}
                  >
                    <Ionicons
                      name="person-add-outline"
                      size={20}
                      color={!showLogin ? '#FFFFFF' : '#6B7280'}
                      style={styles.tabIcon}
                    />
                    <Text style={[styles.tabText, !showLogin && styles.tabTextActive]}>
                      Sign Up
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Form */}
              {showLogin ? (
                <View style={styles.form}>
                  <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>Welcome Back! 👋</Text>
                    <Text style={styles.formSubtitle}>Login to continue your journey</Text>
                  </View>

                  {/* Email */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                      <Ionicons name="mail-outline" size={14} color="#374151" /> Email
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail" size={20} color="#008235" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="yourmail@example.com"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Password */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                      <Ionicons name="lock-closed-outline" size={14} color="#374151" /> Password
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed" size={20} color="#008235" style={styles.inputIcon} />
                      <TextInput
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#008235', '#00A843', '#00C853']}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.buttonText}>Login Now</Text>
                          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <View style={styles.features}>
                      <View style={styles.featureItem}>
                        <View style={styles.featureIconContainer}>
                          <Ionicons name="heart" size={16} color="#008235" />
                        </View>
                        <Text style={styles.featureText}>Save your favorites</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureIconContainer}>
                          <Ionicons name="chatbubbles" size={16} color="#008235" />
                        </View>
                        <Text style={styles.featureText}>Connect with community</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureIconContainer}>
                          <Ionicons name="create" size={16} color="#008235" />
                        </View>
                        <Text style={styles.featureText}>Create & share content</Text>
                      </View>
                    </View>
                </View>
              ) : (
                //SIGNUP FORM
                <View style={styles.form}>
                  <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>Create Account ✨</Text>
                    <Text style={styles.formSubtitle}>Join our growing community</Text>
                  </View>

                  {/* Username */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                      <Ionicons name="person-outline" size={14} color="#374151" /> Username
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person" size={20} color="#008235" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Choose a unique username"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Email */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                      <Ionicons name="mail-outline" size={14} color="#374151" /> Email
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail" size={20} color="#008235" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="yourmail@example.com"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Password */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                      <Ionicons name="lock-closed-outline" size={14} color="#374151" /> Password
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed" size={20} color="#008235" style={styles.inputIcon} />
                      <TextInput
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Create a strong password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSignup}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#008235', '#00A843', '#00C853']}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.buttonText}>Create Account</Text>
                          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                     <Text style={styles.terms}>
                      By signing up, you agree to our{' '}
                      <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                      <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                </View>
              )}
            </View>
          </BlurView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  cardWrapper: { marginTop: 20, paddingHorizontal: 16 },
  blurContainer: { borderRadius: 32, overflow: 'hidden' },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    padding: 20,
    elevation: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  tab: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  tabActive: { elevation: 4 },
  tabGradient: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: { marginRight: 6 },
  tabText: { fontSize: 16, fontWeight: '700', color: '#6B7280' },
  tabTextActive: { color: '#FFFFFF' },
  form: { marginBottom: 8 },
  formHeader: { marginBottom: 20 },
  formTitle: { fontSize: 26, fontWeight: 'bold', marginBottom: 6, color: '#1F2937' },
  formSubtitle: { fontSize: 15, color: '#6B7280' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' },
  inputWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 16, zIndex: 1 },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingLeft: 48,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingLeft: 48,
    paddingRight: 48,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  eyeIcon: { position: 'absolute', right: 16, padding: 4 },
  button: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  features: {
    marginTop: 24,
    gap: 8
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 130, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  terms: {
    marginTop: 16,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#008235',
    fontWeight: '600',
  },
});