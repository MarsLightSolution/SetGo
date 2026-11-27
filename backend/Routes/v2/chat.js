// /api/v2/chat — like /api/chat, login required, participants only (controller/v2/chat.controller).
const express = require("express");
const verifyJWT = require("../../middlewares/auth.middlewares");
const { uploadChatFiles } = require("../../middlewares/multer.middleware");
const c = require("../../controller/v2/chat.controller");

const router = express.Router();
router.use(verifyJWT);

router.post("/connect", c.connectUser);
router.get("/users", c.getAllUsers);
router.get("/user/:username", c.getUserByUsername);
router.get("/conversations/:userIdentifier", c.getConversations);
router.post("/conversations", c.createOrGetConversation);
router.post("/conversation/get-or-create", c.getOrCreateConversation);
router.get("/messages/:conversationId", c.getMessages);
router.post("/messages", c.sendMessage);
router.post("/upload", uploadChatFiles.single("file"), c.uploadFile);

module.exports = router;
