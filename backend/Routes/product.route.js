const express = require("express");
const router = express.Router();
const  uploadPictures  = require("../middlewares/multer.middleware.js");
const verifyJWT = require("../middlewares/jwt.middleware.js");

const {
  addProduct,
  getProducts,
  getProductById
} = require("../controller/product.controller.js");

router.post("/add"
  ,verifyJWT
  , uploadPictures.fields([

    { name: "pictures", maxCount: 8 }
  ]), addProduct);

router.get("/getProducts",getProducts);

router.get("/product/:id", getProductById);
// Test route
router.route("/try").post((req, res) => {
  res.send("Test passed");
});

module.exports = router;
