const express = require("express");
const router = express.Router();
const {getAdminDashboardData,cancelOrder,approveDelivery} = require("../controller/Admincontroller");

// Route to get admin dashboard data
router.get("/dashboard", getAdminDashboardData);
router.post("/:orderId/cancel",cancelOrder);
router.post("/:orderId/approve-delivery", approveDelivery);
module.exports = router;
