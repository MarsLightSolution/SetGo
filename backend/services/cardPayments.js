// Card (and wallet + card) checkout on top of the Azericard gateway.
//
// Money flow for an order of `total` = walletDeduction + onlineAmount:
//   start    : reserve the item; hold walletDeduction  buyer    -> platform (HOLD_<order>)
//   approved :                 settle walletDeduction  platform -> seller   (SETTLE_<order>)
//              card money onlineAmount credited to seller, paymentMode online  (CARD_<order>)
//   declined : release walletDeduction                 platform -> buyer    (RELEASE_<order>), restock
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/product.model');
const logger = require('../utils/logger');
const { WalletError, withTransaction, transfer, creditFromGateway } = require('./walletLedger');
const { notifyOrderPlaced } = require('./orderNotifications');
const { getConfig } = require('./azericard/config');
const { buildPurchaseForm, queryStatus } = require('./azericard/gateway');
const { newGatewayOrderId, sameAmount, CURRENCY_AZN } = require('./azericard/protocol');

class AlreadyProcessed extends Error {}

function platformWalletId() {
  const id = process.env.Admin_Id;
  if (!id) throw new WalletError('PLATFORM_WALLET_MISSING', 'Card payments are temporarily unavailable', 503);
  return id;
}

async function startCardCheckout({ buyerId, product, total, walletDeduction, onlineAmount, checkoutDetails }) {
  const cfg = getConfig();
  const orderId = new mongoose.Types.ObjectId();
  const gatewayOrderId = newGatewayOrderId();
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
      paymentOrderId: gatewayOrderId,
      checkoutDetails,
      paymentMetadata: { productTitle, productPrice: total, initiatedAt: new Date() },
    }], { session });
    return created;
  });

  const gateway = buildPurchaseForm({
    gatewayOrderId,
    amount: onlineAmount,
    description: productTitle,
    email: checkoutDetails.email,
    returnUrl: cfg.returnUrl(orderId),
  });
  logger.info(`[Card] Checkout started: order ${orderId}, gateway order ${gatewayOrderId}, card ₼${onlineAmount}, wallet ₼${walletDeduction}`);
  return { order, gateway };
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
}

const gatewayFields = (r) => ({
  rrn: r.rrn, intRef: r.intRef, approvalCode: r.approvalCode, responseCode: r.responseCode,
  action: r.action, callbackAt: new Date(),
});

// Apply a signature-verified gateway result. Safe to call any number of times for the same order.
async function applyGatewayResult(result) {
  const order = await Order.findOne({ paymentOrderId: result.gatewayOrderId });
  if (!order) {
    logger.error('[Card] Result for unknown gateway order', { gatewayOrderId: result.gatewayOrderId });
    return { outcome: 'unknown_order' };
  }
  if (order.paymentStatus !== 'processing') return { outcome: 'already_processed', order };

  const cfg = getConfig();
  if (result.terminal !== cfg.terminal || result.currency !== CURRENCY_AZN || !sameAmount(result.amount, order.onlineAmount)) {
    logger.error('[Card] Gateway result does not match the order — left for manual review', {
      orderId: order._id, expected: { amount: order.onlineAmount, terminal: cfg.terminal, currency: CURRENCY_AZN },
      got: { amount: result.amount, terminal: result.terminal, currency: result.currency, approved: result.approved },
    });
    return { outcome: 'mismatch', order };
  }

  try {
    if (result.approved) {
      await completeOrder(order, result);
      return { outcome: 'completed', order };
    }
    await failOrder(order, `Card payment declined (RC ${result.responseCode})`, result);
    return { outcome: 'failed', order };
  } catch (err) {
    if (err instanceof AlreadyProcessed) return { outcome: 'already_processed', order };
    throw err;
  }
}

// For orders stuck in "processing" (lost callback, closed tab): ask the gateway what happened.
async function reconcileStaleCardOrders({ now = new Date() } = {}) {
  const cfg = getConfig();
  const cutoff = new Date(now.getTime() - cfg.staleAfterMinutes * 60 * 1000);
  const stale = await Order.find({ paymentStatus: 'processing', createdAt: { $lt: cutoff } });
  const summary = { checked: stale.length, completed: 0, failed: 0, pending: 0, errors: 0 };

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
        if (outcome === 'completed') summary.completed += 1;
        else if (outcome === 'failed') summary.failed += 1;
      }
    } catch (err) {
      if (err instanceof AlreadyProcessed) continue;
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

module.exports = { startCardCheckout, applyGatewayResult, reconcileStaleCardOrders, startReconciliationLoop };
