const express = require("express");
const router = express.Router();
const upload  = require("../middlewares/multer.middleware.js");
// const { verifyJWT } = require("../middlewares/auth.middlewares.js");

const {
  addProduct,
  getPaginatedProducts
} = require("../controller/product.controller.js");

router.route("/add").post(
  upload.fields([
    {
      name: "pictures",
      maxCount: 20,
    },
  ]),
  addProduct
);

// // Get all products 
router.route("/getProducts").get(getPaginatedProducts);

// Test route
router.route("/try").post((req, res) => {
  res.send("Test passed");
});

module.exports = router;
