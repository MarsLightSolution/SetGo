// app.config.js
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const googleServicesPath = './google-services.json';
const hasGoogleServicesFile = fs.existsSync(path.resolve(__dirname, googleServicesPath));

// Single source of truth for the EAS project id — used both for push
// notifications (Constants.expoConfig.extra.eas.projectId) and for EAS
// Update (updates.url below). Set EAS_PROJECT_ID in .env.
const easProjectId = process.env.EAS_PROJECT_ID || 'your-project-id';

export default ({ config }) => {
  return {
    ...config,
    name: process.env.APP_NAME || 'SatGo',
    slug: 'satgo',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',

    // splash: {
    //   resizeMode: "contain",
    //   backgroundColor: "#ffffff"
    // },

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

    // iOS Configuration
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.Satgo.app',
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: 'Satgo needs camera access to take product photos',
        NSPhotoLibraryUsageDescription: 'Satgo needs photo library access to select product images',
        NSLocationWhenInUseUsageDescription: 'Satgo needs your location to show nearby products',
        NSPhotoLibraryAddUsageDescription: 'Satgo needs permission to save photos to your library',
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSExceptionDomains: {
            '192.168.1.3': {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSIncludesSubdomains: false,
            },
            ...(process.env.NODE_ENV !== 'production' ? {
              localhost: { NSExceptionAllowsInsecureHTTPLoads: true, NSIncludesSubdomains: true },
              '192.168.1.3': { NSExceptionAllowsInsecureHTTPLoads: true, NSIncludesSubdomains: false },
            } : {}),
          },
        },
      },
      requireFullScreen: false,
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      },
    },

    // Android Configuration
    android: {
      package: 'com.Satgo.app',
      versionCode: 1,
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'INTERNET',
        'ACCESS_NETWORK_STATE',
      ],
      // Always allow cleartext traffic (HTTP) for development and production
      usesCleartextTraffic: true,
      // Network security configuration
      networkSecurityConfig: './network_security_config.xml',
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
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 24,
            // Allow cleartext traffic in build properties
            usesCleartextTraffic: true,
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
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://10.219.164.234:8080',
      environment: process.env.NODE_ENV || 'development',

      eas: {
        projectId: easProjectId,
      },
    },
  };
};
