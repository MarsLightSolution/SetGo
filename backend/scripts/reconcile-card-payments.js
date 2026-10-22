#!/usr/bin/env node
// One-off run of the card-payment reconciliation the server already does every minute.
//   node scripts/reconcile-card-payments.js [--stale-minutes=N]
require('dotenv').config();
const mongoose = require('mongoose');

const arg = process.argv.find((a) => a.startsWith('--stale-minutes='));
if (arg) process.env.AZERICARD_STALE_MINUTES = arg.split('=')[1];

const { reconcileStaleCardOrders } = require('../services/cardPayments');

(async () => {
  await mongoose.connect(process.env.MONGO_DB);
  console.log(await reconcileStaleCardOrders());
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('RECONCILE FAILED:', e.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
