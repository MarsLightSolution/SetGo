const express = require("express");
const router = express.Router();
const TwillioController = require("../controller/Twilliocontroller");
router.post("/send-otp", TwillioController.sendOTP);
router.post("/verify-otp", TwillioController.verifyOTP);
module.exports = router

