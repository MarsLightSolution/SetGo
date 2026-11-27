// POST /api/v2/chatbot/ask (login required). Order questions are answered here from the
// caller's own orders; every other question goes to the existing chatbot handler unchanged.
const mongoose = require("mongoose");
const Order = require("../../models/Order");
const logger = require("../../utils/logger");
const { getChatResponse } = require("../ChatBotController");

const ORDER_QUESTIONS = new Set(["Where is my order?", "Track a specific order"]);
const titleOf = (order) => order.productId?.title?.en || "your product";

exports.ask = async (req, res) => {
  const { question, orderId } = req.body || {};
  const me = req.user._id;

  if (ORDER_QUESTIONS.has(question)) {
    if (!orderId) {
      return res.json({
        success: false,
        answer: "Please provide your Order ID so I can check its status.",
        showMenu: false,
        requireInput: "orderId",
      });
    }
    try {
      const order = mongoose.Types.ObjectId.isValid(String(orderId))
        ? await Order.findOne({ _id: orderId, $or: [{ buyerId: me }, { sellerId: me }] }).populate("productId", "title").lean()
        : null;
      if (!order) {
        return res.json({ success: true, answer: "❌ I couldn't find that order on your account. Please check the Order ID.", showMenu: true, redirectTo: null });
      }
      const answer = `✅ **Order Status for ${titleOf(order)}**:\n\n• Status: **${(order.status || "processing").toUpperCase()}**\n• Tracking ID: ${order.trackingId || "not available"}\n• Delivery City: ${order.checkoutDetails?.city || "-"}\n\nYou'll be notified once shipped! 🚚`;
      return res.json({ success: true, answer, showMenu: true, redirectTo: null });
    } catch (err) {
      logger.error("[v2 chatbot] order lookup failed", { error: err.message });
      return res.json({ success: true, answer: "❌ Sorry, I couldn't fetch your order details. Please try again later.", showMenu: true, redirectTo: null });
    }
  }

  if (question === "Show all my orders") {
    try {
      const orders = await Order.find({ buyerId: me }).sort({ createdAt: -1 }).limit(5).populate("productId", "title").lean();
      let answer = "📦 You don't have any orders yet. Start shopping now! 🛍️";
      if (orders.length) {
        answer = "📦 **Your Recent Orders:**\n\n"
          + orders.map((o, i) => `${i + 1}. **${o.productId?.title?.en || "Product"}**\n   Status: ${o.status || "pending"}\n   Order ID: ${o._id}\n\n`).join("")
          + "Need help with a specific order? Use 'Track a specific order'.";
      }
      return res.json({ success: true, answer, showMenu: true, redirectTo: null });
    } catch (err) {
      logger.error("[v2 chatbot] orders lookup failed", { error: err.message });
      return res.json({ success: true, answer: "❌ Unable to fetch your orders right now. Please try again later.", showMenu: true, redirectTo: null });
    }
  }

  // Not order-related: the existing handler, with the caller's own id.
  req.body = { ...(req.body || {}), userId: String(me) };
  return getChatResponse(req, res);
};
