import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getAuthToken } from './secureAuthService';
import { API_ENDPOINTS, isApiV2 } from '../config/api';
import logger from '../utils/logger';

// Token sent to the server for the current login (removed again at logout).
let lastRegisteredToken = null;

const log = logger.create('PushNotifications');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Detect Expo Go across SDK versions
const isExpoGo = () => Constants.executionEnvironment === 'storeClient';

// expo-notifications is loaded lazily: merely importing it in Expo Go (SDK 53+)
// runs its token auto-registration side effect, which logs a red-box
// "Android Push notifications ... removed from Expo Go" error. Remote push only
// works in a dev/production build anyway, so in Expo Go we never load it.
let notificationsModule;
function getNotifications() {
  if (isExpoGo()) return null;
  if (notificationsModule === undefined) {
    try {
      notificationsModule = require('expo-notifications');
    } catch (_error) {
      log.warn('expo-notifications unavailable in this environment');
      notificationsModule = null;
    }
  }
  return notificationsModule;
}

// Initialize notification handler (skipped in Expo Go)
(() => {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (_error) {
    log.warn('Notification handler unavailable in this environment');
  }
})();

function getProjectId() {
  const id = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  return typeof id === 'string' && UUID_RE.test(id.trim()) ? id.trim() : null;
}

/**
 * Requests push permission and registers the Expo push token with the backend.
 * Skipped in Expo Go (SDK 53+) and simulators — requires a dev/production build.
 */
export async function registerPushToken() {
  const Notifications = getNotifications();
  if (!Notifications) {
    log.info('Skipping push token registration (Expo Go or notifications unavailable)');
    return null;
  }

  if (!Device.isDevice) return null;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      log.info('Push notification permission denied');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const projectId = getProjectId();
    if (!projectId) {
      log.warn('Skipping push token — no valid EAS projectId in app config');
      return null;
    }

    const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });

    const authToken = await getAuthToken();
    if (!authToken) return pushToken;

    try {
      // Lazy require: api.js pulls in authStore; keep this module light at import time.
      const api = require('./api').default;
      await api.post(API_ENDPOINTS.PUSH_TOKEN, { token: pushToken, platform: Platform.OS });
      lastRegisteredToken = pushToken;
    } catch (err) {
      log.warn(`Backend rejected push token (HTTP ${err.response?.status ?? 'network'})`);
    }

    return pushToken;
  } catch (err) {
    // Push is non-essential: warn instead of error so it never red-boxes the app.
    log.warn('Failed to register push token:', err?.message || err);
    return null;
  }
}

/**
 * Unlink this device's push token from the logged-in account. Call at logout, while the
 * access token is still valid: otherwise the next account to log in on this phone would also
 * get the previous account's notifications. Only v2 servers support it; never throws.
 */
export async function unregisterPushToken() {
  if (!lastRegisteredToken || !isApiV2()) return;
  try {
    const api = require('./api').default;
    await api.delete(API_ENDPOINTS.PUSH_TOKEN, { data: { token: lastRegisteredToken }, timeout: 5000 });
  } catch (err) {
    log.warn(`Push token unregister failed (HTTP ${err?.response?.status ?? 'network'})`);
  } finally {
    lastRegisteredToken = null;
  }
}

/**
 * Subscribe to foreground notifications. Returns the remove() function.
 * Skipped in Expo Go (SDK 53+).
 */
export function onForegroundNotification(handler) {
  const Notifications = getNotifications();
  if (!Notifications) return () => {};
  try {
    const sub = Notifications.addNotificationReceivedListener(handler);
    return () => sub.remove();
  } catch (_error) {
    log.warn('Foreground notification listener unavailable');
    return () => {};
  }
}

/**
 * Subscribe to notification tap (background/killed). Returns the remove() function.
 * Skipped in Expo Go (SDK 53+).
 */
export function onNotificationResponse(handler) {
  const Notifications = getNotifications();
  if (!Notifications) return () => {};
  try {
    const sub = Notifications.addNotificationResponseReceivedListener(handler);
    return () => sub.remove();
  } catch (_error) {
    log.warn('Notification response listener unavailable');
    return () => {};
  }
}
