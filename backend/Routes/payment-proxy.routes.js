// routes/payment-proxy.routes.js — checkout, order status, order list, cancel.
// Mounted at /api/payments.

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const authenticateUser = require('../middlewares/auth.middlewares');
const Order = require('../models/Order');
const Product = require('../models/product.model');
const logger = require('../utils/logger');
const { WalletError, withTransaction, transfer } = require('../services/walletLedger');
const { notifyOrderPlaced } = require('../services/orderNotifications');
const { startCardCheckout } = require('../services/cardPayments');
const { cardPaymentsAllowedFor } = require('../services/azericard/config');

function cardPaymentsEnabled(user) {
  if (process.env.AZERICARD_ENABLED !== 'true') return false;
  try {
    return cardPaymentsAllowedFor(user);
  } catch (err) {
    logger.error('[Checkout] Azericard configuration error', { message: err.message });
    return false;
  }
}

const round2 = (n) => Math.round(n * 100) / 100;
const CHECKOUT_FIELDS = ['name', 'email', 'address', 'city', 'pincode'];

const sendWalletError = (res, err) =>
  res.status(err.status).json({ success: false, code: err.code, message: err.message });

/**
 * POST /api/payments/initiate
 * Body: { productId, walletDeduction (or walletAmount), checkoutDetails }
 * The buyer is always the authenticated user.
 */
router.post('/initiate', authenticateUser, async (req, res) => {
  try {
    const buyerId = String(req.user._id);
    const { productId, checkoutDetails } = req.body;
    const walletDeduction = round2(Number(req.body.walletDeduction ?? req.body.walletAmount ?? 0));

    if (req.body.buyerId && String(req.body.buyerId) !== buyerId) {
      return res.status(403).json({ success: false, code: 'BUYER_MISMATCH', message: 'buyerId does not match the logged-in user' });
    }
    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }
    if (!Number.isFinite(walletDeduction) || walletDeduction < 0) {
      return res.status(400).json({ success: false, message: 'Invalid wallet deduction amount' });
    }
    if (!checkoutDetails || CHECKOUT_FIELDS.some((f) => !checkoutDetails[f])) {
      return res.status(400).json({
        success: false,
        code: 'INCOMPLETE_CHECKOUT_DETAILS',
        message: 'Incomplete checkout details. Name, email, address, city, and pincode are required.',
      });
    }

    const product = await Product.findById(productId).populate('owner', 'username email');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const sellerId = String(product.owner._id);
    if (sellerId === buyerId) {
      return res.status(400).json({ success: false, code: 'OWN_PRODUCT', message: 'You cannot buy your own product' });
    }
    if (!(product.quantity > 0)) {
      return res.status(409).json({ success: false, code: 'OUT_OF_STOCK', message: 'Product is out of stock' });
    }

    const total = product.price;
    if (walletDeduction > total) {
      return res.status(400).json({ success: false, message: 'Wallet deduction exceeds the product price' });
    }
    const onlineAmount = round2(total - walletDeduction);

    if (onlineAmount > 0) {
      if (!cardPaymentsEnabled(req.user)) {
        logger.warn('[Checkout] Card payment attempted while card payments are disabled', { buyerId, productId, onlineAmount });
        return res.status(503).json({
          success: false,
          code: 'ONLINE_PAYMENT_UNAVAILABLE',
          message: 'Online card payments are not available yet. Please use your wallet balance, or contact support for other options.',
        });
      }
      const { order, gateway } = await startCardCheckout({
        buyerId,
        product,
        total,
        walletDeduction,
        onlineAmount,
        checkoutDetails: Object.fromEntries(CHECKOUT_FIELDS.map((f) => [f, String(checkoutDetails[f])])),
        lang: req.body.lang,
      });
      return res.json({
        success: true,
        paymentMethod: walletDeduction > 0 ? 'mixed' : 'card',
        completed: false,
        data: { orderId: order._id, gateway },
      });
    }

    const orderId = new mongoose.Types.ObjectId();
    const transactionId = `WALLET_${orderId}`;
    const productTitle = product.title?.en || String(product._id);

    const order = await withTransaction(async (session) => {
      const reserved = await Product.updateOne(
        { _id: product._id, quantity: { $gt: 0 } },
        { $inc: { quantity: -1 } },
        { session }
      );
      if (reserved.modifiedCount !== 1) {
        throw new WalletError('OUT_OF_STOCK', 'Product is out of stock', 409);
      }

      if (total > 0) {
        await transfer({
          senderId: buyerId,
          receiverId: sellerId,
          amount: total,
          transactionId,
          description: `Purchase: ${productTitle}`,
          referenceId: String(orderId),
          type: 'transfer',
          source: 'purchase',
        }, session);
      }

      const [created] = await Order.create([{
        _id: orderId,
        buyerId,
        sellerId,
        productId: product._id,
        total,
        walletDeduction: total,
        onlineAmount: 0,
        paidAmount: total,
        status: 'paid',
        paymentStatus: 'completed',
        paidAt: new Date(),
        transactionId,
        checkoutDetails: Object.fromEntries(CHECKOUT_FIELDS.map((f) => [f, String(checkoutDetails[f])])),
        paymentMetadata: { productTitle, productPrice: total },
      }], { session });
      return created;
    });

    logger.info(`[Checkout] Wallet payment completed for order ${order._id}`);
    notifyOrderPlaced(order, product).catch((err) =>
      logger.error('[Checkout] notification failed', { orderId: order._id, message: err.message })
    );

    return res.json({
      success: true,
      paymentMethod: 'wallet',
      completed: true,
      data: {
        orderId: order._id,
        message: 'Payment completed successfully using wallet',
        order: {
          id: order._id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total,
          paidAmount: order.paidAmount,
        },
      },
    });
  } catch (error) {
    if (error instanceof WalletError) return sendWalletError(res, error);
    logger.error('[Checkout] Error initiating payment', { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Failed to initiate payment' });
  }
});

/**
 * GET /api/payments/order/:orderId — by order id or gateway payment order id
 */
router.get('/order/:orderId', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = String(req.user._id);

    const query = mongoose.isValidObjectId(orderId) ? { _id: orderId } : { paymentOrderId: orderId };
    const order = await Order.findOne(query)
      .populate('productId')
      .populate('sellerId', 'name email')
      .populate('buyerId', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (String(order.buyerId._id) !== userId && String(order.sellerId._id) !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this order' });
    }

    res.json({
      success: true,
      data: {
        order: {
          id: order._id,
          buyerId: order.buyerId._id,
          buyerName: order.buyerId.name,
          sellerId: order.sellerId._id,
          sellerName: order.sellerId.name,
          product: order.productId && {
            id: order.productId._id,
            title: order.productId.title,
            price: order.productId.price,
            image: order.productId.pictures?.[0],
          },
          total: order.total,
          walletDeduction: order.walletDeduction,
          onlineAmount: order.onlineAmount,
          paidAmount: order.paidAmount,
          paymentMethod: order.paymentMethod,
          status: order.status,
          paymentStatus: order.paymentStatus,
          transactionId: order.transactionId,
          paidAt: order.paidAt,
          checkoutDetails: order.checkoutDetails,
          trackingId: order.trackingId,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error('[Payments] Error fetching order', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to fetch order details' });
  }
});

/**
 * GET /api/payments/orders?role=buyer|seller&status=
 */
router.get('/orders', authenticateUser, async (req, res) => {
  try {
    const userId = String(req.user._id);
    const { role = 'buyer', status } = req.query;

    let orders;
    if (role === 'buyer') {
      orders = await Order.getBuyerOrders(userId, { status });
    } else if (role === 'seller') {
      orders = await Order.getSellerOrders(userId, { status });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be "buyer" or "seller"' });
    }

    res.json({
      success: true,
      data: {
        orders: orders.map((order) => ({
          id: order._id,
          productId: order.productId?._id,
          productTitle: order.productId?.title,
          productImage: order.productId?.pictures?.[0],
          total: order.total,
          paidAmount: order.paidAmount,
          paymentMethod: order.paymentMethod,
          status: order.status,
          paymentStatus: order.paymentStatus,
          checkoutDetails: order.checkoutDetails,
          createdAt: order.createdAt,
          paidAt: order.paidAt,
        })),
        count: orders.length,
      },
    });
  } catch (error) {
    logger.error('[Payments] Error fetching orders', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

/**
 * POST /api/payments/order/:orderId/cancel — buyer only, before shipping.
 * A paid wallet order is reversed seller -> buyer through the ledger.
 */
router.post('/order/:orderId/cancel', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = String(req.user._id);
    const reason = req.body.reason || 'Cancelled by buyer';

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (String(order.buyerId) !== userId) {
      return res.status(403).json({ success: false, message: 'Only buyer can cancel order' });
    }
    if (!['pending', 'paid'].includes(order.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel order with status: ${order.status}` });
    }
    if (order.paymentStatus === 'processing') {
      return res.status(409).json({
        success: false,
        code: 'PAYMENT_IN_PROGRESS',
        message: 'This payment is still being confirmed by the bank. Please try again in a few minutes.',
      });
    }
    // Refund destination for card money is an open business decision (plan §12.4).
    if (order.onlineAmount > 0 && order.paymentStatus === 'completed') {
      return res.status(409).json({
        success: false,
        code: 'CARD_REFUND_UNSUPPORTED',
        message: 'This order was paid by card. Please contact support to cancel it.',
      });
    }

    const refundAmount = order.paymentStatus === 'completed' ? order.paidAmount : 0;

    await withTransaction(async (session) => {
      const cancelled = await Order.updateOne(
        { _id: order._id, status: { $in: ['pending', 'paid'] } },
        { $set: { status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason, ...(refundAmount > 0 && { paymentStatus: 'refunded' }) } },
        { session }
      );
      if (cancelled.modifiedCount !== 1) {
        throw new WalletError('ALREADY_CANCELLED', 'Order was already cancelled or has moved on', 409);
      }

      if (refundAmount > 0) {
        try {
          await transfer({
            senderId: order.sellerId,
            receiverId: order.buyerId,
            amount: refundAmount,
            transactionId: `REFUND_${order._id}`,
            description: `Refund for cancelled order ${order._id}`,
            referenceId: String(order._id),
            type: 'refund',
            source: 'purchase',
          }, session);
        } catch (err) {
          if (err instanceof WalletError && err.code === 'INSUFFICIENT_BALANCE') {
            throw new WalletError('REFUND_NEEDS_SUPPORT', 'The refund cannot be processed automatically. Please contact support.', 409);
          }
          throw err;
        }
      }

      await Product.updateOne({ _id: order.productId }, { $inc: { quantity: 1 } }, { session });
    });

    logger.info(`[Payments] Order ${order._id} cancelled, refunded ₼${refundAmount}`);
    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { orderId: order._id, status: 'cancelled', refundedAmount: refundAmount },
    });
  } catch (error) {
    if (error instanceof WalletError) return sendWalletError(res, error);
    logger.error('[Payments] Error cancelling order', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
});

module.exports = router;
