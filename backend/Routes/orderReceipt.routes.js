const express = require("express");
const verifyJWT = require("../middlewares/auth.middlewares");
const { confirmReceipt } = require("../controller/orderReceipt.controller");

const router = express.Router();

// POST /order-receipt/:orderId/confirm  (buyer = logged-in user)
router.post("/:orderId/confirm", verifyJWT, confirmReceipt);

module.exports = router;
