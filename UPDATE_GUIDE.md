# Dev Server Manager - Update Guide

## How to Update the App

This app uses a local build and install approach (no GitHub or npm publishing required).

### Quick Update Command
```bash
~/update-dev-server.sh
```

That's it! This script handles everything.

### What the Update Script Does

1. **Builds the app** - Compiles TypeScript and creates the Mac app bundle
2. **Installs to Applications** - Copies the new version to `/Applications`
3. **Handles running instances** - If the app is running, it will prompt to restart
4. **Version tracking** - Updates version file for auto-detection

### Manual Update Process

If you need to update manually:

```bash
# 1. Navigate to project
cd ~/Coding/dev-server-manager

# 2. Update version in package.json
# Edit package.json and bump the version number

# 3. Build the app
npm run dist:mac

# 4. Install to Applications
cp -r "release/mac-arm64/Dev Server Manager.app" /Applications/

# 5. Restart the app if it's running
```

### Version Management

1. **Before making changes**: Note current version in `package.json`
2. **After changes**: Bump version number following semantic versioning:
   - Major version (1.0.0 → 2.0.0): Breaking changes
   - Minor version (1.0.0 → 1.1.0): New features
   - Patch version (1.0.0 → 1.0.1): Bug fixes

### Development Workflow

```bash
# 1. Make your changes
# Edit files in src/

# 2. Test in development
npm run dev

# 3. When ready to deploy
~/update-dev-server.sh
```

### Troubleshooting

**App won't update?**
- Make sure the app is fully closed (check Activity Monitor)
- Try: `killall "Dev Server Manager"` then run update script

**Build fails?**
- Check TypeScript errors: `npx tsc --noEmit`
- Ensure dependencies are installed: `npm install`

**Can't find update script?**
- Recreate it: See `AUTO_UPDATE_SETUP.md` for the script contents

### Architecture Notes

- **Electron app** - Built with electron-builder
- **Local storage** - Settings saved in `~/Library/Application Support/dev-server-manager`
- **No cloud dependencies** - Everything runs locally
- **TypeScript + React** - For the UI components

### Future Considerations

If you want to add auto-updates later:
1. Set up a GitHub repository
2. Configure electron-updater with GitHub releases
3. The infrastructure is already in place in the code