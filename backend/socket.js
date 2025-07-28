const socketIo = require("socket.io")
const User = require("./models/User")
const Conversation = require("./models/Conversation")
const Message = require("./models/Message")
const mongoose = require("mongoose")

function initializeSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Store user socket mappings and conversation rooms
  const userSockets = new Map() // userId -> socket
  const conversationUsers = new Map() // conversationId -> Set of userIds

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    // Handle user joining (using email instead of username)
    socket.on("join-user", async (userIdentifier) => {
      try {
        let user = null

        // Check if userIdentifier is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
          user = await User.findById(userIdentifier)
        }

        // If not found by ID or not a valid ObjectId, search by email/username
        if (!user) {
          user = await User.findOne({
            $or: [{ email: userIdentifier }, { username: userIdentifier }],
          })
        }

        if (user) {
          socket.userIdentifier = user.email // Use email as consistent identifier
          socket.userId = user.email
          socket.userName = user.chatDisplayName || user.profileName || user.username

          // Store socket mapping
          userSockets.set(user.email, socket)

          // Update user online status
          await User.findOneAndUpdate({ email: user.email }, { isOnline: true, lastSeen: new Date() })

          console.log(`User ${user.email} joined with socket ${socket.id}`)

          // Notify other users that this user is online
          socket.broadcast.emit("user-status-changed", {
            userId: user.email,
            userName: socket.userName,
            isOnline: true,
          })

          // Send acknowledgment
          socket.emit("user-joined", {
            success: true,
            userId: user.email,
            userName: socket.userName,
          })
        } else {
          console.log(`User not found for identifier: ${userIdentifier}`)
          socket.emit("user-joined", { success: false, message: "User not found" })
        }
      } catch (error) {
        console.error("Error joining user:", error)
        socket.emit("user-joined", { success: false, message: "Connection error" })
      }
    })

    // Join a conversation room
    socket.on("join-conversation", async (conversationId) => {
      try {
        if (!socket.userIdentifier) {
          socket.emit("error", { message: "User not authenticated" })
          return
        }

        // Leave previous conversation if any
        if (socket.currentConversation) {
          socket.leave(socket.currentConversation)
          const prevUsers = conversationUsers.get(socket.currentConversation)
          if (prevUsers) {
            prevUsers.delete(socket.userIdentifier)
            if (prevUsers.size === 0) {
              conversationUsers.delete(socket.currentConversation)
            }
          }
        }

        // Join new conversation
        socket.join(conversationId)
        socket.currentConversation = conversationId

        // Track users in conversation
        if (!conversationUsers.has(conversationId)) {
          conversationUsers.set(conversationId, new Set())
        }
        conversationUsers.get(conversationId).add(socket.userIdentifier)

        console.log(`User ${socket.userIdentifier} joined conversation ${conversationId}`)

        // Notify others in the conversation
        socket.to(conversationId).emit("user-joined-conversation", {
          userId: socket.userIdentifier,
          userName: socket.userName,
          conversationId,
        })

        socket.emit("conversation-joined", { conversationId, success: true })
      } catch (error) {
        console.error("Error joining conversation:", error)
        socket.emit("conversation-joined", { conversationId, success: false, error: error.message })
      }
    })

    // Leave a conversation room
    socket.on("leave-conversation", (conversationId) => {
      if (socket.currentConversation === conversationId) {
        socket.leave(conversationId)
        socket.currentConversation = null

        // Remove from conversation users tracking
        const users = conversationUsers.get(conversationId)
        if (users) {
          users.delete(socket.userIdentifier)
          if (users.size === 0) {
            conversationUsers.delete(conversationId)
          }
        }

        // Notify others
        socket.to(conversationId).emit("user-left-conversation", {
          userId: socket.userIdentifier,
          userName: socket.userName,
          conversationId,
        })

        console.log(`User ${socket.userIdentifier} left conversation ${conversationId}`)
      }
    })

    // Handle typing indicator
    socket.on("typing", (data) => {
      const { conversationId, isTyping } = data
      if (socket.userIdentifier && conversationId) {
        socket.to(conversationId).emit("user-typing", {
          userId: socket.userIdentifier,
          userName: socket.userName,
          isTyping,
          conversationId,
        })
      }
    })

    // Handle message sending through socket (real-time broadcast)
    socket.on("send-message", async (data) => {
      try {
        const { conversationId, message } = data

        if (!socket.userIdentifier || !conversationId || !message) {
          socket.emit("message-error", { error: "Invalid message data" })
          return
        }

        // Verify user is in the conversation
        const conversation = await Conversation.findById(conversationId)
        if (!conversation) {
          socket.emit("message-error", { error: "Conversation not found" })
          return
        }

        const isParticipant = conversation.participants.some((p) => p.userId === socket.userIdentifier)
        if (!isParticipant) {
          socket.emit("message-error", { error: "Not authorized for this conversation" })
          return
        }

        // Broadcast to all users in the conversation except sender
        socket.to(conversationId).emit("new-message", {
          conversationId,
          message: {
            ...message,
            timestamp: new Date().toISOString(), // Ensure consistent timestamp
          },
        })

        // Send delivery confirmation to sender
        socket.emit("message-delivered", {
          messageId: message._id,
          conversationId,
          timestamp: new Date().toISOString(),
        })

        console.log(`Message sent in conversation ${conversationId} by ${socket.userIdentifier}`)
      } catch (error) {
        console.error("Error sending message:", error)
        socket.emit("message-error", { error: "Failed to send message" })
      }
    })

    // Handle message read status
    socket.on("mark-messages-read", async (data) => {
      try {
        const { conversationId, messageIds } = data
        if (!socket.userIdentifier || !conversationId) return

        // Update message read status in database
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversationId,
            senderId: { $ne: socket.userIdentifier },
          },
          { isRead: true },
        )

        // Notify other users that messages were read
        socket.to(conversationId).emit("messages-read", {
          conversationId,
          messageIds,
          readBy: socket.userIdentifier,
        })
      } catch (error) {
        console.error("Error marking messages as read:", error)
      }
    })

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id)

      if (socket.userIdentifier) {
        try {
          // Update user offline status
          await User.findOneAndUpdate({ email: socket.userIdentifier }, { isOnline: false, lastSeen: new Date() })

          // Remove from socket mapping
          userSockets.delete(socket.userIdentifier)

          // Remove from conversation tracking
          if (socket.currentConversation) {
            const users = conversationUsers.get(socket.currentConversation)
            if (users) {
              users.delete(socket.userIdentifier)
              if (users.size === 0) {
                conversationUsers.delete(socket.currentConversation)
              }
            }

            // Notify others in conversation
            socket.to(socket.currentConversation).emit("user-left-conversation", {
              userId: socket.userIdentifier,
              userName: socket.userName,
              conversationId: socket.currentConversation,
            })
          }

          console.log(`User ${socket.userIdentifier} went offline`)

          // Notify all users that this user is offline
          socket.broadcast.emit("user-status-changed", {
            userId: socket.userIdentifier,
            isOnline: false,
          })
        } catch (error) {
          console.error("Error updating user offline status:", error)
        }
      }
    })

    // Handle connection errors
    socket.on("error", (error) => {
      console.error("Socket error:", error)
    })
  })

  return io
}

module.exports = initializeSocket
