    function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join conversation room
    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle text/image/file messages (just relay, no DB work)
    socket.on("sendMessage", (message) => {
      // message = { conversationId, senderId, text, fileUrl?, messageType? }
      io.to(message.conversationId).emit("newMessage", message);
      console.log("Relayed message to conversation:", message.conversationId);
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
      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = initSocket;
