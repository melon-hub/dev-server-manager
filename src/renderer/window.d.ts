interface ElectronAPI {
  // Project management
  scanProjects: () => Promise<any[]>;
  selectDirectory: () => Promise<string | null>;
  
  // Server control
  startServer: (projectPath: string) => Promise<any>;
  stopServer: (projectPath: string) => Promise<any>;
  getServerStatus: () => Promise<any[]>;
  
  // Event listeners
  onConsoleOutput: (callback: (data: any) => void) => void;
  onServerClosed: (callback: (data: any) => void) => void;
  
  // Window control
  openMiniWindow: (project: any) => Promise<void>;
  closeMiniWindow: () => Promise<void>;
  openMainWindow: () => Promise<void>;
  onMiniProjectInit: (callback: (project: any) => void) => void;
  onMiniProjectUpdate: (callback: (project: any) => void) => void;
  
  // External servers
  getExternalServers: () => Promise<any[]>;
  killExternalServer: (port: number) => Promise<any>;
  refreshExternalServers: () => Promise<any[]>;
  onExternalServersUpdate: (callback: (servers: any[]) => void) => void;
  
  // Updates
  onUpdateAvailable: (callback: () => void) => void;
  restartApp: () => Promise<void>;
  
  // Utilities
  toggleDebugDrawer: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};