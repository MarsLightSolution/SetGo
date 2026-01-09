const Paymentwall = require('paymentwall');
const Payment = require('../models/payment.model');
const User = require('../models/user');
const {onlineWalletTransfer} =require('../controller/transaction.controller');
const logger = require('../utils/logger');

// Configure Paymentwall once at module level
// SECURITY: Credentials moved to environment variables
if (!process.env.PAYMENTWALL_PROJECT_KEY || !process.env.PAYMENTWALL_SECRET_KEY) {
  throw new Error('PAYMENTWALL_PROJECT_KEY and PAYMENTWALL_SECRET_KEY must be set in environment variables');
}

Paymentwall.Configure(
  Paymentwall.Base.API_GOODS,
  process.env.PAYMENTWALL_PROJECT_KEY,
  process.env.PAYMENTWALL_SECRET_KEY
);

exports.createPayment = async (userId,receiverId, amount, product, source, email) => {
  try {
    if (!userId || !amount || !product) {
      throw new Error('Missing required parameters (userId, amount, product)');
    }

    const orderId = `order_${Date.now()}`;
    logger.debug('createPayment called', { amount, product, userId, receiverId });
    // Create a pending payment record
    await Payment.create({
      referenceId: product,
      userId,
      receiverId,
      amount,
      status: 'PENDING'
    });

    // Create Paymentwall widget
    const widget = new Paymentwall.Widget(
      userId,
      process.env.PW_WIDGET || 'p1_1',
      [
        new Paymentwall.Product(
          product,
          amount,
          'AZN',
          source || 'purchase',
          Paymentwall.Product.TYPE_FIXED
        ),
      ],
      {
        email: email || 'noemail@provided.com',
        reference_id: orderId,
      }
    );

    const url = widget.getUrl();

    return url; // Let controller send response
  } catch (error) {
    logger.error('Error in createPayment service', { message: error.message, stack: error.stack });
    throw new Error('Payment creation failed');
  }
};

exports.handlePingback = async (req, res) => {
  try {
    const pingback = new Paymentwall.Pingback(req.query, req.ip);

    // Validate the pingback signature
    logger.debug('Payment pingback received', { ip: req.ip });

    // SECURITY: Enable signature validation in production
    if (process.env.NODE_ENV === 'production') {
      if (!pingback.validate()) {
        logger.warn('Invalid Paymentwall pingback signature', { query: req.query });
        return res.status(400).send('Invalid pingback');
      }
    } else {
      logger.warn('Pingback signature validation DISABLED in development mode');
    }
    logger.debug('handlePingback - signature checked');
    const orderId = req.query.ref; // <-- use `ref` from query as your order ID
    if (!orderId) {
      logger.warn('Missing `ref` in pingback query', { query: req.query });
      return res.status(400).send('Missing reference ID');
    }
    logger.debug('handlePingback - orderId present', { orderId });
 
    // Check if the payment record exists
    logger.debug('handlePingback - looking up payment', { goodsid: req.query.goodsid });
    const payment = await Payment.findOne({referenceId : req.query.goodsid });
    if (!payment) {
      logger.warn('No payment found for referenceId', { goodsid: req.query.goodsid });
      return res.status(404).send('Payment not found');
    }
    logger.debug('handlePingback - payment found', { paymentId: payment._id, status: payment.status });

    // Idempotency: Skip if already paid
    if (payment.status === 'PAID') {
      logger.info('Payment already marked PAID for order', { orderId });
      return res.send('OK');
    }

    // Update payment record
    payment.status = 'PAID';
    payment.paymentwallData = req.query; // Save pingback data
    await payment.save();

    const receiverId = payment.receiverId;
    if (!receiverId) {
      logger.warn('Missing receiverId for order', { orderId });
      // You may still proceed depending on your logic
    }
    logger.debug('handlePingback - proceeding to wallet transfer');

    // Perform wallet transfer from buyer to seller
    try {
      logger.debug('wallet transfer details', { senderId: payment.userId, receiverId: payment.receiverId, amount: payment.amount });
      
      await onlineWalletTransfer({
        senderId: payment.userId,
        receiverId:payment.receiverId,
        amount: payment.amount,
        transactionId: req.query.ref,
        description: ` Online transfer for order ${orderId}`,
      });
      logger.info('Wallet transfer success for order', { orderId });
    } catch (walletErr) {
      logger.error('Wallet transfer failed', { message: walletErr.message, stack: walletErr.stack });
      // Still respond OK to avoid Paymentwall retries
    }
    logger.debug('handlePingback - wallet transfer attempted');

    // Emit status update to frontend via socket.io
    const io = req.app.get('io');
    if (io && io.paymentOrderSockets?.has(orderId)) {
      const socketId = io.paymentOrderSockets.get(orderId);
      io.to(socketId).emit('paymentUpdate', { status: 'PAID', orderId });
      io.paymentOrderSockets.delete(orderId);
    }
    logger.debug('handlePingback - done');

    // Acknowledge Paymentwall
    return 'OK';
  } catch (error) {
    logger.error('Error in handlePingback', { message: error.message, stack: error.stack });
    return res.status(500).send('Internal Server Error');
  }
};
