# 🔧 Fix White Screen Issue - Quick Guide

## Problem
After running `npm run build`, you get a complete white screen.

## Root Causes
1. **CSP Header forcing HTTPS** - The `upgrade-insecure-requests` policy was blocking HTTP connections to your local backend
2. **Production environment variables** - Build was trying to connect to `https://api.tiwari.shop` instead of `http://localhost:8080`
3. **CORS mismatch** - Backend FRONTEND_URL set to wrong port

---

## ✅ Fixes Applied

### Fix 1: Removed CSP for Local Development
**File**: `index.html` (line 48-49)

**Changed:**
```html
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />
```

**To:**
```html
<!-- CSP: Commented out for local development. Enable for production with HTTPS -->
<!-- <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" /> -->
```

### Fix 2: Created `.env.local` for Local Testing
**File**: `.env.local` (NEW)

```env
VITE_SERVER=http://localhost:8080
VITE_FRONTEND=http://localhost:5173
VITE_SOCKET=http://localhost:8080
```

This overrides `.env.production` when building locally.

### Fix 3: Backend CORS Configuration
**File**: `backend/.env` (line 9)

Make sure this matches your frontend:
```env
FRONTEND_URL=http://localhost:5173
```

NOT `http://localhost:3000`!

---

## 🚀 How to Test Now

### Step 1: Start Backend
```bash
cd backend
npm start
```

You should see:
```
✅ Environment validation passed!
Server running on port 8080
```

### Step 2: Build Frontend
```bash
cd Frontend
npm run build
```

### Step 3: Serve the Build Locally
```bash
npx serve -s dist -l 5173
```

### Step 4: Open Browser
Visit: `http://localhost:5173`

You should now see your app!

---

## 🐛 Debugging Tips

### If Still White Screen:

1. **Open Browser Console** (F12)
   - Look for red errors
   - Common issues:
     - CORS errors → Check backend FRONTEND_URL
     - 404 errors → Check if backend is running
     - CSP errors → Make sure CSP line is commented out

2. **Check Network Tab** (F12 → Network)
   - See if API calls are being made
   - Check if they're going to correct URL (localhost:8080)
   - Look for failed requests (red color)

3. **Check Backend CORS**
   ```bash
   # Backend should show this in console when frontend makes request:
   # If you see CORS error, fix backend/.env FRONTEND_URL
   ```

---

## 📝 For Production Deployment

When deploying to production:

### 1. Uncomment CSP Header
**File**: `index.html` (line 49)

```html
<!-- Uncomment this line -->
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />
```

### 2. Update `.env.production`
```env
VITE_SERVER=https://api.tiwari.shop
VITE_FRONTEND=https://tiwari.shop
VITE_SOCKET=https://api.tiwari.shop
```

### 3. Update Backend `.env`
```env
NODE_ENV=production
FRONTEND_URL=https://tiwari.shop
```

### 4. Build for Production
```bash
npm run build
```

The build will use `.env.production` automatically.

---

## 🎯 Quick Checklist

For local development:
- [ ] Backend running on port 8080
- [ ] Backend `.env` has `FRONTEND_URL=http://localhost:5173`
- [ ] Frontend `.env.local` exists with localhost URLs
- [ ] CSP header commented out in `index.html`
- [ ] Build completed: `npm run build`
- [ ] Serving with: `npx serve -s dist -l 5173`

For production:
- [ ] CSP header uncommented in `index.html`
- [ ] `.env.production` has HTTPS URLs
- [ ] Backend has `NODE_ENV=production`
- [ ] Backend has `FRONTEND_URL=https://tiwari.shop`
- [ ] CORS configured for production domain
- [ ] SSL certificates installed

---

## 🆘 Still Having Issues?

### Check these common problems:

1. **Port conflicts**
   ```bash
   # Kill process on port 5173
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```

2. **Cache issues**
   - Clear browser cache (Ctrl+Shift+Delete)
   - Hard reload (Ctrl+F5)
   - Try incognito mode

3. **Build issues**
   ```bash
   # Clean build
   rm -rf dist node_modules
   npm install
   npm run build
   ```

4. **Backend not responding**
   ```bash
   # Test backend directly
   curl http://localhost:8080/api/health
   # Or visit in browser
   ```

---

**You should now have a working frontend!** 🎉
