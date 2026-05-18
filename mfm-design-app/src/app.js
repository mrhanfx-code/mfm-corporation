const { ipcRenderer } = require('electron');
const AIParser = require('./ai-parser.js');
const PDFExporter = require('./pdf-export.js');
const AIGenerator = require('./ai-generator.js');
const DesignBrowser = require('./design-browser.js');
const TypographySystem = require('./typography.js');
const ProfessionalExport = require('./professional-export.js');
const PerformanceOptimizer = require('./performance-optimizer.js');
const KeyboardShortcuts = require('./keyboard-shortcuts.js');
const { FunctionSystem } = require('./function-system.js');

class DesignApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentTool = 'select';
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.selectedObject = null;
        this.layers = [{ id: 1, name: 'Layer 1', visible: true, objects: [] }];
        this.currentLayer = 0;
        this.clipboard = [];
        this.showGrid = false;
        this.showRulers = false;
        this.showGuides = false;
        this.guidesLocked = false;
        this._imageCache = new Map();
        this._renderPending = false;

        // P1: Undo/redo history
        this._history = [];
        this._historyIndex = -1;
        this._maxHistory = 50;

        // Module instances
        this.aiParser = new AIParser();
        this.pdfExporter = new PDFExporter();
        this.aiGenerator = new AIGenerator();
        this.designBrowser = new DesignBrowser();
        this.typography = new TypographySystem();
        this.professionalExport = new ProfessionalExport();
        this.performanceOptimizer = new PerformanceOptimizer();
        this.keyboardShortcuts = new KeyboardShortcuts(this);
        this.functionSystem = new FunctionSystem(this);

        this.init();
    }

    // P1: Single source of truth — objects live only in layers
    get objects() {
        const all = [];
        for (const layer of this.layers) {
            all.push(...layer.objects);
        }
        return all;
    }
    set objects(val) {
        // When bulk-setting, put everything in current layer
        this.layers[this.currentLayer].objects = val;
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupToolbar();
        this.setupProperties();
        this.setupAI();
        this.setupMenuHandlers();
        this._pushHistory();
        this.render();
    }

    setupCanvas() {
        this.resizeCanvas();
        this.performanceOptimizer.initialize(this.canvas);
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.render();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
    }

    setupToolbar() {
        document.querySelectorAll('.tool-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.tool-button').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                this.currentTool = button.dataset.tool;
                this.updateCursor();
            });
        });
    }

    setupProperties() {
        document.getElementById('fillColor').addEventListener('change', () => this.updateSelectedObject());
        document.getElementById('strokeColor').addEventListener('change', () => this.updateSelectedObject());
        document.getElementById('strokeWidth').addEventListener('change', () => this.updateSelectedObject());
        document.getElementById('opacity').addEventListener('change', () => this.updateSelectedObject());
    }

    setupAI() {
        document.getElementById('generateBtn').addEventListener('click', () => this.generateDesign());
        document.getElementById('searchBtn').addEventListener('click', () => this.searchDesigns());
        document.getElementById('applyStyleBtn').addEventListener('click', () => this.applyStyle());
    }

    setupMenuHandlers() {
        ipcRenderer.on('menu-new', () => this.newFile());
        ipcRenderer.on('menu-open', (event, filePath) => this.openFile(filePath));
        ipcRenderer.on('menu-save', () => this.saveFile());
        ipcRenderer.on('menu-export', (event, filePath) => this.exportFile(filePath));
        ipcRenderer.on('menu-zoom-in', () => this.zoomIn());
        ipcRenderer.on('menu-zoom-out', () => this.zoomOut());
        ipcRenderer.on('menu-zoom-reset', () => this.zoomReset());
        ipcRenderer.on('menu-generate', () => this.generateDesign());
        ipcRenderer.on('menu-browse', () => this.searchDesigns());
    }

    updateCursor() {
        const cursors = {
            select: 'default',
            rectangle: 'crosshair',
            ellipse: 'crosshair',
            line: 'crosshair',
            text: 'text',
            fill: 'crosshair'
        };
        this.canvas.style.cursor = cursors[this.currentTool] || 'default';
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - this.panX) / this.zoom,
            y: (e.clientY - rect.top - this.panY) / this.zoom
        };
    }

    onMouseDown(e) {
        const pos = this.getMousePos(e);
        this.isDrawing = true;
        this.startX = pos.x;
        this.startY = pos.y;

        if (this.currentTool === 'select') {
            this.selectObject(pos.x, pos.y);
        }
    }

    onMouseMove(e) {
        const pos = this.getMousePos(e);
        
        if (this.isDrawing) {
            if (this.currentTool === 'rectangle') {
                this.drawRectanglePreview(pos.x, pos.y);
            } else if (this.currentTool === 'ellipse') {
                this.drawEllipsePreview(pos.x, pos.y);
            } else if (this.currentTool === 'line') {
                this.drawLinePreview(pos.x, pos.y);
            } else if (this.currentTool === 'select' && this.selectedObject) {
                this.moveObject(pos.x, pos.y);
            }
        }
    }

    onMouseUp(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        this.isDrawing = false;

        if (this.currentTool === 'rectangle') {
            this.createRectangle(pos.x, pos.y);
        } else if (this.currentTool === 'ellipse') {
            this.createEllipse(pos.x, pos.y);
        } else if (this.currentTool === 'line') {
            this.createLine(pos.x, pos.y);
        } else if (this.currentTool === 'text') {
            this.createText(pos.x, pos.y);
        } else if (this.currentTool === 'fill') {
            this.fillArea(pos.x, pos.y);
        }
    }

    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom *= delta;
        this.zoom = Math.max(0.1, Math.min(5, this.zoom));
        this.updateZoomDisplay();
        this.render();
    }

    createRectangle(endX, endY) {
        const rect = {
            type: 'rectangle',
            x: Math.min(this.startX, endX),
            y: Math.min(this.startY, endY),
            width: Math.abs(endX - this.startX),
            height: Math.abs(endY - this.startY),
            fill: document.getElementById('fillColor').value,
            stroke: document.getElementById('strokeColor').value,
            strokeWidth: parseInt(document.getElementById('strokeWidth').value),
            opacity: parseInt(document.getElementById('opacity').value) / 100
        };
        
        this.layers[this.currentLayer].objects.push(rect);
        this._pushHistory();
        this.render();
    }

    createEllipse(endX, endY) {
        const centerX = (this.startX + endX) / 2;
        const centerY = (this.startY + endY) / 2;
        const radiusX = Math.abs(endX - this.startX) / 2;
        const radiusY = Math.abs(endY - this.startY) / 2;
        
        const ellipse = {
            type: 'ellipse',
            x: centerX,
            y: centerY,
            radiusX: radiusX,
            radiusY: radiusY,
            fill: document.getElementById('fillColor').value,
            stroke: document.getElementById('strokeColor').value,
            strokeWidth: parseInt(document.getElementById('strokeWidth').value),
            opacity: parseInt(document.getElementById('opacity').value) / 100
        };
        
        this.layers[this.currentLayer].objects.push(ellipse);
        this._pushHistory();
        this.render();
    }

    createLine(endX, endY) {
        const line = {
            type: 'line',
            x1: this.startX,
            y1: this.startY,
            x2: endX,
            y2: endY,
            stroke: document.getElementById('strokeColor').value,
            strokeWidth: parseInt(document.getElementById('strokeWidth').value),
            opacity: parseInt(document.getElementById('opacity').value) / 100
        };
        
        this.layers[this.currentLayer].objects.push(line);
        this._pushHistory();
        this.render();
    }

    createText(x, y) {
        const text = prompt('Enter text:');
        if (text) {
            const textObj = this.typography.createTextObject(text, x, y);
            textObj.fill = document.getElementById('fillColor').value;
            textObj.opacity = parseInt(document.getElementById('opacity').value) / 100;
            
            this.layers[this.currentLayer].objects.push(textObj);
            this._pushHistory();
            this.render();
        }
    }

    drawRectanglePreview(x, y) {
        this._renderNow();
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillStyle = document.getElementById('fillColor').value;
        this.ctx.strokeStyle = document.getElementById('strokeColor').value;
        this.ctx.lineWidth = parseInt(document.getElementById('strokeWidth').value);
        
        const width = x - this.startX;
        const height = y - this.startY;
        this.ctx.fillRect(this.startX, this.startY, width, height);
        this.ctx.strokeRect(this.startX, this.startY, width, height);
        this.ctx.restore();
    }

    drawEllipsePreview(x, y) {
        this._renderNow();
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillStyle = document.getElementById('fillColor').value;
        this.ctx.strokeStyle = document.getElementById('strokeColor').value;
        this.ctx.lineWidth = parseInt(document.getElementById('strokeWidth').value);
        
        const centerX = (this.startX + x) / 2;
        const centerY = (this.startY + y) / 2;
        const radiusX = Math.abs(x - this.startX) / 2;
        const radiusY = Math.abs(y - this.startY) / 2;
        
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawLinePreview(x, y) {
        this._renderNow();
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.globalAlpha = 0.5;
        this.ctx.strokeStyle = document.getElementById('strokeColor').value;
        this.ctx.lineWidth = parseInt(document.getElementById('strokeWidth').value);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.restore();
    }

    selectObject(x, y) {
        this.selectedObject = null;
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (this.isPointInObject(x, y, obj)) {
                this.selectedObject = obj;
                this.updatePropertiesPanel();
                break;
            }
        }
        this.render();
    }

    isPointInObject(x, y, obj) {
        if (obj.type === 'rectangle' || obj.type === 'textBox' || obj.type === 'image') {
            return x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height;
        } else if (obj.type === 'ellipse') {
            const dx = (x - obj.x) / obj.radiusX;
            const dy = (y - obj.y) / obj.radiusY;
            return dx * dx + dy * dy <= 1;
        } else if (obj.type === 'line') {
            const dist = this._pointToLineDistance(x, y, obj.x1, obj.y1, obj.x2, obj.y2);
            return dist < Math.max(5, (obj.strokeWidth || 1) + 3);
        } else if (obj.type === 'text') {
            const w = obj.maxWidth || (this.ctx.measureText(obj.text || '').width + 10);
            const h = obj.fontSize || parseInt(obj.font) || 16;
            return x >= obj.x && x <= obj.x + w && y >= obj.y - h && y <= obj.y;
        }
        return false;
    }

    _pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let t = lenSq !== 0 ? dot / lenSq : -1;
        t = Math.max(0, Math.min(1, t));
        const nearX = x1 + t * C;
        const nearY = y1 + t * D;
        return Math.sqrt((px - nearX) ** 2 + (py - nearY) ** 2);
    }

    moveObject(x, y) {
        if (this.selectedObject) {
            const dx = x - this.startX;
            const dy = y - this.startY;
            
            if (this.selectedObject.type === 'rectangle') {
                this.selectedObject.x += dx;
                this.selectedObject.y += dy;
            } else if (this.selectedObject.type === 'ellipse') {
                this.selectedObject.x += dx;
                this.selectedObject.y += dy;
            } else if (this.selectedObject.type === 'line') {
                this.selectedObject.x1 += dx;
                this.selectedObject.y1 += dy;
                this.selectedObject.x2 += dx;
                this.selectedObject.y2 += dy;
            } else if (this.selectedObject.type === 'text') {
                this.selectedObject.x += dx;
                this.selectedObject.y += dy;
            }
            
            this.startX = x;
            this.startY = y;
            this.render();
        }
    }

    updateSelectedObject() {
        if (this.selectedObject) {
            this.selectedObject.fill = document.getElementById('fillColor').value;
            this.selectedObject.stroke = document.getElementById('strokeColor').value;
            this.selectedObject.strokeWidth = parseInt(document.getElementById('strokeWidth').value);
            this.selectedObject.opacity = parseInt(document.getElementById('opacity').value) / 100;
            this.render();
        }
    }

    updatePropertiesPanel() {
        if (this.selectedObject) {
            document.getElementById('fillColor').value = this.selectedObject.fill || '#000000';
            document.getElementById('strokeColor').value = this.selectedObject.stroke || '#000000';
            document.getElementById('strokeWidth').value = this.selectedObject.strokeWidth || 1;
            document.getElementById('opacity').value = (this.selectedObject.opacity || 1) * 100;
        }
    }

    render() {
        if (this._renderPending) return;
        this._renderPending = true;
        requestAnimationFrame(() => {
            this._renderPending = false;
            this._doRender();
        });
    }

    _doRender() {
        const allObjects = this.objects;
        this.standardRender(allObjects);
    }

    _renderNow() {
        this._renderPending = false;
        this._doRender();
    }

    standardRender(objects) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Use the passed (optimized) objects list, respecting layer visibility
        for (const layer of this.layers) {
            if (!layer.visible) continue;
            for (const obj of layer.objects) {
                if (obj._hidden) continue;
                if (objects && !objects.includes(obj)) continue;
                this.drawObject(obj);
            }
        }
        
        if (this.selectedObject) {
            this.drawSelection(this.selectedObject);
        }
        
        this.ctx.restore();
    }

    drawObject(obj) {
        this.ctx.save();
        this.ctx.globalAlpha = obj.opacity || 1;
        
        if (obj.type === 'rectangle') {
            this.ctx.fillStyle = obj.fill;
            this.ctx.strokeStyle = obj.stroke;
            this.ctx.lineWidth = obj.strokeWidth;
            this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === 'ellipse') {
            this.ctx.fillStyle = obj.fill;
            this.ctx.strokeStyle = obj.stroke;
            this.ctx.lineWidth = obj.strokeWidth;
            this.ctx.beginPath();
            this.ctx.ellipse(obj.x, obj.y, obj.radiusX, obj.radiusY, 0, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
        } else if (obj.type === 'line') {
            this.ctx.strokeStyle = obj.stroke;
            this.ctx.lineWidth = obj.strokeWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(obj.x1, obj.y1);
            this.ctx.lineTo(obj.x2, obj.y2);
            this.ctx.stroke();
        } else if (obj.type === 'text') {
            this.typography.renderText(this.ctx, obj);
        } else if (obj.type === 'textBox') {
            this.renderTextBox(obj);
        } else if (obj.type === 'image') {
            this.drawImage(obj);
        }
        
        this.ctx.restore();
    }

    drawImage(obj) {
        let img = this._imageCache.get(obj.src);
        if (!img) {
            img = new Image();
            img.src = obj.src;
            this._imageCache.set(obj.src, img);
            img.onload = () => this.render();
            return;
        }
        if (!img.complete) return;
        this.ctx.save();
        this.ctx.globalAlpha = obj.opacity || 1;
        this.ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
        this.ctx.restore();
    }

    renderTextBox(obj) {
        this.ctx.save();
        this.ctx.globalAlpha = obj.opacity || 1;
        
        // Draw background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        
        // Draw border
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        
        // Render text inside box
        const textObj = {
            ...obj,
            x: obj.x + (obj.typography?.padding || 8),
            y: obj.y + (obj.typography?.padding || 8),
            maxWidth: obj.width - ((obj.typography?.padding || 8) * 2)
        };
        
        this.typography.renderText(this.ctx, textObj);
        this.ctx.restore();
    }

    drawSelection(obj) {
        this.ctx.save();
        this.ctx.strokeStyle = '#007acc';
        this.ctx.lineWidth = 2 / this.zoom;
        this.ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);
        
        if (obj.type === 'rectangle') {
            this.ctx.strokeRect(obj.x - 2, obj.y - 2, obj.width + 4, obj.height + 4);
        } else if (obj.type === 'ellipse') {
            this.ctx.beginPath();
            this.ctx.ellipse(obj.x, obj.y, obj.radiusX + 2, obj.radiusY + 2, 0, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    zoomIn() {
        this.zoom *= 1.2;
        this.zoom = Math.min(5, this.zoom);
        this.updateZoomDisplay();
        this.render();
    }

    zoomOut() {
        this.zoom *= 0.8;
        this.zoom = Math.max(0.1, this.zoom);
        this.updateZoomDisplay();
        this.render();
    }

    zoomReset() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateZoomDisplay();
        this.render();
    }

    updateZoomDisplay() {
        document.getElementById('zoomDisplay').textContent = Math.round(this.zoom * 100) + '%';
    }

    newFile() {
        if (confirm('Create new file? Unsaved changes will be lost.')) {
            this.layers = [{ id: 1, name: 'Layer 1', visible: true, objects: [] }];
            this.currentLayer = 0;
            this.selectedObject = null;
            this._history = [];
            this._historyIndex = -1;
            this._pushHistory();
            this._updateLayersPanel();
            this.render();
        }
    }

    async openFile(filePath) {
        try {
            // Check if it's an .ai file
            if (filePath.toLowerCase().endsWith('.ai')) {
                await this.openAIFile(filePath);
            } else {
                // Open as JSON format
                const content = await ipcRenderer.invoke('read-file', filePath);
                const data = JSON.parse(content);
                this.objects = data.objects || [];
                this.layers = data.layers || [{ id: 1, name: 'Layer 1', visible: true, objects: [] }];
                this.render();
            }
        } catch (error) {
            alert('Error opening file: ' + error.message);
        }
    }

    async openAIFile(filePath) {
        try {
            const aiData = await this.aiParser.parseFile(filePath);
            const convertedObjects = this.aiParser.convertToAppObjects(aiData.objects);
            
            this.objects = convertedObjects;
            this.layers = [{
                id: 1,
                name: 'Imported from AI',
                visible: true,
                objects: convertedObjects
            }];
            
            // Adjust canvas size to artboard if needed
            if (aiData.artboard) {
                this.canvas.width = Math.max(800, aiData.artboard.width);
                this.canvas.height = Math.max(600, aiData.artboard.height);
            }
            
            this.render();
            alert(`Successfully imported .ai file (${aiData.format}, version ${aiData.version})`);
        } catch (error) {
            alert('Error importing .ai file: ' + error.message);
        }
    }

    async saveFile() {
        try {
            const data = {
                objects: this.objects,
                layers: this.layers
            };
            const content = JSON.stringify(data, null, 2);
            await ipcRenderer.invoke('write-file', 'design.json', content);
            alert('File saved successfully');
        } catch (error) {
            alert('Error saving file: ' + error.message);
        }
    }

    async exportFile(filePath) {
        const extension = filePath.split('.').pop().toLowerCase();
        
        if (extension === 'svg') {
            await this.exportSVG(filePath);
        } else if (extension === 'png') {
            await this.exportPNG(filePath);
        } else if (extension === 'pdf') {
            await this.exportPDF(filePath);
        } else if (extension === 'jpg' || extension === 'jpeg') {
            await this.exportJPEG(filePath);
        } else {
            alert('Unsupported export format');
        }
    }

    async exportSVG(filePath) {
        let svg = '<?xml version="1.0" encoding="UTF-8"?>\n';
        svg += '<svg xmlns="http://www.w3.org/2000/svg" ';
        svg += `width="${this.canvas.width}" height="${this.canvas.height}" `;
        svg += 'viewBox="0 0 ' + this.canvas.width + ' ' + this.canvas.height + '">\n';
        
        // Add background
        svg += '  <rect width="100%" height="100%" fill="white"/>\n';
        
        // Add definitions for gradients and patterns
        svg += '  <defs>\n';
        svg += '  </defs>\n';
        
        // Export objects in reverse order for proper layering
        for (const obj of this.objects) {
            svg += this.objectToSVG(obj);
        }
        
        svg += '</svg>';
        await ipcRenderer.invoke('write-file', filePath, svg);
        alert('SVG exported successfully');
    }

    objectToSVG(obj) {
        let svg = '';
        const opacity = obj.opacity || 1;
        const strokeWidth = obj.strokeWidth || 1;
        
        switch (obj.type) {
            case 'rectangle':
                svg += `  <rect x="${obj.x}" y="${obj.y}" width="${obj.width}" height="${obj.height}" `;
                svg += `fill="${obj.fill || 'none'}" stroke="${obj.stroke || 'none'}" stroke-width="${strokeWidth}" opacity="${opacity}" />\n`;
                break;
                
            case 'ellipse':
                svg += `  <ellipse cx="${obj.x}" cy="${obj.y}" rx="${obj.radiusX}" ry="${obj.radiusY}" `;
                svg += `fill="${obj.fill || 'none'}" stroke="${obj.stroke || 'none'}" stroke-width="${strokeWidth}" opacity="${opacity}" />\n`;
                break;
                
            case 'line':
                svg += `  <line x1="${obj.x1}" y1="${obj.y1}" x2="${obj.x2}" y2="${obj.y2}" `;
                svg += `stroke="${obj.stroke || 'black'}" stroke-width="${strokeWidth}" opacity="${opacity}" />\n`;
                break;
                
            case 'text':
                svg += `  <text x="${obj.x}" y="${obj.y}" fill="${obj.fill || 'black'}" opacity="${opacity}" `;
                svg += `font-family="${obj.font ? obj.font.split('px').pop().trim() : 'Arial'}" `;
                svg += `font-size="${obj.font ? parseInt(obj.font) : 16}">${obj.text}</text>\n`;
                break;
                
            case 'path':
                if (obj.points && obj.points.length >= 4) {
                    svg += `  <path d="M ${obj.points[0]} ${obj.points[1]} `;
                    for (let i = 2; i < obj.points.length - 1; i += 2) {
                        svg += `L ${obj.points[i]} ${obj.points[i + 1]} `;
                    }
                    svg += `" fill="${obj.fill || 'none'}" stroke="${obj.stroke || 'none'}" stroke-width="${strokeWidth}" opacity="${opacity}" />\n`;
                }
                break;
        }
        
        return svg;
    }

    async exportPNG(filePath) {
        try {
            await this.professionalExport.exportPNGAdvanced(this.objects, this.canvas, filePath, {
                quality: 90,
                resolution: 72,
                backgroundColor: 'transparent'
            });
            alert('PNG exported successfully');
        } catch (error) {
            alert('Error exporting PNG: ' + error.message);
        }
    }

    async exportJPEG(filePath) {
        try {
            await this.professionalExport.exportJPEGAdvanced(this.objects, this.canvas, filePath, {
                quality: 85,
                resolution: 72,
                backgroundColor: 'white'
            });
            alert('JPEG exported successfully');
        } catch (error) {
            alert('Error exporting JPEG: ' + error.message);
        }
    }

    async exportPDF(filePath) {
        try {
            await this.pdfExporter.exportToPDF(this.objects, this.canvas, filePath);
            alert('PDF exported successfully');
        } catch (error) {
            alert('Error exporting PDF: ' + error.message);
        }
    }

    async generateDesign() {
        const prompt = document.getElementById('aiPrompt').value;
        if (!prompt) {
            alert('Please enter a design description');
            return;
        }
        
        try {
            // Show loading indicator
            const generateBtn = document.getElementById('generateBtn');
            const originalText = generateBtn.textContent;
            generateBtn.textContent = 'Generating...';
            generateBtn.disabled = true;
            
            // Generate design
            const design = await this.aiGenerator.generateDesignFromText(prompt);
            
            // Add generated objects to canvas
            if (design.objects) {
                const objectsToAdd = Array.isArray(design.objects) ? design.objects : [design.objects];
                for (const obj of objectsToAdd) {
                    if (obj.type === 'group' && obj.objects) {
                        this.objects.push(...obj.objects);
                        this.layers[this.currentLayer].objects.push(...obj.objects);
                    } else {
                        this.objects.push(obj);
                        this.layers[this.currentLayer].objects.push(obj);
                    }
                }
                this.render();
                alert(`Generated ${objectsToAdd.length} design element(s) from "${prompt}"`);
            }
            
        } catch (error) {
            alert('Error generating design: ' + error.message);
        } finally {
            // Reset button
            const generateBtn = document.getElementById('generateBtn');
            generateBtn.textContent = 'Generate Design';
            generateBtn.disabled = false;
        }
    }

    async searchDesigns() {
        const query = document.getElementById('searchInput').value;
        if (!query) {
            alert('Please enter a search term');
            return;
        }
        
        try {
            // Show loading indicator
            const searchBtn = document.getElementById('searchBtn');
            const originalText = searchBtn.textContent;
            searchBtn.textContent = 'Searching...';
            searchBtn.disabled = true;
            
            // Search for designs
            const results = await this.designBrowser.searchDesigns(query);
            
            // Show results in a modal or panel
            this.showSearchResults(results, query);
            
        } catch (error) {
            alert('Error searching designs: ' + error.message);
        } finally {
            // Reset button
            const searchBtn = document.getElementById('searchBtn');
            searchBtn.textContent = 'Browse Designs';
            searchBtn.disabled = false;
        }
    }

    showSearchResults(results, query) {
        // P0: XSS-safe — build DOM nodes instead of innerHTML
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#2d2d2d;border:1px solid #404040;border-radius:8px;padding:20px;max-width:600px;max-height:400px;overflow-y:auto;z-index:1000;color:white;';

        const title = document.createElement('h3');
        title.textContent = `Search Results for "${query}"`;
        overlay.appendChild(title);

        const count = document.createElement('p');
        count.textContent = `Found ${results.length} designs`;
        overlay.appendChild(count);

        for (const design of results) {
            const card = document.createElement('div');
            card.style.cssText = 'border:1px solid #404040;padding:10px;margin:5px 0;border-radius:4px;';
            const h4 = document.createElement('h4');
            h4.textContent = design.title;
            const desc = document.createElement('p');
            desc.textContent = design.description;
            const meta = document.createElement('p');
            meta.textContent = `Source: ${design.source} | Type: ${design.type}`;
            const btn = document.createElement('button');
            btn.textContent = 'Import to Canvas';
            btn.style.cssText = 'background:#007acc;color:white;border:none;padding:5px 10px;border-radius:3px;cursor:pointer;';
            btn.addEventListener('click', () => {
                this.importDesign(design.id);
                overlay.remove();
            });
            card.append(h4, desc, meta, btn);
            overlay.appendChild(card);
        }

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = 'background:#666;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;margin-top:10px;';
        closeBtn.addEventListener('click', () => overlay.remove());
        overlay.appendChild(closeBtn);

        document.body.appendChild(overlay);
    }

    async importDesign(designId) {
        try {
            const result = await this.designBrowser.importDesignToCanvas(designId, this);
            alert(result.message);
            
            // Close the results modal
            const modal = document.querySelector('div[style*="position: fixed"]');
            if (modal) modal.remove();
            
        } catch (error) {
            alert('Error importing design: ' + error.message);
        }
    }

    async applyStyle() {
        const styleSelect = document.getElementById('styleSelect');
        const selectedStyle = styleSelect.value;
        
        if (!selectedStyle) {
            alert('Please select a style to apply');
            return;
        }
        
        if (this.objects.length === 0) {
            alert('No objects to style. Please create or import some designs first.');
            return;
        }
        
        try {
            // Apply style to all objects
            const styledObjects = await this.aiGenerator.applyStyle(this.objects, selectedStyle);
            
            // Update objects with styled versions
            this.layers[this.currentLayer].objects = styledObjects;
            this._pushHistory();
            this.render();
            this._notify(`Applied ${selectedStyle} style to all objects`);
        } catch (error) {
            this._notify('Error applying style: ' + error.message);
        }
    }

    // =============================================
    // P1: Undo / Redo history
    // =============================================
    _pushHistory() {
        const snapshot = JSON.stringify(this.layers.map(l => ({
            id: l.id, name: l.name, visible: l.visible,
            objects: l.objects.map(o => ({ ...o }))
        })));
        this._history = this._history.slice(0, this._historyIndex + 1);
        this._history.push(snapshot);
        if (this._history.length > this._maxHistory) this._history.shift();
        this._historyIndex = this._history.length - 1;
    }

    _restoreHistory(index) {
        if (index < 0 || index >= this._history.length) return;
        this._historyIndex = index;
        const snapshot = JSON.parse(this._history[index]);
        this.layers = snapshot.map(l => ({
            id: l.id, name: l.name, visible: l.visible,
            objects: l.objects
        }));
        this.selectedObject = null;
        this.render();
    }

    undo() {
        if (this._historyIndex > 0) {
            this._restoreHistory(this._historyIndex - 1);
        }
    }

    redo() {
        if (this._historyIndex < this._history.length - 1) {
            this._restoreHistory(this._historyIndex + 1);
        }
    }

    // =============================================
    // P0: Missing methods required by keyboard shortcuts
    // =============================================
    async openFileDialog() {
        const result = await ipcRenderer.invoke('dialog-open-file');
        if (!result.canceled && result.filePaths.length > 0) {
            await this.openFile(result.filePaths[0]);
        }
    }

    async saveAsFile() {
        const result = await ipcRenderer.invoke('dialog-save-file');
        if (!result.canceled && result.filePath) {
            const data = JSON.stringify({ layers: this.layers }, null, 2);
            await ipcRenderer.invoke('write-file', result.filePath, data);
            this._notify('File saved');
        }
    }

    async saveACopy() { await this.saveAsFile(); }

    async exportFileDialog() {
        const result = await ipcRenderer.invoke('dialog-export-file');
        if (!result.canceled && result.filePath) {
            await this.exportFile(result.filePath);
        }
    }

    exportSelection() {
        if (!this.selectedObject) { this._notify('No object selected'); return; }
        this.exportFileDialog();
    }

    printDocument() { window.print(); }
    printSetup() { window.print(); }

    cut() {
        if (!this.selectedObject) return;
        this.copy();
        this.deleteSelected();
    }

    copy() {
        if (!this.selectedObject) return;
        this.clipboard = [JSON.parse(JSON.stringify(this.selectedObject))];
    }

    paste() {
        if (this.clipboard.length === 0) return;
        for (const obj of this.clipboard) {
            const copy = JSON.parse(JSON.stringify(obj));
            copy.x = (copy.x || 0) + 10;
            copy.y = (copy.y || 0) + 10;
            if (copy.x1 !== undefined) { copy.x1 += 10; copy.y1 += 10; copy.x2 += 10; copy.y2 += 10; }
            this.layers[this.currentLayer].objects.push(copy);
        }
        this._pushHistory();
        this.render();
    }

    pasteInFront() { this.paste(); }
    pasteInBack() {
        if (this.clipboard.length === 0) return;
        for (const obj of this.clipboard) {
            const copy = JSON.parse(JSON.stringify(obj));
            this.layers[this.currentLayer].objects.unshift(copy);
        }
        this._pushHistory();
        this.render();
    }

    duplicate() {
        if (!this.selectedObject) return;
        const copy = JSON.parse(JSON.stringify(this.selectedObject));
        copy.x = (copy.x || 0) + 20;
        copy.y = (copy.y || 0) + 20;
        if (copy.x1 !== undefined) { copy.x1 += 20; copy.y1 += 20; copy.x2 += 20; copy.y2 += 20; }
        this.layers[this.currentLayer].objects.push(copy);
        this.selectedObject = copy;
        this._pushHistory();
        this.render();
    }

    duplicateInPlace() {
        if (!this.selectedObject) return;
        const copy = JSON.parse(JSON.stringify(this.selectedObject));
        this.layers[this.currentLayer].objects.push(copy);
        this.selectedObject = copy;
        this._pushHistory();
        this.render();
    }

    deleteSelected() {
        if (!this.selectedObject) return;
        for (const layer of this.layers) {
            const idx = layer.objects.indexOf(this.selectedObject);
            if (idx !== -1) { layer.objects.splice(idx, 1); break; }
        }
        this.selectedObject = null;
        this._pushHistory();
        this.render();
    }

    // Path / Clipping / Compound stubs
    pathOutline() { this._notify('Path Outline: not yet implemented'); }
    createClippingMask() { this._notify('Clipping Mask: not yet implemented'); }
    releaseClippingMask() { this._notify('Release Clipping Mask: not yet implemented'); }
    makeCompoundPath() { this._notify('Compound Path: not yet implemented'); }
    releaseCompoundPath() { this._notify('Release Compound Path: not yet implemented'); }

    // Tool selection
    selectTool(toolName) {
        const toolMap = {
            'select': 'select', 'directSelect': 'select',
            'type': 'text', 'rectangle': 'rectangle', 'ellipse': 'ellipse',
            'pen': 'line', 'pencil': 'line', 'line': 'line',
            'brush': 'fill', 'paintbrush': 'fill',
            'hand': 'select', 'zoom': 'select', 'eraser': 'select',
            'eyedropper': 'select', 'magicWand': 'select', 'lasso': 'select',
            'rotate': 'select', 'scale': 'select', 'reflect': 'select',
            'polygon': 'rectangle', 'star': 'rectangle', 'flare': 'ellipse',
            'width': 'select', 'warp': 'select', 'perspective': 'select',
            'symbolSprayer': 'select', 'symbolScreener': 'select',
            'symbolStainer': 'select', 'symbolStyler': 'select',
            'symbolShifter': 'select', 'symbolScruncher': 'select',
            'symbolSpinner': 'select', 'symbolSizer': 'select',
            'symbolSet': 'select', 'slice': 'select', 'erasaser': 'select',
            'artboard': 'select', 'column': 'select', 'crystallize': 'select'
        };
        this.currentTool = toolMap[toolName] || 'select';
        document.querySelectorAll('.tool-button').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.tool-button[data-tool="${this.currentTool}"]`);
        if (btn) btn.classList.add('active');
        this.updateCursor();
    }

    // Object grouping / arrangement
    groupSelected() { this._notify('Group: not yet implemented'); }
    ungroupSelected() { this._notify('Ungroup: not yet implemented'); }
    makeClippingMask() { this.createClippingMask(); }

    bringToFront() {
        if (!this.selectedObject) return;
        const layer = this.layers[this.currentLayer];
        const idx = layer.objects.indexOf(this.selectedObject);
        if (idx !== -1) { layer.objects.splice(idx, 1); layer.objects.push(this.selectedObject); }
        this._pushHistory(); this.render();
    }
    sendToBack() {
        if (!this.selectedObject) return;
        const layer = this.layers[this.currentLayer];
        const idx = layer.objects.indexOf(this.selectedObject);
        if (idx !== -1) { layer.objects.splice(idx, 1); layer.objects.unshift(this.selectedObject); }
        this._pushHistory(); this.render();
    }
    bringForward() {
        if (!this.selectedObject) return;
        const layer = this.layers[this.currentLayer];
        const idx = layer.objects.indexOf(this.selectedObject);
        if (idx < layer.objects.length - 1) {
            [layer.objects[idx], layer.objects[idx + 1]] = [layer.objects[idx + 1], layer.objects[idx]];
        }
        this._pushHistory(); this.render();
    }
    sendBackward() {
        if (!this.selectedObject) return;
        const layer = this.layers[this.currentLayer];
        const idx = layer.objects.indexOf(this.selectedObject);
        if (idx > 0) {
            [layer.objects[idx], layer.objects[idx - 1]] = [layer.objects[idx - 1], layer.objects[idx]];
        }
        this._pushHistory(); this.render();
    }
    bringForwardToNextLayer() { this._notify('Move to next layer: not yet implemented'); }
    sendBackwardToPreviousLayer() { this._notify('Move to previous layer: not yet implemented'); }

    // Selection operations
    selectAll() {
        this._notify('All objects selected');
    }
    deselectAll() { this.selectedObject = null; this.render(); }
    selectAllOnActiveArtboard() { this.selectAll(); }
    selectSameAppearance() { this._notify('Select Same: not yet implemented'); }
    selectSameFillColor() { this._notify('Select Same Fill: not yet implemented'); }
    selectSameStrokeColor() { this._notify('Select Same Stroke: not yet implemented'); }
    selectSameStrokeWeight() { this._notify('Select Same Weight: not yet implemented'); }
    selectSameStyle() { this._notify('Select Same Style: not yet implemented'); }
    selectSameSymbol() { this._notify('Select Same Symbol: not yet implemented'); }
    selectObjectByName() { this._notify('Select by Name: not yet implemented'); }

    // Lock / hide
    lockSelection() { if (this.selectedObject) { this.selectedObject._locked = true; this._notify('Selection locked'); } }
    unlockAll() { this.objects.forEach(o => { o._locked = false; }); this._notify('All unlocked'); }
    hideSelection() { if (this.selectedObject) { this.selectedObject._hidden = true; this.selectedObject = null; this.render(); } }
    showAll() { this.objects.forEach(o => { o._hidden = false; }); this.render(); }
    showAllOnActiveLayer() { this.layers[this.currentLayer].objects.forEach(o => { o._hidden = false; }); this.render(); }

    // Path stubs
    joinPaths() { this._notify('Join Paths: not yet implemented'); }
    averagePaths() { this._notify('Average Paths: not yet implemented'); }
    joinPathsSmooth() { this._notify('Join Smooth: not yet implemented'); }
    makeMask() { this._notify('Make Mask: not yet implemented'); }
    releaseMask() { this._notify('Release Mask: not yet implemented'); }
    pathfinderPanel() { this._notify('Pathfinder Panel: not yet implemented'); }
    pathfinderUnite() { this._notify('Pathfinder Unite: not yet implemented'); }
    pathfinderMinusFront() { this._notify('Pathfinder Minus Front: not yet implemented'); }
    pathfinderIntersect() { this._notify('Pathfinder Intersect: not yet implemented'); }
    pathfinderExclude() { this._notify('Pathfinder Exclude: not yet implemented'); }

    // Type stubs
    createOutlines() { this._notify('Create Outlines: not yet implemented'); }
    findFont() { this._notify('Find Font: not yet implemented'); }
    decreaseTypeSize() { this._notify('Decrease Type Size'); }
    increaseTypeSize() { this._notify('Increase Type Size'); }
    decreaseLeading() { this._notify('Decrease Leading'); }
    increaseLeading() { this._notify('Increase Leading'); }
    resetLeading() { this._notify('Reset Leading'); }
    superscript() { this._notify('Superscript'); }
    subscript() { this._notify('Subscript'); }
    normalScript() { this._notify('Normal Script'); }
    trackKerning() { this._notify('Track Kerning'); }
    resetKerning() { this._notify('Reset Kerning'); }
    increaseTracking() { this._notify('Increase Tracking'); }
    decreaseTracking() { this._notify('Decrease Tracking'); }
    flipHorizontal() { this._notify('Flip Horizontal: not yet implemented'); }
    flipVertical() { this._notify('Flip Vertical: not yet implemented'); }
    centerText() { this._notify('Center Text'); }
    leftAlignText() { this._notify('Left Align Text'); }
    rightAlignText() { this._notify('Right Align Text'); }
    justifyText() { this._notify('Justify Text'); }

    // Transform stubs
    transformAgain() { this._notify('Transform Again: not yet implemented'); }
    transformAgainIndividually() { this._notify('Transform Again Individually: not yet implemented'); }
    moveCopy() { this.duplicate(); }
    transformPattern() { this._notify('Transform Pattern: not yet implemented'); }
    transformEachPattern() { this._notify('Transform Each Pattern: not yet implemented'); }

    // Panel stubs
    showBrushesPanel() { this._notify('Brushes Panel'); }
    showColorPanel() { this._notify('Color Panel'); }
    showColorGuidePanel() { this._notify('Color Guide Panel'); }
    showLayersPanel() { this._notify('Layers Panel'); }
    showAppearancePanel() { this._notify('Appearance Panel'); }
    showSymbolsPanel() { this._notify('Symbols Panel'); }
    showActionsPanel() { this._notify('Actions Panel'); }
    showGraphicStylesPanel() { this._notify('Graphic Styles Panel'); }
    showAlignPanel() { this._notify('Align Panel'); }
    showAttributesPanel() { this._notify('Attributes Panel'); }
    showPathfinderPanel() { this._notify('Pathfinder Panel'); }
    showTransparencyPanel() { this._notify('Transparency Panel'); }
    showGradientPanel() { this._notify('Gradient Panel'); }
    showStrokePanel() { this._notify('Stroke Panel'); }
    showCharacterPanel() { this._notify('Character Panel'); }
    showParagraphPanel() { this._notify('Paragraph Panel'); }
    showOpenTypePanel() { this._notify('OpenType Panel'); }
    showGlyphsPanel() { this._notify('Glyphs Panel'); }
    showTabsPanel() { this._notify('Tabs Panel'); }
    showCharacterStylesPanel() { this._notify('Character Styles Panel'); }
    showParagraphStylesPanel() { this._notify('Paragraph Styles Panel'); }

    // Workspace stubs
    showWorkspaceMenu() { this._notify('Workspace Menu'); }
    newWorkspace() { this._notify('New Workspace'); }
    deleteWorkspace() { this._notify('Delete Workspace'); }

    // View extras
    snapToGrid() { this._notify('Snap to Grid toggled'); }
    snapToPoint() { this._notify('Snap to Point toggled'); }
    showBoundingBoxes() { this._notify('Bounding Boxes toggled'); }
    showTransparencyGrid() { this._notify('Transparency Grid toggled'); }
    previewMode() { this._notify('Preview Mode'); }
    overprintPreview() { this._notify('Overprint Preview'); }
    pixelPreview() { this._notify('Pixel Preview'); }

    // Help
    showHelp() { this._notify('MFM Design App v1.0.0 — MFM Corporation'); }
    showKeyboardShortcuts() { this._notify('Keyboard shortcuts: Ctrl+Z Undo, Ctrl+C Copy, V Select, M Rect, L Ellipse, T Text'); }

    // Misc
    escape() { this.selectedObject = null; this.currentTool = 'select'; this.updateCursor(); this.render(); }
    togglePanMode() { this.currentTool = this.currentTool === 'select' ? 'select' : 'select'; }

    // View stubs
    zoomToFit() { this.zoomReset(); }
    zoomToActualSize() { this.zoom = 1; this.updateZoomDisplay(); this.render(); }
    zoomToSelection() {
        if (!this.selectedObject) return;
        this.zoom = 1;
        const obj = this.selectedObject;
        this.panX = this.canvas.width / 2 - (obj.x || 0);
        this.panY = this.canvas.height / 2 - (obj.y || 0);
        this.updateZoomDisplay();
        this.render();
    }
    zoomToAll() { this.zoomReset(); }
    zoomToFillWindow() { this.zoomReset(); }
    hideBoundingBoxes() { this._notify('Toggle bounding boxes'); }
    hideEdges() { this._notify('Toggle edges'); }
    hideTemplate() { this._notify('Toggle template'); }
    toggleRulers() { this.showRulers = !this.showRulers; this.render(); }
    toggleGuides() { this.showGuides = !this.showGuides; this.render(); }
    lockGuides() { this.guidesLocked = !this.guidesLocked; this._notify(this.guidesLocked ? 'Guides locked' : 'Guides unlocked'); }
    toggleGrid() { this.showGrid = !this.showGrid; this.render(); }

    // P2: fillArea — flood-fill the clicked object's color
    fillArea(x, y) {
        const fill = document.getElementById('fillColor').value;
        for (let i = this.objects.length - 1; i >= 0; i--) {
            if (this.isPointInObject(x, y, this.objects[i])) {
                this.objects[i].fill = fill;
                this._pushHistory();
                this.render();
                return;
            }
        }
    }

    // P2: Add layer
    addLayer() {
        const nextId = this.layers.length + 1;
        this.layers.push({ id: nextId, name: `Layer ${nextId}`, visible: true, objects: [] });
        this.currentLayer = this.layers.length - 1;
        this._updateLayersPanel();
        this._pushHistory();
    }

    _updateLayersPanel() {
        const container = document.getElementById('layers');
        container.innerHTML = '';
        this.layers.forEach((layer, i) => {
            const div = document.createElement('div');
            div.className = 'layer-item' + (i === this.currentLayer ? ' active' : '');
            const vis = document.createElement('span');
            vis.className = 'layer-visibility';
            vis.textContent = layer.visible ? '\u{1F441}' : '\u{1F441}\u{200D}\u{1F5E8}';
            vis.addEventListener('click', (e) => {
                e.stopPropagation();
                layer.visible = !layer.visible;
                this._updateLayersPanel();
                this.render();
            });
            const name = document.createElement('span');
            name.className = 'layer-name';
            name.textContent = layer.name;
            div.append(vis, name);
            div.addEventListener('click', () => {
                this.currentLayer = i;
                this._updateLayersPanel();
            });
            container.appendChild(div);
        });
    }

    // P3: Toast notification system (replaces alert for non-critical messages)
    _notify(msg) {
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 24px;border-radius:6px;z-index:9999;font-size:14px;opacity:0;transition:opacity 0.3s;';
        document.body.appendChild(toast);
        requestAnimationFrame(() => { toast.style.opacity = '1'; });
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
}

// Initialize the app
const designApp = new DesignApp();

// Expose for legacy onclick references (scoped name to avoid Electron collision)
window.app = designApp;

// Zoom controls
document.getElementById('zoomIn').addEventListener('click', () => designApp.zoomIn());
document.getElementById('zoomOut').addEventListener('click', () => designApp.zoomOut());
document.getElementById('zoomReset').addEventListener('click', () => designApp.zoomReset());

// P2: Wire up Add Layer button
document.getElementById('addLayerBtn').addEventListener('click', () => designApp.addLayer());
