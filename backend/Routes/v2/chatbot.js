// /api/v2/chatbot — login required; order answers only from the caller's own orders.
const express = require("express");
const verifyJWT = require("../../middlewares/auth.middlewares");
const { ask } = require("../../controller/v2/chatbot.controller");

const router = express.Router();

router.post("/ask", verifyJWT, ask);

module.exports = router;
