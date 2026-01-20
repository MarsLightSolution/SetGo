/**
 * useBackHandler Hook
 *
 * Handles Android hardware back button for navigation.
 * Extracted from app/AccountManagement/Accountsetting.jsx.
 */

import { useEffect } from 'react';
import { BackHandler } from 'react-native';

/**
 * Custom hook for handling Android back button
 *
 * @param {string} currentScreen - Current screen identifier
 * @param {Function} goBack - Navigation callback to go back
 */
export const useBackHandler = (currentScreen, goBack) => {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentScreen !== 'menu') {
        goBack();
        return true; // Prevent default behavior
      }
      return false; // Allow default behavior (exit app)
    });

    return () => backHandler.remove();
  }, [currentScreen, goBack]);
};
