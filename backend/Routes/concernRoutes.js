const express = require("express");
const router = express.Router();
const concernController = require("../controller/concernController.js");
const {
  raiseConcern,
  getUserConcerns,
  getConcernDetails,
  addAdminResponse,
  updateConcernStatus,
  getAllConcerns
} = require("../controller/concernController.js");

// ✅ All routes are now PUBLIC (no verifyToken middleware)

// User routes
router.post("/raise", raiseConcern);
router.get("/user", getUserConcerns);
router.get("/all", getAllConcerns); // Admin view all concerns
router.get("/:concernId", getConcernDetails);

// Admin routes
router.post("/:concernId/response", addAdminResponse);
router.patch("/:concernId/status", updateConcernStatus);
router.get("/admin/all", concernController.getAllConcerns);

// Get concern statistics (admin dashboard)
router.get("/admin/statistics", concernController.getConcernStatistics);

// Add admin response to a concern
router.post("/:concernId/response", concernController.addAdminResponse);

// Update concern status
router.patch("/:concernId/status", concernController.updateConcernStatus);

// ⭐ NEW: Close concern with admin message (triggers email)
router.post("/:concernId/close", concernController.closeConcernWithMessage);

// ⭐ NEW: Reopen a closed concern
router.post("/:concernId/reopen", concernController.reopenConcern);

module.exports = router;