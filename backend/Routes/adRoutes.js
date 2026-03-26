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

// ── Public routes ───────────────────────────────────────────────────────────
router.get("/public", getPublicAds);
router.post("/:id/impression", trackImpression);
router.post("/:id/click", trackClick);

// ── AdminAds.jsx routes (with auth, /admin/ prefix) ─────────────────────────
router.get("/admin/all", verifyToken, getAllAds);
router.get("/admin/stats", verifyToken, getAdStats);
router.post("/admin/create", verifyToken, uploadAdImage, createAd);
router.put("/admin/:id", verifyToken, uploadAdImage, updateAd);
router.delete("/admin/:id", verifyToken, deleteAd);

// ── Adminpanel.jsx routes (no auth, flat paths) ──────────────────────────────
// These must come AFTER the /admin/* routes to avoid conflicts
router.get("/all", getAllAds);
router.post("/", uploadAdImage, createAd);
router.put("/:id", uploadAdImage, updateAd);
router.delete("/:id", deleteAd);

module.exports = router;
