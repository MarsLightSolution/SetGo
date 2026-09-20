const User = require('../models/user');
const Transaction= require('../models/transaction.model');
const redisClient = require('../utils/redisClient');
const logger = require('../utils/logger');
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');


// Get all users (cached)
const getUsers = async (req, res) => {
  const cacheKey = 'userList';

  try {
    logger.info(`[GetUsers] Checking Redis cache`, { cacheKey });

    const cachedData = await redisClient.get(cacheKey);
    const parsedData = cachedData ? JSON.parse(cachedData) : null;

    if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
      logger.info(`[GetUsers] Cache hit`, { fromRedis: true, count: parsedData.length });

      return res.status(200).json({
        fromRedis: true,
        data: parsedData
      });
    }

    logger.info(`[GetUsers] Cache miss. Querying DB...`);

    const users = await User.find({});

    await redisClient.set(cacheKey, JSON.stringify(users), {
      EX: 3600 // 1 hour
    });

    logger.info(`[GetUsers] DB fetched and cached`, { fromRedis: false, count: users.length });

    return res.status(200).json({
      fromRedis: false,
      data: users
    });

  } catch (error) {
    logger.error(`[GetUsers] Redis or DB error`, { error: error.message });
    return res.status(500).json({ error: 'Server error' });
  }
};

// ✅ New controller: Get a single user by ID
const getUserById = async (req, res) => {
  const userId = req.params.id;

  try {
    logger.info(`[GetUserById] Fetching user`, { userId });

    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`[GetUserById] User not found`, { userId });
      return res.status(404).json({ message: 'User not found' });
    }

    logger.info(`[GetUserById] User fetched`, { userId });
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
