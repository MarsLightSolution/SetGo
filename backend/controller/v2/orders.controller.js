// /api/v2 order handlers. New code; the original controllers are unchanged.
const Order = require("../../models/Order");
const logger = require("../../utils/logger");

const CONFIRMABLE_STATUSES = ["paid", "shipped", "delivered"];

// POST /api/v2/orders/:orderId/confirm-receipt — the buyer (from the token) confirms they got
// the item. Unlike /reviews/orders/:orderId/confirm-delivery it also accepts "shipped" orders.
exports.confirmReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!/^[a-f0-9]{24}$/i.test(String(orderId))) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (String(order.buyerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "You are not the buyer of this order." });
    }
    if (order.deliveryConfirmedByBuyer) {
      return res.status(400).json({
        success: false,
        message: "Delivery already confirmed",
        data: { confirmedAt: order.deliveryConfirmedAt, needsReview: !order.reviewSubmitted },
      });
    }
    if (!CONFIRMABLE_STATUSES.includes(order.status)) {
      return res.status(400).json({ success: false, message: `Cannot confirm delivery. Order status is: ${order.status}` });
    }
    order.status = "delivered";
    order.deliveryConfirmedByBuyer = true;
    order.deliveryConfirmedAt = new Date();
    await order.save();
    return res.json({
      success: true,
      message: "Delivery confirmed successfully! You can now leave a review.",
      data: { orderId: order._id, confirmedAt: order.deliveryConfirmedAt, needsReview: !order.reviewSubmitted },
    });
  } catch (error) {
    logger.error("[v2 confirmReceipt] failed", { error: error.message });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
