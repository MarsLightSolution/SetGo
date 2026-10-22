// Stand-in for Azericard's hosted payment page, for local testing only. It plays the bank's side
// of protocol.js: verifies our P_SIGN with our public key, lets the tester pick an outcome, signs
// the result with its own key, POSTs it to our callback URL (server to server) and, like the real
// gateway, posts it to BACKREF with the buyer's browser.
const crypto = require('crypto');
const express = require('express');
const axios = require('axios');
const p = require('./protocol');
const { getConfig } = require('./config');
const { ownPublicKey, mockBankKeyPair } = require('./keys');
const { MOCK_STATUS_SIGN_FIELDS } = require('./gateway');
const logger = require('../../utils/logger');

const router = express.Router();
const payments = new Map(); // ORDER -> { request, state: 'pending'|'approved'|'declined', result }

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const originOf = (url) => { try { return new URL(url).origin; } catch { return ''; } };

router.use(express.urlencoded({ extended: false }));

function setCsp(res, backref) {
  res.set('Content-Security-Policy',
    `default-src 'none'; style-src 'unsafe-inline'; form-action 'self' ${originOf(backref)} ${getConfig().frontendOrigin}; frame-ancestors 'none'`);
}

const page = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>
body{font-family:system-ui,sans-serif;background:#eef1f5;margin:0;padding:24px 16px;color:#1f2933}
.card{max-width:420px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:24px}
.banner{background:#fff3cd;color:#7a5b00;border-radius:8px;padding:8px 12px;font-size:13px;margin-bottom:16px}
h1{font-size:20px;margin:0 0 4px}.muted{color:#6b7785;font-size:13px}
.amount{font-size:32px;font-weight:700;margin:16px 0}
dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:14px;margin:0 0 16px}dt{color:#6b7785}dd{margin:0;word-break:break-all}
input[type=text]{width:100%;box-sizing:border-box;padding:10px;border:1px solid #cbd2d9;border-radius:8px;margin:4px 0 12px;background:#f5f7fa}
button{width:100%;padding:12px;border:0;border-radius:8px;font-size:15px;font-weight:600;margin-top:8px;cursor:pointer}
.ok{background:#1f8a4c;color:#fff}.no{background:#c0392b;color:#fff}.alt{background:#e4e7eb;color:#1f2933}
</style></head><body><div class="card"><div class="banner">MOCK AZERICARD — test only, no real money</div>${body}</div></body></html>`;

function signedResult(request, approved) {
  const fields = {
    TERMINAL: request.TERMINAL,
    TRTYPE: request.TRTYPE,
    ORDER: request.ORDER,
    AMOUNT: request.AMOUNT,
    CURRENCY: request.CURRENCY,
    ACTION: approved ? '0' : '2',
    RC: approved ? '00' : '05',
    APPROVAL: approved ? String(crypto.randomInt(100000, 1000000)) : '',
    RRN: String(crypto.randomInt(1e11, 1e12)),
    INT_REF: crypto.randomBytes(8).toString('hex').toUpperCase(),
    TIMESTAMP: p.timestamp(),
    NONCE: p.nonce(),
  };
  fields.P_SIGN = p.sign(fields, p.RESULT_SIGN_FIELDS, mockBankKeyPair().privateKey);
  return fields;
}

router.post('/pay', (req, res) => {
  const f = req.body;
  setCsp(res, f.BACKREF);
  if (!p.verify(f, p.REQUEST_SIGN_FIELDS, f.P_SIGN, ownPublicKey())) {
    logger.warn('[MockAzericard] rejected request: bad P_SIGN', { order: f.ORDER });
    return res.status(400).send(page('Rejected', '<h1>Request rejected</h1><p>P_SIGN did not verify against the merchant public key.</p>'));
  }
  if (f.TERMINAL !== getConfig().terminal || !/^\d{6,32}$/.test(f.ORDER || '')) {
    return res.status(400).send(page('Rejected', '<h1>Request rejected</h1><p>Unknown terminal or invalid ORDER.</p>'));
  }
  if (!payments.has(f.ORDER)) payments.set(f.ORDER, { request: f, state: 'pending' });

  const action = `/api/payments/mock-azericard/pay/${encodeURIComponent(f.ORDER)}/decision`;
  res.send(page('Pay with card', `
    <h1>${esc(f.MERCH_NAME)}</h1><div class="muted">${esc(f.DESC)}</div>
    <div class="amount">${esc(f.AMOUNT)} ${esc(f.CURRENCY)}</div>
    <dl><dt>Order</dt><dd>${esc(f.ORDER)}</dd><dt>Terminal</dt><dd>${esc(f.TERMINAL)}</dd>
    <dt>Email</dt><dd>${esc(f.EMAIL)}</dd><dt>Name</dt><dd>${esc(f.NAME || '—')}</dd><dt>Language</dt><dd>${esc(f.LANG)}</dd>
    <dt>M_INFO</dt><dd>${f.M_INFO ? 'received' : '—'}</dd></dl>
    <label class="muted">Card number</label><input type="text" value="4169 7388 0000 0000" disabled>
    <form method="post" action="${action}">
      <button class="ok" name="decision" value="approve">Approve payment</button>
      <button class="no" name="decision" value="decline">Decline (insufficient funds)</button>
      <button class="alt" name="decision" value="approve_no_callback">Approve, but lose the callback</button>
      <button class="alt" name="decision" value="cancel">Cancel and return to shop</button>
    </form>`));
});

router.post('/pay/:order/decision', async (req, res) => {
  const entry = payments.get(req.params.order);
  if (!entry) return res.status(404).send(page('Not found', '<h1>Unknown payment</h1>'));
  setCsp(res, entry.request.BACKREF);
  const decision = req.body.decision;

  if (entry.state === 'pending' && decision === 'cancel') {
    entry.state = 'declined';
    entry.result = signedResult(entry.request, false);
    entry.cancelled = true;
  } else if (entry.state === 'pending') {
    const approved = decision === 'approve' || decision === 'approve_no_callback';
    entry.state = approved ? 'approved' : 'declined';
    entry.result = signedResult(entry.request, approved);
    entry.callbackLost = decision === 'approve_no_callback';

    if (!entry.callbackLost) {
      try {
        await axios.post(getConfig().callbackUrl, new URLSearchParams(entry.result).toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000,
        });
      } catch (err) {
        logger.error('[MockAzericard] callback delivery failed', { order: req.params.order, message: err.message });
      }
    }
  }

  // "Lost callback" and "cancel" simulate the buyer not coming back through BACKREF with a result.
  const postBack = !entry.cancelled && !entry.callbackLost;
  const hidden = postBack
    ? Object.entries(entry.result).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('')
    : '';
  const heading = entry.cancelled ? 'Payment cancelled' : entry.state === 'approved' ? 'Payment approved' : 'Payment declined';
  res.send(page(heading, `<h1>${heading}</h1><p class="muted">The real gateway posts this result back automatically.</p>
    <form method="post" action="${esc(entry.request.BACKREF)}">${hidden}<button class="ok">Return to ${esc(entry.request.MERCH_NAME)}</button></form>`));
});

router.post('/status', (req, res) => {
  const f = req.body;
  if (!p.verify(f, MOCK_STATUS_SIGN_FIELDS, f.P_SIGN, ownPublicKey())) {
    return res.status(400).json({ error: 'bad P_SIGN' });
  }
  const entry = payments.get(f.ORDER);
  if (!entry) return res.json({ found: false });
  if (entry.state === 'pending') return res.json({ pending: true });
  res.json(entry.result);
});

module.exports = { router, payments };
