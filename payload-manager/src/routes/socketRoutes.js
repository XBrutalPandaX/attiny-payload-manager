import { logger, banner } from '../utils/index.js'
import { sendHelp } from '../controllers/helpController.js'
import {
  runPayload,
  runSketch,
  previewSketch,
  runRegistry,
  handleForceReset,
} from '../controllers/payloadController.js'

export const setupSocketRoutes = (io) => {
  io.on('connection', (socket) => {
    logger.log(socket, banner, 'banner')
    logger.log(socket, "DETAIL: connected — type 'help' for reference", 'detail')

    socket.on('help', () => sendHelp(socket))

    socket.on('run-payload', (data) => runPayload(socket, data))

    socket.on('run-sketch', (data) => runSketch(socket, data))

    socket.on('preview-sketch', (data) => previewSketch(socket, data))

    socket.on('run-registry', (data) => runRegistry(socket, data))

    socket.on('force-reset', () => handleForceReset(socket))
  })
}
