/**
 * Conditional Logger Utility
 * Only logs in development mode to prevent console pollution in production
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, you might want to send to error tracking service
      // Example: Sentry.captureException(args[0]);
    }
  },

  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  table: (...args) => {
    if (isDevelopment) {
      console.table(...args);
    }
  },
};

export default logger;
