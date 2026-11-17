#!/usr/bin/env node
// Reverse (refund to the card) an approved Azericard card payment.
//   node scripts/azericard-reverse.js <orderId | gatewayOrderId> [--trtype=22|24] [--send]
// Without --send it only shows what would be sent. The order changes only when the bank's signed
// result reaches our callback; this prints the gateway's immediate answer.
require('dotenv').config();
const mongoose = require('mongoose');

const args = process.argv.slice(2);
const ref = args.find((a) => !a.startsWith('--'));
const trtype = (args.find((a) => a.startsWith('--trtype=')) || '--trtype=22').split('=')[1];
const send = args.includes('--send');

const Order = require('../models/Order');
const { requestCardReversal } = require('../services/cardPayments');
const { buildReversalFields } = require('../services/azericard/gateway');

(async () => {
  if (!ref) throw new Error('usage: node scripts/azericard-reverse.js <orderId | gatewayOrderId> [--trtype=22|24] [--send]');
  await mongoose.connect(process.env.MONGO_DB);

  const order = mongoose.isValidObjectId(ref) ? await Order.findById(ref) : await Order.findOne({ paymentOrderId: ref });
  if (!order) throw new Error(`No order for ${ref}`);
  console.log('Order:', {
    id: String(order._id), gatewayOrder: order.paymentOrderId, paymentStatus: order.paymentStatus, status: order.status,
    card: order.onlineAmount, wallet: order.walletDeduction, rrn: order.gateway?.rrn, intRef: order.gateway?.intRef,
    approval: order.gateway?.approvalCode, reversal: order.paymentMetadata?.reversal || null,
  });

  if (!send) {
    const { url, fields } = buildReversalFields({
      gatewayOrderId: order.paymentOrderId, amount: order.onlineAmount, rrn: order.gateway?.rrn, intRef: order.gateway?.intRef, trtype,
    });
    const { P_SIGN, ...shown } = fields;
    console.log(`DRY RUN: would POST to ${url}:`, shown, '(+ P_SIGN). Add --send to send it.');
  } else {
    const out = await requestCardReversal(String(order._id), { trtype, reason: 'Azericard test reversal' });
    console.log('Sent:', out.request);
    console.log(`Gateway answered HTTP ${out.response.httpStatus}:\n${out.response.body}`);
    console.log('Watch the server log for "[Azericard] callback" with TRTYPE', trtype);
  }
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('REVERSAL FAILED:', e.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
