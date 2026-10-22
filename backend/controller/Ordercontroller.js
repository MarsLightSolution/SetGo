const Order = require("../models/Order.js");
const Product = require("../models/product.model.js");
const { sendEmail } = require("../services/emailService.js");
const {
  buyerPaymentTemplate,
  sellerPaymentTemplate,
  adminPaymentTemplate,
  trackingUpdateTemplate,
  orderRejectedTemplate,
  itemReceivedTemplate,
  fundsReleasedTemplate
} = require("../services/templates.js");
const logger = require('../utils/logger');
const { emitToUser } = require('../utils/ioInstance');
const Transaction = require("../models/transaction.model.js");
const { notifyOrderPlaced } = require("../services/orderNotifications");

const placeOrder = async (req, res) => {
  logger.debug('placeOrder called', { body: req.body });
  
  try {
    // Legacy flow (still used by the mobile app): the client pays via
    // /api/transaction/transferFund, then calls this with that transactionId. The order is
    // only created if that payment really exists, came from this buyer, went to this
    // product's seller, covers the price, and hasn't already backed another order.
    const buyerId = String(req.user._id);
    const { productId, transactionId, address } = req.body;

    if (req.body.buyerId && String(req.body.buyerId) !== buyerId) {
      return res.status(403).json({ success: false, error: "buyerId does not match the logged-in user" });
    }
    if (!productId || !transactionId || !address) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const product = await Product.findById(productId).populate("owner", "username email");
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    const sellerId = String(product.owner._id);

    const payment = await Transaction.findOne({ transactionId, status: "success" });
    if (
      !payment ||
      String(payment.senderId) !== buyerId ||
      String(payment.receiverId) !== sellerId ||
      payment.amount < product.price
    ) {
      logger.warn('[placeOrder] Rejected: no matching payment', { buyerId, productId, transactionId });
      return res.status(402).json({ success: false, code: "PAYMENT_NOT_VERIFIED", error: "No matching payment found for this order" });
    }

    if (await Order.exists({ transactionId })) {
      return res.status(409).json({ success: false, code: "ORDER_EXISTS", error: "An order already exists for this payment" });
    }

    const order = new Order({
      buyerId,
      sellerId,
      productId,
      total: payment.amount,
      walletDeduction: payment.amount,
      paidAmount: payment.amount,
      transactionId,
      status: "paid",
      paymentStatus: "completed",
      paidAt: payment.createdAt,
      checkoutDetails: {
        name: address.name,
        email: address.email,
        city: address.city,
        address: address.address,
        pincode: address.zipCode,
      },
    });
    await order.save();

    await notifyOrderPlaced(order, product);

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(501).json({ success: false, error: err.message });
  }
};


// ✅ Get all orders of a user
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.params.userId })
      .populate("productId", "title price")
      .populate("sellerId", "username email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Get single order detail
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("productId", "title price description")
      .populate("sellerId", "username email");

    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
const getSellerOrders = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const orders = await Order.find({ sellerId })
      .populate("productId")   // brings full product data
      .populate("buyerId", "name email"); // optional: buyer details

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    logger.error('Error fetching seller orders', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 2. Seller uploads tracking ID -> update status to shipping
const uploadTrackingId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingId } = req.body;

    if (!trackingId) {
      return res.status(400).json({ success: false, message: "Tracking ID is required" });
    }

    const order = await Order.findById(orderId)
      .populate("buyerId", "username email")
      .populate("sellerId", "username email")
      .populate("productId", "title");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "paid") {
      return res.status(400).json({ success: false, message: "Order is not in paid status" });
    }

    // ✅ Save tracking ID in schema field
    order.trackingId = trackingId;

    // ✅ Update status from "paid" → "shipped"
    order.status = "shipped";

    await order.save();

    // ── Real-time notification to buyer ───────────────────────────────────
    const shippedProductName =
      order.productId?.title?.en || order.productId?.title || "your item";

    emitToUser(String(order.buyerId._id || order.buyerId), "notification", {
      id:        `order_shipped_${orderId}`,
      type:      "order",
      title:     "📦 Your Order Has Been Shipped!",
      message:   `"${shippedProductName}" is on its way. Tracking ID: ${trackingId}`,
      timestamp: Date.now(),
      isRead:    false,
      orderId:   orderId,
    });

    // Buyer & Seller objects for email template
    const buyer = { name: order.buyerId.username, email: order.buyerId.email };
    const seller = { name: order.sellerId.username, email: order.sellerId.email };
    const productTitle = order.productId.title?.en || order.productId.title; // fallback

    // ✅ Send emails
    try {
      await sendEmail(
        buyer.email,
        "Your Order Has Been Shipped",
        trackingUpdateTemplate(buyer, order, trackingId)
      );

      await sendEmail(
        seller.email,
        "Tracking ID Uploaded Successfully",
        trackingUpdateTemplate(seller, order, trackingId)
      );
    } catch (mailErr) {
      logger.error('Email sending failed', { message: mailErr.message });
    }

    res.status(200).json({
      success: true,
      message: "Tracking ID uploaded successfully & emails sent",
      order,
    });
  } catch (error) {
    logger.error('Error uploading tracking ID', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


module.exports = {
  placeOrder,
  getUserOrders,
  getOrderById,
  getSellerOrders,
  uploadTrackingId,
};
