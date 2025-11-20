const jwt = require('jsonwebtoken');
const config = require('../config');
const { formatErrorResponse } = require('../utils/response.formatter');
const logger = require('../utils/logger');

/**
 * Verify JWT token from main application
 */
exports.authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json(
        formatErrorResponse('Access token is required')
      );
    }

    jwt.verify(token, config.security.jwtSecret, (err, user) => {
      if (err) {
        logger.warn('Invalid token', { error: err.message });
        return res.status(403).json(
          formatErrorResponse('Invalid or expired token')
        );
      }

      req.user = user;
      next();
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json(
      formatErrorResponse('Authentication failed')
    );
  }
};

/**
 * Verify API key for internal service-to-service communication
 */
exports.authenticateApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== config.security.apiKey) {
      logger.warn('Invalid API key attempt', { ip: req.ip });
      return res.status(401).json(
        formatErrorResponse('Invalid API key')
      );
    }

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    return res.status(500).json(
      formatErrorResponse('Authentication failed')
    );
  }
};

/**
 * Optional authentication - allows both authenticated and guest users
 */
exports.optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, config.security.jwtSecret, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};