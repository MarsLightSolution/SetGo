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

  // ① Fetch user with only the wallet and transactionHistory
  const user = await User.findById(id, "transactionHistory walletBalance username");
  if (!user) throw new ApiError(404, "User not found");

  // ② Pull all distinct txn IDs to resolve counterparties
  const txnIds = user.transactionHistory.map((h) => h.transactionId);

  // ③ Fetch sender & receiver for each txn in one query
  const txDocs = await Transaction.find(
    { transactionId: { $in: txnIds } },
    "transactionId senderId receiverId status"
  ).lean();

  // ④ Create a map for fast lookup
  const txnMap = new Map(txDocs.map((t) => [t.transactionId, t]));

  // ⑤ Build response array and compute totals
  let totalCredit = 0;
  let totalDebit = 0;

  const transactions = await Promise.all(
    user.transactionHistory
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(async (h) => {
        const tx = txnMap.get(h.transactionId);
        let counterpartyId =
          h.direction === "debit" ? tx?.receiverId : tx?.senderId;

        if (h.direction === "credit") totalCredit += h.amount;
        if (h.direction === "debit") totalDebit += h.amount;

        const cp = counterpartyId
          ? await User.findById(counterpartyId, "username").lean()
          : null;

        return {
          ...h.toObject(),
          status: tx?.status || "unknown",
          counterparty: cp ? { _id: cp._id, username: cp.username } : null,
        };
      })
  );

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

  // ① Fetch user with only the wallet and transactionHistory
  const user = await User.findById(id, " walletBalance username");
  if (!user) throw new ApiError(404, "User not found");
  return res.status(200).json({ walletBalance: user.walletBalance });
});

module.exports = {
  getUsers,
  getUserById,
  getUserTransactions,
  getUserWalletBalance
};
