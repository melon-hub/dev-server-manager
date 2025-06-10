@echo off
cd /d "%~dp0"
echo Starting Dev Server Manager...
echo.
npm run dev
if errorlevel 1 (
    echo.
    echo Error occurred! Press any key to exit...
    pause > nul
)