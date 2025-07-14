const express = require("express");
const router = express.Router();
const Authcontroller = require("../controller/Authcontroller");
router.post("/signup",Authcontroller.signup);
router.get("/verifyemail",Authcontroller.verifyEmail);
router.post("/login", Authcontroller.login);
router.post("/refreshAccessToken", Authcontroller.refreshAccessToken);
router.post("/logout", Authcontroller.logout);
router.post("/forgotpassword", Authcontroller.forgetpassword);
router.get("/verifytoken", Authcontroller.verifyResetToken);
router.post("/resetpassword", Authcontroller.resetPassword);
router.get('/protected', Authcontroller.verifyJWT,(req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
  });

module.exports = router
