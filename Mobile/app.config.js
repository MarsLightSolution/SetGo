// app.config.js
import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://51.20.123.49/api',
    },
    android: {
      // allow cleartext HTTP for Android APK (temporary / testing)
      usesCleartextTraffic: true,
      // ensure INTERNET permission included
      permissions: ["INTERNET"]
    },
  };
};
