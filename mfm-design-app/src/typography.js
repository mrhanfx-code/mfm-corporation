class TypographySystem {
    constructor() {
        this.fonts = [
            { name: 'Arial', family: 'Arial, sans-serif', weights: [400, 700] },
            { name: 'Helvetica', family: 'Helvetica, sans-serif', weights: [300, 400, 700] },
            { name: 'Times New Roman', family: 'Times New Roman, serif', weights: [400, 700] },
            { name: 'Georgia', family: 'Georgia, serif', weights: [400, 700] },
            { name: 'Verdana', family: 'Verdana, sans-serif', weights: [400, 700] },
            { name: 'Courier New', family: 'Courier New, monospace', weights: [400, 700] },
            { name: 'Impact', family: 'Impact, sans-serif', weights: [400] },
            { name: 'Comic Sans MS', family: 'Comic Sans MS, cursive', weights: [400, 700] }
        ];
        
        this.textEffects = {
            normal: { letterSpacing: 0, lineHeight: 1.2, textDecoration: 'none' },
            bold: { letterSpacing: 0, lineHeight: 1.2, textDecoration: 'none', fontWeight: 700 },
            italic: { letterSpacing: 0, lineHeight: 1.2, textDecoration: 'none', fontStyle: 'italic' },
            underline: { letterSpacing: 0, lineHeight: 1.2, textDecoration: 'underline' },
            condensed: { letterSpacing: -2, lineHeight: 1.1, textDecoration: 'none' },
            expanded: { letterSpacing: 4, lineHeight: 1.3, textDecoration: 'none' },
            title: { letterSpacing: 2, lineHeight: 1.1, textDecoration: 'none', fontWeight: 700, textTransform: 'uppercase' },
            subscript: { letterSpacing: 0, lineHeight: 1, textDecoration: 'none', fontSize: '0.8em', verticalAlign: 'sub' },
            superscript: { letterSpacing: 0, lineHeight: 1, textDecoration: 'none', fontSize: '0.8em', verticalAlign: 'super' }
        };
        
        this.currentFont = this.fonts[0];
        this.currentSize = 16;
        this.currentEffect = 'normal';
        this.currentColor = '#000000';
        this.currentAlignment = 'left';
    }

    getAvailableFonts() {
        return this.fonts;
    }

    getAvailableEffects() {
        return Object.keys(this.textEffects);
    }

    setFont(fontName) {
        const font = this.fonts.find(f => f.name === fontName);
        if (font) {
            this.currentFont = font;
            return true;
        }
        return false;
    }

    setSize(size) {
        this.currentSize = Math.max(6, Math.min(144, size));
    }

    setEffect(effectName) {
        if (this.textEffects[effectName]) {
            this.currentEffect = effectName;
            return true;
        }
        return false;
    }

    setColor(color) {
        this.currentColor = color;
    }

    setAlignment(alignment) {
        const alignments = ['left', 'center', 'right', 'justify'];
        if (alignments.includes(alignment)) {
            this.currentAlignment = alignment;
            return true;
        }
        return false;
    }

    createTextObject(text, x, y) {
        const effect = this.textEffects[this.currentEffect];
        const fontString = this.buildFontString(effect);
        
        return {
            type: 'text',
            x: x,
            y: y,
            text: text,
            font: fontString,
            fontFamily: this.currentFont.family,
            fontSize: this.currentSize,
            fontWeight: effect.fontWeight || 400,
            fontStyle: effect.fontStyle || 'normal',
            fill: this.currentColor,
            stroke: 'none',
            strokeWidth: 0,
            opacity: 1,
            letterSpacing: effect.letterSpacing || 0,
            lineHeight: effect.lineHeight || 1.2,
            textDecoration: effect.textDecoration || 'none',
            textTransform: effect.textTransform || 'none',
            textAlign: this.currentAlignment,
            verticalAlign: effect.verticalAlign || 'baseline',
            // Typography-specific properties
            typography: {
                fontName: this.currentFont.name,
                effect: this.currentEffect,
                alignment: this.currentAlignment
            }
        };
    }

    buildFontString(effect) {
        let fontString = '';
        
        if (effect.fontWeight) {
            fontString += effect.fontWeight + ' ';
        }
        
        if (effect.fontStyle) {
            fontString += effect.fontStyle + ' ';
        }
        
        if (effect.fontSize) {
            fontString += effect.fontSize + ' ';
        } else {
            fontString += this.currentSize + 'px ';
        }
        
        fontString += this.currentFont.family;
        
        return fontString;
    }

    measureText(text, fontString) {
        // Create a temporary canvas to measure text
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = fontString;
        
        const metrics = ctx.measureText(text);
        return {
            width: metrics.width,
            height: this.currentSize * (this.textEffects[this.currentEffect].lineHeight || 1.2)
        };
    }

    renderText(ctx, textObject) {
        ctx.save();
        
        // Apply text properties
        ctx.font = textObject.font;
        ctx.fillStyle = textObject.fill;
        ctx.strokeStyle = textObject.stroke;
        ctx.lineWidth = textObject.strokeWidth;
        ctx.globalAlpha = textObject.opacity;
        ctx.textAlign = textObject.textAlign;
        ctx.textBaseline = 'top';
        
        // Apply letter spacing
        if (textObject.letterSpacing !== 0) {
            this.renderTextWithLetterSpacing(ctx, textObject);
        } else {
            // Simple text rendering
            const lines = this.wrapText(ctx, textObject.text, textObject.maxWidth || 1000);
            let y = textObject.y;
            
            for (const line of lines) {
                ctx.fillText(line, textObject.x, y);
                y += textObject.fontSize * textObject.lineHeight;
            }
        }
        
        ctx.restore();
    }

    renderTextWithLetterSpacing(ctx, textObject) {
        const text = textObject.text;
        const letterSpacing = textObject.letterSpacing;
        const lines = this.wrapText(ctx, text, textObject.maxWidth || 1000);
        
        let y = textObject.y;
        
        for (const line of lines) {
            let x = textObject.x;
            
            if (textObject.textAlign === 'center') {
                const lineWidth = this.calculateLineWidth(ctx, line, letterSpacing);
                x -= lineWidth / 2;
            } else if (textObject.textAlign === 'right') {
                const lineWidth = this.calculateLineWidth(ctx, line, letterSpacing);
                x -= lineWidth;
            }
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                ctx.fillText(char, x, y);
                x += ctx.measureText(char).width + letterSpacing;
            }
            
            y += textObject.fontSize * textObject.lineHeight;
        }
    }

    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    calculateLineWidth(ctx, text, letterSpacing) {
        let width = 0;
        for (let i = 0; i < text.length; i++) {
            width += ctx.measureText(text[i]).width;
            if (i < text.length - 1) {
                width += letterSpacing;
            }
        }
        return width;
    }

    // Advanced typography features
    createTextPath(text, pathPoints) {
        return {
            type: 'textPath',
            text: text,
            path: pathPoints,
            font: this.buildFontString(this.textEffects[this.currentEffect]),
            fontFamily: this.currentFont.family,
            fontSize: this.currentSize,
            fill: this.currentColor,
            opacity: 1,
            typography: {
                fontName: this.currentFont.name,
                effect: this.currentEffect,
                alignment: this.currentAlignment
            }
        };
    }

    createTextBox(text, x, y, width, height) {
        return {
            type: 'textBox',
            x: x,
            y: y,
            width: width,
            height: height,
            text: text,
            font: this.buildFontString(this.textEffects[this.currentEffect]),
            fontFamily: this.currentFont.family,
            fontSize: this.currentSize,
            fill: this.currentColor,
            opacity: 1,
            maxWidth: width,
            maxHeight: height,
            textAlign: this.currentAlignment,
            typography: {
                fontName: this.currentFont.name,
                effect: this.currentEffect,
                alignment: this.currentAlignment,
                overflow: 'hidden',
                padding: 8
            }
        };
    }

    // Text styling presets
    applyPreset(presetName) {
        const presets = {
            heading: {
                font: 'Arial',
                size: 32,
                effect: 'bold',
                alignment: 'center'
            },
            subheading: {
                font: 'Arial',
                size: 24,
                effect: 'bold',
                alignment: 'left'
            },
            body: {
                font: 'Georgia',
                size: 14,
                effect: 'normal',
                alignment: 'left'
            },
            caption: {
                font: 'Verdana',
                size: 10,
                effect: 'normal',
                alignment: 'center'
            },
            title: {
                font: 'Impact',
                size: 48,
                effect: 'title',
                alignment: 'center'
            },
            code: {
                font: 'Courier New',
                size: 12,
                effect: 'normal',
                alignment: 'left'
            }
        };
        
        const preset = presets[presetName];
        if (preset) {
            this.setFont(preset.font);
            this.setSize(preset.size);
            this.setEffect(preset.effect);
            this.setAlignment(preset.alignment);
            return true;
        }
        return false;
    }

    // Get current typography settings
    getCurrentSettings() {
        return {
            font: this.currentFont.name,
            size: this.currentSize,
            effect: this.currentEffect,
            color: this.currentColor,
            alignment: this.currentAlignment
        };
    }

    // Export typography settings
    exportSettings() {
        return {
            fonts: this.fonts,
            effects: this.textEffects,
            current: this.getCurrentSettings()
        };
    }

    // Import typography settings
    importSettings(settings) {
        if (settings.fonts) {
            this.fonts = settings.fonts;
        }
        if (settings.effects) {
            this.textEffects = settings.effects;
        }
        if (settings.current) {
            this.setFont(settings.current.font);
            this.setSize(settings.current.size);
            this.setEffect(settings.current.effect);
            this.setColor(settings.current.color);
            this.setAlignment(settings.current.alignment);
        }
    }
}

module.exports = TypographySystem;
