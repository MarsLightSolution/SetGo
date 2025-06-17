const express = require('express');
const router = express.Router();
const redisClient = require('../utils/redisClient');

router.get('/clear-cache', async (req, res) => {
  try {
    await redisClient.del('userList');
    res.send({ message: '✅ Redis cache cleared successfully!' });
  } catch (err) {
    console.error('❌ Error clearing cache:', err);
    res.status(500).send({ error: 'Error clearing cache' });
  }
});

module.exports = router;
