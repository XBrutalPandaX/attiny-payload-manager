# server — BAD-USB Payload Manager (Backend)

Express + Socket.io backend. Handles sketch generation, arduino-cli compilation, and micronucleus flashing.

## Stack

| | |
|---|---|
| Runtime | Node.js 18+ |
| HTTP | Express v5 |
| Realtime | socket.io v4 |
| Compiler | arduino-cli (external binary) |
| Flasher | micronucleus (external binary) |

## Install

```bash
npm install
```

## Run

```bash
# development (auto-restart on file change)
npm run dev

# production (serves built client too)
NODE_ENV=production npm start
```

Listens on port `5000` by default. Override with `SERVER_PORT=xxxx`.

## Tools required

Place these in `../tools/` (the `tools/` folder at the project root):

```
tools/
  arduino-cli.exe
  micronucleus.exe
```

Download commands (PowerShell):

```powershell
Invoke-WebRequest -UseBasicParsing "https://downloads.arduino.cc/arduino-cli/arduino-cli_latest_Windows_64bit.zip" -OutFile tmp.zip
Expand-Archive tmp.zip ..\tools\ -Force; Remove-Item tmp.zip

Invoke-WebRequest -UseBasicParsing "https://github.com/micronucleus/micronucleus/releases/download/2.6/micronucleus-2.6-win.exe" -OutFile ..\tools\micronucleus.exe
```

## Structure

```
server/
├── server.js     # Express + Socket.io — all backend logic
└── package.json
```

Build artifacts (`temp_sketch/`, `build_avr/`, `final/`) are written to the project root and are gitignored.
