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
const { uploadConcernImages } = require("../middlewares/multer.middleware.js"); 


// Add uploadConcernImages
// ✅ All routes are now PUBLIC (no verifyToken middleware)

// User routes
router.post(
  "/raise",
  uploadConcernImages.fields([{ name: "images", maxCount: 3 }]),
  concernController.raiseConcern
);
router.get("/user", getUserConcerns);
router.get("/all", getAllConcerns);
router.get("/admin/all", concernController.getAllConcerns);
router.get("/admin/statistics", concernController.getConcernStatistics);
router.get("/:concernId", getConcernDetails);

// Admin routes
router.post("/:concernId/response", concernController.addAdminResponse);
router.patch("/:concernId/status", concernController.updateConcernStatus);
router.post("/:concernId/close", concernController.closeConcernWithMessage);
router.post("/:concernId/reopen", concernController.reopenConcern);

module.exports = router;