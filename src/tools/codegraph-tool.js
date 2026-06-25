// Codegraph integration tool for MFM Corporation agents
// Provides pre-indexed code context for faster, cheaper code understanding
// Uses inline context strings for Cloudflare Workers compatibility

// Pre-generated context strings (Workers-compatible)
const CONTEXTS = {
  'agent-system': `## Code Context

**Query:** agent system architecture

### Entry Points

- **Agent** (interface) - dashboard/src/components/AgentCard.tsx:1
- **Agent** (interface) - dashboard/src/components/DashboardNew.tsx:12
- **AgentBase** (class) - src/core/agent-base.js:137

### Related Symbols

- dashboard/src/components/AgentCard.tsx: AgentCardProps:9
- dashboard/src/components/DashboardNew.tsx: FALLBACK_AGENTS:30, mapApiAgents:59
- src/core/agent-base.js: constructor:138, _validateInput:145, run:153, useTool:251, finalizeScore:388, clearMemory:411
- src/agents/cfo/finance-planner.js: FinancePlanner:4

### Code

#### AgentBase (src/core/agent-base.js:137)

\`\`\`javascript
export class AgentBase {
  constructor({ name, model, systemPrompt, tools = [] }) {
    this.name = name;
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.tools = tools;
  }

  _validateInput(input) {
    if (typeof input !== 'string') return { error: 'Input must be a string.' };
    const cleaned = input.replace(CTRL_CHAR_PATTERN, '').trim();
    if (!cleaned) return { error: 'Empty input.' };
    if (cleaned.length > INPUT_MAX_CHARS) return { error: \`Input too long (\${cleaned.length} chars, max \${INPUT_MAX_CHARS}).\` };
    return { cleaned };
  }

  async run(userMessage, userId, env, options = {}) {
    const start = Date.now();
    this._draftMode = !!options.draftMode;

    const validation = this._validateInput(userMessage);
    if (validation.error) {
      logger.warn(this.name, 'input_invalid', { userId, reason: validation.error });
      return \`⚠️ \${validation.error}\`;
    }
    const cleanMessage = validation.cleaned;

    // Emit agent status to dashboard
    emitAgentStatus(env, this.name, 'active', cleanMessage).catch(() => {});

    // Per-agent rate limiting: max 20 req/min per agent
    if (env.KV) {
      const minute   = Math.floor(Date.now() / 60000);
      const rateKey  = \`rate:agent:\${this.name}:\${minute}\`;
      const hits     = parseInt(await env.KV.get(rateKey) || '0');
      if (hits >= AGENT_RATE_LIMIT) {
        logger.warn(this.name, 'rate_limited', { userId, hits });
        return \`⏳ Agent *\${this.name}* is busy (rate limit). Retry in a moment.\`;
      }
      await env.KV.put(rateKey, String(hits + 1), { expirationTtl: 120 });
    }

    const taskId = this._draftMode ? null : await saveTask(this.name, cleanMessage, env);

    try {
      const history = await getMemory(this.name, userId, 20, env);
      const toolInstructions = buildToolInstructions(this.tools);
      const contextSection = options.contextCard
        ? \`\\n\\n--- BUSINESS CONTEXT ---\\n\${options.contextCard}\\n------------------------\`
        : '';

      const baseMessages = [
        { role: 'system', content: this.systemPrompt + contextSection },
        ...history,
        { role: 'user', content: cleanMessage }
      ];

      const result = await this._callLLM(baseMessages, env);
      this._lastResult = result;
      this._lastResponseMs = Date.now() - start;
      this._lastMessage = cleanMessage;
      this._lastTaskId = taskId;

      if (!this._draftMode && taskId) {
        await updateTask(taskId, result.content, env);
      }

      return result.content;
    } catch (error) {
      logger.error(this.name, 'run_error', { userId, error: error.message });
      return \`❌ Error: \${error.message}\`;
    }
  }

  async useTool(toolName, args, env) {
    if (!this.tools.includes(toolName)) {
      return \`[Tool \${toolName} not available for \${this.name}]\`;
    }

    switch (toolName) {
      case 'codegraph-query': {
        if (!args?.query) return '[codegraph-query] Missing required argument: query';
        const result = await queryCodegraph(args.query);
        return result || '[codegraph-query] No results found';
      }
      case 'codegraph-context': {
        if (!args?.task) return '[codegraph-context] Missing required argument: task';
        const result = await getCodeContext(args.task);
        return result || '[codegraph-context] Context generation failed';
      }
      default:
        return \`[Unknown tool: \${toolName}]\`;
    }
  }
}
\`\`\`
`,

  'database-operations': `## Code Context

**Query:** database operations

### Entry Points

- **DatabaseSpecialist** (class) - src/agents/cto/database-specialist.js:4
- **queryDatabase** (function) - src/tools/notion-tool.js:84

### Related Symbols

- src/core/agent-base.js: AgentBase:137
- src/tools/notion-tool.js: notionFetch:8

### Code

#### DatabaseSpecialist (src/agents/cto/database-specialist.js:4)

\`\`\`javascript
export class DatabaseSpecialist extends AgentBase {
  constructor() {
    super({
      name: 'database-specialist',
      model: MODELS.CEREBRAS_FAST,
      tools: ['web-fetch', 'exa-search', 'codegraph-query', 'codegraph-context'],
      systemPrompt: \`You are the Database Specialist for MFM Corporation — responsible for D1 SQLite schema design, query optimisation, migration planning, and data governance.

D1 SQLite expertise:
- Schema design: normalisation (3NF where practical), foreign keys, indexes
- Query optimisation: EXPLAIN QUERY PLAN, index hints, avoid N+1 queries
- Migrations: additive only (no destructive changes), versioning, rollback plans
- Performance: D1 free tier has limits — query within budget, cache in KV when helpful
- Data types: INTEGER, REAL, TEXT, BLOB — use appropriate types

Current MFM schema tables (know these by heart):
- tasks (id, agent, input, output, status, quality_score, created_at, completed_at)
- agent_memory (id, agent, userId, role, content, created_at)
- decisions (id, agent, input, reasoning, confidence, created_at)
- metrics (id, agent, date, tasks_completed, avg_quality_score, avg_response_ms)
- dead_letter_queue (id, chat_id, user_id, text, task_type, error, attempts, failed_at)

For every DB request:
1. **Understand the data need** — what entity, relationships, access patterns
2. **Design schema** — tables, columns, types, constraints, indexes
3. **Write query** — optimised, parameterised, explain plan reviewed
4. **Migration** — CREATE TABLE / ALTER TABLE script, safe for production
5. **Performance check** — will this query scan? Is there an index? Is KV caching needed?

Query standards:
- Always use parameterised queries: .prepare().bind() — never string concat
- Add indexes for WHERE columns used in common queries
- Include created_at / updated_at timestamps
- Soft deletes where possible (status column), not DELETE
- Document query complexity (O(1) index lookup vs O(N) full scan)

Security: Never expose raw SQL in agent output. Never log sensitive data.\`
    });
  }
}
\`\`\`
`,

  'cloudflare-workers': `## Code Context

**Query:** cloudflare workers deployment

### Entry Points

- **CLOUDFLARE_CONFIG** (constant) - js/config.js:5
- **WORKER_URL** (constant) - dashboard/src/components/DashboardNew.tsx:28

### Code

#### CLOUDFLARE_CONFIG (js/config.js:5)

\`\`\`javascript
const CLOUDFLARE_CONFIG = {
    apiUrl: 'https://mfm-corporation-api.mrhan-fx.workers.dev',
    pagesUrl: 'https://mfm-corporation-git.pages.dev',
    endpoints: {
        status: '/api/status',
        userPreferences: '/api/user/preferences',
        toolsSearch: '/api/tools/search',
        analytics: '/api/analytics',
        upload: '/api/upload',
        chat: '/api/chat'
    }
};
\`\`\`

#### WORKER_URL (dashboard/src/components/DashboardNew.tsx:28)

\`\`\`tsx
const WORKER_URL = 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';
\`\`\`
`,

  'api-integration': `## Code Context

**Query:** api integration

### Entry Points

- **IntegrationAgent** (class) - src/agents/cto/integration-agent.js:4

### Code

#### IntegrationAgent (src/agents/cto/integration-agent.js:4)

\`\`\`javascript
export class IntegrationAgent extends AgentBase {
  constructor() {
    super({
      name: 'integration-agent',
      model: MODELS.CEREBRAS_FAST,
      tools: ['web-fetch', 'exa-search', 'codegraph-query', 'codegraph-context'],
      systemPrompt: \`You are the API & Integration Specialist for MFM Corporation, reporting to the CTO.
Tech stack: Cloudflare Workers (JS ES modules), D1 (SQLite), KV, R2, SendGrid, Telegram Bot API, Supabase REST.

For any integration or API request:
1. Integration Assessment (what connects to what, data flow diagram)
2. Technical Approach (REST / webhook / polling / event-driven — with justification)
3. Implementation Plan (step-by-step, Cloudflare Workers compatible)
4. Authentication & Security (API keys, OAuth, webhook signatures)
5. Error Handling & Monitoring (retries, fallbacks, alerting)

SYSTEM INTEGRATOR PROTOCOL:
- Verify interface compatibility before proposing implementation
- Check shared modules and env config standards (all secrets via wrangler, not hardcoded)
- Split integration logic by domain: auth / data-fetch / transform / storage
- End every response with a 'Connection Summary': what is now connected and how

Constraints: No npm packages beyond Cloudflare Workers native support. Use fetch() for all HTTP.
Rate limits, PDPA Malaysia data handling, and secret management via wrangler secrets always apply.\`
    });
  }
}
\`\`\`
`,

  'security-authentication': `## Code Context

**Query:** security authentication

### Entry Points

- **SecurityAuditor** (class) - src/agents/cto/security-auditor.js:4

### Code

#### SecurityAuditor (src/agents/cto/security-auditor.js:4)

\`\`\`javascript
export class SecurityAuditor extends AgentBase {
  constructor() {
    super({
      name: 'security-auditor',
      model: MODELS.CEREBRAS_FAST,
      tools: ['codegraph-query', 'codegraph-context'],
      systemPrompt: \`You are the Security Auditor for MFM Corporation.
Expertise: vulnerability assessment, OWASP, access control, data privacy, incident response.
Stack: Cloudflare Workers, D1 SQLite, KV, R2, Supabase, Telegram Bot API, Wrangler secrets.

For any security review:
1. Threat Assessment (severity: CRITICAL / HIGH / MEDIUM / LOW)
2. Vulnerabilities Found (specific issues with file/line reference if given)
3. Immediate Mitigations (apply today — CRITICAL and HIGH only)
4. Long-term Hardening (MEDIUM and LOW, improve over time)
5. Compliance Status (PDPA Malaysia, GDPR if applicable)

SECURITY SCAN CHECKLIST — always verify:
✓ Exposed secrets or API keys hardcoded in source
✓ Environment variables accessed directly vs via env object
✓ SQL injection surface (use parameterized queries only)
✓ Input validation at all system boundaries
✓ Auth bypass possibilities on webhook endpoints
✓ Files > 500 lines (increased attack surface from monoliths)
✓ Rate limiting on all public endpoints
✓ CORS and security headers present

Never downplay risks. Flag CRITICAL issues first. Be specific, not generic.\`
    });
  }
}
\`\`\`
`,

  'telegram-bot': `## Code Context

**Query:** telegram bot

### Entry Points

- **REQUIRED** (constant) - src/telegram-bot-agent.js:8
- **sendTelegramMessage** (function) - src/tools/telegram-tool.js:5

### Code

#### REQUIRED (src/telegram-bot-agent.js:8)

\`\`\`javascript
const REQUIRED = ['TELEGRAM_BOT_TOKEN', 'WEBHOOK_SECRET', 'OPENROUTER_API_KEY'];
\`\`\`

#### sendTelegramMessage (src/tools/telegram-tool.js:5)

\`\`\`javascript
export async function sendTelegramMessage(chatId, text, env, options = {}) {
  const base = \`https://api.telegram.org/bot\${env.TELEGRAM_BOT_TOKEN}\`;

  const payload = {
    chat_id: chatId,
    text: (text || '').slice(0, 4096),
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    ...options
  };

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(500 * attempt);
    try {
      let res = await fetch(\`\${base}/sendMessage\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) return res;

      // Markdown parse error — retry without parse_mode
      if (res.status === 400) {
        const fallback = { chat_id: chatId, text: payload.text, disable_web_page_preview: true, ...options };
        delete fallback.parse_mode;
        res = await fetch(\`\${base}/sendMessage\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fallback)
        });
        return res;
      }

      // Server errors — retry
      if (res.status >= 500) {
        lastErr = new Error(\`Telegram API \${res.status}\`);
        continue;
      }

      return res;
    } catch (err) {
      lastErr = err;
    }
  }

  console.error('[Telegram] send failed after 3 attempts:', lastErr?.message);
  return { ok: false, status: 0 };
}
\`\`\`
`
};

/**
 * Query the Codegraph index for symbols
 * @param {string} query - Search query for symbols
 * @returns {Promise<string>} Search results or fallback message
 */
export async function queryCodegraph(query) {
  // In Workers environment, return fallback message
  // Pre-generated context doesn't support dynamic queries
  return `[codegraph-query] Dynamic queries not available in Workers. Use codegraph-context for pre-generated code context. Available contexts: agent-system, database-operations, cloudflare-workers, api-integration, security-authentication, telegram-bot`;
}

/**
 * Get code context for a task using inline strings
 * @param {string} task - Task description
 * @returns {Promise<string>} Code context in markdown format
 */
export async function getCodeContext(task) {
  // Map task keywords to context keys
  const contextMap = {
    'agent': 'agent-system',
    'agent system': 'agent-system',
    'architecture': 'agent-system',
    'database': 'database-operations',
    'db': 'database-operations',
    'sql': 'database-operations',
    'd1': 'database-operations',
    'cloudflare': 'cloudflare-workers',
    'workers': 'cloudflare-workers',
    'deployment': 'cloudflare-workers',
    'api': 'api-integration',
    'integration': 'api-integration',
    'webhook': 'api-integration',
    'security': 'security-authentication',
    'auth': 'security-authentication',
    'authentication': 'security-authentication',
    'telegram': 'telegram-bot',
    'bot': 'telegram-bot',
    'messaging': 'telegram-bot'
  };

  // Find matching context key
  let contextKey = null;
  const taskLower = task.toLowerCase();
  
  for (const [keyword, key] of Object.entries(contextMap)) {
    if (taskLower.includes(keyword)) {
      contextKey = key;
      break;
    }
  }

  // If no match, return list of available contexts
  if (!contextKey) {
    return `[codegraph-context] No pre-generated context found for "${task}". Available contexts: agent-system, database-operations, cloudflare-workers, api-integration, security-authentication, telegram-bot. Use these keywords in your task to retrieve relevant context.`;
  }

  // Return the inline context string
  return CONTEXTS[contextKey] || `[codegraph-context] Context not found: ${contextKey}`;
}

/**
 * Get Codegraph index status
 * @returns {Promise<string>} Index status and statistics
 */
export async function getCodegraphStatus() {
  return `[codegraph-status] Pre-generated context mode. 6 context files available: agent-system, database-operations, cloudflare-workers, api-integration, security-authentication, telegram-bot. Regenerate context files after code changes using: codegraph context "<topic>" > .codegraph-context/<topic>.md`;
}

/**
 * Find callers of a specific symbol
 * @param {string} symbol - Symbol name
 * @returns {Promise<string>} List of callers
 */
export async function getCodegraphCallers(symbol) {
  return `[codegraph-callers] Caller analysis not available in pre-generated context mode. Use codegraph-context for high-level code understanding.`;
}

/**
 * Find callees of a specific symbol
 * @param {string} symbol - Symbol name
 * @returns {Promise<string>} List of callees
 */
export async function getCodegraphCallees(symbol) {
  return `[codegraph-callees] Callee analysis not available in pre-generated context mode. Use codegraph-context for high-level code understanding.`;
}

/**
 * Analyze impact of changing a symbol
 * @param {string} symbol - Symbol name
 * @returns {Promise<string>} Impact analysis
 */
export async function getCodegraphImpact(symbol) {
  return `[codegraph-impact] Impact analysis not available in pre-generated context mode. Use codegraph-context for high-level code understanding.`;
}
