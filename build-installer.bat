@echo off
echo ==========================================
echo   Dev Server Manager - Installer Builder
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Node.js installation...
call node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found

echo.
echo [2/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo ✓ Dependencies installed

echo.
echo [3/4] Building TypeScript...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo ✓ Build complete

echo.
echo [4/4] Creating Windows installer...
call npm run dist:win
if errorlevel 1 (
    echo ERROR: Installer creation failed!
    pause
    exit /b 1
)

echo.
echo ==========================================
echo ✓ SUCCESS! Installer created!
echo ==========================================
echo.
echo Your installer is located at:
echo %cd%\release\
echo.
echo Look for: Dev Server Manager Setup *.exe
echo.
pause