const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const version = packageJson.version;

console.log(`Creating release for v${version}...`);

try {
  // Create release using gh CLI (it will use git credentials)
  const releaseCmd = `gh release create v${version} "release/Dev-Server-Manager-Setup-${version}.exe" "release/latest.yml" --title "v${version}" --notes "Auto-generated release for v${version}"`;
  
  console.log('Running:', releaseCmd);
  execSync(releaseCmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  
  console.log(`✅ Release v${version} created successfully!`);
} catch (error) {
  console.error('❌ Failed to create release:', error.message);
  process.exit(1);
}