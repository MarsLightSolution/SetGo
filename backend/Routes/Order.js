const express = require("express");
const { placeOrder, getUserOrders, getOrderById,getSellerOrders, uploadTrackingId } = require("../controller/Ordercontroller");
const verifyJWT = require("../middlewares/auth.middlewares.js");

const router = express.Router();

// SECURITY: All order routes require authentication

// Get all orders for a seller (must be authenticated)
router.get("/seller/:sellerId", verifyJWT, getSellerOrders);

// Upload tracking ID (seller must be authenticated)
router.patch("/:orderId/tracking", verifyJWT, uploadTrackingId);

// POST - Place new order (buyer must be authenticated)
router.post("/", verifyJWT, placeOrder);

// GET - Get all orders of a user (must be authenticated)
router.get("/user/:userId", verifyJWT, getUserOrders);

// GET - Get single order detail (must be authenticated)
router.get("/:id", verifyJWT, getOrderById);

module.exports = router;
