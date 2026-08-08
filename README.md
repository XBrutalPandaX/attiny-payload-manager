<div align="center">
  <img src="docs/demo.gif" alt="Demo" width="720"/>
  <br/><br/>
  <img src="docs/logo.png" alt="BAD-USB Payload Manager" width="180"/>
</div>

> A web-based payload manager for **ATtiny85 / Digispark** HID keyboard emulators.
> Build, configure, and flash keystroke injection payloads through a terminal-style UI without the need for Arduino IDE .

---

## What It Does

- Type a command, pick a trigger and binary wrapper, hit Enter — compiles and flashes automatically
- Built-in preset library: recon, reverse shells, persistence, privilege escalation, exfil, and misc
- Adjustable per-character typing speed (0 ms → 1000 ms)
- Raw sketch mode — write DigiKeyboard.h code directly and upload it
- Registry shortcut — write Windows registry entries without typing the full PowerShell command
- Dark / light theme, command history, `.ino` preview before flashing
- VID/PID spoofing (in Dev) — enumerate as Logitech, Dell, HP, Lenovo, Cherry, SanDisk, or a custom ID
---

## Requirements

- [Node.js](https://nodejs.org) 18+
- `arduino-cli.exe`  placed in `tools/`
- `micronucleus.exe`  placed in `tools/`
- ATtiny85 / Digispark board

---

## Setup

### 1. Get the Tools

#### Windows

Download both binaries and drop them into the `tools/` folder.

**arduino-cli.exe v1.5.2** — from the [official Arduino CLI releases](https://github.com/arduino/arduino-cli/releases):

```powershell
Invoke-WebRequest -UseBasicParsing "https://github.com/arduino/arduino-cli/releases/download/v1.5.2-rc.1/arduino-cli_1.5.2-rc.1_Windows_64bit.zip" -OutFile tmp.zip
Expand-Archive tmp.zip tools\ -Force
Remove-Item tmp.zip
```

**micronucleus.exe** — from the [micronucleus releases page](https://github.com/micronucleus/micronucleus/releases), grab the Windows `.exe` and rename it to `micronucleus.exe`:

```powershell
Invoke-WebRequest -UseBasicParsing "https://github.com/micronucleus/micronucleus/releases/download/2.6/micronucleus-2.6-win.exe" -OutFile tools\micronucleus.exe
```

After this, your `tools/` folder should look like:

```
tools/
├── arduino-cli.exe
└── micronucleus.exe
```

#### Linux (Debian/Ubuntu)

**Arduino CLI:**

```bash
wget "https://github.com/arduino/arduino-cli/releases/download/v1.5.2-rc.1/arduino-cli_1.5.2-rc.1_Linux_64bit.tar.gz" -O tmp.tar.gz
tar -xvf tmp.tar.gz -C tools/ arduino-cli
rm tmp.tar.gz
```

**Micronucleus:**

```bash
wget "https://github.com/micronucleus/micronucleus/releases/download/v2.6/micronucleus-cli-master-882e7b4a-x86_64-Linux.zip" -O tmp.zip
unzip -j tmp.zip -d tools/
rm tmp.zip
```

#### Other Linux Distributions and macOS

> - **Arduino CLI:** [Arduino CLI Release v1.5.1](https://github.com/arduino/arduino-cli/releases#release-v1.5.1)
> - **Micronucleus:** [Micronucleus Releases v2.6](https://github.com/micronucleus/micronucleus/releases#release-v2.6)

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/XBrutalPandaX/attiny-payload-manager
cd attiny-payload-manager
npm install
```

### 3. Start the Server and UI

```bash
# Terminal 1 — Backend
cd payload-manager/src
node server.js

# Terminal 2 — Frontend (dev with Vite)
cd attiny-dashboard
npm run dev
```

Open `http://localhost:5173` in your browser.

> **Production:** `npm run build` then `NODE_ENV=production node server.js` — serves everything on port 5000.

---

## Usage

1. **Pick a binary wrapper** (`bin:`) — how the command is launched on the target
   - `powershell`, `powershell -bypass`, `powershell -hidden`, `cmd`, `certutil`, `mshta`, or custom

2. **Pick a trigger** (`via:`) — how the window opens on the target machine
   - `win+r`, `win+s`, `win+e`, `win+x`, `ctrl+shift+esc`

3. **Set typing speed** (`speed:`) — milliseconds delay per character
   - `0` = ATtiny85 maximum · `1000` = 1 character per second

4. **Optionally spoof VID/PID** (`usb:`) — still in development; makes the device enumerate as a known keyboard brand

5. **Type your command** and press Enter (or load a preset from the `presets.cfg` tab)

6. **Plug in the Digispark** when prompted — micronucleus waits for the device

---

## Presets

| Category | Payloads |
| --- | --- |
| `recon` | whoami/net, systeminfo dump, wifi passwords, process list |
| `shell` | PowerShell reverse shell, download-and-execute, certutil download |
| `persist` | HKCU run key, scheduled task (30 min), startup folder drop |
| `priv` | Disable Windows Defender, add local admin, enable RDP |
| `exfil` | Clipboard grab, browser credential paths, wifi profile export |
| `misc` | Open notepad, sleep test, popup, write desktop file, beep 3× |

---

## Notes

- The Digispark **must** be plugged in AFTER the flash prompt appears  not before
- VID/PID spoofing patches the DigiKeyboard library's `usbconfig.h` before compile and restores it after

- For educational and authorized penetration testing use only