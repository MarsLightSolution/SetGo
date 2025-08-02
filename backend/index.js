const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const multer = require("multer");

const mongoose = require("./config/mongoose");
const logger = require("./utils/logger");
const initializeSocket = require("./socket");

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);
app.set("io", io);

// CORS configuration
const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET,POST,PUT,DELETE,PATCH",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};
app.use(cors(corsOptions));

// Create required directories if not exist
const directories = [
  "logs",
  "uploads",
  "uploads/chat",
  "uploads/chat/images",
  "uploads/chat/documents"
];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Setup access log stream
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'),
  { flags: 'a' }
);

// Logging middleware
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

// Static assets
app.use("/api/assets", express.static(path.join(__dirname, "assets")));
app.use("/uploads", express.static(path.resolve("uploads")));

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = file.mimetype.startsWith("image/")
      ? "uploads/chat/images"
      : "uploads/chat/documents";
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
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
    ];
    allowedTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Invalid file type. Only images and documents are allowed."));
  },
});
app.set("upload", upload);

// Routes
app.use("/api/chat", require("./Routes/chatRoutes"));
app.use("/api/notifications", require("./Routes/notificationRoutes"));
app.use("/", require("./Routes")); // All other routes

// Start server
const port = process.env.PORT || 8080;
server.listen(port, (err) => {
  if (err) {
    console.error("Error starting server:", err);
  } else {
    console.log(`Socket.IO server running on port ${port}`);
    logger.info(`Server started on port ${port}`);
  }
});
