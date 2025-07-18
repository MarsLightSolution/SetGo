// controllers/transaction.controller.js
const express = require("express");
const router = express.Router();
const Transaction = require("../models/transaction.model.js");
const User = require("../models/user.js");
const asyncHandler = require("../utils/asyncHandler");

/* -----------------------------------------------------------
   Fund transfer – now checks sender has enough balance
----------------------------------------------------------- */
const fundTransfer = asyncHandler(async (req, res) => {
  const { senderId, receiverId, amount,transactionId } = req.body;

  // 1️⃣ Basic sanity check
  if (amount <= 0) {
    return res.status(400).json({
      message: "Amount must be greater than 0",
      success: false,
    });
  }

  // 2️⃣ Get sender wallet balance
  const sender = await User.findById(senderId).select("walletBalance");
  if (!sender) {
    return res.status(404).json({
      message: "Sender account not found",
      success: false,
    });
  }

  // 3️⃣ Insufficient funds?
  if (sender.walletBalance < amount) {
    return res.status(400).json({
      message: "Insufficient wallet balance",
      success: false,
    });
  }

  // 4️⃣ Proceed with transfer
  const session = await User.startSession();
  try {
    session.startTransaction();

    const newTransaction = await Transaction.create([req.body], { session });

    await User.findByIdAndUpdate(
      senderId,
      {
        $inc: { walletBalance: -amount },
        $push: {
          transactionHistory: {
            transactionId,
            amount,
            direction: "debit",
            createdAt: new Date(),
          },
        },
      },
      { session }
    );

    await User.findByIdAndUpdate(
      receiverId,
      {
        $inc: { walletBalance: amount },
        $push: {
          transactionHistory: {
            transactionId,
            amount,
            direction: "credit",
            createdAt: new Date(),
          },
        },
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.json({
      message: "Transaction successful",
      data: newTransaction[0],
      success: true,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    return res.status(500).json({
      message: "Transaction failed",
      data: error.message,
      success: false,
    });
  }
});

/* -----------------------------------------------------------
   Verify receiver exists (unchanged)
----------------------------------------------------------- */
const verifyUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.body.receiver);
    if (user) {
      return res.json({
        message: "Account Verified",
        data: user,
        success: true,
      });
    }
    res.status(404).json({
      message: "Account not found",
      data: null,
      success: false,
    });
  } catch (error) {
    res.status(500).json({
      message: "Account lookup error",
      data: error.message,
      success: false,
    });
  }
});

module.exports = { fundTransfer, verifyUser };
