const Order = require("../models/Order.js");
const Product = require("../models/product.model.js");

const placeOrder = async (req, res) => {
  console.log("hi");
  
  try {
    const { buyerId, sellerId, productId, total, transactionId,address} = req.body;
    console.log("const done"+buyerId + " " + sellerId +" " + productId+ " "+  total+" "+ transactionId+ " " + address);
    
    // Validate required fields
    if (!buyerId || !sellerId || !productId || !total || !address) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    console.log("varification  done");
    

    const order = new Order({
      buyerId,
      sellerId,
      productId,
      total,
      transactionId,
      status: "paid",
     
      checkoutDetails: {
        name: address.name,
        email: address.email, // added email
        city: address.city,
        address: address.address,
        pincode: address.zipCode,
      },
    });
    console.log(order);

    await order.save();

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
    console.error("Error fetching seller orders:", error);
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

    const order = await Order.findById(orderId);
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

    res.status(200).json({
      success: true,
      message: "Tracking ID uploaded successfully",
      order,
    });
  } catch (error) {
    console.error("Error uploading tracking ID:", error);
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
