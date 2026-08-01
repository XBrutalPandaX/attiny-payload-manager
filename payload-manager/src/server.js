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

process.on('SIGTERM', () => {
  logger.logToConsole('SIGTERM received, shutting down gracefully', 'info')
  server.close(() => {
    logger.logToConsole('Server closed', 'info')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.logToConsole('SIGINT received, shutting down gracefully', 'info')
  server.close(() => {
    logger.logToConsole('Server closed', 'info')
    process.exit(0)
  })
})
