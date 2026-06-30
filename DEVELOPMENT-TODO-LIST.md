# MFM Corporation — Master Development Todo List

*Generated: May 24, 2026 | 8 Source Documents | Status: Planning Phase*

---

## Source Documents

| # | Document | File Path | Status | Purpose |
|---|----------|-----------|--------|---------|
| 1 | MFM Market Research 2026 | `docs/mfm-market-research-2026.md` | Ready for review | Market data, competitor analysis, grant landscape |
| 2 | MFM Business Plan 2026 | `docs/mfm-business-plan-2026.md` | Ready for review | Revenue model, 1-year plan, financial projections |
| 3 | MFM Social Media Strategy | `docs/mfm-social-media-strategy.md` | Ready for review | Platform tactics, content calendar, KPIs |
| 4 | MFM Autonomous Workflows | `docs/mfm-autonomous-workflows.md` | Ready for review | 19-agent architecture, self-improvement loops |
| 5 | MFM Content Creation Engine | `docs/mfm-content-creation-engine.md` | Ready for review | AI image/video/copy generation, copy QA |
| 6 | MFM API Cost Optimization | `docs/mfm-api-cost-optimization.md` | Ready for review | Free-tier limits, fallback chains, scaling |
| 7 | MFM Comprehensive Evaluation Report | `docs/mfm-comprehensive-evaluation-report.md` | Ready for review | Pros/cons/improvements for all 6 MFM docs |
| 8 | MFM 95% Solid Corporation Plan | `.windsurf/plans/mfm-solid-corporation-95pct-2afa01.md` | Ready for review | Build C-Levels, integrate MCPs, harden all agents |

---

## Phase 1: Document Improvements (Priority: High)

**Goal:** Apply all evaluation recommendations before any execution.
**Timeline:** 3-5 days

### 1.1 MFM Market Research Fixes

- [ ] Conduct 10 SME interviews (use interview template)
- [ ] Add TAM/SAM/SOM breakdown for Malaysian market
- [ ] Update MDAG-AI grant deadline (monitor MDEC website)
- [ ] Add pessimistic scenario analysis

### 1.2 MFM Business Plan Fixes
- [ ] Add pessimistic revenue scenario (MYR 0-20K Year 1)
- [ ] Add founder risk mitigation plan
- [ ] Add "kill switch" criteria (pivot/abandon triggers)
- [ ] Revise SaaS timeline: MVP to Month 12-15
- [ ] Remove MDAG-AI from Year 1 planning
- [ ] Add customer acquisition cost (CAC) estimate

### 1.3 MFM Social Media Strategy Fixes
- [ ] Add paid advertising plan (LinkedIn ads, RM 500/mo)
- [ ] Reduce TikTok priority to "experimental"
- [ ] Add realistic follower targets (LinkedIn 3K, X 1.5K, TikTok 300)
- [ ] Add content batching workflow for solo founder
- [ ] Add crisis response plan for agent error

### 1.4 MFM Autonomous Workflows Fixes
- [ ] Add agent failure mode analysis
- [ ] Add meta-quality check (human review until 95% accuracy)
- [ ] Add "circuit breaker" logic (max 3 retries)
- [ ] Add agent conflict resolution process
- [ ] Reduce self-improvement claims to "continuous optimization"

### 1.5 MFM Content Creation Engine Fixes
- [ ] Strengthen AI copyright protection documentation
- [ ] Specify plagiarism detection tool (Copyscape/Quetext)
- [ ] Add AI-generated image bias audit procedure
- [ ] Add video generation upgrade path (Runway/Pika)
- [ ] Add professional indemnity insurance to Year 1 costs

### 1.6 MFM API Cost Optimization Fixes
- [ ] Add OpenRouter availability monitoring (30-day baseline)
- [ ] Add D1 database backup strategy
- [ ] Add SendGrid alternative (Mailgun/AWS SES)
- [ ] Add automated alerting webhook for threshold breaches
- [ ] Add latency benchmarks for free-tier APIs

---

## Phase 2: MFM Foundation Build (Priority: Medium)

**Goal:** Build core MFM infrastructure.
**Timeline:** Months 1-3

### 2.1 Core Infrastructure
- [x] Deploy Cloudflare Workers with D1 database *(already live)*
- [x] Set up KV cache for agent memory *(already bound)*
- [x] Configure R2 storage for file delivery *(already bound)*
- [x] Set up SendGrid free tier for email (100/day) *(already configured)*
- [ ] Configure OpenRouter free-tier API key (add as Cloudflare secret: `OPENROUTER_API_KEY`)
- [ ] Update `compatibility_date` to `2025-01-01` in `wrangler.toml`
- [ ] Add `compatibility_flags = ["nodejs_compat"]` to `wrangler.toml`

### 2.2 Agent Foundation (Start with 5 Core Agents)
- [ ] Build orchestrator.js (intent classification + routing)
- [ ] Build content-writer agent (FB posts, copy, scripts)
- [ ] Build quality-reviewer agent (0-100 scoring)
- [ ] Build ops-coordinator agent (task tracking, fulfillment)
- [ ] Build trend-spotter agent (market monitoring)
- [ ] **Note:** Expand to 19 agents ONLY after these 5 are proven reliable

### 2.3 Database Schema
- [ ] Deploy core MFM schema (executives, teams, tasks, messages)
- [ ] Add indexes for common queries
- [ ] Set up RLS policies for data access control

### 2.4 Telegram CEO Interface
- [x] Configure Telegram bot webhook *(already deployed)*
- [x] Add rate limiting (30 req/min via SecurityManager) *(already active)*
- [ ] Implement /status command (team status)
- [ ] Implement /briefing command (daily report)
- [ ] Implement /delegate command (task routing)

---

## Phase 3: MFM Agent Expansion (Priority: Medium)

**Goal:** Expand from 5 core agents to full 19-agent hierarchy.
**Timeline:** Months 3-6

### 3.1 C-Level Department Agents
- [ ] COO Department: process-optimizer, data-governance-agent
- [ ] CTO Department: devops-monitor, security-auditor, integration-agent
- [ ] CMO Department: market-analyst, customer-success-agent
- [ ] CFO Department: finance-planner, risk-assessor
- [ ] CINO Department: research-agent, idea-generator, innovation-coach, mcp-llm-agent

### 3.2 Quality & Improvement Systems
- [ ] Implement Process Optimizer agent (bottleneck analysis)
- [ ] Implement Innovation Coach agent (Socratic questioning)
- [ ] Build content improvement loop (measure → analyze → adapt)
- [ ] Add self-improvement feedback loops (only after 3 months of data)

### 3.3 Memory & Learning
- [ ] Configure KV short-term memory (20-turn conversation history)
- [ ] Configure D1 long-term memory (agent decisions, quality scores)
- [ ] Implement memory refinement based on quality scores

---

## Phase 4: Revenue & Scaling (Priority: Medium)

**Goal:** Transition from service revenue to SaaS + white-label.
**Timeline:** Months 6-12

### 4.1 Service Revenue Stabilization
- [ ] Land first 3 MFM clients (AI automation projects)
- [ ] Convert 1-2 clients to recurring (monthly retainer)
- [ ] Reach MYR 5,000-10,000 cumulative revenue by Month 3
- [ ] Hire first contractor (designer or junior dev, part-time)

### 4.2 SaaS MVP Development
- [ ] Build agent template marketplace (3 templates)
- [ ] Launch SaaS subscription (MYR 199/month)
- [ ] Target 2-3 SaaS customers by Month 12
- [ ] Add white-label SMB tier (MYR 5K-15K setup)

### 4.3 Content Engine Commercialization
- [ ] Launch AI image/video generation service for clients
- [ ] Build per-client brand voice profile system
- [ ] Add professional indemnity insurance
- [ ] Add content archiving and version control

### 4.4 Grant Applications
- [ ] Apply for MSME Digital Grant Madani (RM 5,000)
- [ ] Apply for Malaysia Digital (MD) status
- [ ] Monitor MDAG/MDAG-AI application windows
- [ ] Build grant track record for larger applications

---

## Phase 5: Monitoring & Quality Assurance (Priority: Ongoing)

### 5.1 Daily Monitoring
- [ ] Check OpenRouter API usage vs free tier limits
- [ ] Check Cloudflare Workers request count (100K/day limit)
- [ ] Check D1 storage (500MB limit)
- [ ] Review sales tracker (MFM clients)

### 5.2 Weekly Reviews
- [ ] Channel performance review (which drives most sales)
- [ ] Top-performing content analysis
- [ ] Agent quality score trends
- [ ] Financial summary (revenue vs costs)
- [ ] Process improvement recommendations

### 5.3 Monthly Reviews
- [ ] Full P&L review (service + SaaS revenue)
- [ ] Free-tier headroom check (all services)
- [ ] Competitor pricing and feature monitoring
- [ ] Content audit (top 10/bottom 10 posts)
- [ ] Agent prompt updates based on performance data

### 5.4 Quarterly Reviews
- [ ] Strategic plan review (goals vs actual)
- [ ] Grant application status
- [ ] Team/contractor performance
- [ ] Infrastructure upgrade needs
- [ ] Risk register update

---

## Implementation Log — Session May 24, 2026

### What Was Built

**Phase 0 — Security Fixes:**
- [x] Verified `wrangler.toml` has no hardcoded secrets (only env var references)
- [x] Verified `.env.example` only contains placeholder values
- [x] `compatibility_date` and `compatibility_flags` already set
- [x] Cron triggers already defined in `wrangler.toml`

**Phase 2 — New Tools (4 built):**
- [x] `src/tools/google-drive-tool.js` — OAuth2 JWT auth, list/read/write/search Google Drive
- [x] `src/tools/sms-tool.js` — Twilio SMS API, critical alert helper
- [x] `src/tools/pdf-tool.js` — PDFShift API + R2 HTML fallback for report generation
- [x] `src/tools/calendar-tool.js` — Google Calendar REST API, list/create/find-free-slot

**Phase 3 — Agent Expansion (19 new agents built, 42 total):**

*COO (13 total, +8 new):*
- [x] `meeting-scheduler` — Google Calendar scheduling, meeting invites
- [x] `reporting-analyst` — business reports, weekly/monthly summaries, PDF export
- [x] `project-manager` — WBS, milestone tracking, cross-team coordination
- [x] `notification-manager` — multi-channel alerts (email/Slack/SMS)
- [x] `google-drive-agent` — read/write/search Drive documents
- [x] `analytics-reporter` — D1 metrics interpretation, KPI analysis
- [x] `pdf-generator` — professional PDF generation with branding
- [x] `quality-control-manager` — cross-department quality scoring, process audits

*CTO (10 total, +5 new):*
- [x] `frontend-developer` — React, Tailwind CSS, Cloudflare Pages
- [x] `backend-developer` — Workers, D1, KV, R2, API design
- [x] `qa-engineer` — test plans, bug triage, test automation
- [x] `database-specialist` — D1 schema, query optimisation, migrations
- [x] `cloud-engineer` — Cloudflare platform, wrangler, free tier limits

*CMO (6 total, +1 new):*
- [x] `email-marketing-agent` — campaigns, newsletters, cold outreach, SendGrid

*CFO (4 total, +2 new):*
- [x] `grant-tracker` — Malaysian grants (MDEC, SME Corp, Cradle), eligibility, deadlines
- [x] `revenue-analyst` — MRR/ARR, pipeline, MYR target progress

*CINO (8 total, +2 new):*
- [x] `technology-tracker` — AI tools, frameworks, LLMs, competitive monitoring
- [x] `data-analyst` — statistical analysis, forecasting, anomaly detection

**Phase 3e — Core Integration:**
- [x] `agent-base.js` updated with 12 new tool imports + descriptions + useTool cases
- [x] `orchestrator.js` updated: all 42 agents in AGENT_MAP, PANEL_AGENT_REGISTRY, routing rules

**Phase 3f — Autonomous Cron Workflows:**
- [x] `telegram-bot-agent.js` scheduled handler expanded:
  - Morning briefing (Mon–Fri 08:00 MYT): market-analyst + trend-spotter + technology-tracker
  - Midday ops (13:00 MYT): ops-coordinator + finance-planner
  - Evening digest (18:00 MYT): risk-assessor + analytics-reporter
  - Weekly report (Friday 18:00 MYT): reporting-analyst
  - Monthly financial (1st of month 18:00 MYT): revenue-analyst

---

## Phase 6: 95% Solid Corporation Implementation (Priority: Critical)

**Goal:** Build missing C-Level executives, integrate MCP servers, and production-harden all agents to achieve 95% task success rate.
**Timeline:** 6 weeks
**Source:** Document #8 — `mfm-solid-corporation-95pct-2afa01.md`

### 6.0 Pre-Upgrade: Security Fixes (Before Week 1 — BLOCKING)
- [ ] Move `TELEGRAM_BOT_TOKEN` from `wrangler.toml` plaintext → Cloudflare secret
- [ ] Move `SENDGRID_API_KEY` from `wrangler.toml` plaintext → Cloudflare secret
- [ ] Move `WEBHOOK_SECRET` from `wrangler.toml` plaintext → Cloudflare secret
- [ ] Remove real bot token value from `.env.example`
- [ ] Verify all secrets load correctly in production before proceeding

### 6.1 Foundation — Reliability Infrastructure (Week 1)
- [ ] Add `@retry` decorator (exponential backoff, max 3 retries) to all agent methods
- [ ] Implement `CircuitBreaker` class (open after 5 failures, 60s cooldown)
- [ ] Add structured JSON logging for all agent operations
- [ ] Implement metrics collection (success/failure/latency per agent)
- [ ] Build agent performance dashboard (real-time success rate per agent)
- [ ] Add JS input validation schemas for all agent inputs (Zod or custom validator)
- [ ] Add output validation + quality scoring layer (post-processing)
- [ ] Implement graceful degradation with model fallback chain (OpenRouter → Cerebras → rule-based)
- [ ] Add per-agent rate limiting (KV-based token bucket)
- [ ] Set up webhook alerting system (Telegram/Slack on failure)

### 6.2 Core Agent Architecture — Build Order (Week 2)
> **Strict sequence per AGENT-BUILD-PLAN.md — do not skip steps**
- [ ] Build `src/core/llm-client.js` — OpenRouter wrapper with retry on 429/500, model selection per agent
- [ ] Build `src/core/agent-base.js` — Base class: run(), getMemory(), saveMemory(), callTool(), logDecision()
- [ ] Build `src/tools/` — web-fetch, kv-memory, d1-store, email-tool, telegram-tool
- [ ] Run `src/db/schema.sql` against D1 (tasks, agent_memory, decisions, metrics tables)
- [ ] Build `src/core/orchestrator.js` — intent classification → department routing (DeepSeek-Chat)
- [ ] Build Quality Gate first (`src/core/quality-reviewer.js`) — score ≥70 send, 50-69 retry, <50 escalate
- [ ] **Refactor `telegram-bot-fixed.js` → thin webhook handler** (~100 lines; replace ConversationEngine/MemoryManager/MultiModalProcessor with real agents)
- [ ] Add task state machine to D1 schema: `pending → analyzing → drafting → reviewing → approved → executing → completed → failed`
- [ ] Build `CFOAgent` with Finance Planner, Risk Assessor, Grant Tracker, Revenue Analyst sub-agents
- [ ] Build `COOAgent` with Process Optimizer, Ops Coordinator, Data Governance Agent, SLA Monitor sub-agents
- [ ] Build `CTOAgent` with Tech Advisor, DevOps Monitor, Security Auditor, Integration Agent sub-agents
- [ ] Build `CMOAgent` with Content Writer, Copy Reviewer, Market Analyst, Customer Success Agent, Social Media Manager sub-agents
- [ ] Build `CINOAgent` with Research Agent, Idea Generator, Trend Spotter, Innovation Coach, MCP LLM Agent sub-agents
- [ ] Connect all 5 C-Level agents to orchestration bus with hierarchical escalation rules
- [ ] Add HITL (Human-in-the-Loop) approval gate — detect video content / social publish / email send; require CEO /approve before execution
- [ ] Set up Cloudflare Queues for async tasks >5s (producer + consumer bindings in wrangler.toml)

### 6.3 Integrate External MCP Servers (Week 3)
- [ ] Build `src/tools/mcp-client.js` abstraction layer first — unified interface for all MCP calls before individual integrations
- [ ] Integrate **Perplexity MCP** — fact-checking for all agent outputs (Tier 1)
- [ ] Integrate **GitHub MCP** — code review, PR analysis, deployment automation (Tier 1)
- [ ] Integrate **Notion MCP** — centralized knowledge base, documentation, project tracking (Tier 1)
- [ ] Integrate **Supabase MCP** — database operations, real-time subscriptions (Tier 1)
- [ ] Integrate **Cloudflare MCP** — infrastructure monitoring, Workers/D1/KV/R2 management (Tier 1)
- [ ] Integrate **Slack MCP** — real-time alerts and team coordination (Tier 2)
- [ ] Integrate **Stripe MCP** — automated billing and payment processing (Tier 2)
- [ ] Integrate **SendGrid MCP** — email automation and marketing campaigns (Tier 2)
- [ ] Integrate **Brave Search MCP** — free web search for research agents (Tier 2)
- [ ] Integrate **Playwright MCP** — automated testing and browser tasks (Tier 2)
- [ ] Document all MCP connection health checks and fallback procedures

### 6.4 Cross-Team Orchestration & Hardening (Week 4)
- [ ] Implement event-driven orchestration bus using Cloudflare Queues
- [ ] Add dead letter queue for failed tasks (retry → manual review)
- [ ] Build health check endpoint (`/health`) per agent
- [ ] Add automated health checks every 60 seconds
- [ ] Implement input/output validation with quality score thresholds
- [ ] Build circuit breaker dashboard (visual status of all agents)
- [ ] Add cross-team messaging protocol (department queues → team queues → agent execution)

### 6.5 Real-World 95% Validation (Week 5)
- [ ] Deploy all hardened agents to production environment
- [ ] Run live MFM client operations with agent-assisted workflows
- [ ] Monitor per-agent success rate in real-time
- [ ] Track: Content Writer approval rate, Copy Reviewer score, task response time, delivery time
- [ ] Collect all agent performance data for post-validation analysis
- [ ] Document any agent failures with error classification

### 6.6 Post-Validation Optimization (Week 6)
- [ ] Analyze performance data (identify underperforming agents)
- [ ] Retrain underperforming agent prompt templates
- [ ] Optimize model fallback chains based on latency/cost data
- [ ] Scale to remaining MCP integrations (Tier 3: Twilio, Zapier/n8n, Exa, Firecrawl)
- [ ] Final 95% success rate validation across all agents
- [ ] Document lessons learned and update agent playbooks

---

## Dashboard Migration (June 2026)

**Status:** Completed - Vite dashboard retired, Next.js dashboard deployed

### Migration Summary
- **Previous:** Vite-based dashboard (React 19.2.6 + Vite 8.0.12)
- **Current:** Next.js 16.2.6 dashboard with NextAuth single-admin authentication
- **Reason:** Enhanced security - only CEO Remy can access the dashboard
- **Archive:** Vite dashboard available in git history at tag `vite-dashboard-archive`

### Key Changes
- Replaced Vite with Next.js using `@opennextjs/cloudflare` adapter
- Added NextAuth for single-admin login (username: admin, password: F@rihan123)
- Configured Cloudflare Workers deployment with nodejs_compat
- See `docs/plans/2026-06-30-nextjs-dashboard-migration-plan.md` for full details

### Required Cloudflare Secrets
See `dashboard/CLOUDFLARE-SECRETS.md` for:
- ADMIN_PASSWORD_HASH_B64
- AUTH_SECRET
- NEXTAUTH_URL
- AUTH_URL

---

## Document Quick Reference

### MFM Core Documents (6)
| Document | Key Takeaway | Priority Action |
|----------|-------------|---------------|
| Market Research | AI automation market worth $11.55B | Apply for MSME Digital Grant |
| Business Plan | Zero-cost, revenue-first bootstrapping | Add pessimistic scenario |
| Social Media Strategy | Dual-track (internal + client) | Focus 70% on LinkedIn |
| Autonomous Workflows | 19-agent hierarchy is unique moat | Start with 5 agents only |
| Content Creation Engine | AI image/video/copy generation | Add bias audit procedure |
| API Cost Optimization | Free tier viable for 6-12 months | Set up automated alerts |

---

## Success Criteria

### MFM Year 1 (12 Months)
- [ ] **Revenue:** MYR 60,000-120,000
- [ ] **Clients:** 5-8 active (2-4 recurring)
- [ ] **SaaS:** 2-3 paying customers
- [ ] **Social followers:** 5,000-10,000
- [ ] **Agents:** 5 core proven, expanding to 19
- [ ] **Grants:** 1-2 applications submitted, track record built

---

*Last updated: May 24, 2026*
*Next review: After MFM upgrade completion*
