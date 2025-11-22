// routes/webhook.routes.js
// Main Backend - Webhook Handler for Payment Microservice

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/user');

// Webhook secret (shared with payment microservice)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * Middleware to verify webhook is from payment microservice
 */
const verifyWebhookSecret = (req, res, next) => {
  const webhookSecret = req.headers['x-webhook-secret'];
  
  if (!webhookSecret) {
    console.warn('[Webhook] Missing webhook secret');
    return res.status(401).json({
      success: false,
      message: 'Webhook authentication required'
    });
  }
  
  if (webhookSecret !== WEBHOOK_SECRET) {
    console.warn('[Webhook] Invalid webhook secret from IP:', req.ip);
    return res.status(403).json({
      success: false,
      message: 'Invalid webhook credentials'
    });
  }
  
  console.log('[Webhook] Authentication successful');
  next();
};

/**
 * 🎯 WEBHOOK: Payment Completed
 * POST /api/webhooks/payment-completed
 * 
 * Called by payment microservice when payment succeeds
 */
router.post('/payment-completed', verifyWebhookSecret, async (req, res) => {
  try {
    const {
      orderId,        // Payment microservice order ID (e.g., ORD1700012345678912)
      transactionId,  // Azericard transaction ID (e.g., TXN123456789)
      amount,         // Amount paid online
      currency,
      metadata        // Contains mainOrderId, productId, etc.
    } = req.body;

    console.log(`[Webhook] Payment completed webhook received for order ${orderId}`);
    console.log(`[Webhook] Transaction ID: ${transactionId}, Amount: ${amount} ${currency}`);

    // ========= STEP 1: FIND ORDER =========
    
    const mainOrderId = metadata.mainOrderId;
    
    if (!mainOrderId) {
      console.error('[Webhook] No mainOrderId in metadata');
      return res.status(400).json({
        success: false,
        message: 'Missing mainOrderId in metadata'
      });
    }

    const order = await Order.findById(mainOrderId);

    if (!order) {
      console.error(`[Webhook] Order not found: ${mainOrderId}`);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if already processed (idempotency)
    if (order.paymentStatus === 'completed' && order.transactionId === transactionId) {
      console.log(`[Webhook] Order ${mainOrderId} already processed. Skipping.`);
      return res.json({
        success: true,
        message: 'Webhook already processed',
        data: { orderId: order._id }
      });
    }

    console.log(`[Webhook] Processing payment for order ${order._id}`);

    // ========= STEP 2: UPDATE ORDER =========
    
    order.paymentOrderId = orderId;
    order.transactionId = transactionId;
    order.paymentStatus = 'completed';
    order.paidAmount = (order.walletDeduction || 0) + amount; // Wallet + Online
    order.status = 'paid';
    order.paidAt = new Date();
    
    // Add transaction details to metadata
    order.paymentMetadata = {
      ...order.paymentMetadata,
      transactionId: transactionId,
      paymentCompletedAt: new Date(),
      onlinePaymentAmount: amount,
      currency: currency
    };

    await order.save();

    console.log(`[Webhook] Order ${order._id} updated to paid status`);

    // ========= STEP 3: UPDATE PRODUCT STOCK =========
    
    try {
      const product = await Product.findById(order.productId);
      
      if (product) {
        if (product.stock > 0) {
          product.stock -= 1;
          await product.save();
          console.log(`[Webhook] Product ${product._id} stock reduced to ${product.stock}`);
        } else {
          console.warn(`[Webhook] Product ${product._id} already out of stock`);
        }
      } else {
        console.warn(`[Webhook] Product ${order.productId} not found`);
      }
    } catch (error) {
      console.error('[Webhook] Error updating product stock:', error);
      // Continue processing even if stock update fails
    }

    // ========= STEP 4: UPDATE SELLER WALLET =========
    
    try {
      const seller = await User.findById(order.sellerId);
      
      if (seller) {
        // Add full amount to seller's wallet (wallet + online payment)
        const sellerEarnings = order.paidAmount;
        
        seller.walletBalance = (seller.walletBalance || 0) + sellerEarnings;
        await seller.save();
        
        console.log(`[Webhook] Added ₼${sellerEarnings} to seller ${seller._id} wallet`);
      } else {
        console.warn(`[Webhook] Seller ${order.sellerId} not found`);
      }
    } catch (error) {
      console.error('[Webhook] Error updating seller wallet:', error);
      // Continue processing even if wallet update fails
    }

    // ========= STEP 5: UPDATE BUYER PURCHASE HISTORY =========
    
    try {
      const buyer = await User.findById(order.buyerId);
      
      if (buyer) {
        // Add order to buyer's purchase history
        if (!buyer.orders) {
          buyer.orders = [];
        }
        
        if (!buyer.orders.includes(order._id)) {
          buyer.orders.push(order._id);
        }
        
        await buyer.save();
        
        console.log(`[Webhook] Updated buyer ${buyer._id} purchase history`);
      }
    } catch (error) {
      console.error('[Webhook] Error updating buyer history:', error);
      // Continue processing
    }

    // ========= STEP 6: SEND EMAIL NOTIFICATIONS (Optional) =========
    
    // TODO: Send email to buyer confirming payment
    // TODO: Send email to seller about new order
    
    // Example:
    // await sendEmail({
    //   to: order.checkoutDetails.email,
    //   subject: 'Payment Successful',
    //   template: 'payment-success',
    //   data: {
    //     orderId: order._id,
    //     amount: order.paidAmount,
    //     productTitle: metadata.productTitle
    //   }
    // });

    // ========= STEP 7: LOG SUCCESS =========
    
    console.log(`[Webhook] ✅ Payment webhook processed successfully for order ${order._id}`);
    console.log(`[Webhook] Summary:`);
    console.log(`  - Order ID: ${order._id}`);
    console.log(`  - Transaction ID: ${transactionId}`);
    console.log(`  - Total Paid: ₼${order.paidAmount}`);
    console.log(`  - Wallet: ₼${order.walletDeduction}`);
    console.log(`  - Online: ₼${amount}`);
    console.log(`  - Status: ${order.status}`);

    // ========= STEP 8: RETURN SUCCESS RESPONSE =========
    
    res.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paidAmount: order.paidAmount
      }
    });

  } catch (error) {
    console.error('[Webhook] Error processing payment webhook:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error.message
    });
  }
});

/**
 * 🎯 WEBHOOK: Payment Failed
 * POST /api/webhooks/payment-failed
 * 
 * Called by payment microservice when payment fails
 */
router.post('/payment-failed', verifyWebhookSecret, async (req, res) => {
  try {
    const {
      orderId,
      reason,
      metadata
    } = req.body;

    console.log(`[Webhook] Payment failed webhook received for order ${orderId}`);
    console.log(`[Webhook] Reason: ${reason}`);

    const mainOrderId = metadata.mainOrderId;
    const order = await Order.findById(mainOrderId);

    if (!order) {
      console.error(`[Webhook] Order not found: ${mainOrderId}`);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status
    order.paymentStatus = 'failed';
    order.paymentMetadata = {
      ...order.paymentMetadata,
      failureReason: reason,
      failedAt: new Date()
    };
    await order.save();

    // Refund wallet if it was deducted
    if (order.walletDeduction > 0) {
      const buyer = await User.findById(order.buyerId);
      if (buyer) {
        buyer.walletBalance = (buyer.walletBalance || 0) + order.walletDeduction;
        await buyer.save();
        
        console.log(`[Webhook] Refunded ₼${order.walletDeduction} to buyer's wallet`);
      }
    }

    console.log(`[Webhook] Payment failure processed for order ${order._id}`);

    res.json({
      success: true,
      message: 'Payment failure processed',
      data: {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus
      }
    });

  } catch (error) {
    console.error('[Webhook] Error processing payment failure webhook:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error.message
    });
  }
});

/**
 * 🎯 WEBHOOK: Health Check
 * GET /api/webhooks/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;