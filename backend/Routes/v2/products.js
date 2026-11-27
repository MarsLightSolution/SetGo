// /api/v2/products — product writes with ownership checks (reads stay on /getProducts etc.).
const express = require("express");
const verifyJWT = require("../../middlewares/auth.middlewares");
const { uploadPictures } = require("../../middlewares/multer.middleware");
const { createProductLimiter, uploadLimiter } = require("../../middlewares/rateLimiter.middleware");
const { asSelf, productOwnerOrAdmin, ownShopIfAny } = require("../../middlewares/v2Guards.middleware");
const {
  addProduct, updateProduct, deleteProduct, markProductAsSold, updateProductPriority,
} = require("../../controller/product.controller");

const router = express.Router();
const pictures = uploadPictures.fields([{ name: "pictures", maxCount: 8 }]);
router.use(verifyJWT);

// New ad: always owned by the logged-in user; a shop listing needs a shop they own.
router.post("/add", createProductLimiter, uploadLimiter, pictures, asSelf("user"), ownShopIfAny, addProduct);
// Changes: owner or admin only.
router.put("/product/:id", productOwnerOrAdmin("id"), uploadLimiter, pictures, ownShopIfAny, updateProduct);
router.delete("/product/:id", productOwnerOrAdmin("id"), deleteProduct);
router.patch("/mark-sold/:productId", productOwnerOrAdmin("productId"), markProductAsSold);
router.put("/priority/:productId", productOwnerOrAdmin("productId"), updateProductPriority);

module.exports = router;
