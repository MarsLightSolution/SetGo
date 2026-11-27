// /api/v2/auth
const express = require("express");
const { limiter } = require("../../middlewares/v2Guards.middleware");
const { checkVerificationStatus } = require("../../controller/v2/account.controller");

const router = express.Router();

// Mobile "check your inbox" screen polls this until the email is verified. Public; returns
// only { success, emailVerified }.
router.get("/check-status", limiter(200), checkVerificationStatus);

module.exports = router;
