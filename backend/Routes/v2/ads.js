// /api/v2/ads — banner ad management, admins only. Public ad reads/tracking stay on /api/ads.
const express = require("express");
const verifyJWT = require("../../middlewares/auth.middlewares");
const { adminOnly } = require("../../middlewares/v2Guards.middleware");
const { uploadAdImage } = require("../../middlewares/multer.middleware");
const { getAllAds, getAdStats, createAd, updateAd, deleteAd } = require("../../controller/adController");

const router = express.Router();
router.use(verifyJWT, adminOnly);

router.get("/admin/all", getAllAds);
router.get("/admin/stats", getAdStats);
router.post("/admin/create", uploadAdImage, createAd);
router.put("/admin/:id", uploadAdImage, updateAd);
router.delete("/admin/:id", deleteAd);

module.exports = router;
