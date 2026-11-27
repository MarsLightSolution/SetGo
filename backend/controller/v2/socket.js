// v2 socket events, registered next to the existing ones (controller/Socketcontroller.js is
// unchanged). Clients that use these act only as the user verified on the handshake
// (socket.userId, set in index.js):
//   v2:join-user          joins the caller's own notification room (whatever id is sent)
//   v2:joinConversation   participants only
//   v2:sendMessage        participants only; relayed with the real senderId
//   v2:send-notification  only "liked your item", sent to the real product owner, text rebuilt
//   v2:typing / v2:stopTyping  only into conversations this socket joined
//   v2:userOnline / v2:userOffline  always about the caller
// The events the server emits back (newMessage, new-message, notification, typing, ...) keep
// their existing names, so clients' listeners don't change.
const mongoose = require("mongoose");
const logger = require("../../utils/logger");
const Conversation = require("../../models/Conversation");
const Product = require("../../models/product.model");
const User = require("../../models/user");

const isId = (v) => typeof v === "string" && mongoose.Types.ObjectId.isValid(v);

async function participantIds(conversationId) {
  if (!isId(conversationId)) return null;
  const conversation = await Conversation.findById(conversationId, "participants").lean();
  return conversation ? conversation.participants.map((p) => String(p.userId)) : null;
}

const safe = (socket, name, fn) => (...args) =>
  Promise.resolve()
    .then(() => fn(...args))
    .catch((err) => logger.warn(`[Socket v2] ${name} failed`, { socketId: socket.id, userId: socket.userId, message: err.message }));

function initSocketV2(io) {
  io.on("connection", (socket) => {
    const me = socket.userId ? String(socket.userId) : null;
    if (!me) return; // the handshake middleware already rejects these

    const joinOwnRoom = () => socket.join(`user_${me}`);
    socket.on("v2:join-user", joinOwnRoom);

    socket.on("v2:joinConversation", safe(socket, "joinConversation", async (conversationId) => {
      const ids = await participantIds(String(conversationId || ""));
      if (!ids || !ids.includes(me)) return;
      socket.join(String(conversationId));
    }));

    socket.on("v2:sendMessage", safe(socket, "sendMessage", async (message) => {
      const conversationId = String(message?.conversationId || "");
      const ids = await participantIds(conversationId);
      if (!ids || !ids.includes(me)) return;

      const relayed = {
        _id: message._id,
        conversationId,
        senderId: me,
        senderName: typeof message.senderName === "string" ? message.senderName.slice(0, 80) : undefined,
        text: typeof message.text === "string" ? message.text.slice(0, 5000) : "",
        fileUrl: typeof message.fileUrl === "string" && message.fileUrl.startsWith("/uploads/chat/") ? message.fileUrl : undefined,
        messageType: ["text", "image", "document"].includes(message.messageType) ? message.messageType : "text",
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

    socket.on("v2:send-notification", safe(socket, "send-notification", async (data) => {
      if (data?.type !== "like" || !isId(String(data?.metadata?.productId || ""))) return;
      const product = await Product.findById(data.metadata.productId, "owner title").lean();
      if (!product || !product.owner || String(product.owner) === me) return;
      const sender = await User.findById(me, "username profileName chatDisplayName").lean();
      const senderName = sender?.chatDisplayName || sender?.profileName || sender?.username || "Someone";
      const productTitle = product.title?.en || product.title?.az || product.title?.ru || "your item";
      io.to(`user_${product.owner}`).emit("notification", {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: "like",
        title: `${senderName} liked your item`,
        message: productTitle,
        metadata: { productId: String(product._id) },
        timestamp: Date.now(),
        isRead: false,
      });
    }));

    const relayTyping = (event) => (data) => {
      const conversationId = String(data?.conversationId || "");
      if (!socket.rooms.has(conversationId)) return;
      socket.to(conversationId).emit(event, {
        conversationId,
        userId: me,
        userName: typeof data?.userName === "string" ? data.userName.slice(0, 80) : undefined,
      });
    };
    socket.on("v2:typing", relayTyping("typing"));
    socket.on("v2:stopTyping", relayTyping("stopTyping"));

    socket.on("v2:userOnline", () => io.emit("userOnline", { userId: me }));
    socket.on("v2:userOffline", () => io.emit("userOffline", { userId: me }));
  });
}

module.exports = initSocketV2;
