# 🚀 Quick Start Guide - Network Connectivity Fixed

## ✅ What's Been Fixed

1. **API Configuration** - Unified across all files
2. **Android Network Security** - HTTP connections enabled
3. **iOS Network Security** - HTTP connections enabled
4. **All Routes** - Properly defined in routing
5. **Error Handling** - Better logging and retry logic
6. **Network Diagnostics** - Built-in testing utilities

## 🔧 Quick Setup Steps

### Step 1: Update Your Backend URL

Edit `.env` file:

```bash
# For physical device (MOST COMMON):
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8080

# Examples:
# EXPO_PUBLIC_API_URL=http://192.168.1.100:8080
# EXPO_PUBLIC_API_URL=http://10.148.94.234:8080
```

**How to find your IP:**
- Windows: `ipconfig` → Look for IPv4 Address
- Mac/Linux: `ifconfig | grep "inet "` or `hostname -I`

### Step 2: Clear Cache and Restart

```bash
# Clear everything and start fresh
npx expo start -c

# Then in another terminal:
npx expo run:android  # For Android
# or
npx expo run:ios      # For iOS
```

### Step 3: Test Connection (Optional)

Add this to any component to test:

```javascript
import { NetworkHelper } from '../utils/networkHelper';

// Call this when component mounts
useEffect(() => {
  NetworkHelper.printDiagnostics();
}, []);
```

## 📱 Platform-Specific URLs

| Platform | Device Type | Recommended URL |
|----------|-------------|-----------------|
| Android | Emulator | `http://10.0.2.2:8080` |
| Android | Physical | `http://YOUR_LOCAL_IP:8080` |
| iOS | Simulator | `http://localhost:8080` |
| iOS | Physical | `http://YOUR_LOCAL_IP:8080` |

## 🐛 Common Issues & Solutions

### Issue: "Network request failed"

**Quick Fix:**
```bash
# 1. Check backend is running
curl http://YOUR_IP:8080/api/products/getProducts

# 2. Clear cache and restart
npx expo start -c

# 3. Verify .env file has correct IP
```

### Issue: Works on simulator but not on device

**Quick Fix:**
```bash
# Update .env with your local IP (not localhost)
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:8080

# Restart
npx expo start -c
```

### Issue: Android emulator can't connect

**Quick Fix:**
```bash
# Use special emulator IP in .env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080

# Restart
npx expo start -c
```

### Issue: "Unable to resolve host"

**Quick Fix:**
1. ✅ Ensure device and computer on same Wi-Fi
2. ✅ Check firewall isn't blocking port 8080
3. ✅ Verify backend server is running
4. ✅ Try pinging: `curl http://YOUR_IP:8080`

## 🧪 Test Your Setup

### Quick Terminal Test:

```bash
# Test if backend is reachable from terminal
curl http://YOUR_IP:8080/api/products/getProducts

# Should return JSON with products
```

### In-App Test:

Add to `app/index.jsx` or any component:

```javascript
import { useEffect } from 'react';
import { NetworkHelper } from '../utils/networkHelper';
import { API_BASE_URL } from '../config/api';

export default function HomeScreen() {
  useEffect(() => {
    // Quick connection test
    testConnection();
  }, []);

  const testConnection = async () => {
    console.log('Testing connection to:', API_BASE_URL);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/getProducts?limit=1`);
      if (response.ok) {
        console.log('✅ Backend connected successfully!');
      } else {
        console.log('❌ Backend responded with error:', response.status);
      }
    } catch (error) {
      console.log('❌ Connection failed:', error.message);
    }
  };

  // ... rest of your component
}
```

## 📝 Files Modified

All these files have been updated/created:

- ✅ `config/api.js` - API endpoints configuration
- ✅ `services/api.js` - Axios instance with retry logic
- ✅ `app.config.js` - Android & iOS network security
- ✅ `network_security_config.xml` - Android HTTP config (NEW)
- ✅ `app/_layout.jsx` - All routes properly defined
- ✅ `.env` - Environment variables
- ✅ `utils/networkHelper.js` - Network diagnostics (NEW)
- ✅ `NETWORK_CONFIG.md` - Detailed documentation (NEW)

## 🎯 Next Steps

1. **Update `.env`** with your backend IP
2. **Clear cache**: `npx expo start -c`
3. **Run app**: `npx expo run:android` or `npx expo run:ios`
4. **Check logs** for connection status
5. **Test a few API calls** (products, login, etc.)

## 💡 Pro Tips

1. **Always restart after .env changes** - Expo needs restart to pick up new values
2. **Use network diagnostics** - `NetworkHelper.printDiagnostics()` to debug
3. **Check backend CORS** - Make sure backend allows your mobile app origin
4. **Same network** - Ensure device and server on same Wi-Fi
5. **Firewall** - Check if firewall blocks port 8080

## 📞 Still Having Issues?

Run full diagnostics:

```javascript
import { NetworkHelper } from '../utils/networkHelper';

// In your component
useEffect(() => {
  NetworkHelper.printDiagnostics();
}, []);
```

Check console output for:
- Current platform info
- Network connection status
- API URL configuration
- Backend connection test results
- Specific error messages

## 🎉 You're All Set!

Your app should now be able to connect to the backend on both Android and iOS. The network configuration is properly set up for development use.

For production deployment, remember to:
- Switch to HTTPS
- Update security configurations
- Remove arbitrary load permissions
- Test thoroughly

Good luck! 🚀
