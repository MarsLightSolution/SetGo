import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import az from './locales/az.json';
import ru from './locales/ru.json';

const LANGUAGE_KEY = 'app_language';

/**
 * Custom language detector that reads from AsyncStorage.
 * We use the same key as onboardingStore so language is always in sync.
 */
const asyncStorageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
      callback(lang || 'en');
    } catch {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: () => {},  // onboardingStore handles persistence
};

i18n
  .use(asyncStorageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',       // required for React Native (no Intl.PluralRules)
    resources: {
      en: { translation: en },
      az: { translation: az },
      ru: { translation: ru },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,          // React Native already escapes values
    },
    react: {
      useSuspense: false,          // React Native doesn't support Suspense for i18n
    },
  });

export default i18n;

/**
 * Change the active language.
 * Call this from onboardingStore.completeOnboarding() and onboardingStore.setLanguage().
 */
export function changeLanguage(lang) {
  i18n.changeLanguage(lang);
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'az', label: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];
