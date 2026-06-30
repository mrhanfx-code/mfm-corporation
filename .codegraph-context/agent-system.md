## Code Context

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

#### Agent (dashboard/src/components/AgentCard.tsx:1)

```tsx
interface Agent {
  id: string;
  name: string;
  team: string;
  status: 'running' | 'idle' | 'error';
  load: number;
}
```

#### Agent (dashboard/src/components/DashboardNew.tsx:12)

```tsx
interface Agent {
  id: string;
  name: string;
  team: string;
  status: 'running' | 'idle' | 'error';
  load: number;
}
```

#### AgentBase (src/core/agent-base.js:137)

```javascript
  return calls;
}

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
    if (cleaned.length > INPUT_MAX_CHARS) return { error: `Input too long (${cleaned.length} chars, max ${INPUT_MAX_CHARS}).` };
    return { cleaned };
  }

  async run(userMessage, userId, env, options = {}) {
    const start = Date.now();
    this._draftMode = !!options.draftMode;

    const validation = this._validateInput(userMessage);
    if (validation.error) {
      logger.warn(this.name, 'input_invalid', { userId, reason: validation.error });
      return `ΓÜá∩╕Å ${validation.error}`;
    }
    const cleanMessage = validation.cleaned;

    // Emit agent status to dashboard
    emitAgentStatus(env, this.name, 'active', cleanMessage).catch(() => {});

    // Per-agent rate limiting: max 20 req/min per agent
    if (env.KV) {
      const minute   = Math.floor(Date.now() / 60000);
      const rateKey  = `rate:agent:${this.name}:${minute}`;
      const hits     = parseInt(await env.KV.get(rateKey) || '0');
      if (hits >= AGENT_RATE_LIMIT) {
        logger.warn(this.name, 'rate_limited', { userId, hits });
        return `ΓÅ│ Agent *${this.name}
... (truncated) ...
```

#### mapApiAgents (dashboard/src/components/DashboardNew.tsx:59)

```tsx
function mapApiAgents(raw: { agent: string; task_count: number; avg_score: number; last_activity: string }[]): Agent[] {
  return raw.map((a, i) => {
    const minsSinceActive = (Date.now() - new Date(a.last_activity).getTime()) / 60000;
    const status: Agent['status'] = minsSinceActive < 5 ? 'running' : 'idle';
    const team = agentNameToTeam(a.agent);
    const prettyName = a.agent.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return {
      id: `${team.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
      name: prettyName,
      team,
      status,
      load: Math.min(Math.round((a.task_count || 0) * 8), 98),
    };
  });
}
```

#### constructor (src/core/agent-base.js:138)

```javascript
}

export class AgentBase {
  constructor({ name, model, systemPrompt, tools = [] }) {
    this.name = name;
    this.model = model;
```

#### _validateInput (src/core/agent-base.js:145)

```javascript
    this.tools = tools;
  }

  _validateInput(input) {
    if (typeof input !== 'string') return { error: 'Input must be a string.' };
    const cleaned = input.replace(CTRL_CHAR_PATTERN, '').trim();
    if (!cleaned) return { error: 'Empty input.' };
```

#### run (src/core/agent-base.js:153)

```javascript
    return { cleaned };
  }

  async run(userMessage, userId, env, options = {}) {
    const start = Date.now();
    this._draftMode = !!options.draftMode;

    const validation = this._validateInput(userMessage);
    if (validation.error) {
      logger.warn(this.name, 'input_invalid', { userId, reason: validation.error });
      return `ΓÜá∩╕Å ${validation.error}`;
    }
    const cleanMessage = validation.cleaned;

    // Emit agent status to dashboard
    emitAgentStatus(env, this.name, 'active', cleanMessage).catch(() => {});

    // Per-agent rate limiting: max 20 req/min per agent
    if (env.KV) {
      const minute   = Math.floor(Date.now() / 60000);
      const rateKey  = `rate:agent:${this.name}:${minute}`;
      const hits     = parseInt(await env.KV.get(rateKey) || '0');
      if (hits >= AGENT_RATE_LIMIT) {
        logger.warn(this.name, 'rate_limited', { userId, hits });
        return `ΓÅ│ Agent *${this.name}* is busy (rate limit). Retry in a moment.`;
      }
      await env.KV.put(rateKey, String(hits + 1), { expirationTtl: 120 });
    }

    const taskId = this._draftMode ? null : await saveTask(this.name, cleanMessage, env);

    try {
      const history = await getMemory(this.name, userId, 20, env);
      const toolInstructions = buildToolInstructions(this.tools);
      const contextSection = options.contextCard
        ? `\n\n--- BUSINESS CONTEXT ---\n${options.contextCard}\n------------------------`
        : '';

      const baseMessages = [
        { role:
... (truncated) ...
```

#### useTool (src/core/agent-base.js:251)

```javascript
    }
  }

  async useTool(toolName, args, env) {
    if (!this.tools.includes(toolName)) {
      return `[Tool ${toolName} not available for ${this.name}]`;
    }

    switch (toolName) {
      case 'web-fetch': {
        if (!args?.url) return '[web-fetch] Missing required argument: url';
        return await fetchWebContent(args.url, args.maxChars);
      }
      case 'send-email': {
        if (!args?.to || !args?.subject || !args?.body) {
          return '[send-email] Missing required arguments: to, subject, body';
        }
        if (this._draftMode) {
          return `[DRAFT EMAIL]
To: ${args.to}
Subject: ${args.subject}

${args.body}`;
        }
        return await sendEmail(args.to, args.subject, args.body, env);
      }
      case 'exa-search': {
        if (!args?.query) return '[exa-search] Missing required argument: query';
        return await searchExa(args.query, env, { numResults: args.numResults || 5 });
      }
      case 'social-post': {
        if (!args?.platform) return '[social-post] Missing required argument: platform';
        if (this._draftMode) {
          return `[DRAFT ${(args.platform || 'POST').toUpperCase()}
Caption/Text: ${args.caption || args.text || ''}
Image: ${args.imageUrl || 'auto-selected'}
Video: ${args.videoUrl || 'n/a'}]`;
        }
        return await postSocial(args.platform, args, env);
      }
      case 'perplexity-search': {
        if (!args?.query) return '[perplexity-search] Missing required argument: query';
       
... (truncated) ...
```

#### finalizeScore (src/core/agent-base.js:388)

```javascript
        const result = await queryCodegraph(args.query);
        return result || '[codegraph-query] No results found';
      }
      case 'codegraph-context': {
        if (!args?.task) return '[codegraph-context] Missing required argument: task';
        const result = await getCodeContext(args.task);
        return result || '[codegraph-context] Context generation failed';
      }
      default:
        return `[Unknown tool: ${toolName}]`;
    }
  }

  async finalizeScore(score, env) {
    if (!this._lastResult) return;
    const responseMs = this._lastResponseMs || 0;
    await updateTaskScore(this._lastTaskId, score, env);
    await updateMetrics(this.name, 1, score, responseMs, env);
    syncAgentEvent({
      agent: this.name,
      task: this._lastMessage || '',
      response: this._lastResult.content || '',
```

#### clearMemory (src/core/agent-base.js:411)

```javascript
      latencyMs: responseMs,
      provider: this._lastResult.provider,
      model: this._lastResult.model,
```

