# Backend Architecture

This is a modular Node.js/Express backend with Socket.IO for real-time communication.

## Directory Structure

```
src/
├── config/
│   └── index.js          # Configuration, paths, tool resolution
├── controllers/
│   ├── helpController.js      # Help command
│   └── payloadController.js   # Payload execution logic
├── services/
│   ├── commandBuilder.js      # Command wrapper builders
│   ├── compiler.js            # Arduino compilation + upload
│   ├── deviceProfile.js       # VID/PID spoofing profiles
│   └── sketchBuilder.js       # Arduino sketch generation
├── routes/
│   └── socketRoutes.js        # Socket.IO event handlers
├── utils/
│   └── index.js               # Shared utilities (logging, formatting)
└── server.js                  # Main app entry point
```

## Data Flow

1. **Client connects** → Socket.IO server (port 5000)
2. **Client emits event** (e.g., `run-payload`) with parameters
3. **Socket handler** routes to `payloadController`
4. **Controller** orchestrates services:
   - `commandBuilder` wraps the command
   - `sketchBuilder` generates `.ino` code
   - `deviceProfile` builds USB config (if spoofing)
   - `compiler` runs Arduino CLI and micronucleus
5. **Status updates** emitted back via `log` events
6. **Final result** triggers `status: upload complete` event

## Key Services

### config/index.js
- Resolves tool paths (`arduino-cli`, `micronucleus`)
- Defines working directories
- Handles platform-specific paths (Windows vs Unix)

### services/compiler.js
- Manages compilation state (busy flag, timeout)
- Spawns Arduino CLI subprocess
- Patches/restores library USB config for spoofing
- Watches upload completion with 60s timeout

### services/sketchBuilder.js
- Generates Arduino sketch from trigger type
- Scales delays by speed multiplier
- Supports 8 trigger types: run, search, explorer, startmenu, winx_ps, taskmanager, taskmanager_w11, custom

### services/deviceProfile.js
- Predefined VID/PID profiles (Logitech, Dell, HP, etc.)
- Custom VID/PID validation and formatting
- Generates `usbconfig.h` overlay

## Socket.IO Events

**Emit from client:**
- `run-payload` → Compile and flash command
- `run-sketch` → Flash raw code
- `preview-sketch` → Get `.ino` without flashing
- `run-registry` → Registry shorthand
- `force-reset` → Release lock
- `help` → Display reference

**Receive from server:**
- `log` → Status message with type (detail, build, upload, error, status, banner)
- `sketch-content` → Generated `.ino` file content

## Environment Variables

- `SERVER_PORT` — Server port (default: 5000)
- `NODE_ENV` — Environment (default: development)
- `ARDUINO_CLI` — Path to arduino-cli
- `MICRONUCLEUS` — Path to micronucleus

## Adding a New Trigger Type

1. Add case in `services/sketchBuilder.js:buildTriggerCode()`
2. Reference in `src/utils/index.js` and help text
3. Update documentation

## Extending the API

Add new socket events in `src/routes/socketRoutes.js`:

```javascript
socket.on('my-event', (data) => {
  // handle
})
```

Then create a controller or service for the logic.
