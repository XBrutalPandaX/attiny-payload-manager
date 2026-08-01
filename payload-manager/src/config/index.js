import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const BASE = path.resolve(__dirname, '../../')

export const config = {
  port: process.env.SERVER_PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isWin: process.platform === 'win32',
  basePath: BASE,
  paths: {
    tools: path.join(BASE, 'tools'),
    sketch: path.join(BASE, 'temp_sketch'),
    avrBuild: path.join(BASE, 'build_avr'),
    final: path.join(BASE, 'final'),
    logs: path.join(BASE, 'logs'),
  },
  arduino: {
    arduino15: process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'Arduino15')
      : path.join(os.homedir(), 'AppData', 'Local', 'Arduino15'),
  },
}

// Resolve tool paths
const getToolPath = (envKey, toolName) => {
  if (process.env[envKey]) return process.env[envKey]
  const ext = config.isWin ? '.exe' : ''
  const inTools = path.join(config.paths.tools, toolName + ext)
  const inRoot = path.join(config.basePath, toolName + ext)
  return fs.existsSync(inTools) ? inTools : inRoot
}

export const tools = {
  arduino: getToolPath('ARDUINO_CLI', 'arduino-cli'),
  micronucleus: getToolPath('MICRONUCLEUS', 'micronucleus'),
}

export const digiLibrary = (() => {
  const digiBase = path.join(config.arduino.arduino15, 'packages', 'digistump', 'hardware', 'avr')
  const digiVer = (() => {
    try {
      return fs.readdirSync(digiBase).sort().pop()
    } catch (_) {
      return '1.7.5'
    }
  })()
  return {
    version: digiVer,
    usbConfig: path.join(digiBase, digiVer, 'libraries', 'DigisparkKeyboard', 'usbconfig.h'),
  }
})()
