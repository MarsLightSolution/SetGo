/**
 * Centralized error registry for the SetGo backend.
 *
 * HOW TO USE
 * ----------
 * Import:   const { ERRORS, AppError } = require('../config/errors');
 * Throw:    throw new AppError(ERRORS.AUTH.INVALID_TOKEN);
 * Respond:  return res.status(err.status).json(err.toJSON());
 * Check:    if (err.code === ERRORS.AUTH.EMAIL_NOT_FOUND.code) { ... }
 */

// ─────────────────────────────────────────────────────────────
// ERROR DEFINITIONS
// Each entry: { code, status, message, reason }
//   code    → unique machine-readable identifier (use in conditionals)
//   status  → HTTP status code
//   message → user-facing message returned in API response
//   reason  → internal explanation for developers (never sent to client)
// ─────────────────────────────────────────────────────────────

const ERRORS = {

  // ──────────────────────────────────────────
  // AUTH  (1xxx)
  // Source: controller/Authcontroller.js
  //         middlewares/auth.middlewares.js
  // ──────────────────────────────────────────
  AUTH: {
    MISSING_FIELDS: {
      code: 'AUTH_1001',
      status: 400,
      message: 'All fields are required.',
      reason: 'signup — email, username, or password missing from request body',
    },
    INVALID_EMAIL_FORMAT: {
      code: 'AUTH_1002',
      status: 400,
      message: 'Invalid email format.',
      reason: 'signup — email does not match /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/',
    },
    INVALID_USERNAME: {
      code: 'AUTH_1003',
      status: 400,
      message: 'Username can only contain alphanumeric characters.',
      reason: 'signup — username contains special chars or spaces',
    },
    USERNAME_LENGTH: {
      code: 'AUTH_1004',
      status: 400,
      message: 'Username must be between 3 and 16 characters.',
      reason: 'signup — username.length < 3 or > 16',
    },
    USERNAME_TAKEN: {
      code: 'AUTH_1005',
      status: 400,
      message: 'Username is already taken.',
      reason: 'signup — User.exists({ username }) returned true',
    },
    EMAIL_REGISTERED: {
      code: 'AUTH_1006',
      status: 400,
      message: 'Email is already registered.',
      reason: 'signup — User.exists({ email }) returned true',
    },
    VERIFY_TOKEN_MISSING: {
      code: 'AUTH_1007',
      status: 400,
      message: 'Verification token is required.',
      reason: 'verifyEmail — no token query param in GET /verifyemail',
    },
    VERIFY_TOKEN_INVALID: {
      code: 'AUTH_1008',
      status: 400,
      message: 'Invalid or expired verification token.',
      reason: 'verifyEmail — TempUser not found for token (expired after 15 min or tampered)',
    },
    USER_ALREADY_EXISTS: {
      code: 'AUTH_1009',
      status: 409,
      message: 'User already exists.',
      reason: 'verifyEmail — race condition: permanent User already created for same email/username',
    },
    EMAIL_NOT_FOUND: {
      code: 'AUTH_1010',
      status: 404,
      message: 'The email address you entered is incorrect.',
      reason: 'login — User.findOne({ email }) returned null',
    },
    WRONG_PASSWORD: {
      code: 'AUTH_1011',
      status: 400,
      message: 'The password you entered is incorrect.',
      reason: 'login — bcrypt.compare returned false',
    },
    REFRESH_TOKEN_MISSING: {
      code: 'AUTH_1012',
      status: 401,
      message: 'Refresh token not found.',
      reason: 'refreshAccessToken — no token in cookie or request body',
    },
    REFRESH_TOKEN_INVALID: {
      code: 'AUTH_1013',
      status: 403,
      message: 'Invalid or expired refresh token.',
      reason: 'refreshAccessToken — jwt.verify failed, or token not in user.refreshTokens array (revoked/rotated)',
    },
    NO_TOKEN: {
      code: 'AUTH_1014',
      status: 401,
      message: 'No token provided.',
      reason: 'verifyToken middleware — no Authorization header and no refreshToken cookie',
    },
    TOKEN_INVALID: {
      code: 'AUTH_1015',
      status: 401,
      message: 'Invalid or expired token.',
      reason: 'verifyToken middleware — jwt.verify threw (token tampered, wrong secret, or expired)',
    },
    USER_NOT_FOUND: {
      code: 'AUTH_1016',
      status: 401,
      message: 'User not found.',
      reason: 'verifyToken middleware — User.findById(decoded.id) returned null (account deleted)',
    },
    RESET_EMAIL_REQUIRED: {
      code: 'AUTH_1017',
      status: 400,
      message: 'Email is required.',
      reason: 'forgotPassword — email missing from request body',
    },
    RESET_USER_NOT_FOUND: {
      code: 'AUTH_1018',
      status: 404,
      message: 'User not found or email not verified.',
      reason: 'forgotPassword — no User document for that email',
    },
    RESET_TOKEN_MISSING: {
      code: 'AUTH_1019',
      status: 400,
      message: 'Reset token is required.',
      reason: 'verifyResetToken — no token query param in GET /verifytoken',
    },
    RESET_TOKEN_INVALID: {
      code: 'AUTH_1020',
      status: 400,
      message: 'Invalid or expired reset token.',
      reason: 'verifyResetToken / resetPassword — token not found or resetTokenExpiration < now (1 h window)',
    },
    RESET_MISSING_FIELDS: {
      code: 'AUTH_1021',
      status: 400,
      message: 'Token and new password are required.',
      reason: 'resetPassword — token query param or newPassword body field is missing',
    },
  },

  // ──────────────────────────────────────────
  // RATE LIMITS  (2xxx)
  // Source: middlewares/rateLimiter.middleware.js
  // ──────────────────────────────────────────
  RATE: {
    AUTH: {
      code: 'RATE_2001',
      status: 429,
      message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
      reason: 'authLimiter — 5 req/IP/15 min (prod) or 100 req/IP/15 min (dev) exceeded on /login, /refreshAccessToken, /forgotpassword, /resetpassword',
    },
    SIGNUP: {
      code: 'RATE_2002',
      status: 429,
      message: 'Too many accounts created from this IP, please try again after an hour.',
      reason: 'createAccountLimiter — 3 signups/IP/hour exceeded on /signup',
    },
    UPLOAD: {
      code: 'RATE_2003',
      status: 429,
      message: 'Too many file uploads from this IP, please try again later.',
      reason: 'uploadLimiter — 20 uploads/IP/15 min exceeded',
    },
    PRODUCT_CREATE: {
      code: 'RATE_2004',
      status: 429,
      message: 'Too many products created from this IP, please try again later.',
      reason: 'createProductLimiter — 20 creations/IP/hour exceeded on POST /api/products/add',
    },
    PAYMENT: {
      code: 'RATE_2005',
      status: 429,
      message: 'Too many payment requests from this IP, please try again later.',
      reason: 'paymentLimiter — 10 req/IP/hour exceeded on payment routes',
    },
    GENERAL: {
      code: 'RATE_2006',
      status: 429,
      message: 'Too many requests from this IP, please try again later.',
      reason: 'generalLimiter — 100 req/IP/15 min exceeded',
    },
  },

  // ──────────────────────────────────────────
  // VALIDATION  (3xxx)
  // Source: middlewares/validation.middleware.js (Joi)
  // ──────────────────────────────────────────
  VALIDATION: {
    SIGNUP_INVALID: {
      code: 'VAL_3001',
      status: 400,
      message: 'Validation Error',
      reason: 'validateSignup Joi schema failed — username (3-30, alphanumeric), email (valid), password (8+ chars, uppercase, lowercase, digit)',
    },
    LOGIN_INVALID: {
      code: 'VAL_3002',
      status: 400,
      message: 'Validation Error',
      reason: 'validateLogin Joi schema failed — email or password missing/invalid format',
    },
    RESET_PASSWORD_INVALID: {
      code: 'VAL_3003',
      status: 400,
      message: 'Validation Error',
      reason: 'validateResetPassword Joi schema failed — newPassword must be 8+ chars with uppercase, lowercase, digit',
    },
  },

  // ──────────────────────────────────────────
  // CHAT  (4xxx)
  // Source: controller/chatcontroller.js
  // ──────────────────────────────────────────
  CHAT: {
    USERNAME_REQUIRED: {
      code: 'CHAT_4001',
      status: 400,
      message: 'Username is required.',
      reason: 'connectUser — username missing from POST /api/chat/connect body',
    },
    USER_NOT_FOUND: {
      code: 'CHAT_4002',
      status: 404,
      message: 'User not found. Please register first.',
      reason: 'connectUser — no User found for the provided username/email identifier',
    },
    TWO_PARTICIPANTS_REQUIRED: {
      code: 'CHAT_4003',
      status: 400,
      message: 'Two participants are required.',
      reason: 'createOrGetConversation — participants array has fewer than 2 entries',
    },
    PARTICIPANTS_NOT_FOUND: {
      code: 'CHAT_4004',
      status: 404,
      message: 'One or both users not found.',
      reason: 'createOrGetConversation — findUserByIdentifier returned null for one/both participant IDs',
    },
    MESSAGE_MISSING_FIELDS: {
      code: 'CHAT_4005',
      status: 400,
      message: 'Missing required fields.',
      reason: 'sendMessage — conversationId, senderId, or text missing from POST /api/chat/messages body',
    },
    MESSAGE_SENDER_NOT_FOUND: {
      code: 'CHAT_4006',
      status: 404,
      message: 'Sender not found.',
      reason: 'sendMessage / uploadFile — User.findById(senderId) returned null',
    },
    UPLOAD_NO_FILE: {
      code: 'CHAT_4007',
      status: 400,
      message: 'No file uploaded.',
      reason: 'uploadFile — multer found no file in the multipart request',
    },
    UPLOAD_MISSING_FIELDS: {
      code: 'CHAT_4008',
      status: 400,
      message: 'Missing required fields.',
      reason: 'uploadFile — conversationId or senderId missing from POST /api/chat/upload',
    },
  },

  // ──────────────────────────────────────────
  // ORDERS  (5xxx)
  // Source: controller/Ordercontroller.js
  // ──────────────────────────────────────────
  ORDER: {
    NOT_FOUND: {
      code: 'ORDER_5001',
      status: 404,
      message: 'Order not found.',
      reason: 'getOrderById / getSellerOrders — no Order document for the given ID',
    },
    INVALID_STATUS: {
      code: 'ORDER_5002',
      status: 400,
      message: 'Order cannot be approved in its current status.',
      reason: 'Admincontroller.approveDelivery — order.status is not in the expected state for approval',
    },
    ALREADY_PROCESSED: {
      code: 'ORDER_5003',
      status: 400,
      message: 'Order has already been processed.',
      reason: 'Admincontroller.releaseFunds — order.status is already completed/refunded',
    },
    ADMIN_ONLY: {
      code: 'ORDER_5004',
      status: 403,
      message: 'Only admin can perform this action.',
      reason: 'Admincontroller — req.user.role !== "admin" on protected admin order routes',
    },
  },

  // ──────────────────────────────────────────
  // PRODUCTS  (6xxx)
  // Source: controller/product.controller.js
  // ──────────────────────────────────────────
  PRODUCT: {
    NOT_FOUND: {
      code: 'PROD_6001',
      status: 404,
      message: 'Product not found.',
      reason: 'getProductById / deleteProduct / updateProduct — Product.findById returned null',
    },
    IMAGE_REQUIRED: {
      code: 'PROD_6002',
      status: 400,
      message: 'Image is required.',
      reason: 'createAd — no image file in multipart upload',
    },
    TITLE_REQUIRED: {
      code: 'PROD_6003',
      status: 400,
      message: 'Title is required.',
      reason: 'createAd — title missing from request body',
    },
  },

  // ──────────────────────────────────────────
  // NOTIFICATIONS  (7xxx)
  // Source: Routes/notificationRoutes.js
  //         controller/Ordercontroller.js
  //         services/pushService.js
  // ──────────────────────────────────────────
  NOTIFICATION: {
    MISSING_FIELDS: {
      code: 'NOTIF_7001',
      status: 400,
      message: 'recipientId, type, and title are required.',
      reason: 'POST /api/notifications — one or more required fields missing from body',
    },
    NOT_FOUND: {
      code: 'NOTIF_7002',
      status: 404,
      message: 'Notification not found.',
      reason: 'PATCH/DELETE /api/notifications/:id — no Notification document for that id + recipientId combination',
    },
    INVALID_PUSH_TOKEN: {
      code: 'NOTIF_7003',
      status: 400,
      message: 'Invalid Expo push token.',
      reason: 'pushService — Expo.isExpoPushToken(token) returned false; token may be malformed or from a different push provider',
    },
  },

  // ──────────────────────────────────────────
  // SHOPS  (8xxx)
  // Source: controller/shopController.js
  // ──────────────────────────────────────────
  SHOP: {
    NOT_FOUND: {
      code: 'SHOP_8001',
      status: 404,
      message: 'Shop not found.',
      reason: 'getShopById / updateShop / deleteShop — Shop.findById returned null',
    },
    ALREADY_EXISTS: {
      code: 'SHOP_8002',
      status: 400,
      message: 'User already has a shop.',
      reason: 'createShop — user.hasShop is already true',
    },
    UNAUTHORIZED: {
      code: 'SHOP_8003',
      status: 403,
      message: 'You are not authorized to modify this shop.',
      reason: 'updateShop / deleteShop — shop.owner !== req.user._id',
    },
  },

  // ──────────────────────────────────────────
  // SERVER  (9xxx)
  // Generic — used across all controllers
  // ──────────────────────────────────────────
  SERVER: {
    INTERNAL: {
      code: 'SERVER_9001',
      status: 500,
      message: 'An internal server error occurred. Please try again later.',
      reason: 'Unhandled exception caught in try/catch — check logs/error.log for the full stack trace',
    },
    NOT_IMPLEMENTED: {
      code: 'SERVER_9002',
      status: 501,
      message: 'This feature is not yet implemented.',
      reason: 'Route handler returns 501 — feature is planned but not built',
    },
  },
};

// ─────────────────────────────────────────────────────────────
// AppError CLASS
// Wraps an ERRORS entry so you can throw it and handle it
// uniformly in the global error handler.
//
// Usage:
//   throw new AppError(ERRORS.AUTH.WRONG_PASSWORD);
//   throw new AppError(ERRORS.AUTH.TOKEN_INVALID, 'Custom override message');
// ─────────────────────────────────────────────────────────────
class AppError extends Error {
  constructor(errorDef, customMessage) {
    super(customMessage || errorDef.message);
    this.code    = errorDef.code;
    this.status  = errorDef.status;
    this.reason  = errorDef.reason;
    this.isAppError = true;
  }

  toJSON() {
    return {
      success: false,
      code:    this.code,
      message: this.message,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// HTTP STATUS CODE REFERENCE
// Quick lookup — what each status means in this system
// ─────────────────────────────────────────────────────────────
const HTTP_STATUS = {
  200: 'OK — request succeeded',
  201: 'Created — resource created successfully',
  302: 'Redirect — used after email verification and password reset token validation',
  400: 'Bad Request — invalid input, missing fields, wrong password, validation failure',
  401: 'Unauthorized — no token or invalid token (not authenticated)',
  403: 'Forbidden — valid token but not allowed (wrong role, revoked token, CORS block)',
  404: 'Not Found — user/product/order/shop does not exist',
  409: 'Conflict — resource already exists (duplicate user on verify)',
  429: 'Too Many Requests — rate limiter triggered (see RATE section above)',
  500: 'Internal Server Error — unhandled exception, check logs/error.log',
  501: 'Not Implemented — feature placeholder not yet built',
};

// ─────────────────────────────────────────────────────────────
// RATE LIMITER QUICK REFERENCE
// ─────────────────────────────────────────────────────────────
const RATE_LIMITS = {
  authLimiter:          { routes: ['/login', '/refreshAccessToken', '/forgotpassword', '/resetpassword'], window: '15 min', max: { production: 5,  development: 100 } },
  createAccountLimiter: { routes: ['/signup'],                                                            window: '1 hour', max: { production: 3,  development: 3   } },
  uploadLimiter:        { routes: ['/api/chat/upload', '/api/products/add'],                              window: '15 min', max: { production: 20, development: 20  } },
  createProductLimiter: { routes: ['POST /api/products/add'],                                             window: '1 hour', max: { production: 20, development: 20  } },
  paymentLimiter:       { routes: ['/api/payments/*'],                                                    window: '1 hour', max: { production: 10, development: 10  } },
  generalLimiter:       { routes: ['fallback'],                                                           window: '15 min', max: { production: 100, development: 100 } },
};

module.exports = { ERRORS, AppError, HTTP_STATUS, RATE_LIMITS };
