# MFM Corporation — Real Agent Implementation Plan
**Goal**: Replace all cosmetic agents with live, LLM-powered AI agents  
**Stack**: Cloudflare Workers + OpenRouter (free) + D1 + KV + Queues  
**Cost**: $0/month (free tiers only)

---

## Architecture Overview

```
Telegram Message
      ↓
  [index.js] — webhook entry point
      ↓
  [Orchestrator] — intent classification → routes to department
      ↓
  [C-Level Agent] — COO / CTO / CMO / CFO / CINO
      ↓
  [Team Agent] — specialist execution with tools
      ↓
  [QualityReviewer] — scores output before sending
      ↓
  Telegram Reply → CEO Remy
```

**Async flow** (for complex tasks):
```
Webhook → Queue → Agent Worker → D1 result → Telegram notify
```

---

## File Structure

```
src/
├── index.js                    ← Main Worker entry (webhook handler)
├── core/
│   ├── llm-client.js           ← OpenRouter wrapper (shared by all agents)
│   ├── agent-base.js           ← Base Agent class with memory + tools
│   ├── orchestrator.js         ← Routes message to correct department
│   ├── quality-reviewer.js     ← Scores every agent output before sending
│   └── router.js               ← Intent → department mapping
├── tools/
│   ├── web-fetch.js            ← Fetch + parse web content (for research)
│   ├── kv-memory.js            ← Per-agent KV memory store
│   ├── d1-store.js             ← Task history, decisions, logs
│   ├── email-tool.js           ← SendGrid send/receive
│   └── telegram-tool.js        ← sendMessage, sendTyping
├── agents/
│   ├── coo/
│   │   ├── ops-coordinator.js
│   │   ├── quality-reviewer.js
│   │   └── process-optimizer.js
│   ├── cto/
│   │   ├── tech-advisor.js
│   │   ├── devops-monitor.js
│   │   └── security-auditor.js
│   ├── cmo/
│   │   ├── content-writer.js
│   │   └── market-analyst.js
│   ├── cfo/
│   │   ├── finance-planner.js
│   │   └── risk-assessor.js
│   └── cino/
│       ├── research-agent.js
│       ├── idea-generator.js
│       ├── trend-spotter.js
│       └── innovation-coach.js
└── db/
    └── schema.sql              ← D1 schema for tasks, memory, logs
```

---

## D1 Database Schema

```sql
-- Agent task history
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  agent TEXT NOT NULL,
  input TEXT NOT NULL,
  output TEXT,
  status TEXT DEFAULT 'pending',
  quality_score REAL,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

-- Per-agent conversation memory
CREATE TABLE agent_memory (
  agent TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,       -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (agent, user_id, created_at)
);

-- Decision log (audit trail)
CREATE TABLE decisions (
  id TEXT PRIMARY KEY,
  agent TEXT NOT NULL,
  input TEXT NOT NULL,
  reasoning TEXT,
  decision TEXT NOT NULL,
  confidence REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- KPI metrics per agent
CREATE TABLE metrics (
  agent TEXT NOT NULL,
  date TEXT NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  avg_quality_score REAL DEFAULT 0,
  avg_response_ms INTEGER DEFAULT 0,
  PRIMARY KEY (agent, date)
);
```

---

## Phase 1 — Foundation (Build First)
**Estimated time**: 1-2 days  
**Enables**: All other phases

### 1.1 LLM Client (`src/core/llm-client.js`)
- OpenRouter API wrapper
- Supports model selection per agent
- Retry on 429/500
- Streaming support for long responses
- Conversation history injection

### 1.2 Agent Base Class (`src/core/agent-base.js`)
- Constructor: `name`, `model`, `systemPrompt`, `tools[]`
- `run(userMessage, userId)` — main entry
- `getMemory(userId)` — loads last N turns from D1
- `saveMemory(userId, role, content)` — stores to D1
- `callTool(toolName, args)` — executes tool by name
- `logDecision(input, reasoning, decision)` — audit log

### 1.3 Tools
- `web-fetch.js` — `fetch(url)` returns cleaned text (strip HTML)
- `kv-memory.js` — fast short-term KV cache per agent+user
- `d1-store.js` — task CRUD, metrics write, decision log
- `email-tool.js` — SendGrid send with template support
- `telegram-tool.js` — sendMessage, sendTyping indicator

### 1.4 D1 Schema
- Run `schema.sql` against `mfm-corporation-db`

---

## Phase 2 — Orchestrator (Build Second)
**Estimated time**: 1 day  
**Enables**: All message routing

### `src/core/orchestrator.js`
**Model**: `deepseek/deepseek-chat-v3-0324:free`

**System prompt**:
```
You are the General Manager of MFM Corporation reporting to CEO Remy.
Your job is to classify the CEO's message and route it to the correct department.

Respond ONLY with JSON:
{"department": "coo|cto|cmo|cfo|cino|direct", "task_type": "string", "urgency": "high|medium|low", "reasoning": "string"}

Departments:
- coo: operations, processes, quality, scheduling, staff
- cto: technology, code, security, infrastructure, systems
- cmo: marketing, content, brand, social media, campaigns
- cfo: finance, budget, costs, revenue, forecasting, risk
- cino: research, innovation, ideas, trends, strategy
- direct: greetings, status checks, simple questions CEO can answer directly
```

**Logic**:
1. Classify intent → department
2. Load department's C-level agent
3. C-level agent picks team agent
4. Send typing indicator while processing
5. QualityReviewer scores output
6. Send final reply

---

## Phase 3 — COO Layer
**Model**: `deepseek/deepseek-chat-v3-0324:free`

### `agents/coo/ops-coordinator.js`
**Role**: Daily operations, task scheduling, team coordination  
**Memory**: Last 20 turns per user  
**Tools**: `d1-store` (read/write tasks), `email-tool` (task assignments)  
**System prompt**: Operations-focused, action-oriented, uses bullet points

### `agents/coo/quality-reviewer.js`
**Role**: Reviews all agent outputs, scores 0-100  
**Model**: `meta-llama/llama-3.3-70b-instruct:free`  
**Tools**: None (pure LLM evaluation)  
**Returns**: `{ score, feedback, approved, suggestions }`  
**Gate**: If score < 60, agent retries once with feedback

### `agents/coo/process-optimizer.js`
**Role**: Identifies bottlenecks, recommends improvements  
**Tools**: `d1-store` (reads metrics table), `web-fetch` (industry benchmarks)

---

## Phase 4 — CTO Layer
**Model**: `deepseek/deepseek-r1:free` (reasoning-heavy)

### `agents/cto/tech-advisor.js`
**Role**: Architecture, code review, technical decisions  
**Tools**: `web-fetch` (fetch docs/Stack Overflow), `d1-store`  
**System prompt**: Senior engineer persona, concise technical answers

### `agents/cto/devops-monitor.js`
**Role**: Deployment status, Worker health, error rates  
**Tools**: Cloudflare API (Workers analytics), `kv-memory`  
**System prompt**: Ops-focused, alerts on anomalies

### `agents/cto/security-auditor.js`
**Role**: Reviews security events, flags risks  
**Tools**: `d1-store` (reads decisions + tasks for anomalies), `kv-memory` (security logs)

---

## Phase 5 — CMO Layer
**Model**: `meta-llama/llama-3.3-70b-instruct:free` (best for writing)

### `agents/cmo/content-writer.js`
**Role**: Drafts emails, posts, announcements, reports  
**Tools**: `email-tool` (send drafts), `kv-memory` (brand voice guide)  
**System prompt**: Professional corporate writer, MFM brand tone

### `agents/cmo/market-analyst.js`
**Role**: Market intelligence, competitor analysis  
**Tools**: `web-fetch` (news, industry sites), `d1-store` (save reports)  
**System prompt**: Data-driven analyst, cites sources

---

## Phase 6 — CFO Layer
**Model**: `deepseek/deepseek-r1:free` (best for numbers + reasoning)

### `agents/cfo/finance-planner.js`
**Role**: Budgets, forecasts, financial summaries  
**Tools**: `d1-store` (financial records), `kv-memory` (current budget state)  
**System prompt**: CFO persona, structured financial outputs, uses tables

### `agents/cfo/risk-assessor.js`
**Role**: Risk identification, mitigation strategies  
**Tools**: `d1-store` (decision history), `web-fetch` (regulatory news)  
**System prompt**: Risk-first thinking, probability-based assessments

---

## Phase 7 — CINO Layer
**Mixed models** (research = R1, creativity = Llama 3.3)

### `agents/cino/research-agent.js`
**Model**: `deepseek/deepseek-r1:free`  
**Role**: Deep research on any topic, synthesized reports  
**Tools**: `web-fetch` (multi-source), `d1-store` (save research)  
**System prompt**: Researcher, cites sources, structured summaries

### `agents/cino/idea-generator.js`
**Model**: `meta-llama/llama-3.3-70b-instruct:free`  
**Role**: Brainstorming, concept generation, creative proposals  
**Tools**: `kv-memory` (past ideas to avoid repeats), `d1-store`

### `agents/cino/trend-spotter.js`
**Model**: `qwen/qwen2.5-72b-instruct:free`  
**Role**: Industry trends, emerging tech, market signals  
**Tools**: `web-fetch` (news aggregators, LinkedIn, ProductHunt)

### `agents/cino/innovation-coach.js`
**Model**: `meta-llama/llama-3.3-70b-instruct:free`  
**Role**: Socratic questioning, helps CEO refine ideas  
**Tools**: None — pure conversation  
**System prompt**: Asks 3 probing questions per response, never gives answers directly

---

## Phase 8 — Quality Gate (runs after every agent)

```
AgentOutput
    ↓
QualityReviewer.score(output, task_type)
    ↓
score >= 70 → send to CEO
score 50-69 → agent retries with feedback (max 1 retry)
score < 50  → escalate to C-level agent directly
```

---

## Phase 9 — Async Queue (for long tasks)

For tasks taking > 5 seconds (research, deep analysis):
```
1. Bot sends: "⏳ Research agent working on this... I'll notify you when done."
2. Task pushed to Cloudflare Queue
3. Queue consumer processes async
4. On completion → bot sends result via proactive Telegram message
```

New wrangler.toml bindings needed:
```toml
[[queues.producers]]
binding = "TASK_QUEUE"
queue = "mfm-agent-tasks"

[[queues.consumers]]
queue = "mfm-agent-tasks"
max_batch_size = 5
max_batch_timeout = 30
```

---

## Phase 10 — Wrangler Config Updates

Additional secrets needed:
```
OPENROUTER_API_KEY   ← get free at openrouter.ai
```

Additional `wrangler.toml` additions:
```toml
[ai]
binding = "AI"   # Cloudflare Workers AI (backup LLM)

[[queues.producers]]
binding = "TASK_QUEUE"
queue = "mfm-agent-tasks"

[[queues.consumers]]
queue = "mfm-agent-tasks"
max_batch_size = 5
max_batch_timeout = 30
```

---

## Build Order (Strict Sequence)

```
Phase 1  → Core foundation (llm-client, agent-base, tools, D1 schema)
Phase 2  → Orchestrator (routing works end-to-end with real LLM)
Phase 8  → Quality gate (before agents, so all agents get scored from day 1)
Phase 3  → COO layer (operations = most used)
Phase 4  → CTO layer (technical oversight)
Phase 5  → CMO layer (content + marketing)
Phase 6  → CFO layer (finance + risk)
Phase 7  → CINO layer (research + innovation)
Phase 9  → Async queues (after all agents work synchronously)
```

---

## Success Criteria Per Phase

| Phase | Done When |
|---|---|
| 1 | LLM client returns real response from OpenRouter |
| 2 | "draft a marketing email" routes to CMO agent |
| 3 | COO agent responds to "what's today's ops priority" with real LLM answer |
| 4 | CTO agent fetches docs and answers technical questions |
| 5 | CMO agent drafts a real email and sends via SendGrid |
| 6 | CFO agent produces a structured budget table |
| 7 | Research agent fetches web content and synthesizes a report |
| 8 | Quality gate retries low-score outputs automatically |
| 9 | Long tasks return "working..." and notify when done |

---

## Estimated Timeline

| Phase | Time |
|---|---|
| Phase 1 (Foundation) | 3-4 hours |
| Phase 2 (Orchestrator) | 2 hours |
| Phase 3-7 (All agents) | 1-2 hours per agent = ~15 hours total |
| Phase 8 (Quality gate) | 1 hour |
| Phase 9 (Async queues) | 2-3 hours |
| **Total** | **~25 hours** |

---

## What Changes in telegram-bot-fixed.js

Current `handleAdvancedMessage` (200 lines of fake logic):
```javascript
// REPLACE THIS ENTIRELY with:
const result = await orchestrator.route(message, env);
await sendMessage(chatId, result.response, env);
```

The entire `ConversationEngine`, `MemoryManager`, `MultiModalProcessor` classes get replaced by the real agent modules. `telegram-bot-fixed.js` becomes a thin webhook handler only (~100 lines).

---

*Ready to start Phase 1?*
