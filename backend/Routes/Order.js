const express = require("express");
const { placeOrder, getUserOrders, getOrderById,getSellerOrders, uploadTrackingId } = require("../controller/Ordercontroller");


const router = express.Router();

// Get all orders for a seller
router.get("/seller/:sellerId", getSellerOrders);

// Upload tracking ID
router.patch("/:orderId/tracking", uploadTrackingId);
// POST - Place new order
router.post("/", placeOrder);

// GET - Get all orders of a user
router.get("/user/:userId", getUserOrders);

// GET - Get single order detail
router.get("/:id", getOrderById);

module.exports = router;
