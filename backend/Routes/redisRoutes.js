const express = require('express');
const router = express.Router();
const redisClient = require('../utils/redisClient');
const verifyToken = require('../middlewares/auth.middlewares');
// Admin-only guard (after verifyToken, which sets req.user).
const adminOnly = (req, res, next) =>
  req.user?.role === 'admin' ? next() : res.status(403).json({ success: false, message: 'Admin access required' });

// SECURITY: admin only (was public).
router.get('/clear-cache', verifyToken, adminOnly, async (req, res) => {
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
