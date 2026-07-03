class AIGenerator {
    constructor() {
        this.isReady = true;
        this.seed = Date.now();
    }

    // Seeded pseudo-random for reproducible designs
    _random() {
        this.seed = (this.seed * 16807 + 0) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    async generateDesignFromText(prompt) {
        try {
            // Convert text prompt to numerical representation
            const textVector = this.textToVector(prompt);

            // Use lightweight heuristic generator instead of TF.js
            const output = this._generateVector(textVector);

            // Convert output to design objects
            const design = this.vectorToDesign(output, prompt);

            return design;
        } catch (error) {
            throw new Error(`Design generation failed: ${error.message}`);
        }
    }

    // Lightweight vector generator (replaces TF.js model)
    _generateVector(input) {
        const output = new Float32Array(16);
        for (let i = 0; i < 16; i++) {
            let sum = 0;
            for (let j = 0; j < input.length; j++) {
                sum += input[j] * Math.sin(i * j + 1);
            }
            output[i] = 1 / (1 + Math.exp(-sum)); // sigmoid
        }
        return output;
    }

    textToVector(text) {
        // Simple text-to-vector conversion
        const vector = new Array(100).fill(0);
        const words = text.toLowerCase().split(' ');
        
        // Simple word embedding based on common design terms
        const wordMap = {
            'circle': [1, 0, 0, 0, 0],
            'square': [0, 1, 0, 0, 0],
            'rectangle': [0, 1, 0.5, 0, 0],
            'triangle': [0, 0, 1, 0, 0],
            'line': [0, 0, 0, 1, 0],
            'text': [0, 0, 0, 0, 1],
            'red': [1, 0, 0, 0, 0],
            'blue': [0, 1, 0, 0, 0],
            'green': [0, 0, 1, 0, 0],
            'yellow': [1, 1, 0, 0, 0],
            'purple': [1, 0, 1, 0, 0],
            'orange': [1, 0.5, 0, 0, 0],
            'black': [0, 0, 0, 0, 0],
            'white': [1, 1, 1, 0, 0],
            'large': [1, 0, 0, 0, 0],
            'small': [0, 1, 0, 0, 0],
            'medium': [0.5, 0.5, 0, 0, 0],
            'bold': [1, 0, 0, 0, 0],
            'thin': [0, 1, 0, 0, 0],
            'simple': [0, 0, 1, 0, 0],
            'complex': [1, 1, 0, 0, 0],
            'modern': [1, 0, 1, 0, 0],
            'classic': [0, 1, 0, 1, 0]
        };

        let index = 0;
        for (const word of words) {
            if (wordMap[word]) {
                const embedding = wordMap[word];
                for (let i = 0; i < embedding.length && index < vector.length; i++) {
                    vector[index++] = embedding[i];
                }
            }
        }

        return vector;
    }

    vectorToDesign(vector, prompt) {
        const objects = [];
        const words = prompt.toLowerCase().split(' ');
        
        // Generate shapes based on prompt analysis
        if (words.includes('circle') || words.includes('round')) {
            objects.push(this.generateCircle(vector));
        }
        
        if (words.includes('square') || words.includes('rectangle')) {
            objects.push(this.generateRectangle(vector));
        }
        
        if (words.includes('triangle')) {
            objects.push(this.generateTriangle(vector));
        }
        
        if (words.includes('line') || words.includes('lines')) {
            objects.push(this.generateLines(vector));
        }
        
        // Add default shapes if no specific shapes mentioned
        if (objects.length === 0) {
            objects.push(this.generateDefaultDesign(vector));
        }

        return {
            objects: objects,
            prompt: prompt,
            timestamp: Date.now()
        };
    }

    generateCircle(vector) {
        const x = 200 + (vector[0] * 200);
        const y = 200 + (vector[1] * 200);
        const radius = 50 + (vector[2] * 100);
        const color = this.vectorToColor([vector[3], vector[4], vector[5]]);
        
        return {
            type: 'ellipse',
            x: x,
            y: y,
            radiusX: radius,
            radiusY: radius,
            fill: color,
            stroke: this.darkenColor(color),
            strokeWidth: 2,
            opacity: 0.8
        };
    }

    generateRectangle(vector) {
        const x = 100 + (vector[0] * 300);
        const y = 100 + (vector[1] * 300);
        const width = 80 + (vector[2] * 120);
        const height = 60 + (vector[3] * 100);
        const color = this.vectorToColor([vector[4], vector[5], vector[6]]);
        
        return {
            type: 'rectangle',
            x: x,
            y: y,
            width: width,
            height: height,
            fill: color,
            stroke: this.darkenColor(color),
            strokeWidth: 2,
            opacity: 0.8
        };
    }

    generateTriangle(vector) {
        const centerX = 200 + (vector[0] * 200);
        const centerY = 200 + (vector[1] * 200);
        const size = 60 + (vector[2] * 80);
        const color = this.vectorToColor([vector[3], vector[4], vector[5]]);
        
        // Create triangle as path
        const points = [
            centerX, centerY - size,
            centerX - size, centerY + size,
            centerX + size, centerY + size
        ];
        
        return {
            type: 'path',
            points: points,
            fill: color,
            stroke: this.darkenColor(color),
            strokeWidth: 2,
            opacity: 0.8
        };
    }

    generateLines(vector) {
        const objects = [];
        const numLines = Math.floor(2 + vector[0] * 4);
        const color = this.vectorToColor([vector[1], vector[2], vector[3]]);
        
        for (let i = 0; i < numLines; i++) {
            const x1 = 100 + (vector[4 + i * 2] * 400);
            const y1 = 100 + (vector[5 + i * 2] * 300);
            const x2 = 100 + (vector[6 + i * 2] * 400);
            const y2 = 100 + (vector[7 + i * 2] * 300);
            
            objects.push({
                type: 'line',
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
                stroke: color,
                strokeWidth: 2 + vector[8 + i] * 4,
                opacity: 0.8
            });
        }
        
        return objects.length > 1 ? { type: 'group', objects: objects } : objects[0];
    }

    generateDefaultDesign(vector) {
        // Generate a balanced composition with multiple shapes
        const objects = [];
        const color = this.vectorToColor([vector[0], vector[1], vector[2]]);
        
        // Add a main rectangle
        objects.push({
            type: 'rectangle',
            x: 150,
            y: 150,
            width: 120,
            height: 80,
            fill: color,
            stroke: this.darkenColor(color),
            strokeWidth: 2,
            opacity: 0.8
        });
        
        // Add a circle
        objects.push({
            type: 'ellipse',
            x: 300,
            y: 200,
            radiusX: 60,
            radiusY: 60,
            fill: this.lightenColor(color),
            stroke: this.darkenColor(color),
            strokeWidth: 2,
            opacity: 0.8
        });
        
        return objects;
    }

    vectorToColor(vector) {
        const r = Math.floor(Math.abs(vector[0]) * 255);
        const g = Math.floor(Math.abs(vector[1]) * 255);
        const b = Math.floor(Math.abs(vector[2]) * 255);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    darkenColor(color) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    lightenColor(color) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + 40);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + 40);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + 40);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    async applyStyle(objects, style) {
        const styleMap = {
            'modern': this.applyModernStyle,
            'classic': this.applyClassicStyle,
            'minimalist': this.applyMinimalistStyle,
            'bold': this.applyBoldStyle,
            'elegant': this.applyElegantStyle
        };

        if (styleMap[style]) {
            return styleMap[style].call(this, objects);
        }
        
        return objects;
    }

    applyModernStyle(objects) {
        return objects.map(obj => ({
            ...obj,
            fill: this.modernColor(),
            stroke: '#333333',
            strokeWidth: 1,
            opacity: 0.9
        }));
    }

    applyClassicStyle(objects) {
        return objects.map(obj => ({
            ...obj,
            fill: this.classicColor(),
            stroke: '#2c1810',
            strokeWidth: 3,
            opacity: 0.8
        }));
    }

    applyMinimalistStyle(objects) {
        return objects.map(obj => ({
            ...obj,
            fill: '#ffffff',
            stroke: '#000000',
            strokeWidth: 2,
            opacity: 0.7
        }));
    }

    applyBoldStyle(objects) {
        return objects.map(obj => ({
            ...obj,
            fill: this.boldColor(),
            stroke: '#000000',
            strokeWidth: 4,
            opacity: 1
        }));
    }

    applyElegantStyle(objects) {
        return objects.map(obj => ({
            ...obj,
            fill: this.elegantColor(),
            stroke: '#4a4a4a',
            strokeWidth: 1.5,
            opacity: 0.85
        }));
    }

    modernColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    classicColor() {
        const colors = ['#8B4513', '#D2691E', '#DEB887', '#F4A460', '#BC8F8F'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    boldColor() {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    elegantColor() {
        const colors = ['#708090', '#778899', '#B0C4DE', '#4682B4', '#5F9EA0'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

module.exports = AIGenerator;
