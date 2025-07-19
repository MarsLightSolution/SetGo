const express = require("express");
const router = express.Router();
const  uploadPictures  = require("../middlewares/multer.middleware.js");
const verifyJWT = require("../middlewares/auth.middlewares.js");
const {
  addProduct,
  getProducts,
  getProductById,
  markProductAsSold,
  getNearbyProducts
} = require("../controller/product.controller.js");

router.post("/add"
  ,verifyJWT
  , uploadPictures.fields([

    { name: "pictures", maxCount: 8 }
  ]), addProduct);


// // Get all products 
router.get("/getProducts"
  ,verifyJWT,getProducts);

router.get("/product/:id"
  // ,verifyJWT
  , getProductById);

router.get("/nearby"
  // ,verifyJWT
  , getNearbyProducts);  
// Test route
router.route("/try").post((req, res) => {
  res.send("Test passed");
});

module.exports = router;
