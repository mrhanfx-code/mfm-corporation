# MFM Corporation — Development TODO

**Source**: [IMPLEMENTATION-REPORT-BLUEPRINT-ADOPTION.md](IMPLEMENTATION-REPORT-BLUEPRINT-ADOPTION.md)  
**Objective**: Integrate best concepts from the Autonomous Short-Form Media Swarm blueprint into MFM Corporation's Marketing & Media teams, plus cross-department skills/tools.

---

## Phase 1: Foundation (Week 1)

- [ ] **1.1** Add structured output support to `AgentBase`
  - File: `src/core/agent-base.js`
  - Add `outputSchema` option, JSON validation, retry loop (max 2 retries)
  - Issue: LLMs don't always return valid JSON

- [ ] **1.2** Create `media-content-director` agent
  - File: `src/agents/cmo/media-content-director.js`
  - Outputs JSON storyboard (Hook/Value/CTA) + platform captions + rendering instructions
  - Issue: Need rendering engine to consume storyboard (see Phase 4)

- [ ] **1.3** Add state machine to `tasks` table
  - File: `src/db/schema.sql`, `src/tools/d1-store.js`
  - States: `pending` → `analyzing` → `drafting` → `reviewing` → `approved` → `rejected` → `executing` → `completed` → `failed`
  - Issue: Existing tasks use `pending`/`completed` only; migration needed

- [ ] **1.4** Enhance HITL approval gate with content-type detection
  - File: `src/core/orchestrator.js`
  - Detect: video content, social publish, email send
  - Issue: Keyword-based detection can be bypassed with synonyms

---

## Phase 2: Content Pipeline (Week 2)

- [ ] **2.1** Enhance `social-media-agent` with 3-variant caption output
  - File: `src/agents/cmo/social-media-agent.js`
  - Generate distinct captions for TikTok / Instagram / Facebook per request
  - Issue: `social-post` tool only accepts one caption at a time

- [ ] **2.2** Add `trend-scorer` tool
  - File: `src/tools/trend-scorer.js`
  - Quantitative velocity scoring: `score = (posts_24h / posts_7d_avg) * log(total_posts)`
  - Issue: Platform APIs don't expose raw impression data; use proxy metrics

- [ ] **2.3** Enhance `trend-spotter` with quantitative scoring
  - File: `src/agents/cino/trend-spotter.js`
  - Integrate `trend-scorer` tool into agent workflow
  - Issue: False positives on paid/promoted trends

- [ ] **2.4** Add `sentiment-analyzer` tool
  - File: `src/tools/sentiment-analyzer.js`
  - Output: `{ score: 0.00-1.00, confidence, dominant_emotion }`
  - Issue: Multilingual text (BM, English, Chinese) needs detection

---

## Phase 3: Quality & Safety (Week 3)

- [ ] **3.1** Add `safe-zone-validator` tool
  - File: `src/tools/safe-zone-validator.js`
  - Validate 9:16 layout: y in [0.20, 0.75], x in [0.00, 0.80]
  - Issue: Cloudflare Workers don't support native image processing

- [ ] **3.2** Enhance `customer-success-agent` with intent classification
  - File: `src/agents/cmo/customer-success-agent.js`
  - Auto-classify: spam / support / lead / casual
  - Issue: Auto-replies may violate platform ToS; keep HITL gate

- [ ] **3.3** Add `hashtag-validator` tool
  - File: `src/tools/hashtag-validator.js`
  - Check hashtag freshness via `exa-search` or `web-fetch`
  - Issue: No real-time hashtag API; scraping may be unreliable

- [ ] **3.4** Create platform adapter abstraction
  - Files: `src/adapters/social-adapter.js`, `src/adapters/meta-adapter.js`, `src/adapters/tiktok-adapter.js`
  - Decouple agents from direct API calls
  - Issue: Current `social-media-tool.js` has hardcoded endpoints

---

## Phase 4: Video Rendering (Week 4)

- [ ] **4.1** Evaluate cloud rendering APIs
  - Options: fal.ai, Replicate, Cloudflare Stream, AWS Elemental
  - Criteria: cost, quality, Cloudflare Workers compatibility
  - Issue: All options add cost; MFM is currently $0/month

- [ ] **4.2** Integrate chosen rendering API
  - File: `src/tools/video-renderer.js`
  - Input: storyboard JSON + assets; Output: video URL
  - Issue: 30-second Cloudflare Workers timeout may not suffice for rendering

- [ ] **4.3** Connect pipeline end-to-end
  - Flow: `media-content-director` → `video-renderer` → `social-media-agent`
  - Issue: Need orchestration logic to handle async rendering

- [ ] **4.4** End-to-end test with CEO approval
  - Use `/draft` → `/approve` flow for first video
  - Validate: storyboard → render → safe-zone check → publish
  - Issue: Safe-zone check needs to happen before rendering, not after

---

## Cross-Department Skills & Tools

- [ ] **5.1** MCP abstraction pattern
  - File: `src/tools/mcp-client.js`
  - Benefits: CTO (new integrations), CINO (tool evaluation), all agents (unified interface)
  - Issue: No MCP servers currently configured in MFM

- [ ] **5.2** Structured JSON output schemas (all departments)
  - Update: `src/core/agent-base.js` with schema validation
  - Benefits: CFO (financial tables), COO (task lists), CTO (code review comments)
  - Issue: Breaking change for agents that output prose; gradual migration needed

- [ ] **5.3** Sentiment scoring integration
  - Update: `customer-success-agent`, add to `security-auditor`, `market-analyst`
  - Benefits: Churn prediction, brand monitoring, market reaction analysis
  - Issue: Requires `sentiment-analyzer` tool (Phase 2.4)

- [ ] **5.4** Database state machine (all teams)
  - Depends on Phase 1.3
  - Benefits: Bottleneck detection, SLA monitoring, auto-escalation
  - Issue: Need dashboard UI to visualize state transitions

---

## Critical Issues — Blockers & Solutions

| # | Issue | Solution | Owner |
|---|---|---|---|
| 1 | FFmpeg doesn't run on Workers | Use fal.ai / Replicate / Cloudflare Stream API | CTO |
| 2 | LangGraph is Python; MFM is JS | Skip LangGraph; extend existing orchestrator | CTO |
| 3 | MCP servers (Vista, Eclincher, OneUp) cost money | Build own adapters; evaluate MCP later | CTO |
| 4 | Hardcoded secrets in blueprint PDF | Rotate any exposed credentials; never use PDF values | Security |
| 5 | No PDPA/GDPR compliance in blueprint | Add consent logging to inbound interactions | COO |
| 6 | Audio scraping = copyright violation | Use licensed stock audio or platform-native music | CMO |
| 7 | Blueprint scope = Reels only | Integrate as CMO sub-team; keep broader marketing | CEO |
| 8 | No analytics feedback loop | Ingest platform metrics back to `metrics` table | CINO |
| 9 | QualityReviewer scores prose, not structure | Add schema validation before QualityReviewer | CTO |
| 10 | No content scheduling engine | Extend cron triggers for publishing | CTO |

---

## New Files to Create

```
src/agents/cmo/media-content-director.js
src/tools/trend-scorer.js
src/tools/sentiment-analyzer.js
src/tools/safe-zone-validator.js
src/tools/hashtag-validator.js
src/tools/video-renderer.js
src/tools/mcp-client.js
src/adapters/social-adapter.js
src/adapters/meta-adapter.js
src/adapters/tiktok-adapter.js
```

## Files to Modify

```
src/core/agent-base.js
src/core/orchestrator.js
src/core/quality-reviewer.js
src/agents/cmo/social-media-agent.js
src/agents/cmo/customer-success-agent.js
src/agents/cino/trend-spotter.js
src/tools/social-media-tool.js
src/tools/d1-store.js
src/db/schema.sql
```

---

## Quick Links

- [IMPLEMENTATION-REPORT-BLUEPRINT-ADOPTION.md](IMPLEMENTATION-REPORT-BLUEPRINT-ADOPTION.md) — Full analysis
- [AGENT-BUILD-PLAN.md](AGENT-BUILD-PLAN.md) — Original agent architecture
- [PROJECT-STATUS.md](PROJECT-STATUS.md) — Current deployment status
- [CLAUDE.md](CLAUDE.md) — Agent registry and routing rules
