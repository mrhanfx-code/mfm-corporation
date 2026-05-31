# PROJECT_BRIEF

**Project**: PROJECT-CORE-UPGRADE
**Current Phase**: Phase 6 - Optimization & Hardening
**Last Updated**: 2026-05-31
**Owner**: MFM Corporation CTO Office

---

## 1. Project Overview

Comprehensive upgrade of MFM Corporation AI automation system with 6 phases:
- Phase 0: Security Hardening ✅ COMPLETED
- Phase 1: Agent Upgrades & Methodology Integration ✅ COMPLETED
- Phase 2: Foundation ✅ COMPLETED
- Phase 3: Core Enhancements ✅ COMPLETED
- Phase 4: Workflow Improvements ✅ COMPLETED
- Phase 5: Advanced Features ✅ COMPLETED
- Phase 6: Optimization & Hardening (CURRENT)

**Total Investment**: $505K
**Timeline**: 12 months
**Current Focus**: Phase 6 - 48 tasks pending

---

## 2. Concept / Product Description

MFM Corporation is an AI automation system with 66 agent files (42 operational + 24 additional). Phase 6 focuses on:
- Performance optimization (30%+ faster response times)
- Security hardening (RBAC, audit logging)
- Disaster recovery (automated backups, failover)
- Cascade optimization (20%+ faster execution)
- Integration testing (90%+ coverage)
- Complete documentation

**Production System**: Local at D:\documents\MFM-Corporation
**GitHub Repo**: mrhanfx-code/mfm-corporation (placeholder only - do not assume it reflects actual state)

---

## 3. Tech Stack

**Runtime**: Node.js v24.14.0
**Package Manager**: npm
**Test Framework**: Vitest v2.1.9
**Infrastructure**: Cloudflare Workers, D1, KV, R2, SendGrid
**Live URLs**:
- Dashboard: https://mfm-corp.cc.cd
- GitHub Pages: https://mrhanfx-code.github.io/mfm-corporation
- Bot Worker: https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev

---

## 4. Architecture

```
MFM Corporation System
├── src/
│   ├── agents/ (66 agent .md files)
│   │   ├── .agent-template.md
│   │   ├── coo/ (12 agents)
│   │   ├── cto/ (9 agents)
│   │   ├── cmo/ (6 agents)
│   │   ├── cfo/ (4 agents)
│   │   ├── cino/ (8 agents)
│   │   ├── clo/ (1 agent)
│   │   └── innovation/ (26 additional agents)
│   ├── core/ (core functionality)
│   │   ├── streaming.js
│   │   ├── solution-generation.js
│   │   ├── advanced-monitoring.js
│   │   ├── memory-slots.js
│   │   ├── code-mapping.js
│   │   └── advanced-consolidation.js
│   └── js/ (integration scripts)
├── plan/ (phase plans)
│   ├── PROJECT-CORE-UPGRADE-PHASE-0.md ✅
│   ├── PROJECT-CORE-UPGRADE-PHASE-1.md (CURRENT)
│   ├── PROJECT-CORE-UPGRADE-PHASE-2.md
│   ├── PROJECT-CORE-UPGRADE-PHASE-3.md
│   ├── PROJECT-CORE-UPGRADE-PHASE-4.md
│   ├── PROJECT-CORE-UPGRADE-PHASE-6.md
│   └── PROJECT-ADVANCE-UPGRADE.md ✅
├── tests/ (Vitest tests)
│   └── unit/
│       ├── telegram-bot.test.js (21 tests)
│       ├── agent-base.test.js (33 tests)
│       └── d1-store.test.js (18 tests)
└── archive/ (archived reference materials)
```

---

## 5. Key Files Map

**Master Plan**: PROJECT-CORE-UPGRADE-MASTER.md
**Project Inventory**: PROJECT-INVENTORY.md
**Daily Status**: DAILY-STATUS.md
**Phase 1 Plan**: plan/PROJECT-CORE-UPGRADE-PHASE-1.md
**Agent Template**: src/agents/.agent-template.md
**Test Command**: `$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm run test`

---

## 6. Team Roles

| Agent | Name | Role | Focus |
|-------|------|------|-------|
| Producer | **Remy** | Sprint planning, coordination, merging | Scope control, handoffs, issue triage |
| Backend Engineer | **Sage** | Agent tool upgrades, test coverage | Agent files, Vitest tests, tool declarations |
| QA Engineer | **Ivy** | Test verification, coverage validation | 80% coverage threshold, test execution |

**Note**: Phase 1 is primarily backend-focused (agent files and tests). Frontend (Taste Skill) integration happens in later phases.

---

## 7. Sprint Status

**Current Sprint**: Sprint 7 - Phase 6 Optimization Integration ✅ COMPLETED
**Sprint Start**: 2026-05-31
**Sprint End**: 2026-05-31
**Status**: COMPLETED

**Previous Sprint**: Sprint 6 - Phase 6 Cascade Performance Optimization ✅ COMPLETED
- 8/8 tasks completed (100%)
- Parallel tool execution with dependency graph and topological sort
- KV-based tool execution caching with 90% hit rate
- Context optimization with 88-99% size reduction
- Performance benchmark: 57.78% faster execution (45ms vs 19ms)
- 92 unit tests passed (23 parallel + 31 cache + 28 context + 10 benchmark)
- All optimization modules operational and tested

**Sprint 7 Results**:
- 6/6 tasks completed (100%)
- Integrated ParallelToolExecutor into AgentBase.run() with fallback to sequential
- Integrated ToolCache into AgentBase.useTool() with cache error handling
- Integrated ContextOptimizer into AgentBase LLM calls with reduction logging
- Added optimizationConfig parameter (enableParallel, enableCache, enableContextOpt, maxParallel)
- Created 13 integration tests (all passing)
- Added performance logging for all optimization modules
- All optimizations configurable and production-ready

**Sprint Goals**:
- ✅ Integrate ParallelToolExecutor into AgentBase.run()
- ✅ Integrate ToolCache into AgentBase.useTool()
- ✅ Integrate ContextOptimizer into AgentBase LLM calls
- ✅ Add configuration options for optimization modules
- ✅ Run integration tests with real tool calls
- ✅ Monitor performance in production after integration

**Phase 6 Progress**:
- Priority 1: Performance Optimization (8 tasks) ✅ COMPLETED
- Priority 2: Security Hardening (8 tasks) ✅ COMPLETED
- Priority 3: Disaster Recovery (8 tasks) ✅ COMPLETED
- Priority 4: Cascade Performance Optimization (8 tasks) ✅ COMPLETED
- Priority 5: Optimization Integration (6 tasks) ✅ COMPLETED

---

## 8. Current State

**Phase 0**: ✅ COMPLETED (Security Hardening)
**Phase 1**: ✅ COMPLETED (Agent Upgrades & Methodology Integration - 23/24 tasks)
**Phase 2**: ✅ COMPLETED (Foundation - 54/54 tasks)
**Phase 3**: ✅ COMPLETED (Core Enhancements - 53/53 tasks)
**Phase 4**: 🟡 READY (Workflow Improvements - 52 tasks pending)
**Phase 5**: ✅ COMPLETED (Advanced Features - 181 tests passed)
**Phase 6**: ✅ COMPLETED (Optimization & Hardening - 32/32 tasks)

**Test Status**: 273 tests passing (181 foundation + 92 optimization)
**Security Status**: B+ rating (exposed secrets in wrangler.toml - critical issue)
**System Status**: OPERATIONAL

---

## 9. Security Rules

**CRITICAL**: Never hardcode secrets in code
- All secrets must use Cloudflare secret bindings
- No API keys, tokens, or passwords in source code
- Validate all user inputs at system boundaries
- Use parameterized queries for database operations
- Implement rate limiting on all endpoints

**Current Security Issues**:
- SENDGRID_API_KEY exposed in wrangler.toml
- TELEGRAM_BOT_TOKEN exposed in wrangler.toml
- WEBHOOK_SECRET exposed in wrangler.toml
- Real bot token in .env.example

**Action Required**: Convert all secrets to Cloudflare secret bindings immediately

---

## 10. How to Run Locally

**Prerequisites**:
- Node.js v24.14.0 installed at C:\Program Files\nodejs\node.exe
- npm available at C:\Program Files\nodejs\npm.cmd

**Test Execution**:
```powershell
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm run test
```

**Git Operations**:
```powershell
& "C:\Program Files\Git\cmd\git.exe" <command>
```

**Development Server**:
```powershell
npm run dev
```

---

## 11. How to Deploy

**Cloudflare Workers Deployment**:
```powershell
npx wrangler deploy
```

**GitHub Pages Deployment**:
- Push to main branch
- GitHub Actions auto-deploys to GitHub Pages

**Live URLs**:
- Dashboard: https://mfm-corp.cc.cd
- GitHub Pages: https://mrhanfx-code.github.io/mfm-corporation
- Bot Worker: https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev

---

## 12. Cross-Chat Handoff Protocol

**Context Survival Between Chats**:
1. Update PROJECT_BRIEF.md sections 7+8 after every sprint
2. Update docs/sprint-N/progress.md after each phase
3. Write docs/sprint-N/done.md at sprint end
4. Use GitHub Issues as single source of truth for bugs
5. Never rely on chat context - it dies when chat closes

**Handoff Checklist**:
- [ ] PROJECT_BRIEF.md updated
- [ ] Sprint progress.md updated
- [ ] GitHub Issues filed for all bugs
- [ ] All commits reference issue numbers
- [ ] PR created with descriptive title
- [ ] Next sprint plan documented

---

## 13. Bug & Fix Tracking

**Single Source of Truth**: GitHub Issues
- File all bugs as GitHub Issues
- Reference issue numbers in commits: "fix: description (Fixes #NN)"
- Never keep bugs only in chat - context dies
- Use labels: bug, enhancement, question, documentation

**Current Critical Issues**:
- Security: Exposed secrets in wrangler.toml (HIGH PRIORITY)
- Security: Wildcard CORS configuration (MEDIUM PRIORITY)

---

## 14. Multi-Repo Setup

**Single Repo Architecture**: This project uses a single repository (D:\documents\MFM-Corporation)
- No separate clones needed for dev/QA/DevOps
- All work happens in the same workspace
- Branch strategy: feature/sprint-N for each sprint
- Merge to main after QA sign-off

**Branch Strategy**:
- main: Production-ready code
- feature/sprint-N: Sprint-specific feature branch
- hotfix/*: Emergency fixes

**Merge Rules**:
- Never rebase feature branches (use merge)
- All commits must reference GitHub Issues
- QA sign-off required before merge to main
- Producer (Remy) handles all merges

---

## 15. System Notes

**Production vs GitHub**:
- Production system runs locally at D:\documents\MFM-Corporation
- GitHub repository (mrhanfx-code/mfm-corporation) is placeholder only
- Do not assume GitHub repo reflects actual system state
- Always verify local system state before making decisions

**Infrastructure**:
- Cloudflare Workers (deployed)
- D1 Database (ID: 91e8699c-2731-4f0d-8a09-9f9765e7e4cc)
- KV Namespace (bound)
- R2 Bucket (mfm-corporation-uploads)
- SendGrid API (configured)

**Agent Count**: 66 agent files (42 operational + 24 additional)
