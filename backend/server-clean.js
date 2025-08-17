const express = require('express')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const http = require('http')

// Load environment variables
dotenv.config()

// Import configurations and modules
const mongoose = require('./config/mongoose')
const logger = require('./utils/logger')
const initializeCleanSocket = require('./socket-clean')

const app = express()
const server = http.createServer(app)

// Initialize clean Socket.IO
const io = initializeCleanSocket(server)
app.set('io', io)

// CORS configuration
const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET,POST,PUT,DELETE,PATCH",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true
}
app.use(cors(corsOptions))

// Create required directories
const directories = [
  'logs',
  'uploads',
  'uploads/chat',
  'uploads/chat/images',
  'uploads/chat/documents'
]
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`Created directory: ${dir}`)
  }
})

// Setup access log stream
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'),
  { flags: 'a' }
)

// Logging middleware
app.use(morgan('combined', { stream: accessLogStream }))
app.use(morgan('dev'))

// Static assets
app.use('/uploads', express.static(path.resolve('uploads')))

// Middleware
app.use(express.json({ limit: '50mb' }))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API Routes
app.use('/api/chat', require('./Routes/chat-clean'))

// Keep existing routes for other functionality
app.use('/api/notifications', require('./Routes/notificationRoutes'))
app.use('/', require('./Routes')) // All other existing routes

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error)
  logger.error(`Server Error: ${error.message}`, { stack: error.stack })
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

// Start server
const port = process.env.PORT || 8080

server.listen(port, (err) => {
  if (err) {
    console.error('Error starting server:', err)
    process.exit(1)
  } else {
    console.log(`🚀 Clean Chat Server running on port ${port}`)
    console.log(`📱 Chat API available at http://localhost:${port}/api/chat`)
    console.log(`🔌 WebSocket server ready for connections`)
    logger.info(`Clean server started on port ${port}`)
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

module.exports = app
