class ProfessionalExport {
    constructor() {
        this.exportPresets = {
            web: {
                formats: ['PNG', 'SVG'],
                quality: 80,
                resolution: 72,
                colorSpace: 'sRGB',
                backgroundColor: 'transparent'
            },
            print: {
                formats: ['PDF', 'SVG'],
                quality: 100,
                resolution: 300,
                colorSpace: 'CMYK',
                backgroundColor: 'white'
            },
            presentation: {
                formats: ['PNG', 'PDF'],
                quality: 90,
                resolution: 150,
                colorSpace: 'sRGB',
                backgroundColor: 'white'
            },
            social: {
                formats: ['PNG'],
                quality: 85,
                resolution: 72,
                colorSpace: 'sRGB',
                backgroundColor: 'white',
                dimensions: { width: 1080, height: 1080 }
            }
        };
        
        this.colorProfiles = {
            sRGB: { profile: 'sRGB', description: 'Standard web color space' },
            AdobeRGB: { profile: 'Adobe RGB', description: 'Professional photography' },
            CMYK: { profile: 'CMYK', description: 'Print production' },
            Grayscale: { profile: 'Grayscale', description: 'Black and white output' }
        };
    }

    async exportWithPreset(objects, canvas, preset, filePath, options = {}) {
        const settings = { ...this.exportPresets[preset], ...options };
        
        if (!settings) {
            throw new Error('Invalid export preset');
        }

        const results = [];
        
        for (const format of settings.formats) {
            const exportPath = this.generateExportPath(filePath, format);
            
            try {
                switch (format) {
                    case 'PNG':
                        await this.exportPNGAdvanced(objects, canvas, exportPath, settings);
                        break;
                    case 'SVG':
                        await this.exportSVGAdvanced(objects, canvas, exportPath, settings);
                        break;
                    case 'PDF':
                        await this.exportPDFAdvanced(objects, canvas, exportPath, settings);
                        break;
                    case 'JPG':
                    case 'JPEG':
                        await this.exportJPEGAdvanced(objects, canvas, exportPath, settings);
                        break;
                    default:
                        throw new Error(`Unsupported format: ${format}`);
                }
                
                results.push({ format, path: exportPath, success: true });
            } catch (error) {
                results.push({ format, path: exportPath, success: false, error: error.message });
            }
        }
        
        return results;
    }

    generateExportPath(filePath, format) {
        const path = require('path');
        const ext = path.extname(filePath);
        const baseName = filePath.replace(ext, '');
        return `${baseName}_${format.toLowerCase()}.${format.toLowerCase()}`;
    }

    async exportPNGAdvanced(objects, canvas, filePath, settings) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Set dimensions based on settings
        if (settings.dimensions) {
            tempCanvas.width = settings.dimensions.width;
            tempCanvas.height = settings.dimensions.height;
        } else {
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
        }
        
        // Apply background
        if (settings.backgroundColor === 'transparent') {
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        } else {
            tempCtx.fillStyle = settings.backgroundColor;
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
        
        // Scale for resolution
        const scale = settings.resolution / 72;
        tempCtx.scale(scale, scale);
        
        // Render objects
        this.renderObjectsToContext(tempCtx, objects, scale);
        
        // Convert to blob and save
        return new Promise((resolve, reject) => {
            tempCanvas.toBlob(async (blob) => {
                try {
                    const buffer = await blob.arrayBuffer();
                    const fs = require('fs');
                    await fs.promises.writeFile(filePath, new Uint8Array(buffer));
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }, `image/png`, settings.quality / 100);
        });
    }

    async exportJPEGAdvanced(objects, canvas, filePath, settings) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Set dimensions
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        // JPEG always has white background
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Render objects
        this.renderObjectsToContext(tempCtx, objects, 1);
        
        return new Promise((resolve, reject) => {
            tempCanvas.toBlob(async (blob) => {
                try {
                    const buffer = await blob.arrayBuffer();
                    const fs = require('fs');
                    await fs.promises.writeFile(filePath, new Uint8Array(buffer));
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }, `image/jpeg`, settings.quality / 100);
        });
    }

    async exportSVGAdvanced(objects, canvas, filePath, settings) {
        let svg = '<?xml version="1.0" encoding="UTF-8"?>\n';
        svg += '<svg xmlns="http://www.w3.org/2000/svg" ';
        svg += `width="${canvas.width}" height="${canvas.height}" `;
        svg += `viewBox="0 0 ${canvas.width} ${canvas.height}">\n`;
        
        // Add metadata
        svg += '  <metadata>\n';
        svg += `    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n`;
        svg += `      <rdf:Description rdf:about="">\n`;
        svg += `        <dc:title>MFM Design App Export</dc:title>\n`;
        svg += `        <dc:format>image/svg+xml</dc:format>\n`;
        svg += `        <dc:date>${new Date().toISOString()}</dc:date>\n`;
        svg += `      </rdf:Description>\n`;
        svg += `    </rdf:RDF>\n`;
        svg += '  </metadata>\n';
        
        // Add definitions
        svg += '  <defs>\n';
        svg += '    <!-- Color profiles and gradients can be added here -->\n';
        svg += '  </defs>\n';
        
        // Add background
        if (settings.backgroundColor !== 'transparent') {
            svg += `  <rect width="100%" height="100%" fill="${settings.backgroundColor}"/>\n`;
        }
        
        // Add objects
        for (const obj of objects) {
            svg += this.objectToSVGAdvanced(obj, settings);
        }
        
        svg += '</svg>';
        
        const fs = require('fs');
        await fs.promises.writeFile(filePath, svg);
    }

    async exportPDFAdvanced(objects, canvas, filePath, settings) {
        const PDFDocument = require('pdfkit');
        const fs = require('fs');
        
        const pdfDoc = new PDFDocument({
            size: [canvas.width, canvas.height],
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            info: {
                Title: 'MFM Design App Export',
                Creator: 'MFM Design App',
                Producer: 'MFM Corporation',
                CreationDate: new Date()
            }
        });

        const stream = fs.createWriteStream(filePath);
        pdfDoc.pipe(stream);

        // Add background if needed
        if (settings.backgroundColor !== 'transparent') {
            pdfDoc.fillColor(settings.backgroundColor);
            pdfDoc.rect(0, 0, canvas.width, canvas.height).fill();
        }

        // Render all objects
        for (const obj of objects) {
            this.renderObjectToPDF(pdfDoc, obj, settings);
        }

        pdfDoc.end();

        return new Promise((resolve, reject) => {
            stream.on('finish', () => resolve());
            stream.on('error', reject);
        });
    }

    renderObjectsToContext(ctx, objects, scale = 1) {
        for (const obj of objects) {
            ctx.save();
            ctx.globalAlpha = obj.opacity || 1;
            
            switch (obj.type) {
                case 'rectangle':
                    ctx.fillStyle = obj.fill;
                    ctx.strokeStyle = obj.stroke;
                    ctx.lineWidth = obj.strokeWidth;
                    ctx.fillRect(obj.x * scale, obj.y * scale, obj.width * scale, obj.height * scale);
                    if (obj.stroke !== 'none') {
                        ctx.strokeRect(obj.x * scale, obj.y * scale, obj.width * scale, obj.height * scale);
                    }
                    break;
                    
                case 'ellipse':
                    ctx.fillStyle = obj.fill;
                    ctx.strokeStyle = obj.stroke;
                    ctx.lineWidth = obj.strokeWidth;
                    ctx.beginPath();
                    ctx.ellipse(obj.x * scale, obj.y * scale, obj.radiusX * scale, obj.radiusY * scale, 0, 0, 2 * Math.PI);
                    ctx.fill();
                    if (obj.stroke !== 'none') {
                        ctx.stroke();
                    }
                    break;
                    
                case 'line':
                    ctx.strokeStyle = obj.stroke;
                    ctx.lineWidth = obj.strokeWidth;
                    ctx.beginPath();
                    ctx.moveTo(obj.x1 * scale, obj.y1 * scale);
                    ctx.lineTo(obj.x2 * scale, obj.y2 * scale);
                    ctx.stroke();
                    break;
                    
                case 'text':
                    ctx.fillStyle = obj.fill;
                    ctx.font = obj.font;
                    ctx.textAlign = obj.textAlign || 'left';
                    ctx.textBaseline = 'top';
                    
                    if (obj.maxWidth) {
                        this.wrapTextInContext(ctx, obj.text, obj.x * scale, obj.y * scale, obj.maxWidth * scale, obj.fontSize * obj.lineHeight * scale);
                    } else {
                        ctx.fillText(obj.text, obj.x * scale, obj.y * scale);
                    }
                    break;
                    
                case 'image':
                    // Images would need to be loaded and rendered
                    break;
            }
            
            ctx.restore();
        }
    }

    wrapTextInContext(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + (line ? ' ' : '') + words[i];
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && line) {
                ctx.fillText(line, x, currentY);
                line = words[i];
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        
        if (line) {
            ctx.fillText(line, x, currentY);
        }
    }

    objectToSVGAdvanced(obj, settings) {
        let svg = '';
        const opacity = obj.opacity || 1;
        
        switch (obj.type) {
            case 'rectangle':
                svg += `  <rect x="${obj.x}" y="${obj.y}" width="${obj.width}" height="${obj.height}" `;
                svg += `fill="${obj.fill || 'none'}" stroke="${obj.stroke || 'none'}" stroke-width="${obj.strokeWidth || 1}" opacity="${opacity}" />\n`;
                break;
                
            case 'ellipse':
                svg += `  <ellipse cx="${obj.x}" cy="${obj.y}" rx="${obj.radiusX}" ry="${obj.radiusY}" `;
                svg += `fill="${obj.fill || 'none'}" stroke="${obj.stroke || 'none'}" stroke-width="${obj.strokeWidth || 1}" opacity="${opacity}" />\n`;
                break;
                
            case 'line':
                svg += `  <line x1="${obj.x1}" y1="${obj.y1}" x2="${obj.x2}" y2="${obj.y2}" `;
                svg += `stroke="${obj.stroke || 'black'}" stroke-width="${obj.strokeWidth || 1}" opacity="${opacity}" />\n`;
                break;
                
            case 'text':
                svg += `  <text x="${obj.x}" y="${obj.y}" fill="${obj.fill || 'black'}" opacity="${opacity}" `;
                svg += `font-family="${obj.fontFamily || 'Arial'}" font-size="${obj.fontSize || 16}" `;
                svg += `font-weight="${obj.fontWeight || 400}" font-style="${obj.fontStyle || 'normal'}" `;
                svg += `text-anchor="${obj.textAlign === 'center' ? 'middle' : obj.textAlign === 'right' ? 'end' : 'start'}">\n`;
                svg += `    ${obj.text}\n`;
                svg += `  </text>\n`;
                break;
        }
        
        return svg;
    }

    renderObjectToPDF(pdfDoc, obj, settings) {
        pdfDoc.save();
        
        if (obj.opacity && obj.opacity < 1) {
            pdfDoc.fillOpacity(obj.opacity);
            pdfDoc.strokeOpacity(obj.opacity);
        }

        switch (obj.type) {
            case 'rectangle':
                if (obj.fill && obj.fill !== 'none') {
                    pdfDoc.fillColor(this.hexToPDFColor(obj.fill));
                    pdfDoc.rect(obj.x, obj.y, obj.width, obj.height).fill();
                }
                if (obj.stroke && obj.stroke !== 'none') {
                    pdfDoc.strokeColor(this.hexToPDFColor(obj.stroke));
                    pdfDoc.lineWidth(obj.strokeWidth || 1);
                    pdfDoc.rect(obj.x, obj.y, obj.width, obj.height).stroke();
                }
                break;
                
            case 'ellipse':
                pdfDoc.moveTo(obj.x + obj.radiusX, obj.y);
                pdfDoc.bezierCurveTo(
                    obj.x + obj.radiusX, obj.y - obj.radiusY * 0.55,
                    obj.x + obj.radiusX * 0.55, obj.y - obj.radiusY,
                    obj.x, obj.y - obj.radiusY
                );
                pdfDoc.bezierCurveTo(
                    obj.x - obj.radiusX * 0.55, obj.y - obj.radiusY,
                    obj.x - obj.radiusX, obj.y - obj.radiusY * 0.55,
                    obj.x - obj.radiusX, obj.y
                );
                pdfDoc.bezierCurveTo(
                    obj.x - obj.radiusX, obj.y + obj.radiusY * 0.55,
                    obj.x - obj.radiusX * 0.55, obj.y + obj.radiusY,
                    obj.x, obj.y + obj.radiusY
                );
                pdfDoc.bezierCurveTo(
                    obj.x + obj.radiusX * 0.55, obj.y + obj.radiusY,
                    obj.x + obj.radiusX, obj.y + obj.radiusY * 0.55,
                    obj.x + obj.radiusX, obj.y
                );
                
                if (obj.fill && obj.fill !== 'none') {
                    pdfDoc.fillColor(this.hexToPDFColor(obj.fill));
                    pdfDoc.fill();
                }
                if (obj.stroke && obj.stroke !== 'none') {
                    pdfDoc.strokeColor(this.hexToPDFColor(obj.stroke));
                    pdfDoc.lineWidth(obj.strokeWidth || 1);
                    pdfDoc.stroke();
                }
                break;
                
            case 'line':
                if (obj.stroke && obj.stroke !== 'none') {
                    pdfDoc.strokeColor(this.hexToPDFColor(obj.stroke));
                    pdfDoc.lineWidth(obj.strokeWidth || 1);
                    pdfDoc.moveTo(obj.x1, obj.y1).lineTo(obj.x2, obj.y2).stroke();
                }
                break;
                
            case 'text':
                if (obj.fill && obj.fill !== 'none') {
                    pdfDoc.fillColor(this.hexToPDFColor(obj.fill));
                    const fontSize = obj.fontSize || 16;
                    pdfDoc.fontSize(fontSize);
                    pdfDoc.text(obj.text, obj.x, obj.y + fontSize);
                }
                break;
        }

        pdfDoc.restore();
    }

    hexToPDFColor(hex) {
        if (hex.startsWith('#')) {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return [r, g, b];
        }
        return hex;
    }

    // Batch export for multiple formats
    async batchExport(objects, canvas, outputDir, filename, presets) {
        const results = [];
        
        for (const preset of presets) {
            const filePath = `${outputDir}/${filename}_${preset}`;
            try {
                const exportResults = await this.exportWithPreset(objects, canvas, preset, filePath);
                results.push({ preset, results: exportResults });
            } catch (error) {
                results.push({ preset, error: error.message });
            }
        }
        
        return results;
    }

    // Export settings management
    getExportPresets() {
        return this.exportPresets;
    }

    getColorProfiles() {
        return this.colorProfiles;
    }

    createCustomPreset(name, settings) {
        this.exportPresets[name] = settings;
    }

    exportSettings() {
        return {
            presets: this.exportPresets,
            colorProfiles: this.colorProfiles
        };
    }

    importSettings(settings) {
        if (settings.presets) {
            this.exportPresets = { ...this.exportPresets, ...settings.presets };
        }
        if (settings.colorProfiles) {
            this.colorProfiles = { ...this.colorProfiles, ...settings.colorProfiles };
        }
    }
}

module.exports = ProfessionalExport;
