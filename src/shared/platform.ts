import { app } from 'electron';
import * as path from 'path';
import * as os from 'os';

export const platform = {
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
  
  // Get platform-specific paths
  getNpmPath(): string[] {
    if (this.isWindows) {
      return [
        'C:\\Program Files\\nodejs\\npm.cmd',
        'C:\\Program Files (x86)\\nodejs\\npm.cmd',
        path.join(process.env.APPDATA || '', 'npm', 'npm.cmd'),
        path.join(process.env.ProgramFiles || '', 'nodejs', 'npm.cmd'),
        'npm.cmd',
        'npm'
      ];
    } else {
      return [
        '/usr/local/bin/npm',
        '/opt/homebrew/bin/npm',
        '/usr/bin/npm',
        '/opt/local/bin/npm',
        path.join(process.env.HOME || '', '.nvm/versions/node', 'current/bin/npm'),
        'npm'
      ];
    }
  },
  
  // Get platform-specific window options
  getWindowOptions(): Electron.BrowserWindowConstructorOptions {
    const baseOptions: Electron.BrowserWindowConstructorOptions = {
      width: 1000,
      height: 700,
      minWidth: 600,
      minHeight: 400,
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      },
      resizable: true,
      maximizable: true,
      fullscreenable: true,
      icon: this.getAppIcon()
    };
    
    // Add platform-specific options
    if (this.isMac) {
      return {
        ...baseOptions,
        titleBarStyle: 'hiddenInset',
        vibrancy: 'sidebar',
        backgroundColor: '#00000000'
      };
    } else if (this.isWindows) {
      return {
        ...baseOptions,
        frame: true,
        backgroundColor: '#ffffff'
      };
    } else {
      // Linux
      return {
        ...baseOptions,
        frame: true,
        backgroundColor: '#ffffff'
      };
    }
  },
  
  // Get application icon
  getAppIcon(): string | undefined {
    if (this.isMac) {
      return undefined; // macOS uses the app bundle icon
    } else if (this.isWindows) {
      return path.join(__dirname, '..', '..', 'assets', 'icon.ico');
    } else {
      return path.join(__dirname, '..', '..', 'assets', 'icon.png');
    }
  },
  
  // Get auto-start path
  getAutoStartPath(): string {
    const appPath = app.getPath('exe');
    
    if (this.isMac) {
      return appPath;
    } else if (this.isWindows) {
      return appPath;
    } else {
      // Linux - return the AppImage or executable path
      return appPath;
    }
  },
  
  // Platform-specific command execution
  executeCommand(command: string): string {
    if (this.isWindows) {
      return `cmd.exe /c ${command}`;
    } else {
      return command;
    }
  },
  
  // Get shell for spawning processes
  getShell(): string | boolean {
    if (this.isWindows) {
      return true; // Use default shell
    } else {
      return '/bin/bash';
    }
  },
  
  // Kill process by PID
  killProcess(pid: number): void {
    if (this.isWindows) {
      try {
        process.kill(pid, 'SIGTERM');
      } catch (error) {
        // Force kill if normal kill fails
        require('child_process').execSync(`taskkill /F /PID ${pid}`);
      }
    } else {
      try {
        process.kill(pid, 'SIGTERM');
      } catch (error) {
        // Force kill if normal kill fails
        process.kill(pid, 'SIGKILL');
      }
    }
  },
  
  // Get process info by port
  async getProcessByPort(port: number): Promise<{ pid: number; command: string } | null> {
    const { exec } = require('child_process');
    
    return new Promise((resolve) => {
      if (this.isWindows) {
        // Windows: Use netstat and wmic
        exec(`netstat -ano | findstr :${port}`, (error: any, stdout: string) => {
          if (error || !stdout) {
            resolve(null);
            return;
          }
          
          // Parse PID from netstat output
          const lines = stdout.trim().split('\n');
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parseInt(parts[parts.length - 1]);
            
            if (!isNaN(pid) && pid > 0) {
              // Get process name using wmic
              exec(`wmic process where ProcessId=${pid} get CommandLine /format:list`, (error2: any, stdout2: string) => {
                if (error2) {
                  resolve({ pid, command: 'Unknown' });
                  return;
                }
                
                const commandLine = stdout2.match(/CommandLine=(.*)/)?.[1] || 'Unknown';
                resolve({ pid, command: commandLine.trim() });
              });
              return;
            }
          }
          resolve(null);
        });
      } else {
        // Unix-like: Use lsof
        exec(`lsof -ti:${port}`, (error: any, stdout: string) => {
          if (error || !stdout.trim()) {
            resolve(null);
            return;
          }

          const pid = parseInt(stdout.trim());
          
          // Get full process command
          exec(`ps -p ${pid} -o args= | head -1`, (error2: any, stdout2: string) => {
            if (error2) {
              // Fallback to basic command
              exec(`ps -p ${pid} -o comm=`, (error3: any, stdout3: string) => {
                if (error3) {
                  resolve({ pid, command: 'Unknown' });
                } else {
                  resolve({ pid, command: stdout3.trim() });
                }
              });
              return;
            }

            resolve({ pid, command: stdout2.trim() });
          });
        });
      }
    });
  }
};