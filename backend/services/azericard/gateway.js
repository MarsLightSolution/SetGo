const axios = require('axios');
const p = require('./protocol');
const { getConfig } = require('./config');
const { ownPrivateKey, bankPublicKey } = require('./keys');

const LANGS = { az: 'AZ', en: 'EN', ru: 'RU' };

// The browser posts these fields to `url`; the purchase is never sent server-side.
// M_INFO (browser screen/timezone) is added by the browser; it is not signed.
function buildPurchaseForm({ gatewayOrderId, amount, orderId, email, returnUrl, lang, name }) {
  const cfg = getConfig();
  const fields = {
    AMOUNT: p.formatAmount(amount),
    CURRENCY: p.CURRENCY_AZN,
    ORDER: gatewayOrderId,
    DESC: `SATGO order ${orderId}`,
    MERCH_NAME: p.latin(cfg.merchantName).slice(0, 50),
    MERCH_URL: cfg.resultPageUrl(orderId),
    TERMINAL: cfg.terminal,
    EMAIL: email.slice(0, 80),
    TRTYPE: p.TRTYPE.PURCHASE,
    COUNTRY: p.COUNTRY,
    MERCH_GMT: p.MERCH_GMT,
    TIMESTAMP: p.timestamp(),
    NONCE: p.nonce(),
    BACKREF: returnUrl,
    LANG: LANGS[String(lang || '').slice(0, 2).toLowerCase()] || 'AZ',
  };
  const cardholder = p.latin(name);
  if (cardholder.length >= 2) fields.NAME = cardholder.slice(0, 45);
  fields.P_SIGN = p.sign(fields, p.REQUEST_SIGN_FIELDS, ownPrivateKey());
  return { url: cfg.gatewayUrl, fields };
}

// Returns null unless the bank's P_SIGN checks out. Remember ORDER/ACTION/RC are not covered by it.
function verifyResult(fields) {
  if (!fields || !p.verify(fields, p.RESULT_SIGN_FIELDS, fields.P_SIGN, bankPublicKey())) return null;
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
    // Everything the bank sent except the signature, for review/audit (CARD, if present, is masked).
    raw: Object.fromEntries(Object.entries(fields).filter(([k]) => k !== 'P_SIGN').map(([k, v]) => [k, String(v)])),
  };
}

class StatusCheckUnsupported extends Error {}

// Mock-only for now; the real equivalent is Azericard's "Operation Status" (spec not yet in hand).
const MOCK_STATUS_SIGN_FIELDS = ['ORDER', 'TERMINAL', 'TIMESTAMP', 'NONCE'];

async function queryStatus(gatewayOrderId) {
  const cfg = getConfig();
  if (!cfg.statusUrl) throw new StatusCheckUnsupported('No status check for this Azericard mode yet');
  const fields = { ORDER: gatewayOrderId, TERMINAL: cfg.terminal, TIMESTAMP: p.timestamp(), NONCE: p.nonce() };
  fields.P_SIGN = p.sign(fields, MOCK_STATUS_SIGN_FIELDS, ownPrivateKey());

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

module.exports = { buildPurchaseForm, verifyResult, queryStatus, StatusCheckUnsupported, MOCK_STATUS_SIGN_FIELDS };
