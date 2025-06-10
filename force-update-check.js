// Force update check script
// Run this in the Dev Server Manager's developer console

// Check if we're in the main process
if (require('electron').remote) {
  // We're in renderer, send message to main
  require('electron').ipcRenderer.send('check-for-updates');
  console.log('Update check requested...');
} else {
  console.log('Run this in the app\'s developer console (Ctrl+Shift+I)');
}