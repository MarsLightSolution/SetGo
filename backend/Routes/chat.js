const express = require("express")
const router = express.Router()
const chatController = require("../controller/chatcontroller")

router.post("/connect", chatController.connectUser)
router.get("/users", chatController.getAllUsers)
router.get("/conversations/:userIdentifier", chatController.getConversations)
router.post("/conversations", chatController.createOrGetConversation)
router.get("/messages/:conversationId", chatController.getMessages)
router.post("/messages", chatController.sendMessage)
router.post("/upload", chatController.uploadFile)
router.get("/user/:username", chatController.getUserByUsername)

module.exports = router
