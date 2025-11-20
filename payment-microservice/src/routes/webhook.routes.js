const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { callbackLimiter } = require('../middlewares/rateLimit.middleware');
const { asyncHandler } = require('../utils/error.handler');

/**
 * @route   POST /api/v1/webhooks/azericard
 * @desc    Handle webhooks from Azericard
 * @access  Public (verified by signature)
 */
router.post(
  '/azericard',
  callbackLimiter,
  asyncHandler(paymentController.handleCallback)
);

module.exports = router;