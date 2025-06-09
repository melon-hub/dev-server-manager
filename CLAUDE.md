# Claude Development Guide for Dev Server Manager

## Project Overview
Dev Server Manager is an Electron app that helps manage development servers across multiple projects. It features project scanning, server management, external server detection, and a mini window mode.

## Update Process
To update and deploy changes to this app:

1. **Make your code changes**
2. **Update version number** in:
   - `package.json`
   - `src/renderer/index.html` (version display)
3. **Run the update script**:
   ```bash
   bash ~/update-dev-server.sh
   ```
   This script automatically:
   - Builds the app
   - Creates a DMG
   - Installs to /Applications
   - Prompts for restart if app is running

## Key Commands
- **Development**: `npm run dev`
- **Build only**: `npm run build`
- **Create DMG**: `npm run dist:mac`
- **Quick update**: `bash ~/update-dev-server.sh`

## Important Files
- **Main process**: `src/main.ts` - Electron main process, IPC handlers
- **Renderer**: `src/renderer/app.ts` - Main UI logic
- **Mini window**: `src/renderer/mini.ts` - Compact window functionality
- **Styles**: `src/renderer/index.html` - All CSS is inline here
- **Update script**: `~/update-dev-server.sh` - Local deployment script

## TypeScript Errors
The project has some TypeScript errors related to `window.electronAPI` that show during build but don't prevent the app from working. These can be safely ignored for now.

## Recent Features (v1.6.x)
- Enhanced UX with icons, animations, and consistent styling
- Console syntax highlighting and filtering
- External server detection and management
- Debug console toggle (DevTools in separate window)
- Improved restart functionality for macOS
- Copy buttons for URLs in console output
- Quick action buttons on project items

## Known Issues
- TypeScript errors during build (cosmetic only)
- Python dependency warning during build (doesn't affect functionality)
- Restart functionality required special handling for macOS apps in /Applications
  - Fixed in v1.6.6 with multiple fallback methods:
    1. Shell script approach (most reliable)
    2. Direct `open -a` command
    3. AppleScript activation
    4. Standard app.relaunch() as final fallback

## Development Tips
1. The app auto-detects updates by watching the file system
2. Console filters help debug specific types of output
3. The mini window provides a compact view for monitoring single projects
4. External servers are scanned every 10 seconds on ports 3000-3900
5. The app skips itself in the project list when running as an installed app

## Recommended Future Improvements
1. **Persistent State**: Save project list and last running state to survive app restarts
2. **Custom Port Configuration**: Allow users to specify custom ports for projects
3. **Environment Variables**: UI to set custom env vars per project
4. **Log History**: Save console output to files for later review
5. **Project Groups/Tags**: Organize projects into categories
6. **Global Hotkeys**: Quick access to start/stop servers without opening the app
7. **Performance Monitoring**: Show CPU/memory usage for running servers
8. **Multiple Server Support**: Some projects need multiple servers (frontend + backend)
9. **Terminal Integration**: Option to open project in terminal
10. **Build Commands**: Support for build/test/lint commands, not just dev servers
11. **Notifications**: System notifications when servers crash or start successfully
12. **Search/Filter**: Search projects by name or path
13. **Project Templates**: Quick-start new projects with templates
14. **Dark/Light Theme**: Theme toggle for user preference
15. **Export/Import Settings**: Backup and share project configurations