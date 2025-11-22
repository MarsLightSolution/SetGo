// controllers/payment-proxy.controller.js
// Main Backend - Payment Gateway Controller

const axios = require('axios');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/user');

// Environment variables
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001';
const PAYMENT_SERVICE_SECRET = process.env.PAYMENT_SERVICE_SECRET;

/**
 * 🎯 CONTROLLER 1: Initiate Payment
 * Handles payment initiation with wallet and online payment support
 */
exports.initiatePayment = async (req, res) => {
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

    // Get seller ID
    const sellerId = product.owner._id || product.owner;

    // ========= STEP 3: VERIFY USER =========
    
    const buyer = await User.findById(buyerId);
    
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    // ========= STEP 4: VERIFY WALLET BALANCE =========
    
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
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Payment amount mismatch. Product costs ₼${totalAmount}, but payment is ₼${calculatedTotal}`
      });
    }

    // ========= STEP 6: CREATE ORDER IN DATABASE =========
    
    const order = await Order.create({
      buyerId,
      sellerId,
      productId,
      total: totalAmount,
      walletDeduction: walletDeduction,
      onlineAmount: onlineAmount,
      paidAmount: 0,
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
      return await handleWalletOnlyPayment(order, buyer, product, walletDeduction, sellerId, res);
    }

    // ========= STEP 8: DEDUCT WALLET AMOUNT =========
    
    if (walletDeduction > 0) {
      buyer.walletBalance -= walletDeduction;
      await buyer.save();
      console.log(`[Payment Gateway] Deducted ₼${walletDeduction} from buyer's wallet`);
    }

    // ========= STEP 9: CALL PAYMENT MICROSERVICE =========
    
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
      
      // Refund wallet if payment fails
      if (walletDeduction > 0) {
        buyer.walletBalance += walletDeduction;
        await buyer.save();
        console.log(`[Payment Gateway] Refunded ₼${walletDeduction} to buyer's wallet`);
      }

      // Update order status
      order.paymentStatus = 'failed';
      order.paymentMetadata.error = error.message;
      await order.save();

      return handlePaymentServiceError(error, res);
    }

    // ========= STEP 10: UPDATE ORDER WITH PAYMENT ORDER ID =========
    
    const paymentOrderId = paymentResponse.data.data.orderId;
    
    order.paymentOrderId = paymentOrderId;
    order.paymentStatus = 'processing';
    await order.save();

    console.log(`[Payment Gateway] Payment initiated. Payment Order ID: ${paymentOrderId}, Main Order ID: ${order._id}`);

    // ========= STEP 11: RETURN SUCCESS RESPONSE =========
    
    res.json({
      success: true,
      paymentMethod: walletDeduction > 0 ? 'mixed' : 'card',
      data: {
        orderId: paymentOrderId,
        mainOrderId: order._id,
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
};

/**
 * 🎯 CONTROLLER 2: Get Order/Payment Status
 * Retrieves order details with optional payment information
 */
exports.getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Find order (by main order ID or payment order ID)
    let order = await Order.findById(orderId)
      .populate('productId')
      .populate('sellerId', 'name email')
      .populate('buyerId', 'name email');

    if (!order) {
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

    // Verify user authorization
    if (order.buyerId._id.toString() !== userId && 
        order.sellerId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this order'
      });
    }

    // Fetch payment details if available
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
        paymentDetails: paymentDetails
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
};

/**
 * 🎯 CONTROLLER 3: Get User's Orders
 * Retrieves all orders for buyer or seller
 */
exports.getUserOrders = async (req, res) => {
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
};

/**
 * 🎯 CONTROLLER 4: Cancel Order
 * Handles order cancellation with refunds
 */
exports.cancelOrder = async (req, res) => {
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
};

// ========= HELPER FUNCTIONS =========

/**
 * Handle wallet-only payment completion
 */
async function handleWalletOnlyPayment(order, buyer, product, walletDeduction, sellerId, res) {
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

  // Add to seller's wallet
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

/**
 * Handle payment service errors
 */
function handlePaymentServiceError(error, res) {
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