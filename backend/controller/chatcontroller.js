const User = require("../models/user");
const Conversation = require("../models/Conversation");
const Message = require("../models/message");
const mongoose = require("mongoose");
const logger = require("../utils/logger"); // Import the logger

// Helper function (no logging needed here as it's used within logged contexts)
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

exports.connectUser = async (req, res) => {
  const { username } = req.body;
  logger.info(`[ConnectUser] Attempting to connect user: ${username}`);
  try {
    if (!username) {
      logger.warn(`[ConnectUser] Validation failed: Username is required.`);
      return res.status(400).json({ success: false, message: "Username is required" });
    }

    const user = await findUserByIdentifier(username);
    if (!user) {
      logger.warn(`[ConnectUser] User not found: ${username}`);
      return res.status(404).json({ success: false, message: "User not found. Please register first." });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    if (req.body.displayName) user.chatDisplayName = req.body.displayName;
    await user.save();

    const chatUser = {
      userId: user.email,
      userName: user.chatDisplayName || user.profileName || user.username || user.email,
      email: user.email,
      _id: user._id,
    };

    logger.info(`[ConnectUser] User connected successfully: ${username}`);
    res.json({ success: true, user: chatUser });
  } catch (error) {
    logger.error(`[ConnectUser] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to connect" });
  }
};

exports.getAllUsers = async (req, res) => {
  logger.info(`[GetAllUsers] Request received to fetch all users.`);
  try {
    const users = await User.find({}, "username profileName chatDisplayName isOnline lastSeen email");
    const chatUsers = users.map((user) => ({
      userId: user.email,
      userName: user.chatDisplayName || user.profileName || user.username,
      email: user.email,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    }));
    
    logger.info(`[GetAllUsers] Successfully fetched ${chatUsers.length} users.`);
    res.json({ success: true, users: chatUsers });
  } catch (error) {
    logger.error(`[GetAllUsers] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

exports.getConversations = async (req, res) => {
  const { userIdentifier } = req.params;
  logger.info(`[GetConversations] Request received for user: ${userIdentifier}`);
  try {
    const user = await findUserByIdentifier(userIdentifier);
    if (!user) {
      logger.warn(`[GetConversations] User not found: ${userIdentifier}`);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const conversations = await Conversation.find({ "participants.userId": user.email }).sort({ lastMessageTime: -1 });

    // This enrichment logic can be complex, adding logs inside might be useful if it fails
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const enrichedParticipants = await Promise.all(
          conversation.participants.map(async (participant) => {
            const participantUser = await User.findOne({ email: participant.userId });
            return {
              ...participant.toObject(),
              isOnline: participantUser?.isOnline,
              lastSeen: participantUser?.lastSeen,
            };
          })
        );
        return { ...conversation.toObject(), participants: enrichedParticipants };
      })
    );
    
    logger.info(`[GetConversations] Found ${enrichedConversations.length} conversations for user: ${userIdentifier}`);
    res.json({ success: true, conversations: enrichedConversations });
  } catch (error) {
    logger.error(`[GetConversations] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
};

exports.createOrGetConversation = async (req, res) => {
  const { participants } = req.body;
  logger.info(`[CreateOrGetConversation] Request received for participants: ${participants?.join(', ')}`);
  try {
    if (!participants || participants.length !== 2) {
      logger.warn(`[CreateOrGetConversation] Validation failed: Two participants required.`);
      return res.status(400).json({ success: false, message: "Two participants required" });
    }

    const user1 = await findUserByIdentifier(participants[0]);
    const user2 = await findUserByIdentifier(participants[1]);
    if (!user1 || !user2) {
      logger.warn(`[CreateOrGetConversation] One or both users not found. User1: ${participants[0]}, User2: ${participants[1]}`);
      return res.status(404).json({ success: false, message: "One or both users not found." });
    }

    const user1Email = user1.email;
    const user2Email = user2.email;

    let conversation = await Conversation.findOne({
      "participants.userId": { $all: [user1Email, user2Email] },
    });

    if (!conversation) {
      logger.info(`[CreateOrGetConversation] No existing conversation found. Creating new one for ${user1Email} and ${user2Email}.`);
      conversation = new Conversation({
        participants: [
          { userId: user1Email, userName: user1.chatDisplayName || user1.profileName || user1.username || user1.email },
          { userId: user2Email, userName: user2.chatDisplayName || user2.profileName || user2.username || user2.email },
        ],
      });
      await conversation.save();
    } else {
      logger.info(`[CreateOrGetConversation] Found existing conversation with ID: ${conversation._id}`);
    }
    
    // Enrich participants with online status for the response
    const enrichedParticipants = await Promise.all(
        conversation.participants.map(async (participant) => {
          const user = await User.findOne({ email: participant.userId });
          return {
            ...participant.toObject(),
            isOnline: user?.isOnline,
            lastSeen: user?.lastSeen,
          };
        })
    );

    res.json({ success: true, conversation: { ...conversation.toObject(), participants: enrichedParticipants } });
  } catch (error) {
    logger.error(`[CreateOrGetConversation] Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to create or get conversation" });
  }
};

exports.getMessages = async (req, res) => {
    const { conversationId } = req.params;
    logger.info(`[GetMessages] Request received for conversation ID: ${conversationId}`);
    try {
        const messages = await Message.find({ conversationId }).sort({ timestamp: 1 }).limit(100);
        logger.info(`[GetMessages] Fetched ${messages.length} messages for conversation ID: ${conversationId}`);
        res.json({ success: true, messages });
    } catch (error) {
        logger.error(`[GetMessages] Error fetching messages for conversation ID ${conversationId}: ${error.stack}`);
        res.status(500).json({ success: false, message: "Failed to fetch messages" });
    }
};

exports.sendMessage = async (req, res) => {
    const { conversationId, senderId, text } = req.body;
    logger.info(`[SendMessage] Request received for conversation ID: ${conversationId} from sender: ${senderId}`);
    try {
        if (!conversationId || !senderId || !text) {
            logger.warn(`[SendMessage] Validation failed for conversation ${conversationId}: Missing required fields.`);
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const sender = await User.findOne({ email: senderId });
        if (!sender) {
            logger.warn(`[SendMessage] Sender not found: ${senderId}`);
            return res.status(404).json({ success: false, message: "Sender not found" });
        }

        const message = new Message({
            conversationId,
            senderId,
            senderName: sender.chatDisplayName || sender.profileName || sender.username || sender.email,
            text,
            messageType: "text",
        });
        await message.save();

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: text,
            lastMessageTime: new Date(),
        });

        const io = req.app.get("io");
        if (io) {
            io.to(conversationId).emit("new-message", { conversationId, message });
            logger.info(`[SendMessage] Emitted 'new-message' to room: ${conversationId}`);
        }

        logger.info(`[SendMessage] Message sent successfully to conversation: ${conversationId}`);
        res.json({ success: true, message });
    } catch (error) {
        logger.error(`[SendMessage] Error sending message to conversation ${conversationId}: ${error.stack}`);
        res.status(500).json({ success: false, message: "Failed to send message" });
    }
};

exports.uploadFile = async (req, res) => {
    const upload = req.app.get("upload");
    upload.single("file")(req, res, async (err) => {
        const { conversationId, senderId } = req.body;
        logger.info(`[UploadFile] Request received for conversation ID: ${conversationId} from sender: ${senderId}`);
        
        if (err) {
            logger.warn(`[UploadFile] Multer error for conversation ${conversationId}: ${err.message}`);
            return res.status(400).json({ success: false, message: err.message });
        }

        try {
            const file = req.file;
            if (!conversationId || !senderId || !file) {
                logger.warn(`[UploadFile] Validation failed for conversation ${conversationId}: Missing required fields.`);
                return res.status(400).json({ success: false, message: "Missing required fields" });
            }

            const sender = await User.findOne({ email: senderId });
            if (!sender) {
                logger.warn(`[UploadFile] Sender not found: ${senderId}`);
                return res.status(404).json({ success: false, message: "Sender not found" });
            }

            const messageType = file.mimetype.startsWith("image/") ? "image" : "document";
            const fileUrl = `/uploads/chat/${file.filename}`;

            const message = new Message({
                conversationId,
                senderId,
                senderName: sender.chatDisplayName || sender.profileName || sender.username || sender.email,
                text: messageType === "image" ? "📷 Image" : `📄 ${file.originalname}`,
                messageType,
                fileUrl,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
            });
            await message.save();

            await Conversation.findByIdAndUpdate(conversationId, {
                lastMessage: message.text,
                lastMessageTime: new Date(),
            });

            const io = req.app.get("io");
            if (io) {
                io.to(conversationId).emit("new-message", { conversationId, message });
                logger.info(`[UploadFile] Emitted 'new-message' with file to room: ${conversationId}`);
            }

            logger.info(`[UploadFile] File sent successfully to conversation: ${conversationId}`);
            res.json({ success: true, message });
        } catch (error) {
            logger.error(`[UploadFile] Error sending file to conversation ${conversationId}: ${error.stack}`);
            res.status(500).json({ success: false, message: "Failed to send file" });
        }
    });
};

exports.getUserByUsername = async (req, res) => {
    const { username } = req.params;
    logger.info(`[GetUserByUsername] Request received for username: ${username}`);
    try {
        const user = await findUserByIdentifier(username);
        if (!user) {
            logger.warn(`[GetUserByUsername] User not found: ${username}`);
            return res.status(404).json({ success: false, message: "User not found" });
        }

        logger.info(`[GetUserByUsername] Successfully fetched user: ${username}`);
        res.json({
            success: true,
            user: {
                userId: user.email,
                userName: user.chatDisplayName || user.profileName || user.username,
                email: user.email,
                isOnline: user.isOnline,
                lastSeen: user.lastSeen,
            },
        });
    } catch (error) {
        logger.error(`[GetUserByUsername] Error fetching user ${username}: ${error.stack}`);
        res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
};
