@echo off
echo ==========================================
echo   Creating GitHub Release
echo ==========================================
echo.

cd /d "%~dp0"

echo Checking for release files...
if not exist "release\latest.yml" (
    echo ERROR: latest.yml not found! Build first with quick-update.bat
    pause
    exit /b 1
)

if not exist "release\Dev Server Manager Setup 2.0.1.exe" (
    echo ERROR: Installer not found! Build first with quick-update.bat
    pause
    exit /b 1
)

echo.
echo Creating release v2.0.1...
gh release create v2.0.1 ^
    --title "Dev Server Manager v2.0.1" ^
    --notes "## What's New\n- Fixed npm path issues with spaces in Program Files\n- Added automatic update checking via GitHub\n- Fixed server startup errors\n- Better error handling\n- Cross-platform build support\n\n## Auto-Updates Now Enabled!\nThis version will automatically check for updates. Future updates will download and install automatically." ^
    "release\Dev Server Manager Setup 2.0.1.exe" ^
    "release\latest.yml"

if errorlevel 1 (
    echo.
    echo Failed to create release. Make sure you're authenticated with: gh auth login
    pause
    exit /b 1
)

echo.
echo ==========================================
echo ✓ Release created successfully!
echo ==========================================
echo.
echo Your app will now auto-update for all users!
echo.
pause