# 🔧 Fix: Expo Router Looking for .tsx Instead of .jsx

## Problem
Expo Router was configured with TypeScript typed routes enabled (`typedRoutes: true`) but your project uses JavaScript files (.jsx, not .tsx).

## Solution Applied

### 1. Updated `app.json`
**Changed:**
- ✅ Removed `experiments.typedRoutes: true`
- ✅ Removed TypeScript configuration
- ✅ Configured for JavaScript project

**Why:** TypeScript typed routes expect `.tsx` files, but your project uses `.jsx` files.

### 2. Created `metro.config.js`
**Added:**
- ✅ Explicit JSX file resolution
- ✅ Proper source extensions order

**Why:** Ensures Metro bundler properly recognizes and processes `.jsx` files.

### 3. Updated `app.config.js`
**Already had:** Correct configuration for environment variables and network settings.

## Files Modified

```
✅ app.json - Removed TypeScript configuration
✅ metro.config.js - NEW file for JSX support
✅ app.config.js - Already correct
```

## How to Fix Your Project

### Option 1: Use the Fixed Files (Recommended)

```bash
# 1. Extract the new Mobile_Fixed.zip
unzip Mobile_Fixed.zip

# 2. Delete old node_modules and cache
rm -rf node_modules
rm -rf .expo

# 3. Reinstall dependencies
npm install

# 4. Clear Metro cache and start
npx expo start -c
```

### Option 2: Manual Fix (If you prefer)

1. **Update `app.json`:**
   ```json
   {
     "expo": {
       "name": "SetGo",
       "slug": "setgo",
       // ... other settings ...
       "plugins": [
         "expo-router",
         "expo-secure-store"
         // ... other plugins
       ],
       "extra": {
         "router": {
           "origin": false
         }
       }
       // ❌ Remove this if present:
       // "experiments": {
       //   "typedRoutes": true
       // }
     }
   }
   ```

2. **Create `metro.config.js`:**
   ```javascript
   const { getDefaultConfig } = require('expo/metro-config');

   const config = getDefaultConfig(__dirname);

   // Ensure JSX files are properly resolved
   config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'wasm', 'svg'];

   module.exports = config;
   ```

3. **Clean and restart:**
   ```bash
   rm -rf node_modules .expo
   npm install
   npx expo start -c
   ```

## Verification Steps

After applying the fix:

1. **Check for errors:**
   ```bash
   npx expo start -c
   ```
   
2. **Should see:**
   ```
   ✅ Metro bundler started successfully
   ✅ Found app/_layout.jsx
   ✅ Found app/index.jsx
   ✅ No TypeScript errors
   ```

3. **Test the app:**
   - Press `a` for Android
   - Press `i` for iOS
   - App should launch without "index.tsx not found" error

## Why This Happened

Your project was created or configured with TypeScript settings, but uses JavaScript files:

| File Type | Extension | Your Project | Expo Expected |
|-----------|-----------|--------------|---------------|
| Layout | `_layout.jsx` | ✅ Using | ❌ Looking for `.tsx` |
| Index | `index.jsx` | ✅ Using | ❌ Looking for `.tsx` |
| Components | `.jsx` | ✅ Using | ❌ Expected `.tsx` |

## TypeScript vs JavaScript

### If you want to use TypeScript (optional):
```bash
# Install TypeScript
npm install --save-dev typescript @types/react

# Rename files
mv app/_layout.jsx app/_layout.tsx
mv app/index.jsx app/index.tsx
# ... rename all .jsx to .tsx

# Enable typed routes in app.json
"experiments": {
  "typedRoutes": true
}
```

### If you want to keep JavaScript (current setup):
✅ Already fixed! Just use the updated files.

## Common Errors Fixed

### Before Fix:
```
❌ Error: Cannot find module 'D:\project\Setgo_Mobile\SetGo\Mobile\app\index.tsx'
❌ Expo Router requires a file at 'app/index.tsx'
```

### After Fix:
```
✅ Found app/index.jsx
✅ Metro bundler running
✅ App launches successfully
```

## Additional Notes

### Metro Bundler
- Metro now explicitly looks for `.jsx` files first
- Source extensions order: `jsx, js, ts, tsx, json, wasm, svg`
- This ensures JavaScript files are prioritized

### App Configuration
- No TypeScript experiments enabled
- Router origin set to false (prevents base path issues)
- All plugins properly configured

### File Structure
```
Mobile/
├── app/
│   ├── _layout.jsx ✅ (Not .tsx)
│   ├── index.jsx ✅ (Not .tsx)
│   ├── auth.jsx ✅
│   └── ... other .jsx files
├── app.json ✅ (No TypeScript config)
├── metro.config.js ✅ (NEW - JSX support)
├── package.json ✅ (Correct entry point)
└── babel.config.js ✅ (Already correct)
```

## Quick Troubleshooting

### Still seeing .tsx errors?
```bash
# 1. Clear all caches
npx expo start -c
rm -rf .expo
rm -rf node_modules/.cache

# 2. Restart metro
npx expo start -c

# 3. Rebuild app
npx expo run:android --clear
# or
npx expo run:ios --clear
```

### Module resolution issues?
```bash
# Clear watchman cache (if on Mac)
watchman watch-del-all

# Clear npm cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

## Success Indicators

You'll know it's fixed when:
- ✅ `npx expo start` shows no TypeScript errors
- ✅ Metro finds `app/index.jsx` successfully
- ✅ App launches on device/simulator
- ✅ No "Cannot find .tsx file" errors
- ✅ All navigation works properly

## Summary

**Problem:** TypeScript configuration looking for `.tsx` files
**Solution:** Disabled TypeScript, configured for JavaScript
**Result:** App now properly recognizes `.jsx` files

Your app is now configured to work with JavaScript files (.jsx) instead of TypeScript files (.tsx)!
