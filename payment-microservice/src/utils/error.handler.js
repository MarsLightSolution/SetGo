const logger = require('./logger');
const { formatErrorResponse } = require('./response.formatter');

/**
 * Global error handler
 */
exports.errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json(
      formatErrorResponse('Validation error', err.message)
    );
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json(
      formatErrorResponse('Duplicate entry', 'Resource already exists')
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      formatErrorResponse('Invalid token')
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      formatErrorResponse('Token expired')
    );
  }

  // Default error
  return res.status(err.status || 500).json(
    formatErrorResponse(
      err.message || 'Internal server error',
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    )
  );
};

/**
 * 404 handler
 */
exports.notFoundHandler = (req, res) => {
  res.status(404).json(
    formatErrorResponse('Route not found')
  );
};

/**
 * Async handler wrapper
 */
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};