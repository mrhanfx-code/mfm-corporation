@echo off
echo Creating MFM Design App desktop shortcut...

set "APP_DIR=%~dp0"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT=%DESKTOP%\MFM Design App.lnk"
set "VBS_TEMP=%TEMP%\create_mfm_shortcut.vbs"

REM Create VBS script to generate .lnk shortcut
(
echo Set WshShell = WScript.CreateObject("WScript.Shell"^)
echo Set Shortcut = WshShell.CreateShortcut("%SHORTCUT%"^)
echo Shortcut.TargetPath = "%APP_DIR%launch.bat"
echo Shortcut.WorkingDirectory = "%APP_DIR%"
echo Shortcut.Description = "MFM Design App - Vector Design Tool"
echo Shortcut.WindowStyle = 7
echo If CreateObject("Scripting.FileSystemObject"^).FileExists("%APP_DIR%assets\icon.ico"^) Then
echo     Shortcut.IconLocation = "%APP_DIR%assets\icon.ico"
echo End If
echo Shortcut.Save
echo WScript.Echo "Shortcut created on Desktop!"
) > "%VBS_TEMP%"

cscript //nologo "%VBS_TEMP%"
del "%VBS_TEMP%"

echo.
echo Desktop shortcut created: %SHORTCUT%
echo.
pause
