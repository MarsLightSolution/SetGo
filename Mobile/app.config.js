/* global __dirname */
// app.config.js — one config for both iOS and Android builds (EAS prebuild generates the native
// projects from this; ios/ and android/ are not committed).
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const googleServicesPath = './google-services.json';
const hasGoogleServicesFile = fs.existsSync(path.resolve(__dirname, googleServicesPath));

// Single source of truth for the EAS project id — used both for push
// notifications (Constants.expoConfig.extra.eas.projectId) and for EAS
// Update (updates.url below). EAS_PROJECT_ID in .env overrides it; the
// fallback is the real id of the @adi_7389/satgo EAS project, so a missing or
// malformed env value can never ship a non-UUID (Expo rejects those with
// "projectId: Invalid uuid").
const DEFAULT_EAS_PROJECT_ID = 'f8005958-a6b6-48b5-a5f6-c956b146eed0';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const envProjectId = (process.env.EAS_PROJECT_ID || '').trim();
if (envProjectId && !UUID_RE.test(envProjectId)) {
  console.warn(`[app.config] EAS_PROJECT_ID "${envProjectId}" is not a UUID; using ${DEFAULT_EAS_PROJECT_ID}`);
}
const easProjectId = UUID_RE.test(envProjectId) ? envProjectId : DEFAULT_EAS_PROJECT_ID;

// Store builds (eas.json "production" profile sets APP_ENV=production; EAS also exposes the
// profile name). Plain-HTTP access to the dev backend on the LAN is only allowed in
// development/preview builds — production talks to the API over HTTPS only.
const IS_PRODUCTION =
  process.env.APP_ENV === 'production' || process.env.EAS_BUILD_PROFILE === 'production';
const DEV_HTTP_HOSTS = ['192.168.1.3', 'localhost', '10.0.2.2' /* Android emulator → host */];

const iosAts = IS_PRODUCTION
  ? { NSAllowsArbitraryLoads: false }
  : {
      NSAllowsArbitraryLoads: false,
      NSAllowsLocalNetworking: true,
      NSExceptionDomains: Object.fromEntries(
        DEV_HTTP_HOSTS.map((h) => [h, { NSExceptionAllowsInsecureHTTPLoads: true, NSIncludesSubdomains: false }])
      ),
    };

export default ({ config }) => {
  return {
    ...config,
    name: process.env.APP_NAME || 'SatGo',
    slug: 'satgo',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',

    updates: {
      fallbackToCacheTimeout: 0,
      url: `https://u.expo.dev/${easProjectId}`,
    },

    // OTA updates only apply to builds sharing this native version — bump it
    // (and do a fresh `eas build`) whenever a change needs new native code.
    // Pure-JS fixes can then ship via `eas update` without a store review.
    runtimeVersion: {
      policy: 'appVersion',
    },

    assetBundlePatterns: ['**/*'],

    // ── iOS ──────────────────────────────────────────────────────────────────
    // buildNumber / versionCode are managed remotely by EAS (eas.json appVersionSource: remote,
    // autoIncrement on production), so they are intentionally not set here.
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.Satgo.app',
      infoPlist: {
        // Camera / photos / location strings come from the expo-image-picker and expo-location
        // plugins below, so they live in one place.
        NSAppTransportSecurity: iosAts,
        // Only standard HTTPS/TLS crypto → exempt; skips the export-compliance question on
        // every TestFlight/App Store upload.
        ITSAppUsesNonExemptEncryption: false,
      },
      requireFullScreen: false,
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      },
      // Apple requires reasons for these "required reason" APIs (React Native core and
      // AsyncStorage/SecureStore use them); missing entries get App Store submissions rejected.
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] },
          { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp', NSPrivacyAccessedAPITypeReasons: ['C617.1'] },
          { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime', NSPrivacyAccessedAPITypeReasons: ['35F9.1'] },
          { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace', NSPrivacyAccessedAPITypeReasons: ['E174.1'] },
        ],
      },
    },

    // ── Android ──────────────────────────────────────────────────────────────
    android: {
      package: 'com.Satgo.app',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      // Camera/photo/location permissions are added by their plugins. Storage permissions are
      // obsolete on Android 13+ (the system photo picker needs none) and Play flags them, so
      // they are blocked even if a library tries to add them.
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
      blockedPermissions: [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.RECORD_AUDIO',
        // "Draw over other apps" is only for the dev menu overlay; Play reviews it as sensitive.
        ...(IS_PRODUCTION ? ['android.permission.SYSTEM_ALERT_WINDOW'] : []),
      ],
      // Required for FCM/Android push. Add Mobile/google-services.json (from Firebase
      // console, Android app package must match `package` above) to enable this.
      ...(hasGoogleServicesFile ? { googleServicesFile: googleServicesPath } : {}),
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        },
      },
    },

    // Web Configuration
    web: {
      bundler: 'metro',
    },

    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            // Google Play requires targeting API 36 (Android 16) for new apps and updates.
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            minSdkVersion: 24,
            // Plain HTTP only for the dev backend on the LAN; production is HTTPS-only.
            usesCleartextTraffic: !IS_PRODUCTION,
          },
          ios: {
            useFrameworks: 'static',
            deploymentTarget: '15.1',
          },
        },
      ],
      'expo-secure-store',
      'expo-router',
      'expo-font',
      'expo-web-browser',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Satgo needs photo library access to select product images',
          cameraPermission: 'Satgo needs camera access to take product photos',
          // Images only — no video recording, so no microphone permission on either platform.
          microphonePermission: false,
        },
      ],
      [
        'expo-location',
        {
          // Foreground only. The plugin also writes the iOS "Always" keys; give them the same
          // specific text (App Review rejects the generic default wording).
          locationWhenInUsePermission: 'Satgo needs your location to show nearby products',
          locationAlwaysAndWhenInUsePermission: 'Satgo needs your location to show nearby products',
          locationAlwaysPermission: 'Satgo needs your location to show nearby products',
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
        },
      ],
      // Only affects dev-client/production native builds, not Expo Go (which can't
      // apply custom native config regardless), so it's safe to keep enabled.
      [
        'expo-notifications',
        {
          color: '#008235',
        },
      ],
    ],

    // Environment variables and extra config
    //
    // Note: there's no `apiUrl` here on purpose — config/api.js is the single
    // source of truth for that (reads EXPO_PUBLIC_API_URL directly), so a
    // second hardcoded fallback here would just drift out of sync with it.
    extra: {
      ...config.extra,
      environment: IS_PRODUCTION ? 'production' : (process.env.APP_ENV || 'development'),

      eas: {
        projectId: easProjectId,
      },
    },
  };
};
