const express = require("express");
const router = express.Router();
const Authcontroller = require("../controller/Authcontroller")
router.post('/signup',Authcontroller.signup);


module.exports = router

