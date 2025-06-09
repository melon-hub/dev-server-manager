# Dev Server Manager

A cross-platform desktop application for managing development servers with ease. Start, stop, and monitor your Node.js development servers from a convenient interface.

## 🎯 Features

✅ **Cross-Platform** - Works on macOS, Windows, and Linux  
✅ **Easy Server Management** - Start, stop, and restart servers with one click  
✅ **Auto-Detection** - Automatically finds Node.js projects in your workspace  
✅ **External Server Monitoring** - See all running Node.js servers on your system  
✅ **Platform-Native UI** - Menu bar on macOS, system tray on Windows/Linux  
✅ **Live Logs** - View real-time console output from your servers  
✅ **Auto-Updates** - Stay up to date with automatic update notifications

## 🚀 Quick Install

Download the latest release for your platform:
- **[macOS](https://github.com/melon-hub/dev-server-manager/releases/latest)** - Download the `.dmg` file
- **[Windows](https://github.com/melon-hub/dev-server-manager/releases/latest)** - Download the `.exe` installer
- **[Linux](https://github.com/melon-hub/dev-server-manager/releases/latest)** - Download the `.AppImage`, `.deb`, or `.rpm` file

See [INSTALLATION.md](INSTALLATION.md) for detailed installation instructions.

## 📋 Requirements

- **Node.js** must be installed on your system
- **npm** (comes with Node.js)

## 🖥️ Platform-Specific Features

### macOS
- Menu bar app with mini control window
- Native macOS styling with vibrancy effects
- Keyboard shortcuts (Cmd+Q to quit)

### Windows
- System tray integration  
- Start menu and desktop shortcuts
- Run on Windows startup option

### Linux
- System tray integration
- Multiple package formats (AppImage, deb, rpm)
- Desktop environment integration

## 🛠️ Usage

1. **Launch the app** - It will appear in your menu bar (macOS) or system tray (Windows/Linux)
2. **Add projects** - Click "Select Folder" to add a Node.js project
3. **Start a server** - Click the play button next to any project
4. **View logs** - Click "Show Logs" to see console output
5. **Stop a server** - Click the stop button when done

### Supported npm Scripts
The app looks for these scripts in your `package.json`:
- `dev`
- `start`
- `server`

## 🔧 Development

```bash
# Clone the repository
git clone https://github.com/melon-hub/dev-server-manager.git
cd dev-server-manager

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for current platform
npm run dist

# Build for specific platforms
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

## 📦 Building from Source

See [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for detailed development instructions.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

Built with:
- [Electron](https://www.electronjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [electron-builder](https://www.electron.build/)
- [electron-updater](https://www.electron.build/auto-update)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/melon-hub/dev-server-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/melon-hub/dev-server-manager/discussions)