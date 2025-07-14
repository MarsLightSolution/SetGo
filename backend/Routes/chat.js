const express = require("express");
const router = express.Router();
const chat = require("../controller/chatcontroller");

router.post("/connect", chat.connectUser);
router.get("/users", chat.getUsers);
router.get("/user/:username", chat.getUserByUsername);
router.get("/conversations/:username", chat.getConversations);
router.post("/conversations", chat.createConversation);
router.get("/messages/:conversationId", chat.getMessages);
router.post("/messages", chat.sendMessage);

module.exports = router;
