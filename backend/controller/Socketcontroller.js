const logger = require('../utils/logger');

function initSocket(io) {
  io.on("connection", (socket) => {
    logger.info('User connected', { socketId: socket.id });

    // Join conversation room
    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
      logger.info('Socket joined conversation', { socketId: socket.id, conversationId });
    });

    // Handle text/image/file messages (just relay, no DB work)
    socket.on("sendMessage", (message) => {
      // message = { conversationId, senderId, text, fileUrl?, messageType? }
      io.to(message.conversationId).emit("newMessage", message);
      logger.debug('Relayed message to conversation', { conversationId: message.conversationId });
    });

    // Typing indicator
    socket.on("typing", (data) => {
      // data = { conversationId, userId }
      socket.to(data.conversationId).emit("typing", data);
    });

    // Stop typing indicator
    socket.on("stopTyping", (data) => {
      socket.to(data.conversationId).emit("stopTyping", data);
    });

    // Online/offline status
    socket.on("userOnline", (userId) => {
      io.emit("userOnline", { userId });
    });
    socket.on("userOffline", (userId) => {
      io.emit("userOffline", { userId });
    });

    // Disconnect
    socket.on("disconnect", () => {
      logger.info('User disconnected', { socketId: socket.id });
    });
  });
}

module.exports = initSocket;
