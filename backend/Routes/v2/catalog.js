// /api/v2/catalog — public reads (no login needed).
const express = require("express");
const { limiter } = require("../../middlewares/v2Guards.middleware");
const C = require("../../controller/v2/catalog.controller");

const router = express.Router();
router.get("/category/:category", limiter(300), C.getProductsByCategory);
router.get("/shops/:id", limiter(300), C.getShop);

module.exports = router;
