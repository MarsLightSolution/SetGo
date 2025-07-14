const WebSocket = require("ws")

function initializeWebSocket(server) {
  const wss = new WebSocket.Server({ server })
  const clients = new Map() // userId -> WebSocket

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection")

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString())

        switch (message.type) {
          case "join":
            // Associate user with WebSocket connection
            clients.set(message.userId, ws)
            ws.userId = message.userId
            console.log(`User ${message.userId} joined`)
            break

          case "send-message":
            // Broadcast message to conversation participants
            const { conversationId, message: msgData } = message

            // Find all participants in the conversation and send message
            clients.forEach((clientWs, userId) => {
              if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: "new-message",
                    conversationId,
                    message: msgData,
                  }),
                )
              }
            })
            break
        }
      } catch (error) {
        console.error("WebSocket message error:", error)
      }
    })

    ws.on("close", () => {
      // Remove user from clients map
      if (ws.userId) {
        clients.delete(ws.userId)
        console.log(`User ${ws.userId} disconnected`)
      }
    })

    ws.on("error", (error) => {
      console.error("WebSocket error:", error)
    })
  })

  return wss
}

module.exports = initializeWebSocket
