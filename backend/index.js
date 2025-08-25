const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");              // <-- ADD
const { Server } = require("socket.io");   // <-- ADD

const mongoose = require("./config/mongoose");
const logger = require("./utils/logger");
const initSocket = require("./controller/Socketcontroller"); // <-- ADD
const uploadPictures = require("./middlewares/multer.middleware");

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET,POST,PUT,DELETE,PATCH",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};
app.use(cors(corsOptions));

// Setup access log stream
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "logs", "access.log"),
  { flags: "a" }
);

// Logging middleware
app.use(morgan("combined", { stream: accessLogStream }));
app.use(morgan("dev"));

// Static assets
app.use("/api/assets", express.static(path.join(__dirname, "assets")));
app.use("/uploads", express.static(path.resolve("uploads")));

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/", require("./Routes")); // All other routes

// ------------------- SOCKET.IO -------------------
const server = http.createServer(app); // wrap express in http server

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Init socket controller
initSocket(io);
// -------------------------------------------------

// Start server
const port = process.env.PORT || 8080;
server.listen(port, (err) => {
  if (err) {
    console.error("Error starting server:", err);
  } else {
    console.log(`server running on port ${port}`);
    logger.info(`Server started on port ${port}`);
  }
});
