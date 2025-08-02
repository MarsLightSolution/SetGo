const express = require("express");
const router = express.Router();
const {walletTransfer} =require("../controller/transaction.controller.js");
const Transaction = require('../models/transaction.model.js');
const verifyJWT = require('../middlewares/auth.middlewares.js');
const { Message } = require('twilio/lib/twiml/MessagingResponse.js');
const User =require("../models/user.js");

// tr

router.post("/transferFund"
    // , verifyJWT 
    ,walletTransfer);

module.exports = router;