const Transaction = require('../models/transaction.model.js');
const User = require('../models/user.js');
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require('mongoose');
const logger = require('../utils/logger'); // Import the logger

const walletTransfer = asyncHandler(async (req, res) => {
  const { senderId, receiverId, amount, transactionId, description } = req.body;
  logger.info(`[WalletTransfer] Request received from sender: ${senderId} to receiver: ${receiverId} for amount: ${amount}`);

  // Use an existing session if provided, otherwise create a new one
  const session = req.body.session || await mongoose.startSession();
  const useExternalSession = !!req.body.session;

  if (!useExternalSession) {
    session.startTransaction();
    logger.info(`[WalletTransfer] Started new transaction session.`);
  }

  try {
    if (!senderId || !receiverId || !amount || !transactionId) {
        logger.warn(`[WalletTransfer] Validation failed: Missing required fields.`);
        throw new Error("Missing required fields: senderId, receiverId, amount, transactionId");
    }
    if (amount <= 0) {
        logger.warn(`[WalletTransfer] Validation failed: Amount must be greater than zero. Amount: ${amount}`);
        throw new Error("Amount must be greater than zero");
    }

    const sender = await User.findById(senderId).select('walletBalance').session(session);
    if (!sender) {
        logger.warn(`[WalletTransfer] Sender not found: ${senderId}`);
        throw new Error("Sender not found");
    }
    if (sender.walletBalance < amount) {
        logger.warn(`[WalletTransfer] Insufficient balance for sender: ${senderId}. Balance: ${sender.walletBalance}, Amount: ${amount}`);
        throw new Error("Insufficient wallet balance");
    }

    const receiver = await User.findById(receiverId).session(session);
    if (!receiver) {
        logger.warn(`[WalletTransfer] Receiver not found: ${receiverId}`);
        throw new Error("Receiver not found");
    }

    await Transaction.create([{
      senderId,
      receiverId,
      amount,
      transactionId,
      description,
      status: "success",
      paymentMode: "Wallet",
      type: "transfer",
    }], { session });

    await User.findByIdAndUpdate(senderId, {
      $inc: { walletBalance: -amount },
      $push: { transactionHistory: { transactionId, amount, direction: "debit", createdAt: new Date() } }
    }, { session });

    await User.findByIdAndUpdate(receiverId, {
      $inc: { walletBalance: amount },
      $push: { transactionHistory: { transactionId, amount, direction: "credit", createdAt: new Date() } }
    }, { session });

    if (!useExternalSession) {
      await session.commitTransaction();
      logger.info(`[WalletTransfer] Transaction committed successfully for transactionId: ${transactionId}`);
    }
    
    res.json({ success: true, message: "Wallet transfer successful" });

  } catch (error) {
    logger.error(`[WalletTransfer] Error during transfer for transactionId ${transactionId}: ${error.stack}`);
    if (!useExternalSession) {
      await session.abortTransaction();
      logger.info(`[WalletTransfer] Transaction aborted for transactionId: ${transactionId}`);
    }
    // Let the asyncHandler handle the response
    throw error; 
  } finally {
    if (!useExternalSession) {
      session.endSession();
    }
  }
});


/**
 * Online wallet transfer service (no req/res here).
 * This function is designed to be called by other services, like a payment gateway callback.
 */
async function onlineWalletTransfer(payload, session = null) {
  const { senderId, receiverId, amount, transactionId, description = '' } = payload;
  logger.info(`[OnlineWalletTransfer] Service called for receiver: ${receiverId}, amount: ${amount}, transactionId: ${transactionId}`);

  const useExternalSession = !!session;
  const dbSession = session || await mongoose.startSession();
  if (!useExternalSession) {
    dbSession.startTransaction();
    logger.info(`[OnlineWalletTransfer] Started new transaction session for transactionId: ${transactionId}`);
  }

  try {
    if (!receiverId || !amount || !transactionId) {
      logger.warn(`[OnlineWalletTransfer] Validation failed: Missing required fields.`);
      throw new Error('Missing required fields: receiverId, amount, transactionId');
    }
    if (amount <= 0) {
      logger.warn(`[OnlineWalletTransfer] Validation failed: Amount must be > 0. Amount: ${amount}`);
      throw new Error('Amount must be greater than zero');
    }

    const receiver = await User.findById(receiverId).session(dbSession);
    if (!receiver) {
      logger.warn(`[OnlineWalletTransfer] Receiver not found: ${receiverId}`);
      throw new Error('Receiver not found');
    }
    
    if (senderId) {
      const sender = await User.findById(senderId).select('_id').session(dbSession);
      if (!sender) {
        logger.warn(`[OnlineWalletTransfer] Provided senderId not found: ${senderId}`);
        throw new Error('Sender not found');
      }
    }

    const [newTransaction] = await Transaction.create([{
      senderId: senderId || null,
      receiverId: receiverId,
      amount,
      transactionId,
      description,
      status: 'success',
      paymentMode: 'online',
      type: 'transfer',
    }], { session: dbSession });

    await User.findByIdAndUpdate(receiverId, {
      $inc: { walletBalance: amount },
      $push: { transactionHistory: { transactionId, amount, direction: "credit", createdAt: new Date() } }
    }, { session: dbSession });

    if (!useExternalSession) {
      await dbSession.commitTransaction();
      logger.info(`[OnlineWalletTransfer] Transaction committed successfully for transactionId: ${transactionId}`);
    }

    return { success: true, transaction: newTransaction };
  } catch (err) {
    logger.error(`[OnlineWalletTransfer] Error during transfer for transactionId ${transactionId}: ${err.stack}`);
    if (!useExternalSession) {
      await dbSession.abortTransaction();
      logger.info(`[OnlineWalletTransfer] Transaction aborted for transactionId: ${transactionId}`);
    }
    throw err; // Re-throw the error to be handled by the calling function
  } finally {
    if (!useExternalSession) {
      dbSession.endSession();
    }
  }
}

module.exports = {
  walletTransfer,
  onlineWalletTransfer
};
