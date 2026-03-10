/**
 * Production-safe Logger Utility
 *
 * All console.* calls are automatically stripped from production builds
 * via babel-plugin-transform-remove-console (configured in babel.config.js).
 *
 * This logger adds:
 * - Module tagging: logger.create('Auth') → prefixes all logs with [Auth]
 * - Log levels: control verbosity via logger.setLevel()
 * - Structured output: objects are formatted for readability
 *
 * Usage:
 *   import logger from '../utils/logger';
 *
 *   // Quick logging (no tag)
 *   logger.log('hello');
 *   logger.error('something broke', error);
 *
 *   // Module-scoped logging (recommended)
 *   const log = logger.create('PostForm');
 *   log.info('Submitting form', { title, price });
 *   log.error('Upload failed', error);
 *
 * Log levels (from least to most verbose):
 *   0 = OFF, 1 = ERROR, 2 = WARN, 3 = INFO, 4 = DEBUG
 */

const LOG_LEVELS = {
  OFF: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
};

// Default: show everything in dev
let currentLevel = LOG_LEVELS.DEBUG;

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

const formatArgs = (args) =>
  args.map((arg) => {
    if (arg instanceof Error) return `${arg.message}\n${arg.stack || ''}`;
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }
    return arg;
  });

/**
 * Create a module-scoped logger
 * @param {string} module - Module name for log prefix (e.g., 'Auth', 'PostForm', 'API')
 * @returns {Object} Logger with log/info/warn/error/debug methods
 */
const createModuleLogger = (module) => {
  const prefix = `[${module}]`;

  return {
    log: (...args) => {
      if (isDev && currentLevel >= LOG_LEVELS.INFO) {
        console.log(prefix, ...args);
      }
    },
    info: (...args) => {
      if (isDev && currentLevel >= LOG_LEVELS.INFO) {
        console.info(prefix, ...args);
      }
    },
    warn: (...args) => {
      if (isDev && currentLevel >= LOG_LEVELS.WARN) {
        console.warn(prefix, ...args);
      }
    },
    error: (...args) => {
      if (isDev && currentLevel >= LOG_LEVELS.ERROR) {
        console.error(prefix, ...formatArgs(args));
      }
    },
    debug: (...args) => {
      if (isDev && currentLevel >= LOG_LEVELS.DEBUG) {
        console.log(prefix, '🔍', ...args);
      }
    },
  };
};

const logger = {
  /**
   * Create a module-scoped logger
   * @param {string} module - e.g., 'Auth', 'PostForm', 'API', 'Chat'
   */
  create: createModuleLogger,

  // --- Quick logging (no module prefix) ---
  log: (...args) => {
    if (isDev && currentLevel >= LOG_LEVELS.INFO) {
      console.log(...args);
    }
  },
  info: (...args) => {
    if (isDev && currentLevel >= LOG_LEVELS.INFO) {
      console.info(...args);
    }
  },
  warn: (...args) => {
    if (isDev && currentLevel >= LOG_LEVELS.WARN) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    if (isDev && currentLevel >= LOG_LEVELS.ERROR) {
      console.error(...formatArgs(args));
    }
  },
  debug: (...args) => {
    if (isDev && currentLevel >= LOG_LEVELS.DEBUG) {
      console.log('🔍', ...args);
    }
  },

  // --- Log level control ---
  /**
   * Set the log level at runtime
   * @param {'OFF'|'ERROR'|'WARN'|'INFO'|'DEBUG'} level
   */
  setLevel: (level) => {
    if (LOG_LEVELS[level] !== undefined) {
      currentLevel = LOG_LEVELS[level];
    }
  },

  /** Get current log level name */
  getLevel: () => Object.keys(LOG_LEVELS).find((k) => LOG_LEVELS[k] === currentLevel),

  /** Expose level constants */
  LEVELS: LOG_LEVELS,
};

export default logger;
