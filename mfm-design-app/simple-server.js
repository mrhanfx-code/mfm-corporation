const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle requests
    if (req.method === 'GET') {
        if (req.url === '/' || req.url === '/index.html') {
            serveFile(res, 'src/index.html', 'text/html');
        } else if (req.url.startsWith('/src/')) {
            const filePath = req.url.substring(1);
            const ext = path.extname(filePath);
            const contentType = getContentType(ext);
            serveFile(res, filePath, contentType);
        } else if (req.url === '/app.js') {
            serveFile(res, 'src/app.js', 'application/javascript');
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
    }
});

function serveFile(res, filePath, contentType) {
    const fullPath = path.join(__dirname, filePath);
    
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File Not Found');
            return;
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

function getContentType(ext) {
    const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
    };
    return contentTypes[ext] || 'text/plain';
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`MFM Design App running at http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});

// Open browser automatically
const { exec } = require('child_process');
const url = `http://localhost:${PORT}`;

if (process.platform === 'win32') {
    exec(`start ${url}`, (err) => {
        if (err) console.log('Could not open browser automatically');
    });
} else if (process.platform === 'darwin') {
    exec(`open ${url}`, (err) => {
        if (err) console.log('Could not open browser automatically');
    });
} else {
    exec(`xdg-open ${url}`, (err) => {
        if (err) console.log('Could not open browser automatically');
    });
}
