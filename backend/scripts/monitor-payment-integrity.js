#!/usr/bin/env node
/**
 * Payment integrity monitor.
 *
 * There is no live card-payment gateway integration yet (see
 * backend/AZERICARD_PAYMENT_WALLET_PLAN.md). Until AZERICARD_ENABLED=true is actually set,
 * it should be structurally impossible for any Order to reach paymentStatus "completed" via
 * a card/mixed payment, or for any Transaction to be written with paymentMode "online" and
 * status "success" — payment-proxy.routes.js now refuses card payments outright (see the
 * "CARD PAYMENT GATE" in /initiate), and the webhook that would mark one "completed" isn't
 * even mounted.
 *
 * This script is the tripwire: run periodically (cron), it finds anything matching that
 * "should be impossible" shape, emails an alert the first time it sees each one, and records
 * what it has already alerted on (in a local state file) so re-runs don't spam the same alert.
 *
 * Usage:
 *   node scripts/monitor-payment-integrity.js            # normal run (alerts on new findings)
 *   node scripts/monitor-payment-integrity.js --dry-run   # report findings, don't email or record state
 *
 * Suggested crontab (every 15 minutes) - see DEPLOYMENT.md for the exact line, deliberately
 * not written here since the cron "every N minutes" syntax contains `*` `/` in a sequence
 * that terminates a JS block comment.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const DRY_RUN = process.argv.includes('--dry-run');
const STATE_FILE = path.join(__dirname, '.payment-monitor-state.json');
const ALERT_TO = process.env.PAYMENT_ALERT_EMAIL || 'atiwari94255@gmail.com';

function loadAlertedIds() {
  try {
    return new Set(JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')));
  } catch {
    return new Set();
  }
}

function saveAlertedIds(ids) {
  fs.writeFileSync(STATE_FILE, JSON.stringify([...ids], null, 2));
}

async function findAnomalies() {
  const orders = mongoose.connection.collection('orders');
  const txns = mongoose.connection.collection('transactions');

  // Any order that reached "completed" via card/mixed, or has a paid online component,
  // while the gate in payment-proxy.routes.js should have refused it outright.
  const suspiciousOrders = await orders.find({
    $or: [
      { paymentStatus: 'completed', paymentMethod: { $in: ['card', 'mixed'] } },
      { paymentStatus: 'completed', onlineAmount: { $gt: 0 } },
    ],
  }).project({
    _id: 1, buyerId: 1, sellerId: 1, total: 1, onlineAmount: 1, paidAmount: 1,
    paymentStatus: 1, paymentMethod: 1, status: 1, transactionId: 1, paymentOrderId: 1,
    createdAt: 1, paidAt: 1,
  }).toArray();

  // Any ledger entry recording a successful "online" (gateway) payment.
  const suspiciousTxns = await txns.find({
    paymentMode: 'online',
    status: 'success',
  }).project({
    _id: 1, senderId: 1, receiverId: 1, amount: 1, transactionId: 1, createdAt: 1,
  }).toArray();

  return {
    orders: suspiciousOrders.map((o) => ({ kind: 'order', id: String(o._id), data: o })),
    transactions: suspiciousTxns.map((t) => ({ kind: 'transaction', id: String(t._id), data: t })),
  };
}

function formatFinding(f) {
  return `[${f.kind}] ${f.id}\n` + JSON.stringify(f.data, null, 2);
}

async function sendAlert(findings) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const body = findings.map(formatFinding).join('\n\n');

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: ALERT_TO,
    subject: `⚠ SATGO payment integrity alert — ${findings.length} unexpected online payment record(s)`,
    html: `
      <h2 style="color:#b91c1c;">Unexpected online payment record(s) found</h2>
      <p>No card-payment gateway integration is live yet (AZERICARD_ENABLED is not set), so this
      should not be possible. Found ${findings.length} record(s) that need investigating:</p>
      <pre style="background:#f5f5f5;padding:12px;border-radius:6px;white-space:pre-wrap;font-family:monospace;font-size:12px;">${body.replace(/</g, '&lt;')}</pre>
      <p style="color:#888;font-size:12px;">Sent by backend/scripts/monitor-payment-integrity.js. This alert will not repeat for the same record(s).</p>
    `,
  });
}

(async () => {
  await mongoose.connect(process.env.MONGO_DB);
  const { orders, transactions } = await findAnomalies();
  const all = [...orders, ...transactions];

  console.log(`[${new Date().toISOString()}] checked - orders:${orders.length} transactions:${transactions.length}`);

  if (all.length === 0) {
    console.log('  nothing found - clean');
  } else {
    const alerted = loadAlertedIds();
    const newFindings = all.filter((f) => !alerted.has(f.id));

    if (newFindings.length === 0) {
      console.log(`  ${all.length} known finding(s), already alerted - no new email`);
    } else {
      console.log(`  ${newFindings.length} NEW finding(s):`);
      newFindings.forEach((f) => console.log('   -', formatFinding(f).replace(/\n/g, ' ')));

      if (!DRY_RUN) {
        await sendAlert(newFindings);
        newFindings.forEach((f) => alerted.add(f.id));
        saveAlertedIds(alerted);
        console.log(`  alert emailed to ${ALERT_TO}`);
      } else {
        console.log('  (dry run - no email sent, no state recorded)');
      }
    }
  }

  await mongoose.disconnect();
})().catch((e) => {
  console.error(`[${new Date().toISOString()}] MONITOR FAILED:`, e.message);
  process.exitCode = 1;
});
