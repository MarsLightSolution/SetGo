const socketIo = require("socket.io")
const User = require("./models/user")

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

    // Handle user joining (using username instead of userId)
    socket.on("join-user", async (username) => {
      try {
        socket.username = username
        userSockets.set(username, socket.id)

        // Update user online status using username
        await User.findOneAndUpdate({ username }, { isOnline: true, lastSeen: new Date() })

        console.log(`User ${username} joined with socket ${socket.id}`)
      } catch (error) {
        console.error("Error joining user:", error)
      }
    })

    // Join a conversation room
    socket.on("join-conversation", (conversationId) => {
      socket.join(conversationId)
      console.log(`User ${socket.username} joined conversation ${conversationId}`)
    })

    // Leave a conversation room
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(conversationId)
      console.log(`User ${socket.username} left conversation ${conversationId}`)
    })

    // Handle typing indicator
    socket.on("typing", (data) => {
      const { conversationId, isTyping, userName } = data
      socket.to(conversationId).emit("user-typing", { isTyping, userName })
    })

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id)

      if (socket.username) {
        try {
          // Update user offline status using username
          await User.findOneAndUpdate({ username: socket.username }, { isOnline: false, lastSeen: new Date() })

          userSockets.delete(socket.username)
          console.log(`User ${socket.username} went offline`)
        } catch (error) {
          console.error("Error updating user offline status:", error)
        }
      }
    })
  })

  return io
}

module.exports = initializeSocket
