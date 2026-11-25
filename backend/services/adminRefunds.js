// Refunds are started by an admin only (buyers and sellers ask through support).
//   wallet order : money goes back seller -> buyer at once (REFUND_<order>), item restocked
//   card / mixed : a reversal is sent to Azericard; the order is refunded when the bank confirms
//                  (see requestCardReversal / applyReversalResult in cardPayments.js)
// Buyer and seller are notified at every step.
const Order = require('../models/Order');
const Product = require('../models/product.model');
const logger = require('../utils/logger');
const { WalletError, withTransaction, transfer } = require('./walletLedger');
const { requestCardReversal } = require('./cardPayments');
const { notifyOrderEvent } = require('./orderNotifications');

async function refundOrder(orderId, { reason = 'Refunded by SATGO', adminId } = {}) {
  const order = await Order.findById(orderId);
  if (!order) throw new WalletError('ORDER_NOT_FOUND', 'Order not found', 404);
  if (order.paymentStatus === 'processing') {
    throw new WalletError('PAYMENT_IN_PROGRESS', 'The payment is still being confirmed by the bank', 409);
  }
  if (order.paymentStatus === 'refunded') throw new WalletError('ALREADY_REFUNDED', 'This order was already refunded', 409);
  if (order.paymentStatus !== 'completed') throw new WalletError('NOT_PAID', 'This order was not paid, there is nothing to refund', 409);

  if (order.onlineAmount > 0) {
    const out = await requestCardReversal(String(order._id), { reason });
    logger.info(`[Refund] Card reversal started by admin ${adminId} for order ${order._id}: ${reason}`);
    return { orderId: String(order._id), mode: 'card', status: 'waiting_for_bank', bankResponse: out.response };
  }

  const refundAmount = order.paidAmount || order.total;
  try {
    await withTransaction(async (session) => {
      const updated = await Order.updateOne(
        { _id: order._id, paymentStatus: 'completed' },
        {
          $set: {
            paymentStatus: 'refunded', status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason,
            'paymentMetadata.refund': { by: adminId ? String(adminId) : null, reason, amount: refundAmount, at: new Date() },
          },
        },
        { session }
      );
      if (updated.modifiedCount !== 1) throw new WalletError('ALREADY_REFUNDED', 'This order was already refunded', 409);
      await transfer({
        senderId: order.sellerId, receiverId: order.buyerId, amount: refundAmount,
        transactionId: `REFUND_${order._id}`, description: `Refund for order ${order._id}`,
        referenceId: String(order._id), type: 'refund', source: 'purchase',
      }, session);
      await Product.updateOne({ _id: order.productId }, { $inc: { quantity: 1 } }, { session });
    });
  } catch (err) {
    if (err instanceof WalletError && err.code === 'INSUFFICIENT_BALANCE') {
      throw new WalletError('SELLER_BALANCE_TOO_LOW', 'The seller wallet does not hold enough to refund this order', 409);
    }
    throw err;
  }
  logger.info(`[Refund] Wallet order ${order._id} refunded ₼${refundAmount} by admin ${adminId}: ${reason}`);
  notifyOrderEvent(order, 'refund_completed');
  return { orderId: String(order._id), mode: 'wallet', status: 'refunded', amount: refundAmount };
}

// Admin "cancel": a paid order is refunded; an unpaid one is just cancelled.
async function cancelOrderByAdmin(orderId, { reason = 'Cancelled by SATGO', adminId } = {}) {
  const order = await Order.findById(orderId);
  if (!order) throw new WalletError('ORDER_NOT_FOUND', 'Order not found', 404);
  if (['cancelled', 'delivered', 'released'].includes(order.status)) {
    throw new WalletError('CANNOT_CANCEL', `Order already ${order.status}, cannot cancel`, 400);
  }
  if (order.paymentStatus === 'completed') return refundOrder(orderId, { reason, adminId });
  if (order.paymentStatus === 'processing') {
    throw new WalletError('PAYMENT_IN_PROGRESS', 'The payment is still being confirmed by the bank', 409);
  }

  const updated = await Order.updateOne(
    { _id: order._id, status: order.status },
    { $set: { status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason } }
  );
  if (updated.modifiedCount !== 1) throw new WalletError('CANNOT_CANCEL', 'Order changed, try again', 409);
  logger.info(`[Refund] Unpaid order ${order._id} cancelled by admin ${adminId}: ${reason}`);
  notifyOrderEvent(order, 'order_cancelled', { reason });
  return { orderId: String(order._id), mode: 'none', status: 'cancelled' };
}

module.exports = { refundOrder, cancelOrderByAdmin };
