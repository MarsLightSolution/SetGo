import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage } from '../i18n';

const ONBOARDING_KEY = 'hasSeenOnboarding';
const LANGUAGE_KEY = 'app_language';

export const useOnboardingStore = create((set) => ({
  // null = not checked yet | false = first-time user | true = returning user
  hasSeenOnboarding: null,
  language: 'en',

  /**
   * Run once on app startup alongside checkAuth().
   * Reads both flags from AsyncStorage in parallel.
   */
  initialize: async () => {
    const [seen, lang] = await Promise.all([
      AsyncStorage.getItem(ONBOARDING_KEY),
      AsyncStorage.getItem(LANGUAGE_KEY),
    ]);
    const resolvedLang = lang || 'en';
    changeLanguage(resolvedLang);
    set({
      hasSeenOnboarding: seen === 'true',
      language: resolvedLang,
    });
  },

  /**
   * Called when user exits onboarding (sign up, log in, or guest).
   * After this, hasSeenOnboarding is always true — onboarding never shows again.
   */
  completeOnboarding: async (language = 'en') => {
    await Promise.all([
      AsyncStorage.setItem(ONBOARDING_KEY, 'true'),
      AsyncStorage.setItem(LANGUAGE_KEY, language),
    ]);
    changeLanguage(language);
    set({ hasSeenOnboarding: true, language });
  },

  /**
   * Update language only — used from Account Settings later.
   */
  setLanguage: async (lang) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    changeLanguage(lang);
    set({ language: lang });
  },
}));
