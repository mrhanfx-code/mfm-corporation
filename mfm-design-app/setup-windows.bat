@echo off
echo Setting up MFM Design App for Windows...

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

REM Download Electron directly
echo Downloading Electron...
node download-electron.js

if %errorlevel% neq 0 (
    echo Error: Failed to download Electron
    pause
    exit /b 1
)

echo.
echo Setup completed successfully!
echo.
echo To run the application:
echo   electron/electron.exe .
echo.
echo Or run:
echo   start-windows.bat
echo.

pause
