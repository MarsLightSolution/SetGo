// /api/v2/chat REST handlers (new; the original controller/chatcontroller.js is unchanged).
// Every route requires login. The acting user is always req.user from the verified token, never a
// senderId/username/participant id from the request, and only participants can read or write.
const User = require("../../models/user");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/message");
const mongoose = require("mongoose");
const logger = require("../../utils/logger");

const displayNameOf = (u) => u.chatDisplayName || u.profileName || u.username || "User";
const isAdmin = (req) => req.user?.role === "admin";
const myId = (req) => String(req.user._id);

// Public chat profile — no email or other private fields.
const publicChatUser = (u) => ({
  userId: u._id,
  userName: displayNameOf(u),
  isOnline: u.isOnline,
  lastSeen: u.lastSeen,
});

// Look up another user by id or username (not by email: that would let anyone probe emails).
const findUserByIdOrUsername = async (identifier) => {
  if (!identifier) return null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const byId = await User.findById(identifier);
    if (byId) return byId;
  }
  return User.findOne({ username: String(identifier) });
};

// The conversation, if the user takes part in it (or is an admin); otherwise null.
async function conversationForUser(conversationId, req) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) return null;
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return null;
  const member = conversation.participants.some((p) => String(p.userId) === myId(req));
  return member || isAdmin(req) ? conversation : null;
}

async function findOrCreateConversation(me, other) {
  let conversation = await Conversation.findOne({
    participants: {
      $all: [
        { $elemMatch: { userId: String(me._id) } },
        { $elemMatch: { userId: String(other._id) } },
      ],
    },
  });
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [
        { userId: String(me._id), userName: displayNameOf(me) },
        { userId: String(other._id), userName: displayNameOf(other) },
      ],
    });
  }
  return conversation;
}

// ----------------- User -----------------
// Marks the logged-in user online (the body's username, if any, is ignored).
exports.connectUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isOnline = true;
    user.lastSeen = new Date();
    const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim().slice(0, 50) : "";
    if (displayName) user.chatDisplayName = displayName;
    await user.save();

    res.json({
      success: true,
      user: { userId: user._id, userName: displayNameOf(user), email: user.email, isOnline: user.isOnline },
    });
  } catch (error) {
    logger.error(`[ConnectUser] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to connect" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }, "username profileName chatDisplayName isOnline lastSeen").lean();
    res.json({ success: true, users: users.map(publicChatUser) });
  } catch (error) {
    logger.error(`[GetAllUsers] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

exports.getUserByUsername = async (req, res) => {
  try {
    const user = await findUserByIdOrUsername(req.params.username);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user: publicChatUser(user) });
  } catch (error) {
    logger.error(`[GetUserByUsername] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

// ----------------- Conversation -----------------
// Only the logged-in user's own conversations (the :userIdentifier must be them, unless admin).
exports.getConversations = async (req, res) => {
  try {
    const { userIdentifier } = req.params;
    let userId = myId(req);
    const isMe = [userId, req.user.email, req.user.username].filter(Boolean).includes(userIdentifier);
    if (userIdentifier && !isMe) {
      if (!isAdmin(req)) return res.status(403).json({ success: false, message: "Not allowed" });
      const other = await findUserByIdOrUsername(userIdentifier);
      if (!other) return res.status(404).json({ success: false, message: "User not found" });
      userId = String(other._id);
    }
    const conversations = await Conversation.find({ "participants.userId": userId }).sort({ lastMessageTime: -1 });
    res.json({ success: true, conversations });
  } catch (error) {
    logger.error(`[GetConversations] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
};

// Body: { participants: [me, other] } — "me" is always the logged-in user; the other id is used.
exports.createOrGetConversation = async (req, res) => {
  try {
    const { participants } = req.body || {};
    if (!Array.isArray(participants) || participants.length !== 2) {
      return res.status(400).json({ success: false, message: "Two participants required" });
    }
    const mine = [myId(req), req.user.email, req.user.username].filter(Boolean);
    const otherRef = participants.map(String).find((p) => !mine.includes(p));
    const me = await User.findById(req.user._id);
    const other = await findUserByIdOrUsername(otherRef);
    if (!me || !other) return res.status(404).json({ success: false, message: "User not found." });
    if (String(other._id) === String(me._id)) {
      return res.status(400).json({ success: false, message: "Cannot start a conversation with yourself" });
    }
    res.json({ success: true, conversation: await findOrCreateConversation(me, other) });
  } catch (error) {
    logger.error(`[CreateOrGetConversation] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to create or get conversation" });
  }
};

// Body: { receiverId } (senderId, if sent, is ignored — the sender is the logged-in user).
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { receiverId } = req.body || {};
    if (!receiverId) return res.status(400).json({ success: false, message: "receiverId is required" });
    const me = await User.findById(req.user._id);
    const other = await findUserByIdOrUsername(receiverId);
    if (!me || !other) return res.status(404).json({ success: false, message: "One or both users not found" });
    if (String(other._id) === String(me._id)) {
      return res.status(400).json({ success: false, message: "Cannot start a conversation with yourself" });
    }
    res.json({ success: true, conversation: await findOrCreateConversation(me, other) });
  } catch (error) {
    logger.error(`[GetOrCreateConversation] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to get or create conversation" });
  }
};

// ----------------- Messages -----------------
exports.getMessages = async (req, res) => {
  try {
    const conversation = await conversationForUser(req.params.conversationId, req);
    if (!conversation) return res.status(403).json({ success: false, message: "Not a participant of this conversation" });
    const messages = await Message.find({ conversationId: conversation._id }).sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, messages });
  } catch (error) {
    logger.error(`[GetMessages] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.body || {};
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!conversationId || !text) return res.status(400).json({ success: false, message: "Missing required fields" });
    if (text.length > 5000) return res.status(400).json({ success: false, message: "Message is too long" });

    const conversation = await conversationForUser(conversationId, req);
    if (!conversation) return res.status(403).json({ success: false, message: "Not a participant of this conversation" });

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      senderName: displayNameOf(req.user),
      text,
      messageType: "text",
    });
    await Conversation.findByIdAndUpdate(conversation._id, { lastMessage: text, lastMessageTime: new Date() });
    res.json({ success: true, message });
  } catch (error) {
    logger.error(`[SendMessage] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

// ----------------- File Upload ----------------
exports.uploadFile = async (req, res) => {
  try {
    const { conversationId } = req.body || {};
    if (!conversationId) return res.status(400).json({ success: false, message: "Missing required fields" });
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const conversation = await conversationForUser(conversationId, req);
    if (!conversation) return res.status(403).json({ success: false, message: "Not a participant of this conversation" });

    const isImage = file.mimetype.startsWith("image/");
    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      senderName: displayNameOf(req.user),
      text: isImage ? "📷 Image" : `📄 ${file.originalname}`,
      messageType: isImage ? "image" : "document",
      fileUrl: `/uploads/chat/${file.filename}`, // uploadChatFiles stores into ./uploads/chat
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
    await Conversation.findByIdAndUpdate(conversation._id, { lastMessage: message.text, lastMessageTime: new Date() });
    res.json({ success: true, message });
  } catch (error) {
    logger.error(`[UploadFile] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to upload file" });
  }
};
