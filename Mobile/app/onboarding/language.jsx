import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'az', label: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selected, setSelected] = useState('en');

  // Staggered fade-in for each language card
  const fadeAnims = useRef(LANGUAGES.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(LANGUAGES.map(() => new Animated.Value(24))).current;

  useEffect(() => {
    const animations = LANGUAGES.map((_, i) =>
      Animated.parallel([
        Animated.timing(fadeAnims[i], {
          toValue: 1,
          duration: 400,
          delay: 200 + i * 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnims[i], {
          toValue: 0,
          duration: 400,
          delay: 200 + i * 100,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.parallel(animations).start();
  }, []);

  const handleContinue = () => {
    router.push({ pathname: '/onboarding/slides', params: { language: selected } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>SetGo</Text>
        <Text style={styles.subtitle}>{t('onboarding.chooseLanguage')}</Text>
      </View>

      {/* Language options */}
      <View style={styles.options}>
        {LANGUAGES.map((lang, i) => (
          <Animated.View
            key={lang.code}
            style={{
              opacity: fadeAnims[i],
              transform: [{ translateY: slideAnims[i] }],
            }}
          >
            <TouchableOpacity
              style={[
                styles.option,
                selected === lang.code && styles.optionSelected,
              ]}
              onPress={() => setSelected(lang.code)}
              activeOpacity={0.75}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.label,
                  selected === lang.code && styles.labelSelected,
                ]}
              >
                {lang.label}
              </Text>
              {selected === lang.code ? (
                <Ionicons name="checkmark-circle" size={22} color="#008235" />
              ) : (
                <View style={styles.emptyCheck} />
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Continue button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>{t('common.continue')}</Text>
        <Ionicons name="arrow-forward" size={18} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 44,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  options: {
    gap: 12,
    marginBottom: 44,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionSelected: {
    borderColor: '#008235',
    backgroundColor: '#F0FFF4',
  },
  flag: {
    fontSize: 26,
    marginRight: 14,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  labelSelected: {
    color: '#008235',
    fontWeight: '600',
  },
  emptyCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#008235',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
