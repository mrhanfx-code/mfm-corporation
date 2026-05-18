@echo off
cd /d "%~dp0"

REM Clear NODE_OPTIONS — Electron doesn't support --use-system-ca
set "NODE_OPTIONS="

REM Try Electron from local install first
if exist "electron\electron.exe" (
    start "" "electron\electron.exe" .
    exit /b 0
)

REM Try node_modules Electron
if exist "node_modules\electron\dist\electron.exe" (
    start "" "node_modules\electron\dist\electron.exe" .
    exit /b 0
)

REM Try npx as last resort
set "PATH=%PATH%;C:\Program Files\nodejs"
where npx >nul 2>&1
if %errorlevel% equ 0 (
    start "" npx electron .
    exit /b 0
)

echo ERROR: Electron not found.
echo Run setup-windows.bat or "npm install" first.
pause
exit /b 1
