// /api/v2/otp — phone verification for the logged-in user only, rate limited.
const express = require("express");
const verifyJWT = require("../../middlewares/auth.middlewares");
const { asSelf, limiter } = require("../../middlewares/v2Guards.middleware");
const T = require("../../controller/Twilliocontroller");

const router = express.Router();
const otpLimiter = limiter(10); // 10 per 15 min per IP
const ownEmail = asSelf({ email: "email" });

router.post("/send-otp", verifyJWT, otpLimiter, ownEmail, T.sendOTP);
router.post("/verify-otp", verifyJWT, otpLimiter, ownEmail, T.verifyOTP);

module.exports = router;
