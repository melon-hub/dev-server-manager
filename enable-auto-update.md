# Enable Auto-Updates for Dev Server Manager

## Quick Setup for GitHub Auto-Updates

1. **Ensure your repo is on GitHub**:
   ```bash
   git remote -v
   # Should show: https://github.com/melon-hub/dev-server-manager.git
   ```

2. **Build your release**:
   ```powershell
   cd C:\Users\Hoff\Desktop\Coding\dev-server-manager
   npm run dist:win
   ```

3. **Create a GitHub Release**:
   - Go to: https://github.com/melon-hub/dev-server-manager/releases
   - Click "Create a new release"
   - Tag: v2.0.1
   - Title: Dev Server Manager v2.0.1
   - Upload these files from your `release` folder:
     - `Dev Server Manager Setup 2.0.1.exe`
     - `latest.yml`
   - Publish release

4. **That's it!** Your app will now:
   - Check for updates every hour
   - Download updates automatically
   - Prompt to restart when ready

## How It Works

- When you install the app, it knows to check GitHub
- Every hour, it checks if a new version exists
- If found, it downloads in the background
- Shows a notification to restart
- Updates seamlessly!

## Testing Updates

1. Install current version (2.0.1)
2. Change version to 2.0.2 in package.json
3. Make a small change (like updating the UI text)
4. Build and create new GitHub release
5. Your installed app will update automatically!

## No More Manual Updates!

Once set up, you just:
1. Make changes
2. Bump version
3. Build & upload to GitHub
4. All users get the update automatically!