import { BrowserWindow, ipcMain, screen } from 'electron';
import * as path from 'path';

let miniWindow: BrowserWindow | null = null;

export function createMiniWindow(projectData: any) {
  if (miniWindow) {
    miniWindow.focus();
    miniWindow.webContents.send('update-project', projectData);
    return;
  }

  // Get the display where the cursor is
  const { x, y } = screen.getCursorScreenPoint();
  const currentDisplay = screen.getDisplayNearestPoint({ x, y });
  
  // Position in bottom-right corner of the screen
  const width = 300;
  const height = 160;
  const windowX = currentDisplay.bounds.x + currentDisplay.bounds.width - width - 20;
  const windowY = currentDisplay.bounds.y + currentDisplay.bounds.height - height - 60;

  miniWindow = new BrowserWindow({
    width,
    height,
    x: windowX,
    y: windowY,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: false,
    fullscreenable: false,
    minWidth: 250,
    minHeight: 140,
    maxWidth: 400,
    maxHeight: 250,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  miniWindow.loadFile(path.join(__dirname, 'renderer', 'mini.html'));
  
  miniWindow.webContents.on('did-finish-load', () => {
    miniWindow?.webContents.send('init-project', projectData);
  });

  miniWindow.on('closed', () => {
    miniWindow = null;
  });
}

export function closeMiniWindow() {
  if (miniWindow) {
    miniWindow.close();
    miniWindow = null;
  }
}

export function updateMiniWindow(projectData: any) {
  if (miniWindow) {
    miniWindow.webContents.send('update-project', projectData);
  }
}