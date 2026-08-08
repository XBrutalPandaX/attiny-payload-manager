import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import { config } from './config/index.js'
import { setupSocketRoutes } from './routes/socketRoutes.js'
import { logger } from './utils/index.js'

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

// Track active HTTP connections so we can destroy them on shutdown
const sockets = new Set()
server.on('connection', (socket) => {
  sockets.add(socket)
  socket.on('close', () => sockets.delete(socket))
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API version endpoint
app.get('/api/version', (req, res) => {
  res.json({ version: '1.0.0', name: 'ATtiny Payload Manager' })
})

// Socket.IO routes
setupSocketRoutes(io)

// Error handling middleware
app.use((err, req, res, next) => {
  logger.logToConsole(`Error: ${err.message}`, 'error')
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

const PORT = config.port
server.listen(PORT, () => {
  logger.logToConsole(`ATtiny Payload Manager server running on port ${PORT}`, 'info')
  logger.logToConsole(`Environment: ${config.nodeEnv}`, 'info')
  logger.logToConsole(`Platform: ${config.isWin ? 'Windows' : 'Unix'}`, 'info')
})

const handleShutdown = (signal) => {
  logger.logToConsole(`${signal} received, shutting down gracefully`, 'info')

  // Safety net: Force exit after 3 seconds if cleanup hangs
  const forceExit = setTimeout(() => {
    logger.logToConsole('Forced shutdown due to timeout', 'error')
    process.exit(1)
  }, 3000)
  forceExit.unref()

  // 1. Close Socket.IO server & disconnect all WebSockets
  io.close(() => {
    logger.logToConsole('Socket.IO closed', 'info')
  })

  // 2. Destroy remaining active HTTP sockets
  for (const socket of sockets) {
    socket.destroy()
  }

  // 3. Close the HTTP server
  server.close(() => {
    logger.logToConsole('Server closed successfully', 'info')
    process.exit(0)
  })
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'))
process.on('SIGINT', () => handleShutdown('SIGINT'))