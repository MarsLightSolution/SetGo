const socketIo = require("socket.io")
const User = require("./models/User")
const Conversation = require("./models/Conversation")
const Message = require("./models/Message")
const Notification = require("./models/Notification")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")

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

  // Middleware to verify authentication
  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth or query
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id, "User:", socket.userEmail)

    // Handle user joining
    socket.on("join-user", async (userIdentifier) => {
      try {
        const user = await User.findById(socket.userId);
        if (!user) {
          socket.emit("user-joined", { success: false, message: "User not found" });
          return;
        }

        socket.userIdentifier = user.email;
        socket.userName = user.chatDisplayName || user.profileName || user.username;

        // Remove old socket if exists
        const oldSocket = userSockets.get(user.email);
        if (oldSocket && oldSocket !== socket) {
          oldSocket.disconnect();
        }

        userSockets.set(user.email, socket);

        // Update user online status
        await User.findByIdAndUpdate(user._id, { 
          isOnline: true, 
          lastSeen: new Date() 
        });

        console.log(`User ${user.email} joined with socket ${socket.id}`);

        // Broadcast user status change
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
      } catch (error) {
        console.error("Error joining user:", error);
        socket.emit("user-joined", { success: false, message: "Connection error" });
      }
    });

    // Join conversation room
    socket.on("join-conversation", async (conversationId) => {
      try {
        if (!socket.userIdentifier) {
          socket.emit("conversation-joined", { success: false, message: "User not authenticated" });
          return;
        }

        // Verify user is part of this conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit("conversation-joined", { success: false, message: "Conversation not found" });
          return;
        }

        const isParticipant = conversation.participants.some(p => p.userId === socket.userIdentifier);
        if (!isParticipant) {
          socket.emit("conversation-joined", { success: false, message: "Unauthorized" });
          return;
        }

        // Leave previous conversation
        if (socket.currentConversation) {
          socket.leave(socket.currentConversation);
          const prevUsers = conversationUsers.get(socket.currentConversation);
          if (prevUsers) {
            prevUsers.delete(socket.userIdentifier);
          }
        }

        // Join new conversation
        socket.join(conversationId);
        socket.currentConversation = conversationId;

        if (!conversationUsers.has(conversationId)) {
          conversationUsers.set(conversationId, new Set());
        }
        conversationUsers.get(conversationId).add(socket.userIdentifier);

        socket.emit("conversation-joined", { success: true, conversationId });
        
        // Notify other users in conversation
        socket.to(conversationId).emit("user-joined-conversation", {
          userId: socket.userIdentifier,
          userName: socket.userName,
        });
      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("conversation-joined", { success: false, message: "Failed to join conversation" });
      }
    });

    // Leave conversation
    socket.on("leave-conversation", (conversationId) => {
      try {
        socket.leave(conversationId);
        socket.currentConversation = null;

        const users = conversationUsers.get(conversationId);
        if (users) {
          users.delete(socket.userIdentifier);
        }

        socket.to(conversationId).emit("user-left-conversation", {
          userId: socket.userIdentifier,
          userName: socket.userName,
        });
      } catch (error) {
        console.error("Error leaving conversation:", error);
      }
    });

    // Handle typing
    socket.on("typing", async (data) => {
      try {
        const { conversationId, isTyping } = data;
        
        if (!socket.currentConversation || socket.currentConversation !== conversationId) {
          return;
        }

        socket.to(conversationId).emit("user-typing", {
          userId: socket.userIdentifier,
          userName: socket.userName,
          conversationId,
          isTyping,
        });
      } catch (error) {
        console.error("Error handling typing:", error);
      }
    });

    // Send message
    socket.on("send-message", async (data) => {
      try {
        const { conversationId, message } = data;
        
        if (!socket.currentConversation || socket.currentConversation !== conversationId) {
          socket.emit("message-error", { error: "Not in conversation" });
          return;
        }

        // Broadcast message to all users in conversation
        io.to(conversationId).emit("new-message", {
          conversationId,
          message,
        });

        // Update conversation last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message.text,
          lastMessageTime: new Date(),
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message-error", { error: "Failed to send message" });
      }
    });

    // Mark messages as read
    socket.on("mark-messages-read", async (data) => {
      try {
        const { conversationId, messageIds } = data;
        
        if (!socket.currentConversation || socket.currentConversation !== conversationId) {
          return;
        }

        // Update messages as read
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { isRead: true }
        );

        // Notify other users in conversation
        socket.to(conversationId).emit("messages-read", {
          messageIds,
          readBy: socket.userIdentifier,
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      try {
        console.log("User disconnected:", socket.id);

        if (socket.userIdentifier) {
          // Remove from user sockets
          userSockets.delete(socket.userIdentifier);

          // Update user offline status
          await User.findOneAndUpdate(
            { email: socket.userIdentifier },
            { isOnline: false, lastSeen: new Date() }
          );

          // Broadcast user status change
          socket.broadcast.emit("user-status-changed", {
            userId: socket.userIdentifier,
            userName: socket.userName,
            isOnline: false,
          });

          // Leave conversation
          if (socket.currentConversation) {
            const users = conversationUsers.get(socket.currentConversation);
            if (users) {
              users.delete(socket.userIdentifier);
            }
          }
        }
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });

  return io;
}

module.exports = initializeSocket;
