const express = require("express");
const router = express.Router();
const {
  getAllAds,
  getAdStats,
  createAd,
  updateAd,
  deleteAd,
  getPublicAds,
  trackImpression,
  trackClick,
} = require("../controller/adController");
const { uploadAdImage } = require("../middlewares/multer.middleware");
const verifyToken = require("../middlewares/auth.middlewares");
// Admin-only guard (after verifyToken, which sets req.user).
const adminOnly = (req, res, next) =>
  req.user?.role === "admin" ? next() : res.status(403).json({ success: false, message: "Admin access required" });

// ── Public routes ───────────────────────────────────────────────────────────
router.get("/public", getPublicAds);
router.post("/:id/impression", trackImpression);
router.post("/:id/click", trackClick);

// ── AdminAds.jsx routes (with auth, /admin/ prefix) ─────────────────────────
// SECURITY: banner ads are managed by admins only (these were open to any user, or to anyone).
router.get("/admin/all", verifyToken, adminOnly, getAllAds);
router.get("/admin/stats", verifyToken, adminOnly, getAdStats);
router.post("/admin/create", verifyToken, adminOnly, uploadAdImage, createAd);
router.put("/admin/:id", verifyToken, adminOnly, uploadAdImage, updateAd);
router.delete("/admin/:id", verifyToken, adminOnly, deleteAd);

// ── Adminpanel.jsx routes (flat paths) ───────────────────────────────────────
// These must come AFTER the /admin/* routes to avoid conflicts
router.get("/all", verifyToken, adminOnly, getAllAds);
router.post("/", verifyToken, adminOnly, uploadAdImage, createAd);
router.put("/:id", verifyToken, adminOnly, uploadAdImage, updateAd);
router.delete("/:id", verifyToken, adminOnly, deleteAd);

module.exports = router;
