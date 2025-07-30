import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import your translation files
import translationEN from './locales/en/translation.json';
import translationAZ from './locales/az/translation.json';
import translationRU from './locales/ru/translation.json';

// the translations
const resources = {
  en: {
    translation: translationEN
  },
  az: {
    translation: translationAZ
  },
  ru: {
    translation: translationRU
  }
};

i18n
  .use(LanguageDetector) // Detect user language (optional but recommended)
  .use(initReactI18next) // Passes i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Fallback language if user's language is not available
    debug: false, // Set to true for debugging in development

    interpolation: {
      escapeValue: false // React already escapes by default
    },
    // Options for LanguageDetector
    detection: {
      order: ['localStorage', 'navigator'], // Try to detect from localStorage first, then browser language
      caches: ['localStorage'], // Cache user language preference in localStorage
    }
  });

export default i18n;