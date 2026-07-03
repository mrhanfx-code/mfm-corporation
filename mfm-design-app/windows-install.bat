@echo off
echo Installing MFM Design App for Windows...

REM Check if Node.js is installed
"C:\Program Files\nodejs\node.exe" --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Set Node.js path
set PATH=%PATH%;C:\Program Files\nodejs

REM Install Electron with bypass for SSL
echo Installing Electron...
npm config set strict-ssl false
npm install electron@27.0.0 --no-optional --no-shrinkwrap --no-package-lock

if %errorlevel% neq 0 (
    echo Error: Failed to install Electron
    pause
    exit /b 1
)

REM Install electron-builder
echo Installing electron-builder...
npm install electron-builder@24.6.4 --no-optional --no-shrinkwrap --no-package-lock

if %errorlevel% neq 0 (
    echo Error: Failed to install electron-builder
    pause
    exit /b 1
)

echo Installation completed successfully!
echo.
echo To run the application:
echo   npm start
echo.
echo To build Windows installer:
echo   npm run build
echo.

pause
