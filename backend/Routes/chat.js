const express = require("express");
const router = express.Router();
const chatController = require("../controller/chatcontroller");
const verifyJWT = require("../middlewares/auth.middlewares.js");
const { uploadChatFiles } = require("../middlewares/multer.middleware.js");

// SECURITY: all chat routes require login; the controller takes the acting user from the token
// and checks conversation membership.
router.use(verifyJWT);

// User
router.post("/connect", chatController.connectUser);
router.get("/users", chatController.getAllUsers);
router.get("/user/:username", chatController.getUserByUsername);
router.get("/conversations/:userIdentifier", chatController.getConversations);
router.post("/conversations", chatController.createOrGetConversation);
router.get("/messages/:conversationId", chatController.getMessages);
router.post("/messages", chatController.sendMessage);
router.post("/upload",
  uploadChatFiles.single("file"),  // field name: file
  chatController.uploadFile
);

router.post("/conversation/get-or-create", chatController.getOrCreateConversation);
module.exports = router;
