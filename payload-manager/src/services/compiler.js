import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { logger } from '../utils/index.js'
import { config, tools, digiLibrary } from '../config/index.js'

let busy = false
let uploadProcess = null
let lastBusyMs = 0

export const getCompilerState = () => ({
  busy,
  uploadProcess,
  lastBusyMs,
})

export const setCompilerState = (state) => {
  busy = state.busy ?? busy
  uploadProcess = state.uploadProcess ?? uploadProcess
  lastBusyMs = state.lastBusyMs ?? lastBusyMs
}

const restoreLibraryConfig = (libCfgBackup) => {
  if (libCfgBackup && fs.existsSync(libCfgBackup)) {
    try {
      fs.copyFileSync(libCfgBackup, digiLibrary.usbConfig)
      fs.unlinkSync(libCfgBackup)
    } catch (_) {}
  }
}

export const buildAndUpload = (socket, triggerCode, usbCfg = null) => {
  if (busy) {
    const now = Date.now()
    if (now - lastBusyMs > 3000) {
      lastBusyMs = now
      logger.log(socket, 'STATUS: device busy — click RESET to force release', 'status')
    }
    return
  }

  busy = true

  try {
    const { sketch, avrBuild, final } = config.paths
    const libCfgBackup = digiLibrary.usbConfig + '.bak'

    if (!fs.existsSync(sketch)) fs.mkdirSync(sketch, { recursive: true })
    if (!fs.existsSync(final)) fs.mkdirSync(final, { recursive: true })
    if (fs.existsSync(avrBuild)) fs.rmSync(avrBuild, { recursive: true, force: true })
    fs.mkdirSync(avrBuild)

    fs.writeFileSync(path.join(sketch, 'temp_sketch.ino'), triggerCode)

    let libPatched = false
    if (usbCfg) {
      try {
        fs.copyFileSync(digiLibrary.usbConfig, libCfgBackup)
        fs.writeFileSync(digiLibrary.usbConfig, usbCfg)
        libPatched = true
        logger.log(socket, 'DETAIL: library usbconfig.h patched — VID/PID spoofed', 'detail')
      } catch (e) {
        logger.log(socket, 'DETAIL: could not patch library usbconfig.h — using default VID/PID', 'detail')
      }
    }

    logger.log(socket, 'DETAIL: sketch written — compiling', 'detail')

    const compile = spawn(tools.arduino, [
      'compile',
      '--fqbn',
      'digistump:avr:digispark-tiny',
      sketch,
      '--build-path',
      avrBuild,
    ])

    compile.stdout.on('data', (d) => {
      const s = d.toString().trim()
      if (s) logger.log(socket, 'COMPILE: ' + s, 'build')
    })

    compile.stderr.on('data', (d) => {
      const s = d.toString().trim()
      if (s) logger.log(socket, 'BUILD LOG: ' + s, 'build')
    })

    compile.on('close', (exitCode) => {
      if (libPatched) restoreLibraryConfig(libCfgBackup)

      if (exitCode !== 0) {
        logger.log(socket, 'CRITICAL: compile failed (exit ' + exitCode + ')', 'error')
        busy = false
        return
      }

      const hexFile = fs.readdirSync(avrBuild).find((f) => f.endsWith('.hex'))
      if (!hexFile) {
        logger.log(socket, 'CRITICAL: no .hex produced', 'error')
        busy = false
        return
      }

      const finalHex = path.join(final, 'payload.hex')
      fs.copyFileSync(path.join(avrBuild, hexFile), finalHex)

      logger.log(socket, 'DETAIL: compile OK — plug in Digispark now', 'detail')

      const upload = spawn(tools.micronucleus, ['--run', '--timeout', '60', finalHex])
      uploadProcess = upload

      const timeout = setTimeout(() => {
        if (uploadProcess === upload) {
          logger.log(socket, 'STATUS: timeout after 60 s — device lock released', 'status')
          upload.kill()
          uploadProcess = null
          busy = false
        }
      }, 60000)

      upload.stdout.on('data', (d) => {
        const s = d.toString().trim()
        if (s) logger.log(socket, 'UPLOAD: ' + s, 'upload')
      })

      upload.stderr.on('data', (d) => {
        const s = d.toString().trim()
        if (s) logger.log(socket, 'UPLOAD LOG: ' + s, 'upload')
      })

      upload.on('close', () => {
        clearTimeout(timeout)
        if (uploadProcess === upload) uploadProcess = null
        logger.log(socket, 'STATUS: upload complete', 'status')
        busy = false
      })
    })
  } catch (e) {
    logger.log(socket, 'CRITICAL: ' + e.message, 'error')
    busy = false
  }
}

export const forceReset = (socket) => {
  if (uploadProcess) {
    uploadProcess.kill()
    uploadProcess = null
  }
  busy = false
  lastBusyMs = 0
  logger.log(socket, 'STATUS: device lock force-released', 'status')
}
