const { app, BrowserWindow } = require('electron');

// Test the restart functionality
console.log('Testing Electron app restart...');
console.log('Current argv:', process.argv);

// Create a simple window
app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadURL('data:text/html,<h1>Restart Test</h1><button onclick="testRestart()">Test Restart</button><script>function testRestart() { require("electron").ipcRenderer.send("test-restart"); }</script>');

  // Handle restart request
  const { ipcMain } = require('electron');
  ipcMain.on('test-restart', () => {
    console.log('Restart requested...');
    app.relaunch();
    app.quit();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});