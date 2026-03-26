const logger = require('../utils/logger');
const { setIO } = require('../utils/ioInstance');

function initSocket(io) {
  // Make io accessible to any controller that needs to emit notifications
  setIO(io);

  io.on("connection", (socket) => {
    logger.info('User connected', { socketId: socket.id });

    // ── User joins their personal notification room ──────────────────────
    // Frontend emits: socket.emit('join-user', userId)
    socket.on("join-user", (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        logger.info('User joined personal room', { socketId: socket.id, userId });
      }
    });

    // ── Join a conversation room ──────────────────────────────────────────
    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
      logger.info('Socket joined conversation', { socketId: socket.id, conversationId });
    });

    // ── Relay chat message + push notification to recipient ───────────────
    // message = { conversationId, senderId, senderName, text, fileUrl?,
    //             messageType?, recipientId? }
    socket.on("sendMessage", (message) => {
      // 1. Relay to everyone in the conversation room (chat UI)
      io.to(message.conversationId).emit("newMessage", message);
      logger.debug('Relayed message to conversation', { conversationId: message.conversationId });

      // 2. Push a notification to the recipient's personal room
      //    The frontend context checks window.location and only shows it
      //    when the user is NOT on the /chat page.
      if (message.recipientId) {
        const preview =
          message.messageType === "image"
            ? "📷 Sent an image"
            : message.messageType === "document"
            ? "📄 Sent a file"
            : (message.text || "").slice(0, 80);

        io.to(`user_${message.recipientId}`).emit("new-message", {
          id:             `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          type:           "message",
          title:          `New message from ${message.senderName || "Someone"}`,
          message:        { content: preview },
          timestamp:      Date.now(),
          isRead:         false,
          conversationId: message.conversationId,
          senderId:       message.senderId,
          senderName:     message.senderName,
        });
        logger.debug('Sent chat notification to recipient', { recipientId: message.recipientId });
      }
    });

    // ── Relay a notification from one user to another ─────────────────────
    // Frontend emits: socket.emit('send-notification', { recipientId, ...data })
    socket.on("send-notification", (data) => {
      if (data.recipientId) {
        io.to(`user_${data.recipientId}`).emit("notification", {
          id:        `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          timestamp: Date.now(),
          isRead:    false,
          ...data,
        });
        logger.debug('Relayed notification to user', { recipientId: data.recipientId });
      }
    });

    // ── Typing indicators ─────────────────────────────────────────────────
    socket.on("typing", (data) => {
      socket.to(data.conversationId).emit("typing", data);
    });

    socket.on("stopTyping", (data) => {
      socket.to(data.conversationId).emit("stopTyping", data);
    });

    // ── Online / offline status ───────────────────────────────────────────
    socket.on("userOnline", (userId) => {
      io.emit("userOnline", { userId });
    });

    socket.on("userOffline", (userId) => {
      io.emit("userOffline", { userId });
    });

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      logger.info('User disconnected', { socketId: socket.id });
    });
  });
}

module.exports = initSocket;
