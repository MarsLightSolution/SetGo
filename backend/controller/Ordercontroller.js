const Order = require("../models/Order.js");

const placeOrder = async (req, res) => {
  try {
    const { buyerId, sellerId, productId, total, address } = req.body;

    // Validate required fields
    if (!buyerId || !sellerId || !productId || !total || !address) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const order = new Order({
      buyerId,
      sellerId,
      productId,
      total,
      status: "paid",
     
      checkoutDetails: {
        name: address.name,
        email: address.email, // added email
        city: address.city,
        address: address.address,
        pincode: address.zipCode,
      },
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
