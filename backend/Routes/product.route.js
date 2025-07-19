const express = require("express");
const router = express.Router();
const uploadPictures = require("../middlewares/multer.middleware.js");
const verifyJWT = require("../middlewares/auth.middlewares.js");
const {
  addProduct,
  getProducts,
  getProductById,
  getProductsByUser,
  updateProduct,
  deleteProduct,
  markProductAsSold,
  getProductsByCategory,
  getNearbyProducts
} = require("../controller/product.controller.js");

router.post("/add",
  verifyJWT,
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
router.get("/user/:userId/ads", verifyJWT, getProductsByUser);

// Delete product by ID
router.delete("/product/:id", verifyJWT, deleteProduct);

// Update product by ID
router.put(
  "/product/:id",
  verifyJWT,
  uploadPictures.fields([{ name: "pictures", maxCount: 20 }]),
  updateProduct
);


router.get("/nearby"
  ,verifyJWT
  , getNearbyProducts);  
// Test route

router.route("/try").post((req, res) => {
  res.send("Test passed");
});

router.patch("/mark-sold/:productId", markProductAsSold);
router.get('/category/:category', getProductsByCategory);
router.route("/productadds")
module.exports = router;
