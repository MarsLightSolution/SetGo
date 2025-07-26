const express = require("express")
const dotenv = require("dotenv").config()
const mongoose = require("./config/mongoose")
const cookieParser = require("cookie-parser")
const path = require("path")
const cors = require("cors")
const logger = require("./utils/logger")
const fs = require("fs")
const morgan = require("morgan")
const http = require("http")
const multer = require("multer")
const initializeSocket = require("./socket")

const app = express()
const server = http.createServer(app)

// Initialize Socket.IO
const io = initializeSocket(server)

// Make io available to routes
app.set("io", io)

const corsOptions = {
  origin: "http://localhost:5173", // Updated React app URL
  methods: "GET,POST,PUT,DELETE,PATCH",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
}

app.use(cors(corsOptions))

// Create directories if they don't exist
const directories = ["logs", "uploads", "uploads/chat", "uploads/chat/images", "uploads/chat/documents"]
directories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Create a write stream for HTTP request logs
const accessLogStream = fs.createWriteStream(path.join(__dirname, "logs", "access.log"), { flags: "a" })

app.use(morgan("combined", { stream: accessLogStream }))
app.use(morgan("dev"))

app.use("/api/assets", express.static(path.join(__dirname, "assets")))
app.use(express.json({ limit: "50mb" }))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use("/uploads", express.static(path.resolve("uploads")))

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = file.mimetype.startsWith("image/") ? "uploads/chat/images" : "uploads/chat/documents"
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + "-" + file.originalname)
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type. Only images and documents are allowed."))
    }
  },
})

// Make upload middleware available to routes
app.set("upload", upload)

// Chat routes
app.use("/api/chat", require("./Routes/chat"))

// Your existing routes
app.use("/", require("./Routes"))

const port = process.env.PORT || 8080

server.listen(port, (err) => {
  if (err) {
    console.log("Error:", err)
  } else {
    logger.info(`Server started on port ${port}`)
    console.log(`Socket.IO server running on port ${port}`)
  }
})
