const express = require("express");
const router = express.Router();
const Authcontroller = require("../controller/Authcontroller");
const { authLimiter, createAccountLimiter } = require("../middlewares/rateLimiter.middleware");
const { validateSignup, validateLogin, validateResetPassword } = require("../middlewares/validation.middleware");

// SECURITY: Strict rate limiting + input validation on authentication routes
router.post("/signup", createAccountLimiter, validateSignup, Authcontroller.signup);
router.get("/verifyemail", Authcontroller.verifyEmail);
router.post("/login", authLimiter, validateLogin, Authcontroller.login);
router.post("/refreshAccessToken", authLimiter, Authcontroller.refreshAccessToken);
router.post("/logout", Authcontroller.logout);
router.post("/forgotpassword", authLimiter, Authcontroller.forgetpassword);
router.get("/verifytoken", Authcontroller.verifyResetToken);
router.post("/resetpassword", authLimiter, validateResetPassword, Authcontroller.resetPassword);
router.get('/protected', Authcontroller.verifyJWT,(req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
  });

module.exports = router
