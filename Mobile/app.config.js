// app.config.js
import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    name: "SetGo",
    slug: "setgo",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",

    // splash: {
    //   resizeMode: "contain",
    //   backgroundColor: "#ffffff"
    // },

    updates: {
      fallbackToCacheTimeout: 0
    },

    assetBundlePatterns: ["**/*"],

    // iOS Configuration
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.setgo.app",
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription: "SetGo needs camera access to take product photos",
        NSPhotoLibraryUsageDescription: "SetGo needs photo library access to select product images",
        NSLocationWhenInUseUsageDescription: "SetGo needs your location to show nearby products",
        NSPhotoLibraryAddUsageDescription: "SetGo needs permission to save photos to your library"
      },
      requireFullScreen: false
    },

    // Android Configuration
    android: {
      package: "com.setgo.app",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ],
      usesCleartextTraffic: process.env.NODE_ENV !== 'production'
    },

    // Web Configuration
    web: {
      bundler: "metro"
    },

    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 24  // ✅ Changed from 23 to 24
          },
          ios: {
            useFrameworks: "static",
            deploymentTarget: "15.1"
          }
        }
      ],
      "expo-secure-store",
      "expo-router"
    ],

    // Environment variables and extra config
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://51.20.123.49/',
      environment: process.env.NODE_ENV || 'development',

      eas: {
        projectId: process.env.EAS_PROJECT_ID || "your-project-id"
      }
    }
  };
};