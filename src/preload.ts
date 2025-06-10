import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  scanProjects: () => ipcRenderer.invoke('scan-projects'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  startServer: (projectPath: string) => ipcRenderer.invoke('start-server', projectPath),
  stopServer: (projectPath: string) => ipcRenderer.invoke('stop-server', projectPath),
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  
  onConsoleOutput: (callback: (data: any) => void) => {
    ipcRenderer.on('console-output', (event, data) => callback(data));
  },
  
  onServerClosed: (callback: (data: any) => void) => {
    ipcRenderer.on('server-closed', (event, data) => callback(data));
  },
  
  openMiniWindow: (project: any) => ipcRenderer.invoke('open-mini-window', project),
  closeMiniWindow: () => ipcRenderer.invoke('close-mini-window'),
  openMainWindow: () => ipcRenderer.invoke('open-main-window'),
  onMiniProjectInit: (callback: (project: any) => void) => ipcRenderer.on('init-project', (_, project) => callback(project)),
  onMiniProjectUpdate: (callback: (project: any) => void) => ipcRenderer.on('update-project', (_, project) => callback(project)),
  
  // External servers
  getExternalServers: () => ipcRenderer.invoke('get-external-servers'),
  killExternalServer: (port: number) => ipcRenderer.invoke('kill-external-server', port),
  refreshExternalServers: () => ipcRenderer.invoke('refresh-external-servers'),
  onExternalServersUpdate: (callback: (servers: any[]) => void) => {
    ipcRenderer.on('external-servers-update', (event, servers) => callback(servers));
  },
  
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', () => callback());
  },
  
  restartApp: () => ipcRenderer.invoke('restart-app'),
  toggleDebugDrawer: () => ipcRenderer.invoke('toggle-debug-drawer'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates')
});