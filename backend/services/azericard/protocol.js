// Azericard wire format. NOTHING in this file has been confirmed against Azericard's spec yet
// (AZERICARD_PAYMENT_WALLET_PLAN.md §4): it follows the common conventions of this gateway family
// so the mock and the rest of the code have something concrete to run against. When the real
// integration guide arrives, this is the only file whose values should need to change.
const crypto = require('crypto');

const TRTYPE = { PURCHASE: '1', STATUS: '90' };

const CURRENCY_AZN = '944';
const COUNTRY = 'AZ';
const MERCH_GMT = '+4';

// Fields covered by P_SIGN, in signing order.
const REQUEST_SIGN_FIELDS = [
  'AMOUNT', 'CURRENCY', 'ORDER', 'DESC', 'MERCH_NAME', 'MERCH_URL', 'TERMINAL', 'EMAIL',
  'TRTYPE', 'COUNTRY', 'MERCH_GMT', 'TIMESTAMP', 'NONCE', 'BACKREF',
];
const RESULT_SIGN_FIELDS = [
  'TERMINAL', 'TRTYPE', 'ORDER', 'AMOUNT', 'CURRENCY', 'ACTION', 'RC', 'APPROVAL',
  'RRN', 'INT_REF', 'TIMESTAMP', 'NONCE',
];
const STATUS_REQUEST_SIGN_FIELDS = ['ORDER', 'TERMINAL', 'TRTYPE', 'TIMESTAMP', 'NONCE'];

// Each value is prefixed with its byte length; an empty value is written as "-".
function signingString(values, fields) {
  return fields
    .map((f) => {
      const v = values[f] == null ? '' : String(values[f]);
      return v === '' ? '-' : `${Buffer.byteLength(v, 'utf8')}${v}`;
    })
    .join('');
}

// RSA-SHA256, hex, uppercase.
function sign(values, fields, privateKey) {
  return crypto.sign('sha256', Buffer.from(signingString(values, fields), 'utf8'), privateKey).toString('hex').toUpperCase();
}

function verify(values, fields, signature, publicKey) {
  if (typeof signature !== 'string' || !/^[0-9A-Fa-f]+$/.test(signature)) return false;
  try {
    return crypto.verify('sha256', Buffer.from(signingString(values, fields), 'utf8'), publicKey, Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

// UTC, YYYYMMDDHHmmss.
const timestamp = (date = new Date()) => date.toISOString().replace(/[-:T]/g, '').slice(0, 14);
const nonce = () => crypto.randomBytes(16).toString('hex').toUpperCase();
// Decimal manats with 2 places, e.g. "12.50".
const formatAmount = (azn) => azn.toFixed(2);
const parseAmount = (value) => Number(value);
const sameAmount = (a, b) => Math.round(a * 100) === Math.round(b * 100);

// ACTION "0" + RC "00" = approved; anything else = not approved.
const isApproved = (fields) => fields.ACTION === '0' && fields.RC === '00';

// 19 digits: millisecond timestamp + 6 random digits.
const newGatewayOrderId = () => `${Date.now()}${crypto.randomInt(100000, 1000000)}`;

module.exports = {
  TRTYPE, CURRENCY_AZN, COUNTRY, MERCH_GMT,
  REQUEST_SIGN_FIELDS, RESULT_SIGN_FIELDS, STATUS_REQUEST_SIGN_FIELDS,
  signingString, sign, verify, timestamp, nonce, formatAmount, parseAmount, sameAmount, isApproved,
  newGatewayOrderId,
};
