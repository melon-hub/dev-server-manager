# Dev Server Manager - Quick Start

## Current Version: 1.1.0

## 🚀 Quick Update Process

When you make changes and want to use the updated app:

```bash
# 1. Close the current app (if running)

# 2. Build the new version
npm run dist:mac

# 3. Install the updated app
cp -r "release/mac-arm64/Dev Server Manager.app" /Applications/

# 4. Open the new version
open /Applications/Dev\ Server\ Manager.app
```

## 📝 Before Each Release

1. Update version in `package.json` (e.g., 1.1.0 → 1.1.1)
2. Update version in `src/renderer/index.html` 
3. Build: `npm run dist:mac`

## 🔧 Development vs Production

**Development Mode** (for testing):
```bash
npm run dev
```
- Opens in a regular window
- Shows DevTools console
- Live reloads on changes

**Production Build** (for daily use):
```bash
npm run dist:mac
```
- Creates a real macOS app
- Smaller, faster, no dev tools
- Goes in your Applications folder

## 📍 Where Things Are

- **Your code**: `/Users/michaelhofstein/Coding/dev-server-manager/src/`
- **Built app**: `/Users/michaelhofstein/Coding/dev-server-manager/release/mac-arm64/`
- **Installed app**: `/Applications/Dev Server Manager.app`

## 🎯 Quick Tips

- Version appears at bottom of sidebar
- Check version to confirm update worked
- Always close old app before installing new one
- Use "Add Project" button if projects don't auto-detect