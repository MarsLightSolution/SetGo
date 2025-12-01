const express = require("express");
const router = express.Router();

// Import controller
const {
  createShop,
  getMyShop,
  getAllShops,
  getShopById,
  updateShop,
  deleteShop,
  getShopProducts,
  toggleFollowShop,
} = require("../controller/shopController");

// Import auth middleware
const verifyToken = require("../middlewares/auth.middlewares");

// Import multer for shop uploads
const { uploadShopImages } = require("../middlewares/multer.middleware");

// =====================================================
// SHOP ROUTES
// =====================================================
// IMPORTANT: Order matters! Specific routes BEFORE dynamic :id routes

// Protected routes with specific paths (MUST come first)
router.get("/my-shop", verifyToken, getMyShop);  // GET /api/shops/my-shop

// Public routes
router.get("/", getAllShops);                    // GET /api/shops

// Dynamic routes (MUST come after specific routes)
router.get("/:id", getShopById);                 // GET /api/shops/:id (accepts ID or slug)
router.get("/:id/products", getShopProducts);    // GET /api/shops/:id/products

// Protected routes with dynamic :id
router.post(
  "/",
  verifyToken,
  uploadShopImages,
  createShop
);                                               // POST /api/shops

router.put(
  "/:id",
  verifyToken,
  uploadShopImages,
  updateShop
);                                               // PUT /api/shops/:id

router.delete("/:id", verifyToken, deleteShop);  // DELETE /api/shops/:id

router.post("/:id/follow", verifyToken, toggleFollowShop);  // POST /api/shops/:id/follow

module.exports = router;