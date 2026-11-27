// /api/v2/redis — admin only.
const express = require("express");
const verifyJWT = require("../../middlewares/auth.middlewares");
const { adminOnly } = require("../../middlewares/v2Guards.middleware");
const { clearCache } = require("../../controller/v2/admin.controller");

const router = express.Router();

router.get("/clear-cache", verifyJWT, adminOnly, clearCache);

module.exports = router;
