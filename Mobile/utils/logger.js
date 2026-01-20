/**
 * Production-safe Logger Utility
 *
 * This logger only outputs in development mode (__DEV__).
 * Use this instead of console.log/warn/error in the codebase.
 *
 * Usage:
 *   import logger from '../utils/logger';
 *   logger.log('Debug info');
 *   logger.warn('Warning message');
 *   logger.error('Error occurred', error);
 */

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

const logger = {
  /**
   * Log informational messages (only in development)
   */
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log warning messages (only in development)
   */
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log error messages (only in development)
   * For production error tracking, integrate with Sentry or similar
   */
  error: (...args) => {
    if (isDev) {
      console.error(...args);
    }
    // TODO: In production, send to error tracking service
    // if (!isDev) {
    //   Sentry.captureException(args[0]);
    // }
  },

  /**
   * Log debug info with a label prefix
   */
  debug: (label, ...args) => {
    if (isDev) {
      console.log(`[${label}]`, ...args);
    }
  },

  /**
   * Log API request/response (only in development)
   */
  api: (method, url, data) => {
    if (isDev) {
      console.log(`[API ${method}]`, url, data ? JSON.stringify(data, null, 2) : '');
    }
  },
};

export default logger;
