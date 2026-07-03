class PDFExporter {
    constructor() {
        this.pdfDocument = null;
    }

    async exportToPDF(objects, canvas, filePath) {
        try {
            let PDFDocument;
            try {
                PDFDocument = require('pdfkit');
            } catch (e) {
                throw new Error('PDF export requires the pdfkit package. Install it with: npm install pdfkit');
            }
            const fs = require('fs');
            
            this.pdfDocument = new PDFDocument({
                size: [canvas.width, canvas.height],
                margins: { top: 0, bottom: 0, left: 0, right: 0 }
            });

            const stream = fs.createWriteStream(filePath);
            this.pdfDocument.pipe(stream);

            // Draw all objects to PDF
            for (const obj of objects) {
                this.drawObjectToPDF(obj);
            }

            this.pdfDocument.end();

            return new Promise((resolve, reject) => {
                stream.on('finish', () => resolve(true));
                stream.on('error', reject);
            });
        } catch (error) {
            throw new Error(`PDF export failed: ${error.message}`);
        }
    }

    drawObjectToPDF(obj) {
        this.pdfDocument.save();
        
        // Apply opacity
        if (obj.opacity && obj.opacity < 1) {
            this.pdfDocument.fillOpacity(obj.opacity);
            this.pdfDocument.strokeOpacity(obj.opacity);
        }

        // Set stroke properties
        if (obj.strokeWidth) {
            this.pdfDocument.lineWidth(obj.strokeWidth);
        }

        switch (obj.type) {
            case 'rectangle':
                this.drawRectangle(obj);
                break;
            case 'ellipse':
                this.drawEllipse(obj);
                break;
            case 'line':
                this.drawLine(obj);
                break;
            case 'text':
                this.drawText(obj);
                break;
            case 'path':
                this.drawPath(obj);
                break;
        }

        this.pdfDocument.restore();
    }

    drawRectangle(obj) {
        const { x, y, width, height, fill, stroke } = obj;
        
        if (fill && fill !== 'none') {
            this.pdfDocument.fillColor(this.hexToPDFColor(fill));
            this.pdfDocument.rect(x, y, width, height).fill();
        }
        
        if (stroke && stroke !== 'none') {
            this.pdfDocument.strokeColor(this.hexToPDFColor(stroke));
            this.pdfDocument.rect(x, y, width, height).stroke();
        }
    }

    drawEllipse(obj) {
        const { x, y, radiusX, radiusY, fill, stroke } = obj;
        
        this.pdfDocument.moveTo(x + radiusX, y);
        this.pdfDocument.bezierCurveTo(
            x + radiusX, y - radiusY * 0.55,
            x + radiusX * 0.55, y - radiusY,
            x, y - radiusY
        );
        this.pdfDocument.bezierCurveTo(
            x - radiusX * 0.55, y - radiusY,
            x - radiusX, y - radiusY * 0.55,
            x - radiusX, y
        );
        this.pdfDocument.bezierCurveTo(
            x - radiusX, y + radiusY * 0.55,
            x - radiusX * 0.55, y + radiusY,
            x, y + radiusY
        );
        this.pdfDocument.bezierCurveTo(
            x + radiusX * 0.55, y + radiusY,
            x + radiusX, y + radiusY * 0.55,
            x + radiusX, y
        );
        
        if (fill && fill !== 'none') {
            this.pdfDocument.fillColor(this.hexToPDFColor(fill));
            this.pdfDocument.fill();
        }
        
        if (stroke && stroke !== 'none') {
            this.pdfDocument.strokeColor(this.hexToPDFColor(stroke));
            this.pdfDocument.stroke();
        }
    }

    drawLine(obj) {
        const { x1, y1, x2, y2, stroke } = obj;
        
        if (stroke && stroke !== 'none') {
            this.pdfDocument.strokeColor(this.hexToPDFColor(stroke));
            this.pdfDocument.moveTo(x1, y1).lineTo(x2, y2).stroke();
        }
    }

    drawText(obj) {
        const { x, y, text, font, fill } = obj;
        
        if (fill && fill !== 'none') {
            this.pdfDocument.fillColor(this.hexToPDFColor(fill));
        }
        
        const fontSize = this.extractFontSize(font);
        this.pdfDocument.fontSize(fontSize);
        this.pdfDocument.text(text, x, y);
    }

    drawPath(obj) {
        const { points, fill, stroke } = obj;
        
        if (points.length < 4) return;
        
        this.pdfDocument.moveTo(points[0], points[1]);
        
        for (let i = 2; i < points.length - 1; i += 2) {
            this.pdfDocument.lineTo(points[i], points[i + 1]);
        }
        
        if (fill && fill !== 'none') {
            this.pdfDocument.fillColor(this.hexToPDFColor(fill));
            this.pdfDocument.fill();
        }
        
        if (stroke && stroke !== 'none') {
            this.pdfDocument.strokeColor(this.hexToPDFColor(stroke));
            this.pdfDocument.stroke();
        }
    }

    hexToPDFColor(hex) {
        // Convert hex color to PDFKit color format
        if (hex.startsWith('#')) {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return [r, g, b];
        }
        return hex; // Return as-is if not hex format
    }

    extractFontSize(fontString) {
        // Extract font size from font string like "16px Arial"
        const match = fontString.match(/(\d+)px/);
        return match ? parseInt(match[1]) : 16;
    }
}

module.exports = PDFExporter;
