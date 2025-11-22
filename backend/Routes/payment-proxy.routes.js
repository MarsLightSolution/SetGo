// routes/payment-proxy.routes.js
// Main Backend - Payment Gateway Routes

const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const paymentProxyController = require('../controller/payment-proxy.controller');

/**
 * 🎯 ROUTE 1: Initiate Payment
 * POST /api/payments/initiate
 * 
 * Initiates a new payment transaction
 * Supports wallet-only, card-only, or mixed payment methods
 * 
 * @body {string} productId - Product ID to purchase
 * @body {number} amount - Online payment amount
 * @body {number} walletDeduction - Amount to deduct from wallet (optional)
 * @body {object} checkoutDetails - Buyer's checkout information
 * 
 * @returns {object} Payment initiation response with redirect URL or confirmation
 */
router.post('/initiate', authenticateUser, paymentProxyController.initiatePayment);

/**
 * 🎯 ROUTE 2: Get Order/Payment Status
 * GET /api/payments/order/:orderId
 * 
 * Retrieves detailed information about a specific order
 * Includes payment status and transaction details
 * 
 * @param {string} orderId - Main order ID or payment order ID
 * 
 * @returns {object} Order and payment details
 */
router.get('/order/:orderId', authenticateUser, paymentProxyController.getOrderStatus);

/**
 * 🎯 ROUTE 3: Get User's Orders
 * GET /api/payments/orders
 * 
 * Retrieves all orders for the authenticated user
 * Can filter by role (buyer/seller) and status
 * 
 * @query {string} role - User role: 'buyer' or 'seller' (default: 'buyer')
 * @query {string} status - Order status filter (optional)
 * 
 * @returns {object} List of orders with basic details
 */
router.get('/orders', authenticateUser, paymentProxyController.getUserOrders);

/**
 * 🎯 ROUTE 4: Cancel Order
 * POST /api/payments/order/:orderId/cancel
 * 
 * Cancels an order and processes refund if applicable
 * Restores product stock and wallet balance
 * 
 * @param {string} orderId - Order ID to cancel
 * @body {string} reason - Cancellation reason (optional)
 * 
 * @returns {object} Cancellation confirmation with refund details
 */
router.post('/order/:orderId/cancel', authenticateUser, paymentProxyController.cancelOrder);

module.exports = router;