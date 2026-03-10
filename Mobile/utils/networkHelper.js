// utils/networkHelper.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import { API_ENDPOINTS, BASE_URL } from '../config/api';
import logger from './logger';

const log = logger.create('Network');

/**
 * Network Helper Utilities
 * Helps diagnose and fix network connectivity issues
 */

export const NetworkHelper = {
  /**
   * Get recommended API URL based on platform and environment
   */
  getRecommendedApiUrl: () => {
    const isSimulator = Constants.isDevice === false;
    
    if (Platform.OS === 'android') {
      if (isSimulator) {
        return 'http://10.0.2.2:8080'; // Android emulator special IP
      }
      return 'http://YOUR_LOCAL_IP:8080'; // Physical Android device
    }
    
    if (Platform.OS === 'ios') {
      if (isSimulator) {
        return 'http://localhost:8080'; // iOS simulator
      }
      return 'http://YOUR_LOCAL_IP:8080'; // Physical iOS device
    }
    
    return 'http://localhost:8080'; // Web fallback
  },

  /**
   * Check current network connection status
   */
  checkNetworkStatus: async () => {
    try {
      const state = await NetInfo.fetch();
      return {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      };
    } catch (error) {
      log.error('Error checking network status:', error);
      return {
        isConnected: false,
        type: 'unknown',
        isInternetReachable: false,
      };
    }
  },

  /**
   * Test connection to backend API
   */
  testBackendConnection: async () => {
    const startTime = Date.now();
    
    try {
      log.info('🔍 Testing connection to:', BASE_URL);

      const response = await fetch(`${API_ENDPOINTS.GET_PRODUCTS}?limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Shorter timeout for connection test
        signal: AbortSignal.timeout(5000),
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response.ok) {
        log.info('✅ Backend connection successful!');
        log.info(`⏱️ Response time: ${duration}ms`);
        return {
          success: true,
          status: response.status,
          duration,
          message: 'Backend is reachable',
        };
      } else {
        log.warn('⚠️ Backend responded with error status:', response.status);
        return {
          success: false,
          status: response.status,
          duration,
          message: `Server returned status ${response.status}`,
        };
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      log.error('❌ Backend connection failed:', error.message);
      
      return {
        success: false,
        status: 0,
        duration,
        message: error.message,
        error: error.name,
      };
    }
  },

  /**
   * Get current configuration info
   */
  getConfigInfo: () => {
    return {
      platform: Platform.OS,
      isDevice: Constants.isDevice,
      isSimulator: Constants.isDevice === false,
      apiUrl: BASE_URL,
      recommendedUrl: NetworkHelper.getRecommendedApiUrl(),
      deviceName: Constants.deviceName,
      osVersion: Platform.Version,
    };
  },

  /**
   * Print comprehensive network diagnostics
   */
  printDiagnostics: async () => {
    log.info('\n🔧 ===== NETWORK DIAGNOSTICS =====');

    // Configuration info
    const config = NetworkHelper.getConfigInfo();
    log.info('\n📱 Device Info:');
    log.info('  Platform:', config.platform);
    log.info('  Is Physical Device:', config.isDevice);
    log.info('  Device Name:', config.deviceName);
    log.info('  OS Version:', config.osVersion);

    log.info('\n🌐 Network Configuration:');
    log.info('  Current API URL:', config.apiUrl);
    log.info('  Recommended URL:', config.recommendedUrl);

    if (config.apiUrl !== config.recommendedUrl) {
      log.warn('  ⚠️ WARNING: Current URL may not work for your platform!');
      log.info('  💡 TIP: Update .env file with recommended URL');
    }

    // Network status
    log.info('\n📡 Network Status:');
    const networkStatus = await NetworkHelper.checkNetworkStatus();
    log.info('  Connected:', networkStatus.isConnected ? '✅' : '❌');
    log.info('  Connection Type:', networkStatus.type);
    log.info('  Internet Reachable:', networkStatus.isInternetReachable ? '✅' : '❌');

    // Backend connection test
    log.info('\n🔌 Backend Connection Test:');
    const testResult = await NetworkHelper.testBackendConnection();
    log.info('  Status:', testResult.success ? '✅ SUCCESS' : '❌ FAILED');
    log.info('  HTTP Status:', testResult.status || 'N/A');
    log.info('  Response Time:', `${testResult.duration}ms`);
    log.info('  Message:', testResult.message);

    if (!testResult.success) {
      log.info('\n💡 Troubleshooting Tips:');
      log.info('  1. Verify backend server is running');
      log.info('  2. Check if device and server are on same network');
      log.info('  3. Ensure correct IP address in .env file');
      log.info('  4. Try: npx expo start -c (clear cache)');
      if (config.platform === 'android' && !config.isDevice) {
        log.info('  5. For Android emulator, use: http://10.0.2.2:8080');
      }
    }

    log.info('\n🔧 ==============================\n');
    
    return {
      config,
      networkStatus,
      testResult,
    };
  },

  /**
   * Display network info banner in app
   */
  getDebugInfo: () => {
    const config = NetworkHelper.getConfigInfo();
    const platform = Platform.OS === 'ios' ? '🍎 iOS' : '🤖 Android';
    const device = config.isDevice ? '📱 Physical' : '💻 Simulator';
    
    return `${platform} ${device}\nAPI: ${config.apiUrl}`;
  },
};

export default NetworkHelper;
