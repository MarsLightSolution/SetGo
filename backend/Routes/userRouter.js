const express = require('express');
const router = express.Router();
const {getUsers,getUserById} = require('../controller/userController');

router.get('/get-users', getUsers);  // GET /users
router.get('/get-users/:id', getUserById);

module.exports = router;
