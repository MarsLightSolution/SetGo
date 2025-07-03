const winston = require('winston');
const path = require('path');

// Define colors for log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Add colors for levels
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
});

// Common log format (no color)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    ({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`
  )
);

// Console log format (colorized)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`
  )
);

const logger = winston.createLogger({
  levels,
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // File transport: all logs
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/app.log'),
      format: fileFormat,
    }),
    // File transport: errors only
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      format: fileFormat,
    }),
  ],
});

module.exports = logger;
