const express = require("express");
const router = express.Router();
const { uploadPictures } = require("../middlewares/multer.middleware.js");
const verifyJWT = require("../middlewares/jwt.middleware.js");

const {
  addProduct,
  getProducts,
  getProductById
} = require("../controller/product.controller.js");

router.post("/add"
  , uploadPictures.fields([
    { name: "pictures", maxCount: 8 }
  ]), addProduct);


// // Get all products 
router.get("/getProducts"
  ,getProducts);

router.get("/product/:id", getProductById);
// Test route
router.route("/try").post((req, res) => {
  res.send("Test passed");
});

module.exports = router;
