import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import your translation files
import translationEN from "../locales/en/translation.json";
import translationAZ from "../locales/az/translation.json";
import translationRU from "../locales/ru/translation.json";

// Translation resource mapping
const resources = {
  en: { translation: translationEN },
  az: { translation: translationAZ },
  ru: { translation: translationRU },
};

// Custom language detector to use AsyncStorage and device locale
const languageDetector = {
  type: "languageDetector",
  async: true,
  detect: async (callback) => {
    try {
      const savedLang = await AsyncStorage.getItem("user-language");
      if (savedLang) {
        callback(savedLang);
      } else {
        const deviceLocale = Localization.locale.split("-")[0]; // e.g., "en"
        callback(deviceLocale);
      }
    } catch (e) {
      callback("en"); // default fallback on error
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng) => {
    try {
      await AsyncStorage.setItem("user-language", lng);
    } catch (e) {
      // ignore
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v3",
    resources,
    fallbackLng: "en",
    debug: false,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      useSuspense: false, // For React Native disable suspense
    },
  });

export default i18n;
