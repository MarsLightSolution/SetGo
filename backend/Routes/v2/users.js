// /api/v2/users — like /users, without secrets and with access checks.
const express = require("express");
const verifyJWT = require("../../middlewares/auth.middlewares");
const { adminOnly, selfOrAdmin } = require("../../middlewares/v2Guards.middleware");
const { getUserTransactions, getUserWalletBalance } = require("../../controller/userController");
const { getUsers, getUserById } = require("../../controller/v2/account.controller");

const router = express.Router();
router.use(verifyJWT);

router.get("/get-users", adminOnly, getUsers);
router.get("/get-users/:id", getUserById); // own/admin: private fields; others: public profile
router.get("/:id/transactions", selfOrAdmin("id"), getUserTransactions);
router.get("/:id/wallet", selfOrAdmin("id"), getUserWalletBalance);

module.exports = router;
