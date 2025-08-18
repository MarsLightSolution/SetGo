const express = require("express");
const { placeOrder, getUserOrders, getOrderById } = require("../controller/Ordercontroller");

const router = express.Router();

// POST - Place new order
router.post("/", placeOrder);

// GET - Get all orders of a user
router.get("/user/:userId", getUserOrders);

// GET - Get single order detail
router.get("/:id", getOrderById);

module.exports = router;
