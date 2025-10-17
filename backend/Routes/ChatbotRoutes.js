const express = require("express");
const router = express.Router();
const chatbotController = require("../controller/ChatBotController");

router.post("/ask", chatbotController.getChatResponse);

module.exports = router;
