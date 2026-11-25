const express = require("express");
const router = express.Router();
const requireAdmin = require("../middlewares/requireAdmin.middleware");
const { getAdminDashboardData, cancelOrder, refundOrder, approveDelivery, releaseFunds } = require("../controller/Admincontroller");

// Mounted at "/" — so the guard goes on each route, not router.use(), or it would cover the whole API.
// SECURITY: these were public; anyone could list every order or cancel/approve any order.
router.get("/dashboard", requireAdmin, getAdminDashboardData);
router.post("/:orderId/cancel", requireAdmin, cancelOrder);
router.post("/:orderId/refund", requireAdmin, refundOrder);
router.post("/:orderId/approve-delivery", requireAdmin, approveDelivery);
router.put("/:orderId/release", requireAdmin, releaseFunds);
module.exports = router;
