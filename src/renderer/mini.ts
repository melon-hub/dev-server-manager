/// <reference path="./window.d.ts" />

interface MiniProject {
  id: string;
  name: string;
  path: string;
  type: string;
  status: 'running' | 'stopped';
  port: number | null;
}

class MiniController {
  private project: MiniProject | null = null;
  private startTime: Date | null = null;
  private timerInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.init();
  }
  
  init() {
    // Listen for project data
    window.electronAPI.onMiniProjectInit((project: MiniProject) => {
      this.project = project;
      this.updateUI();
    });
    
    window.electronAPI.onMiniProjectUpdate((project: MiniProject) => {
      this.project = project;
      this.updateUI();
    });
    
    // Set up controls
    document.getElementById('closeBtn')?.addEventListener('click', () => {
      window.electronAPI.closeMiniWindow();
    });
    
    document.getElementById('expandBtn')?.addEventListener('click', () => {
      window.electronAPI.openMainWindow();
      window.electronAPI.closeMiniWindow();
    });
    
    document.getElementById('startBtn')?.addEventListener('click', async () => {
      if (!this.project) return;
      await window.electronAPI.startServer(this.project.path);
    });
    
    document.getElementById('stopBtn')?.addEventListener('click', async () => {
      if (!this.project) return;
      await window.electronAPI.stopServer(this.project.path);
    });
    
    document.getElementById('restartBtn')?.addEventListener('click', async () => {
      if (!this.project || this.project.status === 'stopped') return;
      
      // Stop then start
      await window.electronAPI.stopServer(this.project.path);
      setTimeout(async () => {
        if (this.project) {
          await window.electronAPI.startServer(this.project.path);
        }
      }, 1000);
    });
  }
  
  updateUI() {
    if (!this.project) return;
    
    // Update project name
    const projectName = document.getElementById('projectName');
    if (projectName) {
      projectName.textContent = this.project.name;
    }
    
    // Update status
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const statusUrl = document.getElementById('statusUrl') as HTMLAnchorElement;
    const runningTime = document.getElementById('runningTime');
    
    if (statusDot) {
      statusDot.className = `status-dot ${this.project.status}`;
    }
    
    if (statusText && statusUrl) {
      if (this.project.status === 'running' && this.project.port) {
        statusText.textContent = 'Running on';
        statusUrl.href = `http://localhost:${this.project.port}`;
        statusUrl.textContent = `localhost:${this.project.port}`;
        statusUrl.style.display = 'inline';
        
        // Start timer if not already started
        if (!this.startTime) {
          this.startTime = new Date();
          this.startTimer();
        }
      } else {
        statusText.textContent = 'Stopped';
        statusUrl.style.display = 'none';
        
        // Stop timer
        this.stopTimer();
      }
    }
    
    // Update buttons
    const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
    const restartBtn = document.getElementById('restartBtn') as HTMLButtonElement;
    
    if (startBtn && stopBtn && restartBtn) {
      startBtn.disabled = this.project.status === 'running';
      stopBtn.disabled = this.project.status === 'stopped';
      restartBtn.disabled = this.project.status === 'stopped';
    }
  }
  
  private startTimer() {
    const runningTime = document.getElementById('runningTime');
    if (!runningTime) return;
    
    runningTime.style.display = 'block';
    
    // Update immediately
    this.updateRunningTime();
    
    // Update every second
    this.timerInterval = setInterval(() => {
      this.updateRunningTime();
    }, 1000);
  }
  
  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    this.startTime = null;
    
    const runningTime = document.getElementById('runningTime');
    if (runningTime) {
      runningTime.style.display = 'none';
    }
  }
  
  private updateRunningTime() {
    const runningTime = document.getElementById('runningTime');
    if (!runningTime || !this.startTime) return;
    
    const now = new Date();
    const diff = now.getTime() - this.startTime.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    let timeStr = 'Running for ';
    if (hours > 0) {
      timeStr += `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      timeStr += `${minutes}m ${seconds}s`;
    } else {
      timeStr += `${seconds}s`;
    }
    
    runningTime.textContent = timeStr;
  }
}

// Initialize
new MiniController();