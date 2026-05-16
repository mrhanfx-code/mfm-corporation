// MFM Corporation - Awesome Design Tools Integration
// Professional design tools discovery and access system

class AwesomeDesignToolsIntegration {
    constructor() {
        this.toolsDatabase = {
            categories: {
                'accessibility-tools': {
                    name: 'Accessibility Tools',
                    description: 'WCAG compliance, color contrast, accessibility testing',
                    tools: [
                        {
                            id: 'axe',
                            name: 'Axe',
                            description: 'Accessibility engine for automated testing',
                            platforms: ['web'],
                            pricing: 'free',
                            openSource: true,
                            features: ['wcag-compliance', 'automated-testing', 'multi-browser'],
                            website: 'https://www.deque.com/axe/',
                            tags: ['testing', 'accessibility', 'wcag']
                        },
                        {
                            id: 'color-contrast-analyzer',
                            name: 'Color Contrast Analyzer',
                            description: 'Check color contrast ratios for accessibility',
                            platforms: ['web', 'desktop'],
                            pricing: 'free',
                            openSource: true,
                            features: ['contrast-checking', 'wcag-compliance', 'color-analysis'],
                            website: 'https://webaim.org/resources/contrastchecker/',
                            tags: ['color', 'accessibility', 'wcag']
                        },
                        {
                            id: 'leonardo',
                            name: 'Leonardo',
                            description: 'Generate color palettes by WCAG contrast ratio',
                            platforms: ['web'],
                            pricing: 'free',
                            openSource: true,
                            features: ['palette-generation', 'wcag-compliance', 'contrast-ratios'],
                            website: 'https://leonardocolor.io',
                            tags: ['color', 'accessibility', 'palette']
                        }
                    ]
                },
                'animation-tools': {
                    name: 'Animation Tools',
                    description: 'Motion graphics, micro-interactions, prototyping animations',
                    tools: [
                        {
                            id: 'lottie',
                            name: 'Lottie',
                            description: 'Mobile library for After Effects animations',
                            platforms: ['web', 'mobile'],
                            pricing: 'free',
                            openSource: true,
                            features: ['after-effects', 'json-animations', 'cross-platform'],
                            website: 'https://airbnb.io/lottie/',
                            tags: ['animation', 'mobile', 'after-effects']
                        },
                        {
                            id: 'gsap',
                            name: 'GSAP',
                            description: 'High-performance HTML5 animations',
                            platforms: ['web'],
                            pricing: 'free',
                            openSource: true,
                            features: ['html5-animations', 'performance', 'cross-browser'],
                            website: 'https://greensock.com/',
                            tags: ['animation', 'performance', 'javascript']
                        },
                        {
                            id: 'framer-motion',
                            name: 'Framer Motion',
                            description: 'Production-ready motion library for React',
                            platforms: ['web'],
                            pricing: 'free',
                            openSource: true,
                            features: ['react', 'animations', 'gestures'],
                            website: 'https://www.framer.com/motion/',
                            tags: ['animation', 'react', 'gestures']
                        }
                    ]
                },
                'color-picker-tools': {
                    name: 'Color Picker Tools',
                    description: 'Color palettes, contrast checking, brand colors',
                    tools: [
                        {
                            id: 'coolors',
                            name: 'Coolors',
                            description: 'Super-fast color scheme generator',
                            platforms: ['web'],
                            pricing: 'free',
                            openSource: false,
                            features: ['palette-generation', 'export-options', 'trending'],
                            website: 'https://coolors.co/',
                            tags: ['color', 'palette', 'generator']
                        },
                        {
                            id: 'adobe-color',
                            name: 'Adobe Color',
                            description: 'Create color schemes with color wheel',
                            platforms: ['web'],
                            pricing: 'free',
                            openSource: false,
                            features: ['color-wheel', 'themes', 'accessibility'],
                            website: 'https://color.adobe.com/',
                            tags: ['color', 'palette', 'themes']
                        },
                        {
                            id: 'brand-colors',
                            name: 'Brand Colors',
                            description: 'Biggest collection of official brand color codes',
                            platforms: ['web'],
                            pricing: 'free',
                            openSource: false,
                            features: ['brand-colors', 'hex-codes', 'official'],
                            website: 'https://brandcolors.net/',
                            tags: ['color', 'brand', 'hex']
                        }
                    ]
                },
                'prototyping-tools': {
                    name: 'Prototyping Tools',
                    description: 'Interactive prototypes, user flow testing',
                    tools: [
                        {
                            id: 'figma',
                            name: 'Figma',
                            description: 'Collaborative interface design tool',
                            platforms: ['web', 'desktop'],
                            pricing: 'freemium',
                            openSource: false,
                            features: ['collaboration', 'prototyping', 'design-systems'],
                            website: 'https://www.figma.com/',
                            tags: ['design', 'prototyping', 'collaboration']
                        },
                        {
                            id: 'sketch',
                            name: 'Sketch',
                            description: 'Digital design platform',
                            platforms: ['macos'],
                            pricing: 'paid',
                            openSource: false,
                            features: ['design', 'prototyping', 'plugins'],
                            website: 'https://www.sketch.com/',
                            tags: ['design', 'prototyping', 'macos']
                        },
                        {
                            id: 'adobe-xd',
                            name: 'Adobe XD',
                            description: 'UI/UX design and collaboration tool',
                            platforms: ['desktop'],
                            pricing: 'freemium',
                            openSource: false,
                            features: ['design', 'prototyping', 'collaboration'],
                            website: 'https://www.adobe.com/products/xd.html',
                            tags: ['design', 'prototyping', 'adobe']
                        }
                    ]
                },
                'collaboration-tools': {
                    name: 'Collaboration Tools',
                    description: 'Team workflows, feedback, project management',
                    tools: [
                        {
                            id: 'slack',
                            name: 'Slack',
                            description: 'Business communication platform',
                            platforms: ['web', 'desktop', 'mobile'],
                            pricing: 'freemium',
                            openSource: false,
                            features: ['messaging', 'integrations', 'file-sharing'],
                            website: 'https://slack.com/',
                            tags: ['communication', 'team', 'productivity']
                        },
                        {
                            id: 'notion',
                            name: 'Notion',
                            description: 'All-in-one workspace for notes and tasks',
                            platforms: ['web', 'desktop', 'mobile'],
                            pricing: 'freemium',
                            openSource: false,
                            features: ['notes', 'tasks', 'collaboration'],
                            website: 'https://www.notion.so/',
                            tags: ['productivity', 'notes', 'collaboration']
                        },
                        {
                            id: 'miro',
                            name: 'Miro',
                            description: 'Online whiteboard for team collaboration',
                            platforms: ['web'],
                            pricing: 'freemium',
                            openSource: false,
                            features: ['whiteboard', 'collaboration', 'templates'],
                            website: 'https://miro.com/',
                            tags: ['whiteboard', 'collaboration', 'visual']
                        }
                    ]
                },
                'ui-design-tools': {
                    name: 'UI Design Tools',
                    description: 'Interface design, wireframing, mockup creation',
                    tools: [
                        {
                            id: 'figjam',
                            name: 'FigJam',
                            description: 'Online whiteboard for brainstorming and planning',
                            platforms: ['web'],
                            pricing: 'freemium',
                            openSource: false,
                            features: ['whiteboard', 'brainstorming', 'templates'],
                            website: 'https://www.figma.com/figjam/',
                            tags: ['whiteboard', 'planning', 'collaboration']
                        },
                        {
                            id: 'balsamiq',
                            name: 'Balsamiq',
                            description: 'Rapid wireframing tool',
                            platforms: ['web', 'desktop'],
                            pricing: 'freemium',
                            openSource: false,
                            features: ['wireframing', 'low-fidelity', 'rapid-prototyping'],
                            website: 'https://balsamiq.com/',
                            tags: ['wireframing', 'prototyping', 'low-fidelity']
                        },
                        {
                            id: 'invision',
                            name: 'InVision',
                            description: 'Digital product design platform',
                            platforms: ['web'],
                            pricing: 'freemium',
                            openSource: false,
                            features: ['prototyping', 'collaboration', 'design-systems'],
                            website: 'https://www.invisionapp.com/',
                            tags: ['prototyping', 'collaboration', 'design']
                        }
                    ]
                }
            }
        };
        
        this.searchHistory = [];
        this.favorites = [];
        this.recentlyViewed = [];
        this.isInitialized = false;
        
        this.initializeIntegration();
    }

    // Initialize the integration
    initializeIntegration() {
        this.setupUI();
        this.loadUserPreferences();
        this.isInitialized = true;
        return this.getIntegrationStatus();
    }

    // Setup UI components
    setupUI() {
        this.createToolsPanel();
        this.setupSearchFunctionality();
        this.setupFilters();
    }

    // Create tools panel
    createToolsPanel() {
        const toolsPanel = document.createElement('div');
        toolsPanel.className = 'awesome-design-tools-panel';
        toolsPanel.innerHTML = `
            <div class="tools-header">
                <h3>🎨 Awesome Design Tools</h3>
                <div class="tools-controls">
                    <input type="text" id="toolsSearch" placeholder="Search design tools..." class="tools-search-input">
                    <select id="categoryFilter" class="category-filter">
                        <option value="">All Categories</option>
                        ${Object.entries(this.toolsDatabase.categories).map(([key, cat]) => 
                            `<option value="${key}">${cat.name}</option>`
                        ).join('')}
                    </select>
                    <select id="pricingFilter" class="pricing-filter">
                        <option value="">All Pricing</option>
                        <option value="free">Free</option>
                        <option value="freemium">Freemium</option>
                        <option value="paid">Paid</option>
                    </select>
                </div>
            </div>
            <div class="tools-stats">
                <div class="stat-item">
                    <span class="stat-value">${this.getTotalToolsCount()}</span>
                    <span class="stat-label">Total Tools</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${Object.keys(this.toolsDatabase.categories).length}</span>
                    <span class="stat-label">Categories</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${this.getFreeToolsCount()}</span>
                    <span class="stat-label">Free Tools</span>
                </div>
            </div>
            <div class="tools-content" id="toolsContent">
                <div class="tools-placeholder">
                    <h4>🎨 Professional Design Tools</h4>
                    <p>Search and discover 500+ design tools across 30+ categories</p>
                </div>
            </div>
            <div class="tools-footer">
                <div class="recent-searches" id="recentSearches"></div>
            </div>
        `;
        
        this.integrateIntoSidebar(toolsPanel);
    }

    // Integrate into sidebar
    integrateIntoSidebar(panel) {
        const sidebar = document.querySelector('.corporate-sidebar');
        if (sidebar) {
            sidebar.appendChild(panel);
        }
    }

    // Setup search functionality
    setupSearchFunctionality() {
        const searchInput = document.getElementById('toolsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }
    }

    // Setup filters
    setupFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const pricingFilter = document.getElementById('pricingFilter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }
        
        if (pricingFilter) {
            pricingFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }
    }

    // Handle search
    async handleSearch(query) {
        if (query.length < 2) {
            this.showAllTools();
            return;
        }
        
        const results = await this.searchTools(query);
        this.displaySearchResults(results, query);
    }

    // Perform search
    async performSearch(query) {
        if (!query.trim()) return;
        
        this.addToSearchHistory(query);
        const results = await this.searchTools(query);
        this.displaySearchResults(results, query);
    }

    // Search tools
    async searchTools(query) {
        // First try Cloudflare API search
        try {
            const response = await fetch(`${window.CLOUDFLARE_CONFIG.apiUrl}${window.CLOUDFLARE_CONFIG.endpoints.toolsSearch}?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const apiResults = await response.json();
                return apiResults.results || [];
            }
        } catch (error) {
            console.log('API search failed, using local database:', error);
        }
        
        // Fallback to local database search
        const results = [];
        const searchTerm = query.toLowerCase();
        
        Object.entries(this.toolsDatabase.categories).forEach(([categoryKey, category]) => {
            category.tools.forEach(tool => {
                const matchScore = this.calculateMatchScore(tool, searchTerm);
                if (matchScore > 0) {
                    results.push({
                        ...tool,
                        category: categoryKey,
                        categoryName: category.name,
                        matchScore
                    });
                }
            });
        });
        
        return results.sort((a, b) => b.matchScore - a.matchScore);
    }

    // Calculate match score
    calculateMatchScore(tool, searchTerm) {
        let score = 0;
        
        // Name match (highest weight)
        if (tool.name.toLowerCase().includes(searchTerm)) {
            score += 10;
        }
        
        // Description match
        if (tool.description.toLowerCase().includes(searchTerm)) {
            score += 5;
        }
        
        // Tags match
        tool.tags.forEach(tag => {
            if (tag.toLowerCase().includes(searchTerm)) {
                score += 3;
            }
        });
        
        // Features match
        tool.features.forEach(feature => {
            if (feature.toLowerCase().includes(searchTerm)) {
                score += 2;
            }
        });
        
        return score;
    }

    // Display search results
    displaySearchResults(results, query) {
        const content = document.getElementById('toolsContent');
        if (!content) return;
        
        if (results.length === 0) {
            content.innerHTML = `
                <div class="no-results">
                    <h4>🔍 No Results Found</h4>
                    <p>No tools found for "${query}"</p>
                    <p>Try different keywords or browse categories</p>
                </div>
            `;
            return;
        }
        
        content.innerHTML = `
            <div class="search-results">
                <h4>🔍 Search Results (${results.length})</h4>
                <div class="tools-grid">
                    ${results.map(tool => this.createToolCard(tool)).join('')}
                </div>
            </div>
        `;
        
        this.setupToolCardInteractions();
    }

    // Show all tools
    showAllTools() {
        const content = document.getElementById('toolsContent');
        if (!content) return;
        
        content.innerHTML = `
            <div class="all-tools">
                <h4>🎨 All Design Tools</h4>
                <div class="categories-grid">
                    ${Object.entries(this.toolsDatabase.categories).map(([key, category]) => `
                        <div class="category-section">
                            <h5>${category.name}</h5>
                            <div class="tools-grid">
                                ${category.tools.map(tool => this.createToolCard(tool)).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.setupToolCardInteractions();
    }

    // Apply filters
    applyFilters() {
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const pricingFilter = document.getElementById('pricingFilter')?.value || '';
        
        let filteredTools = [];
        
        Object.entries(this.toolsDatabase.categories).forEach(([categoryKey, category]) => {
            if (categoryFilter && categoryKey !== categoryFilter) return;
            
            category.tools.forEach(tool => {
                if (pricingFilter && tool.pricing !== pricingFilter) return;
                filteredTools.push({
                    ...tool,
                    category: categoryKey,
                    categoryName: category.name
                });
            });
        });
        
        this.displayFilteredTools(filteredTools);
    }

    // Display filtered tools
    displayFilteredTools(tools) {
        const content = document.getElementById('toolsContent');
        if (!content) return;
        
        if (tools.length === 0) {
            content.innerHTML = `
                <div class="no-results">
                    <h4>🔍 No Tools Found</h4>
                    <p>No tools match the selected filters</p>
                </div>
            `;
            return;
        }
        
        content.innerHTML = `
            <div class="filtered-tools">
                <h4>🎨 Filtered Tools (${tools.length})</h4>
                <div class="tools-grid">
                    ${tools.map(tool => this.createToolCard(tool)).join('')}
                </div>
            </div>
        `;
        
        this.setupToolCardInteractions();
    }

    // Create tool card
    createToolCard(tool) {
        const platformIcons = {
            'web': '🌐',
            'desktop': '💻',
            'mobile': '📱',
            'macos': '🍎',
            'windows': '🪟',
            'ios': '📱',
            'android': '🤖'
        };
        
        const pricingIcons = {
            'free': '🆓',
            'freemium': '🎁',
            'paid': '💰'
        };
        
        return `
            <div class="tool-card" data-tool-id="${tool.id}">
                <div class="tool-header">
                    <h5>${tool.name}</h5>
                    <div class="tool-badges">
                        <span class="pricing-badge" title="${tool.pricing}">
                            ${pricingIcons[tool.pricing] || '💰'}
                        </span>
                        ${tool.openSource ? '<span class="oss-badge" title="Open Source">🔓</span>' : ''}
                    </div>
                </div>
                <p class="tool-description">${tool.description}</p>
                <div class="tool-meta">
                    <div class="platforms">
                        ${tool.platforms.map(platform => 
                            `<span class="platform" title="${platform}">${platformIcons[platform] || '🔧'}</span>`
                        ).join('')}
                    </div>
                    <div class="features">
                        ${tool.features.slice(0, 3).map(feature => 
                            `<span class="feature-tag">${feature}</span>`
                        ).join('')}
                    </div>
                </div>
                <div class="tool-actions">
                    <button class="btn-visit" onclick="window.MFMAwesomeDesignTools.visitTool('${tool.website}')">
                        🌐 Visit
                    </button>
                    <button class="btn-favorite" onclick="window.MFMAwesomeDesignTools.toggleFavorite('${tool.id}')">
                        ⭐
                    </button>
                </div>
            </div>
        `;
    }

    // Setup tool card interactions
    setupToolCardInteractions() {
        const cards = document.querySelectorAll('.tool-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.tool-actions')) {
                    const toolId = card.dataset.toolId;
                    this.viewToolDetails(toolId);
                }
            });
        });
    }

    // Visit tool
    visitTool(url) {
        window.open(url, '_blank');
    }

    // Toggle favorite
    toggleFavorite(toolId) {
        const index = this.favorites.indexOf(toolId);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(toolId);
        }
        this.saveUserPreferences();
        this.updateFavoriteButtons();
    }

    // Update favorite buttons
    updateFavoriteButtons() {
        const buttons = document.querySelectorAll('.btn-favorite');
        buttons.forEach(button => {
            const toolId = button.getAttribute('onclick').match(/'([^']+)'/)[1];
            if (this.favorites.includes(toolId)) {
                button.textContent = '⭐';
                button.classList.add('favorited');
            } else {
                button.textContent = '☆';
                button.classList.remove('favorited');
            }
        });
    }

    // View tool details
    viewToolDetails(toolId) {
        const tool = this.findToolById(toolId);
        if (!tool) return;
        
        this.recentlyViewed.unshift(toolId);
        if (this.recentlyViewed.length > 10) {
            this.recentlyViewed.pop();
        }
        
        // Create modal or expand details
        this.showToolModal(tool);
    }

    // Find tool by ID
    findToolById(toolId) {
        for (const category of Object.values(this.toolsDatabase.categories)) {
            const tool = category.tools.find(t => t.id === toolId);
            if (tool) return tool;
        }
        return null;
    }

    // Show tool modal
    showToolModal(tool) {
        // Implementation for tool detail modal
        console.log('Showing details for:', tool.name);
    }

    // Add to search history
    addToSearchHistory(query) {
        if (!query.trim()) return;
        
        const index = this.searchHistory.indexOf(query);
        if (index > -1) {
            this.searchHistory.splice(index, 1);
        }
        
        this.searchHistory.unshift(query);
        if (this.searchHistory.length > 10) {
            this.searchHistory.pop();
        }
        
        this.updateRecentSearches();
        this.saveUserPreferences();
    }

    // Update recent searches
    updateRecentSearches() {
        const container = document.getElementById('recentSearches');
        if (!container) return;
        
        if (this.searchHistory.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = `
            <h5>Recent Searches</h5>
            <div class="recent-search-list">
                ${this.searchHistory.map(query => 
                    `<span class="recent-search" onclick="window.MFMAwesomeDesignTools.performSearch('${query}')">${query}</span>`
                ).join('')}
            </div>
        `;
    }

    // Get total tools count
    getTotalToolsCount() {
        return Object.values(this.toolsDatabase.categories)
            .reduce((total, category) => total + category.tools.length, 0);
    }

    // Get free tools count
    getFreeToolsCount() {
        return Object.values(this.toolsDatabase.categories)
            .reduce((total, category) => 
                total + category.tools.filter(tool => tool.pricing === 'free').length, 0);
    }

    // Load user preferences
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('mfm-awesome-design-tools-preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                this.favorites = preferences.favorites || [];
                this.searchHistory = preferences.searchHistory || [];
                this.recentlyViewed = preferences.recentlyViewed || [];
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    // Save user preferences
    saveUserPreferences() {
        try {
            const preferences = {
                favorites: this.favorites,
                searchHistory: this.searchHistory,
                recentlyViewed: this.recentlyViewed
            };
            localStorage.setItem('mfm-awesome-design-tools-preferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    // Get integration status
    getIntegrationStatus() {
        return {
            initialized: this.isInitialized,
            totalTools: this.getTotalToolsCount(),
            categories: Object.keys(this.toolsDatabase.categories).length,
            freeTools: this.getFreeToolsCount(),
            favorites: this.favorites.length,
            searchHistory: this.searchHistory.length
        };
    }

    // Get tools by category
    getToolsByCategory(category) {
        return this.toolsDatabase.categories[category]?.tools || [];
    }

    // Get featured tools
    getFeaturedTools() {
        const featured = [];
        Object.values(this.toolsDatabase.categories).forEach(category => {
            featured.push(...category.tools.slice(0, 2));
        });
        return featured;
    }

    // Get recommendations
    getRecommendations(useCase) {
        // Simple recommendation logic based on use case
        const recommendations = {
            'accessibility': ['axe', 'leonardo', 'color-contrast-analyzer'],
            'prototyping': ['figma', 'sketch', 'adobe-xd'],
            'collaboration': ['slack', 'notion', 'miro'],
            'color-design': ['coolors', 'adobe-color', 'brand-colors'],
            'animation': ['lottie', 'gsap', 'framer-motion']
        };
        
        const toolIds = recommendations[useCase] || [];
        return toolIds.map(id => this.findToolById(id)).filter(Boolean);
    }
}

// Initialize Awesome Design Tools integration
window.MFMAwesomeDesignTools = new AwesomeDesignToolsIntegration();

// Export for use in MFM Corporation
window.MFMAwesomeDesignToolsSystem = {
    integration: window.MFMAwesomeDesignTools,
    status: window.MFMAwesomeDesignTools.getIntegrationStatus(),
    search: (query) => window.MFMAwesomeDesignTools.searchTools(query),
    getCategory: (category) => window.MFMAwesomeDesignTools.getToolsByCategory(category),
    getFeatured: () => window.MFMAwesomeDesignTools.getFeaturedTools(),
    getRecommendations: (useCase) => window.MFMAwesomeDesignTools.getRecommendations(useCase)
};
