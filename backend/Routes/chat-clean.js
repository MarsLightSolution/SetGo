const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Import models
const User = require('../models/user')
const Conversation = require('../models/Conversation')
const Message = require('../models/message')

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = file.mimetype.startsWith('image/') 
      ? 'uploads/chat/images' 
      : 'uploads/chat/documents'
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    const fileExt = file.originalname.toLowerCase()
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx']
    const hasValidExtension = allowedExtensions.some(ext => fileExt.endsWith(ext))
    
    if (allowedTypes.includes(file.mimetype) || hasValidExtension) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG) and documents (PDF, DOCX) are allowed.'))
    }
  }
})

// Helper function to find user by identifier
const findUserByIdentifier = async (identifier) => {
  let user = null
  
  // Try ObjectId first
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    user = await User.findById(identifier)
  }
  
  // Try email or username
  if (!user) {
    user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    })
  }
  
  return user
}

// Connect user to chat
router.post('/connect', async (req, res) => {
  try {
    const { username } = req.body
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username is required' 
      })
    }

    const user = await findUserByIdentifier(username)
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found. Please register first.' 
      })
    }

    // Update user online status
    user.isOnline = true
    user.lastSeen = new Date()
    await user.save()

    const chatUser = {
      userId: user.email,
      userName: user.chatDisplayName || user.profileName || user.username || user.email,
      email: user.email,
      _id: user._id
    }

    res.json({ success: true, user: chatUser })
  } catch (error) {
    console.error('Connect user error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to connect to chat' 
    })
  }
})

// Get user conversations
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    
    const user = await findUserByIdentifier(userId)
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    const conversations = await Conversation.find({
      'participants.userId': user.email
    }).sort({ lastMessageTime: -1 })

    // Enrich with participant info
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const enrichedParticipants = await Promise.all(
          conversation.participants.map(async (participant) => {
            const participantUser = await User.findOne({ email: participant.userId })
            return {
              ...participant.toObject(),
              isOnline: participantUser?.isOnline || false,
              lastSeen: participantUser?.lastSeen
            }
          })
        )
        
        return {
          ...conversation.toObject(),
          participants: enrichedParticipants
        }
      })
    )

    res.json({ success: true, conversations: enrichedConversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch conversations' 
    })
  }
})

// Create or get conversation
router.post('/conversations', async (req, res) => {
  try {
    const { participants } = req.body
    
    if (!participants || participants.length !== 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Two participants required' 
      })
    }

    const user1 = await findUserByIdentifier(participants[0])
    const user2 = await findUserByIdentifier(participants[1])
    
    if (!user1 || !user2) {
      return res.status(404).json({ 
        success: false, 
        message: 'One or both users not found' 
      })
    }

    const user1Email = user1.email
    const user2Email = user2.email

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      'participants.userId': { $all: [user1Email, user2Email] }
    })

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [
          { 
            userId: user1Email, 
            userName: user1.chatDisplayName || user1.profileName || user1.username || user1.email 
          },
          { 
            userId: user2Email, 
            userName: user2.chatDisplayName || user2.profileName || user2.username || user2.email 
          }
        ]
      })
      await conversation.save()
    }

    // Enrich participants with online status
    const enrichedParticipants = await Promise.all(
      conversation.participants.map(async (participant) => {
        const user = await User.findOne({ email: participant.userId })
        return {
          ...participant.toObject(),
          isOnline: user?.isOnline || false,
          lastSeen: user?.lastSeen
        }
      })
    )

    res.json({ 
      success: true, 
      conversation: { 
        ...conversation.toObject(), 
        participants: enrichedParticipants 
      } 
    })
  } catch (error) {
    console.error('Create conversation error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create conversation' 
    })
  }
})

// Get messages for a conversation
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params
    
    const messages = await Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .limit(100)

    res.json({ success: true, messages })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch messages' 
    })
  }
})

// Send a message
router.post('/messages', async (req, res) => {
  try {
    const { conversationId, senderId, text, replyTo } = req.body
    
    if (!conversationId || !senderId || !text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      })
    }

    const sender = await User.findOne({ email: senderId })
    if (!sender) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sender not found' 
      })
    }

    const message = new Message({
      conversationId,
      senderId,
      senderName: sender.chatDisplayName || sender.profileName || sender.username || sender.email,
      text,
      messageType: 'text',
      replyTo
    })
    
    await message.save()

    // Update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      lastMessageTime: new Date()
    })

    res.json({ success: true, message })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message' 
    })
  }
})

// Upload file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      })
    }

    const { conversationId, senderId } = req.body
    
    if (!conversationId || !senderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      })
    }

    const sender = await User.findOne({ email: senderId })
    if (!sender) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sender not found' 
      })
    }

    // Determine file type and display text
    let messageType = 'document'
    let displayText = `📄 ${req.file.originalname}`
    
    if (req.file.mimetype.startsWith('image/')) {
      messageType = 'image'
      displayText = '📷 Image'
    } else if (req.file.mimetype === 'application/pdf') {
      displayText = `📄 PDF: ${req.file.originalname}`
    } else if (req.file.mimetype.includes('word') || req.file.originalname.toLowerCase().endsWith('.docx')) {
      displayText = `📝 Document: ${req.file.originalname}`
    } else if (req.file.mimetype.includes('sheet') || req.file.originalname.toLowerCase().endsWith('.xlsx')) {
      displayText = `📊 Spreadsheet: ${req.file.originalname}`
    }

    // Create file URL
    const fileUrl = req.file.path.includes('chat/images') 
      ? `/uploads/chat/images/${req.file.filename}`
      : `/uploads/chat/documents/${req.file.filename}`

    const message = new Message({
      conversationId,
      senderId,
      senderName: sender.chatDisplayName || sender.profileName || sender.username || sender.email,
      text: displayText,
      messageType,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    })
    
    await message.save()

    // Update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message.text,
      lastMessageTime: new Date()
    })

    res.json({ success: true, message })
  } catch (error) {
    console.error('File upload error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload file' 
    })
  }
})

// Mark messages as read
router.put('/messages/read', async (req, res) => {
  try {
    const { conversationId, messageIds, userId } = req.body
    
    if (!conversationId || !messageIds || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      })
    }

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        conversationId,
        senderId: { $ne: userId }
      },
      { isRead: true }
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Mark messages read error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark messages as read' 
    })
  }
})

module.exports = router
