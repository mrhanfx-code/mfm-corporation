## Code Context

**Query:** database operations

### Entry Points

- **DatabaseSpecialist** (class) - src/agents/cto/database-specialist.js:4
- **constructor** (method) - src/agents/cto/database-specialist.js:5
  `()`
- **queryDatabase** (function) - src/tools/notion-tool.js:84
  `(databaseId, env, filter = null)`

### Related Symbols

- src/core/agent-base.js: AgentBase:137
- src/tools/notion-tool.js: notionFetch:8
- tests/notion-tool.test.js: runTests:31

### Code

#### DatabaseSpecialist (src/agents/cto/database-specialist.js:4)

```javascript
export class DatabaseSpecialist extends AgentBase {
  constructor() {
    super({
      name: 'database-specialist',
      model: MODELS.CEREBRAS_FAST,
      tools: ['web-fetch', 'exa-search', 'codegraph-query', 'codegraph-context'],
      systemPrompt: `You are the Database Specialist for MFM Corporation ΓÇö responsible for D1 SQLite schema design, query optimisation, migration planning, and data governance.

D1 SQLite expertise:
- Schema design: normalisation (3NF where practical), foreign keys, indexes
- Query optimisation: EXPLAIN QUERY PLAN, index hints, avoid N+1 queries
- Migrations: additive only (no destructive changes), versioning, rollback plans
- Performance: D1 free tier has limits ΓÇö query within budget, cache in KV when helpful
- Data types: INTEGER, REAL, TEXT, BLOB ΓÇö use appropriate types

Current MFM schema tables (know these by heart):
- tasks (id, agent, input, output, status, quality_score, created_at, completed_at)
- agent_memory (id, agent, userId, role, content, created_at)
- decisions (id, agent, input, reasoning, confidence, created_at)
- metrics (id, agent, date, tasks_completed, avg_quality_score, avg_response_ms)
- dead_letter_queue (id, chat_id, user_id, text, task_type, error, attempts, failed_at)

For every DB request:
1. **Understand the data need** ΓÇö what entity, relationships, access patterns
2. **Design schema** ΓÇö tables, columns, types, constraints, indexes
3. **Write query** ΓÇö optimised, parameterised, explain plan reviewed
4. **Migration** 
... (truncated) ...
```

#### constructor (src/agents/cto/database-specialist.js:5)

```javascript
  constructor() {
    super({
      name: 'database-specialist',
      model: MODELS.CEREBRAS_FAST,
      tools: ['web-fetch', 'exa-search', 'codegraph-query', 'codegraph-context'],
      systemPrompt: `You are the Database Specialist for MFM Corporation ΓÇö responsible for D1 SQLite schema design, query optimisation, migration planning, and data governance.

D1 SQLite expertise:
- Schema design: normalisation (3NF where practical), foreign keys, indexes
- Query optimisation: EXPLAIN QUERY PLAN, index hints, avoid N+1 queries
- Migrations: additive only (no destructive changes), versioning, rollback plans
- Performance: D1 free tier has limits ΓÇö query within budget, cache in KV when helpful
- Data types: INTEGER, REAL, TEXT, BLOB ΓÇö use appropriate types

Current MFM schema tables (know these by heart):
- tasks (id, agent, input, output, status, quality_score, created_at, completed_at)
- agent_memory (id, agent, userId, role, content, created_at)
- decisions (id, agent, input, reasoning, confidence, created_at)
- metrics (id, agent, date, tasks_completed, avg_quality_score, avg_response_ms)
- dead_letter_queue (id, chat_id, user_id, text, task_type, error, attempts, failed_at)

For every DB request:
1. **Understand the data need** ΓÇö what entity, relationships, access patterns
2. **Design schema** ΓÇö tables, columns, types, constraints, indexes
3. **Write query** ΓÇö optimised, parameterised, explain plan reviewed
4. **Migration** ΓÇö CREATE TABLE / ALTER TABLE script, safe for produc
... (truncated) ...
```

#### queryDatabase (src/tools/notion-tool.js:84)

```javascript
export async function queryDatabase(databaseId, env, filter = null) {
  if (!env.NOTION_API_KEY) return { error: 'NOTION_API_KEY not configured.' };
  const body = filter ? { filter } : {};
  const { ok, data } = await notionFetch(`/databases/${databaseId}/query`, 'POST', body, env.NOTION_API_KEY);
  if (!ok) return { error: data.message || 'Failed to query database.' };
  const results = (data.results || []).map(r => ({
    id: r.id,
    title: r.properties?.title?.title?.[0]?.plain_text || 'Untitled',
    url: r.url,
  }));
  return { results, count: results.length };
}
```

#### notionFetch (src/tools/notion-tool.js:8)

```javascript
async function notionFetch(path, method = 'GET', body = null, token) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${NOTION_API}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
```

#### runTests (tests/notion-tool.test.js:31)

```javascript
async function runTests() {
  console.log('Running Notion Tool Tests...\n');

  await TestUtils.test('getPage returns error without API key', async () => {
    const result = await getPage('test-page-id', {});
    await TestUtils.assert(result.error === 'NOTION_API_KEY not configured.', 'Should return error');
  });

  await TestUtils.test('createPage returns error without API key', async () => {
    const result = await createPage('parent-id', 'Test Title', 'Test Content', {});
    await TestUtils.assert(result.error === 'NOTION_API_KEY not configured.', 'Should return error');
  });

  await TestUtils.test('appendToPage returns error without API key', async () => {
    const result = await appendToPage('page-id', 'Test Content', {});
    await TestUtils.assert(result.error === 'NOTION_API_KEY not configured.', 'Should return error');
  });

  await TestUtils.test('queryDatabase returns error without API key', async () => {
    const result = await queryDatabase('db-id', {});
    await TestUtils.assert(result.error === 'NOTION_API_KEY not configured.', 'Should return error');
  });

  await TestUtils.test('searchNotion returns error without API key', async () => {
    const result = await searchNotion('query', {});
    await TestUtils.assert(result.error === 'NOTION_API_KEY not configured.', 'Should return error');
  });

  console.log('\nNotion Tool Tests Complete');
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

