/**
 * Frontend Logger Utility
 *
 * Provides consistent logging across the frontend application.
 * In production, errors are sent to a logging service.
 * In development, logs appear in console.
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

// Log levels
const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

// Format timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Send logs to backend in production
const sendToServer = async (level, message, meta = {}) => {
  if (!isProduction) return;

  try {
    await fetch(`${import.meta.env.VITE_SERVER}/api/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        message,
        meta: {
          ...meta,
          timestamp: getTimestamp(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      }),
    });
  } catch (error) {
    // Silently fail - don't want logging errors to break the app
  }
};

// Store logs locally for development
const storeLocally = (level, message, meta) => {
  const logEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    ...meta,
  };

  try {
    const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
    logs.push(logEntry);

    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.shift();
    }

    localStorage.setItem('app_logs', JSON.stringify(logs));
  } catch (error) {
    // localStorage might be full or disabled
  }
};

const logger = {
  /**
   * Log informational messages
   */
  info: (message, meta = {}) => {
    if (isDevelopment) {
      console.log(`ℹ️ [INFO] ${message}`, meta);
    }
    storeLocally(LogLevel.INFO, message, meta);
  },

  /**
   * Log error messages
   */
  error: (message, error = null, meta = {}) => {
    const errorMeta = error
      ? {
          ...meta,
          error: error.message,
          stack: error.stack,
        }
      : meta;

    if (isDevelopment) {
      console.error(`❌ [ERROR] ${message}`, errorMeta);
    }

    storeLocally(LogLevel.ERROR, message, errorMeta);
    sendToServer(LogLevel.ERROR, message, errorMeta);
  },

  /**
   * Log warning messages
   */
  warn: (message, meta = {}) => {
    if (isDevelopment) {
      console.warn(`⚠️ [WARN] ${message}`, meta);
    }
    storeLocally(LogLevel.WARN, message, meta);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (message, meta = {}) => {
    if (isDevelopment) {
      console.log(`🔍 [DEBUG] ${message}`, meta);
      storeLocally(LogLevel.DEBUG, message, meta);
    }
  },

  /**
   * Log API errors with request/response details
   */
  apiError: (endpoint, error, requestData = null) => {
    const meta = {
      endpoint,
      requestData,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    };

    logger.error(`API Error: ${endpoint}`, error, meta);
  },

  /**
   * Clear local logs
   */
  clearLogs: () => {
    try {
      localStorage.removeItem('app_logs');
    } catch (error) {
      // Ignore
    }
  },

  /**
   * Get all stored logs
   */
  getLogs: () => {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch (error) {
      return [];
    }
  },

  /**
   * Download logs as JSON file
   */
  downloadLogs: () => {
    const logs = logger.getLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `app-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },
};

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Uncaught Error', event.error, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', null, {
      reason: event.reason,
    });
  });
}

export default logger;
