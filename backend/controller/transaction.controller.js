const Transaction = require('../models/transaction.model.js');
const User = require('../models/user.js');
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require('mongoose');
const logger = require('../utils/logger'); // Import the logger
const { WalletError, withTransaction, transfer } = require('../services/walletLedger');

// The sender is always the authenticated user; the only exception is an admin
// moving money out of the platform wallet (Admin_Id), e.g. releasing held funds.
function resolveSenderId(req) {
  const self = String(req.user._id);
  const requested = req.body.senderId ? String(req.body.senderId) : self;
  if (requested === self) return self;
  if (req.user.role === 'admin' && process.env.Admin_Id && requested === String(process.env.Admin_Id)) {
    return requested;
  }
  return null;
}

const walletTransfer = asyncHandler(async (req, res) => {
  const { receiverId, transactionId, description } = req.body;
  const amount = Number(req.body.amount);

  const senderId = resolveSenderId(req);
  if (!senderId) {
    logger.warn('[WalletTransfer] Rejected: senderId does not match the authenticated user', {
      userId: req.user._id, requestedSenderId: req.body.senderId,
    });
    return res.status(403).json({ success: false, code: 'SENDER_MISMATCH', message: 'You can only transfer from your own wallet' });
  }
  if (!receiverId || !transactionId) {
    return res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'receiverId, amount and transactionId are required' });
  }

  logger.info(`[WalletTransfer] ${senderId} -> ${receiverId} amount ${amount} txn ${transactionId}`);
  try {
    await withTransaction((session) =>
      transfer({ senderId, receiverId, amount, transactionId, description }, session)
    );
    res.json({ success: true, message: "Wallet transfer successful" });
  } catch (err) {
    if (err instanceof WalletError) {
      logger.warn(`[WalletTransfer] ${err.code} for txn ${transactionId}`);
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    throw err;
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
      paymentMode: 'online', // sender paid via gateway; only the receiver's wallet changes
      type: 'transfer',
    }], { session: dbSession });

    await User.findByIdAndUpdate(receiverId, { $inc: { walletBalance: amount } }, { session: dbSession });

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
