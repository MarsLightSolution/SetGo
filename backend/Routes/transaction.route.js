const express = require("express");
const router = express.Router();
const {fundTransfer,verifyUser} =require("../controller/transaction.controller.js");
const Transaction = require('../models/transaction.model.js');
const verifyJWT = require('../middlewares/auth.middlewares.js');
const { Message } = require('twilio/lib/twiml/MessagingResponse.js');
const User =require("../models/user.js");

// transfer money from one account to another


// verify the transaction
router.post("/verifyTransaction", verifyJWT ,verifyUser);
router.post("/transferFund", verifyJWT ,fundTransfer);

module.exports = router;