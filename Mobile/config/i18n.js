import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from '../locales/en/translation.json';
import az from '../locales/az/translation.json';
import ru from '../locales/ru/translation.json';

const LANGUAGE_KEY = '@setgo_language';

// Get saved language
const getStoredLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage || 'en';
  } catch (error) {
    console.error('Error loading language:', error);
    return 'en';
  }
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      az: { translation: az },
      ru: { translation: ru },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Load saved language on init
getStoredLanguage().then(language => {
  i18n.changeLanguage(language);
});

export default i18n;