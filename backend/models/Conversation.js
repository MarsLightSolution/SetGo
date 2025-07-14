const mongoose = require("mongoose")

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        userId: {
          type: String,
          required: true,
        },
        userName: {
          type: String,
          required: true,
        },
      },
    ],
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema)
