const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // File dialogs
    openFileDialog: () => ipcRenderer.invoke('dialog-open-file'),
    saveFileDialog: () => ipcRenderer.invoke('dialog-save-file'),
    exportFileDialog: () => ipcRenderer.invoke('dialog-export-file'),

    // File I/O
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),

    // Menu event listeners
    onMenuNew: (callback) => ipcRenderer.on('menu-new', callback),
    onMenuOpen: (callback) => ipcRenderer.on('menu-open', callback),
    onMenuSave: (callback) => ipcRenderer.on('menu-save', callback),
    onMenuExport: (callback) => ipcRenderer.on('menu-export', callback),
    onMenuZoomIn: (callback) => ipcRenderer.on('menu-zoom-in', callback),
    onMenuZoomOut: (callback) => ipcRenderer.on('menu-zoom-out', callback),
    onMenuZoomReset: (callback) => ipcRenderer.on('menu-zoom-reset', callback),
    onMenuGenerate: (callback) => ipcRenderer.on('menu-generate', callback),
    onMenuBrowse: (callback) => ipcRenderer.on('menu-browse', callback)
});
