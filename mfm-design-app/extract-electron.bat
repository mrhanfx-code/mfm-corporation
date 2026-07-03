@echo off
echo Extracting Electron...
powershell -command "Expand-Archive -Path 'C:\Users\DELL\Documents\GitHub\mfm-corporation\mfm-design-app\electron\electron.zip' -DestinationPath 'C:\Users\DELL\Documents\GitHub\mfm-corporation\mfm-design-app' -Force"
if %errorlevel% equ 0 (
    echo Extraction completed successfully!
) else (
    echo Extraction failed!
)
pause