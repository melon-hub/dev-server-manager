@echo off
echo ==========================================
echo   Quick Update Builder
echo ==========================================
echo.
echo This will rebuild and update your installed app
echo.

cd /d "%~dp0"

echo [1/3] Building app...
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Creating new installer...
call npm run dist:win
if errorlevel 1 (
    echo Failed to create installer!
    pause
    exit /b 1
)

echo.
echo [3/3] Opening release folder...
start "" "%cd%\release"

echo.
echo ==========================================
echo ✓ New installer created!
echo ==========================================
echo.
echo To update:
echo 1. Run the new installer in the release folder
echo 2. It will update your existing installation
echo 3. Your app will prompt to restart
echo.
pause