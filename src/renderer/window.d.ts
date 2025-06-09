interface ElectronAPI {
  scanProjects: () => Promise<any[]>;
  selectDirectory: () => Promise<any>;
  startServer: (projectPath: string) => Promise<any>;
  stopServer: (projectPath: string) => Promise<any>;
  getServerStatus: () => Promise<any>;
  onConsoleOutput: (callback: (data: any) => void) => void;
  onServerClosed: (callback: (data: any) => void) => void;
  openMiniWindow: (project: any) => Promise<void>;
  closeMiniWindow: () => Promise<void>;
  openMainWindow: () => Promise<void>;
  onMiniProjectInit: (callback: (project: any) => void) => void;
  onMiniProjectUpdate: (callback: (project: any) => void) => void;
  getExternalServers: () => Promise<any[]>;
  killExternalServer: (port: number) => Promise<any>;
  refreshExternalServers: () => Promise<any[]>;
  onExternalServersUpdate: (callback: (servers: any[]) => void) => void;
  onUpdateAvailable: (callback: () => void) => void;
  restartApp: () => Promise<void>;
  toggleDebugDrawer: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}