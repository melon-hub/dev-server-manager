# Dev Server Manager

A lightweight Electron app to manage development servers for your projects.

## 🚀 Quick Start

### Update the App
```bash
~/update-dev-server.sh
```

See [UPDATE_GUIDE.md](UPDATE_GUIDE.md) for detailed update instructions.

## Features

- **Auto-detect projects** - Scans your ~/Coding directory for Node.js projects
- **One-click server management** - Start, stop, and restart servers easily
- **Mini window mode** - Compact floating window for quick access
- **External server detection** - See all running Node.js servers on your system
- **Live console output** - View server logs in real-time
- **Running time tracking** - See how long your servers have been running

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Build and install: `~/update-dev-server.sh`

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run dist:mac

# Install to Applications
~/update-dev-server.sh
```

## Project Structure

```
src/
├── main.ts           # Main Electron process
├── preload.ts        # Preload script for IPC
├── mini.ts           # Mini window handler
└── renderer/         # UI components
    ├── app.ts        # Main window logic
    ├── mini.ts       # Mini window logic
    ├── index.html    # Main window UI
    └── mini.html     # Mini window UI
```

## Technologies

- **Electron** - Desktop app framework
- **TypeScript** - Type-safe development
- **electron-builder** - App packaging and distribution

## License

MIT