@echo off
echo Starting MFM Design App...

REM Check if Node.js is installed
"C:\Program Files\nodejs\node.exe" --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    "C:\Program Files\nodejs\npm.cmd" install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start the application
echo Starting application...
"C:\Program Files\nodejs\npm.cmd" start

pause
