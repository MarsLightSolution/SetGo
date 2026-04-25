// app.config.js
import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    name: 'SetGo',
    slug: 'setgo',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',

    // splash: {
    //   resizeMode: "contain",
    //   backgroundColor: "#ffffff"
    // },

    updates: {
      fallbackToCacheTimeout: 0,
    },

    assetBundlePatterns: ['**/*'],

    // iOS Configuration
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.setgo.app',
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: 'SetGo needs camera access to take product photos',
        NSPhotoLibraryUsageDescription: 'SetGo needs photo library access to select product images',
        NSLocationWhenInUseUsageDescription: 'SetGo needs your location to show nearby products',
        NSPhotoLibraryAddUsageDescription: 'SetGo needs permission to save photos to your library',
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
      package: 'com.setgo.app',
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
      // NOTE: expo-notifications plugin removed — not compatible with Expo Go SDK 53+
      // For development builds or production EAS builds, configure separately
    ],

    // Environment variables and extra config
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://10.219.164.234:8080',
      environment: process.env.NODE_ENV || 'development',

      eas: {
        projectId: process.env.EAS_PROJECT_ID || 'your-project-id',
      },
    },
  };
};
