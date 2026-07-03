class PerformanceOptimizer {
    constructor() {
        this.renderQueue = [];
        this.isRendering = false;
        this.lastRenderTime = 0;
        this.renderThrottle = 16; // 60 FPS
        this.maxObjectsPerFrame = 100;
        this.virtualCanvas = null;
        this.offscreenCanvas = null;
        this.objectCache = new Map();
        this.renderCache = new Map();
        this.visibleBounds = { x: 0, y: 0, width: 0, height: 0 };
        this.optimizationLevel = 'medium'; // low, medium, high
        this.frameSkip = 0;
        this.totalFrames = 0;
    }

    initialize(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Create offscreen canvas for double buffering
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = canvas.width;
        this.offscreenCanvas.height = canvas.height;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        
        // Create virtual canvas for large designs
        this.virtualCanvas = document.createElement('canvas');
        this.virtualCanvas.width = 4000; // Large virtual canvas
        this.virtualCanvas.height = 4000;
        this.virtualCtx = this.virtualCanvas.getContext('2d');
    }

    setOptimizationLevel(level) {
        this.optimizationLevel = level;
        
        switch (level) {
            case 'low':
                this.maxObjectsPerFrame = 200;
                this.renderThrottle = 33; // 30 FPS
                break;
            case 'medium':
                this.maxObjectsPerFrame = 100;
                this.renderThrottle = 16; // 60 FPS
                break;
            case 'high':
                this.maxObjectsPerFrame = 50;
                this.renderThrottle = 8; // 120 FPS
                break;
        }
    }

    optimizeRender(objects, zoom, panX, panY) {
        const now = performance.now();
        
        // Throttle rendering
        if (now - this.lastRenderTime < this.renderThrottle) {
            return false;
        }
        
        this.lastRenderTime = now;
        this.totalFrames++;
        
        // Frame skipping for very complex scenes
        if (this.totalFrames % (this.frameSkip + 1) !== 0 && objects.length > this.maxObjectsPerFrame) {
            return false;
        }
        
        // Calculate visible bounds
        this.updateVisibleBounds(zoom, panX, panY);
        
        // Filter visible objects
        const visibleObjects = this.getVisibleObjects(objects);
        
        // Use cached renders if available
        const cacheKey = this.generateCacheKey(visibleObjects, zoom, panX, panY);
        if (this.renderCache.has(cacheKey)) {
            this.applyCachedRender(cacheKey);
            return true;
        }
        
        // Render with optimization
        this.renderOptimized(visibleObjects, zoom, panX, panY);
        
        // Cache the result
        this.cacheRender(cacheKey);
        
        return true;
    }

    updateVisibleBounds(zoom, panX, panY) {
        this.visibleBounds = {
            x: -panX / zoom - 100, // Add padding
            y: -panY / zoom - 100,
            width: (this.canvas.width / zoom) + 200,
            height: (this.canvas.height / zoom) + 200
        };
    }

    getVisibleObjects(objects) {
        return objects.filter(obj => this.isObjectVisible(obj));
    }

    isObjectVisible(obj) {
        // Simple bounding box check
        let objX, objY, objWidth, objHeight;
        
        switch (obj.type) {
            case 'rectangle':
                objX = obj.x;
                objY = obj.y;
                objWidth = obj.width;
                objHeight = obj.height;
                break;
            case 'ellipse':
                objX = obj.x - obj.radiusX;
                objY = obj.y - obj.radiusY;
                objWidth = obj.radiusX * 2;
                objHeight = obj.radiusY * 2;
                break;
            case 'text':
                // Approximate text bounds
                objX = obj.x;
                objY = obj.y;
                objWidth = 200; // Approximate
                objHeight = obj.fontSize || 16;
                break;
            case 'line':
                // Check if line endpoints are visible
                return this.isPointVisible(obj.x1, obj.y1) || this.isPointVisible(obj.x2, obj.y2);
            default:
                return true;
        }
        
        return !(objX + objWidth < this.visibleBounds.x ||
                 objX > this.visibleBounds.x + this.visibleBounds.width ||
                 objY + objHeight < this.visibleBounds.y ||
                 objY > this.visibleBounds.y + this.visibleBounds.height);
    }

    isPointVisible(x, y) {
        return x >= this.visibleBounds.x &&
               x <= this.visibleBounds.x + this.visibleBounds.width &&
               y >= this.visibleBounds.y &&
               y <= this.visibleBounds.y + this.visibleBounds.height;
    }

    renderOptimized(objects, zoom, panX, panY) {
        // Clear offscreen canvas
        this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
        
        // Apply transformations
        this.offscreenCtx.save();
        this.offscreenCtx.translate(panX, panY);
        this.offscreenCtx.scale(zoom, zoom);
        
        // Batch render objects by type for performance
        const batches = this.batchObjectsByType(objects);
        
        for (const [type, batch] of batches) {
            this.renderBatch(this.offscreenCtx, batch, type);
        }
        
        this.offscreenCtx.restore();
        
        // Copy to main canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }

    batchObjectsByType(objects) {
        const batches = new Map();
        
        for (const obj of objects) {
            if (!batches.has(obj.type)) {
                batches.set(obj.type, []);
            }
            batches.get(obj.type).push(obj);
        }
        
        return batches;
    }

    renderBatch(ctx, batch, type) {
        switch (type) {
            case 'rectangle':
                this.renderRectangleBatch(ctx, batch);
                break;
            case 'ellipse':
                this.renderEllipseBatch(ctx, batch);
                break;
            case 'line':
                this.renderLineBatch(ctx, batch);
                break;
            case 'text':
                this.renderTextBatch(ctx, batch);
                break;
            default:
                this.renderGenericBatch(ctx, batch);
        }
    }

    renderRectangleBatch(ctx, rectangles) {
        // Group by fill/stroke properties for efficiency
        const groups = this.groupByProperties(rectangles);
        
        for (const group of groups) {
            ctx.save();
            ctx.globalAlpha = group.opacity || 1;
            
            // Fill all rectangles with same fill
            if (group.fill && group.fill !== 'none') {
                ctx.fillStyle = group.fill;
                for (const rect of group.objects) {
                    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
                }
            }
            
            // Stroke all rectangles with same stroke
            if (group.stroke && group.stroke !== 'none') {
                ctx.strokeStyle = group.stroke;
                ctx.lineWidth = group.strokeWidth || 1;
                for (const rect of group.objects) {
                    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
                }
            }
            
            ctx.restore();
        }
    }

    renderEllipseBatch(ctx, ellipses) {
        const groups = this.groupByProperties(ellipses);
        
        for (const group of groups) {
            ctx.save();
            ctx.globalAlpha = group.opacity || 1;
            
            if (group.fill && group.fill !== 'none') {
                ctx.fillStyle = group.fill;
                for (const ellipse of group.objects) {
                    ctx.beginPath();
                    ctx.ellipse(ellipse.x, ellipse.y, ellipse.radiusX, ellipse.radiusY, 0, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
            
            if (group.stroke && group.stroke !== 'none') {
                ctx.strokeStyle = group.stroke;
                ctx.lineWidth = group.strokeWidth || 1;
                for (const ellipse of group.objects) {
                    ctx.beginPath();
                    ctx.ellipse(ellipse.x, ellipse.y, ellipse.radiusX, ellipse.radiusY, 0, 0, 2 * Math.PI);
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        }
    }

    renderLineBatch(ctx, lines) {
        const groups = this.groupByProperties(lines);
        
        for (const group of groups) {
            ctx.save();
            ctx.globalAlpha = group.opacity || 1;
            ctx.strokeStyle = group.stroke;
            ctx.lineWidth = group.strokeWidth || 1;
            
            ctx.beginPath();
            for (const line of group.objects) {
                ctx.moveTo(line.x1, line.y1);
                ctx.lineTo(line.x2, line.y2);
            }
            ctx.stroke();
            
            ctx.restore();
        }
    }

    renderTextBatch(ctx, texts) {
        for (const text of texts) {
            ctx.save();
            ctx.globalAlpha = text.opacity || 1;
            ctx.fillStyle = text.fill;
            ctx.font = text.font;
            ctx.textAlign = text.textAlign || 'left';
            ctx.textBaseline = 'top';
            
            if (text.maxWidth) {
                this.wrapTextInContext(ctx, text.text, text.x, text.y, text.maxWidth, text.fontSize * (text.lineHeight || 1.2));
            } else {
                ctx.fillText(text.text, text.x, text.y);
            }
            
            ctx.restore();
        }
    }

    renderGenericBatch(ctx, objects) {
        for (const obj of objects) {
            this.renderSingleObject(ctx, obj);
        }
    }

    renderSingleObject(ctx, obj) {
        ctx.save();
        ctx.globalAlpha = obj.opacity || 1;
        
        switch (obj.type) {
            case 'image':
                // Images would need special handling
                break;
            default:
                // Fallback rendering
                break;
        }
        
        ctx.restore();
    }

    groupByProperties(objects) {
        const groups = [];
        
        for (const obj of objects) {
            const key = `${obj.fill || 'none'}_${obj.stroke || 'none'}_${obj.strokeWidth || 1}_${obj.opacity || 1}`;
            
            let group = groups.find(g => g.key === key);
            if (!group) {
                group = {
                    key: key,
                    fill: obj.fill,
                    stroke: obj.stroke,
                    strokeWidth: obj.strokeWidth,
                    opacity: obj.opacity,
                    objects: []
                };
                groups.push(group);
            }
            
            group.objects.push(obj);
        }
        
        return groups;
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

    generateCacheKey(objects, zoom, panX, panY) {
        const objectHash = objects.map(obj => 
            `${obj.type}_${obj.x}_${obj.y}_${obj.fill}_${obj.stroke}`
        ).join('|');
        
        return `${objectHash}_${zoom}_${panX}_${panY}_${this.optimizationLevel}`;
    }

    cacheRender(cacheKey) {
        // Limit cache size
        if (this.renderCache.size > 50) {
            const firstKey = this.renderCache.keys().next().value;
            this.renderCache.delete(firstKey);
        }
        
        // Store canvas data URL
        const dataURL = this.offscreenCanvas.toDataURL();
        this.renderCache.set(cacheKey, {
            dataURL: dataURL,
            timestamp: Date.now()
        });
    }

    applyCachedRender(cacheKey) {
        const cached = this.renderCache.get(cacheKey);
        if (cached) {
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = cached.dataURL;
            return true;
        }
        return false;
    }

    clearCache() {
        this.renderCache.clear();
    }

    // Performance monitoring
    getPerformanceStats() {
        return {
            totalFrames: this.totalFrames,
            cacheSize: this.renderCache.size,
            optimizationLevel: this.optimizationLevel,
            maxObjectsPerFrame: this.maxObjectsPerFrame,
            renderThrottle: this.renderThrottle
        };
    }

    // Memory management
    cleanup() {
        this.clearCache();
        
        if (this.offscreenCanvas) {
            this.offscreenCanvas.width = 1;
            this.offscreenCanvas.height = 1;
        }
        
        if (this.virtualCanvas) {
            this.virtualCanvas.width = 1;
            this.virtualCanvas.height = 1;
        }
        
        this.objectCache.clear();
    }

    // Adaptive performance
    adaptPerformance(objectCount) {
        if (objectCount > 500) {
            this.setOptimizationLevel('high');
            this.frameSkip = 2;
        } else if (objectCount > 200) {
            this.setOptimizationLevel('medium');
            this.frameSkip = 1;
        } else {
            this.setOptimizationLevel('low');
            this.frameSkip = 0;
        }
    }

    // LOD (Level of Detail) system
    getLODLevel(zoom) {
        if (zoom < 0.5) return 'low';
        if (zoom < 1.0) return 'medium';
        return 'high';
    }

    applyLOD(objects, lodLevel) {
        return objects.map(obj => {
            if (lodLevel === 'low') {
                // Simplify object for distant view
                return this.simplifyObject(obj);
            } else if (lodLevel === 'medium') {
                // Medium detail
                return obj;
            } else {
                // Full detail
                return obj;
            }
        });
    }

    simplifyObject(obj) {
        const simplified = { ...obj };
        
        switch (obj.type) {
            case 'text':
                // Simplify text rendering
                simplified.font = '12px Arial';
                simplified.maxWidth = undefined;
                break;
            case 'ellipse':
                // Convert to circle if very small
                if (Math.abs(obj.radiusX - obj.radiusY) < 5) {
                    simplified.radiusX = simplified.radiusY = (obj.radiusX + obj.radiusY) / 2;
                }
                break;
        }
        
        return simplified;
    }
}

module.exports = PerformanceOptimizer;
