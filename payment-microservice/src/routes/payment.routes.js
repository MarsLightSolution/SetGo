const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
  validatePaymentInitiation,
  validateRefund,
  validateOrderId,
  validatePagination,
} = require('../middlewares/validation.middleware');
const {
  paymentLimiter,
  apiLimiter,
  callbackLimiter,
} = require('../middlewares/rateLimit.middleware');
const { asyncHandler } = require('../utils/error.handler');

/**
 * @route   POST /api/v1/payments/initiate
 * @desc    Initiate a new payment
 * @access  Private
 */
router.post(
  '/initiate',
  authenticateToken,
  paymentLimiter,
  validatePaymentInitiation,
  asyncHandler(paymentController.initiatePayment)
);

/**
 * @route   POST /api/v1/payments/callback
 * @desc    Handle payment callback from Azericard
 * @access  Public (verified by MAC signature)
 */
router.post(
  '/callback',
  callbackLimiter,
  asyncHandler(paymentController.handleCallback)
);

/**
 * @route   GET /api/v1/payments/:orderId
 * @desc    Get payment status
 * @access  Private
 */
router.get(
  '/:orderId',
  authenticateToken,
  apiLimiter,
  validateOrderId,
  asyncHandler(paymentController.getPaymentStatus)
);

/**
 * @route   POST /api/v1/payments/:orderId/refund
 * @desc    Refund a payment
 * @access  Private
 */
router.post(
  '/:orderId/refund',
  authenticateToken,
  apiLimiter,
  validateOrderId,
  validateRefund,
  asyncHandler(paymentController.refundPayment)
);

/**
 * @route   GET /api/v1/payments/history
 * @desc    Get payment history for user
 * @access  Private
 */
router.get(
  '/history',
  authenticateToken,
  apiLimiter,
  validatePagination,
  asyncHandler(paymentController.getPaymentHistory)
);

module.exports = router;