const express = require("express")
const dotenv = require("dotenv").config()
const mongoose = require("./config/mongoose")
const cookieParser = require("cookie-parser")
const path = require("path")
const cors = require("cors")
const fs = require("fs")
const http = require("http")
const initializeSocket = require("./socket")

const app = express()
const server = http.createServer(app)

// Initialize Socket.IO
const io = initializeSocket(server)

// Make io available to routes
app.set("io", io)

const corsOptions = {
  origin: "http://localhost:5173", // Updated React app URL
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
}

app.use(cors(corsOptions))

// Create logs directory if it doesn't exist
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs")
}

// Create a write stream for HTTP request logs

app.use("/api/assets", express.static(path.join(__dirname, "assets")))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use("/uploads", express.static(path.resolve("uploads")))


// Your existing routes
app.use("/", require("./Routes"))

const port = process.env.PORT || 8080

server.listen(port, (err) => {
  if (err) {
    console.log("Error:", err)
  } else {
    console.log(`Socket.IO server running on port ${port}`)
  }
})
