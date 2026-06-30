## Code Context

**Query:** api integration

### Entry Points

- **IntegrationAgent** (class) - src/agents/cto/integration-agent.js:4
- **OrgChartIntegration** (class) - js/org-chart-integration.js:4
- **OrgChartIntegration** (class) - public/js/org-chart-integration.js:4

### Related Symbols

- src/core/agent-base.js: AgentBase:137
- src/agents/cto/integration-agent.js: constructor:5
- js/org-chart-integration.js: constructor:5, initializeIntegration:57, setupChartContainer:65, setupEventListeners:134, integrateIntoSidebar:146, loadHtml2Canvas:160, updateTestStatus:175, generateChart:197

### Code

#### IntegrationAgent (src/agents/cto/integration-agent.js:4)

```javascript
export class IntegrationAgent extends AgentBase {
  constructor() {
    super({
      name: 'integration-agent',
      model: MODELS.CEREBRAS_FAST,
      tools: ['web-fetch', 'exa-search', 'codegraph-query', 'codegraph-context'],
      systemPrompt: `You are the API & Integration Specialist for MFM Corporation, reporting to the CTO.
Tech stack: Cloudflare Workers (JS ES modules), D1 (SQLite), KV, R2, SendGrid, Telegram Bot API, Supabase REST.

For any integration or API request:
1. Integration Assessment (what connects to what, data flow diagram)
2. Technical Approach (REST / webhook / polling / event-driven ΓÇö with justification)
3. Implementation Plan (step-by-step, Cloudflare Workers compatible)
4. Authentication & Security (API keys, OAuth, webhook signatures)
5. Error Handling & Monitoring (retries, fallbacks, alerting)

SYSTEM INTEGRATOR PROTOCOL:
- Verify interface compatibility before proposing implementation
- Check shared modules and env config standards (all secrets via wrangler, not hardcoded)
- Split integration logic by domain: auth / data-fetch / transform / storage
- End every response with a ΓÇÿConnection SummaryΓÇÖ: what is now connected and how

Constraints: No npm packages beyond Cloudflare Workers native support. Use fetch() for all HTTP.
Rate limits, PDPA Malaysia data handling, and secret management via wrangler secrets always apply.`
    });
  }
}
```

#### OrgChartIntegration (js/org-chart-integration.js:4)

```javascript
class OrgChartIntegration {
    constructor() {
        this.orgStructure = {
            ceo: {
                title: "CEO Remy",
                subtitle: "Chief Executive Officer",
                status: "≡ƒƒó Active",
                department: "Executive"
            },
            executives: [
                { title: "COO", subtitle: "Chief Operating Officer", status: "≡ƒƒó Active", department: "Operations" },
                { title: "CTO", subtitle: "Chief Technology Officer", status: "≡ƒƒó Active", department: "Technology" },
                { title: "CFO", subtitle: "Chief Financial Officer", status: "≡ƒƒó Active", department: "Finance" },
                { title: "CMO", subtitle: "Chief Marketing Officer", status: "≡ƒƒó Active", department: "Marketing" },
                { title: "CINO", subtitle: "Chief Innovation Officer", status: "≡ƒƒó Active", department: "Innovation" }
            ],
            teams: [
                { title: "Innovation", subtitle: "R&D Team", status: "≡ƒƒó Working", department: "Innovation" },
                { title: "Development", subtitle: "Software Team", status: "≡ƒƒó Working", department: "Technology" },
                { title: "Design", subtitle: "UI/UX Team", status: "≡ƒƒó Working", department: "Design" },
                { title: "Marketing", subtitle: "Digital Team", status: "≡ƒƒó Working", department: "Marketing" },
                { title: "Sales", subtitle: "Revenue Team", status: "≡ƒƒó Working", department: "Sales" },
                { titl
... (truncated) ...
```

#### OrgChartIntegration (public/js/org-chart-integration.js:4)

```javascript
class OrgChartIntegration {
    constructor() {
        this.orgStructure = {
            ceo: {
                title: "CEO Remy",
                subtitle: "Chief Executive Officer",
                status: "≡ƒƒó Active",
                department: "Executive"
            },
            executives: [
                { title: "COO", subtitle: "Chief Operating Officer", status: "≡ƒƒó Active", department: "Operations" },
                { title: "CTO", subtitle: "Chief Technology Officer", status: "≡ƒƒó Active", department: "Technology" },
                { title: "CFO", subtitle: "Chief Financial Officer", status: "≡ƒƒó Active", department: "Finance" },
                { title: "CMO", subtitle: "Chief Marketing Officer", status: "≡ƒƒó Active", department: "Marketing" },
                { title: "CINO", subtitle: "Chief Innovation Officer", status: "≡ƒƒó Active", department: "Innovation" }
            ],
            teams: [
                { title: "Innovation", subtitle: "R&D Team", status: "≡ƒƒó Working", department: "Innovation" },
                { title: "Development", subtitle: "Software Team", status: "≡ƒƒó Working", department: "Technology" },
                { title: "Design", subtitle: "UI/UX Team", status: "≡ƒƒó Working", department: "Design" },
                { title: "Marketing", subtitle: "Digital Team", status: "≡ƒƒó Working", department: "Marketing" },
                { title: "Sales", subtitle: "Revenue Team", status: "≡ƒƒó Working", department: "Sales" },
                { titl
... (truncated) ...
```

#### constructor (src/agents/cto/integration-agent.js:5)

```javascript
  constructor() {
    super({
      name: 'integration-agent',
      model: MODELS.CEREBRAS_FAST,
      tools: ['web-fetch', 'exa-search', 'codegraph-query', 'codegraph-context'],
      systemPrompt: `You are the API & Integration Specialist for MFM Corporation, reporting to the CTO.
Tech stack: Cloudflare Workers (JS ES modules), D1 (SQLite), KV, R2, SendGrid, Telegram Bot API, Supabase REST.

For any integration or API request:
1. Integration Assessment (what connects to what, data flow diagram)
2. Technical Approach (REST / webhook / polling / event-driven ΓÇö with justification)
3. Implementation Plan (step-by-step, Cloudflare Workers compatible)
4. Authentication & Security (API keys, OAuth, webhook signatures)
5. Error Handling & Monitoring (retries, fallbacks, alerting)

SYSTEM INTEGRATOR PROTOCOL:
- Verify interface compatibility before proposing implementation
- Check shared modules and env config standards (all secrets via wrangler, not hardcoded)
- Split integration logic by domain: auth / data-fetch / transform / storage
- End every response with a ΓÇÿConnection SummaryΓÇÖ: what is now connected and how

Constraints: No npm packages beyond Cloudflare Workers native support. Use fetch() for all HTTP.
Rate limits, PDPA Malaysia data handling, and secret management via wrangler secrets always apply.`
    });
  }
```

#### constructor (js/org-chart-integration.js:5)

```javascript
    constructor() {
        this.orgStructure = {
            ceo: {
                title: "CEO Remy",
                subtitle: "Chief Executive Officer",
                status: "≡ƒƒó Active",
                department: "Executive"
            },
            executives: [
                { title: "COO", subtitle: "Chief Operating Officer", status: "≡ƒƒó Active", department: "Operations" },
                { title: "CTO", subtitle: "Chief Technology Officer", status: "≡ƒƒó Active", department: "Technology" },
                { title: "CFO", subtitle: "Chief Financial Officer", status: "≡ƒƒó Active", department: "Finance" },
                { title: "CMO", subtitle: "Chief Marketing Officer", status: "≡ƒƒó Active", department: "Marketing" },
                { title: "CINO", subtitle: "Chief Innovation Officer", status: "≡ƒƒó Active", department: "Innovation" }
            ],
            teams: [
                { title: "Innovation", subtitle: "R&D Team", status: "≡ƒƒó Working", department: "Innovation" },
                { title: "Development", subtitle: "Software Team", status: "≡ƒƒó Working", department: "Technology" },
                { title: "Design", subtitle: "UI/UX Team", status: "≡ƒƒó Working", department: "Design" },
                { title: "Marketing", subtitle: "Digital Team", status: "≡ƒƒó Working", department: "Marketing" },
                { title: "Sales", subtitle: "Revenue Team", status: "≡ƒƒó Working", department: "Sales" },
                { title: "Finance", subtitle: "Acc
... (truncated) ...
```

#### initializeIntegration (js/org-chart-integration.js:57)

```javascript
    initializeIntegration() {
        this.setupChartContainer();
        this.setupEventListeners();
        this.loadHtml2Canvas();
        return this.getIntegrationStatus();
    }
```

#### setupChartContainer (js/org-chart-integration.js:65)

```javascript
    setupChartContainer() {
        this.chartContainer = document.createElement('div');
        this.chartContainer.className = 'org-chart-container';
        this.chartContainer.innerHTML = `
            <div class="org-chart-header">
                <h3>≡ƒôè Organization Chart</h3>
                <div class="chart-controls">
                    <button class="btn btn-primary" onclick="window.MFMOrgChart.generateChart()">
                        ≡ƒôè Generate Chart
                    </button>
                    <button class="btn btn-secondary" onclick="window.MFMOrgChart.downloadChart()">
                        ≡ƒôÑ Download Image
                    </button>
                    <button class="btn btn-secondary" onclick="window.MFMOrgChart.testGeneration()">
                        ≡ƒº¬ Test
                    </button>
                </div>
            </div>
            <div class="org-chart-content" id="orgChartContent">
                <div class="chart-placeholder">
                    <h4>≡ƒôè MFM Corporation Organization Chart</h4>
                    <p>Click "Generate Chart" to visualize the corporate structure</p>
                </div>
            </div>
            <div class="org-chart-stats">
                <div class="stat-item">
                    <span class="stat-value">25</span>
                    <span class="stat-label">Total Employees</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">5<
... (truncated) ...
```

#### setupEventListeners (js/org-chart-integration.js:134)

```javascript
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
```

#### integrateIntoSidebar (js/org-chart-integration.js:146)

```javascript
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
```

#### loadHtml2Canvas (js/org-chart-integration.js:160)

```javascript
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
```

