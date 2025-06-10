const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const isWatchMode = process.argv.includes('--watch');

console.log(`Building Dev Server Manager... (Watch mode: ${isWatchMode})`);

function runTSC(args = '') {
  const command = `tsc ${args}`;
  console.log(`Executing: ${command}`);
  
  const child = exec(command);

  child.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  child.on('exit', (code) => {
    if (code !== 0 && !isWatchMode) {
      console.log(`tsc process exited with code ${code}`);
    }
  });

  return child;
}

// Run TypeScript compilers
runTSC(isWatchMode ? '-w' : '');
runTSC(isWatchMode ? '-p tsconfig.renderer.json -w' : '-p tsconfig.renderer.json');

// --- HTML file handling ---
const srcDir = path.join(__dirname, '..', 'src', 'renderer');
const distDir = path.join(__dirname, '..', 'dist', 'renderer');

function copyHtmlFiles() {
  console.log('Copying HTML files...');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  const htmlFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.html'));
  htmlFiles.forEach(file => {
    fs.copyFileSync(
      path.join(srcDir, file),
      path.join(distDir, file)
    );
    console.log(`  Copied ${file}`);
  });
}

// Initial copy
copyHtmlFiles();

if (isWatchMode) {
  console.log('Watching HTML files for changes...');
  const watcher = chokidar.watch(path.join(srcDir, '*.html'), {
    persistent: true,
  });

  watcher.on('change', (filePath) => {
    console.log(`HTML file changed: ${path.basename(filePath)}`);
    copyHtmlFiles();
  });
}

if (!isWatchMode) {
  console.log('Build complete!');
} else {
  console.log('Build process is now watching for changes...');
}