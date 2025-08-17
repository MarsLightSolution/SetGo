const socketIo = require('socket.io')
const User = require('./models/user')
const Conversation = require('./models/Conversation')
const Message = require('./models/message')

function initializeCleanSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  })

  // Store active connections
  const userSockets = new Map()
  const conversationUsers = new Map()

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)

    // User joins the chat system
    socket.on('join-user', async (userIdentifier) => {
      try {
        console.log(`User attempting to join: ${userIdentifier}`)
        
        // Find user by identifier
        let user = null
        if (userIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
          user = await User.findById(userIdentifier)
        }
        if (!user) {
          user = await User.findOne({
            $or: [{ email: userIdentifier }, { username: userIdentifier }]
          })
        }

        if (user) {
          // Store user info in socket
          socket.userIdentifier = user.email
          socket.userName = user.chatDisplayName || user.profileName || user.username || user.email

          // Remove any existing connection for this user
          const existingSocket = userSockets.get(user.email)
          if (existingSocket && existingSocket !== socket) {
            existingSocket.disconnect()
          }

          // Store new connection
          userSockets.set(user.email, socket)

          // Update user online status
          await User.findOneAndUpdate(
            { email: user.email },
            { isOnline: true, lastSeen: new Date() }
          )

          // Broadcast user online status
          socket.broadcast.emit('user-status-changed', {
            userId: user.email,
            userName: socket.userName,
            isOnline: true
          })

          // Confirm successful join
          socket.emit('user-joined', {
            success: true,
            userId: user.email,
            userName: socket.userName
          })

          console.log(`User ${socket.userName} (${user.email}) joined successfully`)
        } else {
          socket.emit('user-joined', { 
            success: false, 
            message: 'User not found' 
          })
        }
      } catch (error) {
        console.error('Error in join-user:', error)
        socket.emit('user-joined', { 
          success: false, 
          message: 'Connection error' 
        })
      }
    })

    // User joins a specific conversation
    socket.on('join-conversation', async (conversationId) => {
      try {
        if (!socket.userIdentifier) {
          console.log('User not authenticated for join-conversation')
          return
        }

        console.log(`User ${socket.userName} joining conversation ${conversationId}`)

        // Leave previous conversation if any
        if (socket.currentConversation) {
          socket.leave(socket.currentConversation)
          const prevUsers = conversationUsers.get(socket.currentConversation)
          if (prevUsers) {
            prevUsers.delete(socket.userIdentifier)
          }
        }

        // Join new conversation room
        socket.join(conversationId)
        socket.currentConversation = conversationId

        // Track users in conversation
        if (!conversationUsers.has(conversationId)) {
          conversationUsers.set(conversationId, new Set())
        }
        conversationUsers.get(conversationId).add(socket.userIdentifier)

        socket.emit('conversation-joined', { 
          conversationId, 
          success: true 
        })

        console.log(`User ${socket.userName} joined conversation ${conversationId}`)
      } catch (error) {
        console.error('Error in join-conversation:', error)
        socket.emit('conversation-joined', { 
          conversationId, 
          success: false, 
          error: 'Failed to join conversation' 
        })
      }
    })

    // User leaves a conversation
    socket.on('leave-conversation', (conversationId) => {
      if (socket.currentConversation === conversationId) {
        socket.leave(conversationId)
        socket.currentConversation = null

        const users = conversationUsers.get(conversationId)
        if (users) {
          users.delete(socket.userIdentifier)
        }

        console.log(`User ${socket.userName} left conversation ${conversationId}`)
      }
    })

    // Handle typing indicators
    socket.on('typing', ({ conversationId, isTyping }) => {
      if (socket.userIdentifier && conversationId) {
        socket.to(conversationId).emit('user-typing', {
          userId: socket.userIdentifier,
          userName: socket.userName,
          isTyping,
          conversationId
        })
      }
    })

    // Send message to conversation
    socket.on('send-message', async ({ conversationId, message }) => {
      try {
        if (!socket.userIdentifier || !conversationId || !message) {
          console.log('Invalid send-message data')
          return
        }

        console.log(`Broadcasting message from ${socket.userName} to conversation ${conversationId}`)

        // Verify user is participant in conversation
        const conversation = await Conversation.findById(conversationId)
        if (!conversation) {
          console.log(`Conversation ${conversationId} not found`)
          return
        }

        const isParticipant = conversation.participants.some(
          p => p.userId === socket.userIdentifier
        )
        if (!isParticipant) {
          console.log(`User ${socket.userName} not a participant in conversation ${conversationId}`)
          return
        }

        // Broadcast to other users in the conversation
        socket.to(conversationId).emit('new-message', {
          conversationId,
          message: {
            ...message,
            timestamp: new Date().toISOString()
          }
        })

        console.log(`Message broadcasted to conversation ${conversationId}`)
      } catch (error) {
        console.error('Error in send-message:', error)
        socket.emit('message-error', { 
          error: 'Failed to send message' 
        })
      }
    })

    // Mark messages as read
    socket.on('mark-messages-read', async ({ conversationId, messageIds }) => {
      try {
        if (!socket.userIdentifier || !conversationId || !messageIds) {
          return
        }

        console.log(`Marking messages as read for ${socket.userName} in conversation ${conversationId}`)

        // Update messages in database
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversationId,
            senderId: { $ne: socket.userIdentifier }
          },
          { isRead: true }
        )

        // Broadcast read receipt
        socket.to(conversationId).emit('messages-read', {
          conversationId,
          messageIds,
          readBy: socket.userIdentifier
        })

        console.log(`Read receipts sent for conversation ${conversationId}`)
      } catch (error) {
        console.error('Error in mark-messages-read:', error)
      }
    })

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`)

      if (socket.userIdentifier) {
        try {
          // Remove from user sockets map
          userSockets.delete(socket.userIdentifier)

          // Update user offline status
          await User.findOneAndUpdate(
            { email: socket.userIdentifier },
            { isOnline: false, lastSeen: new Date() }
          )

          // Broadcast user offline status
          socket.broadcast.emit('user-status-changed', {
            userId: socket.userIdentifier,
            userName: socket.userName,
            isOnline: false
          })

          // Remove from conversation users
          if (socket.currentConversation) {
            const users = conversationUsers.get(socket.currentConversation)
            if (users) {
              users.delete(socket.userIdentifier)
            }
          }

          console.log(`User ${socket.userName} (${socket.userIdentifier}) marked offline`)
        } catch (error) {
          console.error('Error updating user offline status:', error)
        }
      }
    })

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error)
    })
  })

  // Expose user sockets for external use (e.g., notifications)
  io.userSockets = userSockets
  io.conversationUsers = conversationUsers

  console.log('Clean Socket.IO initialized successfully')
  return io
}

module.exports = initializeCleanSocket
