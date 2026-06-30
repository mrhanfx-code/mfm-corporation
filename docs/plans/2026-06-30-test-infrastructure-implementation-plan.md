---
goal: Test Infrastructure Setup - Vitest Configuration and Critical Path Testing
version: 1.0
date_created: 2026-06-30
last_updated: 2026-06-30
owner: MFM Corporation Quality Team
status: 'Planned'
tags: ['testing', 'vitest', 'tdd', 'infrastructure', 'quality']
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This implementation plan establishes a comprehensive test infrastructure for the MFM-Corporation codebase, which currently has 0% test coverage. The plan focuses on setting up Vitest, writing tests for critical paths, and establishing CI/CD test pipelines to prevent regressions and ensure code quality.

## 1. Requirements & Constraints

- **REQ-001**: Install and configure Vitest as the test framework
- **REQ-002**: Achieve 40% test coverage for critical paths (orchestrator, auth, database)
- **REQ-003**: Set up CI/CD test pipeline to run tests on every PR
- **REQ-004**: Block merges if tests fail
- **REQ-005**: Generate coverage reports with minimum threshold enforcement
- **TDD-001**: Follow test-driven development principles for new features
- **TDD-002**: Write failing test before implementing code
- **TDD-003**: Watch test fail before writing implementation
- **CON-001**: Tests must run in Cloudflare Workers environment (miniflare)
- **CON-002**: Test suite must complete in under 5 minutes for CI/CD
- **GUD-001**: Follow existing code patterns and conventions in test files
- **PAT-001**: Use Cloudflare Vitest pool for Workers testing

## 2. Implementation Steps

### Implementation Phase 1: Test Infrastructure Setup

- GOAL-001: Install and configure Vitest with Cloudflare Workers support

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Install Vitest and dependencies: `npm install -D vitest @vitest/coverage-v8 @cloudflare/vitest-pool-workers` | | |
| TASK-002 | Create `vitest.config.js` with Cloudflare Workers pool configuration | | |
| TASK-003 | Configure coverage reporting with v8 provider and HTML output | | |
| TASK-004 | Add test scripts to package.json: `test`, `test:watch`, `test:coverage` | | |
| TASK-005 | Create test directory structure: `tests/unit/`, `tests/integration/`, `tests/e2e/` | | |
| TASK-006 | Create test setup file `tests/setup.js` for shared test configuration | | |
| TASK-007 | Verify Vitest runs successfully with empty test suite | | |

### Implementation Phase 2: Critical Path Tests - Orchestrator

- GOAL-002: Write comprehensive tests for orchestrator routing logic

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-008 | Create `tests/unit/orchestrator.test.js` for intent classification tests | | |
| TASK-009 | Write test for routing to correct agent based on CEO command | | |
| TASK-010 | Write test for handling unknown/ambiguous commands | | |
| TASK-011 | Write test for routing decisions with confidence scores | | |
| TASK-012 | Write test for error handling in orchestrator | | |
| TASK-013 | Verify orchestrator tests pass with 100% coverage | | |

### Implementation Phase 3: Critical Path Tests - Authentication

- GOAL-003: Write comprehensive tests for authentication and authorization

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-014 | Create `tests/unit/auth.test.js` for authentication tests | | |
| TASK-015 | Write test for valid token acceptance | | |
| TASK-016 | Write test for invalid token rejection | | |
| TASK-017 | Write test for expired token rejection | | |
| TASK-018 | Write test for rate limiting enforcement | | |
| TASK-019 | Write test for rate limiting fail-closed behavior | | |
| TASK-020 | Write test for CORS policy enforcement | | |
| TASK-021 | Verify authentication tests pass with 100% coverage | | |

### Implementation Phase 4: Critical Path Tests - Database Operations

- GOAL-004: Write comprehensive tests for D1 database operations

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-022 | Create `tests/unit/d1-store.test.js` for database tests | | |
| TASK-023 | Write test for task creation (saveTask) | | |
| TASK-024 | Write test for task retrieval (getRecentTasks) | | |
| TASK-025 | Write test for task update (updateTaskScore) | | |
| TASK-026 | Write test for memory storage (storeMemory) | | |
| TASK-027 | Write test for memory search (searchMemory) | | |
| TASK-028 | Write test for decision logging (logDecision) | | |
| TASK-029 | Write test for error handling in database operations | | |
| TASK-030 | Verify database tests pass with 80% coverage | | |

### Implementation Phase 5: Critical Path Tests - API Endpoints

- GOAL-005: Write comprehensive tests for dashboard API endpoints

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-031 | Create `tests/integration/dashboard-api.test.js` for API tests | | |
| TASK-032 | Write test for GET /api/v1/dashboard/status endpoint | | |
| TASK-033 | Write test for GET /api/v1/dashboard/agents endpoint | | |
| TASK-034 | Write test for POST /api/v1/dashboard/commands endpoint | | |
| TASK-035 | Write test for authentication requirement on all endpoints | | |
| TASK-036 | Write test for rate limiting on API endpoints | | |
| TASK-037 | Write test for error responses (401, 403, 429, 500) | | |
| TASK-038 | Verify API tests pass with 60% coverage | | |

### Implementation Phase 6: CI/CD Pipeline Setup

- GOAL-006: Configure GitHub Actions to run tests on every PR

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-039 | Create `.github/workflows/test.yml` GitHub Actions workflow file | | |
| TASK-040 | Configure workflow to trigger on pull requests and pushes to main | | |
| TASK-041 | Add Node.js setup step with version 18+ | | |
| TASK-042 | Add npm install step | | |
| TASK-043 | Add test execution step with coverage reporting | | |
| TASK-044 | Add coverage upload step to Codecov or GitHub Actions | | |
| TASK-045 | Configure workflow to fail if tests fail | | |
| TASK-046 | Add coverage threshold enforcement (minimum 40% for critical paths) | | |
| TASK-047 | Test CI/CD pipeline with a sample PR | | |

### Implementation Phase 7: Test Documentation

- GOAL-007: Document testing practices and guidelines

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-048 | Create `docs/TESTING-GUIDE.md` with TDD practices | | |
| TASK-049 | Document test naming conventions | | |
| TASK-050 | Document test structure and organization | | |
| TASK-051 | Document how to run tests locally | | |
| TASK-052 | Document how to add new tests | | |
| TASK-053 | Document coverage requirements and thresholds | | |

## 3. Alternatives

- **ALT-001**: Use Jest instead of Vitest - Not chosen due to better Cloudflare Workers support in Vitest
- **ALT-002**: Use Playwright for all testing - Not chosen as Playwright is better suited for E2E browser testing, not unit/integration tests
- **ALT-003**: Skip CI/CD pipeline and rely on manual testing - Not chosen as automated testing is critical for preventing regressions

## 4. Dependencies

- **DEP-001**: Vitest test framework
- **DEP-002**: @vitest/coverage-v8 for coverage reporting
- **DEP-003**: @cloudflare/vitest-pool-workers for Workers environment
- **DEP-004**: GitHub Actions for CI/CD pipeline
- **DEP-005**: Existing wrangler.toml configuration for Workers bindings

## 5. Files

- **FILE-001**: `vitest.config.js` - New file for Vitest configuration
- **FILE-002**: `package.json` - Add test scripts and dependencies
- **FILE-003**: `tests/setup.js` - New file for test setup
- **FILE-004**: `tests/unit/orchestrator.test.js` - New file for orchestrator tests
- **FILE-005**: `tests/unit/auth.test.js` - New file for authentication tests
- **FILE-006**: `tests/unit/d1-store.test.js` - New file for database tests
- **FILE-007**: `tests/integration/dashboard-api.test.js` - New file for API tests
- **FILE-008**: `.github/workflows/test.yml` - New file for CI/CD pipeline
- **FILE-009**: `docs/TESTING-GUIDE.md` - New file for testing documentation

## 6. Testing

- **TEST-001**: Verify Vitest runs successfully with `npm test`
- **TEST-002**: Verify coverage report generates with `npm run test:coverage`
- **TEST-003**: Verify all unit tests pass locally
- **TEST-004**: Verify all integration tests pass locally
- **TEST-005**: Verify CI/CD pipeline runs successfully on PR
- **TEST-006**: Verify coverage threshold enforcement works
- **TEST-007**: Verify test execution time is under 5 minutes
- **TEST-008**: Verify tests work in Cloudflare Workers environment

## 7. Risks & Assumptions

- **RISK-001**: Cloudflare Workers pool may have compatibility issues with some tests - Mitigation: Use miniflare for local testing and isolate problematic tests
- **RISK-002**: Test execution time may exceed CI/CD timeout - Mitigation: Optimize test performance and use parallel execution
- **RISK-003**: Coverage threshold may block valid PRs - Mitigation: Set reasonable thresholds and provide exception process
- **ASSUMPTION-001**: Cloudflare Workers pool supports all required testing features
- **ASSUMPTION-002**: GitHub Actions has sufficient quota for test execution
- **ASSUMPTION-003**: Team members can learn and follow TDD practices

## 8. Related Specifications / Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [Cloudflare Workers Testing Guide](https://developers.cloudflare.com/workers/testing/)
- [Test-Driven Development Best Practices](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
