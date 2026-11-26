// Socket.IO events. SECURITY: index.js verifies the JWT on the handshake and sets socket.userId.
// Every handler acts as that user only: a socket can join only its own notification room and
// conversations it takes part in, relayed messages carry its real id, and client-sent
// notifications are limited to "liked your item", rebuilt from the database.
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { setIO } = require('../utils/ioInstance');
const Conversation = require('../models/Conversation');
const Product = require('../models/product.model');
const User = require('../models/user');

const isId = (v) => typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);

async function participantIds(conversationId) {
  if (!isId(conversationId)) return null;
  const conversation = await Conversation.findById(conversationId, 'participants').lean();
  return conversation ? conversation.participants.map((p) => String(p.userId)) : null;
}

// Wrap async handlers so a bad payload or DB error can't crash the process.
const safe = (socket, name, fn) => (...args) =>
  Promise.resolve(fn(...args)).catch((err) =>
    logger.warn(`[Socket] ${name} failed`, { socketId: socket.id, userId: socket.userId, message: err.message }));

function initSocket(io) {
  // Make io accessible to any controller that needs to emit notifications
  setIO(io);

  io.on("connection", (socket) => {
    const me = socket.userId ? String(socket.userId) : null;
    logger.info('User connected', { socketId: socket.id, userId: me });
    if (!me) {
      socket.disconnect(true);
      return;
    }

    // Personal notification room: always the authenticated user's own, whatever id is sent.
    const joinOwnRoom = () => socket.join(`user_${me}`);
    joinOwnRoom();
    socket.on("join-user", joinOwnRoom);

    // ── Join a conversation room (participants only) ──────────────────────
    socket.on("joinConversation", safe(socket, 'joinConversation', async (conversationId) => {
      const ids = await participantIds(conversationId);
      if (!ids || !ids.includes(me)) {
        logger.warn('[Socket] joinConversation refused', { userId: me, conversationId });
        return;
      }
      socket.join(String(conversationId));
    }));

    // ── Relay chat message + notification to the other participant ──────
    // The message itself is saved through the REST API; this only pushes it live.
    socket.on("sendMessage", safe(socket, 'sendMessage', async (message) => {
      const conversationId = String(message?.conversationId || '');
      const ids = await participantIds(conversationId);
      if (!ids || !ids.includes(me)) return;

      const relayed = {
        _id: message._id,
        conversationId,
        senderId: me,
        senderName: typeof message.senderName === 'string' ? message.senderName.slice(0, 80) : undefined,
        text: typeof message.text === 'string' ? message.text.slice(0, 5000) : '',
        fileUrl: typeof message.fileUrl === 'string' && message.fileUrl.startsWith('/uploads/chat/') ? message.fileUrl : undefined,
        messageType: ['text', 'image', 'document'].includes(message.messageType) ? message.messageType : 'text',
        timestamp: Date.now(),
      };
      io.to(conversationId).emit("newMessage", relayed);

      const recipientId = ids.find((id) => id !== me);
      if (recipientId) {
        const preview = relayed.messageType === "image" ? "📷 Sent an image"
          : relayed.messageType === "document" ? "📄 Sent a file"
          : relayed.text.slice(0, 80);
        io.to(`user_${recipientId}`).emit("new-message", {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          type: "message",
          title: `New message from ${relayed.senderName || "Someone"}`,
          message: { content: preview },
          timestamp: Date.now(),
          isRead: false,
          conversationId,
          senderId: me,
          senderName: relayed.senderName,
        });
      }
    }));

    // ── Client-sent notification: only "liked your item", to that item's owner ──
    socket.on("send-notification", safe(socket, 'send-notification', async (data) => {
      if (data?.type !== 'like' || !isId(String(data?.metadata?.productId || ''))) return;
      const product = await Product.findById(data.metadata.productId, 'owner title').lean();
      if (!product || String(product.owner) === me) return;
      const sender = await User.findById(me, 'username profileName chatDisplayName').lean();
      const senderName = sender?.chatDisplayName || sender?.profileName || sender?.username || 'Someone';
      const productTitle = product.title?.en || product.title?.az || product.title?.ru || 'your item';
      io.to(`user_${product.owner}`).emit("notification", {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: 'like',
        title: `${senderName} liked your item`,
        message: productTitle,
        metadata: { productId: String(product._id) },
        timestamp: Date.now(),
        isRead: false,
      });
    }));

    // ── Typing indicators (only into conversations this socket joined) ────
    const relayTyping = (event) => (data) => {
      const conversationId = String(data?.conversationId || '');
      if (!socket.rooms.has(conversationId)) return;
      socket.to(conversationId).emit(event, { conversationId, userId: me, userName: data?.userName });
    };
    socket.on("typing", relayTyping("typing"));
    socket.on("stopTyping", relayTyping("stopTyping"));

    // ── Online / offline status (always about the authenticated user) ─────
    socket.on("userOnline", () => io.emit("userOnline", { userId: me }));
    socket.on("userOffline", () => io.emit("userOffline", { userId: me }));

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      logger.info('User disconnected', { socketId: socket.id });
    });
  });
}

module.exports = initSocket;
