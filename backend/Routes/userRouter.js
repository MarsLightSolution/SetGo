const express = require('express');
const router = express.Router();
const {getUsers,getUserById,getUserTransactions,getUserWalletBalance} = require('../controller/userController');
const verifyJWT = require("../middlewares/auth.middlewares.js");

// SECURITY: identity always comes from the verified token (req.user), never from the URL.
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};
// The :id in the URL must be the logged-in user, or the caller must be an admin.
const requireSelfOrAdmin = (req, res, next) => {
  if (String(req.user?._id) === String(req.params.id) || req.user?.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Not allowed to access this user' });
};

router.get('/get-users', verifyJWT, requireAdmin, getUsers);
// Own record (or admin): private fields minus secrets; anyone else: public profile only.
router.get('/get-users/:id', verifyJWT, getUserById);
router.get('/:id/transactions', verifyJWT, requireSelfOrAdmin, getUserTransactions);
router.get('/:id/wallet', verifyJWT, requireSelfOrAdmin, getUserWalletBalance);

module.exports = router;
