const express = require('express');
const router = express.Router();
const {getUsers,getUserById,getUserTransactions} = require('../controller/userController');
const verifyJWT = require("../middlewares/auth.middlewares.js");

router.get('/get-users', getUsers);  // GET /users
router.get('/get-users/:id', getUserById);
router.get('/:id/transactions'
    // , verifyJWT
    , getUserTransactions);

module.exports = router;
