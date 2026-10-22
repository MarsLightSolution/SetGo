const axios = require('axios');
const p = require('./protocol');
const { getConfig } = require('./config');
const { ownPrivateKey, bankPublicKey } = require('./keys');

// The browser posts these fields to `url`; we never call the purchase endpoint server-side.
function buildPurchaseForm({ gatewayOrderId, amount, description, email, returnUrl }) {
  const cfg = getConfig();
  const fields = {
    AMOUNT: p.formatAmount(amount),
    CURRENCY: p.CURRENCY_AZN,
    ORDER: gatewayOrderId,
    DESC: description.slice(0, 50),
    MERCH_NAME: cfg.merchantName,
    MERCH_URL: cfg.merchantUrl,
    TERMINAL: cfg.terminal,
    EMAIL: email,
    TRTYPE: p.TRTYPE.PURCHASE,
    COUNTRY: p.COUNTRY,
    MERCH_GMT: p.MERCH_GMT,
    TIMESTAMP: p.timestamp(),
    NONCE: p.nonce(),
    BACKREF: returnUrl,
  };
  fields.P_SIGN = p.sign(fields, p.REQUEST_SIGN_FIELDS, ownPrivateKey());
  return { url: cfg.gatewayUrl, fields };
}

function toResult(fields) {
  return {
    gatewayOrderId: fields.ORDER,
    amount: p.parseAmount(fields.AMOUNT),
    currency: fields.CURRENCY,
    terminal: fields.TERMINAL,
    approved: p.isApproved(fields),
    action: fields.ACTION,
    responseCode: fields.RC,
    approvalCode: fields.APPROVAL || null,
    rrn: fields.RRN || null,
    intRef: fields.INT_REF || null,
  };
}

// Returns null unless the bank's signature over the result fields checks out.
function verifyResult(fields) {
  if (!fields || !p.verify(fields, p.RESULT_SIGN_FIELDS, fields.P_SIGN, bankPublicKey())) return null;
  return toResult(fields);
}

// TRTYPE=90 status check, for orders whose callback never arrived.
// Returns { found: false } | { pending: true } | a verified result.
async function queryStatus(gatewayOrderId) {
  const cfg = getConfig();
  const fields = {
    ORDER: gatewayOrderId,
    TERMINAL: cfg.terminal,
    TRTYPE: p.TRTYPE.STATUS,
    TIMESTAMP: p.timestamp(),
    NONCE: p.nonce(),
  };
  fields.P_SIGN = p.sign(fields, p.STATUS_REQUEST_SIGN_FIELDS, ownPrivateKey());

  const { data } = await axios.post(cfg.statusUrl, new URLSearchParams(fields).toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });
  if (data.found === false) return { found: false };
  if (data.pending === true) return { pending: true };
  const result = verifyResult(data);
  if (!result) throw new Error(`Status response for ${gatewayOrderId} failed signature verification`);
  return result;
}

module.exports = { buildPurchaseForm, verifyResult, queryStatus };
