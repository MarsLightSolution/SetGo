const socketIo = require("socket.io")
const User = require("./models/User")
const Conversation = require("./models/Conversation")
const Message = require("./models/Message")
const Notification = require("./models/Notification")
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

    // Handle user joining
    socket.on("join-user", async (userIdentifier) => {
      try {
        let user = null

        if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
          user = await User.findById(userIdentifier)
        }

        if (!user) {
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

          await User.findOneAndUpdate({ email: user.email }, { isOnline: true, lastSeen: new Date() })

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
          socket.emit("user-joined", { success: false, message: "User not found" })
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

    // Handle message sending - ONLY broadcast, don't save here
    socket.on("send-message", async (data) => {
      try {
        const { conversationId, message } = data

        if (!socket.userIdentifier || !conversationId || !message) return

        // Verify conversation exists and user is participant
        const conversation = await Conversation.findById(conversationId)
        if (!conversation) return

        const isParticipant = conversation.participants.some((p) => p.userId === socket.userIdentifier)
        if (!isParticipant) return

        // ONLY broadcast to other users in the conversation
        socket.to(conversationId).emit("new-message", {
          conversationId,
          message: {
            ...message,
            timestamp: new Date().toISOString(),
          },
        })

        console.log(`Message broadcasted in conversation ${conversationId} by ${socket.userIdentifier}`)
      } catch (error) {
        console.error("Error broadcasting message:", error)
      }
    })

    // Handle message read status
    socket.on("mark-messages-read", async (data) => {
      try {
        const { conversationId, messageIds } = data
        if (!socket.userIdentifier || !conversationId) return

        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversationId,
            senderId: { $ne: socket.userIdentifier },
          },
          { isRead: true },
        )

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
          await User.findOneAndUpdate({ email: socket.userIdentifier }, { isOnline: false, lastSeen: new Date() })

          userSockets.delete(socket.userIdentifier)

          if (socket.currentConversation) {
            const users = conversationUsers.get(socket.currentConversation)
            if (users) {
              users.delete(socket.userIdentifier)
            }
          }

          socket.broadcast.emit("user-status-changed", {
            userId: socket.userIdentifier,
            isOnline: false,
          })
        } catch (error) {
          console.error("Error updating user offline status:", error)
        }
      }
    })

    // Handle sending notifications
    socket.on("send-notification", async (data) => {
      try {
        const { recipientId, type, title, message, metadata } = data
        
        if (!recipientId || !type || !title) {
          socket.emit("notification-error", { error: "Missing required notification data" })
          return
        }

        // Create notification in database
        const notification = await Notification.createNotification({
          recipientId: recipientId,
          senderId: socket.userIdentifier,
          type: type,
          title: title,
          message: message,
          metadata: metadata
        })

        // Send notification to recipient if they're online
        const recipientSocket = userSockets.get(recipientId)
        if (recipientSocket) {
          recipientSocket.emit("notification", {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            timestamp: notification.createdAt,
            isRead: notification.isRead,
            senderId: notification.senderId,
            metadata: notification.metadata
          })
        }

        // Send confirmation to sender
        socket.emit("notification-sent", { 
          success: true, 
          notificationId: notification._id 
        })

        console.log(`Notification sent from ${socket.userIdentifier} to ${recipientId}`)
      } catch (error) {
        console.error("Error sending notification:", error)
        socket.emit("notification-error", { error: "Failed to send notification" })
      }
    })

    // Handle marking notifications as read
    socket.on("mark-notification-read", async (data) => {
      try {
        const { notificationId } = data
        
        if (!socket.userIdentifier || !notificationId) {
          socket.emit("notification-error", { error: "Invalid request" })
          return
        }

        const notification = await Notification.findOne({
          _id: notificationId,
          recipientId: socket.userIdentifier
        })

        if (notification) {
          await notification.markAsRead()
          socket.emit("notification-marked-read", { notificationId: notificationId })
        }
      } catch (error) {
        console.error("Error marking notification as read:", error)
        socket.emit("notification-error", { error: "Failed to mark notification as read" })
      }
    })

    // Handle marking all notifications as read
    socket.on("mark-all-notifications-read", async () => {
      try {
        if (!socket.userIdentifier) {
          socket.emit("notification-error", { error: "User not authenticated" })
          return
        }

        await Notification.markAllAsRead(socket.userIdentifier)
        socket.emit("all-notifications-marked-read", { success: true })
      } catch (error) {
        console.error("Error marking all notifications as read:", error)
        socket.emit("notification-error", { error: "Failed to mark all notifications as read" })
      }
    })

    // Send existing notifications when user connects
    socket.on("get-notifications", async (data) => {
      try {
        if (!socket.userIdentifier) {
          socket.emit("notification-error", { error: "User not authenticated" })
          return
        }

        const { limit = 20, skip = 0 } = data || {}
        
        const notifications = await Notification.find({ 
          recipientId: socket.userIdentifier 
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)

        const unreadCount = await Notification.getUnreadCount(socket.userIdentifier)

        socket.emit("notifications-loaded", {
          notifications: notifications.map(n => ({
            id: n._id,
            type: n.type,
            title: n.title,
            message: n.message,
            timestamp: n.createdAt,
            isRead: n.isRead,
            senderId: n.senderId,
            metadata: n.metadata
          })),
          unreadCount: unreadCount
        })
      } catch (error) {
        console.error("Error loading notifications:", error)
        socket.emit("notification-error", { error: "Failed to load notifications" })
      }
    })

    // Helper function to send notification to user
    const sendNotificationToUser = async (recipientId, notificationData) => {
      try {
        // Create notification in database
        const notification = await Notification.createNotification({
          recipientId: recipientId,
          senderId: notificationData.senderId || 'system',
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          metadata: notificationData.metadata || {}
        })

        // Send to user if online
        const recipientSocket = userSockets.get(recipientId)
        if (recipientSocket) {
          recipientSocket.emit("notification", {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            timestamp: notification.createdAt,
            isRead: notification.isRead,
            senderId: notification.senderId,
            metadata: notification.metadata
          })
        }

        return notification
      } catch (error) {
        console.error("Error sending notification to user:", error)
        return null
      }
    }

    // Attach helper function to socket for use in other events
    socket.sendNotificationToUser = sendNotificationToUser

    // Handle connection errors
    socket.on("error", (error) => {
      console.error("Socket error:", error)
    })
  })

  return io
}

module.exports = initializeSocket
