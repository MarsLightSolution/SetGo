// Mounted at /api/payments/azericard. The callback URL given to Azericard/Rabita Bank:
//   https://api.satgo.az/api/payments/azericard/callback
const express = require('express');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const { verifyResult } = require('../services/azericard/gateway');
const { applyGatewayResult } = require('../services/cardPayments');

const router = express.Router();

// Callbacks all come from the bank's few IPs, so this is per-IP but generous.
const callbackLimiter = rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });

const STATUS_FOR = { completed: 200, failed: 200, already_processed: 200, unknown_order: 404, mismatch: 409 };

// UNVERIFIED (plan §4): the response body/status Azericard expects from a callback.
router.post('/callback', callbackLimiter, express.urlencoded({ extended: false }), async (req, res) => {
  const { ORDER, ACTION, RC } = req.body || {};
  logger.info('[Azericard] Callback received', { order: ORDER, action: ACTION, rc: RC, ip: req.ip });

  let result;
  try {
    result = verifyResult(req.body);
  } catch (err) {
    logger.error('[Azericard] Callback verification error', { order: ORDER, message: err.message });
    return res.status(500).type('text').send('ERROR');
  }
  if (!result) {
    logger.warn('[Azericard] Callback rejected: invalid signature', { order: ORDER, ip: req.ip });
    return res.status(400).type('text').send('INVALID SIGNATURE');
  }

  try {
    const { outcome } = await applyGatewayResult(result);
    logger.info('[Azericard] Callback processed', { order: ORDER, outcome });
    return res.status(STATUS_FOR[outcome] || 200).type('text').send(outcome === 'unknown_order' || outcome === 'mismatch' ? outcome.toUpperCase() : 'OK');
  } catch (err) {
    logger.error('[Azericard] Callback processing failed', { order: ORDER, message: err.message, stack: err.stack });
    return res.status(500).type('text').send('ERROR');
  }
});

module.exports = router;
