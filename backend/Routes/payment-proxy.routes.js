// routes/payment-proxy.routes.js
// Main Backend - Payment Gateway Routes (Updated for Your Order Model)

const express = require('express');
const axios = require('axios');
const router = express.Router();
const authenticateUser = require('../middlewares/auth.middlewares');
const Order = require('../models/Order'); // Your Order model
const Product = require('../models/product.model'); // Your Product model
const User = require('../models/user'); // Your User model

// Environment variables
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001';
const PAYMENT_SERVICE_SECRET = process.env.PAYMENT_SERVICE_SECRET;


router.post('/initiate', authenticateUser, async (req, res) => {
  try {
    const buyerId = req.user.id; // From JWT token
    const { 
      productId, 
      amount: onlineAmount, 
      walletDeduction = 0,
      checkoutDetails 
    } = req.body;

    console.log(`[Payment Gateway] Initiating payment for buyer ${buyerId}`);

    // ========= STEP 1: VALIDATE INPUT =========
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (onlineAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid online payment amount'
      });
    }

    if (walletDeduction < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet deduction amount'
      });
    }

    // Validate checkout details
    if (!checkoutDetails || !checkoutDetails.name || !checkoutDetails.email || 
        !checkoutDetails.address || !checkoutDetails.city || !checkoutDetails.pincode) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete checkout details. Name, email, address, city, and pincode are required.'
      });
    }

    // ========= STEP 2: VERIFY PRODUCT =========
    
    const product = await Product.findById(productId).populate('owner');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < 1) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }

    // Get seller ID (assuming owner field contains seller info)
    const sellerId = product.owner._id || product.owner;

    // ========= STEP 3: VERIFY USER =========
    
    const buyer = await User.findById(buyerId);
    
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    // ========= STEP 4: VERIFY WALLET BALANCE (if using wallet) =========
    
    if (walletDeduction > 0) {
      const walletBalance = buyer.walletBalance || 0;
      
      if (walletDeduction > walletBalance) {
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. You have ₼${walletBalance}, but trying to use ₼${walletDeduction}`
        });
      }
    }

    // ========= STEP 5: CALCULATE TOTAL AMOUNT =========
    
    const totalAmount = product.price;
    const calculatedTotal = walletDeduction + onlineAmount;

    // Verify amounts match
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) { // Allow 1 cent difference for rounding
      return res.status(400).json({
        success: false,
        message: `Payment amount mismatch. Product costs ₼${totalAmount}, but payment is ₼${calculatedTotal}`
      });
    }

    // ========= STEP 6: CREATE ORDER IN DATABASE (PENDING) =========
    
    const order = await Order.create({
      buyerId,
      sellerId,
      productId,
      total: totalAmount,
      walletDeduction: walletDeduction,
      onlineAmount: onlineAmount,
      paidAmount: 0, // Not paid yet
      status: 'pending',
      paymentStatus: 'pending',
      checkoutDetails: {
        name: checkoutDetails.name,
        email: checkoutDetails.email,
        address: checkoutDetails.address,
        city: checkoutDetails.city,
        pincode: checkoutDetails.pincode
      },
      paymentMetadata: {
        initiatedAt: new Date(),
        buyerEmail: buyer.email,
        productTitle: product.title,
        productPrice: product.price
      }
    });

    console.log(`[Payment Gateway] Order created: ${order._id}`);

    // ========= STEP 7: HANDLE WALLET-ONLY PAYMENT =========
    
    if (onlineAmount === 0 && walletDeduction > 0) {
      // Payment entirely from wallet - no need for payment microservice
      
      // Deduct from wallet
      buyer.walletBalance -= walletDeduction;
      await buyer.save();

      // Update order
      order.paymentStatus = 'completed';
      order.paidAmount = walletDeduction;
      order.status = 'paid';
      order.paidAt = new Date();
      order.transactionId = `WALLET_${Date.now()}_${order._id}`;
      await order.save();

      // Reduce product stock
      product.stock -= 1;
      await product.save();

      // Add to seller's wallet (or pending balance)
      const seller = await User.findById(sellerId);
      if (seller) {
        seller.walletBalance = (seller.walletBalance || 0) + walletDeduction;
        await seller.save();
      }

      console.log(`[Payment Gateway] Wallet-only payment completed for order ${order._id}`);

      return res.json({
        success: true,
        paymentMethod: 'wallet',
        data: {
          orderId: order._id,
          message: 'Payment completed successfully using wallet',
          order: {
            id: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            total: order.total,
            paidAmount: order.paidAmount
          }
        }
      });
    }

    // ========= STEP 8: DEDUCT WALLET AMOUNT (if mixed payment) =========
    
    if (walletDeduction > 0) {
      buyer.walletBalance -= walletDeduction;
      await buyer.save();
      
      console.log(`[Payment Gateway] Deducted ₼${walletDeduction} from buyer's wallet`);
    }

    // ========= STEP 9: PREPARE PAYMENT MICROSERVICE REQUEST =========
    
    const paymentMetadata = {
      mainOrderId: order._id.toString(),
      productId: product._id.toString(),
      productTitle: product.title,
      productPrice: product.price,
      buyerId: buyerId.toString(),
      sellerId: sellerId.toString(),
      sellerName: product.owner.name || 'Seller',
      walletDeduction: walletDeduction,
      totalAmount: totalAmount,
      checkoutDetails: checkoutDetails
    };

    // ========= STEP 10: CALL PAYMENT MICROSERVICE =========
    
    console.log(`[Payment Gateway] Proxying to payment microservice for ₼${onlineAmount}`);

    let paymentResponse;
    try {
      paymentResponse = await axios.post(
        `${PAYMENT_SERVICE_URL}/api/v1/payments/initiate`,
        {
          amount: onlineAmount,
          currency: 'AZN',
          email: checkoutDetails.email,
          description: `Purchase: ${product.title}`,
          metadata: paymentMetadata
        },
        {
          headers: {
            'Authorization': req.headers.authorization,
            'X-Service-Secret': PAYMENT_SERVICE_SECRET,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
    } catch (error) {
      console.error('[Payment Gateway] Payment microservice error:', error.message);
      
      // Refund wallet if payment microservice fails
      if (walletDeduction > 0) {
        buyer.walletBalance += walletDeduction;
        await buyer.save();
        console.log(`[Payment Gateway] Refunded ₼${walletDeduction} to buyer's wallet`);
      }

      // Update order status
      order.paymentStatus = 'failed';
      order.paymentMetadata.error = error.message;
      await order.save();

      // Handle specific errors
      if (error.response) {
        return res.status(error.response.status).json({
          success: false,
          message: error.response.data.message || 'Payment service error',
          error: error.response.data
        });
      }

      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'Payment service is currently unavailable. Please try again later.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to initiate payment',
        error: error.message
      });
    }

    // ========= STEP 11: UPDATE ORDER WITH PAYMENT ORDER ID =========
    
    const paymentOrderId = paymentResponse.data.data.orderId;
    
    order.paymentOrderId = paymentOrderId;
    order.paymentStatus = 'processing';
    await order.save();

    console.log(`[Payment Gateway] Payment initiated. Payment Order ID: ${paymentOrderId}, Main Order ID: ${order._id}`);

    // ========= STEP 12: RETURN SUCCESS RESPONSE =========
    
    res.json({
      success: true,
      paymentMethod: walletDeduction > 0 ? 'mixed' : 'card',
      data: {
        orderId: paymentOrderId, // Payment microservice order ID
        mainOrderId: order._id, // Main database order ID
        redirectUrl: paymentResponse.data.data.redirectUrl,
        amount: {
          total: totalAmount,
          wallet: walletDeduction,
          online: onlineAmount
        }
      }
    });

  } catch (error) {
    console.error('[Payment Gateway] Error initiating payment:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.message
    });
  }
});

/**
 * 🎯 ROUTE 2: Get Order/Payment Status
 * GET /api/payments/order/:orderId
 */
router.get('/order/:orderId', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Find order (can search by main order ID or payment order ID)
    let order = await Order.findById(orderId)
      .populate('productId')
      .populate('sellerId', 'name email')
      .populate('buyerId', 'name email');

    if (!order) {
      // Try finding by payment order ID
      order = await Order.findOne({ paymentOrderId: orderId })
        .populate('productId')
        .populate('sellerId', 'name email')
        .populate('buyerId', 'name email');
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify user owns this order (buyer or seller)
    if (order.buyerId._id.toString() !== userId && 
        order.sellerId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this order'
      });
    }

    // If order has payment order ID, fetch payment details
    let paymentDetails = null;
    if (order.paymentOrderId) {
      try {
        const paymentResponse = await axios.get(
          `${PAYMENT_SERVICE_URL}/api/v1/payments/${order.paymentOrderId}`,
          {
            headers: {
              'Authorization': req.headers.authorization,
              'X-Service-Secret': PAYMENT_SERVICE_SECRET
            },
            timeout: 10000
          }
        );
        
        paymentDetails = paymentResponse.data.data;
      } catch (error) {
        console.error('[Payment Gateway] Error fetching payment details:', error.message);
        // Continue without payment details
      }
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
          product: {
            id: order.productId._id,
            title: order.productId.title,
            price: order.productId.price,
            image: order.productId.images?.[0]
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
          updatedAt: order.updatedAt
        },
        paymentDetails: paymentDetails // Can be null if payment-only order
      }
    });

  } catch (error) {
    console.error('[Payment Gateway] Error fetching order:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
});

/**
 * 🎯 ROUTE 3: Get User's Orders
 * GET /api/payments/orders
 */
router.get('/orders', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { role = 'buyer', status } = req.query;

    let orders;
    
    if (role === 'buyer') {
      orders = await Order.getBuyerOrders(userId, { status });
    } else if (role === 'seller') {
      orders = await Order.getSellerOrders(userId, { status });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "buyer" or "seller"'
      });
    }

    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          id: order._id,
          productId: order.productId._id,
          productTitle: order.productId.title,
          productImage: order.productId.images?.[0],
          total: order.total,
          paidAmount: order.paidAmount,
          paymentMethod: order.paymentMethod,
          status: order.status,
          paymentStatus: order.paymentStatus,
          checkoutDetails: order.checkoutDetails,
          createdAt: order.createdAt,
          paidAt: order.paidAt
        })),
        count: orders.length
      }
    });

  } catch (error) {
    console.error('[Payment Gateway] Error fetching orders:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

/**
 * 🎯 ROUTE 4: Cancel Order
 * POST /api/payments/order/:orderId/cancel
 */
router.post('/order/:orderId/cancel', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only buyer can cancel
    if (order.buyerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only buyer can cancel order'
      });
    }

    // Can only cancel pending or paid orders
    if (!['pending', 'paid'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`
      });
    }

    // Cancel order
    await order.cancelOrder(reason || 'Cancelled by buyer');

    // Refund if payment was made
    if (order.paidAmount > 0) {
      const buyer = await User.findById(order.buyerId);
      buyer.walletBalance = (buyer.walletBalance || 0) + order.paidAmount;
      await buyer.save();

      console.log(`[Payment Gateway] Refunded ₼${order.paidAmount} to buyer's wallet`);
    }

    // Restore product stock
    const product = await Product.findById(order.productId);
    if (product) {
      product.stock += 1;
      await product.save();
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderId: order._id,
        status: order.status,
        refundedAmount: order.paidAmount
      }
    });

  } catch (error) {
    console.error('[Payment Gateway] Error cancelling order:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
});

module.exports = router;