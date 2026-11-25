// Card (and wallet + card) checkout on top of the Azericard gateway.
//
// Money flow for an order of `total` = walletDeduction + onlineAmount:
//   start    : reserve the item; hold walletDeduction  buyer    -> platform (HOLD_<order>)
//   approved :                 settle walletDeduction  platform -> seller   (SETTLE_<order>)
//              card money onlineAmount credited to seller, paymentMode online  (CARD_<order>)
//   declined : release walletDeduction                 platform -> buyer    (RELEASE_<order>), restock
//
// Results arrive signed, but Azericard's signature covers only AMOUNT, TERMINAL, APPROVAL, RRN and
// INT_REF — not ORDER, ACTION or RC. So an approval needs an approval code (signed), a bank
// reference no other order has used, and the exact amount; anything doubtful is flagged for review
// instead of being applied.
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/product.model');
const logger = require('../utils/logger');
const { WalletError, withTransaction, transfer, creditFromGateway, debitToGateway } = require('./walletLedger');
const { notifyOrderPlaced, notifyOrderEvent } = require('./orderNotifications');
const { getConfig } = require('./azericard/config');
const { buildPurchaseForm, buildReversalFields, sendReversal, queryStatus, StatusCheckUnsupported } = require('./azericard/gateway');
const { gatewayOrderId, sameAmount, CURRENCY_AZN, TRTYPE } = require('./azericard/protocol');

const REVERSAL_TRTYPES = [TRTYPE.REVERSAL, TRTYPE.OFFLINE_REVERSAL];

class AlreadyProcessed extends Error {}

function platformWalletId() {
  const id = process.env.Admin_Id;
  if (!id) throw new WalletError('PLATFORM_WALLET_MISSING', 'Card payments are temporarily unavailable', 503);
  return id;
}

async function nextGatewayOrderId() {
  const res = await mongoose.connection.collection('counters').findOneAndUpdate(
    { _id: 'azericard-order' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  const doc = res && res.value !== undefined ? res.value : res;
  return gatewayOrderId(doc.seq);
}

async function startCardCheckout({ buyerId, product, total, walletDeduction, onlineAmount, checkoutDetails, lang }) {
  const cfg = getConfig();
  const orderId = new mongoose.Types.ObjectId();
  const gatewayOrder = await nextGatewayOrderId();
  const productTitle = product.title?.en || String(product._id);
  const sellerId = String(product.owner._id || product.owner);
  const platformId = walletDeduction > 0 ? platformWalletId() : null;

  const order = await withTransaction(async (session) => {
    const reserved = await Product.updateOne(
      { _id: product._id, quantity: { $gt: 0 } },
      { $inc: { quantity: -1 } },
      { session }
    );
    if (reserved.modifiedCount !== 1) throw new WalletError('OUT_OF_STOCK', 'Product is out of stock', 409);

    if (walletDeduction > 0) {
      await transfer({
        senderId: buyerId, receiverId: platformId, amount: walletDeduction,
        transactionId: `HOLD_${orderId}`, description: `Held for card checkout: ${productTitle}`,
        referenceId: String(orderId), type: 'transfer', source: 'purchase',
      }, session);
    }

    const [created] = await Order.create([{
      _id: orderId,
      buyerId,
      sellerId,
      productId: product._id,
      total,
      walletDeduction,
      onlineAmount,
      paidAmount: 0,
      status: 'pending',
      paymentStatus: 'processing',
      paymentOrderId: gatewayOrder,
      checkoutDetails,
      paymentMetadata: { productTitle, productPrice: total, initiatedAt: new Date() },
    }], { session });
    return created;
  });

  const gateway = buildPurchaseForm({
    gatewayOrderId: gatewayOrder,
    amount: onlineAmount,
    orderId,
    email: checkoutDetails.email,
    returnUrl: cfg.returnUrl(orderId),
    lang,
    name: checkoutDetails.name,
  });
  logger.info(`[Card] Checkout started: order ${orderId}, gateway order ${gatewayOrder}, card ₼${onlineAmount}, wallet ₼${walletDeduction}`);
  return { order, gateway };
}

const gatewayFields = (r) => ({
  rrn: r.rrn, intRef: r.intRef, approvalCode: r.approvalCode, responseCode: r.responseCode,
  action: r.action, callbackAt: new Date(),
});

async function flagForReview(order, reason, result = null) {
  await Order.updateOne(
    { _id: order._id },
    {
      $set: {
        'paymentMetadata.needsReview': true,
        'paymentMetadata.reviewReason': reason,
        'paymentMetadata.reviewFlaggedAt': new Date(),
        ...(result && { 'paymentMetadata.reviewGatewayResult': { ...gatewayFields(result), raw: result.raw } }),
      },
    }
  );
  // Details in the message itself: the file log format drops metadata.
  logger.error(`[Card] Payment needs manual review: order ${order._id}: ${reason}${result ? ` | bank sent ${JSON.stringify(result.raw)}` : ''}`);
}

// AMOUNT and TERMINAL are signed by the bank; CURRENCY is not, and may come back as the ISO
// number (944) or be absent.
function resultMismatches(result, order, cfg) {
  const problems = [];
  if (String(result.terminal || '').trim() !== cfg.terminal) problems.push(`TERMINAL "${result.terminal}" (expected ${cfg.terminal})`);
  if (!sameAmount(result.amount, order.onlineAmount)) problems.push(`AMOUNT "${result.raw?.AMOUNT}" (expected ${order.onlineAmount})`);
  const currency = String(result.currency || '').trim().toUpperCase();
  if (currency && currency !== CURRENCY_AZN && currency !== '944') problems.push(`CURRENCY "${result.currency}"`);
  return problems;
}

async function completeOrder(order, result) {
  await withTransaction(async (session) => {
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: 'processing' },
      {
        $set: {
          paymentStatus: 'completed', status: 'paid', paidAmount: order.total, paidAt: new Date(),
          transactionId: `CARD_${order._id}`, gateway: gatewayFields(result),
        },
      },
      { session }
    );
    if (!updated) throw new AlreadyProcessed();

    if (order.walletDeduction > 0) {
      await transfer({
        senderId: platformWalletId(), receiverId: order.sellerId, amount: order.walletDeduction,
        transactionId: `SETTLE_${order._id}`, description: `Wallet part of order ${order._id}`,
        referenceId: String(order._id), type: 'transfer', source: 'purchase',
      }, session);
    }
    await creditFromGateway({
      senderId: order.buyerId, receiverId: order.sellerId, amount: order.onlineAmount,
      transactionId: `CARD_${order._id}`, description: `Card payment for order ${order._id}`,
      referenceId: String(order._id),
    }, session);
  });

  logger.info(`[Card] Order ${order._id} paid (RRN ${result.rrn})`);
  const fresh = await Order.findById(order._id);
  const product = await Product.findById(order.productId).populate('owner', 'username email');
  if (product) {
    notifyOrderPlaced(fresh, product).catch((err) =>
      logger.error('[Card] notification failed', { orderId: order._id, message: err.message }));
  }
}

async function failOrder(order, reason, result = null) {
  await withTransaction(async (session) => {
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: 'processing' },
      {
        $set: {
          paymentStatus: 'failed', status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason,
          'paymentMetadata.failureReason': reason, 'paymentMetadata.failedAt': new Date(),
          ...(result && { gateway: gatewayFields(result) }),
        },
      },
      { session }
    );
    if (!updated) throw new AlreadyProcessed();

    if (order.walletDeduction > 0) {
      await transfer({
        senderId: platformWalletId(), receiverId: order.buyerId, amount: order.walletDeduction,
        transactionId: `RELEASE_${order._id}`, description: `Released hold for order ${order._id}`,
        referenceId: String(order._id), type: 'refund', source: 'purchase',
      }, session);
    }
    await Product.updateOne({ _id: order.productId }, { $inc: { quantity: 1 } }, { session });
  });
  logger.info(`[Card] Order ${order._id} failed: ${reason}`);
  notifyOrderEvent(order, 'payment_failed');
}

// Apply a signature-verified gateway result (from the callback, the browser return, or a status
// check). Safe to call any number of times for the same order.
async function applyGatewayResult(result) {
  const order = await Order.findOne({ paymentOrderId: result.gatewayOrderId });
  if (!order) {
    logger.error('[Card] Result for unknown gateway order', { gatewayOrderId: result.gatewayOrderId });
    return { outcome: 'unknown_order' };
  }
  if (REVERSAL_TRTYPES.includes(String(result.raw?.TRTYPE || '').trim())) return applyReversalResult(order, result);

  if (order.paymentStatus !== 'processing') {
    // A genuine approval for an order we already failed under a different bank reference means the
    // buyer may have been charged without getting the order (e.g. a forged decline won the race).
    if (order.paymentStatus === 'failed' && result.approved && result.approvalCode && result.intRef !== order.gateway?.intRef) {
      await flagForReview(order, 'Approval received after the order was marked failed', result);
      return { outcome: 'review', order };
    }
    return { outcome: 'already_processed', order };
  }

  const cfg = getConfig();
  const problems = resultMismatches(result, order, cfg);
  if (problems.length) {
    await flagForReview(order, `Gateway result does not match the order: ${problems.join('; ')}`, result);
    return { outcome: 'mismatch', order };
  }

  try {
    if (result.approved) {
      if (!result.approvalCode || !result.rrn || !result.intRef) {
        await flagForReview(order, 'Approved without an approval code / bank reference', result);
        return { outcome: 'review', order };
      }
      if (await Order.exists({ 'gateway.intRef': result.intRef, _id: { $ne: order._id } })) {
        await flagForReview(order, 'Bank reference already used by another order', result);
        return { outcome: 'review', order };
      }
      await completeOrder(order, result);
      return { outcome: 'completed', order };
    }
    await failOrder(order, `Card payment not approved (ACTION ${result.action}, RC ${result.responseCode})`, result);
    return { outcome: 'failed', order };
  } catch (err) {
    if (err instanceof AlreadyProcessed) return { outcome: 'already_processed', order };
    if (err.code === 11000) {
      await flagForReview(order, 'Bank reference already used by another order', result);
      return { outcome: 'review', order };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------------------------
// Reversal (full refund to the card) of an approved card payment: TRTYPE 22, or 24 (offline).
//   request : POST the signed reversal to the gateway; the order itself is not touched yet
//   approved: order refunded + cancelled, card money taken back from the seller   (REVERSAL_<order>)
//             wallet part returned seller -> buyer                                 (REFUND_<order>)
//             item back in stock
// Only the bank's signed result (callback) changes the order.

async function findOrderByRef(orderRef) {
  const ref = String(orderRef || '').trim();
  if (mongoose.isValidObjectId(ref)) {
    const byId = await Order.findById(ref);
    if (byId) return byId;
  }
  return Order.findOne({ paymentOrderId: ref });
}

async function requestCardReversal(orderRef, { trtype = TRTYPE.REVERSAL, reason = 'Card payment reversed' } = {}) {
  if (!REVERSAL_TRTYPES.includes(trtype)) throw new WalletError('INVALID_TRTYPE', 'TRTYPE must be 22 or 24');
  const order = await findOrderByRef(orderRef);
  if (!order) throw new WalletError('ORDER_NOT_FOUND', 'Order not found', 404);
  if (order.paymentStatus !== 'completed' || !(order.onlineAmount > 0)) {
    throw new WalletError('NOT_REVERSIBLE', `Only a completed card payment can be reversed (this order is ${order.paymentStatus})`, 409);
  }
  if (!order.gateway?.rrn || !order.gateway?.intRef) {
    throw new WalletError('NO_BANK_REFERENCE', 'The order has no RRN / INT_REF from the bank', 409);
  }

  const reversal = buildReversalFields({
    gatewayOrderId: order.paymentOrderId, amount: order.onlineAmount,
    rrn: order.gateway.rrn, intRef: order.gateway.intRef, trtype,
  });
  // One reversal per order; a send that failed ('error') may be retried.
  const claimed = await Order.updateOne(
    { _id: order._id, paymentStatus: 'completed', 'paymentMetadata.reversal.status': { $nin: ['sending', 'sent', 'approved'] } },
    { $set: { 'paymentMetadata.reversal': { status: 'sending', trtype, reason, requestedAt: new Date() } } }
  );
  if (claimed.modifiedCount !== 1) throw new WalletError('REVERSAL_IN_PROGRESS', 'A reversal was already requested for this order', 409);

  let response;
  try {
    response = await sendReversal(reversal);
  } catch (err) {
    await Order.updateOne({ _id: order._id }, { $set: { 'paymentMetadata.reversal.status': 'error', 'paymentMetadata.reversal.error': err.message } });
    logger.error(`[Card] Reversal for order ${order._id} could not be sent: ${err.message}`);
    throw err;
  }
  await Order.updateOne({ _id: order._id }, {
    $set: { 'paymentMetadata.reversal.sentAt': new Date(), 'paymentMetadata.reversal.bankResponse': response },
  });
  // The callback may already have answered while we waited for the HTTP response.
  await Order.updateOne({ _id: order._id, 'paymentMetadata.reversal.status': 'sending' }, { $set: { 'paymentMetadata.reversal.status': 'sent' } });

  logger.info(`[Card] Reversal TRTYPE ${trtype} sent: order ${order._id}, gateway order ${order.paymentOrderId}, `
    + `RRN ${order.gateway.rrn}, INT_REF ${order.gateway.intRef}, ₼${order.onlineAmount} -> HTTP ${response.httpStatus} ${JSON.stringify(response.body.slice(0, 500))}`);
  notifyOrderEvent(order, 'refund_started', { reason });
  const { P_SIGN, ...signedFields } = reversal.fields;
  return { orderId: String(order._id), request: signedFields, response };
}

async function applyReversalResult(order, result) {
  const trtype = String(result.raw?.TRTYPE).trim();
  const record = { ...gatewayFields(result), trtype, raw: result.raw };
  const problems = resultMismatches(result, order, getConfig());
  if (problems.length) {
    await flagForReview(order, `Reversal result does not match the order: ${problems.join('; ')}`, result);
    return { outcome: 'mismatch', order };
  }

  if (!result.approved) {
    await Order.updateOne({ _id: order._id }, { $set: { 'paymentMetadata.reversal.status': 'declined', 'paymentMetadata.reversal.result': record } });
    notifyOrderEvent(order, 'refund_failed');
    logger.warn(`[Card] Reversal declined by the bank: order ${order._id} (ACTION ${result.action}, RC ${result.responseCode}) | ${JSON.stringify(result.raw)}`);
    return { outcome: 'reversal_declined', order };
  }
  if (order.paymentStatus === 'refunded') return { outcome: 'already_processed', order };
  if (order.paymentStatus !== 'completed') {
    await flagForReview(order, `Reversal approved for an order that is ${order.paymentStatus}`, result);
    return { outcome: 'review', order };
  }

  const reversedFields = {
    paymentStatus: 'refunded', status: 'cancelled', cancelledAt: new Date(),
    cancellationReason: order.paymentMetadata?.reversal?.reason || 'Card payment reversed',
    'paymentMetadata.reversal.status': 'approved',
    'paymentMetadata.reversal.result': record,
    'paymentMetadata.reversal.approvedAt': new Date(),
  };
  try {
    await withTransaction(async (session) => {
      const updated = await Order.findOneAndUpdate({ _id: order._id, paymentStatus: 'completed' }, { $set: reversedFields }, { session });
      if (!updated) throw new AlreadyProcessed();
      await debitToGateway({
        senderId: order.sellerId, receiverId: order.buyerId, amount: order.onlineAmount,
        transactionId: `REVERSAL_${order._id}`, description: `Card payment reversed for order ${order._id}`,
        referenceId: String(order._id),
      }, session);
      if (order.walletDeduction > 0) {
        await transfer({
          senderId: order.sellerId, receiverId: order.buyerId, amount: order.walletDeduction,
          transactionId: `REFUND_${order._id}`, description: `Wallet part refunded for order ${order._id}`,
          referenceId: String(order._id), type: 'refund', source: 'purchase',
        }, session);
      }
      await Product.updateOne({ _id: order.productId }, { $inc: { quantity: 1 } }, { session });
    });
  } catch (err) {
    if (err instanceof AlreadyProcessed) return { outcome: 'already_processed', order };
    if (err instanceof WalletError && err.code === 'INSUFFICIENT_BALANCE') {
      // The bank has already returned the money: record that, and leave the wallets to a person.
      await Order.updateOne({ _id: order._id, paymentStatus: 'completed' }, { $set: reversedFields });
      await flagForReview(order, 'Card payment reversed at the bank, but the seller wallet could not cover it', result);
      notifyOrderEvent(order, 'refund_completed');
      return { outcome: 'review', order };
    }
    throw err;
  }
  logger.info(`[Card] Order ${order._id} reversed (TRTYPE ${trtype}, RRN ${result.rrn}, INT_REF ${result.intRef})`);
  notifyOrderEvent(order, 'refund_completed');
  return { outcome: 'reversed', order };
}

// For orders stuck in "processing" (lost callback, closed tab): ask the gateway what happened, or —
// where no status check exists yet — flag them for a person to resolve. Never auto-fail an order the
// bank may have charged.
async function reconcileStaleCardOrders({ now = new Date() } = {}) {
  const cfg = getConfig();
  const cutoff = new Date(now.getTime() - cfg.staleAfterMinutes * 60 * 1000);
  const stale = await Order.find({
    paymentStatus: 'processing',
    createdAt: { $lt: cutoff },
    'paymentMetadata.needsReview': { $ne: true },
  });
  const summary = { checked: stale.length, completed: 0, failed: 0, pending: 0, review: 0, errors: 0 };

  for (const order of stale) {
    try {
      const status = await queryStatus(order.paymentOrderId);
      if (status.pending) {
        summary.pending += 1;
      } else if (status.found === false) {
        await failOrder(order, 'Payment was not completed at the bank');
        summary.failed += 1;
      } else {
        const { outcome } = await applyGatewayResult(status);
        if (outcome in summary) summary[outcome] += 1;
      }
    } catch (err) {
      if (err instanceof AlreadyProcessed) continue;
      if (err instanceof StatusCheckUnsupported) {
        await flagForReview(order, 'No result from the bank; status check not available yet');
        notifyOrderEvent(order, 'payment_review');
        summary.review += 1;
        continue;
      }
      summary.errors += 1;
      logger.error('[Card] Reconciliation failed for order', { orderId: order._id, message: err.message });
    }
  }
  if (stale.length) logger.info('[Card] Reconciliation run', summary);
  return summary;
}

let reconcileTimer = null;
function startReconciliationLoop(intervalMs = 60 * 1000) {
  if (process.env.AZERICARD_ENABLED !== 'true') return;
  let enabled = false;
  try {
    enabled = getConfig().enabled;
  } catch (err) {
    logger.error('[Card] Not starting reconciliation: Azericard configuration error', { message: err.message });
  }
  if (reconcileTimer || !enabled) return;
  reconcileTimer = setInterval(() => {
    reconcileStaleCardOrders().catch((err) => logger.error('[Card] Reconciliation loop error', { message: err.message }));
  }, intervalMs);
  reconcileTimer.unref();
  logger.info(`[Card] Reconciliation loop started (every ${intervalMs / 1000}s, stale after ${getConfig().staleAfterMinutes} min)`);
}

module.exports = { startCardCheckout, applyGatewayResult, requestCardReversal, reconcileStaleCardOrders, startReconciliationLoop };
