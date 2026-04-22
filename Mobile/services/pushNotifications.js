import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getAuthToken } from './secureAuthService';
import { API_ENDPOINTS } from '../config/api';
import logger from '../utils/logger';

const log = logger.create('PushNotifications');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Requests push permission and registers the Expo push token with the backend.
 * Skipped in Expo Go (SDK 53+) and simulators — requires a dev/production build.
 */
export async function registerPushToken() {
  // Expo Go doesn't support remote push since SDK 53
  if (Constants.appOwnership === 'expo') {
    log.info('Skipping push token registration in Expo Go');
    return null;
  }

  if (!Device.isDevice) return null;

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

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId || projectId === 'your-project-id') {
      log.info('Skipping push token — EAS_PROJECT_ID not set');
      return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const pushToken = tokenData.data;

    const authToken = await getAuthToken();
    if (!authToken) return pushToken;

    await fetch(`${API_ENDPOINTS.NOTIFICATIONS}/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: pushToken, platform: Platform.OS }),
    });

    return pushToken;
  } catch (err) {
    log.error('Failed to register push token:', err);
    return null;
  }
}

/**
 * Subscribe to foreground notifications. Returns the remove() function.
 */
export function onForegroundNotification(handler) {
  const sub = Notifications.addNotificationReceivedListener(handler);
  return () => sub.remove();
}

/**
 * Subscribe to notification tap (background/killed). Returns the remove() function.
 */
export function onNotificationResponse(handler) {
  const sub = Notifications.addNotificationResponseReceivedListener(handler);
  return () => sub.remove();
}
