const Joi = require('joi');
const { formatErrorResponse } = require('../utils/response.formatter');

/**
 * Payment initiation validation
 */
exports.validatePaymentInitiation = (req, res, next) => {
  const schema = Joi.object({
    amount: Joi.number().positive().precision(2).required()
      .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be positive',
        'any.required': 'Amount is required',
      }),
    currency: Joi.string().length(3).default('AZN')
      .messages({
        'string.length': 'Currency must be 3 characters',
      }),
    description: Joi.string().max(255).required()
      .messages({
        'string.max': 'Description cannot exceed 255 characters',
        'any.required': 'Description is required',
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Valid email is required',
        'any.required': 'Email is required',
      }),
    metadata: Joi.object().pattern(
      Joi.string(),
      Joi.string()
    ).optional(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json(
      formatErrorResponse('Validation failed', error.details[0].message)
    );
  }

  req.body = value;
  next();
};

/**
 * Refund validation
 */
exports.validateRefund = (req, res, next) => {
  const schema = Joi.object({
    amount: Joi.number().positive().precision(2).optional(),
    reason: Joi.string().max(500).required()
      .messages({
        'string.max': 'Reason cannot exceed 500 characters',
        'any.required': 'Refund reason is required',
      }),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json(
      formatErrorResponse('Validation failed', error.details[0].message)
    );
  }

  req.body = value;
  next();
};

/**
 * Order ID parameter validation
 */
exports.validateOrderId = (req, res, next) => {
  const { orderId } = req.params;

  if (!orderId || !/^ORD\d+$/.test(orderId)) {
    return res.status(400).json(
      formatErrorResponse('Invalid order ID format')
    );
  }

  next();
};

/**
 * Pagination validation
 */
exports.validatePagination = (req, res, next) => {
  const schema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    skip: Joi.number().integer().min(0).default(0),
    status: Joi.string().valid('pending', 'authorized', 'captured', 'failed', 'refunded', 'cancelled').optional(),
  });

  const { error, value } = schema.validate(req.query);

  if (error) {
    return res.status(400).json(
      formatErrorResponse('Validation failed', error.details[0].message)
    );
  }

  req.query = value;
  next();
};