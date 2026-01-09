const Joi = require('joi');

/**
 * Input Validation Middleware using Joi
 * Validates and sanitizes user input to prevent injection attacks and bad data
 */

// Validation helper function
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown keys from the object
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Validation Error',
        details: errors,
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

// User Registration Schema
const signupSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must only contain alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),

  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Phone number must be between 10-15 digits',
    }),

  fullName: Joi.string()
    .min(2)
    .max(100)
    .optional(),
});

// Login Schema
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .required(),
});

// Product Creation Schema
const createProductSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'Product title must be at least 3 characters',
      'string.max': 'Product title must not exceed 200 characters',
    }),

  description: Joi.string()
    .min(10)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description must not exceed 5000 characters',
    }),

  price: Joi.number()
    .min(0)
    .max(1000000000)
    .required()
    .messages({
      'number.min': 'Price must be a positive number',
      'number.max': 'Price is too high',
    }),

  quantity: Joi.number()
    .integer()
    .min(0)
    .max(100000)
    .default(1)
    .messages({
      'number.min': 'Quantity cannot be negative',
      'number.max': 'Quantity exceeds maximum limit',
    }),

  category: Joi.string()
    .required(),

  condition: Joi.string()
    .valid('new', 'like-new', 'used', 'refurbished')
    .optional(),

  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    address: Joi.string().max(500).optional(),
  }).optional(),

  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional(),

  // Allow other fields that might come from the form
}).unknown(true); // Allow additional fields for now (like shopId, etc.)

// Order Creation Schema
const createOrderSchema = Joi.object({
  productId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/) // MongoDB ObjectId
    .required()
    .messages({
      'string.pattern.base': 'Invalid product ID format',
    }),

  quantity: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'number.min': 'Quantity must be at least 1',
      'number.max': 'Quantity exceeds maximum limit',
    }),

  shippingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),

  totalAmount: Joi.number()
    .min(0)
    .required(),
}).unknown(true);

// Payment Creation Schema
const createPaymentSchema = Joi.object({
  amount: Joi.number()
    .min(0.01)
    .max(1000000)
    .required()
    .messages({
      'number.min': 'Payment amount must be greater than 0',
      'number.max': 'Payment amount exceeds maximum limit',
    }),

  productId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),

  receiverId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
}).unknown(true);

// Wallet Transfer Schema
const walletTransferSchema = Joi.object({
  receiverId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid receiver ID format',
    }),

  amount: Joi.number()
    .min(0.01)
    .max(100000)
    .required()
    .messages({
      'number.min': 'Transfer amount must be greater than 0',
      'number.max': 'Transfer amount exceeds maximum limit',
    }),

  description: Joi.string()
    .max(500)
    .optional(),
}).unknown(true);

// Password Reset Schema
const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
});

// Shop Creation Schema
const createShopSchema = Joi.object({
  shopName: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.min': 'Shop name must be at least 3 characters',
      'string.max': 'Shop name must not exceed 100 characters',
    }),

  description: Joi.string()
    .min(10)
    .max(2000)
    .required(),

  category: Joi.string()
    .required(),

  location: Joi.object({
    address: Joi.string().max(500).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
  }).optional(),
}).unknown(true);

// Export validation middleware for each schema
module.exports = {
  validateSignup: validate(signupSchema),
  validateLogin: validate(loginSchema),
  validateCreateProduct: validate(createProductSchema),
  validateCreateOrder: validate(createOrderSchema),
  validateCreatePayment: validate(createPaymentSchema),
  validateWalletTransfer: validate(walletTransferSchema),
  validateResetPassword: validate(resetPasswordSchema),
  validateCreateShop: validate(createShopSchema),
};
