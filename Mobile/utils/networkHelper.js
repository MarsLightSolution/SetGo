// utils/networkHelper.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from '../config/api';

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
      console.error('Error checking network status:', error);
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
      console.log('🔍 Testing connection to:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/api/products/getProducts?limit=1`, {
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
        console.log('✅ Backend connection successful!');
        console.log(`⏱️ Response time: ${duration}ms`);
        return {
          success: true,
          status: response.status,
          duration,
          message: 'Backend is reachable',
        };
      } else {
        console.log('⚠️ Backend responded with error status:', response.status);
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
      
      console.error('❌ Backend connection failed:', error.message);
      
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
      apiUrl: API_BASE_URL,
      recommendedUrl: NetworkHelper.getRecommendedApiUrl(),
      deviceName: Constants.deviceName,
      osVersion: Platform.Version,
    };
  },

  /**
   * Print comprehensive network diagnostics
   */
  printDiagnostics: async () => {
    console.log('\n🔧 ===== NETWORK DIAGNOSTICS =====');
    
    // Configuration info
    const config = NetworkHelper.getConfigInfo();
    console.log('\n📱 Device Info:');
    console.log('  Platform:', config.platform);
    console.log('  Is Physical Device:', config.isDevice);
    console.log('  Device Name:', config.deviceName);
    console.log('  OS Version:', config.osVersion);
    
    console.log('\n🌐 Network Configuration:');
    console.log('  Current API URL:', config.apiUrl);
    console.log('  Recommended URL:', config.recommendedUrl);
    
    if (config.apiUrl !== config.recommendedUrl) {
      console.log('  ⚠️ WARNING: Current URL may not work for your platform!');
      console.log('  💡 TIP: Update .env file with recommended URL');
    }
    
    // Network status
    console.log('\n📡 Network Status:');
    const networkStatus = await NetworkHelper.checkNetworkStatus();
    console.log('  Connected:', networkStatus.isConnected ? '✅' : '❌');
    console.log('  Connection Type:', networkStatus.type);
    console.log('  Internet Reachable:', networkStatus.isInternetReachable ? '✅' : '❌');
    
    // Backend connection test
    console.log('\n🔌 Backend Connection Test:');
    const testResult = await NetworkHelper.testBackendConnection();
    console.log('  Status:', testResult.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('  HTTP Status:', testResult.status || 'N/A');
    console.log('  Response Time:', `${testResult.duration}ms`);
    console.log('  Message:', testResult.message);
    
    if (!testResult.success) {
      console.log('\n💡 Troubleshooting Tips:');
      console.log('  1. Verify backend server is running');
      console.log('  2. Check if device and server are on same network');
      console.log('  3. Ensure correct IP address in .env file');
      console.log('  4. Try: npx expo start -c (clear cache)');
      if (config.platform === 'android' && !config.isDevice) {
        console.log('  5. For Android emulator, use: http://10.0.2.2:8080');
      }
    }
    
    console.log('\n🔧 ==============================\n');
    
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
