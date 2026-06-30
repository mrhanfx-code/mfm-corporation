---
goal: Agent Upgrades & Methodology Integration with Superpowers, Compound Engineering, and Taste Skill
version: 1.0
date_created: 2026-05-29
last_updated: 2026-05-29
owner: MFM Corporation CTO Office
status: 'Planned'
tags: ['upgrade', 'agent', 'methodology', 'superpowers', 'compound-engineering', 'taste-skill']
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This implementation plan outlines the systematic upgrade of 42 MFM Corporation agents with missing tools and capabilities, followed by the integration of three major AI agent development methodologies: Superpowers (TDD enforcement and systematic debugging), Compound Engineering (knowledge compounding and strategy documentation), and Taste Skill (frontend design engineering and premium UI generation). The plan spans 6 weeks and requires 2 developers, 1 QA engineer, 1 methodology specialist, and 1 frontend designer.

## 1. Requirements & Constraints

- **REQ-001**: All 42 agents must be equipped with required tools (d1-query, drive-write, slack-notify, sms-alert, video-prompt, social-post)
- **REQ-002**: Test coverage must reach 80% for all agents using Vitest framework
- **REQ-003**: Superpowers must be integrated in Cascade for MFM project with tool mapping
- **REQ-004**: Compound Engineering must be integrated in Cascade for MFM project with STRATEGY.md
- **REQ-005**: Taste Skill must be integrated for MFM dashboard (mfm-corp.cc.cd) with premium design standards
- **REQ-006**: CEO Remy must be trained on all three methodologies
- **SEC-001**: No hardcoded secrets in agent configurations
- **SEC-002**: All tool configurations must be validated before deployment
- **CON-001**: Phase must complete within 6 weeks
- **CON-002**: All agent tool upgrades must be backward compatible
- **GUD-001**: Follow existing agent file structure and naming conventions
- **GUD-002**: Use Vitest for all new tests
- **PAT-001**: Follow TDD workflow (RED-GREEN-REFACTOR) for agent development
- **PAT-002**: Use systematic debugging protocol for agent issues

## 2. Implementation Steps

### Implementation Phase 1: Agent Tool Upgrades

- GOAL-001: Equip all 42 agents with required tools and update tool declarations

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Add d1-query tool to 38 agents missing it (all except ops-coordinator, security-auditor, innovation-coach, trend-spotter) | | |
| TASK-002 | Add drive-write tool to content-creation agents (cmo-team: content-strategist, brand-manager, social-media-manager, pr-specialist) | | |
| TASK-003 | Add slack-notify to ops-coordinator and security-auditor agents | | |
| TASK-004 | Add sms-alert to critical ops agents (ops-coordinator, security-auditor, disaster-recovery-coordinator) | | |
| TASK-005 | Add video-prompt to innovation-coach and trend-spotter agents | | |
| TASK-006 | Add social-post to cmo-team agents (content-strategist, brand-manager, social-media-manager, pr-specialist) | | |
| TASK-007 | Update tool declarations in all 42 agent files in src/agents/ directory | | |
| TASK-008 | Validate tool configurations with test data | | |

### Implementation Phase 2: Agent Test Coverage

- GOAL-002: Achieve 80% test coverage for all 42 agents using Vitest framework

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Write unit tests for agent initialization (42 tests) | | |
| TASK-010 | Write unit tests for tool parsing (42 tests) | | |
| TASK-011 | Write unit tests for input validation (42 tests) | | |
| TASK-012 | Write integration tests for agent-specific workflows (42 tests) | | |
| TASK-013 | Write integration tests for multi-agent workflows (10 tests) | | |
| TASK-014 | Verify test coverage reaches 80% threshold | | |
| TASK-015 | Fix any failing tests | | |

### Implementation Phase 3: Superpowers Integration

- GOAL-003: Integrate Superpowers in Cascade for MFM project with tool mapping and TDD enforcement

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-016 | Install Superpowers via npx skills for MFM project | | |
| TASK-017 | Configure tool mapping for MFM-specific tools (d1-query, drive-write, slack-notify, sms-alert, video-prompt, social-post) | | |
| TASK-018 | Configure default skills (using-superpowers, test-driven-development, systematic-debugging) | | |
| TASK-019 | Implement TDD workflow for agent development (RED-GREEN-REFACTOR) | | |
| TASK-020 | Implement systematic debugging protocol for agent issues (4-phase process) | | |
| TASK-021 | Implement SDD (Systematic Debugging Driven) for complex multi-agent tasks | | |
| TASK-022 | Test Superpowers integration with common workflows | | |

### Implementation Phase 4: Compound Engineering Integration

- GOAL-004: Integrate Compound Engineering in Cascade for MFM project with knowledge compounding and strategy documentation

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-023 | Install Compound Engineering via npx skills for MFM project | | |
| TASK-024 | Create STRATEGY.md for MFM product strategy in docs/ directory | | |
| TASK-025 | Configure default skills (ce-strategy, ce-brainstorm, ce-plan, ce-work, ce-compound) | | |
| TASK-026 | Use ce-compound for agent upgrade documentation | | |
| TASK-027 | Use ce-code-review for agent code quality gates | | |
| TASK-028 | Use ce-product-pulse for agent performance monitoring | | |
| TASK-029 | Use ce-strategy for strategic alignment | | |
| TASK-030 | Test Compound Engineering integration with common workflows | | |

### Implementation Phase 5: Taste Skill Integration

- GOAL-005: Integrate Taste Skill for MFM dashboard (mfm-corp.cc.cd) with premium design standards

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-031 | Install taste-skill via npx skills for MFM project | | |
| TASK-032 | Configure dials: DESIGN_VARIANCE=6, MOTION_INTENSITY=5, VISUAL_DENSITY=7 | | |
| TASK-033 | Use redesign-skill to audit current dashboard (mfm-corp.cc.cd) | | |
| TASK-034 | Apply taste-skill directives to dashboard components | | |
| TASK-035 | Implement anti-slop directives (banned fonts: Inter, Arial; banned colors: #000000; banned patterns: 3-column grids, purple neon gradients) | | |
| TASK-036 | Add motion physics (spring physics: stiffness=100, damping=20 instead of linear easing) | | |
| TASK-037 | Test dashboard with CEO Remy for user experience | | |
| TASK-038 | Fine-tune configuration dials based on feedback | | |

### Implementation Phase 6: Cascade Plugin Integration

- GOAL-006: Integrate all three methodologies as Cascade plugins for MFM project

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-039 | Add Superpowers to Cascade plugin marketplace | | |
| TASK-040 | Add Compound Engineering to Cascade plugin marketplace | | |
| TASK-041 | Add Taste Skill to Cascade plugin marketplace | | |
| TASK-042 | Enable Superpowers by default for all sessions | | |
| TASK-043 | Enable Compound Engineering by default for all sessions | | |
| TASK-044 | Enable Taste Skill by default for all frontend tasks | | |
| TASK-045 | Configure Cascade default dials: DESIGN_VARIANCE=5, MOTION_INTENSITY=4, VISUAL_DENSITY=5 | | |
| TASK-046 | Test all three plugins with common workflows | | |

### Implementation Phase 7: Training and Documentation

- GOAL-007: Train CEO Remy on all three methodologies and create comprehensive documentation

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-047 | Create training materials for Superpowers methodology | | |
| TASK-048 | Create training materials for Compound Engineering methodology | | |
| TASK-049 | Create training materials for Taste Skill methodology | | |
| TASK-050 | Document when to use each methodology (decision matrix) | | |
| TASK-051 | Create cheat sheets for common workflows | | |
| TASK-052 | Record video tutorials for CEO Remy | | |
| TASK-053 | Conduct training session with CEO Remy | | |
| TASK-054 | Gather feedback and iterate on training materials | | |

## 3. Alternatives

- **ALT-001**: Integrate methodologies one at a time instead of all three simultaneously. Not chosen because of time constraints and need for comprehensive integration.
- **ALT-002**: Skip Taste Skill integration for MFM dashboard and focus only on Superpowers and Compound Engineering. Not chosen because premium dashboard design is critical for MFM's dashboard-first approach.
- **ALT-003**: Use manual prompting instead of skill-based integration. Not chosen because skills provide systematic, repeatable enforcement of methodologies.

## 4. Dependencies

- **DEP-001**: npx skills CLI must be installed and functional
- **DEP-002**: Vitest framework must be configured for test execution
- **DEP-003**: Cascade plugin marketplace must support custom skill integration
- **DEP-004**: MFM dashboard (mfm-corp.cc.cd) must be accessible for redesign
- **DEP-005**: CEO Remy must be available for training sessions
- **DEP-006**: All agent files must be backed up before tool upgrades

## 5. Files

- **FILE-001**: src/agents/coo/*.md (12 COO agent files)
- **FILE-002**: src/agents/cto/*.md (9 CTO agent files)
- **FILE-003**: src/agents/cmo/*.md (6 CMO agent files)
- **FILE-004**: src/agents/cfo/*.md (4 CFO agent files)
- **FILE-005**: src/agents/cino/*.md (8 CINO agent files)
- **FILE-006**: src/agents/clo/*.md (1 CLO agent file)
- **FILE-007**: tests/unit/agent-base.test.js (existing test file)
- **FILE-008**: tests/unit/telegram-bot.test.js (existing test file)
- **FILE-009**: tests/unit/d1-store.test.js (existing test file)
- **FILE-010**: docs/STRATEGY.md (new file for Compound Engineering strategy)
- **FILE-011**: dashboard/index.html (MFM dashboard file)
- **FILE-012**: dashboard/css/styles.css (MFM dashboard styles)
- **FILE-013**: .skills/ (directory for installed skills)

## 6. Testing

- **TEST-001**: Verify all 42 agents have required tools configured
- **TEST-002**: Verify test coverage reaches 80% threshold
- **TEST-003**: Verify Superpowers integration with test-driven-development workflow
- **TEST-004**: Verify Compound Engineering integration with ce-compound workflow
- **TEST-005**: Verify Taste Skill integration with premium design standards
- **TEST-006**: Verify dashboard redesign meets anti-slop directives
- **TEST-007**: Verify motion physics implementation (spring physics)
- **TEST-008**: Verify Cascade plugin integration for all three methodologies
- **TEST-009**: Verify CEO Remy can use all three methodologies independently
- **TEST-010**: Verify backward compatibility with existing agent workflows

## 7. Risks & Assumptions

- **RISK-001**: 42 agents may have complex tool integration issues. Mitigation: Phased rollout by department, comprehensive testing, rollback plans.
- **RISK-002**: Superpowers, Compound Engineering, and Taste Skill may add overhead. Mitigation: Gradual adoption, training, workflow optimization.
- **RISK-003**: Taste Skill's "premium" design may not align with brand preferences. Mitigation: Tune configuration dials, iterative feedback with CEO Remy.
- **RISK-004**: CEO Remy may find three methodologies overwhelming. Mitigation: Simplified training materials, hands-on practice sessions.
- **RISK-005**: Cascade plugin marketplace may not support custom skill integration. Mitigation: Manual integration fallback, vendor support.
- **ASSUMPTION-001**: npx skills CLI is compatible with MFM's Node.js v24.14.0 environment
- **ASSUMPTION-002**: Vitest framework is already configured for MFM project
- **ASSUMPTION-003**: CEO Remy has time available for training sessions within 6-week timeline
- **ASSUMPTION-004**: MFM dashboard (mfm-corp.cc.cd) is built with React/Vite and Tailwind CSS (compatible with Taste Skill)

## 8. Related Specifications / Further Reading

- [COMPREHENSIVE-IMPLEMENTATION-PLAN.md](../COMPREHENSIVE-IMPLEMENTATION-PLAN.md)
- [SUPERPOWERS-ANALYSIS-FOR-MFM-AND-CASCADE.md](../SUPERPOWERS-ANALYSIS-FOR-MFM-AND-CASCADE.md)
- [COMPOUND-ENGINEERING-ANALYSIS-FOR-MFM-AND-CASCADE.md](../COMPOUND-ENGINEERING-ANALYSIS-FOR-MFM-AND-CASCADE.md)
- [TASTE-SKILL-ANALYSIS-FOR-MFM-AND-CASCADE.md](../TASTE-SKILL-ANALYSIS-FOR-MFM-AND-CASCADE.md)
- [COMPREHENSIVE-AGENT-AUDIT-REPORT.md](../COMPREHENSIVE-AGENT-AUDIT-REPORT.md)
- [SECURITY-AUDIT-REPORT-2026-05-28.md](../SECURITY-AUDIT-REPORT-2026-05-28.md)
