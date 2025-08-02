const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and audio files
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xls|xlsx|mp3|wav|webm|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only supported file types are allowed'));
    }
  }
});

// Voice message upload
const voiceUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for voice messages
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|webm|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed for voice messages'));
    }
  }
});

// Chat connection endpoint
router.post('/connect', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    // Create or get user
    const user = {
      userId: username,
      userName: username,
      email: username
    };

    res.json({ success: true, user });
  } catch (error) {
    console.error('Connection error:', error);
    res.status(500).json({ success: false, message: 'Failed to connect' });
  }
});

// Get conversations
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch real conversations from database
    const Conversation = require('../models/Conversation');
    const conversations = await Conversation.find({
      'participants.userId': userId
    }).sort({ lastMessageTime: -1 });

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
});

// Create conversation
router.post('/conversations', async (req, res) => {
  try {
    const { participants } = req.body;
    
    if (!participants || participants.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 participants required' });
    }

    // Check if conversation already exists
    const Conversation = require('../models/Conversation');
    const existingConversation = await Conversation.findOne({
      'participants.userId': { $all: participants.map(p => p.userId) },
      'participants': { $size: participants.length }
    });

    if (existingConversation) {
      return res.json({ success: true, conversation: existingConversation });
    }

    // Create new conversation
    const conversation = new Conversation({
      participants: participants.map(p => ({ userId: p.userId, userName: p.userName }))
    });

    const savedConversation = await conversation.save();
    res.json({ success: true, conversation: savedConversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
});

// Get messages
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Fetch real messages from database
    const Message = require('../models/message');
    const messages = await Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .limit(100); // Limit to last 100 messages for performance

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/messages', async (req, res) => {
  try {
    const { conversationId, senderId, text, replyTo, messageType = 'text' } = req.body;
    
    if (!conversationId || !senderId || !text) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Save message to database
    const Message = require('../models/message');
    const Conversation = require('../models/Conversation');
    
    const message = new Message({
      conversationId,
      senderId,
      senderName: senderId,
      text,
      messageType,
      timestamp: new Date(),
      isRead: false
    });

    const savedMessage = await message.save();

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      lastMessageTime: new Date()
    });

    res.json({ success: true, message: savedMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// File upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { conversationId, senderId } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!conversationId || !senderId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const fileType = file.mimetype.startsWith('image/') ? 'image' : 'document';
    
    // Mock message creation with file
    const message = {
      _id: 'msg_' + Date.now(),
      conversationId,
      senderId,
      senderName: senderId,
      text: file.originalname,
      messageType: fileType,
      fileUrl: '/uploads/' + file.filename,
      fileName: file.originalname,
      fileSize: file.size,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
});

// Voice message upload
router.post('/upload-voice', voiceUpload.single('audio'), async (req, res) => {
  try {
    const { conversationId, senderId } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ success: false, message: 'No audio file uploaded' });
    }

    if (!conversationId || !senderId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Mock message creation with voice
    const message = {
      _id: 'msg_' + Date.now(),
      conversationId,
      senderId,
      senderName: senderId,
      text: 'Voice message',
      messageType: 'audio',
      fileUrl: '/uploads/' + file.filename,
      fileName: file.originalname,
      fileSize: file.size,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error uploading voice message:', error);
    res.status(500).json({ success: false, message: 'Failed to upload voice message' });
  }
});

// Message reactions
router.post('/messages/:messageId/reactions', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, reaction } = req.body;
    
    if (!messageId || !userId || !reaction) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Mock reaction creation
    const reactionData = {
      messageId,
      userId,
      reaction,
      timestamp: new Date().toISOString()
    };

    res.json({ success: true, reaction: reactionData });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ success: false, message: 'Failed to add reaction' });
  }
});

// Mark messages as read
router.post('/messages/read', async (req, res) => {
  try {
    const { conversationId, messageIds } = req.body;
    
    if (!conversationId || !messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Mock marking messages as read
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
  }
});

// Search messages
router.get('/messages/search/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    // Mock search results
    const searchResults = [
      {
        _id: 'msg1',
        conversationId,
        senderId: 'user2',
        senderName: 'John Doe',
        text: 'Hello there!',
        messageType: 'text',
        timestamp: new Date().toISOString(),
        isRead: false
      }
    ].filter(msg => msg.text.toLowerCase().includes(query.toLowerCase()));

    res.json({ success: true, messages: searchResults });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to search messages' });
  }
});

module.exports = router;
