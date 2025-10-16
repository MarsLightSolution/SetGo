const express = require("express");
const router = express.Router();
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

module.exports = router;