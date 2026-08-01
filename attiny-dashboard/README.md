# 📊 Project Dashboard

A modern, responsive real-time analytics and management dashboard built with  **Vite** to configure, deploy, and manage BadUSB payloads on ATtiny-based microcontrollers (e.g., ATtiny85 / Digispark).
## Features
* Custom Binary & Target Selector: Dropdown selection for target executables (e.g., notepad.exe) and payload delivery vectors (e.g., c+s+e -> task mgr [w11]).
* Adjustable Execution Speed: Variable speed options (e.g., 4.0x paranoid, normal) to fine-tune keystroke injection timing.
* Target Hardware Profile Selection: Native support and profile selector for ATtiny85 / Digispark HID emulation devices.
* Integrated Arduino/AVR Compilation Engine: Background toolchain (avr-gcc / digistump-tiny) automatically compiles .ino sketches and checks library dependencies (like DigiKeyboard.h) directly inside the dashboard output log.

Interactive Command Line Shell: Command input box with history navigation (↑/↓) and quick execution support for custom commands (e.g., registry modifications using reg$).
## 💻 Getting Started
Follow these instructions to get a copy of the project up and running on your local machine.
### Prerequisites
Ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (comes bundled with Node) or `yarn` / `pnpm`
---

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git](https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git)
   cd YOUR-REPO-NAME
   ```
2. Install dependencies:
```Bash
npm install
Configure Environment Variables (Optional):
Create a .env file in the root directory if your WebSocket server connects to a custom address:
```
3. Start the development server:

```Bash
npm run dev
```
---
### Contributing
Contributions are welcome! Feel free to report issues or submit pull requests to improve the project
### License
Distributed under the MIT License. See LICENSE for more information.