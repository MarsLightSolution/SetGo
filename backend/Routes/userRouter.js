const express = require('express');
const router = express.Router();
const {getUsers,getUserById,getUserTransactions,getUserWalletBalance} = require('../controller/userController');
const verifyJWT = require("../middlewares/auth.middlewares.js");
var app = express();

// set up rate limiter: maximum of five requests per minute
var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
});
router.get('/get-users', getUsers);  // GET /users
router.get('/get-users/:id', getUserById);
router.get('/:id/transactions'
    // , verifyJWT
    , getUserTransactions);
router.get('/:id/wallet'
    // , verifyJWT
    , getUserWalletBalance);


module.exports = router;
