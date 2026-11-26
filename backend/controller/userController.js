const User = require('../models/user');
const Transaction= require('../models/transaction.model');
const redisClient = require('../utils/redisClient');
const logger = require('../utils/logger');
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');


// SECURITY: credentials and session material are never sent to any client.
const SECRET_FIELDS = '-password -refreshTokens -resetToken -resetTokenExpiration -pushToken -pushPlatform';
// What anyone (not the user themself) may see about another user.
const PUBLIC_FIELDS = 'username profileName chatDisplayName hasShop shop isOnline lastSeen createdAt';

// The old implementation cached full user documents (password hashes, refresh tokens, reset
// tokens) under this key. Purge it once so that copy can't be served or read again.
const LEGACY_CACHE_KEY = 'userList';
let legacyCachePurged = false;
async function purgeLegacyUserCache() {
  if (legacyCachePurged) return;
  try {
    await redisClient.del(LEGACY_CACHE_KEY);
    legacyCachePurged = true;
  } catch (error) {
    logger.warn('[GetUsers] Could not purge legacy user cache', { error: error.message });
  }
}

// GET /users/get-users — admin only (enforced in the router); no caching.
const getUsers = async (req, res) => {
  try {
    await purgeLegacyUserCache();
    const users = await User.find({}).select(SECRET_FIELDS).lean();
    return res.status(200).json({ data: users });
  } catch (error) {
    logger.error(`[GetUsers] DB error`, { error: error.message });
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /users/get-users/:id — the user themself (or an admin) gets their record without secrets;
// anyone else gets the public profile only.
const getUserById = async (req, res) => {
  const userId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  try {
    const isSelf = String(req.user?._id) === String(userId);
    const isAdmin = req.user?.role === 'admin';
    const user = await User.findById(userId).select(isSelf || isAdmin ? SECRET_FIELDS : PUBLIC_FIELDS).lean();
    if (!user) {
      logger.warn(`[GetUserById] User not found`, { userId });
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ data: user });
  } catch (error) {
    logger.error(`[GetUserById] Error`, { error: error.message });
    return res.status(500).json({ error: 'Server error' });
  }
};
// GET /api/users/:id/transactions
const getUserTransactions = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ApiError(400, "Invalid user id");

  const user = await User.findById(id, "walletBalance username");
  if (!user) throw new ApiError(404, "User not found");

  // Transaction is the single ledger - history is derived from it, not stored on the user
  const txDocs = await Transaction.find(Transaction.walletEntriesFilter(user._id))
    .sort({ createdAt: -1 })
    .lean();

  // One ledger row can appear as a debit (sender) and/or a credit (receiver) for this user
  const entries = [];
  for (const tx of txDocs) {
    const isReceiver = tx.receiverId && tx.receiverId.toString() === id;
    const isSender = tx.senderId && tx.senderId.toString() === id && tx.paymentMode !== "online";
    if (isSender) entries.push({ tx, direction: "debit", counterpartyId: tx.receiverId });
    if (isReceiver) entries.push({ tx, direction: "credit", counterpartyId: tx.senderId });
  }

  // Resolve every counterparty in one query
  const cpIds = [...new Set(entries.map((e) => e.counterpartyId?.toString()).filter(Boolean))];
  const cpUsers = await User.find({ _id: { $in: cpIds } }, "username").lean();
  const cpMap = new Map(cpUsers.map((u) => [u._id.toString(), u]));

  let totalCredit = 0;
  let totalDebit = 0;

  // Same response shape the frontend already consumes
  const transactions = entries.map(({ tx, direction, counterpartyId }) => {
    if (direction === "credit") totalCredit += tx.amount;
    else totalDebit += tx.amount;

    const cp = counterpartyId ? cpMap.get(counterpartyId.toString()) : null;
    return {
      _id: tx._id,
      transactionId: tx.transactionId,
      amount: tx.amount,
      direction,
      createdAt: tx.createdAt,
      status: tx.status || "unknown",
      counterparty: cp ? { _id: cp._id, username: cp.username } : null,
    };
  });

  res.json(
    new ApiResponse(200, {
      transactions,
      totalCredit,
      totalDebit,
      walletBalance: user.walletBalance,
    }, "User transactions")
  );
});

const getUserWalletBalance = asyncHandler(async(req,res)=>{
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ApiError(400, "Invalid user id");

  // ① Fetch just the wallet balance
  const user = await User.findById(id, " walletBalance username");
  if (!user) throw new ApiError(404, "User not found");
  res.json(
    new ApiResponse(200, {
      walletBalance: user.walletBalance,
    })
  );
});

module.exports = {
  getUsers,
  getUserById,
  getUserTransactions,
  getUserWalletBalance
};
