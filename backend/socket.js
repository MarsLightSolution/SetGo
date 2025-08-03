const socketIo = require("socket.io");
const User = require("./models/user");
const Conversation = require("./models/Conversation");
const Message = require("./models/Message");
const Notification = require("./models/Notification");
const mongoose = require("mongoose");

function initializeSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  const userSockets = new Map();
  const paymentOrderSockets = new Map();
  const conversationUsers = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-user", async (userIdentifier) => {
      try {
        let user = null;

        if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
          user = await User.findById(userIdentifier);
        }

        if (!user) {
          user = await User.findOne({
            $or: [{ email: userIdentifier }, { username: userIdentifier }],
          });
        }

        if (user) {
          socket.userIdentifier = user.email;
          socket.userName = user.chatDisplayName || user.profileName || user.username;

          const oldSocket = userSockets.get(user.email);
          if (oldSocket && oldSocket !== socket) {
            oldSocket.disconnect();
          }

          userSockets.set(user.email, socket);

          await User.findOneAndUpdate(
            { email: user.email },
            { isOnline: true, lastSeen: new Date() }
          );

          socket.broadcast.emit("user-status-changed", {
            userId: user.email,
            userName: socket.userName,
            isOnline: true,
          });

          socket.emit("user-joined", {
            success: true,
            userId: user.email,
            userName: socket.userName,
          });
        } else {
          socket.emit("user-joined", { success: false, message: "User not found" });
        }
      } catch (error) {
        console.error("Error joining user:", error);
        socket.emit("user-joined", { success: false, message: "Connection error" });
      }
    });

    socket.on("join-conversation", async (conversationId) => {
      try {
        if (!socket.userIdentifier) return;

        if (socket.currentConversation) {
          socket.leave(socket.currentConversation);
          const prevUsers = conversationUsers.get(socket.currentConversation);
          if (prevUsers) prevUsers.delete(socket.userIdentifier);
        }

        socket.join(conversationId);
        socket.currentConversation = conversationId;

        if (!conversationUsers.has(conversationId)) {
          conversationUsers.set(conversationId, new Set());
        }
        conversationUsers.get(conversationId).add(socket.userIdentifier);

        socket.emit("conversation-joined", { conversationId, success: true });
      } catch (error) {
        console.error("Error joining conversation:", error);
      }
    });

    socket.on("leave-conversation", (conversationId) => {
      if (socket.currentConversation === conversationId) {
        socket.leave(conversationId);
        socket.currentConversation = null;

        const users = conversationUsers.get(conversationId);
        if (users) users.delete(socket.userIdentifier);
      }
    });

    socket.on("typing", ({ conversationId, isTyping }) => {
      if (socket.userIdentifier && conversationId) {
        socket.to(conversationId).emit("user-typing", {
          userId: socket.userIdentifier,
          userName: socket.userName,
          isTyping,
          conversationId,
        });
      }
    });

    socket.on("send-message", async ({ conversationId, message }) => {
      try {
        if (!socket.userIdentifier || !conversationId || !message) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        const isParticipant = conversation.participants.some(
          (p) => p.userId === socket.userIdentifier
        );
        if (!isParticipant) return;

        socket.to(conversationId).emit("new-message", {
          conversationId,
          message: { ...message, timestamp: new Date().toISOString() },
        });
      } catch (error) {
        console.error("Error broadcasting message:", error);
      }
    });

    socket.on("mark-messages-read", async ({ conversationId, messageIds }) => {
      try {
        if (!socket.userIdentifier || !conversationId) return;

        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversationId,
            senderId: { $ne: socket.userIdentifier },
          },
          { isRead: true }
        );

        socket.to(conversationId).emit("messages-read", {
          conversationId,
          messageIds,
          readBy: socket.userIdentifier,
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    socket.on("subscribePayment", (orderId) => {
      paymentOrderSockets.set(orderId, socket.id);
    });

    socket.on("send-notification", async (data) => {
      try {
        const { recipientId, type, title, message, metadata } = data;
        if (!recipientId || !type || !title) {
          socket.emit("notification-error", { error: "Missing required notification data" });
          return;
        }

        const notification = await Notification.createNotification({
          recipientId,
          senderId: socket.userIdentifier,
          type,
          title,
          message,
          metadata,
        });

        const recipientSocket = userSockets.get(recipientId);
        if (recipientSocket) {
          recipientSocket.emit("notification", {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            timestamp: notification.createdAt,
            isRead: notification.isRead,
            senderId: notification.senderId,
            metadata: notification.metadata,
          });
        }

        socket.emit("notification-sent", { success: true, notificationId: notification._id });
      } catch (error) {
        console.error("Error sending notification:", error);
        socket.emit("notification-error", { error: "Failed to send notification" });
      }
    });

    socket.on("get-notifications", async ({ limit = 20, skip = 0 } = {}) => {
      try {
        if (!socket.userIdentifier) {
          socket.emit("notification-error", { error: "User not authenticated" });
          return;
        }

        const notifications = await Notification.find({ recipientId: socket.userIdentifier })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip);

        const unreadCount = await Notification.getUnreadCount(socket.userIdentifier);

        socket.emit("notifications-loaded", {
          notifications: notifications.map((n) => ({
            id: n._id,
            type: n.type,
            title: n.title,
            message: n.message,
            timestamp: n.createdAt,
            isRead: n.isRead,
            senderId: n.senderId,
            metadata: n.metadata,
          })),
          unreadCount,
        });
      } catch (error) {
        console.error("Error loading notifications:", error);
        socket.emit("notification-error", { error: "Failed to load notifications" });
      }
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);

      for (const [email, s] of userSockets.entries()) {
        if (s === socket) {
          userSockets.delete(email);
          try {
            await User.findOneAndUpdate(
              { email },
              { isOnline: false, lastSeen: new Date() }
            );
          } catch (error) {
            console.error("Error updating user offline status:", error);
          }
          break;
        }
      }

      for (const [orderId, sId] of paymentOrderSockets.entries()) {
        if (sId === socket.id) {
          paymentOrderSockets.delete(orderId);
        }
      }
    });
  });

  io.userSockets = userSockets;
  io.paymentOrderSockets = paymentOrderSockets;

  return io;
}

module.exports = initializeSocket;
