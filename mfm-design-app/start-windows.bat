@echo off
echo Starting MFM Design App...

REM Check if Electron exists
if not exist "electron\electron.exe" (
    echo Electron not found. Please run setup-windows.bat first.
    pause
    exit /b 1
)

REM Start the application
echo Starting MFM Design App...
electron\electron.exe .

pause
