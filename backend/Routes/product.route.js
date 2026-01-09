const express = require("express");
const router = express.Router();
const { uploadPictures } = require("../middlewares/multer.middleware.js");
const verifyJWT = require("../middlewares/auth.middlewares.js");
const { createProductLimiter, uploadLimiter } = require("../middlewares/rateLimiter.middleware");
const {
  addProduct,
  getProducts,
  getProductById,
  getProductsByUser,
  updateProduct,
  deleteProduct,
  markProductAsSold,
  getProductsByCategory,
  getNearbyProducts,
  getPriorityProducts
  ,updateProductPriority
} = require("../controller/product.controller.js");

// SECURITY: Adding product requires authentication + rate limiting to prevent spam
router.post("/add",
  verifyJWT,
  createProductLimiter,
  uploadLimiter,
  uploadPictures.fields([
    { name: "pictures", maxCount: 8 }
  ]),
  addProduct
);

// // Get all products 
router.get("/getProducts"
  // ,verifyJWT
  ,getProducts);

router.get("/product/:id"
  // ,verifyJWT
  , getProductById);
// Get product by ID
// router.get("/product/:id", verifyJWT, getProductById);

// Get all ads/products by a specific user
router.get("/user/:userId/ads", getProductsByUser);

// SECURITY: Delete product requires authentication (user must own the product)
router.delete("/product/:id", verifyJWT, deleteProduct);

// SECURITY: Update product requires authentication (user must own the product)
router.put(
  "/product/:id",
  verifyJWT,
  uploadLimiter,
  uploadPictures.fields([{ name: "pictures", maxCount: 8}]),
  updateProduct
);


router.get("/nearby"
  , getNearbyProducts);  

router.route("/try").post((req, res) => {
  res.send("Test passed");
});

// SECURITY: Mark as sold requires authentication (user must own the product)
router.patch("/mark-sold/:productId", verifyJWT, markProductAsSold);
router.get('/category/:category', getProductsByCategory);
router.route("/productadds")
router.get("/priority", getPriorityProducts);
// SECURITY: Update priority requires authentication
router.put("/priority/:productId", verifyJWT, updateProductPriority);
module.exports = router;
