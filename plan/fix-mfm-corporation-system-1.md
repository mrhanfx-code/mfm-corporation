---
goal: Fix MFM Corporation System - Implement Missing Agents and Enable Original Workflow
version: 2.0
date_created: 2026-07-06
last_updated: 2026-07-06
owner: MFM Corporation Development Team
status: 'In Progress'
tags: ['feature', 'architecture', 'critical', 'workflow']
origin: none (greenfield bootstrap - requires validation)
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This implementation plan addresses critical blockers preventing the MFM Corporation autonomous system from functioning according to the original design. The primary issues are: (1) 42 agent implementations missing from src/agents/ directories, (2) API authentication issues between dashboard and bot worker, (3) missing REMY (CEO Agent) implementation, (4) missing user approval mechanism for posts, (5) missing queue system for scheduled posts, and (6) incomplete testing of the complete social media workflow.

**Note:** This is a greenfield bootstrap plan. The 42-agent architecture and dashboard-first design have not been validated upstream. Phase 0 includes validation tasks to verify these assumptions before full implementation.

## 1. Requirements & Constraints

- **REQ-001**: Dashboard at https://mfm-corp.cc.cd must be the PRIMARY interface for user commands to REMY (CEO Agent)
- **REQ-002**: Telegram bot must be SECONDARY for agent-to-user communication (notifications, updates, results)
- **REQ-003**: REMY (CEO Agent) must conduct meetings with C-level executives before task delegation
- **REQ-004**: All 42 agents must be implemented in src/agents/ subdirectories (COO: 12, CTO: 9, CMO: 6, CFO: 4, CINO: 8, CLO: 1)
- **REQ-005**: User approval must be obtained for EVERY post before execution
- **REQ-006**: Approved posts must be placed in a queue system pending scheduled posting time
- **REQ-007**: System must generate social media ideas, content (images/videos), write-ups, and post after approval
- **SEC-001**: API authentication between dashboard and bot worker must use DASHBOARD_SECRET
- **SEC-002**: All agent executions must be logged to D1 database
- **SEC-003**: User approval mechanism must prevent unauthorized post execution
- **CON-001**: Must maintain zero-cost bootstrapped model (Cloudflare Workers free tier)
- **CON-002**: All agents must extend AgentBase class for consistency
- **CON-003**: Dashboard must use Next.js 16.2.10 with App Router
- **GUD-001**: Follow existing code patterns in src/core/agent-base.js
- **GUD-002**: Use existing orchestrator.js routing patterns
- **PAT-001**: Agent files must follow naming convention: {agent-name}.js in department subdirectory

## 2. Implementation Steps

### Implementation Phase 0: Validation (CRITICAL - Must Complete First)

- GOAL-000: Validate core assumptions and infrastructure before full implementation

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-000 | Create origin requirements document to validate 42-agent architecture and dashboard-first design | ✅ | 2026-07-06 |
| TASK-001 | Verify DASHBOARD_SECRET matches between dashboard/wrangler.toml and bot worker secrets | ✅ | 2026-07-06 |
| TASK-002 | Test /ask endpoint with correct authentication using curl/Invoke-WebRequest | ✅ | 2026-07-06 |
| TASK-003 | Verify REMY (CEO Agent) exists in orchestrator.js or create REMY agent | ✅ | 2026-07-06 |
| TASK-004 | Test REMY agent can conduct C-level meeting simulation | ✅ | 2026-07-06 |
| TASK-005 | Validate orchestrator.js routing logic works with test agents | ✅ | 2026-07-06 |
| TASK-006 | Verify WSL environment exists for dashboard building (Windows cross-platform) | ✅ | 2026-07-06 |
| TASK-007 | Verify FAL AI API key is configured and test image generation | ✅ | 2026-07-06 |
| TASK-008 | Define cost budget for AI services and set up cost monitoring | ✅ | 2026-07-06 |

**Phase 0 Exit Criteria:** All validation tasks must pass before proceeding to Phase 1. If any task fails, reassess architecture assumptions.

### Implementation Phase 1: Fix API Authentication

- GOAL-001: Fix API authentication between dashboard and bot worker to enable command execution

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-010 | Update dashboard/src/app/api/dashboard/ask/route.ts to use correct parameter name (text instead of message) | ✅ | 2026-07-06 |
| TASK-011 | Deploy updated dashboard to Cloudflare Workers | ✅ | 2026-07-06 |
| TASK-012 | Test dashboard command interface with REMY (CEO Agent) | ✅ | 2026-07-06 |
| TASK-013 | Verify API returns 200 status instead of 502 errors | | |
| TASK-014 | Test authentication with multiple request scenarios | | |

### Implementation Phase 2: Implement REMY (CEO Agent) - CRITICAL FOUNDATION

- GOAL-002: Implement REMY (CEO Agent) to conduct C-level meetings and coordinate task delegation

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-015 | Create src/agents/remy/ceo-agent.js - REMY CEO Agent implementation | | |
| TASK-016 | Implement C-level meeting simulation logic in REMY agent | | |
| TASK-017 | Implement task delegation logic from REMY to C-level executives | | |
| TASK-018 | Update orchestrator.js to import and route to REMY agent | | |
| TASK-019 | Test REMY agent with simple meeting simulation | | |
| TASK-020 | Test REMY agent task delegation to mock C-level executives | | |

**Phase 2 Exit Criteria:** REMY agent must successfully conduct meetings and delegate tasks before proceeding to department agent implementation.

### Implementation Phase 3: Implement Agent Base Class and Utilities

- GOAL-003: Ensure agent infrastructure is ready for 42 agent implementations

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-021 | Review src/core/agent-base.js to understand agent structure and requirements | | |
| TASK-022 | Review src/core/llm-client.js to understand LLM integration patterns | | |
| TASK-023 | Review src/core/orchestrator.js to understand routing and agent selection logic | | |
| TASK-024 | Create agent template file for consistent agent implementation | | |
| TASK-025 | Test agent template with simple test agent | | |

### Implementation Phase 4: Implement CMO Department Agents (MVP - Social Media Focus)

- GOAL-004: Implement 6 CMO department agents for social media workflow validation (MVP approach)

**Rationale:** Implement CMO agents first to validate social media workflow with REMY before implementing all 42 agents. This provides early validation of the core architecture.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-026 | Create src/agents/cmo/content-writer.js - Content writing and copywriting | | |
| TASK-027 | Create src/agents/cmo/market-analyst.js - Market analysis and research | | |
| TASK-028 | Create src/agents/cmo/social-media-agent.js - Social media management and posting | | |
| TASK-029 | Create src/agents/cmo/brand-strategist.js - Brand strategy and positioning | ✅ | 2026-07-06 |
| TASK-030 | Create src/agents/cmo/campaign-manager.js - Marketing campaign management | ✅ | 2026-07-06 |
| TASK-031 | Create src/agents/cmo/audience-analyst.js - Audience analysis and targeting | ✅ | 2026-07-06 |
| TASK-032 | Update orchestrator.js to import all CMO agents | ✅ | 2026-07-06 |
| TASK-033 | Test CMO agent routing and execution | | |

**Phase 4 Exit Criteria:** All CMO agents must work with REMY meeting simulation before proceeding to approval mechanism.

### Implementation Phase 5: Test Social Media Workflow MVP

- GOAL-005: Validate end-to-end social media workflow with CMO agents only

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-034 | Test REMY → CMO meeting simulation | | |
| TASK-035 | Test CMO → content-writer task delegation | | |
| TASK-036 | Test content generation (text only for MVP) | | |
| TASK-037 | Test workflow without approval mechanism (baseline) | | |
| TASK-038 | Document MVP workflow performance and issues | | |

**Phase 5 Exit Criteria:** MVP workflow must demonstrate REMY can conduct meetings with CMO and delegate tasks successfully.

### Implementation Phase 6: Implement User Approval Mechanism

- GOAL-006: Implement user approval mechanism for posts before execution

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-039 | Create src/core/approval-manager.js - Approval workflow management | | |
| TASK-040 | Add approval_queue table to schema.sql (root level) for pending approvals | | |
| TASK-041 | Implement approval request generation in social-media-agent.js | | |
| TASK-042 | Implement approval API endpoint in telegram-bot-agent.js | | |
| TASK-043 | Create dashboard UI component for approval management | | |
| TASK-044 | Implement approval status tracking (pending, approved, rejected) | | |
| TASK-045 | Implement approval timeout logic (24 hours default) | | |
| TASK-046 | Implement approval escalation for unapproved posts | | |
| TASK-047 | Test approval workflow end-to-end | | |

### Implementation Phase 7: Implement Queue System for Scheduled Posts

- GOAL-007: Implement queue system for approved posts pending scheduled time

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-048 | Create src/core/schedule-queue.js - Scheduled post queue management | | |
| TASK-049 | Add scheduled_posts table to schema.sql (root level) for queue storage | | |
| TASK-050 | Implement post scheduling logic with time-based execution | | |
| TASK-051 | Integrate schedule queue with Cloudflare Queue for reliability | | |
| TASK-052 | Implement queue consumer in telegram-bot-agent.js queue handler | | |
| TASK-053 | Add retry logic for failed post attempts (3 retries default) | | |
| TASK-054 | Implement dead letter queue for stuck posts | | |
| TASK-055 | Create dashboard UI component for scheduled posts management | | |
| TASK-056 | Test queue system with various scheduling scenarios | | |

### Implementation Phase 8: Implement Social Media Content Generation

- GOAL-008: Enable agents to generate social media ideas, images, videos, and write-ups

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-057 | Integrate FAL AI for image generation in content-writer.js | | |
| TASK-058 | Integrate video generation capabilities in social-media-agent.js | | |
| TASK-059 | Implement social media idea generation in idea-generator.js | | |
| TASK-060 | Implement write-up generation with brand voice consistency | | |
| TASK-061 | Add content quality scoring for generated materials | | |
| TASK-062 | Implement multi-format content generation (text, image, video) | | |
| TASK-063 | Test content generation capabilities across all formats | | |

### Implementation Phase 9: Test Complete Social Media Workflow

- GOAL-009: Test complete workflow from idea generation to approved posting

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-064 | Create workflow coordinator in orchestrator.js for social media tasks | | |
| TASK-065 | Test REMY → CMO meeting simulation with approval | | |
| TASK-066 | Test CMO → content-writer task delegation with approval | | |
| TASK-067 | Test approval → queue → post flow | | |
| TASK-068 | Test Telegram notification for post completion | | |
| TASK-069 | Test complete workflow: Dashboard → REMY → CMO → Content Generation → Approval → Queue → Post → Notification | | |

**Phase 9 Exit Criteria:** Complete social media workflow must work end-to-end before implementing remaining departments.

### Implementation Phase 10: Implement Remaining Department Agents

- GOAL-010: Implement remaining 36 agents (COO, CTO, CFO, CINO, CLO) after workflow validation

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-070 | Implement COO department agents (12 agents) | | |
| TASK-071 | Implement CTO department agents (9 agents) | | |
| TASK-072 | Implement CFO department agents (4 agents) | | |
| TASK-073 | Implement CINO department agents (8 agents) | | |
| TASK-074 | Implement CLO department agent (1 agent) | | |
| TASK-075 | Update orchestrator.js to import all remaining agents | | |
| TASK-076 | Test all department agent routing and execution | | |

### Implementation Phase 11: Implement COO Department Agents (12 agents)

- GOAL-003: Implement 12 COO department agents for operations management

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-012 | Create src/agents/coo/ops-coordinator.js - Central coordination of daily operations | | |
| TASK-013 | Create src/agents/coo/quality-ops-reviewer.js - Quality assurance for operations | | |
| TASK-014 | Create src/agents/coo/process-optimizer.js - Process improvement and optimization | | |
| TASK-015 | Create src/agents/coo/team-coordinator.js - Team management and coordination | | |
| TASK-016 | Create src/agents/coo/resource-allocator.js - Resource allocation and management | | |
| TASK-017 | Create src/agents/coo/workflow-manager.js - Workflow design and management | | |
| TASK-018 | Create src/agents/coo/efficiency-analyst.js - Efficiency analysis and reporting | | |
| TASK-019 | Create src/agents/coo/ops-reporter.js - Operations reporting and documentation | | |
| TASK-020 | Create src/agents/coo/task-prioritizer.js - Task prioritization and scheduling | | |
| TASK-021 | Create src/agents/coo/bottleneck-detector.js - Identify operational bottlenecks | | |
| TASK-022 | Create src/agents/coo/automation-auditor.js - Audit automation processes | | |
| TASK-023 | Create src/agents/coo/continuous-improvement.js - Continuous improvement initiatives | | |
| TASK-024 | Update orchestrator.js to import all COO agents | | |
| TASK-025 | Test COO agent routing and execution | | |

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-012 | Create src/agents/coo/ops-coordinator.js - Central coordination of daily operations | | |
| TASK-013 | Create src/agents/coo/quality-ops-reviewer.js - Quality assurance for operations | | |
| TASK-014 | Create src/agents/coo/process-optimizer.js - Process improvement and optimization | | |
| TASK-015 | Create src/agents/coo/team-coordinator.js - Team management and coordination | | |
| TASK-016 | Create src/agents/coo/resource-allocator.js - Resource allocation and management | | |
| TASK-017 | Create src/agents/coo/workflow-manager.js - Workflow design and management | | |
| TASK-018 | Create src/agents/coo/efficiency-analyst.js - Efficiency analysis and reporting | | |
| TASK-019 | Create src/agents/coo/ops-reporter.js - Operations reporting and documentation | | |
| TASK-020 | Create src/agents/coo/task-prioritizer.js - Task prioritization and scheduling | | |
| TASK-021 | Create src/agents/coo/bottleneck-detector.js - Identify operational bottlenecks | | |
| TASK-022 | Create src/agents/coo/automation-auditor.js - Audit automation processes | | |
| TASK-023 | Create src/agents/coo/continuous-improvement.js - Continuous improvement initiatives | | |
| TASK-024 | Update orchestrator.js to import all COO agents | | |
| TASK-025 | Test COO agent routing and execution | | |

### Implementation Phase 12: Implement CTO Department Agents (9 agents)

- GOAL-011: Implement 9 CTO department agents for technology management

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-077 | Create src/agents/cto/tech-advisor.js - Technology advisory and strategy | | |
| TASK-078 | Create src/agents/cto/devops-monitor.js - DevOps monitoring and management | | |
| TASK-079 | Create src/agents/cto/security-auditor.js - Security auditing and compliance | | |
| TASK-080 | Create src/agents/cto/infrastructure-planner.js - Infrastructure planning and scaling | | |
| TASK-081 | Create src/agents/cto/code-reviewer.js - Code review and quality assurance | | |
| TASK-082 | Create src/agents/cto/technology-tracker.js - Technology trend tracking | | |
| TASK-083 | Create src/agents/cto/api-architect.js - API design and architecture | | |
| TASK-084 | Create src/agents/cto/performance-optimizer.js - Performance optimization | | |
| TASK-085 | Create src/agents/cto/innovation-scout.js - Technology innovation scouting | | |
| TASK-086 | Update orchestrator.js to import all CTO agents | | |
| TASK-087 | Test CTO agent routing and execution | | |

### Implementation Phase 13: Implement CFO Department Agents (4 agents)

- GOAL-012: Implement 4 CFO department agents for financial management

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-088 | Create src/agents/cfo/finance-planner.js - Financial planning and budgeting | | |
| TASK-089 | Create src/agents/cfo/risk-assessor.js - Risk assessment and management | | |
| TASK-090 | Create src/agents/cfo/grant-tracker.js - Grant tracking and applications | | |
| TASK-091 | Create src/agents/cfo/revenue-analyst.js - Revenue analysis and forecasting | | |
| TASK-092 | Update orchestrator.js to import all CFO agents | | |
| TASK-093 | Test CFO agent routing and execution | | |

### Implementation Phase 14: Implement CINO Department Agents (8 agents)

- GOAL-013: Implement 8 CINO department agents for innovation and research

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-094 | Create src/agents/cino/research-agent.js - Research and analysis | | |
| TASK-095 | Create src/agents/cino/idea-generator.js - Idea generation and brainstorming | | |
| TASK-096 | Create src/agents/cino/trend-spotter.js - Trend identification and analysis | | |
| TASK-097 | Create src/agents/cino/innovation-evaluator.js - Innovation evaluation and scoring | | |
| TASK-098 | Create src/agents/cino/competitive-analyst.js - Competitive analysis | | |
| TASK-099 | Create src/agents/cino/prototype-coordinator.js - Prototype coordination | | |
| TASK-100 | Create src/agents/cino/ip-strategist.js - Intellectual property strategy | | |
| TASK-101 | Create src/agents/cino/future-forecaster.js - Future trend forecasting | | |
| TASK-102 | Update orchestrator.js to import all CINO agents | | |
| TASK-103 | Test CINO agent routing and execution | | |

### Implementation Phase 15: Implement CLO Department Agent (1 agent)

- GOAL-014: Implement 1 CLO department agent for legal compliance

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-104 | Create src/agents/clo/legal-advisor.js - Legal advisory and compliance | | |
| TASK-105 | Update orchestrator.js to import CLO agent | | |
| TASK-106 | Test CLO agent routing and execution | | |

### Implementation Phase 16: Testing and Verification

- GOAL-015: Comprehensive testing of all implemented features





| TASK-107 | Test all 42 agents individually for basic functionality | | |
| TASK-108 | Test orchestrator routing to all departments | | |
| TASK-109 | Test dashboard command interface with REMY (CEO Agent) | | |
| TASK-110 | Test C-level meeting simulation workflow | | |
| TASK-111 | Test social media content generation (ideas, images, videos, write-ups) | | |
| TASK-112 | Test user approval mechanism with various scenarios | | |
| TASK-113 | Test queue system with scheduled posts | | |
| TASK-114 | Test complete social media workflow end-to-end | | |
| TASK-115 | Test Telegram notifications for all agent completions | | |
| TASK-116 | Verify database logging for all agent executions | | |
| TASK-117 | Load testing with multiple concurrent requests | | |
| TASK-118 | Error handling and recovery testing | | |

### Implementation Phase 17: Deployment and Documentation

- GOAL-016: Deploy all changes and update documentation

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-119 | Deploy updated bot worker with all 42 agents | | |
| TASK-120 | Deploy updated dashboard with approval and queue UI components | | |
| TASK-121 | Apply database schema changes for approval_queue and scheduled_posts tables (schema.sql at root) | | |
| TASK-122 | Create database migration rollback procedure | | |
| TASK-123 | Create deployment rollback procedure | | |
| TASK-124 | Update documentation with new workflow descriptions | | |
| TASK-125 | Update API documentation with new endpoints | | |
| TASK-126 | Create user guide for approval and queue management | | |
| TASK-127 | Verify deployment in production environment | | |
| TASK-128 | Final integration testing of complete system | | |

## 3. Alternatives

- **ALT-001**: Implement agents incrementally starting with CMO department only for social media workflow, then expand to other departments. **CHOSEN** - This is now the primary approach (Phase 4-5) to validate architecture before full implementation.
- **ALT-002**: Use existing dashboard without approval mechanism and add approval later. Not chosen because user approval is a critical requirement for social media posting.
- **ALT-003**: Implement queue system using D1 database instead of Cloudflare Queue. Not chosen because Cloudflare Queue provides better reliability and retry logic for scheduled tasks.
- **ALT-004**: Skip agent implementations and use direct LLM calls. Not chosen because agent architecture is core to the original system design and provides better specialization and quality control.

## 4. Dependencies

- **DEP-001**: Cloudflare Workers account with D1, KV, R2, Queue, and AI bindings configured
- **DEP-002**: OpenRouter API key for LLM access
- **DEP-003**: FAL AI API key for image generation
- **DEP-004**: Telegram bot token for notifications
- **DEP-005**: Dashboard secrets configured correctly
- **DEP-006**: Database schema must be applied before agent execution
- **DEP-007**: Next.js 16.2.10 and OpenNext Cloudflare for dashboard deployment
- **DEP-008**: WSL environment for dashboard building (Windows cross-platform compatibility)

## 5. Files

- **FILE-001**: src/telegram-bot-agent.js - Main bot worker entry point
- **FILE-002**: src/core/orchestrator.js - Agent routing and coordination logic
- **FILE-003**: src/core/agent-base.js - Base class for all agents
- **FILE-004**: src/core/llm-client.js - LLM integration layer
- **FILE-005**: src/agents/coo/ - COO department agents (12 files)
- **FILE-006**: src/agents/cto/ - CTO department agents (9 files)
- **FILE-007**: src/agents/cmo/ - CMO department agents (6 files)
- **FILE-008**: src/agents/cfo/ - CFO department agents (4 files)
- **FILE-009**: src/agents/cino/ - CINO department agents (8 files)
- **FILE-010**: src/agents/clo/ - CLO department agent (1 file)
- **FILE-011**: src/core/approval-manager.js - Approval workflow management
- **FILE-012**: src/core/schedule-queue.js - Scheduled post queue management
- **FILE-013**: schema.sql - Database schema with new tables (located at root level, not src/db/)
- **FILE-014**: dashboard/src/app/api/dashboard/ask/route.ts - Dashboard API endpoint
- **FILE-015**: dashboard/wrangler.toml - Dashboard configuration
- **FILE-016**: docs/01-system-architecture.md - System architecture documentation
- **FILE-017**: docs/02-agent-reference.md - Agent reference documentation
- **FILE-018**: docs/03-deployment-guide.md - Deployment guide

## 6. Testing

- **TEST-001**: Unit tests for each agent implementation
- **TEST-002**: Integration tests for orchestrator routing
- **TEST-003**: API authentication tests between dashboard and bot worker
- **TEST-004**: Approval workflow tests with various approval scenarios
- **TEST-005**: Queue system tests with scheduling and retry logic
- **TEST-006**: Social media content generation tests (text, image, video)
- **TEST-007**: End-to-end workflow tests from dashboard to post execution
- **TEST-008**: Telegram notification tests for all agent completions
- **TEST-009**: Database logging verification tests
- **TEST-010**: Load testing with concurrent requests
- **TEST-011**: Error handling and recovery tests
- **TEST-012**: Security tests for approval mechanism

## 7. Risks & Assumptions

- **RISK-001**: Agent implementations may require extensive LLM prompt engineering for quality outputs
- **RISK-002**: Image and video generation may have cost implications with FAL AI API
- **RISK-003**: Queue system may have timing issues with scheduled post execution
- **RISK-004**: Approval mechanism may introduce delays in social media posting workflow
- **RISK-005**: Database schema changes may require migration of existing data (rollback procedure added in TASK-122)
- **RISK-006**: Cross-platform build issues with WSL for dashboard deployment
- **ASSUMPTION-001**: Cloudflare Workers free tier will remain sufficient for current usage
- **ASSUMPTION-002**: OpenRouter API will provide consistent LLM performance
- **ASSUMPTION-003**: User will provide timely approvals for social media posts
- **ASSUMPTION-004**: Telegram API will remain stable for notifications
- **ASSUMPTION-005**: Existing database schema can be migrated without data loss

## 8. Related Specifications / Further Reading

- docs/01-system-architecture.md - System architecture and design decisions
- docs/02-agent-reference.md - Detailed agent specifications
- docs/03-deployment-guide.md - Deployment procedures
- https://developers.cloudflare.com/workers/ - Cloudflare Workers documentation
- https://opennext.js.org/ - OpenNext Cloudflare adapter documentation
- https://nextjs.org/docs - Next.js documentation
- https://core.telegram.org/bots/api - Telegram Bot API documentation
