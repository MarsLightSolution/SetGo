// controllers/userController.js
const User = require('../models/user');
const redisClient = require('../utils/redisClient');

const getUsers = async (req, res) => {
  const cacheKey = 'userList';

  try {
    const cachedData = await redisClient.get(cacheKey);
    const parsedData = cachedData ? JSON.parse(cachedData) : null;

    if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
      return res.status(200).json({
        fromRedis: true,
        data: parsedData
      });
    }

    const users = await User.find({});

    await redisClient.set(cacheKey, JSON.stringify(users), {
      EX: 3600 // 1 hour
    });

    return res.status(200).json({
      fromRedis: false,
      data: users
    });

  } catch (error) {
    console.error('Redis error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getUsers };
