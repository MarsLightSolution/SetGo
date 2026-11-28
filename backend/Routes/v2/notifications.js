// /api/v2/notifications — creating arbitrary notifications is admin only.
// (Reading/marking your own notifications stays on /api/notifications, which already uses the token.)
const express = require("express");
const verifyJWT = require("../../middlewares/auth.middlewares");
const { adminOnly } = require("../../middlewares/v2Guards.middleware");
const { createNotification } = require("../../controller/v2/admin.controller");
const { registerPushToken, removePushToken } = require("../../controller/v2/account.controller");

const router = express.Router();

router.post("/", verifyJWT, adminOnly, createNotification);
// This device's push token: belongs to one account at a time; removed again at logout.
router.post("/push-token", verifyJWT, registerPushToken);
router.delete("/push-token", verifyJWT, removePushToken);

module.exports = router;
