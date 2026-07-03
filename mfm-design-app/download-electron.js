const https = require('https');
const fs = require('fs');
const path = require('path');

// Electron download URL
const ELECTRON_VERSION = '27.0.0';
const PLATFORM = 'win32';
const ARCH = 'x64';
const ELECTRON_URL = `https://github.com/electron/electron/releases/download/v${ELECTRON_VERSION}/electron-v${ELECTRON_VERSION}-${PLATFORM}-${ARCH}.zip`;

// Download function
function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filename);
        
        https.get(url, { rejectUnauthorized: false }, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirect
                const redirectUrl = response.headers.location;
                console.log(`Redirecting to: ${redirectUrl}`);
                downloadFile(redirectUrl, filename).then(resolve).catch(reject);
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${filename}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filename, () => {});
            reject(err);
        });
    });
}

// Main function
async function installElectron() {
    try {
        console.log('Downloading Electron...');
        
        // Create directories
        const electronDir = path.join(__dirname, 'electron');
        if (!fs.existsSync(electronDir)) {
            fs.mkdirSync(electronDir, { recursive: true });
        }
        
        // Download Electron
        const zipFile = path.join(electronDir, 'electron.zip');
        await downloadFile(ELECTRON_URL, zipFile);
        
        console.log('Electron downloaded successfully!');
        console.log('You can now run the application with: node electron/electron.exe .');
        
    } catch (error) {
        console.error('Failed to download Electron:', error.message);
        process.exit(1);
    }
}

installElectron();
