import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';

const STORAGE_KEY = 'setgo_remote_config';
const HARDCODED_MIN_VERSION = '1.0.0';

let _cached = null;

/**
 * Returns the API base URL (see config/api.js: env, else LAN in dev / https production API).
 */
export async function getApiBaseUrl() {
  // config/api.js already resolves env → (production-safe) fallback.
  return BASE_URL;
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
    const baseUrl = BASE_URL;
    const res = await fetch(`${baseUrl}/config/app`, { method: 'GET' });
    if (!res.ok) return;
    const data = await res.json();
    const config = {
      apiUrl: data.apiUrl || baseUrl,
      minVersion: data.minVersion || HARDCODED_MIN_VERSION,
      keys: data.keys || {},
      fetchedAt: Date.now(),
    };
    _cached = config;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // silent — app continues with fallback
  }
}

/**
 * Read a runtime key the backend maintains centrally (config/app's `keys`
 * object — see backend/controller/configController.js), instead of baking
 * it into this app's own .env. Only for keys used at JS runtime; anything
 * that configures native code at build time (e.g. the Maps SDK key in
 * app.config.js) can't be fetched this way and stays a build-time env var.
 *
 * Returns `fallback` if the key hasn't been fetched yet or isn't set
 * server-side — callers should always pass one for the first-launch case.
 *
 * @param {string} name - key name, matching a field under `keys` in the
 *   /config/app response (e.g. 'googleMapsApiKey')
 * @param {*} [fallback]
 */
export async function getRemoteKey(name, fallback = null) {
  const stored = await _loadStored();
  const value = stored?.keys?.[name];
  return value !== undefined && value !== null ? value : fallback;
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
