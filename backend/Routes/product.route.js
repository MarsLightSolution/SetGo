const express = require("express");
const router = express.Router();
const { uploadPictures } = require("../middlewares/multer.middleware.js");
// const { verifyJWT } = require("../middlewares/auth.middlewares.js");
// const { verifyToken } = require("../middlewares/auth.js");

const {
  addProduct,
  getPaginatedProducts
} = require("../controller/product.controller.js");

router.post("/add"
  , uploadPictures.fields([
    { name: "pictures", maxCount: 20 }
  ]), addProduct);


// // Get all products 
router.get("/getProducts"
  ,getPaginatedProducts);

// Test route
router.route("/try").post((req, res) => {
  res.send("Test passed");
});

module.exports = router;
