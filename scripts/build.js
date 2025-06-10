const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building Dev Server Manager...');

// Run TypeScript compiler
try {
  console.log('Compiling TypeScript...');
  execSync('tsc', { stdio: 'inherit' });
} catch (e) {
  console.log('Main TypeScript compilation had errors (continuing...)');
}

try {
  console.log('Compiling renderer TypeScript...');
  execSync('tsc -p tsconfig.renderer.json', { stdio: 'inherit' });
} catch (e) {
  console.log('Renderer TypeScript compilation had errors (continuing...)');
}

// Copy HTML files
console.log('Copying HTML files...');
const srcDir = path.join(__dirname, '..', 'src', 'renderer');
const distDir = path.join(__dirname, '..', 'dist', 'renderer');

// Ensure dist/renderer exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy HTML files
const htmlFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.html'));
htmlFiles.forEach(file => {
  fs.copyFileSync(
    path.join(srcDir, file),
    path.join(distDir, file)
  );
  console.log(`  Copied ${file}`);
});

console.log('Build complete!');