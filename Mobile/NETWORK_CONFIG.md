# Network Configuration Guide for SetGo Mobile App

## Fixed Issues ✅

### 1. API Configuration
- ✅ Unified API URL configuration across all files
- ✅ Consistent use of `EXPO_PUBLIC_API_URL` environment variable
- ✅ Proper trailing slash handling
- ✅ Added missing API endpoints

### 2. Network Security (Android)
- ✅ Enabled cleartext traffic for all environments
- ✅ Created `network_security_config.xml`
- ✅ Configured specific domain permissions
- ✅ Added network security to build properties

### 3. Network Security (iOS)
- ✅ Added `NSAppTransportSecurity` configuration
- ✅ Enabled arbitrary loads for development
- ✅ Configured exception domains for HTTP

### 4. Routing
- ✅ Added all missing routes to `_layout.jsx`
- ✅ Properly configured Stack screens
- ✅ Fixed tab visibility logic

### 5. API Service
- ✅ Improved axios configuration
- ✅ Added retry logic for failed requests
- ✅ Better error handling and logging
- ✅ Auth token integration

## How to Use

### 1. Update Your Backend URL

Edit the `.env` file and set your backend URL:

```bash
# For local development on physical device
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8080

# For Android emulator (special IP for localhost)
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080

# For iOS simulator
EXPO_PUBLIC_API_URL=http://localhost:8080

# For production server
EXPO_PUBLIC_API_URL=http://51.20.123.49:8080
```

### 2. Find Your Local IP Address

#### On Windows:
```bash
ipconfig
# Look for "IPv4 Address" under your active network connection
```

#### On Mac/Linux:
```bash
ifconfig | grep "inet "
# or
hostname -I
```

### 3. Running the App

```bash
# Clear cache and start fresh
npx expo start -c

# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

### 4. Testing Network Connectivity

The app now includes better error logging. Check the console for:
- API request attempts
- Response status codes
- Network errors
- Retry attempts

## Network Configuration Details

### Android Configuration (`app.config.js`)
```javascript
android: {
  usesCleartextTraffic: true, // Allows HTTP connections
  networkSecurityConfig: './network_security_config.xml'
}
```

### iOS Configuration (`app.config.js`)
```javascript
ios: {
  infoPlist: {
    NSAppTransportSecurity: {
      NSAllowsArbitraryLoads: true,
      NSExceptionDomains: {
        "YOUR_IP": {
          NSExceptionAllowsInsecureHTTPLoads: true
        }
      }
    }
  }
}
```

## API Endpoints Available

All endpoints are now properly configured in `config/api.js`:

- `GET_PRODUCTS` - Get all products
- `GET_NEARBY` - Get nearby products
- `GET_PRIORITY` - Get priority/featured products
- `LOGIN` - User login
- `REGISTER` - User registration
- `PRODUCT_DETAIL(id)` - Get product details
- `USER_PROFILE` - User profile
- `ORDERS` - User orders
- `CHAT` - Chat functionality

## Common Issues and Solutions

### Issue: "Network request failed"
**Solution:** 
1. Check that your backend server is running
2. Verify the IP address in `.env` is correct
3. Ensure your device and server are on the same network
4. Check firewall settings

### Issue: "Unable to resolve host"
**Solution:**
1. For Android emulator, use `10.0.2.2` instead of `localhost`
2. For physical devices, use your computer's local IP
3. Restart the metro bundler: `npx expo start -c`

### Issue: App works on simulator but not on physical device
**Solution:**
1. Update `.env` with your local IP address (not localhost)
2. Ensure device and computer are on same Wi-Fi network
3. Check router doesn't block local network communication

### Issue: iOS simulator not connecting
**Solution:**
1. Use `http://localhost:8080` for iOS simulator
2. Make sure NSAppTransportSecurity is configured
3. Rebuild the app after configuration changes

## Testing Backend Connection

Add this test function to any component:

```javascript
import { API_BASE_URL } from '../config/api';

async function testConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    console.log('Backend connection:', response.ok ? 'SUCCESS ✅' : 'FAILED ❌');
  } catch (error) {
    console.error('Connection error:', error.message);
  }
}
```

## Important Notes

1. **Always restart Expo** after changing `.env` file
2. **Clear cache** when switching between networks: `npx expo start -c`
3. **Use HTTPS in production** - current config is for development only
4. **Update network_security_config.xml** if adding new backend domains
5. **Check logs** - the app now has comprehensive error logging

## Production Deployment

Before deploying to production:

1. Update `.env` with production URL (use HTTPS)
2. Set `usesCleartextTraffic: false` in `app.config.js` for Android
3. Remove or restrict `NSAllowsArbitraryLoads` for iOS
4. Test thoroughly on both platforms
5. Update network security configurations to allow only your production domain

## Need Help?

If you're still facing connection issues:
1. Check the console logs for specific error messages
2. Verify backend is running: `curl http://YOUR_IP:8080/api/health`
3. Try pinging your backend from your device's browser
4. Check if backend CORS is properly configured
