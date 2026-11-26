const express = require("express");
const router = express.Router();
const Authcontroller = require("../controller/Authcontroller");
const verifyToken = require("../middlewares/auth.middlewares");
const { authLimiter, createAccountLimiter } = require("../middlewares/rateLimiter.middleware");
const { validateSignup, validateLogin, validateResetPassword } = require("../middlewares/validation.middleware");

// SECURITY: Strict rate limiting + input validation on authentication routes
router.post("/signup", createAccountLimiter, validateSignup, Authcontroller.signup);
router.get("/verifyemail", Authcontroller.verifyEmail);
// Mobile "check your inbox" screen polls this (every 5 s) to log in once the email is verified.
// The handler existed but was never routed, so that screen waited forever.
const rateLimit = require("express-rate-limit");
const statusLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
router.get("/check-status", statusLimiter, Authcontroller.checkVerificationStatus);
router.post("/login", authLimiter, validateLogin, Authcontroller.login);
router.post("/refreshAccessToken", authLimiter, Authcontroller.refreshAccessToken);
router.post("/logout", Authcontroller.logout);
router.post("/forgotpassword", authLimiter, Authcontroller.forgetpassword);
router.get("/verifytoken", Authcontroller.verifyResetToken);
router.post("/resetpassword", authLimiter, validateResetPassword, Authcontroller.resetPassword);
router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

module.exports = router
