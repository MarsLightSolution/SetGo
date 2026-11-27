const express = require("express");
const router = express.Router();
const TwillioController = require("../controller/Twilliocontroller");
const verifyJWT = require("../middlewares/auth.middlewares");
const rateLimit = require("express-rate-limit");

// Own limiter (not shared with login): 10 OTP requests per 15 minutes per IP.
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

// SECURITY: phone verification is for the logged-in user only. These were public and keyed on
// an email in the body, so anyone could attach their phone to any account (and send SMS at our
// cost to any number). The email is now always the logged-in user's; sending is rate limited.
const asSelf = (req, res, next) => {
  req.body = { ...(req.body || {}), email: req.user.email };
  next();
};

router.post("/send-otp", verifyJWT, otpLimiter, asSelf, TwillioController.sendOTP);
router.post("/verify-otp", verifyJWT, otpLimiter, asSelf, TwillioController.verifyOTP);
module.exports = router
