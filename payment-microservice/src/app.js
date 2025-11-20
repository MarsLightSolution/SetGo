// payment-microservice/src/app.js - FIXED VERSION
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const config = require('./config');
const logger = require('./utils/logger');
const connectDB = require('./config/database.config');
const { errorHandler } = require('./utils/error.handler');

// Import routes
const paymentRoutes = require('./routes/payment.routes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.MAIN_BACKEND_URL || 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// Make socket.io globally accessible
global.io = io;

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Socket.io client connected', { socketId: socket.id });

  socket.on('subscribePayment', (orderId) => {
    logger.info('Client subscribed to payment', { socketId: socket.id, orderId });
    socket.join(`payment-${orderId}`);
  });

  socket.on('disconnect', () => {
    logger.info('Socket.io client disconnected', { socketId: socket.id });
  });

  socket.on('error', (error) => {
    logger.error('Socket.io error:', {
      socketId: socket.id,
      message: error.message,
      stack: error.stack
    });
  });
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.MAIN_BACKEND_URL || 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Trust proxy (if behind nginx/gateway)
app.set('trust proxy', 1);

// ------------------- HEALTH CHECK ENDPOINT -------------------
app.get('/health', async (req, res) => {
  const healthcheck = {
    status: 'healthy',
    service: 'payment-microservice',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      socketIO: 'unknown',
      rsaKeys: 'unknown',
    }
  };

  try {
    // Check database connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      healthcheck.checks.database = 'connected';
    } else {
      healthcheck.checks.database = 'disconnected';
      healthcheck.status = 'degraded';
    }

    // Check Socket.IO
    if (io && io.engine) {
      healthcheck.checks.socketIO = 'active';
      healthcheck.checks.connectedClients = io.engine.clientsCount;
    } else {
      healthcheck.checks.socketIO = 'inactive';
      healthcheck.status = 'degraded';
    }

    // Check RSA keys loaded
    const fs = require('fs');
    const path = require('path');
    const privateKeyPath = path.join(__dirname, '../keys/private.pem');
    const publicKeyPath = path.join(__dirname, '../keys/public.pem');
    
    if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
      healthcheck.checks.rsaKeys = 'loaded';
    } else {
      healthcheck.checks.rsaKeys = 'missing';
      healthcheck.status = 'degraded';
    }

    const statusCode = healthcheck.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthcheck);

  } catch (error) {
    logger.error('Health check error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(503).json({
      status: 'unhealthy',
      service: 'payment-microservice',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// API Routes
app.use('/api/v1/payments', paymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('Database connected successfully');

    // Start server
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      logger.info(`Payment microservice running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Socket.IO ready for connections`);
      logger.info(`Health check available at: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    name: error.name
  });
  process.exit(1);
});

// Handle unhandled promise rejections - FIXED
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    name: reason instanceof Error ? reason.name : 'Unknown',
    promise: String(promise)
  });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = { app, server, io };