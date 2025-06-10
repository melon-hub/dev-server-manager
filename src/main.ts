import { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage } from 'electron';
import { spawn, ChildProcess, exec, execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { autoUpdater } from 'electron-updater';
import * as http from 'http';
import * as net from 'net';
import { createMiniWindow, closeMiniWindow, updateMiniWindow } from './mini';
import { platform } from './shared/platform';

interface ServerProcess {
  process: ChildProcess;
  projectPath: string;
  port: number;
  command: string;
  startTime: Date;
}

interface ExternalServer {
  port: number;
  pid: number;
  command: string;
  isExternal: true;
}

const activeServers = new Map<string, ServerProcess>();
const externalServers = new Map<number, ExternalServer>();

let mainWindow: BrowserWindow | null = null;
let npmPath: string | null = null;

// Find npm executable path
function findNpmPath(): string {
  const possiblePaths = platform.getNpmPath();

  // Try to find npm using 'which' or 'where' command
  try {
    const findCommand = platform.isWindows ? 'where npm' : 'which npm';
    const npmPathFromCommand = execSync(findCommand, { encoding: 'utf8' }).trim();
    if (npmPathFromCommand) {
      // On Windows, 'where' might return multiple paths, take the first one
      const firstPath = npmPathFromCommand.split('\n')[0].trim();
      if (fs.existsSync(firstPath)) {
        return firstPath;
      }
    }
  } catch (error) {
    console.log('Could not find npm using system command');
  }

  // Check common paths
  for (const npmPath of possiblePaths) {
    if (fs.existsSync(npmPath)) {
      return npmPath;
    }
  }

  // Last resort: try to find in PATH
  const pathSeparator = platform.isWindows ? ';' : ':';
  const pathDirs = (process.env.PATH || '').split(pathSeparator);
  for (const dir of pathDirs) {
    const npmName = platform.isWindows ? 'npm.cmd' : 'npm';
    const npmPath = path.join(dir, npmName);
    if (fs.existsSync(npmPath)) {
      return npmPath;
    }
  }

  throw new Error('npm not found. Please ensure Node.js is installed.');
}

let tray: Tray | null = null;

function createWindow() {
  const windowOptions = platform.getWindowOptions();
  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  // Don't open DevTools automatically
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create system tray for Windows/Linux
function createTray() {
  if (platform.isMac) {
    return; // Mac uses the mini window in menu bar instead
  }

  const iconPath = platform.getAppIcon();
  if (!iconPath) return;

  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Dev Server Manager');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createWindow();
    }
  });
}

app.whenReady().then(async () => {
  // Find npm path on startup
  try {
    npmPath = findNpmPath();
    console.log('Found npm at:', npmPath);
    
    // Test if npm actually works with a simple command
    try {
      const testCmd = platform.isWindows 
        ? `"${npmPath}" --version`
        : `${npmPath} --version`;
      const npmVersion = execSync(testCmd, { encoding: 'utf8' }).trim();
      console.log('npm version:', npmVersion);
    } catch (testError) {
      console.error('npm test failed:', testError);
      // Try to find npm in a different way on Windows
      if (platform.isWindows) {
        try {
          const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
          console.log('npm works with shell, version:', npmVersion);
          // Use 'npm' directly with shell: true
          npmPath = 'npm';
        } catch (e) {
          console.error('npm not accessible via shell either');
        }
      }
    }
  } catch (error) {
    console.error('Failed to find npm:', error);
    dialog.showErrorBox('npm not found', 'Could not find npm. Please ensure Node.js is installed.');
  }

  createWindow();
  
  // Create tray for Windows/Linux
  createTray();
  
  // Create mini window for macOS
  if (platform.isMac) {
    createMiniWindow(tray);
  }
  
  // Scan for external servers on startup
  await scanExternalServers();
  
  // Setup auto-updater for GitHub releases
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
    
    // Check for updates every hour
    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 60 * 60 * 1000);
    
    // Auto-updater events
    autoUpdater.on('update-available', () => {
      console.log('Update available');
      mainWindow?.webContents.send('update-available');
    });
    
    autoUpdater.on('update-downloaded', () => {
      console.log('Update downloaded');
      dialog.showMessageBox(mainWindow!, {
        type: 'info',
        title: 'Update Ready',
        message: 'A new version has been downloaded. Restart the app to apply the update.',
        buttons: ['Restart', 'Later']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });
  }
  
  // Also keep the manual update check (for dev/testing)
  watchForAppUpdates();
  checkForVersionFile();
  
  // Rescan external servers periodically
  setInterval(() => {
    scanExternalServers();
  }, 10000); // Every 10 seconds
});

let updateNotificationShown = false;

// Shared restart function
function restartApp() {
  console.log('Restarting app...');
  console.log('App path:', app.getPath('exe'));
  console.log('Is packaged:', app.isPackaged);
  
  if (app.isPackaged) {
    const appPath = app.getPath('exe');
    
    // Close all windows first
    BrowserWindow.getAllWindows().forEach(window => {
      window.close();
    });
    
    if (platform.isMac) {
      const appBundlePath = appPath.match(/^(.+\.app)\//)?.[1] || appPath;
      console.log('App bundle path:', appBundlePath);
      
      // Method 1: Shell script approach
      const scriptPath = path.join(app.getPath('temp'), 'restart-dev-server.sh');
      const script = `#!/bin/bash
sleep 1
open -a "${appBundlePath}"
rm -f "${scriptPath}"
`;
    
    try {
      fs.writeFileSync(scriptPath, script);
      fs.chmodSync(scriptPath, '755');
      exec(`"${scriptPath}" &`);
      setTimeout(() => app.exit(0), 100);
      return;
    } catch (error) {
      console.error('Shell script method failed:', error);
    }
    
      // Method 2: Direct open command (like your update script uses)
      exec(`(sleep 1 && open -a "Dev Server Manager") &`, (error) => {
        if (error) {
          console.error('Direct open method failed:', error);
          
          // Method 3: AppleScript
          const appName = app.getName();
          exec(`osascript -e 'delay 1' -e 'tell application "${appName}" to activate' &`, (error2) => {
            if (error2) {
              console.error('AppleScript method failed:', error2);
              app.relaunch();
            }
          });
        }
      });
      app.exit(0);
    } else if (platform.isWindows) {
      // Windows restart
      app.relaunch();
      app.quit();
    } else {
      // Linux restart
      app.relaunch();
      app.quit();
    }
  } else {
    // Not packaged - just relaunch
    app.relaunch();
    app.quit();
  }
}

function watchForAppUpdates() {
  const appPath = app.getPath('exe');
  const appDir = path.dirname(appPath);
  
  // For macOS, watch the .app bundle
  const watchPath = process.platform === 'darwin' ? 
    path.resolve(appDir, '..', '..', '..') : appDir;
  
  console.log('Watching for updates at:', watchPath);
  
  // Watch for changes to the app bundle
  fs.watchFile(watchPath, { interval: 5000 }, (curr, prev) => {
    if (curr.mtime > prev.mtime && !updateNotificationShown) {
      updateNotificationShown = true;
      
      // Show notification in renderer
      mainWindow?.webContents.send('update-available');
      
      // Also show dialog
      dialog.showMessageBox(mainWindow!, {
        type: 'info',
        title: 'Update Installed',
        message: 'A new version of Dev Server Manager has been installed.',
        detail: 'Please restart the app to use the new version.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0
      }).then(response => {
        if (response.response === 0) {
          restartApp();
        } else {
          updateNotificationShown = false; // Allow showing again later
        }
      });
    }
  });
  
  // Also check if running from Applications folder
  if (process.platform === 'darwin' && !appPath.includes('/Applications/')) {
    console.log('App not running from Applications folder');
  }
}

// Check initially
setTimeout(() => {
  checkForVersionFile();
}, 2000);

// Alternative: Check for updates using a version file
function checkForVersionFile() {
  const versionFilePath = path.join(app.getPath('userData'), '.update-version');
  const currentVersion = app.getVersion();
  
  // Watch for version file changes
  fs.watchFile(versionFilePath, { interval: 5000 }, () => {
    try {
      if (fs.existsSync(versionFilePath)) {
        const newVersion = fs.readFileSync(versionFilePath, 'utf-8').trim();
        if (newVersion !== currentVersion && !updateNotificationShown) {
          updateNotificationShown = true;
          
          dialog.showMessageBox(mainWindow!, {
            type: 'info',
            title: 'Update Available',
            message: `Version ${newVersion} is available (current: ${currentVersion})`,
            buttons: ['Restart Now', 'Later'],
            defaultId: 0
          }).then(response => {
            if (response.response === 0) {
              fs.unlinkSync(versionFilePath); // Clean up
              app.relaunch();
              app.exit();
            } else {
              updateNotificationShown = false;
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking version file:', error);
    }
  });
}

app.on('window-all-closed', () => {
  // Kill all active servers
  activeServers.forEach((server) => {
    server.process.kill();
  });
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: 'Select Project Directory'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const projectPath = result.filePaths[0];
    const projectName = path.basename(projectPath);
    const projectType = detectProjectType(projectPath);
    
    if (projectType) {
      return {
        id: projectPath,
        name: projectName,
        path: projectPath,
        type: projectType,
        status: activeServers.has(projectPath) ? 'running' : 'stopped',
        port: activeServers.get(projectPath)?.port || null
      };
    }
  }
  return null;
});

ipcMain.handle('scan-projects', async () => {
  // Check if running in WSL
  const isWSL = process.platform === 'linux' && fs.existsSync('/mnt/c');
  
  let scanDirs: string[];
  if (isWSL) {
    // WSL paths
    scanDirs = [
      '/mnt/c/Users/Hoff/Desktop/Coding',
      '/mnt/c/Users/Hoff/Coding',
      '/mnt/c/Users/Hoff/Projects',
      '/mnt/c/Users/Hoff/Desktop',
      '/mnt/c/Users/Hoff/Documents/Projects'
    ];
  } else {
    // Native Windows or Mac/Linux paths
    const homeDir = platform.isWindows ? (process.env.USERPROFILE || '') : (process.env.HOME || '');
    scanDirs = [
      path.join(homeDir, 'Desktop', 'Coding'),
      path.join(homeDir, 'Coding'),
      path.join(homeDir, 'Projects'),
      path.join(homeDir, 'Desktop'),
      path.join(homeDir, 'Documents/Projects')
    ];
  }

  console.log('Scanning directories:', scanDirs);
  const projects = [];

  for (const dir of scanDirs) {
    console.log(`Checking directory: ${dir}`);
    if (fs.existsSync(dir)) {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        console.log(`Found ${items.length} items in ${dir}`);
        
        for (const item of items) {
          if (item.isDirectory() && !item.name.startsWith('.')) {
            const projectPath = path.join(dir, item.name);
            
            // Skip the dev-server-manager if we're running as an installed app
            if (item.name === 'dev-server-manager' && app.isPackaged) {
              console.log('Skipping dev-server-manager (running as installed app)');
              continue;
            }
            
            // Skip directories we can't access
            try {
              fs.accessSync(projectPath, fs.constants.R_OK);
            } catch (error) {
              console.log(`Skipping inaccessible directory: ${projectPath}`);
              continue;
            }
            
            const projectType = detectProjectType(projectPath);
            console.log(`Project ${item.name}: type = ${projectType}`);
            
            if (projectType) {
              projects.push({
                id: projectPath,
                name: item.name,
                path: projectPath,
                type: projectType,
                status: activeServers.has(projectPath) ? 'running' : 'stopped',
                port: activeServers.get(projectPath)?.port || null
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning ${dir}:`, error);
      }
    } else {
      console.log(`Directory does not exist: ${dir}`);
    }
  }

  console.log(`Found ${projects.length} projects total`);
  return projects;
});

function detectProjectType(projectPath: string): string | null {
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    // Check for Next.js
    if (fs.existsSync(path.join(projectPath, 'next.config.js')) || 
        fs.existsSync(path.join(projectPath, 'next.config.ts')) ||
        packageJson.dependencies?.next) {
      return 'nextjs';
    }
    
    // Check for Vite
    if (packageJson.devDependencies?.vite || packageJson.dependencies?.vite) {
      return 'vite';
    }
    
    // Check for Create React App
    if (packageJson.dependencies?.['react-scripts']) {
      return 'react';
    }
    
    // Check for Vue
    if (packageJson.dependencies?.vue) {
      return 'vue';
    }
    
    // Check for Node.js API
    if (packageJson.scripts?.start && !packageJson.dependencies?.react) {
      return 'node';
    }
    
    // Check for any npm scripts
    if (packageJson.scripts?.dev || packageJson.scripts?.start) {
      return 'npm';
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

ipcMain.handle('start-server', async (event, projectPath: string) => {
  if (activeServers.has(projectPath)) {
    return { success: false, error: 'Server already running' };
  }

  try {
    const projectType = detectProjectType(projectPath);
    if (!projectType) {
      return { success: false, error: 'Unknown project type' };
    }

    const command = getStartCommand(projectType);
    const port = await findAvailablePort();
    const startTime = new Date();

    // Set environment variables with proper PATH
    const env = { 
      ...process.env, 
      PORT: port.toString(),
      PATH: `/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/opt/local/bin:${process.env.PATH || ''}`,
      // Force Next.js to use our chosen port
      NEXT_TELEMETRY_DISABLED: '1'
    };

    if (!npmPath) {
      return { success: false, error: 'npm not found' };
    }

    // On Windows, handle npm execution carefully
    let serverProcess: ChildProcess;
    
    if (platform.isWindows) {
      if (npmPath === 'npm') {
        // Use npm directly with shell when npmPath is just 'npm'
        serverProcess = spawn('npm', ['run', command], {
          cwd: projectPath,
          env,
          shell: true
        });
      } else {
        // Use cmd with quotes when npmPath contains a full path
        // Remove quotes from npmPath if they exist
        const cleanNpmPath = npmPath.replace(/^"|"$/g, '');
        serverProcess = spawn('cmd', ['/c', `"${cleanNpmPath}" run ${command}`], {
          cwd: projectPath,
          env,
          shell: false
        });
      }
    } else {
      serverProcess = spawn(npmPath, ['run', command], {
        cwd: projectPath,
        env,
        shell: platform.getShell()
      });
    }

    activeServers.set(projectPath, {
      process: serverProcess,
      projectPath,
      port,
      command,
      startTime
    });

    // Send console output to renderer
    if (serverProcess.stdout) {
      serverProcess.stdout.on('data', (data) => {
        mainWindow?.webContents.send('console-output', {
          projectPath,
          data: data.toString(),
          type: 'stdout'
        });
        
        // Update mini window with startTime
        updateMiniWindow({
          id: projectPath,
          path: projectPath,
          status: 'running' as const,
          port,
          name: path.basename(projectPath),
          type: projectType,
          startTime
        });
      });
    }

    if (serverProcess.stderr) {
      serverProcess.stderr.on('data', (data) => {
      const output = data.toString();
      mainWindow?.webContents.send('console-output', {
        projectPath,
        data: output,
        type: 'stderr'
      });
      
      // Check for port already in use error
      if (output.includes('EADDRINUSE') || output.includes('address already in use')) {
        console.error(`Port ${port} is already in use! Server failed to start.`);
        // Clean up the failed server
        activeServers.delete(projectPath);
        mainWindow?.webContents.send('server-closed', { projectPath, code: 1 });
      }
      });
    }

    serverProcess.on('close', (code) => {
      activeServers.delete(projectPath);
      mainWindow?.webContents.send('server-closed', { projectPath, code });
      
      // Update mini window
      updateMiniWindow({
        id: projectPath,
        path: projectPath,
        status: 'stopped' as const,
        port: null,
        name: path.basename(projectPath),
        type: detectProjectType(projectPath) || 'npm'
      });
    });

    return { success: true, port };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('stop-server', async (event, projectPath: string) => {
  const server = activeServers.get(projectPath);
  if (!server) {
    return { success: false, error: 'Server not running' };
  }

  try {
    server.process.kill();
    activeServers.delete(projectPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('get-server-status', async () => {
  const statuses: any[] = [];
  activeServers.forEach((server, projectPath) => {
    statuses.push({
      path: projectPath,
      running: true,
      port: server.port,
      command: server.command,
      startTime: server.startTime
    });
  });
  return statuses;
});

// Mini window handlers
ipcMain.handle('open-mini-window', (_, project) => {
  // Add startTime from active server if running
  const server = activeServers.get(project.path);
  if (server) {
    project.startTime = server.startTime;
  }
  createMiniWindow(project);
});

ipcMain.handle('close-mini-window', () => {
  closeMiniWindow();
});

ipcMain.handle('open-main-window', () => {
  mainWindow?.show();
  mainWindow?.focus();
});

ipcMain.handle('restart-app', async () => {
  restartApp();
});

ipcMain.handle('open-external', async (event, url: string) => {
  shell.openExternal(url);
});

// Toggle debug console
ipcMain.handle('toggle-debug-drawer', () => {
  if (mainWindow) {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools({ mode: 'undocked' });
    }
  }
});

function createDebugWindow() {
  if (!mainWindow) return;
  
  // Simply open the DevTools for the main window in undocked mode
  mainWindow.webContents.openDevTools({ mode: 'undocked' });
}

function getStartCommand(projectType: string): string {
  const commands: Record<string, string> = {
    nextjs: 'dev',
    vite: 'dev',
    react: 'start',
    vue: 'serve',
    node: 'start',
    npm: 'dev'
  };
  return commands[projectType] || 'start';
}

async function findAvailablePort(): Promise<number> {
  const ports = [3000, 3001, 3002, 4000, 5000, 5173, 8000, 8080];
  
  // Double-check port availability with a small delay
  for (const port of ports) {
    const isAvailable = await isPortAvailable(port);
    console.log(`Port ${port} available: ${isAvailable}`);
    
    if (isAvailable) {
      // Double-check after a small delay to ensure it's really available
      await new Promise(resolve => setTimeout(resolve, 100));
      if (await isPortAvailable(port)) {
        console.log(`Selected port ${port}`);
        return port;
      }
    }
  }
  
  // Find random port
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
  });
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // Port is definitely in use
        console.log(`Port ${port} check: EADDRINUSE - port is in use`);
        resolve(false);
      } else {
        // Other error, might still be usable
        console.log(`Port ${port} check: Error ${err.code} - treating as unavailable`);
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close(() => {
        // Port is available
        resolve(true);
      });
    });
    
    // Try both localhost and 0.0.0.0
    server.listen(port, '0.0.0.0');
  });
}

// Scan for external servers running on common ports
async function scanExternalServers() {
  console.log('Scanning for external servers...');
  
  // Only scan common dev server ports in the 3000-3999 range
  const commonPorts = [
    3000, 3001, 3002, 3003, 3004, 3005, // Common React/Node ports
    3010, 3020, 3030, 3040, 3050,       // Common alternates
    3100, 3200, 3300, 3333, 3456,       // Other common choices
    3500, 3600, 3700, 3800, 3900        // Round numbers
  ];
  const newExternalServers = new Map<number, ExternalServer>();

  for (const port of commonPorts) {
    const available = await isPortAvailable(port);
    
    if (!available) {
      // Port is in use, check if it's one of our managed servers
      let isManaged = false;
      activeServers.forEach((server) => {
        if (server.port === port) {
          isManaged = true;
          console.log(`Port ${port} is managed by Dev Server Manager`);
        }
      });

      if (!isManaged) {
        console.log(`Port ${port} is in use by external process`);
        // This is an external server
        try {
          const processInfo = await getProcessInfoByPort(port);
          if (processInfo) {
            // Filter out known non-dev server processes
            const isDevServer = isLikelyDevServer(processInfo.command);
            if (isDevServer) {
              newExternalServers.set(port, {
                port,
                pid: processInfo.pid,
                command: processInfo.command,
                isExternal: true
              });
            } else {
              console.log(`Skipping non-dev server on port ${port}: ${processInfo.command}`);
            }
          }
        } catch (error) {
          console.error(`Error getting process info for port ${port}:`, error);
        }
      }
    }
  }

  // Update the external servers map
  externalServers.clear();
  newExternalServers.forEach((server, port) => {
    externalServers.set(port, server);
  });

  console.log(`Found ${externalServers.size} external servers`);

  // Notify renderer about external servers
  if (mainWindow) {
    mainWindow.webContents.send('external-servers-update', Array.from(externalServers.values()));
  }
}

// Check if a process is likely a development server
function isLikelyDevServer(command: string): boolean {
  const devServerPatterns = [
    'node',
    'python',
    'ruby',
    'java',
    'php',
    'go',
    'cargo',
    'webpack',
    'vite',
    'next',
    'react',
    'vue',
    'angular',
    'django',
    'flask',
    'rails',
    'spring'
  ];
  
  const excludePatterns = [
    'Google Chrome',
    'Chrome Helper',
    'Safari',
    'Firefox',
    'Brave',
    'Edge',
    'Opera',
    'Vivaldi',
    'Chromium',
    'Electron', // Exclude other Electron apps
    'Slack',
    'Discord',
    'Spotify',
    'iTunes',
    'Music',
    'TV',
    'Finder'
  ];
  
  const lowerCommand = command.toLowerCase();
  
  // Check if it matches any exclude patterns first
  for (const pattern of excludePatterns) {
    if (command.includes(pattern)) {
      return false;
    }
  }
  
  // Check if it matches any dev server patterns
  for (const pattern of devServerPatterns) {
    if (lowerCommand.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

// Get process info by port (cross-platform)
async function getProcessInfoByPort(port: number): Promise<{ pid: number; command: string } | null> {
  return platform.getProcessByPort(port);
}

// IPC handler to get external servers
ipcMain.handle('get-external-servers', async () => {
  return Array.from(externalServers.values());
});

// IPC handler to kill external server
ipcMain.handle('kill-external-server', async (event, port: number) => {
  const server = externalServers.get(port);
  if (!server) {
    return { success: false, error: 'Server not found' };
  }

  try {
    console.log(`Attempting to kill process ${server.pid} on port ${port}`);
    
    // Use platform-specific kill
    platform.killProcess(server.pid);
    
    // Remove from map immediately
    externalServers.delete(port);
    
    // Notify renderer immediately
    if (mainWindow) {
      mainWindow.webContents.send('external-servers-update', Array.from(externalServers.values()));
    }
    
    // Rescan after a short delay
    setTimeout(() => scanExternalServers(), 3000);
    
    return { success: true };
  } catch (error) {
    console.error(`Failed to kill process ${server.pid}:`, error);
    // Try to rescan anyway
    setTimeout(() => scanExternalServers(), 1000);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// IPC handler to manually refresh external servers
ipcMain.handle('refresh-external-servers', async () => {
  console.log('Manual refresh of external servers requested');
  await scanExternalServers();
  return Array.from(externalServers.values());
});

// Handle manual update check
ipcMain.handle('check-for-updates', async () => {
  console.log('Manual update check requested');
  if (app.isPackaged) {
    const result = await autoUpdater.checkForUpdates();
    return result;
  }
  return null;
});

// Handle app window events
app.on('window-all-closed', () => {
  if (!platform.isMac) {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});