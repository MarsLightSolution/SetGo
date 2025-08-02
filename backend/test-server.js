const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

// In-memory storage
const users = new Map();
const conversations = new Map();
const messages = new Map();

// Chat connection endpoint
app.post('/api/chat/connect', (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    const user = {
      userId: username,
      userName: username,
      email: username
    };

    users.set(username, user);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Connection error:', error);
    res.status(500).json({ success: false, message: 'Failed to connect' });
  }
});

// Get conversations
app.get('/api/chat/conversations/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    // Return mock conversations for testing
    const conversations = [
      {
        _id: 'conv1',
        participants: [
          { userId: userId, userName: userId },
          { userId: 'user2', userName: 'John Doe' }
        ],
        lastMessage: 'Hello there!',
        lastMessageTime: new Date().toISOString()
      },
      {
        _id: 'conv2',
        participants: [
          { userId: userId, userName: userId },
          { userId: 'user3', userName: 'Jane Smith' }
        ],
        lastMessage: 'How are you?',
        lastMessageTime: new Date().toISOString()
      }
    ];

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
});

// Get messages
app.get('/api/chat/messages/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Return mock messages for testing
    const messages = [
      {
        _id: 'msg1',
        conversationId,
        senderId: 'user2',
        senderName: 'John Doe',
        text: 'Hello there!',
        messageType: 'text',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        isRead: false
      },
      {
        _id: 'msg2',
        conversationId,
        senderId: 'user1',
        senderName: 'Current User',
        text: 'Hi! How are you?',
        messageType: 'text',
        timestamp: new Date(Date.now() - 30000).toISOString(),
        isRead: true
      }
    ];

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// Send message
app.post('/api/chat/messages', (req, res) => {
  try {
    const { conversationId, senderId, text, messageType = 'text' } = req.body;
    
    if (!conversationId || !senderId || !text) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const message = {
      _id: 'msg_' + Date.now(),
      conversationId,
      senderId,
      senderName: senderId,
      text,
      messageType,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-user', (userIdentifier) => {
    console.log('User joined:', userIdentifier);
    socket.userIdentifier = userIdentifier;
    socket.emit('user-joined', { success: true, userId: userIdentifier });
  });

  socket.on('join-conversation', (conversationId) => {
    console.log('User joined conversation:', conversationId);
    socket.join(conversationId);
    socket.emit('conversation-joined', { conversationId, success: true });
  });

  socket.on('send-message', (data) => {
    console.log('Message received:', data);
    const { conversationId, message } = data;
    
    const messageData = {
      _id: 'msg_' + Date.now(),
      conversationId,
      senderId: socket.userIdentifier,
      senderName: socket.userIdentifier,
      text: message.text,
      messageType: message.messageType || 'text',
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // Broadcast to other users in the conversation
    socket.to(conversationId).emit('new-message', {
      conversationId,
      message: messageData
    });

    // Send confirmation to sender
    socket.emit('message-sent', {
      messageId: messageData._id,
      conversationId,
      success: true
    });
  });

  socket.on('typing', (data) => {
    socket.to(data.conversationId).emit('user-typing', {
      userId: socket.userIdentifier,
      userName: socket.userIdentifier,
      isTyping: data.isTyping,
      conversationId: data.conversationId
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Socket.IO server ready`);
});