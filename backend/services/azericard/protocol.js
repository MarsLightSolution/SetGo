// Azericard e-commerce wire format, per developer.azericard.com ("E-Commerce integration",
// "Creating P_SIGN", "Callback P_SIGN calculation") and the PHP samples Azericard sent
// (backend/docs/payments, not committed).
const crypto = require('crypto');

const TRTYPE = { PREAUTH: '0', PURCHASE: '1', COMPLETION: '21', REVERSAL: '22', OFFLINE_REVERSAL: '24' };

const CURRENCY_AZN = 'AZN';
const COUNTRY = 'AZ';
const MERCH_GMT = '+4';

// Fields covered by P_SIGN, in signing order.
const REQUEST_SIGN_FIELDS = ['AMOUNT', 'CURRENCY', 'TERMINAL', 'TRTYPE', 'TIMESTAMP', 'NONCE', 'MERCH_URL'];
const FOLLOWUP_SIGN_FIELDS = ['AMOUNT', 'CURRENCY', 'TERMINAL', 'TRTYPE', 'ORDER', 'RRN', 'INT_REF']; // TRTYPE 21/22/24
// NOT signed by the bank: ORDER, ACTION, RC, CURRENCY — never trust those on their own.
const RESULT_SIGN_FIELDS = ['AMOUNT', 'TERMINAL', 'APPROVAL', 'RRN', 'INT_REF'];

// Each value prefixed with its decimal length; an empty value is a bare "-".
function signingString(values, fields) {
  return fields
    .map((f) => {
      const v = values[f] == null ? '' : String(values[f]);
      return v === '' ? '-' : `${Buffer.byteLength(v, 'utf8')}${v}`;
    })
    .join('');
}

// SHA256withRSA, lowercase hex (PHP bin2hex).
function sign(values, fields, privateKey) {
  return crypto.sign('sha256', Buffer.from(signingString(values, fields), 'utf8'), privateKey).toString('hex');
}

function verify(values, fields, signature, publicKey) {
  if (typeof signature !== 'string' || !/^[0-9A-Fa-f]+$/.test(signature)) return false;
  try {
    return crypto.verify('sha256', Buffer.from(signingString(values, fields), 'utf8'), publicKey, Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

// GMT, YYYYMMDDHHMMSS; must be within 1 hour of the gateway's clock.
const timestamp = (date = new Date()) => date.toISOString().replace(/[-:T]/g, '').slice(0, 14);
// 8-32 random bytes, hex.
const nonce = () => crypto.randomBytes(16).toString('hex');
// "Sliding point" decimal.
const formatAmount = (azn) => azn.toFixed(2);
const parseAmount = (value) => Number(value);
const sameAmount = (a, b) => Math.round(a * 100) === Math.round(b * 100);

// ACTION 0 = transaction completed successfully; RC is ISO-8583 field 39, "00" = approved.
const isApproved = (fields) => fields.ACTION === '0' && fields.RC === '00';

// ORDER: numeric, 6-32 digits; the last 6 are the trace number and must be unique per terminal per
// day. `sequence` comes from a counter that never resets, so the last 6 only repeat after 1,000,000
// orders, whatever the gateway's definition of "a day".
const gatewayOrderId = (sequence, date = new Date()) =>
  `${date.toISOString().slice(0, 10).replace(/-/g, '')}${String(sequence % 1000000).padStart(6, '0')}`;

// DESC, MERCH_NAME, NAME: Latin only.
const latin = (s) => String(s || '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '').trim();

module.exports = {
  TRTYPE, CURRENCY_AZN, COUNTRY, MERCH_GMT,
  REQUEST_SIGN_FIELDS, FOLLOWUP_SIGN_FIELDS, RESULT_SIGN_FIELDS,
  signingString, sign, verify, timestamp, nonce, formatAmount, parseAmount, sameAmount, isApproved,
  gatewayOrderId, latin,
};
