const socketIo = require("socket.io")

// Try to import models, but don't fail if MongoDB is not available
let User, Conversation, Message, Notification, mongoose;
try {
  User = require("./models/user")
  Conversation = require("./models/Conversation")
  Message = require("./models/message")
  Notification = require("./models/Notification")
  mongoose = require("mongoose")
} catch (error) {
  console.log('Models not available, using in-memory storage for socket events')
}

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

    // Handle user joining
    socket.on("join-user", async (userIdentifier) => {
      try {
        let user = null

        if (User && mongoose && mongoose.Types.ObjectId.isValid(userIdentifier)) {
          user = await User.findById(userIdentifier)
        }

        if (!user && User) {
          user = await User.findOne({
            $or: [{ email: userIdentifier }, { username: userIdentifier }],
          })
        }

        if (user) {
          socket.userIdentifier = user.email
          socket.userId = user.email
          socket.userName = user.chatDisplayName || user.profileName || user.username

          // Remove old socket if exists
          const oldSocket = userSockets.get(user.email)
          if (oldSocket && oldSocket !== socket) {
            oldSocket.disconnect()
          }

          userSockets.set(user.email, socket)

          if (User) {
            await User.findOneAndUpdate({ email: user.email }, { isOnline: true, lastSeen: new Date() })
          }

          console.log(`User ${user.email} joined with socket ${socket.id}`)

          socket.broadcast.emit("user-status-changed", {
            userId: user.email,
            userName: socket.userName,
            isOnline: true,
          })

          socket.emit("user-joined", {
            success: true,
            userId: user.email,
            userName: socket.userName,
          })
        } else {
          // Fallback for in-memory users
          socket.userIdentifier = userIdentifier
          socket.userId = userIdentifier
          socket.userName = userIdentifier

          // Remove old socket if exists
          const oldSocket = userSockets.get(userIdentifier)
          if (oldSocket && oldSocket !== socket) {
            oldSocket.disconnect()
          }

          userSockets.set(userIdentifier, socket)

          console.log(`User ${userIdentifier} joined with socket ${socket.id}`)

          socket.broadcast.emit("user-status-changed", {
            userId: userIdentifier,
            userName: socket.userName,
            isOnline: true,
          })

          socket.emit("user-joined", {
            success: true,
            userId: userIdentifier,
            userName: socket.userName,
          })
        }
      } catch (error) {
        console.error("Error joining user:", error)
        socket.emit("user-joined", { success: false, message: "Connection error" })
      }
    })

    // Join conversation room
    socket.on("join-conversation", async (conversationId) => {
      try {
        if (!socket.userIdentifier) return

        // Leave previous conversation
        if (socket.currentConversation) {
          socket.leave(socket.currentConversation)
          const prevUsers = conversationUsers.get(socket.currentConversation)
          if (prevUsers) {
            prevUsers.delete(socket.userIdentifier)
          }
        }

        // Join new conversation
        socket.join(conversationId)
        socket.currentConversation = conversationId

        if (!conversationUsers.has(conversationId)) {
          conversationUsers.set(conversationId, new Set())
        }
        conversationUsers.get(conversationId).add(socket.userIdentifier)

        console.log(`User ${socket.userIdentifier} joined conversation ${conversationId}`)
        socket.emit("conversation-joined", { conversationId, success: true })
      } catch (error) {
        console.error("Error joining conversation:", error)
      }
    })

    // Leave conversation
    socket.on("leave-conversation", (conversationId) => {
      if (socket.currentConversation === conversationId) {
        socket.leave(conversationId)
        socket.currentConversation = null

        const users = conversationUsers.get(conversationId)
        if (users) {
          users.delete(socket.userIdentifier)
        }
      }
    })

    // Handle typing
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

    // Handle message sending - Save to database and broadcast
    socket.on("send-message", async (data) => {
      try {
        const { conversationId, message } = data

        if (!socket.userIdentifier || !conversationId || !message) return

        let conversation = null;
        
        if (Conversation) {
          // Try to use MongoDB
          try {
            // Verify conversation exists and user is participant
            conversation = await Conversation.findById(conversationId)
            if (!conversation) {
              socket.emit("message-error", { error: "Conversation not found" })
              return
            }

            const isParticipant = conversation.participants.some((p) => p.userId === socket.userIdentifier)
            if (!isParticipant) {
              socket.emit("message-error", { error: "Not a participant in this conversation" })
              return
            }

            // Create and save message to database
            const newMessage = new Message({
              conversationId,
              senderId: socket.userIdentifier,
              senderName: socket.userName,
              text: message.text,
              messageType: message.messageType || 'text',
              replyTo: message.replyTo || null
            })

            await newMessage.save()

            // Update conversation's last message
            await Conversation.findByIdAndUpdate(conversationId, {
              lastMessage: message.text,
              lastMessageTime: new Date()
            })

            // Broadcast to other users in the conversation
            socket.to(conversationId).emit("new-message", {
              conversationId,
              message: newMessage.toObject()
            })

            // Emit delivery confirmation to sender
            socket.emit("message-delivered", {
              messageId: newMessage._id,
              conversationId
            })

            console.log(`Message saved and broadcasted in conversation ${conversationId} by ${socket.userIdentifier}`)
          } catch (error) {
            console.log('MongoDB not available, broadcasting message without saving')
          }
        }

        // Fallback: just broadcast the message
        if (!conversation) {
          const tempMessage = {
            _id: `temp_${Date.now()}`,
            conversationId,
            senderId: socket.userIdentifier,
            senderName: socket.userName,
            text: message.text,
            messageType: message.messageType || 'text',
            timestamp: new Date(),
            isRead: false
          }

          // Broadcast to other users in the conversation
          socket.to(conversationId).emit("new-message", {
            conversationId,
            message: tempMessage
          })

          // Emit delivery confirmation to sender
          socket.emit("message-delivered", {
            messageId: tempMessage._id,
            conversationId
          })

          console.log(`Message broadcasted in conversation ${conversationId} by ${socket.userIdentifier}`)
        }
      } catch (error) {
        console.error("Error saving and broadcasting message:", error)
        socket.emit("message-error", { error: "Failed to send message" })
      }
    })

    // Handle message read status
    socket.on("mark-messages-read", async (data) => {
      try {
        const { conversationId, messageIds } = data
        if (!socket.userIdentifier || !conversationId) return

        if (Message) {
          try {
            await Message.updateMany(
              {
                _id: { $in: messageIds },
                conversationId,
                senderId: { $ne: socket.userIdentifier },
              },
              { isRead: true },
            )
          } catch (error) {
            console.log('MongoDB not available, skipping read status update')
          }
        }

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
          if (User) {
            await User.findOneAndUpdate({ email: socket.userIdentifier }, { isOnline: false, lastSeen: new Date() })
          }

          userSockets.delete(socket.userIdentifier)

          if (socket.currentConversation) {
            const users = conversationUsers.get(socket.currentConversation)
            if (users) {
              users.delete(socket.userIdentifier)
            }
          }

          socket.broadcast.emit("user-status-changed", {
            userId: socket.userIdentifier,
            userName: socket.userName,
            isOnline: false,
          })
        } catch (error) {
          console.error("Error handling disconnect:", error)
        }
      }
    })

    // Handle file uploads
    socket.on("upload-file", async (data) => {
      try {
        const { conversationId, fileData, fileName, fileType } = data

        if (!socket.userIdentifier || !conversationId) return

        let conversation = null;
        
        if (Conversation) {
          try {
            // Verify conversation exists and user is participant
            conversation = await Conversation.findById(conversationId)
            if (!conversation) return

            const isParticipant = conversation.participants.some((p) => p.userId === socket.userIdentifier)
            if (!isParticipant) return

            // Create message with file
            const newMessage = new Message({
              conversationId,
              senderId: socket.userIdentifier,
              senderName: socket.userName,
              text: fileName,
              messageType: fileType,
              fileUrl: fileData.url,
              fileName: fileName,
              fileSize: fileData.size
            })

            await newMessage.save()

            // Update conversation's last message
            await Conversation.findByIdAndUpdate(conversationId, {
              lastMessage: `Sent ${fileName}`,
              lastMessageTime: new Date()
            })

            // Broadcast to other users
            socket.to(conversationId).emit("new-message", {
              conversationId,
              message: newMessage.toObject()
            })

            socket.emit("message-delivered", {
              messageId: newMessage._id,
              conversationId
            })
          } catch (error) {
            console.log('MongoDB not available, broadcasting file message without saving')
          }
        }

        // Fallback: just broadcast the file message
        if (!conversation) {
          const tempMessage = {
            _id: `temp_${Date.now()}`,
            conversationId,
            senderId: socket.userIdentifier,
            senderName: socket.userName,
            text: fileName,
            messageType: fileType,
            fileUrl: fileData.url,
            fileName: fileName,
            fileSize: fileData.size,
            timestamp: new Date(),
            isRead: false
          }

          // Broadcast to other users
          socket.to(conversationId).emit("new-message", {
            conversationId,
            message: tempMessage
          })

          socket.emit("message-delivered", {
            messageId: tempMessage._id,
            conversationId
          })
        }

      } catch (error) {
        console.error("Error handling file upload:", error)
        socket.emit("message-error", { error: "Failed to upload file" })
      }
    })

    // Handle voice messages
    socket.on("upload-voice", async (data) => {
      try {
        const { conversationId, audioData, fileName } = data

        if (!socket.userIdentifier || !conversationId) return

        let conversation = null;
        
        if (Conversation) {
          try {
            // Verify conversation exists and user is participant
            conversation = await Conversation.findById(conversationId)
            if (!conversation) return

            const isParticipant = conversation.participants.some((p) => p.userId === socket.userIdentifier)
            if (!isParticipant) return

            // Create message with voice
            const newMessage = new Message({
              conversationId,
              senderId: socket.userIdentifier,
              senderName: socket.userName,
              text: "Voice message",
              messageType: "audio",
              fileUrl: audioData.url,
              fileName: fileName,
              fileSize: audioData.size
            })

            await newMessage.save()

            // Update conversation's last message
            await Conversation.findByIdAndUpdate(conversationId, {
              lastMessage: "Sent voice message",
              lastMessageTime: new Date()
            })

            // Broadcast to other users
            socket.to(conversationId).emit("new-message", {
              conversationId,
              message: newMessage.toObject()
            })

            socket.emit("message-delivered", {
              messageId: newMessage._id,
              conversationId
            })
          } catch (error) {
            console.log('MongoDB not available, broadcasting voice message without saving')
          }
        }

        // Fallback: just broadcast the voice message
        if (!conversation) {
          const tempMessage = {
            _id: `temp_${Date.now()}`,
            conversationId,
            senderId: socket.userIdentifier,
            senderName: socket.userName,
            text: "Voice message",
            messageType: "audio",
            fileUrl: audioData.url,
            fileName: fileName,
            fileSize: audioData.size,
            timestamp: new Date(),
            isRead: false
          }

          // Broadcast to other users
          socket.to(conversationId).emit("new-message", {
            conversationId,
            message: tempMessage
          })

          socket.emit("message-delivered", {
            messageId: tempMessage._id,
            conversationId
          })
        }

      } catch (error) {
        console.error("Error handling voice upload:", error)
        socket.emit("message-error", { error: "Failed to upload voice message" })
      }
    })
  })

  // Helper function to send notifications
  const sendNotificationToUser = async (recipientId, notificationData) => {
    try {
      if (Notification) {
        const notification = new Notification({
          recipientId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data,
        })

        await notification.save()
      }

      // Send to user's socket if online
      const userSocket = userSockets.get(recipientId)
      if (userSocket) {
        userSocket.emit("new-notification", notificationData)
      }
    } catch (error) {
      console.error("Error sending notification:", error)
    }
  }

  return io
}

module.exports = initializeSocket
