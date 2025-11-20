const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

logger.info('Using memory store for rate limiting (Redis not required)');

/**
 * General API rate limiter
 */
exports.apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for payment initiation
 */
exports.paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 payment initiations per 15 minutes
  message: {
    success: false,
    message: 'Too many payment attempts, please try again later',
  },
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Callback endpoint limiter
 */
exports.callbackLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 callbacks per minute
  message: {
    success: false,
    message: 'Callback rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});