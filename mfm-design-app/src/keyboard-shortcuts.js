class KeyboardShortcuts {
    constructor(app) {
        this.app = app;
        this.shortcuts = new Map();
        this.modifierKeys = {
            ctrl: false,
            shift: false,
            alt: false,
            meta: false
        };
        
        this.initializeShortcuts();
        this.setupEventListeners();
    }

    initializeShortcuts() {
        // File operations (Adobe Illustrator CS6 style)
        this.addShortcut('ctrl+n', () => this.app.newFile());
        this.addShortcut('ctrl+o', () => this.app.openFileDialog());
        this.addShortcut('ctrl+s', () => this.app.saveFile());
        this.addShortcut('ctrl+shift+s', () => this.app.saveAsFile());
        this.addShortcut('ctrl+alt+s', () => this.app.saveACopy());
        this.addShortcut('ctrl+e', () => this.app.exportFileDialog());
        this.addShortcut('ctrl+shift+e', () => this.app.exportSelection());
        this.addShortcut('ctrl+p', () => this.app.printDocument());
        this.addShortcut('ctrl+alt+p', () => this.app.printSetup());
        
        // Edit operations (Adobe Illustrator CS6 style)
        this.addShortcut('ctrl+z', () => this.app.undo());
        this.addShortcut('ctrl+shift+z', () => this.app.redo());
        this.addShortcut('ctrl+x', () => this.app.cut());
        this.addShortcut('ctrl+c', () => this.app.copy());
        this.addShortcut('ctrl+v', () => this.app.paste());
        this.addShortcut('ctrl+f', () => this.app.pasteInFront());
        this.addShortcut('ctrl+b', () => this.app.pasteInBack());
        this.addShortcut('ctrl+d', () => this.app.duplicate());
        this.addShortcut('ctrl+shift+d', () => this.app.duplicateInPlace());
        this.addShortcut('delete', () => this.app.deleteSelected());
        this.addShortcut('backspace', () => this.app.deleteSelected());
        this.addShortcut('ctrl+shift+o', () => this.app.pathOutline());
        this.addShortcut('ctrl+shift+c', () => this.app.createClippingMask());
        this.addShortcut('ctrl+alt+7', () => this.app.releaseClippingMask());
        this.addShortcut('ctrl+8', () => this.app.makeCompoundPath());
        this.addShortcut('ctrl+alt+8', () => this.app.releaseCompoundPath());
        
        // View operations (Adobe Illustrator CS6 style)
        this.addShortcut('ctrl+plus', () => this.app.zoomIn());
        this.addShortcut('ctrl+minus', () => this.app.zoomOut());
        this.addShortcut('ctrl+0', () => this.app.zoomToFit());
        this.addShortcut('ctrl+1', () => this.app.zoomToActualSize());
        this.addShortcut('ctrl+2', () => this.app.zoomToSelection());
        this.addShortcut('ctrl+3', () => this.app.zoomToAll());
        this.addShortcut('ctrl+5', () => this.app.zoomToFillWindow());
        this.addShortcut('ctrl+alt+3', () => this.app.hideBoundingBoxes());
        this.addShortcut('ctrl+h', () => this.app.hideEdges());
        this.addShortcut('ctrl+shift+h', () => this.app.hideTemplate());
        this.addShortcut('ctrl+r', () => this.app.showRulers());
        this.addShortcut('ctrl+;', () => this.app.showGuides());
        this.addShortcut('ctrl+alt+;', () => this.app.lockGuides());
        this.addShortcut('ctrl+5', () => this.app.showGrid());
        this.addShortcut('ctrl+alt+5', () => this.app.snapToGrid());
        this.addShortcut('ctrl+alt+g', () => this.app.snapToPoint());
        this.addShortcut('ctrl+shift+b', () => this.app.showBoundingBoxes());
        this.addShortcut('ctrl+shift+u', () => this.app.showTransparencyGrid());
        this.addShortcut('ctrl+y', () => this.app.previewMode());
        this.addShortcut('ctrl+alt+y', () => this.app.overprintPreview());
        this.addShortcut('ctrl+shift+y', () => this.app.pixelPreview());
        
        // Tool selection (Adobe Illustrator CS6 style)
        this.addShortcut('v', () => this.app.selectTool('select'));
        this.addShortcut('a', () => this.app.selectTool('directSelect'));
        this.addShortcut('y', () => this.app.selectTool('magicWand'));
        this.addShortcut('q', () => this.app.selectTool('lasso'));
        this.addShortcut('g', () => this.app.selectTool('pen'));
        this.addShortcut('p', () => this.app.selectTool('pencil'));
        this.addShortcut('t', () => this.app.selectTool('type'));
        this.addShortcut('m', () => this.app.selectTool('rectangle'));
        this.addShortcut('l', () => this.app.selectTool('ellipse'));
        this.addShortcut('n', () => this.app.selectTool('polygon'));
        this.addShortcut('j', () => this.app.selectTool('star'));
        this.addShortcut('f', () => this.app.selectTool('flare'));
        this.addShortcut('i', () => this.app.selectTool('eyedropper'));
        this.addShortcut('h', () => this.app.selectTool('hand'));
        this.addShortcut('z', () => this.app.selectTool('zoom'));
        this.addShortcut('b', () => this.app.selectTool('brush'));
        this.addShortcut('shift+b', () => this.app.selectTool('paintbrush'));
        this.addShortcut('e', () => this.app.selectTool('eraser'));
        this.addShortcut('r', () => this.app.selectTool('rotate'));
        this.addShortcut('s', () => this.app.selectTool('scale'));
        this.addShortcut('o', () => this.app.selectTool('reflect'));
        this.addShortcut('c', () => this.app.selectTool('column'));
        this.addShortcut('x', () => this.app.selectTool('crystallize'));
        this.addShortcut('w', () => this.app.selectTool('width'));
        this.addShortcut('u', () => this.app.selectTool('warp'));
        this.addShortcut('shift+p', () => this.app.selectTool('perspective'));
        this.addShortcut('k', () => this.app.selectTool('symbolSprayer'));
        this.addShortcut('shift+l', () => this.app.selectTool('symbolScreener'));
        this.addShortcut('shift+s', () => this.app.selectTool('symbolStainer'));
        this.addShortcut('shift+f', () => this.app.selectTool('symbolStyler'));
        this.addShortcut('shift+c', () => this.app.selectTool('symbolShifter'));
        this.addShortcut('shift+e', () => this.app.selectTool('symbolScruncher'));
        this.addShortcut('shift+r', () => this.app.selectTool('symbolSpinner'));
        this.addShortcut('shift+w', () => this.app.selectTool('symbolSizer'));
        this.addShortcut('shift+d', () => this.app.selectTool('symbolSet'));
        this.addShortcut('j', () => this.app.selectTool('slice'));
        this.addShortcut('shift+k', () => this.app.selectTool('erasaser'));
        this.addShortcut('shift+o', () => this.app.selectTool('artboard'));
        
        // Object operations (Adobe Illustrator CS6 style)
        this.addShortcut('ctrl+g', () => this.app.groupSelected());
        this.addShortcut('ctrl+shift+g', () => this.app.ungroupSelected());
        this.addShortcut('ctrl+7', () => this.app.makeClippingMask());
        this.addShortcut('ctrl+alt+7', () => this.app.releaseClippingMask());
        this.addShortcut('ctrl+8', () => this.app.makeCompoundPath());
        this.addShortcut('ctrl+alt+8', () => this.app.releaseCompoundPath());
        this.addShortcut('ctrl+2', () => this.app.lockSelection());
        this.addShortcut('ctrl+alt+2', () => this.app.unlockAll());
        this.addShortcut('ctrl+3', () => this.app.hideSelection());
        this.addShortcut('ctrl+alt+3', () => this.app.showAll());
        this.addShortcut('shift+ctrl+3', () => this.app.showAllOnActiveLayer());
        
        // Arrange operations (Adobe Illustrator CS6 style)
        this.addShortcut('shift+ctrl+]', () => this.app.bringToFront());
        this.addShortcut('shift+ctrl+[', () => this.app.sendToBack());
        this.addShortcut('ctrl+]', () => this.app.bringForward());
        this.addShortcut('ctrl+[', () => this.app.sendBackward());
        this.addShortcut('ctrl+alt+]', () => this.app.bringForwardToNextLayer());
        this.addShortcut('ctrl+alt+[', () => this.app.sendBackwardToPreviousLayer());
        
        // Path operations (Adobe Illustrator CS6 style)
        this.addShortcut('ctrl+j', () => this.app.joinPaths());
        this.addShortcut('ctrl+shift+j', () => this.app.averagePaths());
        this.addShortcut('ctrl+alt+j', () => this.app.joinPathsSmooth());
        this.addShortcut('ctrl+shift+m', () => this.app.makeMask());
        this.addShortcut('ctrl+alt+m', () => this.app.releaseMask());
        this.addShortcut('ctrl+shift+p', () => this.app.pathfinderPanel());
        this.addShortcut('ctrl+9', () => this.app.pathfinderUnite());
        this.addShortcut('ctrl+alt+9', () => this.app.pathfinderMinusFront());
        this.addShortcut('ctrl+8', () => this.app.pathfinderIntersect());
        this.addShortcut('ctrl+alt+8', () => this.app.pathfinderExclude());
        
        // Type operations (Adobe Illustrator CS6 style)
        this.addShortcut('ctrl+shift+t', () => this.app.createOutlines());
        this.addShortcut('ctrl+shift+o', () => this.app.findFont());
        this.addShortcut('ctrl+shift+left', () => this.app.decreaseTypeSize());
        this.addShortcut('ctrl+shift+right', () => this.app.increaseTypeSize());
        this.addShortcut('ctrl+alt+left', () => this.app.decreaseLeading());
        this.addShortcut('ctrl+alt+right', () => this.app.increaseLeading());
        this.addShortcut('ctrl+alt+up', () => this.app.resetLeading());
        this.addShortcut('ctrl+shift+up', () => this.app.superscript());
        this.addShortcut('ctrl+shift+down', () => this.app.subscript());
        this.addShortcut('ctrl+alt+up', () => this.app.normalScript());
        this.addShortcut('ctrl+shift+k', () => this.app.trackKerning());
        this.addShortcut('ctrl+alt+k', () => this.app.resetKerning());
        this.addShortcut('ctrl+shift+>', () => this.app.increaseTracking());
        this.addShortcut('ctrl+alt+>', () => this.app.decreaseTracking());
        this.addShortcut('ctrl+shift+x', () => this.app.flipHorizontal());
        this.addShortcut('ctrl+shift+o', () => this.app.flipVertical());
        this.addShortcut('ctrl+shift+c', () => this.app.centerText());
        this.addShortcut('ctrl+shift+l', () => this.app.leftAlignText());
        this.addShortcut('ctrl+shift+r', () => this.app.rightAlignText());
        this.addShortcut('ctrl+shift+j', () => this.app.justifyText());
        
        // Transform operations (Adobe Illustrator CS6 style)
        this.addShortcut('shift+o', () => this.app.transformAgain());
        this.addShortcut('ctrl+d', () => this.app.transformAgainIndividually());
        this.addShortcut('ctrl+shift+d', () => this.app.moveCopy());
        this.addShortcut('ctrl+alt+d', () => this.app.transformPattern());
        this.addShortcut('ctrl+alt+shift+d', () => this.app.transformEachPattern());
        
        // Selection operations (Adobe Illustrator CS6 style)
        this.addShortcut('ctrl+a', () => this.app.selectAll());
        this.addShortcut('ctrl+shift+a', () => this.app.deselectAll());
        this.addShortcut('ctrl+alt+a', () => this.app.selectAllOnActiveArtboard());
        this.addShortcut('ctrl+6', () => this.app.selectSameAppearance());
        this.addShortcut('ctrl+alt+6', () => this.app.selectSameFillColor());
        this.addShortcut('ctrl+shift+6', () => this.app.selectSameStrokeColor());
        this.addShortcut('ctrl+7', () => this.app.selectSameStrokeWeight());
        this.addShortcut('ctrl+alt+7', () => this.app.selectSameStyle());
        this.addShortcut('ctrl+f8', () => this.app.selectSameSymbol());
        this.addShortcut('ctrl+alt+f8', () => this.app.selectObjectByName());
        
        // Panel operations (Adobe Illustrator CS6 style)
        this.addShortcut('f5', () => this.app.showBrushesPanel());
        this.addShortcut('f6', () => this.app.showColorPanel());
        this.addShortcut('shift+f6', () => this.app.showColorGuidePanel());
        this.addShortcut('f7', () => this.app.showLayersPanel());
        this.addShortcut('shift+f7', () => this.app.showAppearancePanel());
        this.addShortcut('f8', () => this.app.showSymbolsPanel());
        this.addShortcut('shift+f8', () => this.app.showActionsPanel());
        this.addShortcut('f9', () => this.app.showGraphicStylesPanel());
        this.addShortcut('shift+f9', () => this.app.showAlignPanel());
        this.addShortcut('f10', () => this.app.showAttributesPanel());
        this.addShortcut('shift+f10', () => this.app.showPathfinderPanel());
        this.addShortcut('f11', () => this.app.showTransparencyPanel());
        this.addShortcut('shift+f11', () => this.app.showGradientPanel());
        this.addShortcut('f12', () => this.app.showStrokePanel());
        this.addShortcut('shift+f12', () => this.app.showCharacterPanel());
        this.addShortcut('ctrl+f10', () => this.app.showParagraphPanel());
        this.addShortcut('ctrl+f11', () => this.app.showOpenTypePanel());
        this.addShortcut('ctrl+f12', () => this.app.showGlyphsPanel());
        this.addShortcut('ctrl+shift+f11', () => this.app.showTabsPanel());
        this.addShortcut('ctrl+shift+f12', () => this.app.showCharacterStylesPanel());
        this.addShortcut('ctrl+alt+f12', () => this.app.showParagraphStylesPanel());
        
        // Workspace operations (Adobe Illustrator CS6 style)
        this.addShortcut('ctrl+alt+w', () => this.app.showWorkspaceMenu());
        this.addShortcut('ctrl+shift+w', () => this.app.newWorkspace());
        this.addShortcut('ctrl+alt+shift+w', () => this.app.deleteWorkspace());
        
        // Help operations (Adobe Illustrator CS6 style)
        this.addShortcut('f1', () => this.app.showHelp());
        this.addShortcut('ctrl+f1', () => this.app.showKeyboardShortcuts());
        
        // Escape key
        this.addShortcut('escape', () => this.app.escape());
        
        // Space bar for pan (when held down)
        this.addShortcut('space', () => this.app.togglePanMode());
    }

    addShortcut(key, callback) {
        this.shortcuts.set(key.toLowerCase(), callback);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Prevent default browser shortcuts
        document.addEventListener('keydown', (e) => {
            const key = this.getKeyString(e);
            if (this.shortcuts.has(key)) {
                e.preventDefault();
            }
        });
    }

    handleKeyDown(e) {
        // Update modifier keys state
        this.modifierKeys.ctrl = e.ctrlKey || e.metaKey;
        this.modifierKeys.shift = e.shiftKey;
        this.modifierKeys.alt = e.altKey;
        this.modifierKeys.meta = e.metaKey;
        
        const key = this.getKeyString(e);
        const callback = this.shortcuts.get(key);
        
        if (callback) {
            callback();
        }
    }

    handleKeyUp(e) {
        // Update modifier keys state
        this.modifierKeys.ctrl = e.ctrlKey || e.metaKey;
        this.modifierKeys.shift = e.shiftKey;
        this.modifierKeys.alt = e.altKey;
        this.modifierKeys.meta = e.metaKey;
    }

    getKeyString(e) {
        const parts = [];
        
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        
        let key = e.key.toLowerCase();
        
        // Handle special keys
        const specialKeys = {
            ' ': 'space',
            'arrowup': 'up',
            'arrowdown': 'down',
            'arrowleft': 'left',
            'arrowright': 'right',
            'escape': 'escape',
            'delete': 'delete',
            'backspace': 'backspace',
            'enter': 'enter',
            'tab': 'tab',
            'capslock': 'capslock',
            'numlock': 'numlock',
            'scrolllock': 'scrolllock',
            'pause': 'pause',
            'insert': 'insert',
            'home': 'home',
            'end': 'end',
            'pageup': 'pageup',
            'pagedown': 'pagedown',
            'f1': 'f1', 'f2': 'f2', 'f3': 'f3', 'f4': 'f4',
            'f5': 'f5', 'f6': 'f6', 'f7': 'f7', 'f8': 'f8',
            'f9': 'f9', 'f10': 'f10', 'f11': 'f11', 'f12': 'f12'
        };
        
        if (specialKeys[key]) {
            key = specialKeys[key];
        } else if (key.length === 1 && !e.shiftKey) {
            key = key.toLowerCase();
        }
        
        parts.push(key);
        
        return parts.join('+');
    }

    // Context-aware shortcuts
    addContextShortcut(context, key, callback) {
        if (!this.contextShortcuts) {
            this.contextShortcuts = new Map();
        }
        
        if (!this.contextShortcuts.has(context)) {
            this.contextShortcuts.set(context, new Map());
        }
        
        this.contextShortcuts.get(context).set(key.toLowerCase(), callback);
    }

    executeContextShortcut(context, key) {
        if (!this.contextShortcuts || !this.contextShortcuts.has(context)) {
            return false;
        }
        
        const callback = this.contextShortcuts.get(context).get(key.toLowerCase());
        if (callback) {
            callback();
            return true;
        }
        
        return false;
    }

    // Custom shortcut management
    addCustomShortcut(key, callback, description) {
        this.addShortcut(key, callback);
        
        if (!this.customShortcuts) {
            this.customShortcuts = new Map();
        }
        
        this.customShortcuts.set(key.toLowerCase(), {
            callback: callback,
            description: description
        });
    }

    removeShortcut(key) {
        this.shortcuts.delete(key.toLowerCase());
        
        if (this.customShortcuts) {
            this.customShortcuts.delete(key.toLowerCase());
        }
    }

    // Export/Import shortcuts
    exportShortcuts() {
        const exported = {
            shortcuts: {},
            customShortcuts: {}
        };
        
        for (const [key, callback] of this.shortcuts) {
            exported.shortcuts[key] = callback.toString();
        }
        
        if (this.customShortcuts) {
            for (const [key, data] of this.customShortcuts) {
                exported.customShortcuts[key] = data.description;
            }
        }
        
        return exported;
    }

    importShortcuts(exported) {
        if (exported.shortcuts) {
            for (const [key, callbackString] of Object.entries(exported.shortcuts)) {
                try {
                    const callback = eval(`(${callbackString})`);
                    this.addShortcut(key, callback);
                } catch (error) {
                    console.warn(`Failed to import shortcut ${key}:`, error);
                }
            }
        }
    }

    // Help system
    getShortcutHelp() {
        const help = [];
        
        for (const [key, callback] of this.shortcuts) {
            help.push({
                key: key,
                description: this.getShortcutDescription(key, callback)
            });
        }
        
        return help.sort((a, b) => a.key.localeCompare(b.key));
    }

    getShortcutDescription(key, callback) {
        const descriptions = {
            'ctrl+n': 'New File',
            'ctrl+o': 'Open File',
            'ctrl+s': 'Save File',
            'ctrl+shift+s': 'Save As',
            'ctrl+e': 'Export',
            'ctrl+z': 'Undo',
            'ctrl+y': 'Redo',
            'ctrl+x': 'Cut',
            'ctrl+c': 'Copy',
            'ctrl+v': 'Paste',
            'ctrl+d': 'Duplicate',
            'delete': 'Delete',
            'backspace': 'Delete',
            'ctrl+plus': 'Zoom In',
            'ctrl+minus': 'Zoom Out',
            'ctrl+0': 'Zoom Reset',
            'ctrl+1': 'Actual Size',
            'ctrl+2': 'Fit to Window',
            'space': 'Pan Mode',
            'v': 'Select Tool',
            'r': 'Rectangle Tool',
            'e': 'Ellipse Tool',
            'l': 'Line Tool',
            't': 'Text Tool',
            'p': 'Pen Tool',
            'ctrl+a': 'Select All',
            'ctrl+shift+a': 'Deselect All',
            'escape': 'Escape/Cancel'
        };
        
        return descriptions[key] || 'Custom Action';
    }

    showShortcutHelp() {
        const help = this.getShortcutHelp();
        let helpHtml = '<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #2d2d2d; border: 1px solid #404040; border-radius: 8px; padding: 20px; max-width: 600px; max-height: 500px; overflow-y: auto; z-index: 1000; color: white;">';
        helpHtml += '<h3>Keyboard Shortcuts</h3>';
        helpHtml += '<table style="width: 100%; border-collapse: collapse;">';
        helpHtml += '<thead><tr><th style="text-align: left; padding: 8px; border-bottom: 1px solid #404040;">Shortcut</th><th style="text-align: left; padding: 8px; border-bottom: 1px solid #404040;">Description</th></tr></thead>';
        helpHtml += '<tbody>';
        
        for (const item of help) {
            helpHtml += `<tr><td style="padding: 6px 8px; border-bottom: 1px solid #333333; font-family: monospace;">${item.key}</td><td style="padding: 6px 8px; border-bottom: 1px solid #333333;">${item.description}</td></tr>`;
        }
        
        helpHtml += '</tbody></table>';
        helpHtml += '<button onclick="this.parentElement.remove()" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Close</button>';
        helpHtml += '</div>';
        
        const helpDiv = document.createElement('div');
        helpDiv.innerHTML = helpHtml;
        document.body.appendChild(helpDiv);
    }

    // Validation
    validateShortcut(key) {
        // Check if key is valid format
        const validKeys = /^[a-z0-9+\-]+$/;
        return validKeys.test(key.toLowerCase());
    }

    isShortcutAvailable(key) {
        return !this.shortcuts.has(key.toLowerCase());
    }

    // Cleanup
    cleanup() {
        this.shortcuts.clear();
        if (this.contextShortcuts) {
            this.contextShortcuts.clear();
        }
        if (this.customShortcuts) {
            this.customShortcuts.clear();
        }
    }
}

module.exports = KeyboardShortcuts;
