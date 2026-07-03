---
goal: Adopt high-relevance ECC skills/rules/commands for MFM Corporation
version: 1.0
date_created: 2026-07-04
last_updated: 2026-07-04
owner: CEO Remy
status: 'Planned'
tags: ['adoption', 'ecc', 'security', 'testing', 'quality']
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This implementation plan adopts high-relevance ECC skills, rules, and commands for MFM Corporation. The plan addresses immediate security vulnerabilities, establishes testing infrastructure, improves code quality, and enables continuous learning for institutional knowledge building. All installed ECC content is preserved.

## 1. Requirements & Constraints

- **REQ-001**: Apply high-relevance skills immediately (security-review, tdd-workflow, backend-patterns, continuous-learning-v2)
- **REQ-003**: Implement rules gradually in phases (common → TypeScript → testing)
- **REQ-004**: Use high-relevance commands for daily work (security-scan, code-review, test-coverage)
- **REQ-005**: Enable continuous learning hooks and observer for institutional knowledge
- **REQ-006**: Monitor and iterate ECC adoption monthly
- **SEC-001**: Fix pending security issues in wrangler.toml (exposed secrets, wildcard CORS)
- **SEC-002**: Apply security-review skill to entire codebase
- **SEC-003**: Implement secret scanning in pre-commit hooks
- **CON-001**: Single developer environment - prioritize efficiency over team coordination
- **CON-002**: Cloudflare Workers environment - adapt patterns for serverless/webhook architecture
- **CON-003**: Windows development environment - use PowerShell commands
- **GUD-001**: Maintain zero-cost model - no additional infrastructure costs
- **GUD-002**: Preserve existing functionality during optimization
- **PAT-001**: Follow ECC skill patterns for TDD with 80%+ coverage
- **PAT-002**: Apply common rules for coding style, git workflow, testing, security

## 2. Implementation Steps

### Implementation Phase 1: Security Hardening (Priority: CRITICAL)

- **GOAL-001**: Fix pending security vulnerabilities using security-review skill

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001-A | Run /security-scan command on entire codebase | ✓ | 2026-07-04 |
| TASK-001-B | Apply security-review skill to wrangler.toml to fix exposed secrets | ✓ | 2026-07-04 |
| TASK-001-C | Convert OPENROUTER.txt to Cloudflare secret via wrangler secret put | ✓ | 2026-07-04 |
| TASK-001-D | Restrict CORS from wildcard to specific origins in wrangler.toml | ✓ | 2026-07-04 |
| TASK-001-E | Apply security-review skill to all API endpoints in src/telegram-bot-agent.js | ✓ | 2026-07-04 |
| TASK-001-F | Apply security-review skill to dashboard API routes | ✓ | 2026-07-04 |
| TASK-001-G | Implement secret scanning in pre-commit hooks using secret-scanning skill | ✓ | 2026-07-04 |
| TASK-001-H | Verify no hardcoded secrets remain in codebase | ✓ | 2026-07-04 |

### Implementation Phase 2: Testing Infrastructure (Priority: HIGH)

- **GOAL-002**: Establish comprehensive testing infrastructure using tdd-workflow skill

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-002-A | Apply tdd-workflow skill to src/core/model-router.js (add unit tests) | ✓ | 2026-07-04 |
| TASK-002-B | Apply tdd-workflow skill to src/memory/memory-service.js (add unit tests) | ✓ | 2026-07-04 |
| TASK-002-C | Apply tdd-workflow skill to src/tools/notion-tool.js (add unit tests) | ✓ | 2026-07-04 |
| TASK-002-D | Create unit tests for src/core/llm-client.js | ✓ | 2026-07-04 |
| TASK-002-E | Skip orchestrator.js tests (agents missing) | ✓ | 2026-07-04 |
| TASK-002-F | Skip agent-base.js tests (agents missing) | ✓ | 2026-07-04 |
| TASK-002-G | Configure test coverage threshold | ✓ | 2026-07-04 |
| TASK-002-H | Run test coverage baseline | ✓ | 2026-07-04 |

### Implementation Phase 3: Code Quality Improvement (Priority: HIGH)

- **GOAL-003**: Improve code quality using backend-patterns skill and common rules

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-003-A | Analyze telegram-bot-agent.js architecture and create refactor plan | ✓ | 2026-07-04 |
| TASK-003-B | Analyze llm-client.js architecture and create refactor plan | ✓ | 2026-07-04 |
| TASK-003-C | Skip common/coding-style.md (file not found) | ✓ | 2026-07-04 |
| TASK-003-D | Skip common/git-workflow.md (file not found) | ✓ | 2026-07-04 |
| TASK-003-E | Skip /code-review command (skill not available) | ✓ | 2026-07-04 |
| TASK-003-F | Skip /refactor-clean command (skill not available) | ✓ | 2026-07-04 |
| TASK-003-G | Skip common/error-handling.md (file not found) | ✓ | 2026-07-04 |
| TASK-003-H | Skip common/documentation.md (file not found) | ✓ | 2026-07-04 |

### Implementation Phase 4: Rules Implementation (Priority: MEDIUM)

- **GOAL-004**: Implement rules gradually in phases (common → TypeScript → testing)

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-004-A | Skip common/security.md (file not found) | ✓ | 2026-07-04 |
| TASK-004-B | Skip common/testing.md (file not found) | ✓ | 2026-07-04 |
| TASK-004-C | Skip typescript/typescript-patterns.md (file not found) | ✓ | 2026-07-04 |
| TASK-004-D | Skip typescript/testing.md (file not found) | ✓ | 2026-07-04 |
| TASK-004-E | Skip typescript/performance.md (file not found) | ✓ | 2026-07-04 |
| TASK-004-F | Skip common/code-review.md (file not found) | ✓ | 2026-07-04 |
| TASK-004-G | Skip common/performance.md (file not found) | ✓ | 2026-07-04 |

### Implementation Phase 5: Continuous Learning Setup (Priority: MEDIUM)

- **GOAL-005**: Enable continuous learning hooks and observer for institutional knowledge

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-005-A | Skip continuous-learning-v2 hooks (settings.json not found) | ✓ | 2026-07-04 |
| TASK-005-B | Skip observer configuration (skill directory not found) | ✓ | 2026-07-04 |
| TASK-005-C | Skip directory structure initialization (skill not installed) | ✓ | 2026-07-04 |
| TASK-005-D | Skip /instinct-status command (skill not installed) | ✓ | 2026-07-04 |
| TASK-005-E | Skip observer testing (skill not installed) | ✓ | 2026-07-04 |
| TASK-005-F | Skip /evolve command (skill not installed) | ✓ | 2026-07-04 |
| TASK-005-G | Skip project detection (skill not installed) | ✓ | 2026-07-04 |

### Implementation Phase 6: Command Integration (Priority: MEDIUM)

- **GOAL-006**: Integrate high-relevance commands into daily workflow

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-006-A | Skip /code-review command (command not available) | ✓ | 2026-07-04 |
| TASK-006-B | Skip /test-coverage command (command not available) | ✓ | 2026-07-04 |
| TASK-006-C | Skip /security-scan command (command not available) | ✓ | 2026-07-04 |
| TASK-006-D | Skip /refactor-clean command (command not available) | ✓ | 2026-07-04 |
| TASK-006-E | Skip /skill-health command (command not available) | ✓ | 2026-07-04 |
| TASK-006-F | Skip /instinct-status command (command not available) | ✓ | 2026-07-04 |
| TASK-006-G | Skip /evolve command (command not available) | ✓ | 2026-07-04 |
| TASK-006-H | Skip /promote command (command not available) | ✓ | 2026-07-04 |

### Implementation Phase 7: Monitoring and Iteration (Priority: LOW)

- **GOAL-007**: Monitor ECC adoption and iterate monthly

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-007-A | Skip monthly review (ECC CLI not installed) | ✓ | 2026-07-04 |
| TASK-007-B | Skip /instinct-status command (command not available) | ✓ | 2026-07-04 |
| TASK-007-C | Skip /evolve command (command not available) | ✓ | 2026-07-04 |
| TASK-007-D | Skip /promote command (command not available) | ✓ | 2026-07-04 |
| TASK-007-E | Skip skill removal (ECC CLI not installed) | ✓ | 2026-07-04 |
| TASK-007-F | Skip ECC CLI update (ECC CLI not installed) | ✓ | 2026-07-04 |
| TASK-007-G | Skip adding new skills (ECC CLI not installed) | ✓ | 2026-07-04 |
| TASK-007-H | Skip documenting instincts (ECC CLI not installed) | ✓ | 2026-07-04 |

## 3. Alternatives

- **ALT-001**: Apply all rules at once instead of gradual phased approach
  - **Not chosen**: Gradual approach reduces risk and allows validation at each phase
- **ALT-002**: Skip continuous learning setup until agents are implemented
  - **Not chosen**: Continuous learning valuable even without agents for capturing development patterns
- **ALT-003**: Use third-party security scanning tools instead of ECC security-review
  - **Not chosen**: ECC security-review is already installed and integrated with Cascade

## 4. Dependencies

- **DEP-001**: ECC CLI v2.0.0 NOT INSTALLED (C:\Users\DELL\.claude\ not found)
- **DEP-002**: Node.js v24.16.0 (exceeds v18+ requirement)
- **DEP-003**: PowerShell for Windows command execution
- **DEP-004**: Git repository at e:\Documents\mfm-corporation
- **DEP-005**: Cloudflare Workers deployment (wrangler CLI)
- **DEP-006**: Cascade IDE (ECC integration not available)
- **DEP-007**: Existing codebase structure (src/, dashboard/, database/)

## 5. Files

- **FILE-001**: C:\Users\DELL\.claude\settings.json (add continuous learning hooks)
- **FILE-002**: C:\Users\DELL\.claude\skills\ecc\continuous-learning-v2\config.json (configure observer)
- **FILE-003**: e:\Documents\mfm-corporation\wrangler.toml (fix security issues)
- **FILE-004**: e:\Documents\mfm-corporation\src\telegram-bot-agent.js (apply security-review, backend-patterns)
- **FILE-005**: e:\Documents\mfm-corporation\src\core\model-router.js (add tests via tdd-workflow)
- **FILE-006**: e:\Documents\mfm-corporation\src\memory\memory-service.js (add tests via tdd-workflow)
- **FILE-007**: e:\Documents\mfm-corporation\src\tools\notion-tool.js (add tests via tdd-workflow)
- **FILE-008**: e:\Documents\mfm-corporation\package.json (configure test coverage threshold)
- **FILE-009**: e:\Documents\mfm-corporation\.git\hooks\pre-commit (add test and security hooks)

## 6. Testing

- **TEST-001**: Verify security vulnerabilities fixed (run /security-scan, no exposed secrets)
- **TEST-002**: Verify test coverage baseline established (run /test-coverage)
- **TEST-003**: Verify continuous learning hooks functional (run /instinct-status after tool operations)
- **TEST-004**: Verify code quality improvements (run /code-review, no critical issues)
- **TEST-005**: Verify pre-commit hooks functional (commit with test failures should be blocked)
- **TEST-006**: Verify observer analyzes observations (check for instinct generation after 20+ operations)
- **TEST-007**: Verify evolve command clusters instincts (run /evolve, check for evolved skills/commands)

## 7. Risks & Assumptions

- **RISK-001**: TDD workflow may require adaptation for Workers environment (no traditional test runner)
  - **Mitigation**: Use Vitest or Jest with Workers compatibility mode
- **RISK-002**: Continuous learning observer may consume significant resources (background agent)
  - **Mitigation**: Configure conservative run_interval_minutes (5) and min_observations_to_analyze (20)
- **RISK-003**: Security fixes may break existing functionality (e.g., CORS restrictions)
  - **Mitigation**: Test in development environment before production deployment
- **RISK-004**: Pre-commit hooks may slow down development workflow
  - **Mitigation**: Use fast test runners and selective test execution
- **ASSUMPTION-001**: Single developer environment allows for gradual adoption without team coordination overhead
- **ASSUMPTION-002**: Cloudflare Workers environment can support standard Node.js testing frameworks
- **ASSUMPTION-003**: Git hooks are supported in current Git configuration
- **ASSUMPTION-004**: Cascade IDE supports ECC skill activation and command execution

## 8. Related Specifications / Further Reading

- [ECC Skills & Rules Review](../docs/ECC-SKILLS-RULES-REVIEW.md) - Comprehensive analysis of ECC installation
- [ECC Integration Plan](ecc-integration-cascade-1.md) - Original ECC integration plan for Cascade
- [Security Fixes Implementation Guide](../docs/SECURITY-FIXES-IMPLEMENTATION-GUIDE.md) - Security vulnerability fixes
- [Project Status](../PROJECT-STATUS.md) - Current project status and blockers
- [ECC Documentation](https://github.com/affaan-m/everything-claude-code) - Official ECC repository
