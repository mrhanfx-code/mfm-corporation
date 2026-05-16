class AIParser {
    constructor() {
        this.supportedVersions = ['CS3', 'CS4', 'CS5', 'CS6', 'CC', '2020', '2021', '2022', '2023'];
    }

    async parseFile(filePath) {
        try {
            const fs = require('fs').promises;
            const data = await fs.readFile(filePath);
            
            // Check if it's a PDF-based .ai file (modern format)
            if (this.isPDFBased(data)) {
                return this.parsePDFBasedAI(data);
            }
            // Check if it's an older .ai format
            else if (this.isLegacyFormat(data)) {
                return this.parseLegacyAI(data);
            }
            else {
                throw new Error('Unsupported .ai file format');
            }
        } catch (error) {
            throw new Error(`Failed to parse .ai file: ${error.message}`);
        }
    }

    isPDFBased(data) {
        // Modern .ai files are PDF-based, start with %PDF
        const header = data.toString('ascii', 0, 4);
        return header === '%PDF';
    }

    isLegacyFormat(data) {
        // Legacy .ai files have specific headers
        const text = data.toString('ascii', 0, Math.min(100, data.length));
        return text.includes('%!PS-Adobe') || text.includes('Adobe Illustrator');
    }

    async parsePDFBasedAI(data) {
        // For PDF-based .ai files, extract basic PDF content
        const pdfText = data.toString('ascii');
        const objects = [];
        
        // Extract basic shapes from PDF operators
        const lines = pdfText.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Parse rectangles
            const rectMatch = line.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+re/);
            if (rectMatch) {
                objects.push({
                    type: 'rectangle',
                    x: parseFloat(rectMatch[1]),
                    y: parseFloat(rectMatch[2]),
                    width: parseFloat(rectMatch[3]),
                    height: parseFloat(rectMatch[4]),
                    fill: this.extractFillColor(lines, i),
                    stroke: this.extractStrokeColor(lines, i),
                    strokeWidth: this.extractStrokeWidth(lines, i),
                    opacity: 1
                });
            }
            
            // Parse basic paths (simplified)
            if (line.includes('m') && line.includes('l')) {
                const pathData = this.parsePathData(line);
                if (pathData) {
                    objects.push(pathData);
                }
            }
        }
        
        return {
            format: 'pdf-based',
            version: this.extractVersion(pdfText),
            objects: objects,
            artboard: this.extractArtboard(pdfText)
        };
    }

    parseLegacyAI(data) {
        const text = data.toString('ascii');
        const objects = [];
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Parse legacy Illustrator commands
            if (line.startsWith('%%BoundingBox:')) {
                const bbox = line.replace('%%BoundingBox:', '').trim().split(/\s+/);
                // Store artboard bounds
            }
            
            // Parse path data
            if (line.includes('0 0 m') || line.includes('l')) {
                const pathObj = this.parseLegacyPath(line, lines, i);
                if (pathObj) {
                    objects.push(pathObj);
                }
            }
        }
        
        return {
            format: 'legacy',
            version: this.extractVersion(text),
            objects: objects,
            artboard: { width: 800, height: 600 } // Default for legacy files
        };
    }

    extractFillColor(lines, currentIndex) {
        // Look backwards for fill color
        for (let i = currentIndex - 1; i >= Math.max(0, currentIndex - 10); i--) {
            const line = lines[i].trim();
            const match = line.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(rg|sc)/);
            if (match) {
                const r = Math.round(parseFloat(match[1]) * 255);
                const g = Math.round(parseFloat(match[2]) * 255);
                const b = Math.round(parseFloat(match[3]) * 255);
                return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
        }
        return '#000000';
    }

    extractStrokeColor(lines, currentIndex) {
        // Similar to fill color but for stroke
        return this.extractFillColor(lines, currentIndex);
    }

    extractStrokeWidth(lines, currentIndex) {
        // Look for stroke width
        for (let i = currentIndex - 1; i >= Math.max(0, currentIndex - 10); i--) {
            const line = lines[i].trim();
            const match = line.match(/(\d+\.?\d*)\s+w/);
            if (match) {
                return parseFloat(match[1]);
            }
        }
        return 1;
    }

    parsePathData(line) {
        // Simplified path parsing
        const coords = line.match(/(\d+\.?\d*)/g);
        if (coords && coords.length >= 4) {
            return {
                type: 'path',
                points: coords.map(c => parseFloat(c)),
                fill: '#000000',
                stroke: '#000000',
                strokeWidth: 1,
                opacity: 1
            };
        }
        return null;
    }

    parseLegacyPath(line, lines, index) {
        // Basic legacy path parsing
        if (line.includes('m') && line.includes('l')) {
            const coords = line.match(/(\d+\.?\d*)/g);
            if (coords && coords.length >= 4) {
                return {
                    type: 'path',
                    points: coords.map(c => parseFloat(c)),
                    fill: '#000000',
                    stroke: '#000000',
                    strokeWidth: 1,
                    opacity: 1
                };
            }
        }
        return null;
    }

    extractVersion(text) {
        const versionMatch = text.match(/Illustrator (\d+\.\d+)/) || 
                            text.match(/Adobe Illustrator ([\w\d]+)/);
        return versionMatch ? versionMatch[1] : 'Unknown';
    }

    extractArtboard(text) {
        // Try to extract artboard dimensions
        const bboxMatch = text.match(/%%BoundingBox:\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
        if (bboxMatch) {
            const width = parseInt(bboxMatch[3]) - parseInt(bboxMatch[1]);
            const height = parseInt(bboxMatch[4]) - parseInt(bboxMatch[2]);
            return { width, height };
        }
        return { width: 800, height: 600 };
    }

    // Convert parsed .ai objects to our app's format
    convertToAppObjects(aiObjects) {
        const converted = [];
        
        for (const obj of aiObjects) {
            if (obj.type === 'rectangle') {
                converted.push({
                    type: 'rectangle',
                    x: obj.x,
                    y: obj.y,
                    width: obj.width,
                    height: obj.height,
                    fill: obj.fill || '#000000',
                    stroke: obj.stroke || '#000000',
                    strokeWidth: obj.strokeWidth || 1,
                    opacity: obj.opacity || 1
                });
            } else if (obj.type === 'ellipse') {
                // Convert path to ellipse if it looks like one
                if (this.isEllipsePath(obj.points)) {
                    const ellipse = this.convertPathToEllipse(obj.points);
                    converted.push({
                        type: 'ellipse',
                        x: ellipse.x,
                        y: ellipse.y,
                        radiusX: ellipse.radiusX,
                        radiusY: ellipse.radiusY,
                        fill: obj.fill || '#000000',
                        stroke: obj.stroke || '#000000',
                        strokeWidth: obj.strokeWidth || 1,
                        opacity: obj.opacity || 1
                    });
                }
            } else if (obj.type === 'path') {
                // Convert complex paths to simplified lines
                const lines = this.convertPathToLines(obj.points);
                converted.push(...lines);
            }
        }
        
        return converted;
    }

    isEllipsePath(points) {
        // Simple heuristic to detect if path represents an ellipse
        return points.length === 8; // 4 control points for basic ellipse
    }

    convertPathToEllipse(points) {
        // Convert 8-point path to ellipse parameters
        return {
            x: (points[0] + points[4]) / 2,
            y: (points[1] + points[5]) / 2,
            radiusX: Math.abs(points[4] - points[0]) / 2,
            radiusY: Math.abs(points[5] - points[1]) / 2
        };
    }

    convertPathToLines(points) {
        const lines = [];
        for (let i = 0; i < points.length - 2; i += 2) {
            lines.push({
                type: 'line',
                x1: points[i],
                y1: points[i + 1],
                x2: points[i + 2],
                y2: points[i + 3],
                stroke: '#000000',
                strokeWidth: 1,
                opacity: 1
            });
        }
        return lines;
    }
}

module.exports = AIParser;
