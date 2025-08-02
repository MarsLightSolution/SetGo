const User = require("../models/User")
const Conversation = require("../models/Conversation")
const Message = require("../models/Message")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")

// Helper function to verify user from cookies
const verifyUserFromCookies = (req) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return null;
    }
    
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// Helper
const findUserByIdentifier = async (identifier) => {
  let user = null
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    user = await User.findById(identifier)
  }
  if (!user) {
    user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] })
  }
  return user
}

exports.connectUser = async (req, res) => {
  try {
    // Verify user from cookies first
    const decoded = verifyUserFromCookies(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update user online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const chatUser = {
      userId: user.email,
      userName: user.chatDisplayName || user.profileName || user.username || user.email,
      email: user.email,
      _id: user._id,
    }

    res.json({ success: true, user: chatUser })
  } catch (error) {
    console.error("Connect error:", error)
    res.status(500).json({ success: false, message: "Failed to connect" })
  }
}

exports.getAllUsers = async (req, res) => {
  try {
    // Verify user from cookies
    const decoded = verifyUserFromCookies(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const users = await User.find({}, "username profileName chatDisplayName isOnline lastSeen email")
    const chatUsers = users.map((user) => ({
      userId: user.email,
      userName: user.chatDisplayName || user.profileName || user.username,
      email: user.email,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    }))
    res.json({ success: true, users: chatUsers })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ success: false, message: "Failed to fetch users" })
  }
}

exports.getConversations = async (req, res) => {
  try {
    // Verify user from cookies
    const decoded = verifyUserFromCookies(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const conversations = await Conversation.find({ "participants.userId": user.email }).sort({ lastMessageTime: -1 })

    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const enrichedParticipants = await Promise.all(
          conversation.participants.map(async (participant) => {
            const participantUser = await User.findOne({ email: participant.userId })
            return {
              ...participant.toObject(),
              isOnline: participantUser?.isOnline,
              lastSeen: participantUser?.lastSeen,
            }
          })
        )
        return { ...conversation.toObject(), participants: enrichedParticipants }
      })
    )

    res.json({ success: true, conversations: enrichedConversations })
  } catch (error) {
    console.error("Get conversations error:", error)
    res.status(500).json({ success: false, message: "Failed to fetch conversations" })
  }
}

exports.createOrGetConversation = async (req, res) => {
  try {
    // Verify user from cookies
    const decoded = verifyUserFromCookies(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { participants } = req.body
    if (!participants || participants.length !== 2) {
      return res.status(400).json({ success: false, message: "Two participants required" });
    }

    // Ensure current user is one of the participants
    if (!participants.includes(currentUser.email)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const user1 = await findUserByIdentifier(participants[0])
    const user2 = await findUserByIdentifier(participants[1])
    if (!user1 || !user2) {
      return res.status(404).json({ success: false, message: "One or both users not found" });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      "participants.userId": { $all: [user1.email, user2.email] },
      "participants.0": { $exists: true },
      "participants.1": { $exists: true }
    });

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [
          {
            userId: user1.email,
            userName: user1.chatDisplayName || user1.profileName || user1.username,
          },
          {
            userId: user2.email,
            userName: user2.chatDisplayName || user2.profileName || user2.username,
          }
        ],
        lastMessageTime: new Date(),
      });
    }

    res.json({ success: true, conversation })
  } catch (error) {
    console.error("Create conversation error:", error)
    res.status(500).json({ success: false, message: "Failed to create conversation" })
  }
}

exports.getMessages = async (req, res) => {
  try {
    // Verify user from cookies
    const decoded = verifyUserFromCookies(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { conversationId } = req.params
    const conversation = await Conversation.findById(conversationId)
    
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    // Check if user is part of this conversation
    const isParticipant = conversation.participants.some(p => p.userId === currentUser.email);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const messages = await Message.find({ conversationId }).sort({ timestamp: 1 })
    res.json({ success: true, messages })
  } catch (error) {
    console.error("Get messages error:", error)
    res.status(500).json({ success: false, message: "Failed to fetch messages" })
  }
}

exports.sendMessage = async (req, res) => {
  try {
    // Verify user from cookies
    const decoded = verifyUserFromCookies(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { conversationId, text, replyTo } = req.body
    
    if (!conversationId || !text) {
      return res.status(400).json({ success: false, message: "Conversation ID and text are required" });
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    // Check if user is part of this conversation
    const isParticipant = conversation.participants.some(p => p.userId === currentUser.email);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const message = await Message.create({
      conversationId,
      senderId: currentUser.email,
      senderName: currentUser.chatDisplayName || currentUser.profileName || currentUser.username,
      text,
      replyTo,
      timestamp: new Date(),
    })

    // Update conversation last message
    conversation.lastMessage = text;
    conversation.lastMessageTime = new Date();
    await conversation.save();

    res.json({ success: true, message })
  } catch (error) {
    console.error("Send message error:", error)
    res.status(500).json({ success: false, message: "Failed to send message" })
  }
}

exports.uploadFile = async (req, res) => {
  try {
    // Verify user from cookies
    const decoded = verifyUserFromCookies(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { conversationId } = req.body
    const file = req.file
    
    if (!conversationId || !file) {
      return res.status(400).json({ success: false, message: "Conversation ID and file are required" });
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    // Check if user is part of this conversation
    const isParticipant = conversation.participants.some(p => p.userId === currentUser.email);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const messageType = file.mimetype.startsWith('image/') ? 'image' : 'document';
    
    const message = await Message.create({
      conversationId,
      senderId: currentUser.email,
      senderName: currentUser.chatDisplayName || currentUser.profileName || currentUser.username,
      text: req.body.text || '',
      messageType,
      fileUrl: `/uploads/chat/${messageType === 'image' ? 'images' : 'documents'}/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      timestamp: new Date(),
    })

    // Update conversation last message
    conversation.lastMessage = messageType === 'image' ? '📷 Image' : '📄 Document';
    conversation.lastMessageTime = new Date();
    await conversation.save();

    res.json({ success: true, message })
  } catch (error) {
    console.error("Upload file error:", error)
    res.status(500).json({ success: false, message: "Failed to upload file" })
  }
}

exports.getUserByUsername = async (req, res) => {
  try {
    const user = await findUserByIdentifier(req.params.username)
    if (!user) return res.json({ success: false, message: "User not found" })

    res.json({
      success: true,
      user: {
        userId: user.email,
        userName: user.chatDisplayName || user.profileName || user.username,
        email: user.email,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.json({ success: false, message: "Failed to fetch user" })
  }
}
