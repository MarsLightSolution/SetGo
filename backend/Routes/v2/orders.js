// /api/v2/orders — like /Orders, with ownership checks.
const express = require("express");
const verifyJWT = require("../../middlewares/auth.middlewares");
const { selfOrAdmin, orderParticipantOrAdmin, orderSellerOrAdmin } = require("../../middlewares/v2Guards.middleware");
const { placeOrder, getUserOrders, getOrderById, getSellerOrders, uploadTrackingId } = require("../../controller/Ordercontroller");
const { confirmReceipt } = require("../../controller/v2/orders.controller");

const router = express.Router();
router.use(verifyJWT);

router.post("/", placeOrder);
router.get("/user/:userId", selfOrAdmin("userId"), getUserOrders);
router.get("/seller/:sellerId", selfOrAdmin("sellerId"), getSellerOrders);
// Seller adds tracking (paid → shipped); only the order's seller.
router.patch("/:orderId/tracking", orderSellerOrAdmin("orderId"), uploadTrackingId);
// Buyer confirms receipt (paid/shipped → delivered).
router.post("/:orderId/confirm-receipt", confirmReceipt);
// Buyer, seller or admin.
router.get("/:id", orderParticipantOrAdmin("id"), getOrderById);

module.exports = router;
