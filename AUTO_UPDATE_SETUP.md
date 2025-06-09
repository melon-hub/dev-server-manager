# Auto-Update Setup for Dev Server Manager

## How It Works

**Traditional Way** (what we have now):
1. Build app → Install manually → Close old → Install new → Repeat

**Auto-Update Way** (what you want):
1. Install app once → App checks for updates → Downloads & installs automatically

## Setting This Up

### Option 1: GitHub Releases (Free, Easy)
1. Push your code to GitHub
2. Create releases with version tags
3. App checks GitHub for new versions
4. Downloads and installs automatically

### Option 2: Local Update Server (For Personal Use)
1. Run a simple file server on your Mac
2. App checks local server for updates
3. Perfect for personal apps

## Quick Local Setup

### 1. Create update server folder:
```bash
mkdir ~/DevServerUpdates
```

### 2. Update package.json:
```json
"build": {
  "publish": [{
    "provider": "generic",
    "url": "http://localhost:8080"
  }]
}
```

### 3. Build and publish:
```bash
# Build app with update info
npm run dist:mac

# Copy update files to server
cp release/*.yml ~/DevServerUpdates/
cp release/*.zip ~/DevServerUpdates/
```

### 4. Start update server:
```bash
cd ~/DevServerUpdates
python3 -m http.server 8080
```

### 5. Install app once:
- Drag to Applications
- It will auto-update from now on!

## For Now - Simple Solution

Since you're learning, here's the easiest approach:

### 1. Install Helper Script:
```bash
# Create update script
cat > ~/update-dev-server.sh << 'EOF'
#!/bin/bash
cd ~/Coding/dev-server-manager
npm run dist:mac
cp -r "release/mac-arm64/Dev Server Manager.app" /Applications/
echo "✓ Updated to version $(grep version package.json | cut -d'"' -f4)"
EOF

chmod +x ~/update-dev-server.sh
```

### 2. Update app:
```bash
~/update-dev-server.sh
```

This gives you one command to update your app!