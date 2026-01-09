const Order = require("../models/Order.js");
const User = require("../models/user.js");
const Product = require("../models/product.model.js");
const ADMIN_ID = process.env.Admin_Id;
const { sendEmail } = require("../services/emailService.js");
const {
  orderRejectedTemplate,
  itemReceivedTemplate,
  fundsReleasedTemplate
} = require("../services/templates.js");
const logger = require('../utils/logger');

const getAdminDashboardData = async (req, res) => {
  try {
    // Fetch orders with buyer/seller/product info
    const orders = await Order.find({})
      .populate("buyerId", "profileName email createdAt walletBalance transactionHistory buy")
      .populate("sellerId", "profileName email createdAt walletBalance transactionHistory sell")
      .populate("productId", "title price description")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all users for dashboard
    const allUsers = await User.find({})
      .select("profileName email createdAt walletBalance transactionHistory buy sell paymentAccounts")
      .lean();

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

    const userTransactions = allUsers.flatMap((user) =>
      (user.transactionHistory || []).map((txn) => ({
        id: txn.transactionId || txn._id,
        type: txn.direction,
        amount: txn.amount,
        description: `Wallet ${txn.direction} - ${user.profileName || user.email}`,
        date: txn.createdAt,
        status: txn.status || "completed",
        userName: user.profileName || user.email,
        source: "wallet",
      }))
    );

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
        totalTransactions: buyer.transactionHistory?.length || 0,
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
// Hardcoded admin id (string)


const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.body.userId;
    logger.debug('cancelOrder invoked', { userId, ADMIN_ID });
    // 🔒 Only admin can cancel
    // if (userId !== ADMIN_ID ) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Only admin can cancel orders",
    //   });
    // }

    // 🔍 Find order
    const order = await Order.findById(orderId).populate("productId", "title"); // 👈 choose the fields you need

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // 🚫 Already cancelled / delivered
    if (["cancelled", "delivered", "released"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order already ${order.status}, cannot cancel.`,
      });
    }

    // ✅ Cancel order
    order.status = "cancelled";
    await order.save();

    // 📧 Send Rejected Email to Buyer
    try {
      const buyer = await User.findById(order.buyerId);
      if (buyer && buyer.email) {
        const emailHtml = orderRejectedTemplate(
          buyer,
          { id: order._id, product: order.productId?.title.en }, // 👈 Pass order details
          "Cancelled" // 👈 Reason
        );

        await sendEmail(
          buyer.email,
          "Your Order Has Been Cancelled",
          emailHtml,
        );
      }
    } catch (emailErr) {
      logger.error('Failed to send cancellation email', { message: emailErr.message });
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully by admin & email sent to buyer",
      order,
    });
  } catch (error) {
    logger.error('Cancel Order Error', { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
// Approve delivery (only admin)
const approveDelivery = async (req, res) => {
  try {
    const { userId } = req.body; // admin id from frontend
    const { orderId } = req.params;
    logger.debug('approveDelivery invoked', { ADMIN_ID, userId });
    // ✅ Ensure only admin can approve delivery
    // if (userId !== ADMIN_ID) {
    //   return res.status(403).json({ error: "Only admin can approve delivery" });
    // }

    logger.debug('approveDelivery invoked again', { ADMIN_ID, userId });

    // // ✅ Ensure only admin can approve delivery
    // if (userId !== ADMIN_ID) {
    //   return res.status(403).json({ error: "Only admin can approve delivery" });
    // }

    // 🔍 Find order with product populated
    const order = await Order.findById(orderId).populate("productId", "title");
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Prevent approving already completed/cancelled orders
    if (["cancel", "cancelled", "delivered", "funds_released"].includes(order.status)) {
      return res.status(400).json({ error: "Order cannot be approved for delivery" });
    }

    // ✅ Update status
    order.status = "delivered";
    order.deliveryApprovedAt = new Date();
    await order.save();

    // 🔍 Get seller details
    const seller = await User.findById(order.sellerId);
    if (seller) {
      // 📧 Send email to seller
      await sendEmail(
        seller.email,
        "Item Received & Delivery Approved ✅",
        itemReceivedTemplate(
          { name: seller.username },
          { id: order._id, product: order.productId?.title.en || "Product" }
        )
      );
    }

    res.json({ message: "Order delivery approved successfully", order });
  } catch (err) {
    logger.error('Approve delivery error', { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Server error approving delivery" });
  }
};
// Release funds (only admin)
const releaseFunds = async (req, res) => {
  try {
    const { userId } = req.body; // admin id from frontend
    const { orderId } = req.params;

    logger.debug('Releasing funds for order', { orderId, userId });

    // ✅ Ensure only admin can release funds
    if (userId !== ADMIN_ID) {
      return res.status(403).json({ error: "Only admin can release funds" });
    }

    // 🔍 Find order + populate buyer & seller
    const order = await Order.findById(orderId)
      .populate("buyerId", "username email")
      .populate("sellerId", "username email");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // ❌ Prevent releasing if already released/cancelled
    if (["released", "cancelled"].includes(order.status)) {
      return res.status(400).json({ error: `Order already ${order.status}` });
    }

    let emailUser, emailTemplate;

    if (order.status === "cancelled") {
      // 🔄 Refund to Buyer
      emailUser = order.buyerId;
      emailTemplate = fundsReleasedTemplate(
        emailUser,
        {
          id: order._id,
          product: order.productName,
          amount: order.total,
        },
        "buyer"
      );
    } else {
      // ✅ Release to Seller
      order.status = "released";
      order.fundsReleasedAt = new Date();
      await order.save();

      emailUser = order.sellerId;
      emailTemplate = fundsReleasedTemplate(
        emailUser,
        {
          id: order._id,
          product: order.productName,
          amount: order.total,
        },
        "seller"
      );
    }

    // 📧 Send email
    await sendEmail(emailUser.email, "Funds Update - Order", emailTemplate);

    return res.json({
      success: true,
      message:
        order.status === "released"
          ? "Funds released to seller successfully & email sent"
          : "Refund initiated to buyer successfully & email sent",
      order,
    });
  } catch (err) {
    logger.error('Release funds error', { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Server error releasing funds" });
  }
};

module.exports = {
  getAdminDashboardData,
  cancelOrder,
  approveDelivery,
  releaseFunds
};
