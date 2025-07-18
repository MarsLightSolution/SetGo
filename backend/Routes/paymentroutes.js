const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentcontroller');

router.post('/create', paymentController.createPayment);
router.get('/pingback', paymentController.handlePingback); // for Paymentwall

module.exports = router;