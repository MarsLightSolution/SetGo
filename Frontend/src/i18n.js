// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// --- IMPORTANT: Verify these paths match your actual file structure ---
import enTranslation from './locales/en/translation.json';
import azTranslation from './locales/az/translation.json';
import ruTranslation from './locales/ru/translation.json';
// --- END IMPORTANT ---

const resources = {
  en: {
    translation: enTranslation // The key 'translation' is standard and important
  },
  az: {
    translation: azTranslation
  },
  ru: {
    translation: ruTranslation
  }
};

i18n
  .use(LanguageDetector) // Detect user language from browser
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources, // This object contains your loaded translations
    fallbackLng: 'en', // Default language if detected language is not available
    debug: true, // Set to 'true' during development for helpful console logs from i18next!
                // This will tell you if it's loading resources or why it's falling back.

    interpolation: {
      escapeValue: false // React already escapes by default
    },
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n;