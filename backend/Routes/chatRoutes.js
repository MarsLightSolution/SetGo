const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Try to import models, but don't fail if MongoDB is not available
let Conversation, Message, User;
try {
  Conversation = require('../models/Conversation');
  Message = require('../models/message');
  User = require('../models/user');
} catch (error) {
  console.log('Models not available, using in-memory storage');
}

// In-memory storage for testing
const inMemoryUsers = new Map();
const inMemoryConversations = new Map();
const inMemoryMessages = new Map();

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

    let user;
    
    if (User) {
      // Try to use MongoDB
      try {
        user = await User.findOne({ 
          $or: [{ email: username }, { username: username }] 
        });

        if (!user) {
          // Create a temporary user for chat
          user = new User({
            email: username,
            username: username,
            profileName: username,
            chatDisplayName: username
          });
          await user.save();
        }
      } catch (error) {
        console.log('MongoDB not available, using in-memory user');
      }
    }

    // Fallback to in-memory storage
    if (!user) {
      user = inMemoryUsers.get(username);
      if (!user) {
        user = {
          email: username,
          username: username,
          profileName: username,
          chatDisplayName: username
        };
        inMemoryUsers.set(username, user);
      }
    }

    res.json({ 
      success: true, 
      user: {
        userId: user.email,
        userName: user.chatDisplayName || user.profileName || user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Connection error:', error);
    res.status(500).json({ success: false, message: 'Failed to connect' });
  }
});

// Get conversations
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    let conversations = [];
    
    if (Conversation) {
      // Try to use MongoDB
      try {
        conversations = await Conversation.find({
          'participants.userId': userId
        }).sort({ lastMessageTime: -1 });

        // Populate with last message info
        const conversationsWithLastMessage = await Promise.all(
          conversations.map(async (conv) => {
            const lastMessage = await Message.findOne({
              conversationId: conv._id
            }).sort({ timestamp: -1 });

            return {
              ...conv.toObject(),
              lastMessage: lastMessage ? lastMessage.text : '',
              lastMessageTime: lastMessage ? lastMessage.timestamp : conv.lastMessageTime
            };
          })
        );
        conversations = conversationsWithLastMessage;
      } catch (error) {
        console.log('MongoDB not available, using in-memory conversations');
      }
    }

    // Fallback to in-memory storage
    if (conversations.length === 0) {
      conversations = Array.from(inMemoryConversations.values())
        .filter(conv => conv.participants.some(p => p.userId === userId))
        .map(conv => ({
          ...conv,
          lastMessage: conv.lastMessage || '',
          lastMessageTime: conv.lastMessageTime || new Date()
        }));
    }

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

    let conversation;
    
    if (Conversation) {
      // Try to use MongoDB
      try {
        // Check if conversation already exists
        const existingConversation = await Conversation.findOne({
          'participants.userId': { $all: participants }
        });

        if (existingConversation) {
          return res.json({ success: true, conversation: existingConversation });
        }

        // Create new conversation
        conversation = new Conversation({
          participants: participants.map(p => ({ 
            userId: p, 
            userName: p 
          }))
        });

        await conversation.save();
      } catch (error) {
        console.log('MongoDB not available, using in-memory conversation');
      }
    }

    // Fallback to in-memory storage
    if (!conversation) {
      const conversationId = 'conv_' + Date.now();
      conversation = {
        _id: conversationId,
        participants: participants.map(p => ({ 
          userId: p, 
          userName: p 
        })),
        createdAt: new Date(),
        lastMessage: '',
        lastMessageTime: new Date()
      };
      inMemoryConversations.set(conversationId, conversation);
    }

    res.json({ success: true, conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
});

// Get messages
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    let messages = [];
    
    if (Conversation && Message) {
      // Try to use MongoDB
      try {
        // Verify conversation exists
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        // Get messages for this conversation
        messages = await Message.find({ conversationId })
          .sort({ timestamp: 1 })
          .limit(100); // Limit to last 100 messages
      } catch (error) {
        console.log('MongoDB not available, using in-memory messages');
      }
    }

    // Fallback to in-memory storage
    if (messages.length === 0) {
      messages = Array.from(inMemoryMessages.values())
        .filter(msg => msg.conversationId === conversationId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-100);
    }

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/messages', async (req, res) => {
  try {
    const { conversationId, senderId, text, messageType = 'text', replyTo } = req.body;
    
    if (!conversationId || !senderId || !text) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let message;
    
    if (Conversation && Message) {
      // Try to use MongoDB
      try {
        // Verify conversation exists
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        // Verify sender is participant
        const isParticipant = conversation.participants.some(p => p.userId === senderId);
        if (!isParticipant) {
          return res.status(403).json({ success: false, message: 'Not a participant in this conversation' });
        }

        // Create message
        message = new Message({
          conversationId,
          senderId,
          senderName: senderId, // You might want to get this from user data
          text,
          messageType,
          replyTo
        });

        await message.save();

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: text,
          lastMessageTime: new Date()
        });
      } catch (error) {
        console.log('MongoDB not available, using in-memory message');
      }
    }

    // Fallback to in-memory storage
    if (!message) {
      const messageId = 'msg_' + Date.now();
      message = {
        _id: messageId,
        conversationId,
        senderId,
        senderName: senderId,
        text,
        messageType,
        timestamp: new Date(),
        isRead: false,
        replyTo
      };
      inMemoryMessages.set(messageId, message);

      // Update conversation in memory
      const conversation = inMemoryConversations.get(conversationId);
      if (conversation) {
        conversation.lastMessage = text;
        conversation.lastMessageTime = new Date();
      }
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('new-message', {
        conversationId,
        message: message.toObject ? message.toObject() : message
      });
    }

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/messages/read', async (req, res) => {
  try {
    const { conversationId, messageIds, userId } = req.body;
    
    if (!conversationId || !messageIds || !userId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (Message) {
      // Try to use MongoDB
      try {
        // Mark messages as read
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversationId,
            senderId: { $ne: userId }
          },
          { isRead: true }
        );
      } catch (error) {
        console.log('MongoDB not available, using in-memory read status');
      }
    }

    // Fallback to in-memory storage
    messageIds.forEach(messageId => {
      const message = inMemoryMessages.get(messageId);
      if (message && message.senderId !== userId) {
        message.isRead = true;
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('messages-read', {
        conversationId,
        messageIds,
        readBy: userId
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
  }
});

// File upload for messages
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
});

// Voice message upload
router.post('/upload-voice', voiceUpload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Voice upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload voice message' });
  }
});

module.exports = router;
