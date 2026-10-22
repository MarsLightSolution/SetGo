const mongoose = require('mongoose');
const Transaction = require('../models/transaction.model');
const User = require('../models/user');

class WalletError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// Runs fn(session) inside a Mongo transaction; retries transient errors per the driver's rules,
// so fn must only touch the database through the session it is given.
async function withTransaction(fn) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

// Moves `amount` between two wallets and writes the ledger row, all on `session`.
// The balance guard is part of the debit update itself, so concurrent spends cannot overdraw.
async function transfer(
  { senderId, receiverId, amount, transactionId, description = '', referenceId = null, type = 'transfer', source = 'transfer' },
  session
) {
  if (!session) throw new Error('walletLedger.transfer requires a session');
  if (!(Number.isFinite(amount) && amount > 0)) {
    throw new WalletError('INVALID_AMOUNT', 'Amount must be greater than zero');
  }
  if (!transactionId) throw new WalletError('MISSING_TRANSACTION_ID', 'transactionId is required');
  if (String(senderId) === String(receiverId)) {
    throw new WalletError('SELF_TRANSFER', 'Cannot transfer to the same wallet');
  }

  const receiverExists = await User.exists({ _id: receiverId }).session(session);
  if (!receiverExists) throw new WalletError('RECEIVER_NOT_FOUND', 'Receiver not found', 404);

  const debited = await User.findOneAndUpdate(
    { _id: senderId, walletBalance: { $gte: amount } },
    { $inc: { walletBalance: -amount } },
    { session, projection: { _id: 1 } }
  );
  if (!debited) {
    const senderExists = await User.exists({ _id: senderId }).session(session);
    throw senderExists
      ? new WalletError('INSUFFICIENT_BALANCE', 'Insufficient wallet balance')
      : new WalletError('SENDER_NOT_FOUND', 'Sender not found', 404);
  }

  await User.updateOne({ _id: receiverId }, { $inc: { walletBalance: amount } }, { session });

  try {
    const [txn] = await Transaction.create(
      [{ senderId, receiverId, amount, transactionId, description, referenceId, type, source, paymentMode: 'Wallet', status: 'success' }],
      { session }
    );
    return txn;
  } catch (err) {
    if (err.code === 11000) {
      throw new WalletError('DUPLICATE_TRANSACTION', 'This transaction was already processed', 409);
    }
    throw err;
  }
}

module.exports = { WalletError, withTransaction, transfer };
