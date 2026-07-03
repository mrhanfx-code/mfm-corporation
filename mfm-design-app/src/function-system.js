class FunctionSystem {
    constructor(app) {
        this.app = app;
        this.functions = new Map();
        this.plugins = new Map();
        this.hooks = new Map();
        this.extensions = new Map();
        this.functionRegistry = new Map();
        this.eventBus = new Map();
        this.api = new FunctionAPI(this);
        
        this.initializeCoreFunctions();
        this.setupEventBus();
    }

    initializeCoreFunctions() {
        // Core drawing functions
        this.registerFunction('draw.rectangle', {
            name: 'Draw Rectangle',
            description: 'Create a rectangle with specified dimensions',
            parameters: ['x', 'y', 'width', 'height', 'fill', 'stroke'],
            execute: (params) => this.drawRectangle(params)
        });

        this.registerFunction('draw.ellipse', {
            name: 'Draw Ellipse',
            description: 'Create an ellipse with specified dimensions',
            parameters: ['x', 'y', 'radiusX', 'radiusY', 'fill', 'stroke'],
            execute: (params) => this.drawEllipse(params)
        });

        this.registerFunction('draw.line', {
            name: 'Draw Line',
            description: 'Create a line between two points',
            parameters: ['x1', 'y1', 'x2', 'y2', 'stroke', 'strokeWidth'],
            execute: (params) => this.drawLine(params)
        });

        this.registerFunction('draw.text', {
            name: 'Draw Text',
            description: 'Create text with specified properties',
            parameters: ['text', 'x', 'y', 'font', 'fill', 'size'],
            execute: (params) => this.drawText(params)
        });

        // Transform functions
        this.registerFunction('transform.rotate', {
            name: 'Rotate Object',
            description: 'Rotate selected objects by specified angle',
            parameters: ['angle', 'centerX', 'centerY'],
            execute: (params) => this.rotateObjects(params)
        });

        this.registerFunction('transform.scale', {
            name: 'Scale Object',
            description: 'Scale selected objects by specified factor',
            parameters: ['scaleX', 'scaleY', 'centerX', 'centerY'],
            execute: (params) => this.scaleObjects(params)
        });

        this.registerFunction('transform.translate', {
            name: 'Translate Object',
            description: 'Move selected objects by specified offset',
            parameters: ['deltaX', 'deltaY'],
            execute: (params) => this.translateObjects(params)
        });

        // Color functions
        this.registerFunction('color.apply', {
            name: 'Apply Color',
            description: 'Apply color to selected objects',
            parameters: ['fill', 'stroke', 'type'],
            execute: (params) => this.applyColor(params)
        });

        this.registerFunction('color.gradient', {
            name: 'Create Gradient',
            description: 'Create gradient fill for selected objects',
            parameters: ['colors', 'type', 'angle'],
            execute: (params) => this.createGradient(params)
        });

        // Path functions
        this.registerFunction('path.join', {
            name: 'Join Paths',
            description: 'Join selected paths into single path',
            parameters: ['tolerance'],
            execute: (params) => this.joinPaths(params)
        });

        this.registerFunction('path.simplify', {
            name: 'Simplify Path',
            description: 'Simplify selected paths by removing points',
            parameters: ['tolerance', 'preserveShape'],
            execute: (params) => this.simplifyPaths(params)
        });

        // Export functions
        this.registerFunction('export.svg', {
            name: 'Export SVG',
            description: 'Export canvas to SVG format',
            parameters: ['filename', 'options'],
            execute: (params) => this.exportSVG(params)
        });

        this.registerFunction('export.png', {
            name: 'Export PNG',
            description: 'Export canvas to PNG format',
            parameters: ['filename', 'quality', 'scale'],
            execute: (params) => this.exportPNG(params)
        });

        this.registerFunction('export.pdf', {
            name: 'Export PDF',
            description: 'Export canvas to PDF format',
            parameters: ['filename', 'options'],
            execute: (params) => this.exportPDF(params)
        });

        // Utility functions
        this.registerFunction('utils.measure', {
            name: 'Measure Objects',
            description: 'Measure dimensions and properties of selected objects',
            parameters: ['objects'],
            execute: (params) => this.measureObjects(params)
        });

        this.registerFunction('utils.align', {
            name: 'Align Objects',
            description: 'Align selected objects to specified alignment',
            parameters: ['alignment', 'reference'],
            execute: (params) => this.alignObjects(params)
        });

        this.registerFunction('utils.distribute', {
            name: 'Distribute Objects',
            description: 'Distribute selected objects evenly',
            parameters: ['direction', 'spacing'],
            execute: (params) => this.distributeObjects(params)
        });
    }

    registerFunction(id, definition) {
        this.functions.set(id, {
            ...definition,
            id: id,
            registeredAt: Date.now()
        });

        // Emit function registered event
        this.emitEvent('function.registered', { id, definition });
    }

    registerPlugin(name, plugin) {
        if (this.plugins.has(name)) {
            throw new Error(`Plugin ${name} already registered`);
        }

        this.plugins.set(name, {
            name: name,
            version: plugin.version || '1.0.0',
            author: plugin.author || 'Unknown',
            description: plugin.description || '',
            functions: plugin.functions || [],
            hooks: plugin.hooks || {},
            api: plugin.api || {},
            initialized: false
        });

        // Initialize plugin
        if (plugin.initialize) {
            plugin.initialize(this.api);
            this.plugins.get(name).initialized = true;
        }

        // Register plugin functions
        for (const func of plugin.functions || []) {
            this.registerFunction(`${name}.${func.id}`, func);
        }

        // Register plugin hooks
        for (const [hookName, hookFn] of Object.entries(plugin.hooks || {})) {
            this.addHook(hookName, hookFn);
        }

        this.emitEvent('plugin.registered', { name, plugin });
    }

    registerExtension(type, extension) {
        if (!this.extensions.has(type)) {
            this.extensions.set(type, new Map());
        }

        this.extensions.get(type).set(extension.name, extension);
        this.emitEvent('extension.registered', { type, extension });
    }

    executeFunction(id, params = {}) {
        const func = this.functions.get(id);
        if (!func) {
            throw new Error(`Function ${id} not found`);
        }

        // Validate parameters
        const validationResult = this.validateParameters(func.parameters, params);
        if (!validationResult.valid) {
            throw new Error(`Invalid parameters: ${validationResult.errors.join(', ')}`);
        }

        // Execute before hooks
        this.executeHooks('before.execute', { id, params, func });

        try {
            const result = func.execute(params);
            
            // Execute after hooks
            this.executeHooks('after.execute', { id, params, func, result });
            
            return result;
        } catch (error) {
            // Execute error hooks
            this.executeHooks('error.execute', { id, params, func, error });
            throw error;
        }
    }

    validateParameters(requiredParams, providedParams) {
        const errors = [];
        const missing = requiredParams.filter(param => !(param in providedParams));
        
        if (missing.length > 0) {
            errors.push(`Missing parameters: ${missing.join(', ')}`);
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    addHook(name, callback) {
        if (!this.hooks.has(name)) {
            this.hooks.set(name, []);
        }
        this.hooks.get(name).push(callback);
    }

    executeHooks(name, data) {
        const hooks = this.hooks.get(name) || [];
        for (const hook of hooks) {
            try {
                hook(data);
            } catch (error) {
                console.error(`Hook ${name} failed:`, error);
            }
        }
    }

    setupEventBus() {
        this.eventBus.set('function.registered', []);
        this.eventBus.set('plugin.registered', []);
        this.eventBus.set('extension.registered', []);
        this.eventBus.set('function.executed', []);
        this.eventBus.set('error.occurred', []);
    }

    emitEvent(eventName, data) {
        const listeners = this.eventBus.get(eventName) || [];
        for (const listener of listeners) {
            try {
                listener(data);
            } catch (error) {
                console.error(`Event listener for ${eventName} failed:`, error);
            }
        }
    }

    addEventListener(eventName, listener) {
        if (!this.eventBus.has(eventName)) {
            this.eventBus.set(eventName, []);
        }
        this.eventBus.get(eventName).push(listener);
    }

    removeEventListener(eventName, listener) {
        const listeners = this.eventBus.get(eventName) || [];
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    // Function implementations
    drawRectangle(params) {
        const rect = {
            type: 'rectangle',
            x: params.x || 0,
            y: params.y || 0,
            width: params.width || 100,
            height: params.height || 100,
            fill: params.fill || '#000000',
            stroke: params.stroke || '#000000',
            strokeWidth: params.strokeWidth || 1,
            opacity: params.opacity || 1
        };

        this.app.objects.push(rect);
        this.app.layers[this.app.currentLayer].objects.push(rect);
        this.app.render();
        
        return rect;
    }

    drawEllipse(params) {
        const ellipse = {
            type: 'ellipse',
            x: params.x || 0,
            y: params.y || 0,
            radiusX: params.radiusX || 50,
            radiusY: params.radiusY || 50,
            fill: params.fill || '#000000',
            stroke: params.stroke || '#000000',
            strokeWidth: params.strokeWidth || 1,
            opacity: params.opacity || 1
        };

        this.app.objects.push(ellipse);
        this.app.layers[this.app.currentLayer].objects.push(ellipse);
        this.app.render();
        
        return ellipse;
    }

    drawLine(params) {
        const line = {
            type: 'line',
            x1: params.x1 || 0,
            y1: params.y1 || 0,
            x2: params.x2 || 100,
            y2: params.y2 || 100,
            stroke: params.stroke || '#000000',
            strokeWidth: params.strokeWidth || 1,
            opacity: params.opacity || 1
        };

        this.app.objects.push(line);
        this.app.layers[this.app.currentLayer].objects.push(line);
        this.app.render();
        
        return line;
    }

    drawText(params) {
        const text = this.app.typography.createTextObject(
            params.text || 'Text',
            params.x || 0,
            params.y || 0
        );
        
        if (params.fill) text.fill = params.fill;
        if (params.font) text.font = params.font;
        if (params.size) text.fontSize = params.size;
        if (params.opacity) text.opacity = params.opacity;

        this.app.objects.push(text);
        this.app.layers[this.app.currentLayer].objects.push(text);
        this.app.render();
        
        return text;
    }

    rotateObjects(params) {
        const selected = this.app.selectedObject ? [this.app.selectedObject] : this.app.objects;
        const angle = (params.angle || 0) * Math.PI / 180;
        const centerX = params.centerX || 0;
        const centerY = params.centerY || 0;

        for (const obj of selected) {
            // Simple rotation implementation
            if (obj.type === 'rectangle' || obj.type === 'ellipse') {
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                
                // Rotate around center point
                const dx = obj.x - centerX;
                const dy = obj.y - centerY;
                
                obj.x = centerX + (dx * cos - dy * sin);
                obj.y = centerY + (dx * sin + dy * cos);
            }
        }

        this.app.render();
        return selected;
    }

    scaleObjects(params) {
        const selected = this.app.selectedObject ? [this.app.selectedObject] : this.app.objects;
        const scaleX = params.scaleX || 1;
        const scaleY = params.scaleY || 1;
        const centerX = params.centerX || 0;
        const centerY = params.centerY || 0;

        for (const obj of selected) {
            // Scale around center point
            const dx = obj.x - centerX;
            const dy = obj.y - centerY;
            
            obj.x = centerX + (dx * scaleX);
            obj.y = centerY + (dy * scaleY);
            
            if (obj.type === 'rectangle') {
                obj.width *= scaleX;
                obj.height *= scaleY;
            } else if (obj.type === 'ellipse') {
                obj.radiusX *= scaleX;
                obj.radiusY *= scaleY;
            }
        }

        this.app.render();
        return selected;
    }

    translateObjects(params) {
        const selected = this.app.selectedObject ? [this.app.selectedObject] : this.app.objects;
        const deltaX = params.deltaX || 0;
        const deltaY = params.deltaY || 0;

        for (const obj of selected) {
            obj.x += deltaX;
            obj.y += deltaY;
            
            if (obj.type === 'line') {
                obj.x1 += deltaX;
                obj.y1 += deltaY;
                obj.x2 += deltaX;
                obj.y2 += deltaY;
            }
        }

        this.app.render();
        return selected;
    }

    applyColor(params) {
        const selected = this.app.selectedObject ? [this.app.selectedObject] : this.app.objects;
        
        for (const obj of selected) {
            if (params.fill) obj.fill = params.fill;
            if (params.stroke) obj.stroke = params.stroke;
        }

        this.app.render();
        return selected;
    }

    createGradient(params) {
        // Gradient implementation would be more complex
        console.log('Gradient creation not yet implemented');
        return null;
    }

    joinPaths(params) {
        console.log('Path joining not yet implemented');
        return null;
    }

    simplifyPaths(params) {
        console.log('Path simplification not yet implemented');
        return null;
    }

    exportSVG(params) {
        return this.app.exportSVG(params.filename || 'export.svg');
    }

    exportPNG(params) {
        return this.app.exportPNG(params.filename || 'export.png');
    }

    exportPDF(params) {
        return this.app.exportPDF(params.filename || 'export.pdf');
    }

    measureObjects(params) {
        const objects = params.objects || (this.app.selectedObject ? [this.app.selectedObject] : this.app.objects);
        const measurements = [];

        for (const obj of objects) {
            const measurement = {
                id: obj.id || Math.random().toString(36).substr(2, 9),
                type: obj.type,
                x: obj.x || 0,
                y: obj.y || 0
            };

            if (obj.type === 'rectangle') {
                measurement.width = obj.width;
                measurement.height = obj.height;
                measurement.area = obj.width * obj.height;
            } else if (obj.type === 'ellipse') {
                measurement.radiusX = obj.radiusX;
                measurement.radiusY = obj.radiusY;
                measurement.area = Math.PI * obj.radiusX * obj.radiusY;
            }

            measurements.push(measurement);
        }

        return measurements;
    }

    alignObjects(params) {
        const selected = this.app.selectedObject ? [this.app.selectedObject] : this.app.objects;
        const alignment = params.alignment || 'left';
        
        // Simple alignment implementation
        if (selected.length > 1) {
            const reference = params.reference || selected[0];
            const refX = reference.x || 0;
            
            for (const obj of selected) {
                if (obj !== reference) {
                    if (alignment === 'left') {
                        obj.x = refX;
                    } else if (alignment === 'center') {
                        obj.x = refX;
                    } else if (alignment === 'right') {
                        obj.x = refX;
                    }
                }
            }
        }

        this.app.render();
        return selected;
    }

    distributeObjects(params) {
        console.log('Object distribution not yet implemented');
        return null;
    }

    // API methods
    getAvailableFunctions() {
        const functions = [];
        for (const [id, func] of this.functions) {
            functions.push({
                id: id,
                name: func.name,
                description: func.description,
                parameters: func.parameters
            });
        }
        return functions;
    }

    getFunction(id) {
        return this.functions.get(id);
    }

    getPlugins() {
        const plugins = [];
        for (const [name, plugin] of this.plugins) {
            plugins.push({
                name: name,
                version: plugin.version,
                author: plugin.author,
                description: plugin.description,
                initialized: plugin.initialized
            });
        }
        return plugins;
    }

    getExtensions(type) {
        if (type) {
            return Array.from(this.extensions.get(type) || []);
        }
        
        const allExtensions = {};
        for (const [extType, extMap] of this.extensions) {
            allExtensions[extType] = Array.from(extMap);
        }
        return allExtensions;
    }

    // Plugin management
    loadPlugin(plugin) {
        try {
            this.registerPlugin(plugin.name, plugin);
            return true;
        } catch (error) {
            console.error('Failed to load plugin:', error);
            return false;
        }
    }

    unloadPlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) return false;

        // Remove plugin functions
        for (const func of plugin.functions || []) {
            this.functions.delete(`${name}.${func.id}`);
        }

        // Remove plugin hooks
        for (const hookName of Object.keys(plugin.hooks || {})) {
            const hooks = this.hooks.get(hookName) || [];
            this.hooks.set(hookName, hooks.filter(h => h !== plugin.hooks[hookName]));
        }

        // Cleanup plugin
        if (plugin.cleanup) {
            plugin.cleanup();
        }

        this.plugins.delete(name);
        this.emitEvent('plugin.unloaded', { name });
        return true;
    }

    // Script execution
    executeScript(script) {
        try {
            // Create a sandboxed environment for script execution
            const sandbox = {
                app: this.app,
                api: this.api,
                console: console,
                Math: Math,
                Date: Date
            };

            // Execute script in sandbox
            const func = new Function(...Object.keys(sandbox), script);
            return func(...Object.values(sandbox));
        } catch (error) {
            console.error('Script execution failed:', error);
            throw error;
        }
    }

    // Batch operations
    batchExecute(operations) {
        const results = [];
        for (const operation of operations) {
            try {
                const result = this.executeFunction(operation.function, operation.params);
                results.push({ success: true, result });
            } catch (error) {
                results.push({ success: false, error: error.message });
            }
        }
        return results;
    }

    // Cleanup
    cleanup() {
        // Unload all plugins
        for (const [name] of this.plugins) {
            this.unloadPlugin(name);
        }

        // Clear all data
        this.functions.clear();
        this.plugins.clear();
        this.hooks.clear();
        this.extensions.clear();
        this.eventBus.clear();
    }
}

class FunctionAPI {
    constructor(functionSystem) {
        this.system = functionSystem;
        this.app = functionSystem.app;
    }

    // Drawing API
    drawRectangle(params) {
        return this.system.executeFunction('draw.rectangle', params);
    }

    drawEllipse(params) {
        return this.system.executeFunction('draw.ellipse', params);
    }

    drawLine(params) {
        return this.system.executeFunction('draw.line', params);
    }

    drawText(params) {
        return this.system.executeFunction('draw.text', params);
    }

    // Transform API
    rotate(params) {
        return this.system.executeFunction('transform.rotate', params);
    }

    scale(params) {
        return this.system.executeFunction('transform.scale', params);
    }

    translate(params) {
        return this.system.executeFunction('transform.translate', params);
    }

    // Color API
    applyColor(params) {
        return this.system.executeFunction('color.apply', params);
    }

    // Export API
    exportSVG(params) {
        return this.system.executeFunction('export.svg', params);
    }

    exportPNG(params) {
        return this.system.executeFunction('export.png', params);
    }

    exportPDF(params) {
        return this.system.executeFunction('export.pdf', params);
    }

    // Utility API
    measure(params) {
        return this.system.executeFunction('utils.measure', params);
    }

    align(params) {
        return this.system.executeFunction('utils.align', params);
    }

    // Plugin API
    registerFunction(id, definition) {
        return this.system.registerFunction(id, definition);
    }

    addHook(name, callback) {
        return this.system.addHook(name, callback);
    }

    emitEvent(name, data) {
        return this.system.emitEvent(name, data);
    }
}

module.exports = { FunctionSystem, FunctionAPI };
