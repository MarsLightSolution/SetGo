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
const verifyJWT = require("../middlewares/auth.middlewares.js");

// SECURITY: every route below requires a verified login (verifyJWT sets req.user).
// It used to be entirely public and trusted a `userId`/`adminId` sent in the request
// body/query - anyone could submit as, reply as, or close tickets as any account by
// simply passing a different id (the frontend even shipped with hardcoded fallback
// ids). Identity now always comes from the verified token, never from client input.
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

// User routes - any authenticated user
router.post(
  "/raise",
  verifyJWT,
  uploadConcernImages.fields([{ name: "images", maxCount: 3 }]),
  concernController.raiseConcern
);
router.get("/user", verifyJWT, getUserConcerns);
router.get("/:concernId", verifyJWT, getConcernDetails);

// Admin routes - authenticated AND role === "admin"
router.get("/all", verifyJWT, requireAdmin, getAllConcerns);
router.get("/admin/all", verifyJWT, requireAdmin, concernController.getAllConcerns);
router.get("/admin/statistics", verifyJWT, requireAdmin, concernController.getConcernStatistics);
router.post("/:concernId/response", verifyJWT, requireAdmin, concernController.addAdminResponse);
router.patch("/:concernId/status", verifyJWT, requireAdmin, concernController.updateConcernStatus);
router.post("/:concernId/close", verifyJWT, requireAdmin, concernController.closeConcernWithMessage);
router.post("/:concernId/reopen", verifyJWT, requireAdmin, concernController.reopenConcern);

module.exports = router;
