const Order = require("../models/Order.js");
const User = require("../models/user.js");
const Transaction = require("../models/transaction.model.js");
const Product = require("../models/product.model.js");
const { WalletError } = require("../services/walletLedger");
const { refundOrder: refundOrderService, cancelOrderByAdmin } = require("../services/adminRefunds");
const { notifyOrderEvent } = require("../services/orderNotifications");
const logger = require('../utils/logger');

const getAdminDashboardData = async (req, res) => {
  try {
    // Fetch orders with buyer/seller/product info
    const orders = await Order.find({})
      .populate("buyerId", "profileName email createdAt walletBalance buy")
      .populate("sellerId", "profileName email createdAt walletBalance sell")
      .populate("productId", "title price description")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all users for dashboard
    const allUsers = await User.find({})
      .select("profileName email createdAt walletBalance buy sell paymentAccounts")
      .lean();

    // Wallet ledger lives in the Transaction collection (not on the user document)
    const walletTxns = await Transaction.find({}).sort({ createdAt: -1 }).lean();
    const userById = new Map(allUsers.map((u) => [u._id.toString(), u]));

    // Expand each ledger row into the per-user entries the dashboard shows:
    // a debit for the sender (wallet mode only) and a credit for the receiver
    const walletEntries = [];
    const walletEntryCount = new Map(); // userId -> number of ledger entries
    const pushEntry = (userId, direction, txn) => {
      const user = userById.get(userId?.toString());
      if (!user) return;
      walletEntryCount.set(user._id.toString(), (walletEntryCount.get(user._id.toString()) || 0) + 1);
      walletEntries.push({ user, direction, txn });
    };
    for (const txn of walletTxns) {
      if (txn.paymentMode !== "online") pushEntry(txn.senderId, "debit", txn);
      pushEntry(txn.receiverId, "credit", txn);
    }

    /** -----------------------------
     *  Derived Stats
     * ----------------------------- */
    const buyerIds = new Set(orders.map((o) => o.buyerId?._id?.toString()).filter(Boolean));
    const sellerIds = new Set(orders.map((o) => o.sellerId?._id?.toString()).filter(Boolean));

    const buyers = allUsers.filter((u) => buyerIds.has(u._id.toString()));
    const sellers = allUsers.filter((u) => sellerIds.has(u._id.toString()));

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalWalletBalance = allUsers.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
    const pendingOrders = orders.filter((o) => ["pending", "paid"].includes(o.status)).length;
    const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
    const fundsHeld = orders
      .filter((o) => !["delivered", "cancelled"].includes(o.status))
      .reduce((sum, o) => sum + (o.total || 0), 0);

    /** -----------------------------
     *  Transactions
     * ----------------------------- */
    const orderTransactions = orders.map((order) => ({
      id: order._id,
      type: order.status === "delivered" ? "debit" : "credit",
      amount: order.total,
      description: `Order ${order._id.toString().slice(-6)} - ${order.productId?.title || "Product"}`,
      date: order.createdAt,
      status: order.status,
      buyerName: order.buyerId?.profileName || order.buyerId?.email || "Unknown",
      sellerName: order.sellerId?.profileName || order.sellerId?.email || "Unknown",
      source: "order",
    }));

    const userTransactions = walletEntries.map(({ user, direction, txn }) => ({
      id: txn.transactionId || txn._id,
      type: direction,
      amount: txn.amount,
      description: `Wallet ${direction} - ${user.profileName || user.email}`,
      date: txn.createdAt,
      status: txn.status === "success" ? "completed" : txn.status || "completed",
      userName: user.profileName || user.email,
      source: "wallet",
    }));

    const allTransactions = [...orderTransactions, ...userTransactions].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    /** -----------------------------
     *  Buyers & Sellers with Stats
     * ----------------------------- */
    const buyersWithStats = buyers.map((buyer) => {
      const buyerOrders = orders.filter((o) => o.buyerId?._id?.toString() === buyer._id.toString());
      const totalSpent = buyerOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      return {
        id: buyer._id,
        name: buyer.profileName || buyer.email,
        email: buyer.email,
        joinDate: buyer.createdAt,
        totalOrders: buyerOrders.length,
        totalSpent,
        walletBalance: buyer.walletBalance || 0,
        totalTransactions: walletEntryCount.get(buyer._id.toString()) || 0,
        totalPurchases: buyer.buy?.length || 0,
        paymentMethods: buyer.paymentAccounts?.length || 0,
        status: buyerOrders.length > 0 ? "active" : "inactive",
      };
    });

    const sellersWithStats = sellers.map((seller) => {
      const sellerOrders = orders.filter((o) => o.sellerId?._id?.toString() === seller._id.toString());
      const totalEarnings = sellerOrders
        .filter((o) => o.status === "delivered")
        .reduce((sum, o) => sum + (o.total || 0), 0);

      const pendingEarnings = sellerOrders
        .filter((o) => !["delivered", "cancelled"].includes(o.status))
        .reduce((sum, o) => sum + (o.total || 0), 0);

      return {
        id: seller._id,
        name: seller.profileName || seller.email,
        email: seller.email,
        joinDate: seller.createdAt,
        totalOrders: sellerOrders.length,
        totalEarnings,
        pendingEarnings,
        walletBalance: seller.walletBalance || 0,
        totalSales: seller.sell?.length || 0,
        completedSales: seller.sell?.filter((s) => s.isSold).length || 0,
        commissionRate: 5, // default commission
        paymentMethods: seller.paymentAccounts?.length || 0,
        status: sellerOrders.length > 0 ? "active" : "inactive",
      };
    });

    /** -----------------------------
     *  Orders for Admin
     * ----------------------------- */
    const ordersForAdmin = orders.map((o) => ({
      id: o._id,
      buyerName: o.buyerId?.profileName || o.buyerId?.email || "Unknown",
      buyerId: o.buyerId?._id,
      buyerEmail: o.buyerId?.email || "Unknown",
      sellerName: o.sellerId?.profileName || o.sellerId?.email || "Unknown",
      sellerId: o.sellerId?._id,
      sellerEmail: o.sellerId?.email || "Unknown",
      productName: o.productId?.title || "Unknown Product",
      transactionId:o.transactionId,
      amount: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      cardAmount: o.onlineAmount || 0,
      refundStatus: o.paymentMetadata?.reversal?.status || (o.paymentStatus === "refunded" ? "refunded" : null),
      needsReview: Boolean(o.paymentMetadata?.needsReview),
      trackingId: o.trackingId,
      orderDate: o.createdAt,
      shippingAddress: o.checkoutDetails,
    }));

    /** -----------------------------
     *  Response
     * ----------------------------- */
    res.json({
      success: true,
      data: {
        stats: {
          totalRevenue,
          activeBuyers: buyers.length,
          activeSellers: sellers.length,
          pendingOrders,
          deliveredOrders,
          fundsHeld,
          totalWalletBalance,
          totalUsers: allUsers.length,
          totalTransactions: allTransactions.length,
        },
        transactions: allTransactions,
        buyers: buyersWithStats,
        sellers: sellersWithStats,
        orders: ordersForAdmin,
      },
    });
  } catch (error) {
    logger.error('Error fetching admin dashboard data', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: "Failed to fetch admin dashboard data",
    });
  }
};
const sendRefundError = (res, err, fallback) => {
  if (err instanceof WalletError) {
    return res.status(err.status || 400).json({ success: false, code: err.code, message: err.message });
  }
  logger.error(fallback, { message: err.message, stack: err.stack });
  return res.status(500).json({ success: false, message: fallback });
};

// Cancel (admin only): a paid order is refunded (wallet at once, card through the bank);
// an unpaid order is just cancelled. Buyer and seller are notified.
const cancelOrder = async (req, res) => {
  try {
    const result = await cancelOrderByAdmin(req.params.orderId, {
      reason: req.body?.reason || "Cancelled by SATGO",
      adminId: req.user._id,
    });
    return res.json({ success: true, message: messageFor(result), data: result });
  } catch (err) {
    return sendRefundError(res, err, "Failed to cancel order");
  }
};

// Refund (admin only) — also for delivered orders.
const refundOrder = async (req, res) => {
  try {
    const result = await refundOrderService(req.params.orderId, {
      reason: req.body?.reason || "Refunded by SATGO",
      adminId: req.user._id,
    });
    return res.json({ success: true, message: messageFor(result), data: result });
  } catch (err) {
    return sendRefundError(res, err, "Failed to refund order");
  }
};

function messageFor(result) {
  if (result.mode === "card") return "Card refund sent to the bank. The order is refunded once the bank confirms; buyer and seller are notified.";
  if (result.mode === "wallet") return "Refunded to the buyer's wallet. Buyer and seller notified.";
  return "Order cancelled. Buyer and seller notified.";
}

// Approve delivery (admin only)
const approveDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (["cancel", "cancelled", "delivered", "released"].includes(order.status) || order.paymentStatus !== "completed") {
      return res.status(400).json({ error: "Order cannot be approved for delivery" });
    }

    order.status = "delivered";
    order.deliveryApprovedAt = new Date();
    await order.save();

    notifyOrderEvent(order, "delivery_approved");
    res.json({ message: "Order delivery approved successfully", order });
  } catch (err) {
    logger.error('Approve delivery error', { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Server error approving delivery" });
  }
};

// Release funds (admin only). Refunds no longer go through here: use /:orderId/refund.
const releaseFunds = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (["released", "cancelled"].includes(order.status) || order.paymentStatus !== "completed") {
      return res.status(400).json({ error: `Order is ${order.status} / ${order.paymentStatus}, funds cannot be released` });
    }

    order.status = "released";
    order.fundsReleasedAt = new Date();
    await order.save();

    notifyOrderEvent(order, "funds_released");
    return res.json({ success: true, message: "Funds released to seller. Seller notified.", order });
  } catch (err) {
    logger.error('Release funds error', { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Server error releasing funds" });
  }
};

module.exports = {
  getAdminDashboardData,
  cancelOrder,
  refundOrder,
  approveDelivery,
  releaseFunds
};
