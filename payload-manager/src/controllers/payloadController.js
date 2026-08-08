import { logger, escapeString, speedMap } from '../utils/index.js'
import { buildCommand, registryParser } from '../services/commandBuilder.js'
import { buildTriggerCode, makeSketch } from '../services/sketchBuilder.js'
import { buildUsbConfig } from '../services/deviceProfile.js'
import { buildAndUpload, forceReset } from '../services/compiler.js'

export const runPayload = (socket, data) => {
  const { bin = 'powershell', customBin = '', trigger = 'run', cmd, speed = 'normal', deviceProfile = 'default', customVid = '', customPid = '' } = data

  logger.log(socket, `DETAIL: bin=${bin} via=${trigger} speed=${speed} usb=${deviceProfile}`, 'detail')

  const mult = speedMap[speed] || 1.0
  const command = buildCommand(bin, cmd, customBin)
  const escaped = escapeString(command)
  const triggerCode = buildTriggerCode(trigger, escaped, mult, speed)

  if (!triggerCode) {
    logger.log(socket, 'CRITICAL: unknown trigger "' + trigger + '"', 'error')
    return
  }

  const usbCfg = buildUsbConfig(deviceProfile, customVid, customPid)
  buildAndUpload(socket, makeSketch(triggerCode, speed), usbCfg)
}

export const runSketch = (socket, data) => {
  const { code, deviceProfile = 'default', customVid = '', customPid = '' } = data
  logger.log(socket, 'DETAIL: custom sketch mode', 'detail')
  const usbCfg = buildUsbConfig(deviceProfile, customVid, customPid)
  buildAndUpload(socket, code, usbCfg)
}

export const previewSketch = (socket, data) => {
  const { bin, customBin, trigger, cmd, speed } = data
  const mult = speedMap[speed] || 1.0
  const command = buildCommand(bin || 'powershell', cmd, customBin)
  const escaped = escapeString(command)
  const triggerCode = buildTriggerCode(trigger || 'run', escaped, mult, speed || 'normal')

  if (!triggerCode) {
    logger.log(socket, 'CRITICAL: unknown trigger', 'error')
    return
  }

  socket.emit('sketch-content', makeSketch(triggerCode, speed || 'normal'))
}

export const runRegistry = (socket, data) => {
  const { cmd } = data
  if (!cmd) return
  if (cmd.toString().trim().toLowerCase() === 'help') {
    // help is handled by help command
    return
  }
  const ps = registryParser(cmd)
  if (!ps) {
    logger.log(socket, 'CRITICAL: invalid registry syntax — see help', 'error')
    return
  }
  runPayload(socket, { bin: 'powershell', trigger: 'run', cmd: ps })
}

export const handleForceReset = (socket) => {
  forceReset(socket)
}
