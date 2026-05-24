const User = require("../models/user");
const Conversation = require("../models/Conversation");
const Message = require("../models/message");
const mongoose = require("mongoose");
const logger = require("../utils/logger");
const { sendNotificationToUser } = require("../services/pushService");

// ----------------- Helper -----------------
const findUserByIdentifier = async (identifier) => {
  let user = null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    user = await User.findById(identifier);
  }
  if (!user) {
    user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
  }
  return user;
};

// ----------------- User -----------------
exports.connectUser = async (req, res) => {
  const { username, displayName } = req.body;
  try {
    if (!username) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }

    const user = await findUserByIdentifier(username);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found. Please register first." });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    if (displayName) user.chatDisplayName = displayName;
    await user.save();

    res.json({
      success: true,
      user: {
        userId: user._id,
        userName: user.chatDisplayName || user.profileName || user.username || user.email,
        email: user.email,
        isOnline: user.isOnline,
      }
    });
  } catch (error) {
    logger.error(`[ConnectUser] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to connect" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "username profileName chatDisplayName isOnline lastSeen email");
    const chatUsers = users.map(u => ({
      userId: u._id,
      userName: u.chatDisplayName || u.profileName || u.username,
      email: u.email,
      isOnline: u.isOnline,
      lastSeen: u.lastSeen
    }));

    res.json({ success: true, users: chatUsers });
  } catch (error) {
    logger.error(`[GetAllUsers] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// ----------------- Conversation -----------------
exports.getConversations = async (req, res) => {
  const { userIdentifier } = req.params;
  try {
    const user = await findUserByIdentifier(userIdentifier);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const conversations = await Conversation.find({ "participants.userId": user._id })
      .sort({ lastMessageTime: -1 });

    res.json({ success: true, conversations });
  } catch (error) {
    logger.error(`[GetConversations] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
};

exports.createOrGetConversation = async (req, res) => {
  const { participants } = req.body;
  try {
    if (!participants || participants.length !== 2) {
      return res.status(400).json({ success: false, message: "Two participants required" });
    }

    const user1 = await findUserByIdentifier(participants[0]);
    const user2 = await findUserByIdentifier(participants[1]);
    if (!user1 || !user2) {
      return res.status(404).json({ success: false, message: "One or both users not found." });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [
        { $elemMatch: { userId: user1._id } },
        { $elemMatch: { userId: user2._id } }
      ]}
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { userId: user1._id, userName: user1.chatDisplayName || user1.username || user1.email },
          { userId: user2._id, userName: user2.chatDisplayName || user2.username || user2.email },
        ]
      });
      await conversation.save();
    }

    res.json({ success: true, conversation });
  } catch (error) {
    logger.error(`[CreateOrGetConversation] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to create or get conversation" });
  }
};

// ----------------- Messages -----------------
exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;
  try {
    const messages = await Message.find({ conversationId })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({ success: true, messages });
  } catch (error) {
    logger.error(`[GetMessages] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};

exports.sendMessage = async (req, res) => {
  const { conversationId, senderId, text } = req.body;
  try {
    if (!conversationId || !senderId || !text) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ success: false, message: "Sender not found" });
    }

    const message = new Message({
      conversationId,
      senderId,
      senderName: sender.chatDisplayName || sender.username || sender.email,
      text,
      messageType: "text",
    });
    await message.save();

    const conversation = await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      lastMessageTime: new Date(),
    });

    // Notify the other participant(s) in the background
    if (conversation) {
      const senderObjId = new mongoose.Types.ObjectId(senderId);
      const recipients = conversation.participants.filter(
        (p) => !p.userId.equals(senderObjId)
      );
      const senderName = sender.chatDisplayName || sender.profileName || sender.username;
      for (const recipient of recipients) {
        sendNotificationToUser(recipient.userId, {
          type: 'message',
          title: senderName,
          message: text.length > 80 ? text.slice(0, 80) + '…' : text,
          senderId,
          metadata: { conversationId },
        }).catch(() => {});
      }
    }

    res.json({ success: true, message });
  } catch (error) {
    logger.error(`[SendMessage] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

// ----------------- File Upload ----------------
exports.uploadFile = async (req, res) => {
  try {
    const { conversationId, senderId } = req.body;

    if (!conversationId || !senderId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Validate sender
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ success: false, message: "Sender not found" });
    }

    // Determine file type
    let messageType = "document";
    let displayText = `📄 ${file.originalname}`;
    if (file.mimetype.startsWith("image/")) {
      messageType = "image";
      displayText = "📷 Image";
    }

    // Since chat uploads go directly to ./uploads/chat via uploadChatFiles
    const fileUrl = `/uploads/chat/${file.filename}`;

    // Save message
    const message = new Message({
      conversationId,
      senderId,
      senderName: sender.chatDisplayName || sender.username || sender.email,
      text: displayText,
      messageType,
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
    await message.save();

    // Update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message.text,
      lastMessageTime: new Date(),
    });

    res.json({ success: true, message });
  } catch (error) {
    logger.error(`[UploadFile] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to upload file" });
  }
};

// ----------------- Lookup -----------------
exports.getUserByUsername = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await findUserByIdentifier(username);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        userId: user._id,
        userName: user.chatDisplayName || user.username,
        email: user.email,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    logger.error(`[GetUserByUsername] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};
// ----------------- Get or Create Conversation -----------------
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "Both senderId and receiverId are required",
      });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: "One or both users not found",
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      "participants.userId": { $all: [sender._id, receiver._id] },
    });

    // If not, create a new conversation
    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { userId: sender._id, userName: sender.chatDisplayName || sender.username || sender.email },
          { userId: receiver._id, userName: receiver.chatDisplayName || receiver.username || receiver.email },
        ],
      });
      await conversation.save();
    }

    res.json({ success: true, conversation });
  } catch (error) {
    logger.error(`[GetOrCreateConversation] Error: ${error.stack}`);
    res.status(500).json({
      success: false,
      message: "Failed to get or create conversation",
    });
  }
};
