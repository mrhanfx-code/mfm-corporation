@echo off
echo Final Setup for MFM Design App...

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

REM Extract Electron using built-in Windows tools
echo Extracting Electron...
powershell -Command "Expand-Archive -Path 'electron\electron.zip' -DestinationPath '.' -Force"

if %errorlevel% neq 0 (
    echo Error: Failed to extract Electron
    pause
    exit /b 1
)

REM Check if Electron was extracted
if not exist "electron.exe" (
    echo Error: Electron executable not found after extraction
    pause
    exit /b 1
)

echo.
echo Setup completed successfully!
echo.
echo To run the application:
echo   electron.exe .
echo.
echo Or simply run:
echo   start-app.bat
echo.

pause
