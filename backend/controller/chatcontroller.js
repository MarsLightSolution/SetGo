const User = require("../models/user")
const Conversation = require("../models/Conversation")
const Message = require("../models/message")
const mongoose = require("mongoose")

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
    const { username, displayName } = req.body
    if (!username) return res.json({ success: false, message: "Username is required" })

    const user = await findUserByIdentifier(username)
    if (!user) return res.json({ success: false, message: "User not found. Please register first." })

    user.isOnline = true
    user.lastSeen = new Date()
    if (displayName) user.chatDisplayName = displayName
    await user.save()

    const chatUser = {
      userId: user.email,
      userName: user.chatDisplayName || user.profileName || user.username || user.email,
      email: user.email,
      _id: user._id,
    }

    res.json({ success: true, user: chatUser })
  } catch (error) {
    console.error("Connect error:", error)
    res.json({ success: false, message: "Failed to connect" })
  }
}

exports.getAllUsers = async (req, res) => {
  try {
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
    res.json({ success: false, message: "Failed to fetch users" })
  }
}

exports.getConversations = async (req, res) => {
  try {
    const user = await findUserByIdentifier(req.params.userIdentifier)
    if (!user) return res.json({ success: false, message: "User not found" })

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
    res.json({ success: false, message: "Failed to fetch conversations" })
  }
}

exports.createOrGetConversation = async (req, res) => {
  try {
    const { participants } = req.body
    if (!participants || participants.length !== 2) return res.json({ success: false, message: "Two participants required" })

    const user1 = await findUserByIdentifier(participants[0])
    const user2 = await findUserByIdentifier(participants[1])
    if (!user1 || !user2) {
      return res.json({
        success: false,
        message: `One or both users not found. User1: ${user1 ? "found" : "not found"}, User2: ${user2 ? "found" : "not found"}`,
      })
    }

    const user1Email = user1.email
    const user2Email = user2.email

    let conversation = await Conversation.findOne({
      $and: [{ "participants.userId": user1Email }, { "participants.userId": user2Email }],
    })

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { userId: user1Email, userName: user1.chatDisplayName || user1.profileName || user1.username || user1.email },
          { userId: user2Email, userName: user2.chatDisplayName || user2.profileName || user2.username || user2.email },
        ],
      })
      await conversation.save()
    }

    const enrichedParticipants = await Promise.all(
      conversation.participants.map(async (participant) => {
        const user = await User.findOne({ email: participant.userId })
        return {
          ...participant.toObject(),
          isOnline: user?.isOnline,
          lastSeen: user?.lastSeen,
        }
      })
    )

    res.json({ success: true, conversation: { ...conversation.toObject(), participants: enrichedParticipants } })
  } catch (error) {
    console.error("Create conversation error:", error)
    res.json({ success: false, message: "Failed to create conversation" })
  }
}

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId }).sort({ timestamp: 1 }).limit(100)
    res.json({ success: true, messages })
  } catch (error) {
    console.error("Get messages error:", error)
    res.json({ success: false, message: "Failed to fetch messages" })
  }
}

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body
    if (!conversationId || !senderId || !text) return res.json({ success: false, message: "Missing required fields" })

    const sender = await User.findOne({ email: senderId })
    if (!sender) return res.json({ success: false, message: "Sender not found" })

    const message = new Message({
      conversationId,
      senderId,
      senderName: sender.chatDisplayName || sender.profileName || sender.username || sender.email,
      text,
      messageType: "text",
    })
    await message.save()

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      lastMessageTime: new Date(),
    })

    const io = req.app.get("io")
    if (io) {
      io.to(conversationId).emit("new-message", { conversationId, message })
    }

    res.json({ success: true, message })
  } catch (error) {
    console.error("Send message error:", error)
    res.json({ success: false, message: "Failed to send message" })
  }
}

exports.uploadFile = async (req, res) => {
  const upload = req.app.get("upload")
  upload.single("file")(req, res, async (err) => {
    if (err) return res.json({ success: false, message: err.message })

    try {
      const { conversationId, senderId } = req.body
      const file = req.file
      if (!conversationId || !senderId || !file) return res.json({ success: false, message: "Missing required fields" })

      const sender = await User.findOne({ email: senderId })
      if (!sender) return res.json({ success: false, message: "Sender not found" })

      const messageType = file.mimetype.startsWith("image/") ? "image" : "document"
      const fileUrl = `/uploads/chat/${messageType === "image" ? "images" : "documents"}/${file.filename}`

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
      })
      await message.save()

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message.text,
        lastMessageTime: new Date(),
      })

      const io = req.app.get("io")
      if (io) io.to(conversationId).emit("new-message", { conversationId, message })

      res.json({ success: true, message })
    } catch (error) {
      console.error("File message error:", error)
      res.json({ success: false, message: "Failed to send file" })
    }
  })
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
