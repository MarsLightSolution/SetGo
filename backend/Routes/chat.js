const express = require("express");
const router = express.Router();
const chatController = require("../controller/chatcontroller");

// User
router.post("/connect", chatController.connectUser);
router.get("/users", chatController.getAllUsers);
router.get("/user/:username", chatController.getUserByUsername);
router.get("/conversations/:userIdentifier", chatController.getConversations);
router.post("/conversations", chatController.createOrGetConversation);
router.get("/messages/:conversationId", chatController.getMessages);
router.post("/messages", chatController.sendMessage);
router.post("/upload", chatController.uploadFile);
router.post("/conversation/get-or-create", chatController.getOrCreateConversation);
module.exports = router;
