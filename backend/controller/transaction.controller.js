const Transaction = require('../models/transaction.model.js');
const User = require('../models/user.js');
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require('mongoose');

const walletTransfer = asyncHandler(async (req, res) => {

  const { senderId, receiverId, amount, transactionId, description, session = null } = req.body;
  if (amount <= 0) throw new Error("Amount must be greater than zero");
  console.log(senderId);
  

  const useSession = !!session;
  const dbSession = session || await User.startSession();

  if (!useSession) dbSession.startTransaction();

  try {
    const sender = await User.findById(senderId).select('walletBalance').session(dbSession);
    if (!sender) throw new Error("Sender not found");
    if (sender.walletBalance < amount) throw new Error("Insufficient wallet balance");

    const receiver = await User.findById(receiverId).session(dbSession);
    if (!receiver) throw new Error("Receiver not found");

    const newTransaction = await Transaction.create([
      {
        senderId,
        receiverId,
        amount,
        transactionId,
        description,
        status: "success",
        paymentMode: "Wallet",
        type: "transfer",
      }
    ], { session: dbSession });

    await User.findByIdAndUpdate(senderId, {
      $inc: { walletBalance: -amount },
      $push: { transactionHistory: { transactionId, amount, direction: "debit", createdAt: new Date() } }
    }, { session: dbSession });

    await User.findByIdAndUpdate(receiverId, {
      $inc: { walletBalance: amount },
      $push: { transactionHistory: { transactionId, amount, direction: "credit", createdAt: new Date() } }
    }, { session: dbSession });

    if (!useSession) await dbSession.commitTransaction();
    if (!useSession) dbSession.endSession();
    console.log("paymentdone")
    res.json({ success: true, message: "Wallet transfer successful" });
  } catch (error) {
    if (!useSession) {
      await dbSession.abortTransaction();
      dbSession.endSession();
    }
    throw error;
  }
})

/**
 * Online wallet transfer service (no req/res here).
 * Credits receiver's wallet; does NOT debit sender's wallet.
 * Optionally logs a "debit" entry in sender's transactionHistory.
 *
 * @param {{ senderId?: string, receiverId: string, amount: number, transactionId: string, description?: string }} payload
 * @param {mongoose.ClientSession|null} session Optional Mongoose session
 * @returns {Promise<{ success: boolean, transaction: any }>}
 */
async function onlineWalletTransfer(payload, session = null) {
  const { senderId, receiverId, amount, transactionId, description = '' } = payload;

  if (!receiverId || !amount || !transactionId) {
    throw new Error('Missing required fields: receiverId, amount, transactionId');
  }
  if (amount <= 0) throw new Error('Amount must be greater than zero');

  const useExternalSession = !!session;
  const dbSession = session || await mongoose.startSession();
  if (!useExternalSession) dbSession.startTransaction();

  try {
    // Validate receiver
    const receiver = await User.findById(receiverId).session(dbSession);
    console.log("re  "+receiverId);
    
    if (!receiver) throw new Error('Receiver not found');

    // If you want to log on sender, ensure sender exists (but do NOT check balance for online)
    let sender = null;
    if (senderId) {
      sender = await User.findById(senderId).select('_id').session(dbSession);
      if (!sender) throw new Error('Sender not found');
    }

    // Create Transaction record
    const [newTransaction] = await Transaction.create([{
      senderId: senderId || null,
      receiverId:receiverId || null,
      amount,
      transactionId,
      description,
      status: 'success',
      paymentMode: 'online',    // keep lowercase for consistency
      type: 'transfer',
    }], { session: dbSession });

   await User.findByIdAndUpdate(receiverId, {
      $inc: { walletBalance: amount },
      $push: { transactionHistory: { transactionId, amount, direction: "credit", createdAt: new Date() } }
    }, { session: dbSession });

    if (!useExternalSession) {
      await dbSession.commitTransaction();
      dbSession.endSession();
    }

    return { success: true, transaction: newTransaction };
  } catch (err) {
    if (!useExternalSession) {
      await dbSession.abortTransaction();
      dbSession.endSession();
    }
    throw err;
  }
}

module.exports = {
  walletTransfer,
  onlineWalletTransfer
};
