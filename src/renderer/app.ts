/// <reference path="./window.d.ts" />

interface Project {
  id: string;
  name: string;
  path: string;
  type: string;
  status: 'running' | 'stopped';
  port: number | null;
  startTime?: Date;
  lastRunTime?: Date;
}

interface ExternalServer {
  port: number;
  pid: number;
  command: string;
  isExternal: true;
}

class DevServerManager {
  private projects: Project[] = [];
  private externalServers: ExternalServer[] = [];
  private selectedProject: Project | null = null;
  private consoleOutput: Map<string, string[]> = new Map();
  private consoleFilter: 'all' | 'error' | 'warning' | 'info' = 'all';
  
  constructor() {
    this.init();
  }
  
  async init() {
    // Load projects
    await this.loadProjects();
    
    // Load external servers
    await this.loadExternalServers();
    
    // Set up event listeners
    window.electronAPI.onConsoleOutput((data) => {
      this.handleConsoleOutput(data);
    });
    
    window.electronAPI.onServerClosed((data) => {
      this.handleServerClosed(data);
    });
    
    window.electronAPI.onExternalServersUpdate((servers) => {
      this.externalServers = servers;
      this.renderExternalServers();
    });
    
    // Add project button
    document.getElementById('addProjectBtn')?.addEventListener('click', async () => {
      const project = await window.electronAPI.selectDirectory();
      if (project) {
        this.projects.push(project);
        this.renderProjectList();
      }
    });
    
    // Refresh external servers button
    document.getElementById('refreshExternalBtn')?.addEventListener('click', async () => {
      const btn = document.getElementById('refreshExternalBtn');
      if (btn) {
        btn.classList.add('spinning');
        try {
          this.externalServers = await window.electronAPI.refreshExternalServers();
          this.renderExternalServers();
        } catch (error) {
          console.error('Error refreshing external servers:', error);
        } finally {
          setTimeout(() => btn.classList.remove('spinning'), 500);
        }
      }
    });
    
    // Refresh projects every 5 seconds
    setInterval(() => this.refreshProjectStatuses(), 5000);
    
    // Listen for update notifications
    window.electronAPI.onUpdateAvailable(() => {
      this.showUpdateNotification();
    });
  }
  
  async loadProjects() {
    const projectList = document.getElementById('projectList')!;
    projectList.innerHTML = '<li class="loading">Scanning projects...</li>';
    
    try {
      this.projects = await window.electronAPI.scanProjects();
      console.log('Found projects:', this.projects);
      if (this.projects.length === 0) {
        projectList.innerHTML = '<li class="loading">No projects found. Click "Add Project" below.</li>';
      } else {
        this.renderProjectList();
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      projectList.innerHTML = '<li class="loading">Error loading projects</li>';
    }
  }
  
  async refreshProjectStatuses() {
    const statuses = await window.electronAPI.getServerStatus();
    
    this.projects.forEach(project => {
      const status = statuses[project.path];
      if (status) {
        project.status = 'running';
        project.port = status.port;
        if (status.startTime) {
          project.startTime = new Date(status.startTime);
        }
      } else {
        project.status = 'stopped';
        project.port = null;
        if (!project.startTime) {
          project.startTime = undefined;
        }
      }
    });
    
    this.renderProjectList();
    if (this.selectedProject) {
      this.updateStatusBar();
    }
  }
  
  renderProjectList() {
    const projectList = document.getElementById('projectList')!;
    projectList.innerHTML = '';
    
    this.projects.forEach(project => {
      const li = document.createElement('li');
      li.className = 'project-item';
      if (this.selectedProject?.id === project.id) {
        li.classList.add('selected');
      }
      
      // Get project icon based on type
      const getProjectIcon = (type: string) => {
        switch(type.toLowerCase()) {
          case 'nextjs': return 'N';
          case 'vite': return 'V';
          case 'react': return 'R';
          case 'npm': return 'JS';
          default: return type[0].toUpperCase();
        }
      };
      
      // Calculate uptime if running
      const getUptime = () => {
        if (project.status === 'running' && project.startTime) {
          const diff = Date.now() - new Date(project.startTime).getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          if (hours > 0) return `${hours}h ${minutes}m`;
          return `${minutes}m`;
        }
        return '';
      };
      
      li.innerHTML = `
        <div class="project-icon ${project.type.toLowerCase()}">${getProjectIcon(project.type)}</div>
        <div class="project-details">
          <div class="project-name">${project.name}</div>
          <div class="project-status">
            <span class="status-dot ${project.status}"></span>
            <span class="status-badge ${project.status}">
              ${project.status}
              ${project.port ? ` • ${project.port}` : ''}
            </span>
            ${project.status === 'running' ? `<span class="uptime">${getUptime()}</span>` : ''}
          </div>
        </div>
        <div class="quick-actions">
          ${project.status === 'stopped' ? 
            `<button class="quick-action-btn start" data-project-path="${project.path}" title="Start">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
              </svg>
            </button>` : 
            `<button class="quick-action-btn stop" data-project-path="${project.path}" title="Stop">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6h12v12H6z"></path>
              </svg>
            </button>`
          }
        </div>
      `;
      
      // Add click handlers
      li.onclick = (e) => {
        if (!(e.target as HTMLElement).closest('.quick-actions')) {
          this.selectProject(project);
        }
      };
      
      // Add quick action handlers
      const quickActionBtns = li.querySelectorAll('.quick-action-btn');
      quickActionBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const projectPath = (btn as HTMLElement).dataset.projectPath;
          if (projectPath) {
            if (btn.classList.contains('start')) {
              await this.quickStartServer(projectPath);
            } else if (btn.classList.contains('stop')) {
              await this.quickStopServer(projectPath);
            }
          }
        });
      });
      
      projectList.appendChild(li);
    });
  }
  
  async loadExternalServers() {
    try {
      this.externalServers = await window.electronAPI.getExternalServers();
      this.renderExternalServers();
    } catch (error) {
      console.error('Error loading external servers:', error);
    }
  }
  
  renderExternalServers() {
    const externalList = document.getElementById('externalServersList');
    if (!externalList) return;
    
    if (this.externalServers.length === 0) {
      externalList.innerHTML = '<li class="no-external-servers">No external servers detected</li>';
      return;
    }
    
    externalList.innerHTML = '';
    
    this.externalServers.forEach(server => {
      const li = document.createElement('li');
      li.className = 'external-server-item';
      
      // Extract app name from command path
      const getAppName = (command: string) => {
        // Try to extract app name from common patterns
        if (command.includes('Google Chrome')) return 'Chrome Helper';
        if (command.includes('node')) {
          // Extract script name if it's a node process
          const match = command.match(/node\s+([^\s]+)/);
          if (match && match[1]) {
            const scriptName = match[1].split('/').pop();
            return `Node: ${scriptName}`;
          }
          return 'Node.js';
        }
        if (command.includes('python')) return 'Python';
        if (command.includes('ruby')) return 'Ruby';
        if (command.includes('java')) return 'Java';
        // For other apps, try to extract the app name
        const appMatch = command.match(/Applications\/([^\/]+)\.app/);
        if (appMatch) return appMatch[1];
        // Default: show first part of command
        const parts = command.split(' ')[0].split('/');
        return parts[parts.length - 1];
      };
      
      li.innerHTML = `
        <div class="external-server-info">
          <div class="external-server-port">
            <strong>Port ${server.port}</strong>
            <span class="external-app-name">${getAppName(server.command)}</span>
          </div>
        </div>
        <button class="btn-kill" data-port="${server.port}" title="Kill server">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      `;
      
      const killBtn = li.querySelector('.btn-kill');
      killBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.killExternalServer(server.port);
      });
      
      externalList.appendChild(li);
    });
  }
  
  async killExternalServer(port: number) {
    const result = await window.electronAPI.killExternalServer(port);
    
    if (result.success) {
      this.addConsoleMessage(`Killed external server on port ${port}`, 'info');
      // Reload external servers
      await this.loadExternalServers();
    } else {
      this.addConsoleMessage(`Failed to kill server on port ${port}: ${result.error}`, 'error');
    }
  }
  
  selectProject(project: Project) {
    this.selectedProject = project;
    this.renderProjectList();
    this.renderMainContent();
  }
  
  renderMainContent() {
    if (!this.selectedProject) return;
    
    const mainContent = document.getElementById('mainContent')!;
    mainContent.innerHTML = `
      <div class="header">
        <div class="header-content">
          <div>
            <h1>${this.selectedProject.name}</h1>
            <div class="header-subtitle">${this.selectedProject.path}</div>
          </div>
          <div class="controls">
            <button class="btn btn-primary" id="startBtn" ${this.selectedProject.status === 'running' ? 'disabled' : ''}>
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Start Server
            </button>
            <button class="btn btn-danger" id="stopBtn" ${this.selectedProject.status === 'stopped' ? 'disabled' : ''}>
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
              </svg>
              Stop Server
            </button>
            <button class="btn btn-secondary" id="restartBtn" ${this.selectedProject.status === 'stopped' ? 'disabled' : ''}>
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Restart
            </button>
            <button class="btn btn-secondary" id="openBrowserBtn" ${this.selectedProject.status === 'stopped' ? 'disabled' : ''} title="Open in browser">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
              Open
            </button>
            <button class="btn btn-secondary" id="miniBtn" title="Open mini window">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              Mini
            </button>
            <button class="btn btn-secondary" id="debugBtn" title="Toggle debug console">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
              Debug
            </button>
          </div>
        </div>
      </div>
      <div class="status-bar">
        <div class="status-info">
          <div class="status-indicator ${this.selectedProject.status}"></div>
          <span id="statusText">
            ${this.selectedProject.status === 'running' 
              ? `<strong style="color: #10b981;">✓ Server is running</strong> • Open at <a href="http://localhost:${this.selectedProject.port}" class="status-url" target="_blank">localhost:${this.selectedProject.port}</a> • <span style="color: #666;">Click the link to view your app</span>` 
              : `<strong style="color: #ef4444;">✗ Server is stopped</strong> • <span style="color: #666;">Click "Start Server" to run your project</span>`}
          </span>
        </div>
        <div style="margin-left: auto; display: flex; align-items: center; gap: 16px;">
          <span style="color: #666;">Project Type: <strong style="color: #999;">${this.selectedProject.type.toUpperCase()}</strong></span>
        </div>
      </div>
      <div class="console-container">
        <div class="console-header">
          <div class="console-filter">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="error">Errors</button>
            <button class="filter-btn" data-filter="warning">Warnings</button>
            <button class="filter-btn" data-filter="info">Info</button>
          </div>
          <button class="btn btn-secondary" id="clearConsoleBtn" style="margin-left: auto; min-width: auto; height: 32px; padding: 0 16px;">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Clear
          </button>
        </div>
        <div class="console" id="console"></div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('startBtn')?.addEventListener('click', () => this.startServer());
    document.getElementById('stopBtn')?.addEventListener('click', () => this.stopServer());
    document.getElementById('restartBtn')?.addEventListener('click', () => this.restartServer());
    document.getElementById('openBrowserBtn')?.addEventListener('click', () => this.openInBrowser());
    document.getElementById('miniBtn')?.addEventListener('click', () => this.openMiniWindow());
    document.getElementById('debugBtn')?.addEventListener('click', () => this.toggleDebugDrawer());
    
    // Add console filter listeners
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const filter = target.dataset.filter as 'all' | 'error' | 'warning' | 'info';
        if (filter) {
          this.consoleFilter = filter;
          filterBtns.forEach(b => b.classList.remove('active'));
          target.classList.add('active');
          this.renderConsole();
        }
      });
    });
    
    // Clear console button
    document.getElementById('clearConsoleBtn')?.addEventListener('click', () => {
      if (this.selectedProject) {
        this.consoleOutput.set(this.selectedProject.path, []);
        this.renderConsole();
      }
    });
    
    // Render console output
    this.renderConsole();
  }
  
  updateStatusBar() {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('statusText');
    
    if (statusIndicator && statusText && this.selectedProject) {
      statusIndicator.className = `status-indicator ${this.selectedProject.status}`;
      statusText.innerHTML = this.selectedProject.status === 'running' 
        ? `Running on <a href="http://localhost:${this.selectedProject.port}" style="color: #007aff;">localhost:${this.selectedProject.port}</a>` 
        : 'Stopped';
    }
    
    // Update buttons
    const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
    const restartBtn = document.getElementById('restartBtn') as HTMLButtonElement;
    const openBrowserBtn = document.getElementById('openBrowserBtn') as HTMLButtonElement;
    
    if (startBtn && stopBtn && restartBtn && openBrowserBtn && this.selectedProject) {
      startBtn.disabled = this.selectedProject.status === 'running';
      stopBtn.disabled = this.selectedProject.status === 'stopped';
      restartBtn.disabled = this.selectedProject.status === 'stopped';
      openBrowserBtn.disabled = this.selectedProject.status === 'stopped';
    }
  }
  
  async startServer() {
    if (!this.selectedProject) return;
    
    const result = await window.electronAPI.startServer(this.selectedProject.path);
    
    if (result.success) {
      this.selectedProject.status = 'running';
      this.selectedProject.port = result.port;
      this.selectedProject.startTime = new Date();
      
      // Clear previous console output
      this.consoleOutput.set(this.selectedProject.path, []);
      
      this.renderProjectList();
      this.updateStatusBar();
      this.addConsoleMessage(`[INFO] Server started on port ${result.port}`, 'info');
      // Add some example messages to show filter functionality
      this.addConsoleMessage(`[INFO] Starting development server...`, 'info');
      this.addConsoleMessage(`[WARNING] Some packages may need updating`, 'warning');
    } else {
      this.addConsoleMessage(`[ERROR] Failed to start server: ${result.error}`, 'error');
    }
  }
  
  async quickStartServer(projectPath: string) {
    const project = this.projects.find(p => p.path === projectPath);
    if (!project) return;
    
    // Select the project to show details
    this.selectProject(project);
    
    const result = await window.electronAPI.startServer(projectPath);
    
    if (result.success) {
      project.status = 'running';
      project.port = result.port;
      project.startTime = new Date();
      
      // Clear previous console output
      this.consoleOutput.set(project.path, []);
      
      this.renderProjectList();
      this.updateStatusBar();
      this.addConsoleMessage(`[INFO] Server started on port ${result.port}`, 'info');
    } else {
      this.addConsoleMessage(`[ERROR] Failed to start server: ${result.error}`, 'error');
    }
  }
  
  async quickStopServer(projectPath: string) {
    const project = this.projects.find(p => p.path === projectPath);
    if (!project) return;
    
    // Select the project to show details
    this.selectProject(project);
    
    const result = await window.electronAPI.stopServer(projectPath);
    
    if (result.success) {
      project.status = 'stopped';
      project.port = null;
      project.lastRunTime = project.startTime;
      project.startTime = undefined;
      this.renderProjectList();
      this.updateStatusBar();
      this.addConsoleMessage('Server stopped', 'info');
    } else {
      this.addConsoleMessage(`Failed to stop server: ${result.error}`, 'error');
    }
  }
  
  async stopServer() {
    if (!this.selectedProject) return;
    
    const result = await window.electronAPI.stopServer(this.selectedProject.path);
    
    if (result.success) {
      this.selectedProject.status = 'stopped';
      this.selectedProject.port = null;
      this.renderProjectList();
      this.updateStatusBar();
      this.addConsoleMessage('Server stopped', 'info');
    } else {
      this.addConsoleMessage(`Failed to stop server: ${result.error}`, 'error');
    }
  }
  
  handleConsoleOutput(data: any) {
    const { projectPath, data: output, type } = data;
    
    if (!this.consoleOutput.has(projectPath)) {
      this.consoleOutput.set(projectPath, []);
    }
    
    const lines = output.split('\n').filter((line: string) => line.trim());
    this.consoleOutput.get(projectPath)!.push(...lines);
    
    // Keep only last 1000 lines
    const projectOutput = this.consoleOutput.get(projectPath)!;
    if (projectOutput.length > 1000) {
      projectOutput.splice(0, projectOutput.length - 1000);
    }
    
    if (this.selectedProject?.path === projectPath) {
      this.renderConsole();
    }
  }
  
  handleServerClosed(data: any) {
    const { projectPath, code } = data;
    
    const project = this.projects.find(p => p.path === projectPath);
    if (project) {
      project.status = 'stopped';
      project.port = null;
      
      if (this.selectedProject?.path === projectPath) {
        this.addConsoleMessage(`Server exited with code ${code}`, code === 0 ? 'info' : 'error');
        this.renderProjectList();
        this.updateStatusBar();
      }
    }
  }
  
  addConsoleMessage(message: string, type: 'info' | 'error') {
    if (!this.selectedProject) return;
    
    if (!this.consoleOutput.has(this.selectedProject.path)) {
      this.consoleOutput.set(this.selectedProject.path, []);
    }
    
    const timestamp = new Date().toLocaleTimeString();
    this.consoleOutput.get(this.selectedProject.path)!.push(`[${timestamp}] ${message}`);
    this.renderConsole();
  }
  
  async restartServer() {
    if (!this.selectedProject || this.selectedProject.status === 'stopped') return;
    
    this.addConsoleMessage('Restarting server...', 'info');
    
    // Stop the server
    await this.stopServer();
    
    // Wait a moment for the port to be released
    setTimeout(() => {
      this.startServer();
    }, 1000);
  }
  
  renderConsole() {
    const consoleEl = document.getElementById('console');
    if (!consoleEl || !this.selectedProject) return;
    
    const output = this.consoleOutput.get(this.selectedProject.path) || [];
    
    // Filter output based on active filter
    const filteredOutput = output.filter(line => {
      if (this.consoleFilter === 'all') return true;
      
      const lineType = this.getLineType(line);
      return lineType === this.consoleFilter;
    });
    
    consoleEl.innerHTML = filteredOutput
      .map(line => {
        let className = 'console-line';
        let formattedLine = this.escapeHtml(line);
        
        // Determine line type
        const lineType = this.getLineType(line);
        if (lineType) className += ` ${lineType}`;
        
        // Format timestamps
        const timestampMatch = formattedLine.match(/\[(\d{1,2}:\d{2}:\d{2})\]/);
        if (timestampMatch) {
          formattedLine = formattedLine.replace(
            timestampMatch[0], 
            `<span class="console-timestamp">${timestampMatch[0]}</span>`
          );
        }
        
        // Highlight URLs with copy button
        formattedLine = formattedLine.replace(
          /(https?:\/\/[^\s]+)/g,
          (match, url) => {
            const id = `url-${Math.random().toString(36).substr(2, 9)}`;
            return `<a href="#" class="console-url" data-url="${url}">${url}</a><button class="copy-btn" data-url="${url}" data-id="${id}" title="Copy URL">📋</button>`;
          }
        );
        
        // Highlight localhost URLs with copy button
        formattedLine = formattedLine.replace(
          /(localhost:\d+)/g,
          (match, url) => {
            const fullUrl = `http://${url}`;
            const id = `url-${Math.random().toString(36).substr(2, 9)}`;
            return `<a href="#" class="console-url" data-url="${fullUrl}">${url}</a><button class="copy-btn" data-url="${fullUrl}" data-id="${id}" title="Copy URL">📋</button>`;
          }
        );
        
        // Highlight port numbers
        formattedLine = formattedLine.replace(
          /port (\d+)/gi,
          'port <strong>$1</strong>'
        );
        
        return `<div class="${className}">${formattedLine}</div>`;
      })
      .join('');
    
    // Add event listeners for URLs and copy buttons
    const consoleUrls = consoleEl.querySelectorAll('.console-url');
    consoleUrls.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const url = (link as HTMLElement).dataset.url;
        if (url) {
          window.electronAPI.openExternal(url);
        }
      });
    });
    
    const copyBtns = consoleEl.querySelectorAll('.copy-btn');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = (btn as HTMLElement).dataset.url;
        const id = (btn as HTMLElement).dataset.id;
        if (url) {
          try {
            await navigator.clipboard.writeText(url);
            btn.textContent = '✓';
            btn.classList.add('copied');
            setTimeout(() => {
              btn.textContent = '📋';
              btn.classList.remove('copied');
            }, 2000);
          } catch (err) {
            console.error('Failed to copy:', err);
          }
        }
      });
    });
    
    // Auto-scroll to bottom
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }
  
  private getLineType(line: string): 'error' | 'warning' | 'success' | 'info' | null {
    if (line.includes('error') || line.includes('Error') || line.includes('ERR!') || line.includes('Failed')) {
      return 'error';
    } else if (line.includes('warning') || line.includes('warn') || line.includes('Warning')) {
      return 'warning';
    } else if (line.includes('success') || line.includes('started') || line.includes('ready') || line.includes('Server started')) {
      return 'success';
    } else if (line.includes('info') || line.includes('➜') || line.includes('Starting')) {
      return 'info';
    }
    return null;
  }
  
  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  openMiniWindow() {
    if (!this.selectedProject) return;
    window.electronAPI.openMiniWindow(this.selectedProject);
  }
  
  toggleDebugDrawer() {
    window.electronAPI.toggleDebugDrawer();
  }
  
  openInBrowser() {
    if (!this.selectedProject || this.selectedProject.status !== 'running' || !this.selectedProject.port) return;
    const url = `http://localhost:${this.selectedProject.port}`;
    window.electronAPI.openExternal(url);
  }
  
  showUpdateNotification() {
    // Create update notification bar
    const existingNotification = document.getElementById('updateNotification');
    if (existingNotification) return;
    
    const notification = document.createElement('div');
    notification.id = 'updateNotification';
    notification.style.cssText = `
      position: fixed;
      top: 38px;
      left: 0;
      right: 0;
      background: #3b82f6;
      color: white;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1000;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        <span>A new version of Dev Server Manager has been installed!</span>
      </div>
      <div style="display: flex; gap: 12px;">
        <button id="restartAppBtn" style="
          background: white;
          color: #3b82f6;
          border: none;
          padding: 6px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          font-size: 13px;
        ">Restart Now</button>
        <button onclick="document.getElementById('updateNotification').remove()" style="
          background: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 6px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          font-size: 13px;
        ">Later</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Adjust container margin
    const container = document.querySelector('.container') as HTMLElement;
    if (container) {
      container.style.marginTop = '50px';
    }
    
    // Add restart handler
    document.getElementById('restartAppBtn')?.addEventListener('click', () => {
      window.electronAPI.restartApp();
    });
  }
}

// Initialize the app
new DevServerManager();