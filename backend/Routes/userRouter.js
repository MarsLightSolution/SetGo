const express = require('express');
const router = express.Router();
const {getUsers,getUserById,getUserTransactions,getUserWalletBalance} = require('../controller/userController');
const verifyJWT = require("../middlewares/auth.middlewares.js");

router.get('/get-users', getUsers);  // GET /users
router.get('/get-users/:id', getUserById);
router.get('/:id/transactions'
    // , verifyJWT
    , getUserTransactions);
router.get('/:id/wallet'
    // , verifyJWT
    , getUserWalletBalance);


module.exports = router;
