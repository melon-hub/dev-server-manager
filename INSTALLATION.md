# Installation Guide

## Download Pre-built Releases

### For All Platforms
1. Go to the [Releases page](https://github.com/melon-hub/dev-server-manager/releases)
2. Download the appropriate installer for your platform
3. Follow the platform-specific instructions below

### macOS Installation
1. Download the `.dmg` file (e.g., `Dev-Server-Manager-1.7.4.dmg`)
2. Double-click the downloaded file
3. Drag the Dev Server Manager app to your Applications folder
4. Launch from Applications or Spotlight
5. If you see a security warning, go to System Preferences > Security & Privacy and click "Open Anyway"

### Windows Installation
1. Download the `.exe` installer (e.g., `Dev-Server-Manager-Setup-1.7.4.exe`)
2. Double-click the installer
3. Follow the installation wizard
4. Choose installation directory (default is recommended)
5. The app will create a desktop shortcut and start menu entry
6. Launch from desktop or start menu

### Linux Installation

#### AppImage (Recommended)
1. Download the `.AppImage` file (e.g., `Dev-Server-Manager-1.7.4.AppImage`)
2. Make it executable: `chmod +x Dev-Server-Manager-*.AppImage`
3. Run it: `./Dev-Server-Manager-*.AppImage`

#### Debian/Ubuntu (.deb)
1. Download the `.deb` file
2. Install using: `sudo dpkg -i dev-server-manager_*.deb`
3. Or double-click to install with Software Center
4. Launch from applications menu

#### Red Hat/Fedora (.rpm)
1. Download the `.rpm` file
2. Install using: `sudo rpm -i dev-server-manager-*.rpm`
3. Or double-click to install with Software Center
4. Launch from applications menu

## Requirements

- **Node.js**: Must be installed on your system
  - macOS: Install via [Homebrew](https://brew.sh/) with `brew install node` or download from [nodejs.org](https://nodejs.org/)
  - Windows: Download installer from [nodejs.org](https://nodejs.org/)
  - Linux: Use your package manager or download from [nodejs.org](https://nodejs.org/)

## Features by Platform

### macOS
- Menu bar integration with mini control window
- Native macOS look and feel
- Auto-start on login support

### Windows
- System tray integration
- Native Windows installer
- Auto-start with Windows support
- Desktop and Start Menu shortcuts

### Linux
- System tray integration (requires system tray support)
- Multiple package formats
- Desktop integration

## Building from Source

If you want to build the application yourself:

```bash
# Clone the repository
git clone https://github.com/melon-hub/dev-server-manager.git
cd dev-server-manager

# Install dependencies
npm install

# Build for your current platform
npm run dist

# Or build for specific platforms
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux

# Build for all platforms (requires appropriate build tools)
npm run dist:all
```

### Build Requirements

- **macOS**: Xcode Command Line Tools
- **Windows**: Visual Studio Build Tools or Visual Studio
- **Linux**: Various development packages (build-essential, etc.)

## Troubleshooting

### macOS
- If the app won't open, check System Preferences > Security & Privacy
- For "damaged app" errors, run: `xattr -cr /Applications/Dev\ Server\ Manager.app`

### Windows
- If npm is not found, ensure Node.js is in your PATH
- Run as administrator if you have permission issues

### Linux
- For AppImage on Ubuntu 22.04+, you may need: `sudo apt install libfuse2`
- Ensure you have a system tray for the tray icon to appear

## Auto-Updates

The application includes auto-update functionality. When a new version is available:
- You'll receive a notification
- Click to download and install the update
- The app will restart automatically

## Support

For issues or questions:
- Open an issue on [GitHub](https://github.com/melon-hub/dev-server-manager/issues)
- Check existing issues for solutions