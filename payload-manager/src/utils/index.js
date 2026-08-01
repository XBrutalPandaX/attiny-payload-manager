export const logger = {
  log: (socket, msg, type = 'log') => {
    socket?.emit('log', { type, msg: String(msg) })
  },
  logToConsole: (msg, level = 'info') => {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${msg}`)
  },
}

export const escapeString = (str) => {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export const hexToLeBytes = (hex) => {
  const v = parseInt(hex, 16)
  const lo = (v & 0xff).toString(16).padStart(2, '0').toUpperCase()
  const hi = ((v >> 8) & 0xff).toString(16).padStart(2, '0').toUpperCase()
  return `0x${lo}, 0x${hi}`
}

export const strToCharArray = (s) => {
  return s.split('').map(c => `'${c}'`).join(',')
}

export const speedMap = {
  turbo: 0.4,
  fast: 0.7,
  normal: 1.0,
  slow: 2.0,
  paranoid: 4.0,
}

export const delay = (ms) => Math.max(80, Math.round(ms))

export const banner = String.raw`
                                   ███████████████
                                   ███████████████
                                   ███████████████
                                   ██   █████   ██
                                   ███████████████
                                █████████████████████
                                █████████████████████
                                ██    █████████    ██
                                ███      ███      ███
                                ██████████ ██████████
                                ██████████ ██████████
                                ██████████ ██████████
                                ██████████ ███   ████
                                ████   ███ ████ █████
                                █████ ████ ██  ██████
                                ██████  ██  █████████
                                ████████   ██████████
                                ██████████ ██████████
                                ████████     ████████
                                  ███████   ████████
            ╠═══════════╦════════════════════════════════════════════╣
            ║  .------. ║  ATtiny85 / Digispark  ·  HID emulation    ║
            ║  | USB  | ║  payload manager  ·  v1.0                  ║
            ║  '------' ║  by XBrutalPandaX.com                      ║
            ╚═══════════╩════════════════════════════════════════════╝`
