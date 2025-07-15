const socketIo = require("socket.io")
const User = require("./models/User")
const mongoose = require("mongoose")

function initializeSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  })

  // Store user socket mappings
  const userSockets = new Map()

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    // Handle user joining (using email instead of username)
    socket.on("join-user", async (userIdentifier) => {
      try {
        let user = null

        // Check if userIdentifier is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
          // Search by _id if it's a valid ObjectId
          user = await User.findById(userIdentifier)
        }

        // If not found by ID or not a valid ObjectId, search by email/username
        if (!user) {
          user = await User.findOne({
            $or: [{ email: userIdentifier }, { username: userIdentifier }],
          })
        }

        if (user) {
          socket.userIdentifier = user.email // Use email as consistent identifier
          userSockets.set(user.email, socket.id)

          // Update user online status using email
          await User.findOneAndUpdate({ email: user.email }, { isOnline: true, lastSeen: new Date() })

          console.log(`User ${user.email} joined with socket ${socket.id}`)
        } else {
          console.log(`User not found for identifier: ${userIdentifier}`)
        }
      } catch (error) {
        console.error("Error joining user:", error)
      }
    })

    // Join a conversation room
    socket.on("join-conversation", (conversationId) => {
      socket.join(conversationId)
      console.log(`User ${socket.userIdentifier} joined conversation ${conversationId}`)
    })

    // Leave a conversation room
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(conversationId)
      console.log(`User ${socket.userIdentifier} left conversation ${conversationId}`)
    })

    // Handle typing indicator
    socket.on("typing", (data) => {
      const { conversationId, isTyping, userName } = data
      socket.to(conversationId).emit("user-typing", { isTyping, userName })
    })

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id)

      if (socket.userIdentifier) {
        try {
          // Update user offline status using email
          await User.findOneAndUpdate({ email: socket.userIdentifier }, { isOnline: false, lastSeen: new Date() })

          userSockets.delete(socket.userIdentifier)
          console.log(`User ${socket.userIdentifier} went offline`)
        } catch (error) {
          console.error("Error updating user offline status:", error)
        }
      }
    })
  })

  return io
}

module.exports = initializeSocket
