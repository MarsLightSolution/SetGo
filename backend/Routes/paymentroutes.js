const express = require('express');
const router = express.Router();
const paymentController = require('../controller/payment.controller');

router.post('/create', paymentController.createPayment);
router.get('/pingback', paymentController.handlePingback);
router.get('/')

module.exports = router;
