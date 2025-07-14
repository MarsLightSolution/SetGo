// controllers/userController.js
const User = require('../models/user');
const redisClient = require('../utils/redisClient');
const logger = require('../utils/logger');

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

module.exports = { getUsers };
