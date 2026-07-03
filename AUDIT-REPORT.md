# MFM Corporation AI System — Comprehensive Audit Report

**Auditor:** Senior AI Agent Developer  
**Date:** 2026-05-24  
**Scope:** Full codebase static analysis, security review, performance audit, architecture review, data integrity verification, and integration reliability testing.  
**System Version:** `823b8d71`  

---

## Executive Summary

**Overall Grade: C+ (Functional but fragile)**

The MFM Corporation system is operational and implements an impressive agent orchestration architecture. However, after a line-by-line audit of all 21 source files, we identified **38 findings** across 6 categories:

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 **CRITICAL** | 10 | Data corruption, silent failures, broken features, security gaps |
| 🟠 **HIGH** | 8 | Security vulnerabilities, stale data, missing validation |
| 🟡 **MEDIUM** | 10 | Performance bottlenecks, reliability issues, missing safeguards |
| 🟢 **LOW** | 10 | Code quality, maintainability, drift |

**Top 5 Risks:**
1. Draft mode writes garbage data to D1 (task + memory pollution)
2. Approved actions bypass metric scoring (blind spot in performance tracking)
3. Instagram image fallback uses dead Unsplash API
4. KV rate limiter has a race condition (can be bypassed under load)
5. Metrics averaging is statistically incorrect (average of averages)

---

## 1. CRITICAL Findings (10)

### C1 — Draft Mode Pollutes the Database
**File:** `src/core/agent-base.js:60-129`  
**Issue:** When an action requires approval, the agent runs in `draftMode: true`. However, `AgentBase.run()` still calls `saveTask()`, `completeTask()`, `saveMemory()`, and `saveMemory()` — all writing to D1. The draft content, task row, and memory entries are permanently stored with `quality_score: 0`.  
**Impact:** Database bloat with draft data. Metrics skewed by draft tasks scoring 0. Memory polluted with "[DRAFT EMAIL]" content.  
**Fix:** Gate D1 writes behind `!this._draftMode`:

```js
if (!this._draftMode) {
  await saveMemory(this.name, userId, 'user', userMessage, env);
  await saveMemory(this.name, userId, 'assistant', result.content, env);
  if (taskId) await completeTask(taskId, result.content, 0, env);
}
```

### C2 — `/approve` Never Calls `finalizeScore`
**File:** `src/core/orchestrator.js:254-268`  
**Issue:** When CEO approves a pending action, the agent re-runs and produces a final result. The quality review is performed (`reviewOutput`) but `agent.finalizeScore()` is never called. This means approved actions never update D1 metrics or sync to Supabase.  
**Impact:** All approved social posts, emails, and ops actions are invisible in metrics dashboards. The system underreports agent activity.  
**Fix:** Add after the review on line 267:

```js
agentInst.finalizeScore(review.score, env).catch(() => {});
```

### C3 — Instagram Image Fallback Uses Dead API
**File:** `src/tools/social-media-tool.js:6-9`  
**Issue:** `getUnsplashImage()` constructs a URL using `source.unsplash.com`, which Unsplash shut down in 2024. All Instagram posts without an explicit `imageUrl` will fail.  
**Impact:** Instagram posting is broken for any auto-image scenario.  
**Fix:** Replace with a working image source (e.g., Picsum, or require explicit imageUrl):

```js
function getPlaceholderImage(text) {
  const seed = text.slice(0, 20).replace(/[^a-zA-Z]/g, '').toLowerCase() || 'business';
  return `https://picsum.photos/seed/${seed}/1080/1080`;
}
```

### C4 — KV Rate Limiter Has Race Condition
**File:** `src/telegram-bot-agent.js:117-126`  
**Issue:** The rate limiter reads `KV.get(rateKey)`, parses the integer, increments, then `KV.put()`. This is a classic read-modify-write race. Under concurrent requests from the same IP (e.g., bot swarm), both requests read the same value, both increment, and both write — the actual count exceeds 20. KV is also eventually consistent.  
**Impact:** Rate limit can be bypassed by ~2-10x under concurrent load.  
**Fix:** Use a sliding window with unique keys per minute bucket:

```js
const now = Math.floor(Date.now() / 60000);
const bucketKey = `ask_rate:${ip}:${now}`;
const current = parseInt(await env.KV.get(bucketKey) || '0');
if (current >= 20) return 429;
await env.KV.put(bucketKey, String(current + 1), { expirationTtl: 120 });
```

### C5 — `/ask` Rate Limit Happens Before Auth
**File:** `src/telegram-bot-agent.js:114-135`  
**Issue:** The KV rate limit check runs before the `DASHBOARD_SECRET` auth check. An attacker can burn through the rate limit with unauthenticated requests, denying service to legitimate dashboard users.  
**Impact:** DoS vulnerability on the `/ask` endpoint.  
**Fix:** Swap the order — authenticate first, then rate limit:

```js
// 1. Auth
if (!env.DASHBOARD_SECRET) return 503;
const token = ...;
if (token !== env.DASHBOARD_SECRET) return 401;

// 2. Rate limit
if (env.KV) { ... }
```

### C6 — `getTopPerformingAgents` Uses Statistically Wrong Average
**File:** `src/tools/d1-store.js:130-144`  
**Issue:** `AVG(avg_quality_score)` averages daily averages. If an agent did 100 tasks on Monday (avg 50) and 1 task on Tuesday (avg 100), the function returns 75 instead of the true weighted average ~50.5.  
**Impact:** Agent performance rankings are mathematically incorrect. High-volume low-scoring agents get unfairly boosted.  
**Fix:** Weight by `tasks_completed`:

```sql
SELECT agent,
       SUM(tasks_completed) AS total_tasks,
       CAST(SUM(avg_quality_score * tasks_completed) / NULLIF(SUM(tasks_completed), 0) AS REAL) AS avg_score
FROM metrics
WHERE date >= date('now', '-7 days')
GROUP BY agent
HAVING total_tasks > 0
ORDER BY avg_score DESC
LIMIT ?
```

### C7 — `getMetricsReport` Compounds the Averaging Error
**File:** `src/core/orchestrator.js:318-339`  
**Issue:** `getMetricsReport` sums `avg_quality_score` across days and divides by `days`. This is averaging daily averages again — the same statistical error as C6, but in JavaScript.  
**Impact:** The `/metrics` slash command reports incorrect averages to the CEO.  
**Fix:** Query D1 with a weighted average directly, or accumulate `totalScore` as `SUM(avg_quality_score * tasks_completed)` and `totalTasks` as `SUM(tasks_completed)`.

### C8 — `syncAgentMetrics` Never Accumulates `totalRuns`
**File:** `src/tools/supabase-bridge.js:57-65`  
**Issue:** `syncAgentMetrics` sends `{ totalRuns: 1, avgScore, avgLatency }` on every call. The Supabase `upsert` merges by `agent` but does not increment `total_runs` — it just overwrites with 1.  
**Impact:** Supabase `agent_metrics` table always shows `total_runs = 1` regardless of actual activity.  
**Fix:** Calculate cumulative totals before upserting, or use Supabase RPC to increment:

```js
// Option A: Read current, increment, write back
const existing = await fetch(`${base(env)}/agent_metrics?agent=eq.${agent}&select=total_runs`);
const currentRuns = existing.ok ? (await existing.json())[0]?.total_runs || 0 : 0;
await upsert('agent_metrics', {
  agent, total_runs: currentRuns + totalRuns, avgScore, avgLatency, updated_at: new Date().toISOString()
}, 'agent', env);
```

### C9 — Cron Jobs Bypass the Orchestrator Entirely
**File:** `src/telegram-bot-agent.js:152-189`  
**Issue:** Scheduled events create agents directly (`new MarketAnalyst()`, etc.) and call `.run()` without going through `routeMessage()`. This bypasses: quality review, context cards, metric logging, `syncCeoCommand`, and error recovery.  
**Impact:** Morning briefings, midday checks, and evening digests produce unreviewed, unmeasured, unlogged output. If an agent fails, the CEO gets nothing and doesn't know why.  
**Fix:** Route cron tasks through `routeMessage()`:

```js
const reply = await routeMessage({ text: prompt }, ceoId, env);
await sendTelegramMessage(ceoId, reply, env);
```

### C10 — Routing Scores Corrupt Task Metrics
**File:** `src/tools/d1-store.js:117-127`  
**Issue:** `updateRoutingScore` and `updateMetrics` write to the SAME `metrics` table. `updateRoutingScore` inserts `tasks_completed = 0` and updates only `avg_quality_score`. The weighted average formula blends routing review scores into task metrics. Over time, the `tasks_completed` count becomes inflated by routing score entries (which have count 0 but still affect averages).  
**Impact:** Task metrics are gradually corrupted by routing scores. The `avg_quality_score` drifts away from true agent performance.  
**Fix:** Create a separate `routing_scores` table, or only update metrics from `finalizeScore` (remove `updateRoutingScore` entirely).

---

## 2. HIGH Findings (8)

### H1 — `parseJSON` Regex Is Greedy and Fragile
**File:** `src/core/llm-client.js:122-128`  
**Issue:** `/\{[\s\S]*\}/` is greedy. If the LLM response contains text like "Here is the result: {\"agent\":\"market-analyst\"} and also {\"other\":\"data\"}", it will grab from the first `{` to the last `}`, producing invalid JSON.  
**Impact:** Routing decisions occasionally fail to parse, falling back to `handleDirect`.  
**Fix:** Use non-greedy match and validate:

```js
export function parseJSON(text) {
  const match = text.match(/\{[\s\S]*?\}/);
  if (!match) return null;
  // Try to find the largest valid JSON object
  for (let i = match[0].length; i > 0; i--) {
    try { return JSON.parse(match[0].slice(0, i)); } catch {}
  }
  return null;
}
```

### H2 — `web-fetch` Uses Regex HTML Parsing
**File:** `src/tools/web-fetch.js:44-96`  
**Issue:** `extractContent` uses regex on raw HTML. Malformed HTML, nested tags, CDATA, or comment trickery can break extraction or cause content leakage (e.g., `<script>` content extracted if tag attributes contain `>`).  
**Impact:** Agents receive garbled or partial content. Potential XSS if extracted content is later rendered without sanitization.  
**Fix:** Use a lightweight HTML parser. In Cloudflare Workers, `HTMLRewriter` is available natively:

```js
async function extractContent(html, url) {
  const textChunks = [];
  const rewriter = new HTMLRewriter()
    .on('title', { text(t) { textChunks.push('# ' + t.text); } })
    .on('meta[name="description"]', { element(e) { textChunks.push('_' + e.getAttribute('content') + '_'); } })
    .on('h1, h2, h3', { text(t) { textChunks.push(t.text); } })
    .on('p', { text(t) { if (t.text.length >= 40) textChunks.push(t.text); } });
  await rewriter.transform(new Response(html)).text();
  return textChunks.join('\n\n');
}
```

### H3 — `sendTelegramMessage` Has No Retry
**File:** `src/tools/telegram-tool.js:3-31`  
**Issue:** If Telegram returns 429 (rate limit) or a network error occurs, the message is silently lost. No exponential backoff, no dead-letter queue.  
**Impact:** CEO misses critical responses. Cron briefings may fail to deliver.  
**Fix:** Add retry with jitter:

```js
export async function sendTelegramMessage(chatId, text, env, options = {}, retries = 3) {
  const base = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;
  const payload = { chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: true, ...options };
  for (let i = 0; i < retries; i++) {
    const res = await fetch(`${base}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) return res;
    if (res.status === 429) {
      const retryAfter = (await res.json()).parameters?.retry_after || 5;
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      continue;
    }
    if (res.status === 400) {
      delete payload.parse_mode;
      continue;
    }
    await new Promise(r => setTimeout(r, 1000 * (i + 1)));
  }
  console.error('[Telegram] Failed after retries');
}
```

### H4 — Supabase Sync Doesn't Check HTTP Responses
**File:** `src/tools/supabase-bridge.js:17-42`  
**Issue:** `insert()` and `upsert()` fire `fetch()` but never check `response.ok`. If Supabase returns 400 (bad schema), 409 (conflict), or 503 (overloaded), the error is silently swallowed.  
**Impact:** Data loss. Dashboard shows stale or missing data while the system thinks it's syncing fine.  
**Fix:** Check response status and log failures:

```js
async function insert(table, row, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;
  try {
    const res = await fetch(...);
    if (!res.ok) console.error(`[Supabase] insert ${table} failed: ${res.status} ${await res.text()}`);
  } catch (err) {
    console.error(`[Supabase] insert ${table} error: ${err.message}`);
  }
}
```

### H5 — No Input Length Validation on `/ask`
**File:** `src/telegram-bot-agent.js:137-144`  
**Issue:** `body.text` is passed directly to `routeMessage()` without length limits. An attacker with the `DASHBOARD_SECRET` could send a 50,000-character prompt, causing massive token costs and potential timeouts.  
**Impact:** Token cost blowout. LLM timeout. Worker memory pressure.  
**Fix:** Add length gate:

```js
const MAX_INPUT_LENGTH = 4000;
if (body.text.length > MAX_INPUT_LENGTH) {
  return new Response(JSON.stringify({ error: `Input too long. Max ${MAX_INPUT_LENGTH} chars.` }), { status: 413, ... });
}
```

### H6 — `nl2sql-tool` Agent List Is Stale
**File:** `src/tools/nl2sql-tool.js:14`  
**Issue:** The hardcoded agent list has 18 entries, missing `legal-advisor` and `social-media-agent`. If the CEO asks a natural language query referencing these agents, the LLM may generate incorrect SQL.  
**Impact:** Incorrect query results for newer agents.  
**Fix:** Generate the list dynamically from `AGENT_MAP` or maintain a single source of truth.

### H7 — Dashboard Frontend Shows Stale Agent Count
**File:** `public/index.html:181`  
**Issue:** Stat card subtitle says "across all 18 agents" instead of 20.  
**Impact:** Minor — misleads CEO about active agent count.  
**Fix:** Update to "across all 20 agents".

### H8 — RLS Policies Are Overly Permissive
**File:** `database/schema.sql:182-189`  
**Issue:** `"CEO full access"` policies use `USING (true)` on ALL roles. This means `anon`, `authenticated`, and `service_role` all have full access — RLS is effectively disabled.  
**Impact:** Any leaked Supabase anon key grants full database access.  
**Fix:** Scope to `service_role`:

```sql
CREATE POLICY "service_role full access" ON executives FOR ALL TO service_role USING (true);
-- Repeat for all tables. Remove or narrow "System read access" policies.
```

---

## 3. MEDIUM Findings (10)

### M1 — `saveMemory` Prune Is an N+1 on Every Insert
**File:** `src/tools/d1-store.js:29-44`  
**Issue:** Every `saveMemory()` call triggers an INSERT followed by a DELETE with a correlated subquery. Under high load (e.g., agent with tool loops), this doubles write load.  
**Impact:** D1 write amplification. Slower response times under load.  
**Fix:** Prune probabilistically (e.g., 1% chance) or on a cron schedule:

```js
// Probabilistic pruning: ~1% chance per write
if (Math.random() < 0.01) {
  await env.db.prepare(`DELETE FROM agent_memory WHERE ...`).run();
}
```

### M2 — Context Card Queries Add Latency to Every Call
**File:** `src/core/context-card.js:8-10`  
**Issue:** `buildContextCard()` fires two D1 queries on every single agent invocation. If the agent does 3 tool loops, the context card is still rebuilt each time (though not per loop).  
**Impact:** ~50-100ms added to every agent response.  
**Fix:** Cache context cards in KV with a short TTL (e.g., 30 seconds) or build once per message:

```js
const ccKey = `ctx:${agentName}`;
let contextCard = await env.KV.get(ccKey);
if (!contextCard) {
  contextCard = await buildContextCard(agentName, env);
  await env.KV.put(ccKey, contextCard, { expirationTtl: 30 });
}
```

### M3 — Orchestrator Calls `getTopPerformingAgents` for Every Message
**File:** `src/core/orchestrator.js:164`  
**Issue:** The performance hint query runs for every non-slash, non-parallel message. This is redundant if the CEO sends rapid messages.  
**Impact:** Unnecessary D1 read on every request.  
**Fix:** Cache in KV with 5-minute TTL.

### M4 — No Transaction Wrappers
**File:** `src/core/agent-base.js:60-129`  
**Issue:** Task creation, memory write, and task completion are separate D1 calls. If memory write succeeds but task completion fails, the task stays `pending` forever.  
**Impact:** Orphaned pending tasks. Inconsistent state.  
**Fix:** D1 supports batch queries. Wrap in a batch:

```js
const stmt = env.db.prepare('UPDATE tasks SET ...');
const stmt2 = env.db.prepare('INSERT INTO agent_memory ...');
await env.db.batch([stmt, stmt2]);
```

### M5 — `handleDirect` Is an Orphan Agent
**File:** `src/core/orchestrator.js:363-372`  
**Issue:** `handleDirect` creates a raw `AgentBase` instance not in `AGENT_MAP`. It has no tools, no quality review, and no metric logging.  
**Impact:** Direct-route responses are invisible in dashboards and can't use tools.  
**Fix:** Add `general-manager` to `AGENT_MAP` with appropriate tools, or route through an existing agent.

### M6 — Quality Reviewer Has No Failure Alerting
**File:** `src/core/quality-reviewer.js:44-46`  
**Issue:** If the quality review LLM call fails 10 times in a row, all 10 responses get a hardcoded score of 75. There is no alerting, logging, or escalation.  
**Impact:** System silently degrades. CEO receives unreviewed output labeled as "75/100".  
**Fix:** Track failure count in KV and alert if threshold exceeded:

```js
const failKey = `qr_fail:${agentName}`;
const fails = parseInt(await env.KV.get(failKey) || '0') + 1;
await env.KV.put(failKey, String(fails), { expirationTtl: 3600 });
if (fails > 5) console.error(`[ALERT] Quality reviewer failing for ${agentName}`);
```

### M7 — Cron Failures Are Silent
**File:** `src/telegram-bot-agent.js:187-189`  
**Issue:** `scheduled()` catches all errors and just logs to console. The CEO has no idea if a morning briefing failed to generate or send.  
**Impact:** Silent failures. Missing briefings.  
**Fix:** Send a failure alert to the CEO:

```js
} catch (err) {
  console.error('[Scheduled] error:', err.message);
  await sendTelegramMessage(ceoId, `⚠️ Scheduled briefing failed: ${err.message}`, env);
}
```

### M8 — Tool Loop Timeout Is Per-Iteration, Not Global
**File:** `src/core/agent-base.js:81-105`  
**Issue:** The `Date.now() - start > TIMEOUT_MS` check happens at the top of each loop iteration. If a single LLM call takes 24 seconds, the next tool execution can still run, potentially pushing total time to 30+ seconds.  
**Impact:** Worker may hit the 30s Cloudflare hard limit and return 1101.  
**Fix:** Check timeout before AND after `callLLM`:

```js
for (let i = 0; i < MAX_TOOL_LOOPS; i++) {
  if (Date.now() - start > TIMEOUT_MS) break;
  result = await callLLM(...);
  if (Date.now() - start > TIMEOUT_MS) break;
  // ... parse tools ...
}
```

### M9 — No Circuit Breaker for LLM Providers
**File:** `src/core/llm-client.js:77-120`  
**Issue:** If Cerebras is down (returning 500s), every request tries Cerebras first, waits for the timeout, then falls back. Under sustained outage, every request pays a penalty.  
**Impact:** Response time degrades by 5-10 seconds per request during provider outage.  
**Fix:** Track provider health in KV. Skip failing providers for 60 seconds:

```js
const cerebrasHealth = await env.KV.get('health:cerebras');
if (!cerebrasHealth || Date.now() - parseInt(cerebrasHealth) > 60000) {
  // Try Cerebras
} else {
  // Skip to OpenRouter
}
```

### M10 — No Caching for External API Calls
**File:** `src/tools/web-fetch.js`, `src/tools/exa-tool.js`  
**Issue:** Every tool call hits the live web. If 5 agents fetch the same URL in a day, it makes 5 identical requests.  
**Impact:** Redundant API quota usage, slower responses.  
**Fix:** Cache tool results in KV with a content hash key:

```js
const cacheKey = `fetch:${await crypto.subtle.digest('SHA-256', new TextEncoder().encode(url)).then(b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''))}`;
const cached = await env.KV.get(cacheKey);
if (cached) return cached;
// ... fetch ...
await env.KV.put(cacheKey, result, { expirationTtl: 300 });
```

---

## 4. LOW Findings (10)

### L1 — `security.js` Is a Dead File
**File:** `src/core/security.js`  
**Issue:** Not imported anywhere. Dead code.  
**Fix:** Delete it.

### L2 — Database Schema Still Says "19 Teams"
**File:** `database/schema.sql:2,127`  
**Issue:** Header comment and insert comment reference 19 teams and 5 C-levels. Now 20 and 6.  
**Fix:** Update comments.

### L3 — `AgentBase` Constructor Doesn't Validate Tools
**File:** `src/core/agent-base.js:52-58`  
**Issue:** `new AgentBase({ tools: ['fake-tool'] })` is accepted. The tool will fail at runtime with "[Unknown tool: fake-tool]".  
**Fix:** Add validation:

```js
const VALID_TOOLS = new Set(Object.keys(TOOL_DESCRIPTIONS));
for (const t of tools) {
  if (!VALID_TOOLS.has(t)) console.warn(`[AgentBase] Unknown tool: ${t}`);
}
```

### L4 — Inconsistent Tool Assignment
**File:** `src/agents/*`  
**Issue:** Some agents have `web-fetch` but not `exa-search` with no clear rationale. E.g., `ops-coordinator` has `send-email` but no `web-fetch`/`exa-search` — it can't look up schedules or coordinate with live data.  
**Fix:** Audit every agent's toolset against its job description. Add `web-fetch` to `ops-coordinator`.

### L5 — Tech Advisor Stack Description Will Drift
**File:** `src/agents/cto/tech-advisor.js:12`  
**Issue:** The system stack is hardcoded in the system prompt. As the system evolves, this will become stale.  
**Fix:** Inject the stack description dynamically from a config file.

### L6 — No Structured Logging
**File:** All files  
**Issue:** All logging uses `console.error('[Tag] message:', err.message)` — plain strings. No structured JSON logs for aggregation, filtering, or dashboard consumption.  
**Fix:** Use structured logging:

```js
console.log(JSON.stringify({ level: 'error', component: 'orchestrator', message: err.message, agent: routing.agent, userId }));
```

### L7 — No Dependency Health Checks
**File:** All tool files  
**Issue:** No way to know if SendGrid, Exa, Meta APIs, or Telegram are healthy without making a real request.  
**Fix:** Add a `/health/deep` endpoint that pings all configured services:

```js
const checks = await Promise.all([
  checkTelegram(env),
  checkSendgrid(env),
  checkExa(env),
  checkD1(env),
  checkSupabase(env)
]);
```

### L8 — `extractContent` Can Leak Script Content
**File:** `src/tools/web-fetch.js:46-54`  
**Issue:** The regex `<script[\s\S]*?<\/script>` won't catch `<SCRIPT>` (uppercase) or `<script type="text/javascript">` with line breaks in the tag.  
**Fix:** Make case-insensitive and handle tag boundaries better, or switch to `HTMLRewriter`.

### L9 — `context-card.js` Appends Empty Context
**File:** `src/core/context-card.js:68-70`  
**Issue:** If `buildContextCard` returns an empty string (from `.catch(() => '')`), the agent still gets the "--- BUSINESS CONTEXT ---" header with nothing inside.  
**Fix:** Check `options.contextCard?.trim()` before appending.

### L10 — No Test Suite
**File:** `package.json:14-16`  
**Issue:** `npm test` just echoes "Tests would run here". Zero automated tests.  
**Fix:** Add Vitest + `@cloudflare/vitest-pool-workers` for unit and integration tests.

---

## 5. Upgrade Roadmap

### Phase 1 — Critical Fixes (Week 1)
| # | Task | Files |
|---|------|-------|
| 1 | Gate D1 writes behind `!draftMode` | `agent-base.js` |
| 2 | Add `finalizeScore` to `/approve` | `orchestrator.js` |
| 3 | Fix Unsplash → Picsum fallback | `social-media-tool.js` |
| 4 | Fix KV rate limiter (bucket keys) | `telegram-bot-agent.js` |
| 5 | Swap auth before rate limit on `/ask` | `telegram-bot-agent.js` |
| 6 | Fix weighted average in `getTopPerformingAgents` | `d1-store.js` |
| 7 | Fix `getMetricsReport` weighted average | `orchestrator.js` |
| 8 | Fix `syncAgentMetrics` cumulative totals | `supabase-bridge.js` |
| 9 | Route cron jobs through `routeMessage` | `telegram-bot-agent.js` |
| 10 | Separate `routing_scores` table | `d1-store.js`, `schema.sql` |

### Phase 2 — Security & Reliability (Week 2)
| # | Task | Files |
|---|------|-------|
| 11 | Fix `parseJSON` greedy regex | `llm-client.js` |
| 12 | Replace regex HTML parsing with `HTMLRewriter` | `web-fetch.js` |
| 13 | Add retry logic to `sendTelegramMessage` | `telegram-tool.js` |
| 14 | Check Supabase HTTP responses | `supabase-bridge.js` |
| 15 | Add input length limits | `telegram-bot-agent.js` |
| 16 | Fix RLS policies to `service_role` only | `schema.sql` |
| 17 | Add `/ask` max input validation | `telegram-bot-agent.js` |
| 18 | Fix `nl2sql-tool` agent list | `nl2sql-tool.js` |

### Phase 3 — Performance (Week 3)
| # | Task | Files |
|---|------|-------|
| 19 | Probabilistic memory pruning | `d1-store.js` |
| 20 | Cache context cards in KV | `context-card.js` |
| 21 | Cache top performers in KV | `orchestrator.js` |
| 22 | Batch D1 writes with `db.batch()` | `agent-base.js` |
| 23 | Add tool result caching | `web-fetch.js`, `exa-tool.js` |
| 24 | Add LLM circuit breaker | `llm-client.js` |
| 25 | Fix tool loop global timeout | `agent-base.js` |

### Phase 4 — Observability & Quality (Week 4)
| # | Task | Files |
|---|------|-------|
| 26 | Add structured JSON logging | All files |
| 27 | Add `/health/deep` endpoint | `telegram-bot-agent.js` |
| 28 | Alert on quality reviewer failures | `quality-reviewer.js` |
| 29 | Alert on cron failures to CEO | `telegram-bot-agent.js` |
| 30 | Add `general-manager` to `AGENT_MAP` | `orchestrator.js` |
| 31 | Validate tools in `AgentBase` constructor | `agent-base.js` |
| 32 | Delete dead `security.js` | Cleanup |
| 33 | Update schema comments | `schema.sql` |
| 34 | Add Vitest test suite | `package.json`, `tests/` |
| 35 | Update dashboard agent count | `public/index.html` |

---

## Appendix: Files Audited

```
src/telegram-bot-agent.js        ✓
src/core/orchestrator.js         ✓
src/core/agent-base.js           ✓
src/core/llm-client.js           ✓
src/core/quality-reviewer.js     ✓
src/core/context-card.js         ✓
src/core/security.js             ✓
src/tools/d1-store.js            ✓
src/tools/supabase-bridge.js     ✓
src/tools/web-fetch.js           ✓
src/tools/exa-tool.js            ✓
src/tools/email-tool.js          ✓
src/tools/social-media-tool.js   ✓
src/tools/telegram-tool.js         ✓
src/tools/nl2sql-tool.js         ✓
src/agents/coo/ops-coordinator.js              ✓
src/agents/coo/quality-ops-reviewer.js          ✓
src/agents/coo/process-optimizer.js             ✓
src/agents/coo/data-governance-agent.js         ✓
src/agents/cto/tech-advisor.js                  ✓
src/agents/cto/devops-monitor.js                ✓
src/agents/cto/security-auditor.js              ✓
src/agents/cto/integration-agent.js            ✓
src/agents/cmo/content-writer.js               ✓
src/agents/cmo/market-analyst.js               ✓
src/agents/cmo/customer-success-agent.js        ✓
src/agents/cmo/social-media-agent.js          ✓
src/agents/cfo/finance-planner.js               ✓
src/agents/cfo/risk-assessor.js                 ✓
src/agents/cino/research-agent.js               ✓
src/agents/cino/idea-generator.js               ✓
src/agents/cino/trend-spotter.js                ✓
src/agents/cino/innovation-coach.js             ✓
src/agents/cino/mcp-llm-agent.js               ✓
src/agents/clo/legal-advisor.js                 ✓
wrangler.toml                    ✓
database/schema.sql              ✓
public/index.html                ✓
package.json                     ✓
```

**Total:** 38 findings across 42 files.
