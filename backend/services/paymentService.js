const Paymentwall = require('paymentwall');
const Payment = require('../models/payment.model');
const User = require('../models/user');
const {onlineWalletTransfer} =require('../controller/transaction.controller');

// Configure Paymentwall once at module level
Paymentwall.Configure(
  Paymentwall.Base.API_GOODS,
  'be2b2a35356b78cbf499cdac649363e2',
  '57c1c499c2d85db6b1ac8bfe71a009ca'
);

exports.createPayment = async (userId,receiverId, amount, product, source, email) => {
  try {
    if (!userId || !amount || !product) {
      throw new Error('Missing required parameters (userId, amount, product)');
    }

    const orderId = `order_${Date.now()}`;
    console.log(amount);
    // Create a pending payment record
    await Payment.create({
      referenceId: product,
      userId,
      receiverId,
      amount,
      status: 'PENDING'
    });
    // console.log(product);

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
    console.error('❌ Error in createPayment service:', error.message);
    throw new Error('Payment creation failed');
  }
};

exports.handlePingback = async (req, res) => {
  try {
    const pingback = new Paymentwall.Pingback(req.query, req.ip);

    // Validate the pingback signature
    console.log(req.query);
    // if (!pingback.validate()) {
    //   console.warn('Invalid Paymentwall pingback:', req.query);
    //   return res.status(400).send('Invalid pingback');
    // }
    console.log("2");
    const orderId = req.query.ref; // <-- use `ref` from query as your order ID
    if (!orderId) {
      console.warn('Missing `ref` in pingback query:', req.query);
      return res.status(400).send('Missing reference ID');
    }
    console.log("3");
 
    // Check if the payment record exists
    console.log("after "+orderId);
    console.log(req.query.goodsid);
    const payment = await Payment.findOne({referenceId : req.query.goodsid });
    console.log(payment);
    if (!payment) {
      console.warn('No payment found for referenceId:',req.query.goodsid );
      return res.status(404).send('Payment not found');
    }
    console.log("4");

    // Idempotency: Skip if already paid
    if (payment.status === 'PAID') {
      console.log('Payment already marked PAID for order:', orderId);
      return res.send('OK');
    }

    // Update payment record
    payment.status = 'PAID';
    payment.paymentwallData = req.query; // Save pingback data
    await payment.save();

    const receiverId = payment.receiverId;
    if (!receiverId) {
      console.warn('Missing receiverId for order:', orderId);
      // You may still proceed depending on your logic
    }
    console.log("5");

    // Perform wallet transfer from buyer to seller
    try {
      console.log(payment.userId+" senderId "+ payment.receiverId+" receiverId");
      
      await onlineWalletTransfer({
        senderId: payment.userId,
        receiverId:payment.receiverId,
        amount: payment.amount,
        transactionId: req.query.ref,
        description: ` Online transfer for order ${orderId}`,
      });
      console.log('Wallet transfer success for order:', orderId);
    } catch (walletErr) {
      console.error('Wallet transfer failed:', walletErr);
      // Still respond OK to avoid Paymentwall retries
    }
    console.log("6");

    // Emit status update to frontend via socket.io
    const io = req.app.get('io');
    if (io && io.paymentOrderSockets?.has(orderId)) {
      const socketId = io.paymentOrderSockets.get(orderId);
      io.to(socketId).emit('paymentUpdate', { status: 'PAID', orderId });
      io.paymentOrderSockets.delete(orderId);
    }
    console.log("7");

    // Acknowledge Paymentwall
    return 'OK';
  } catch (error) {
    console.error('❌ Error in handlePingback:', error);
    return res.status(500).send('Internal Server Error');
  }
};
