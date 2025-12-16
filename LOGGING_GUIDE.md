# Logging Guide - SetGo Application

## Overview

This document describes the logging infrastructure across all three services in the SetGo application:
- **Backend** (Node.js/Express API)
- **Frontend** (React/Vite application)
- **Payment Microservice** (Node.js microservice)

All services use proper logging to track errors, debug issues, and monitor application health in production.

---

## 📁 Log File Locations

### Backend
- `backend/logs/app.log` - All logs (info, warn, error, debug)
- `backend/logs/error.log` - Error logs only

### Frontend
- `Frontend/logs/` - (Future: for server-side rendered logs)
- Browser LocalStorage: `app_logs` key (stores last 100 logs)

### Payment Microservice
- `payment-microservice/logs/combined.log` - All logs
- `payment-microservice/logs/error.log` - Error logs only

**Note:** All `logs/` directories and `*.log` files are included in `.gitignore` and will NOT be committed to Git.

---

## 🛠️ Logger Usage

### Backend Logger

The backend uses **Winston** for logging.

```javascript
const logger = require('./utils/logger');

// Info logging
logger.info('User logged in successfully');

// Error logging
logger.error('Database connection failed', error);

// Warning logging
logger.warn('API rate limit approaching');

// Debug logging (development only)
logger.debug('Processing request data', { userId, requestId });

// HTTP logging
logger.http(`${req.method} ${req.url} - ${res.statusCode}`);
```

**Log Levels:**
- `error` (0) - Critical errors that need immediate attention
- `warn` (1) - Warning messages for potential issues
- `info` (2) - General informational messages
- `http` (3) - HTTP request/response logging
- `debug` (4) - Detailed debugging information (development only)

---

### Frontend Logger

The frontend uses a custom logger utility.

```javascript
import logger from './utils/logger';

// Info logging
logger.info('Component mounted');

// Error logging
logger.error('Failed to fetch data', error, { userId, page });

// Warning logging
logger.warn('Session about to expire');

// Debug logging (development only)
logger.debug('State updated', { newState });

// API error logging (includes endpoint and response details)
logger.apiError('/api/users', error, { userId: 123 });

// Utility methods
logger.getLogs(); // Get all stored logs
logger.clearLogs(); // Clear localStorage logs
logger.downloadLogs(); // Download logs as JSON file
```

**Features:**
- ✅ Console logging in development mode
- ✅ LocalStorage persistence (last 100 logs)
- ✅ Sends critical errors to backend in production
- ✅ Global error and unhandled rejection handlers
- ✅ API error tracking with full context

---

### Payment Microservice Logger

The payment microservice also uses **Winston**.

```javascript
const logger = require('./utils/logger');

// Info logging
logger.info('Payment processed successfully', { transactionId, amount });

// Error logging
logger.error('Payment gateway connection failed', { error: err.message });

// Warning logging
logger.warn('High transaction volume detected');

// Debug logging
logger.debug('Request payload', { payload });
```

**Features:**
- ✅ Colored console output for development
- ✅ JSON-formatted logs for production parsing
- ✅ Automatic log rotation (10MB max per file)
- ✅ Keeps last 5 error logs and 10 combined logs
- ✅ Service metadata included in all logs

---

## 🔄 Replacing console.log/console.error

### ❌ OLD WAY (Don't use in production)

```javascript
console.log('User data:', userData);
console.error('Error occurred:', error);
console.warn('Warning message');
alert('Operation failed!');
```

### ✅ NEW WAY (Production-ready)

**Backend:**
```javascript
logger.info('User data retrieved', { userData });
logger.error('Operation failed', error);
logger.warn('Warning message');
```

**Frontend:**
```javascript
import logger from './utils/logger';
import { toast } from 'react-hot-toast';

// Replace console.log
logger.info('User data retrieved', { userData });

// Replace console.error
logger.error('Operation failed', error);

// Replace alert() with toast
toast.error('Operation failed');
toast.success('Operation completed');
toast.info('Please check your email');
```

---

## 📊 Log Rotation

### Backend & Payment Microservice

Winston automatically rotates logs when they exceed size limits:
- **Error logs:** Max 10MB per file, keeps last 5 files
- **Combined logs:** Max 10MB per file, keeps last 10 files

### Frontend

Frontend logs are stored in browser localStorage and automatically limited to 100 entries. Older logs are automatically removed.

---

## 🔍 Viewing Logs

### Development Environment

**Backend & Payment Microservice:**
```bash
# View all logs
tail -f backend/logs/app.log

# View error logs only
tail -f backend/logs/error.log

# View payment microservice logs
tail -f payment-microservice/logs/combined.log
```

**Frontend:**
Open browser console and type:
```javascript
// View all logs
logger.getLogs()

// Download logs as JSON
logger.downloadLogs()

// Clear logs
logger.clearLogs()
```

### Production Environment

In production:
1. **Backend/Payment Microservice:** Use log management tools (e.g., PM2, LogRocket, Sentry)
2. **Frontend:** Critical errors are automatically sent to backend logging endpoint
3. Use monitoring dashboards to track errors and performance

---

## 🚀 Best Practices

### 1. Use Appropriate Log Levels

```javascript
// ✅ Good
logger.error('Database connection failed', error); // Critical error
logger.warn('API rate limit: 90%'); // Warning
logger.info('User logged in', { userId }); // General info
logger.debug('Processing data', { data }); // Debug info

// ❌ Bad
logger.error('User clicked button'); // Not an error
logger.info('Critical database failure'); // Should be error level
```

### 2. Include Context in Logs

```javascript
// ✅ Good - includes context
logger.error('Payment failed', error, {
  userId,
  amount,
  transactionId,
  paymentMethod
});

// ❌ Bad - missing context
logger.error('Payment failed');
```

### 3. Don't Log Sensitive Information

```javascript
// ❌ Bad - logging passwords and tokens
logger.info('User data', {
  email,
  password, // Never log passwords!
  token // Never log auth tokens!
});

// ✅ Good - sensitive data excluded
logger.info('User authenticated', {
  email,
  userId
});
```

### 4. Use toast for User Notifications (Frontend)

```javascript
// ❌ Bad - using alert
alert('Login failed');

// ✅ Good - using toast
toast.error('Login failed. Please try again.');
```

---

## 🧪 Testing Logging

### Backend/Payment Microservice

```bash
# Test logger
node -e "const logger = require('./utils/logger'); logger.info('Test log'); logger.error('Test error');"

# Check log files created
ls -la logs/
```

### Frontend

```javascript
// In browser console
import logger from './utils/logger';

logger.info('Test info');
logger.error('Test error', new Error('Sample error'));
logger.getLogs(); // View stored logs
```

---

## 📦 Dependencies

### Backend & Payment Microservice
- `winston` - Logging library
- Already installed in both services

### Frontend
- `react-hot-toast` - Toast notifications
- Already installed

---

## 🔧 Configuration

### Backend Logger
File: `backend/utils/logger.js`
- Modify log levels
- Add/remove transports
- Customize log format

### Payment Microservice Logger
File: `payment-microservice/src/utils/logger.js`
- Configure via `payment-microservice/src/config/index.js`
- Set `logging.level` environment variable

### Frontend Logger
File: `Frontend/src/utils/logger.js`
- Modify `isDevelopment` and `isProduction` checks
- Configure backend logging endpoint
- Adjust localStorage limits

---

## ✅ Migration Checklist

- [x] Backend logger configured (Winston)
- [x] Frontend logger created
- [x] Payment microservice logger configured (Winston)
- [x] logs/ added to all .gitignore files
- [ ] Replace all console.log with logger (18/34 files done in Frontend)
- [ ] Replace all console.error with logger
- [ ] Replace all alert() with toast notifications
- [ ] Test logging in development
- [ ] Test logging in production
- [ ] Set up log monitoring/alerting (optional)

---

## 📞 Support

For questions or issues with logging:
1. Check this guide first
2. Review logger implementation files
3. Test in development environment
4. Check log files for error messages

---

**Last Updated:** 2025-12-16
**Version:** 1.0.0
