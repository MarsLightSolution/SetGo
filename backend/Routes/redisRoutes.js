const express = require('express');
const router = express.Router();
const redisClient = require('../utils/redisClient');

router.get('/clear-cache', async (req, res) => {
  try {
    await redisClient.del('userList');
    res.send({ message: '✅ Redis cache cleared successfully!' });
  } catch (err) {
    const logger = require('../utils/logger');
    logger.error('Error clearing cache', { message: err.message, stack: err.stack });
    res.status(500).send({ error: 'Error clearing cache' });
  }
});

module.exports = router;
