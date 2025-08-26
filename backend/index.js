// index.js
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const mongoose = require("./config/mongoose");
const logger = require("./utils/logger");
const initSocket = require("./controller/Socketcontroller");
const uploadPictures = require("./middlewares/multer.middleware");

dotenv.config();

const app = express();

// ------------------- CORS -------------------
const allowedOrigins = [
  "http://localhost:5173",  // dev
  "http://51.20.123.49",    // prod HTTPS
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,POST,PUT,DELETE,PATCH",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};

app.use(cors(corsOptions));

// ------------------- Logging -------------------
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "logs", "access.log"),
  { flags: "a" }
);

app.use(morgan("combined", { stream: accessLogStream }));
app.use(morgan("dev"));

// ------------------- Static Assets -------------------
app.use("/api/assets", express.static(path.join(__dirname, "assets")));
app.use("/uploads", express.static(path.resolve("uploads")));

// ------------------- Middleware -------------------
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ------------------- Routes -------------------
app.use("/", require("./Routes"));

// ------------------- SOCKET.IO -------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // ensure websocket works behind proxies
});

// Init socket controller
initSocket(io);

// Optional: log connections
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ------------------- Start Server -------------------
const port = process.env.PORT || 8080;
server.listen(port, (err) => {
  if (err) {
    console.error("Error starting server:", err);
  } else {
    console.log(`Server running on port ${port}`);
    logger.info(`Server started on port ${port}`);
  }
});
