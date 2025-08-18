const Order = require("../models/Order.js");

// ✅ Place new order
const placeOrder = async (req, res) => {
  try {
    const { buyerId, sellerId, productId, total } = req.body;

    const order = new Order({
      buyerId,
      sellerId,
      productId,
      total,
      status: "paid",
    });

    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Get all orders of a user
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.params.userId })
      .populate("productId", "title price")
      .populate("sellerId", "name email")
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
      .populate("sellerId", "name email");

    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  placeOrder,
  getUserOrders,
  getOrderById,
};
