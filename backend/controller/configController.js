/**
 * App Config Controller
 *
 * Serves runtime config to the mobile app: the current API base URL, the
 * minimum app version the backend still accepts, and any keys the app
 * needs at runtime. This is the "single place to maintain keys" the
 * backend .env already is — this endpoint just exposes the subset the
 * client is allowed to read, instead of duplicating them into the app's
 * own .env / build-time env vars.
 *
 * Public, unauthenticated (needed before login, on every app launch) —
 * rate-limited at the route level.
 */

const DEFAULT_MIN_VERSION = '1.0.0';

const getAppConfig = (req, res) => {
  res.status(200).json({
    apiUrl: process.env.SERVER_BACKEND || undefined,
    minVersion: process.env.APP_MIN_VERSION || DEFAULT_MIN_VERSION,
    keys: {
      // Only include keys here that the app needs at JS runtime. Keys baked
      // into the native build (e.g. the Maps SDK key in app.config.js) must
      // stay build-time env vars — a native manifest can't be hot-swapped
      // by a server response.
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || null,
    },
  });
};

module.exports = { getAppConfig };
