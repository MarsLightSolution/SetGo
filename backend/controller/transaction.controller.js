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
  const { senderId, receiverId, amount, transactionId, paymentMethod } = req.body;

  // ✅ 1. Validate required fields
  if (!receiverId || !amount || !transactionId || !paymentMethod) {
    return res.status(400).json({
      message: "Missing required fields",
      success: false,
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      message: "Amount must be greater than 0",
      success: false,
    });
  }

  if (!["wallet", "online"].includes(paymentMethod)) {
    return res.status(400).json({
      message: "Invalid payment method",
      success: false,
    });
  }

  // ✅ 2. If wallet, check sender exists and has enough balance
  if (paymentMethod === "wallet") {
    if (!senderId) {
      return res.status(400).json({
        message: "Sender ID is required for wallet payments",
        success: false,
      });
    }

    const sender = await User.findById(senderId).select("walletBalance");
    if (!sender) {
      return res.status(404).json({
        message: "Sender account not found",
        success: false,
      });
    }

    if (sender.walletBalance < amount) {
      return res.status(400).json({
        message: "Insufficient wallet balance",
        success: false,
      });
    }
  }

  // ✅ 3. Proceed with transaction using session
  const session = await User.startSession();

  try {
    session.startTransaction();

    // Create transaction record
    const newTransaction = await Transaction.create([req.body], { session });

    // ✅ Log sender side (debit or log only)
    if (paymentMethod === "wallet" || paymentMethod === "online") {
      const senderUpdate = {
        $push: {
          transactionHistory: {
            transactionId,
            amount,
            direction: "debit",
            method: paymentMethod,
            createdAt: new Date(),
          },
        },
      };

      if (paymentMethod === "wallet") {
        senderUpdate.$inc = { walletBalance: -amount };
      }

      await User.findByIdAndUpdate(senderId, senderUpdate, { session });
    }

    // ✅ Log receiver side (credit and wallet increase)
    await User.findByIdAndUpdate(
      receiverId,
      {
        $inc: { walletBalance: amount },
        $push: {
          transactionHistory: {
            transactionId,
            amount,
            direction: "credit",
            method: paymentMethod,
            createdAt: new Date(),
          },
        },
      },
      { session }
    );

    // ✅ Commit the transaction
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
    console.error("Transaction failed:", error);
    return res.status(500).json({
      message: "Transaction failed",
      error: error.message,
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
