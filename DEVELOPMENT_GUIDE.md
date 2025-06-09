# Dev Server Manager - Development Guide

## Version Management

### Current Version: 1.1.0

### Version History
- **1.0.0** - Initial release with basic server management
- **1.1.0** - Added dark mode, manual project selection, better error handling

### How to Update Version
1. Update version in `package.json`
2. Update version in `src/renderer/index.html` 
3. Commit changes
4. Build new release

## Development Workflow

### 1. Making Changes
```bash
# Make your code changes
# Test in development mode
npm run dev

# When ready, commit
git add .
git commit -m "feat: describe your changes"
```

### 2. Building for Production
```bash
# Build the app
npm run dist:mac

# The app will be in:
# release/mac-arm64/Dev Server Manager.app
```

### 3. Installing/Updating the App

#### First Time Installation:
1. Build the app: `npm run dist:mac`
2. Find the app in `release/mac-arm64/`
3. Drag "Dev Server Manager.app" to your Applications folder
4. Right-click and select "Open" (first time only due to unsigned app)

#### Updating to New Version:
1. Close the running app (Cmd+Q)
2. Build new version: `npm run dist:mac`
3. Delete old app from Applications
4. Drag new app to Applications
5. Open the updated app

## Quick Commands

### Development
```bash
# Run in development mode (with live reload)
npm run dev

# Build TypeScript only
npm run build

# Start built app
npm start
```

### Production
```bash
# Build macOS app
npm run dist:mac

# Open built app directly
open "release/mac-arm64/Dev Server Manager.app"

# Copy to Applications (replaces existing)
cp -r "release/mac-arm64/Dev Server Manager.app" /Applications/
```

## File Structure
```
dev-server-manager/
├── src/
│   ├── main.ts           # Main process (server management)
│   ├── preload.ts        # Bridge between main and renderer
│   └── renderer/
│       ├── index.html    # UI layout
│       └── app.ts        # UI logic
├── dist/                 # Compiled TypeScript
├── release/              # Built applications
└── package.json          # Version and dependencies
```

## Adding New Features

### Example: Adding a new button
1. Add button in `src/renderer/index.html`
2. Add handler in `src/renderer/app.ts`
3. Add IPC handler in `src/main.ts` if needed
4. Update version number
5. Build and test

## Version Numbering Guide

- **Major (X.0.0)**: Big changes, new UI, breaking changes
- **Minor (1.X.0)**: New features, improvements
- **Patch (1.1.X)**: Bug fixes, small tweaks

Examples:
- Adding dark mode: 1.0.0 → 1.1.0
- Fixing a bug: 1.1.0 → 1.1.1
- Complete redesign: 1.1.0 → 2.0.0

## Troubleshooting

### App won't open
- Check Console.app for errors
- Try building with: `npm run build` first
- Delete `dist/` and `release/` folders and rebuild

### Changes not showing
- Make sure to run `npm run build` after changes
- For production, always rebuild with `npm run dist:mac`
- Clear the old app before installing new version

### "Unidentified Developer" warning
- Right-click the app and select "Open"
- Go to System Preferences > Security & Privacy
- Click "Open Anyway"

## Auto-Update (Future Enhancement)

To add auto-update later:
1. Set up a release server (GitHub Releases works)
2. Add electron-updater configuration
3. Sign the app with Apple Developer certificate
4. Configure update checking in main.ts