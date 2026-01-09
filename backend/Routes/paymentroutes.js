const express = require('express');
const router = express.Router();
const paymentController = require('../controller/payment.controller');
const { paymentLimiter } = require('../middlewares/rateLimiter.middleware');
const verifyJWT = require('../middlewares/auth.middlewares.js');
const { validateCreatePayment } = require('../middlewares/validation.middleware');

// SECURITY: Payment routes with strict rate limiting, authentication, and input validation
router.post('/create', paymentLimiter, verifyJWT, validateCreatePayment, paymentController.createPayment);
// Pingback is called by payment gateway, so no auth but still rate limited
router.get('/pingback', paymentLimiter, paymentController.handlePingback);
router.get('/')

module.exports = router;
