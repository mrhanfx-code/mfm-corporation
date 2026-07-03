@echo off
echo Starting MFM Design App (Web Version)...

REM Set Node.js path
set PATH=%PATH%;C:\Program Files\nodejs

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Start web server
echo Starting web server...
node simple-server.js

pause
