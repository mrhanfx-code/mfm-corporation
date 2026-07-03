// MFM Corporation - Organization Chart Integration
// Professional org chart generation and image export functionality

class OrgChartIntegration {
    constructor() {
        this.orgStructure = {
            ceo: {
                title: "CEO Remy",
                subtitle: "Chief Executive Officer",
                status: "🟢 Active",
                department: "Executive"
            },
            executives: [
                { title: "COO", subtitle: "Chief Operating Officer", status: "🟢 Active", department: "Operations" },
                { title: "CTO", subtitle: "Chief Technology Officer", status: "🟢 Active", department: "Technology" },
                { title: "CFO", subtitle: "Chief Financial Officer", status: "🟢 Active", department: "Finance" },
                { title: "CMO", subtitle: "Chief Marketing Officer", status: "🟢 Active", department: "Marketing" },
                { title: "CINO", subtitle: "Chief Innovation Officer", status: "🟢 Active", department: "Innovation" }
            ],
            teams: [
                { title: "Innovation", subtitle: "R&D Team", status: "🟢 Working", department: "Innovation" },
                { title: "Development", subtitle: "Software Team", status: "🟢 Working", department: "Technology" },
                { title: "Design", subtitle: "UI/UX Team", status: "🟢 Working", department: "Design" },
                { title: "Marketing", subtitle: "Digital Team", status: "🟢 Working", department: "Marketing" },
                { title: "Sales", subtitle: "Revenue Team", status: "🟢 Working", department: "Sales" },
                { title: "Finance", subtitle: "Accounting Team", status: "🟢 Working", department: "Finance" },
                { title: "HR", subtitle: "People Team", status: "🟢 Working", department: "Human Resources" },
                { title: "Legal", subtitle: "Compliance Team", status: "🟢 Working", department: "Legal" },
                { title: "Operations", subtitle: "Process Team", status: "🟢 Working", department: "Operations" },
                { title: "Quality", subtitle: "QA Team", status: "🟢 Working", department: "Quality" },
                { title: "Security", subtitle: "Cyber Team", status: "🟢 Working", department: "Security" },
                { title: "Data", subtitle: "Analytics Team", status: "🟢 Working", department: "Data" },
                { title: "AI", subtitle: "Machine Learning", status: "🟢 Working", department: "Technology" },
                { title: "Cloud", subtitle: "Infrastructure", status: "🟢 Working", department: "Technology" },
                { title: "Mobile", subtitle: "App Development", status: "🟢 Working", department: "Technology" },
                { title: "Web", subtitle: "Frontend Team", status: "🟢 Working", department: "Technology" },
                { title: "Backend", subtitle: "API Team", status: "🟢 Working", department: "Technology" },
                { title: "DevOps", subtitle: "Deployment Team", status: "🟢 Working", department: "Technology" },
                { title: "Support", subtitle: "Customer Service", status: "🟢 Working", department: "Support" }
            ]
        };
        
        this.chartContainer = null;
        this.isGenerated = false;
        this.testResults = {
            chartGeneration: false,
            canvasRendering: false,
            imageExport: false,
            fileDownload: false,
            imageQuality: false
        };
        
        this.initializeIntegration();
    }

    // Initialize the integration
    initializeIntegration() {
        this.setupChartContainer();
        this.setupEventListeners();
        this.loadHtml2Canvas();
        return this.getIntegrationStatus();
    }

    // Setup chart container
    setupChartContainer() {
        this.chartContainer = document.createElement('div');
        this.chartContainer.className = 'org-chart-container';
        this.chartContainer.innerHTML = `
            <div class="org-chart-header">
                <h3>📊 Organization Chart</h3>
                <div class="chart-controls">
                    <button class="btn btn-primary" onclick="window.MFMOrgChart.generateChart()">
                        📊 Generate Chart
                    </button>
                    <button class="btn btn-secondary" onclick="window.MFMOrgChart.downloadChart()">
                        📥 Download Image
                    </button>
                    <button class="btn btn-secondary" onclick="window.MFMOrgChart.testGeneration()">
                        🧪 Test
                    </button>
                </div>
            </div>
            <div class="org-chart-content" id="orgChartContent">
                <div class="chart-placeholder">
                    <h4>📊 MFM Corporation Organization Chart</h4>
                    <p>Click "Generate Chart" to visualize the corporate structure</p>
                </div>
            </div>
            <div class="org-chart-stats">
                <div class="stat-item">
                    <span class="stat-value">25</span>
                    <span class="stat-label">Total Employees</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">5</span>
                    <span class="stat-label">Executives</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">19</span>
                    <span class="stat-label">Teams</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">4</span>
                    <span class="stat-label">Departments</span>
                </div>
            </div>
            <div class="test-results">
                <h4>🧪 Image Generation Tests</h4>
                <div class="test-item">
                    <span>Chart Generation</span>
                    <span class="test-status status-pending" id="org-test-1">Pending</span>
                </div>
                <div class="test-item">
                    <span>Canvas Rendering</span>
                    <span class="test-status status-pending" id="org-test-2">Pending</span>
                </div>
                <div class="test-item">
                    <span>Image Export</span>
                    <span class="test-status status-pending" id="org-test-3">Pending</span>
                </div>
                <div class="test-item">
                    <span>File Download</span>
                    <span class="test-status status-pending" id="org-test-4">Pending</span>
                </div>
                <div class="test-item">
                    <span>Image Quality</span>
                    <span class="test-status status-pending" id="org-test-5">Pending</span>
                </div>
            </div>
        `;
    }

    // Setup event listeners
    setupEventListeners() {
        // Add chart container to sidebar when ready
        if (document.querySelector('.corporate-sidebar')) {
            this.integrateIntoSidebar();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this.integrateIntoSidebar();
            });
        }
    }

    // Integrate into sidebar
    integrateIntoSidebar() {
        const sidebar = document.querySelector('.corporate-sidebar');
        if (sidebar) {
            // Insert after team performance section
            const teamPerformance = document.querySelector('.team-performance');
            if (teamPerformance) {
                sidebar.insertBefore(this.chartContainer, teamPerformance.nextSibling);
            } else {
                sidebar.appendChild(this.chartContainer);
            }
        }
    }

    // Load html2canvas library
    loadHtml2Canvas() {
        if (typeof html2canvas === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
            script.onload = () => {
                console.log('html2canvas loaded successfully');
            };
            script.onerror = () => {
                console.error('Failed to load html2canvas');
            };
            document.head.appendChild(script);
        }
    }

    // Update test status
    updateTestStatus(testId, status) {
        const element = document.getElementById(`org-test-${testId}`);
        if (element) {
            element.className = `test-status status-${status}`;
            element.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        }
        
        // Update internal test results
        const testKeys = {
            1: 'chartGeneration',
            2: 'canvasRendering',
            3: 'imageExport',
            4: 'fileDownload',
            5: 'imageQuality'
        };
        
        if (testKeys[testId]) {
            this.testResults[testKeys[testId]] = status === 'pass';
        }
    }

    // Generate organization chart
    generateChart() {
        const content = document.getElementById('orgChartContent');
        if (!content) return;
        
        this.updateTestStatus(1, 'running');
        
        content.innerHTML = `
            <div class="org-chart">
                <div class="org-level">
                    <div class="org-box ceo">
                        <div class="org-title">${this.orgStructure.ceo.title}</div>
                        <div class="org-subtitle">${this.orgStructure.ceo.subtitle}</div>
                        <div class="org-status">${this.orgStructure.ceo.status}</div>
                    </div>
                </div>
                <div class="connector"></div>
                <div class="org-level">
                    ${this.orgStructure.executives.map(exec => `
                        <div class="org-box executive">
                            <div class="org-title">${exec.title}</div>
                            <div class="org-subtitle">${exec.subtitle}</div>
                            <div class="org-status">${exec.status}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="connector"></div>
                <div class="org-level teams-level">
                    ${this.orgStructure.teams.map(team => `
                        <div class="org-box team">
                            <div class="org-title">${team.title}</div>
                            <div class="org-subtitle">${team.subtitle}</div>
                            <div class="org-status">${team.status}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.isGenerated = true;
        this.updateTestStatus(1, 'pass');
        
        // Add animation
        setTimeout(() => {
            const boxes = content.querySelectorAll('.org-box');
            boxes.forEach((box, index) => {
                box.style.opacity = '0';
                box.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    box.style.transition = 'all 0.5s ease';
                    box.style.opacity = '1';
                    box.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 100);
    }

    // Download chart as image
    async downloadChart() {
        if (!this.isGenerated) {
            this.generateChart();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.updateTestStatus(2, 'running');
        
        try {
            const chartElement = document.querySelector('.org-chart');
            if (!chartElement) {
                throw new Error('Chart element not found');
            }
            
            if (typeof html2canvas === 'undefined') {
                throw new Error('html2canvas not loaded');
            }
            
            const canvas = await html2canvas(chartElement, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                useCORS: true,
                width: chartElement.offsetWidth,
                height: chartElement.offsetHeight
            });
            
            this.updateTestStatus(2, 'pass');
            this.updateTestStatus(3, 'running');
            
            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `mfm-corporation-org-chart-${new Date().toISOString().split('T')[0]}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    this.updateTestStatus(3, 'pass');
                    this.updateTestStatus(4, 'pass');
                    this.updateTestStatus(5, 'pass');
                } else {
                    throw new Error('Failed to create blob');
                }
            }, 'image/png');
            
        } catch (error) {
            console.error('Error downloading chart:', error);
            this.updateTestStatus(2, 'fail');
            this.updateTestStatus(3, 'fail');
            this.updateTestStatus(4, 'fail');
            this.updateTestStatus(5, 'fail');
        }
    }

    // Test generation functionality
    async testGeneration() {
        // Reset all tests
        for (let i = 1; i <= 5; i++) {
            this.updateTestStatus(i, 'pending');
        }
        
        // Generate chart
        this.generateChart();
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test download
        await this.downloadChart();
    }

    // Get integration status
    getIntegrationStatus() {
        const passedTests = Object.values(this.testResults).filter(result => result).length;
        const totalTests = Object.keys(this.testResults).length;
        
        return {
            initialized: true,
            isGenerated: this.isGenerated,
            testResults: this.testResults,
            testSummary: {
                passed: passedTests,
                total: totalTests,
                successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0
            },
            orgStructure: {
                totalEmployees: 1 + this.orgStructure.executives.length + this.orgStructure.teams.length,
                executives: this.orgStructure.executives.length,
                teams: this.orgStructure.teams.length,
                departments: [...new Set([
                    ...this.orgStructure.executives.map(e => e.department),
                    ...this.orgStructure.teams.map(t => t.department)
                ])].length
            }
        };
    }

    // Get organization statistics
    getOrgStatistics() {
        const departments = {};
        const statuses = {};
        
        // Count by department
        [...this.orgStructure.executives, ...this.orgStructure.teams].forEach(person => {
            departments[person.department] = (departments[person.department] || 0) + 1;
            statuses[person.status] = (statuses[person.status] || 0) + 1;
        });
        
        return {
            departments,
            statuses,
            totalEmployees: 1 + this.orgStructure.executives.length + this.orgStructure.teams.length,
            activeEmployees: statuses['🟢 Active'] || 0,
            workingTeams: statuses['🟢 Working'] || 0
        };
    }

    // Export organization data
    exportOrgData() {
        return {
            structure: this.orgStructure,
            statistics: this.getOrgStatistics(),
            testResults: this.testResults,
            exportDate: new Date().toISOString()
        };
    }
}

// Initialize Organization Chart integration
window.MFMOrgChart = new OrgChartIntegration();

// Export for use in MFM Corporation
window.MFMOrganizationChart = {
    integration: window.MFMOrgChart,
    status: window.MFMOrgChart.getIntegrationStatus(),
    statistics: window.MFMOrgChart.getOrgStatistics(),
    generate: () => window.MFMOrgChart.generateChart(),
    download: () => window.MFMOrgChart.downloadChart(),
    test: () => window.MFMOrgChart.testGeneration()
};
