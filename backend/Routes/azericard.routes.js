// Bank-facing routes, mounted at /api/payments BEFORE the CORS middleware: the bank's hosted page
// POSTs the buyer back with Origin: <bank domain>, which the app-wide CORS check would reject.
// Nothing here uses cookies or the JWT.
//   callback (given to Azericard/Rabita Bank): https://api.satgo.az/api/payments/azericard/callback
const express = require('express');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const { getConfig } = require('../services/azericard/config');
const { verifyResult } = require('../services/azericard/gateway');
const { applyGatewayResult } = require('../services/cardPayments');
const mockBank = require('../services/azericard/mockBank');

const router = express.Router();
const form = express.urlencoded({ extended: false });

// Callbacks all come from the bank's few IPs, so this is per-IP but generous.
const bankLimiter = rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });

const STATUS_FOR = { completed: 200, failed: 200, already_processed: 200, review: 200, unknown_order: 404, mismatch: 409 };

async function handleResult(fields, source, ip) {
  const { ORDER, ACTION, RC } = fields || {};
  logger.info(`[Azericard] ${source} received`, { order: ORDER, action: ACTION, rc: RC, ip });
  const result = verifyResult(fields);
  if (!result) {
    logger.warn(`[Azericard] ${source} rejected: invalid P_SIGN`, { order: ORDER, ip });
    return { status: 400, body: 'INVALID SIGNATURE' };
  }
  const { outcome } = await applyGatewayResult(result);
  logger.info(`[Azericard] ${source} processed`, { order: ORDER, outcome });
  return { status: STATUS_FOR[outcome] || 200, body: outcome === 'unknown_order' || outcome === 'mismatch' ? outcome.toUpperCase() : 'OK' };
}

const cardPaymentsOn = () => process.env.AZERICARD_ENABLED === 'true';
const resultPage = (orderId) =>
  `${(process.env.SERVER_FRONTEND || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')}/payment/result/${encodeURIComponent(orderId)}`;

// Server-to-server result from the bank.
router.post('/azericard/callback', bankLimiter, form, async (req, res) => {
  if (!cardPaymentsOn()) {
    logger.warn('[Azericard] callback received while card payments are disabled', { order: req.body?.ORDER, ip: req.ip });
    return res.status(503).type('text').send('DISABLED');
  }
  try {
    const { status, body } = await handleResult(req.body, 'callback', req.ip);
    res.status(status).type('text').send(body);
  } catch (err) {
    logger.error('[Azericard] callback processing failed', { order: req.body?.ORDER, message: err.message, stack: err.stack });
    res.status(500).type('text').send('ERROR');
  }
});

// BACKREF: the bank POSTs the result here with the buyer's browser; apply it if it's signed (same
// checks as the callback), then send the buyer to the result page whatever happened.
router.all('/azericard/return/:orderId', bankLimiter, form, async (req, res) => {
  if (cardPaymentsOn() && req.body && req.body.P_SIGN) {
    try {
      await handleResult(req.body, 'return', req.ip);
    } catch (err) {
      logger.error('[Azericard] return processing failed', { order: req.body.ORDER, message: err.message });
    }
  }
  res.redirect(303, resultPage(req.params.orderId));
});

// Local stand-in for the bank's hosted page; 404 unless AZERICARD_MODE=mock outside production.
router.use('/mock-azericard', (req, res, next) => {
  let mock = false;
  try {
    mock = getConfig().mode === 'mock';
  } catch {
    mock = false;
  }
  return mock ? mockBank.router(req, res, next) : res.sendStatus(404);
});

module.exports = router;
