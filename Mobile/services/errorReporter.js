import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';

const ENDPOINT = `${BASE_URL}/api/logs/error`;
const OFFLINE_QUEUE_KEY = 'setgo_error_queue';
const MAX_QUEUE = 20; // don't let the queue grow unbounded

const getDeviceInfo = () => ({
  platform: Platform.OS,
  osVersion: String(Platform.Version),
  appVersion: Constants.expoConfig?.version || 'unknown',
  device: Constants.deviceName || 'unknown',
});

const send = async (payload) => {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Error reporter: HTTP ${res.status}`);
};

/**
 * Report an error to the backend.
 * If offline, queues the report in AsyncStorage and flushes when called again online.
 *
 * @param {Error|string} error
 * @param {{ type?, module?, extra?, userId? }} [context]
 */
export const captureException = async (error, context = {}) => {
  if (__DEV__) return; // only report in production

  const payload = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    type: context.type || 'uncaught',
    module: context.module,
    extra: context.extra,
    userId: context.userId,
    ...getDeviceInfo(),
  };

  // Flush any previously queued errors first
  await flushQueue();

  try {
    await send(payload);
  } catch {
    // Offline or server error — queue for later
    await enqueueOffline(payload);
  }
};

const enqueueOffline = async (payload) => {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push(payload);
    // Keep only the most recent MAX_QUEUE entries
    const trimmed = queue.slice(-MAX_QUEUE);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage failure — silently drop
  }
};

const flushQueue = async () => {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return;
    const queue = JSON.parse(raw);
    if (!queue.length) return;

    const failed = [];
    for (const payload of queue) {
      try {
        await send(payload);
      } catch {
        failed.push(payload);
      }
    }

    if (failed.length) {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failed));
    } else {
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    }
  } catch {
    // Silent
  }
};
