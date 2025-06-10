@echo off
title Dev Server Manager
cd /d "%~dp0"

echo ========================================
echo    Dev Server Manager Launcher
echo ========================================
echo.

echo Checking for Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Checking for npm...
npm --version
if errorlevel 1 (
    echo ERROR: npm is not found!
    pause
    exit /b 1
)

echo.
echo Current directory: %cd%
echo.

echo Checking if node_modules exists...
if not exist "node_modules" (
    echo node_modules not found! Installing dependencies...
    npm install
)

echo.
echo Starting Dev Server Manager...
echo ========================================
npm run dev

echo.
echo ========================================
echo App closed or error occurred
echo ========================================
pause