const { ipcRenderer } = require('electron');
const AIParser = require('./ai-parser.js');
const PDFExporter = require('./pdf-export.js');
const AIGenerator = require('./ai-generator.js');
const DesignBrowser = require('./design-browser.js');
const TypographySystem = require('./typography.js');
const ProfessionalExport = require('./professional-export.js');
const PerformanceOptimizer = require('./performance-optimizer.js');

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
        this.objects = [];
        this.selectedObject = null;
        this.layers = [{ id: 1, name: 'Layer 1', visible: true, objects: [] }];
        this.currentLayer = 0;
        this.aiParser = new AIParser();
        this.pdfExporter = new PDFExporter();
        this.aiGenerator = new AIGenerator();
        this.designBrowser = new DesignBrowser();
        this.typography = new TypographySystem();
        this.professionalExport = new ProfessionalExport();
        this.performanceOptimizer = new PerformanceOptimizer();
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupToolbar();
        this.setupProperties();
        this.setupAI();
        this.setupMenuHandlers();
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
        
        this.objects.push(rect);
        this.layers[this.currentLayer].objects.push(rect);
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
        
        this.objects.push(ellipse);
        this.layers[this.currentLayer].objects.push(ellipse);
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
        
        this.objects.push(line);
        this.layers[this.currentLayer].objects.push(line);
        this.render();
    }

    createText(x, y) {
        const text = prompt('Enter text:');
        if (text) {
            const textObj = this.typography.createTextObject(text, x, y);
            textObj.fill = document.getElementById('fillColor').value;
            textObj.opacity = parseInt(document.getElementById('opacity').value) / 100;
            
            this.objects.push(textObj);
            this.layers[this.currentLayer].objects.push(textObj);
            this.render();
        }
    }

    drawRectanglePreview(x, y) {
        this.render();
        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillStyle = document.getElementById('fillColor').value;
        this.ctx.strokeStyle = document.getElementById('strokeColor').value;
        this.ctx.lineWidth = parseInt(document.getElementById('strokeWidth').value);
        
        const width = x - this.startX;
        const height = y - this.startY;
        this.ctx.strokeRect(this.startX, this.startY, width, height);
        this.ctx.fillRect(this.startX, this.startY, width, height);
        this.ctx.restore();
    }

    drawEllipsePreview(x, y) {
        this.render();
        this.ctx.save();
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
        this.render();
        this.ctx.save();
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
        if (obj.type === 'rectangle') {
            return x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height;
        } else if (obj.type === 'ellipse') {
            const dx = (x - obj.x) / obj.radiusX;
            const dy = (y - obj.y) / obj.radiusY;
            return dx * dx + dy * dy <= 1;
        }
        return false;
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
        // Adapt performance based on object count
        this.performanceOptimizer.adaptPerformance(this.objects.length);
        
        // Apply LOD based on zoom level
        const lodLevel = this.performanceOptimizer.getLODLevel(this.zoom);
        const optimizedObjects = this.performanceOptimizer.applyLOD(this.objects, lodLevel);
        
        // Use optimized rendering
        if (!this.performanceOptimizer.optimizeRender(optimizedObjects, this.zoom, this.panX, this.panY)) {
            // Fallback to standard rendering if optimization fails
            this.standardRender(optimizedObjects);
        }
    }

    standardRender(objects) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);
        
        for (const layer of this.layers) {
            if (!layer.visible) continue;
            
            for (const obj of layer.objects) {
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
        const img = new Image();
        img.onload = () => {
            this.ctx.save();
            this.ctx.globalAlpha = obj.opacity || 1;
            this.ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
            this.ctx.restore();
        };
        img.src = obj.src;
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
            this.objects = [];
            this.layers = [{ id: 1, name: 'Layer 1', visible: true, objects: [] }];
            this.selectedObject = null;
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
        // Create a simple results display
        const resultsHtml = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: #2d2d2d; border: 1px solid #404040; border-radius: 8px; 
                        padding: 20px; max-width: 600px; max-height: 400px; overflow-y: auto; 
                        z-index: 1000; color: white;">
                <h3>Search Results for "${query}"</h3>
                <p>Found ${results.length} designs</p>
                <div style="margin: 10px 0;">
                    ${results.map((design, index) => `
                        <div style="border: 1px solid #404040; padding: 10px; margin: 5px 0; border-radius: 4px;">
                            <h4>${design.title}</h4>
                            <p>${design.description}</p>
                            <p>Source: ${design.source} | Type: ${design.type}</p>
                            <button onclick="app.importDesign('${design.id}')" style="background: #007acc; color: white; 
                                    border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                                Import to Canvas
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button onclick="this.parentElement.remove()" style="background: #666; color: white; 
                        border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                    Close
                </button>
            </div>
        `;
        
        // Add to body
        const resultsDiv = document.createElement('div');
        resultsDiv.innerHTML = resultsHtml;
        document.body.appendChild(resultsDiv);
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
            this.objects = styledObjects;
            this.layers[this.currentLayer].objects = styledObjects;
            
            this.render();
            alert(`Applied ${selectedStyle} style to all objects`);
            
        } catch (error) {
            alert('Error applying style: ' + error.message);
        }
    }
}

// Initialize the app
const app = new DesignApp();

// Zoom controls
document.getElementById('zoomIn').addEventListener('click', () => app.zoomIn());
document.getElementById('zoomOut').addEventListener('click', () => app.zoomOut());
document.getElementById('zoomReset').addEventListener('click', () => app.zoomReset());
