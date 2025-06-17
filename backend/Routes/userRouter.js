const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

router.get('/get-users', userController.getUsers);  // GET /users


module.exports = router;
