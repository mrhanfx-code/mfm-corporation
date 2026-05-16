# MFM Design App - Installation Guide

## System Requirements

- Windows 10 or later
- Node.js 16.x or later
- npm 7.x or later
- 4GB RAM minimum
- 500MB free disk space

## Installation Steps

### 1. Install Node.js
Download and install Node.js from https://nodejs.org/
Choose the LTS version recommended for most users.

### 2. Install Dependencies
Open Command Prompt or PowerShell and navigate to the application directory:

```bash
cd C:\path\to\mfm-design-app
npm install
```

### 3. Run the Application
```bash
npm start
```

The application will launch in a new window.

## Building for Production

### Create Windows Installer
```bash
npm run build:win
```

This creates an installer in the `dist` folder.

### Create Portable Version
```bash
npm run build:portable
```

This creates a portable executable in the `dist` folder.

## Development Setup

### Install Development Dependencies
```bash
npm install --dev
```

### Run Development Mode
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

## Troubleshooting

### Node.js Not Found
Ensure Node.js is installed and added to PATH. Restart terminal after installation.

### Module Installation Errors
Try clearing npm cache:
```bash
npm cache clean --force
npm install
```

### Application Won't Start
Check that all dependencies are installed:
```bash
npm list
```

### Performance Issues
- Close unnecessary applications
- Ensure sufficient RAM is available
- Check for graphics driver updates

## File Locations

- **Application**: `C:\Users\[Username]\AppData\Local\Programs\mfm-design-app\`
- **User Data**: `C:\Users\[Username]\AppData\Roaming\mfm-design-app\`
- **Logs**: `C:\Users\[Username]\AppData\Roaming\mfm-design-app\logs\`

## Uninstallation

### Windows Installer Version
Use "Add or Remove Programs" in Windows Settings.

### Portable Version
Delete the application folder and user data directory.

## Support

For technical support, contact MFM Corporation or check the documentation at:
`C:\Users\[Username]\AppData\Roaming\mfm-design-app\docs\`
