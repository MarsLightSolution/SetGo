const express = require("express");
const router = express.Router();
const Transaction = require('../models/transaction.model.js');
const verifyJWT = require('../middlewares/auth.middlewares.js');
const { Message } = require('twilio/lib/twiml/MessagingResponse.js');
const User =require("../models/user.js");
// transfer money from one account to another
router.post("/transferFund", verifyJWT ,async(req,res)=>{
    try {
        const newTransaction = new Transaction(req.body);
        await newTransaction.save();

        await User.findByIdAndUpdate(req.body.sender,{
            $inc:{balance: -req.body.amount},
        });

        await User.findByIdAndUpdate(req.body.receiver,{
            $inc:{balance : req.body.amount}
        });

        res.send({
            Message:"Transaction successful",
            data:newTransaction,
            success:true,
        });
    } catch(error){
        res.send({
            Message:"Transaction failed",
            data:error.Message,
            success:false,
        });
    }

});

// verify the transaction
router.post("/verifyTransaction", verifyJWT ,async(req,res)=>{
    try{
        const user = await User.findOne({_id:req.body.receiver});
        if(user){
            res.send({
                Message:"Account Verified",
                data:user,
                success:true,
            });
        }
        else{
            res.send({
                Message:"Account not found",
                data:null,
                success:false,
            });
        }
    }catch(error){
        res.send({
            Message:"Account not found",
            data:error.Message,
            success:false,
        });
    }

});


module.exports = router;