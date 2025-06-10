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

if not exist "release\Dev Server Manager Setup 2.0.2.exe" (
    echo ERROR: Installer not found! Build first with quick-update.bat
    pause
    exit /b 1
)

echo.
echo Creating release v2.0.2...
gh release create v2.0.2 ^
    --title "Dev Server Manager v2.0.2" ^
    --notes "## What's Changed\n\n### Bug Fixes\n- Fixed npm path double quote issue causing 'c:\program is not recognized' error\n- Properly clean npm path before using it in spawn command\n\n### Details\nThis release fixes a persistent issue where npm commands would fail due to extra quotes in the npm path on Windows systems.\n\n**Full Changelog**: https://github.com/melon-hub/dev-server-manager/compare/v2.0.1...v2.0.2" ^
    "release\Dev Server Manager Setup 2.0.2.exe" ^
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