class DesignBrowser {
    constructor() {
        this.searchResults = [];
        this.isSearching = false;
        this.designSources = [
            {
                name: 'Unsplash',
                baseUrl: 'https://api.unsplash.com/search/photos',
                type: 'images'
            },
            {
                name: 'Pixabay',
                baseUrl: 'https://pixabay.com/api/',
                type: 'images'
            },
            {
                name: 'OpenClipArt',
                baseUrl: 'https://openclipart.org/search/json/',
                type: 'vectors'
            }
        ];
    }

    async searchDesigns(query, type = 'all') {
        if (!query || query.trim() === '') {
            throw new Error('Search query cannot be empty');
        }

        this.isSearching = true;
        this.searchResults = [];

        try {
            const searchPromises = [];
            
            for (const source of this.designSources) {
                if (type === 'all' || source.type === type) {
                    searchPromises.push(this.searchSource(source, query));
                }
            }

            const results = await Promise.allSettled(searchPromises);
            
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    this.searchResults.push(...result.value);
                }
            }

            return this.searchResults;
        } catch (error) {
            throw new Error(`Design search failed: ${error.message}`);
        } finally {
            this.isSearching = false;
        }
    }

    async searchSource(source, query) {
        try {
            // Simulate API call with mock data for demo purposes
            // In production, this would make real API calls
            const mockResults = this.generateMockResults(source, query);
            return mockResults;
        } catch (error) {
            console.warn(`Failed to search ${source.name}:`, error.message);
            return [];
        }
    }

    generateMockResults(source, query) {
        const results = [];
        const numResults = Math.floor(Math.random() * 5) + 3;
        
        for (let i = 0; i < numResults; i++) {
            results.push({
                id: `${source.name.toLowerCase()}_${Date.now()}_${i}`,
                title: `${query} Design ${i + 1}`,
                description: `A beautiful ${query} design from ${source.name}`,
                source: source.name,
                type: source.type,
                url: `https://example.com/design/${i}`,
                previewUrl: this.generatePreviewUrl(query, i),
                tags: [query, 'design', source.type],
                license: 'Free to use',
                downloadUrl: `https://example.com/download/${i}`,
                metadata: {
                    width: 800 + Math.floor(Math.random() * 400),
                    height: 600 + Math.floor(Math.random() * 300),
                    format: source.type === 'vectors' ? 'SVG' : 'PNG',
                    size: Math.floor(Math.random() * 1000) + 100
                }
            });
        }
        
        return results;
    }

    generatePreviewUrl(query, index) {
        // Generate a data URL for preview (placeholder)
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        
        // Create a simple preview based on query
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        const bgColor = colors[index % colors.length];
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 200, 150);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(query.toUpperCase(), 100, 75);
        
        ctx.font = '12px Arial';
        ctx.fillText(`Preview ${index + 1}`, 100, 95);
        
        return canvas.toDataURL();
    }

    async downloadDesign(designId) {
        const design = this.searchResults.find(d => d.id === designId);
        if (!design) {
            throw new Error('Design not found');
        }

        try {
            // Simulate download - in production would fetch actual file
            const mockFileData = this.generateMockFileData(design);
            return {
                design: design,
                data: mockFileData,
                success: true
            };
        } catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        }
    }

    generateMockFileData(design) {
        if (design.type === 'vectors') {
            // Generate mock SVG data
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${design.metadata.width}" height="${design.metadata.height}">
                <rect width="100%" height="100%" fill="#f0f0f0"/>
                <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="#333">
                    ${design.title}
                </text>
            </svg>`;
        } else {
            // Generate mock image data (base64)
            const canvas = document.createElement('canvas');
            canvas.width = design.metadata.width;
            canvas.height = design.metadata.height;
            const ctx = canvas.getContext('2d');
            
            // Create a simple placeholder image
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#666666';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(design.title, canvas.width / 2, canvas.height / 2);
            
            return canvas.toDataURL('image/png');
        }
    }

    async importDesignToCanvas(designId, app) {
        try {
            const downloadResult = await this.downloadDesign(designId);
            const { design, data } = downloadResult;
            
            if (design.type === 'vectors') {
                // Parse SVG and convert to app objects
                const objects = this.parseSVGToObjects(data);
                this.addObjectsToApp(objects, app);
            } else {
                // For images, create an image object
                const imageObj = {
                    type: 'image',
                    x: 100,
                    y: 100,
                    width: design.metadata.width,
                    height: design.metadata.height,
                    src: data,
                    opacity: 1
                };
                app.objects.push(imageObj);
                app.layers[app.currentLayer].objects.push(imageObj);
            }
            
            app.render();
            return { success: true, message: `Imported "${design.title}" successfully` };
        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }

    parseSVGToObjects(svgData) {
        const objects = [];
        
        // Simple SVG parsing - in production would use a proper SVG parser
        if (svgData.includes('<rect')) {
            const rectMatch = svgData.match(/<rect[^>]*width="(\d+)"[^>]*height="(\d+)"[^>]*x="(\d+)"[^>]*y="(\d+)"[^>]*>/);
            if (rectMatch) {
                objects.push({
                    type: 'rectangle',
                    x: parseInt(rectMatch[3]),
                    y: parseInt(rectMatch[4]),
                    width: parseInt(rectMatch[1]),
                    height: parseInt(rectMatch[2]),
                    fill: '#cccccc',
                    stroke: '#666666',
                    strokeWidth: 1,
                    opacity: 1
                });
            }
        }
        
        if (svgData.includes('<circle')) {
            const circleMatch = svgData.match(/<circle[^>]*cx="(\d+)"[^>]*cy="(\d+)"[^>]*r="(\d+)"[^>]*>/);
            if (circleMatch) {
                objects.push({
                    type: 'ellipse',
                    x: parseInt(circleMatch[1]),
                    y: parseInt(circleMatch[2]),
                    radiusX: parseInt(circleMatch[3]),
                    radiusY: parseInt(circleMatch[3]),
                    fill: '#cccccc',
                    stroke: '#666666',
                    strokeWidth: 1,
                    opacity: 1
                });
            }
        }
        
        return objects;
    }

    addObjectsToApp(objects, app) {
        for (const obj of objects) {
            app.objects.push(obj);
            app.layers[app.currentLayer].objects.push(obj);
        }
    }

    getSearchResults() {
        return this.searchResults;
    }

    clearResults() {
        this.searchResults = [];
    }

    isCurrentlySearching() {
        return this.isSearching;
    }

    // Method to get popular design suggestions
    getPopularSearches() {
        return [
            'logo', 'icon', 'banner', 'background', 'pattern',
            'geometric', 'abstract', 'minimalist', 'modern', 'vintage',
            'nature', 'technology', 'business', 'creative', 'artistic'
        ];
    }

    // Method to get design categories
    getCategories() {
        return [
            { name: 'Logos', query: 'logo' },
            { name: 'Icons', query: 'icon' },
            { name: 'Patterns', query: 'pattern' },
            { name: 'Backgrounds', query: 'background' },
            { name: 'Abstract', query: 'abstract' },
            { name: 'Geometric', query: 'geometric' },
            { name: 'Nature', query: 'nature' },
            { name: 'Business', query: 'business' }
        ];
    }
}

module.exports = DesignBrowser;
