// /api/v2/notifications — creating arbitrary notifications is admin only.
// (Reading/marking your own notifications stays on /api/notifications, which already uses the token.)
const express = require("express");
const verifyJWT = require("../../middlewares/auth.middlewares");
const { adminOnly } = require("../../middlewares/v2Guards.middleware");
const { createNotification } = require("../../controller/v2/admin.controller");

const router = express.Router();

router.post("/", verifyJWT, adminOnly, createNotification);

module.exports = router;
