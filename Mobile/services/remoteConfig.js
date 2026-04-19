import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'setgo_remote_config';
const HARDCODED_API_URL = 'https://tiwari.shop/api';
const HARDCODED_MIN_VERSION = '1.0.0';

let _cached = null;

/**
 * Returns the API base URL using a 3-level fallback:
 *   1. EXPO_PUBLIC_API_URL from build-time env
 *   2. Last-known URL stored in AsyncStorage (set by a successful remote fetch)
 *   3. Hardcoded production URL
 */
export async function getApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');

  const stored = await _loadStored();
  if (stored?.apiUrl) return stored.apiUrl;

  return HARDCODED_API_URL;
}

/**
 * Returns the minimum required app version string, e.g. "1.2.0".
 * Source priority: remote config cached in AsyncStorage → hardcoded fallback.
 */
export async function getMinRequiredVersion() {
  const stored = await _loadStored();
  return stored?.minVersion || HARDCODED_MIN_VERSION;
}

/**
 * Fetches remote config from the backend and caches it locally.
 * Call this once at app startup (non-blocking — failures are silent).
 */
export async function fetchAndCacheRemoteConfig() {
  try {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || HARDCODED_API_URL;
    const res = await fetch(`${baseUrl}/config/app`, { method: 'GET' });
    if (!res.ok) return;
    const data = await res.json();
    const config = {
      apiUrl: data.apiUrl || baseUrl,
      minVersion: data.minVersion || HARDCODED_MIN_VERSION,
      fetchedAt: Date.now(),
    };
    _cached = config;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // silent — app continues with fallback
  }
}

async function _loadStored() {
  if (_cached) return _cached;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      _cached = JSON.parse(raw);
      return _cached;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}
