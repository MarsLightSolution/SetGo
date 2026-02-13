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
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const mongoose = require("./config/mongoose");
const logger = require("./utils/logger");
const initSocket = require("./controller/Socketcontroller");
const uploadPictures = require("./middlewares/multer.middleware");
const { validateEnvVariables } = require("./utils/validateEnv");
const { generalLimiter } = require("./middlewares/rateLimiter.middleware");

// Load environment variables first
dotenv.config();

// SECURITY: Validate environment variables before starting server
try {
  validateEnvVariables();
} catch (error) {
  logger.error('Environment validation failed. Server cannot start.', { message: error.message });
  process.exit(1);
}

const app = express();

// ------------------- SECURITY MIDDLEWARE -------------------
// SECURITY: Helmet.js - Sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Needed for some third-party services
}));

// SECURITY: MongoDB injection prevention
app.use(mongoSanitize());

// ------------------- CORS -------------------
// SECURITY: Use environment-based CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL,
      "https://tiwari.shop",
      "https://www.tiwari.shop",
    ].filter(Boolean) // Remove undefined values
  : [
      "http://localhost:5173",
      "http://localhost:8080",  // For serve build testing
      "http://localhost:8081",
      "http://172.20.10.2:8081",
      "http://51.20.123.49",
      "http://10.113.84.234:8080",
      "http://10.175.186.234:8080",
      "http://10.233.109.234:8080",
      "http://10.106.131.234:8080",
      "http://10.175.186.234:8080"
    ];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, // Cache preflight requests for 24 hours
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

// SECURITY: Apply general rate limiting to all routes
app.use(generalLimiter);

// ------------------- Routes -------------------
app.use("/", require("./Routes"));

// ------------------- GLOBAL ERROR HANDLER -------------------
// SECURITY: Centralized error handling
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Log error details for debugging
  logger.error({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Rate limit error
  if (err.message && err.message.includes('Too many requests')) {
    return res.status(429).json({
      error: 'Too many requests',
      message: err.message,
    });
  }

  // CORS error
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.errors,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Token expired',
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'Resource already exists',
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message;

  res.status(statusCode).json({
    error: 'Server Error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

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
  logger.info('New client connected', { socketId: socket.id });
  socket.on("disconnect", () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// ------------------- Start Server -------------------
const port = process.env.PORT || 8080;
server.listen(port, (err) => {
  if (err) {
    logger.error('Error starting server', { message: err.message, stack: err.stack });
  } else {
    logger.info('Server running', { port });
  }
});
