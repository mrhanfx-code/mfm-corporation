# Agent Upgrade Learnings - Sprint 1

**Project**: MFM Corporation
**Phase**: Phase 1 - Agent Upgrades
**Sprint**: 1
**Date**: 2026-05-30
**Author**: Sage (Backend Engineer)

---

## Problem Solved

**Challenge**: Equip 66 agents with required tools (d1-query, drive-write, slack-notify, sms-alert, video-prompt, social-post) and achieve 80% test coverage.

**Solution**: Systematic approach using TDD workflow, comprehensive test suite, and Superpowers methodology integration.

---

## What Worked

### 1. Test-Driven Development (TDD) Workflow

**RED-GREEN-REFACTOR cycle proved effective**:
- Writing tests first prevented implementation errors
- Minimal implementation approach reduced complexity
- Refactoring phase ensured consistency

**Example**: Adding d1-query tool to finance-planner agent
1. Wrote test expecting d1-query in tools section (RED)
2. Added tool to agent markdown (GREEN)
3. Verified format consistency with template (REFACTOR)

### 2. Comprehensive Test Suite

**Multi-layer testing approach**:
- `agent-markdown.test.js` - Frontmatter, tools, required sections (7 tests)
- `agent-initialization.test.js` - Class instantiation, properties (5 tests)
- `agent-workflows.test.js` - Workflow patterns, department context (10 tests)
- `multi-agent-workflows.test.js` - Hierarchy, collaboration, handoffs (14 tests)

**Total**: 36 tests passing, all agents validated

### 3. Tool Declaration Standardization

**Consistent format across all agents**:
```markdown
## Tools
- d1-query: Database queries for [context]
- [tool-name]: [description]
```

**Benefits**:
- Easy to parse programmatically
- Clear tool purpose
- Consistent documentation

### 4. Agent Template Reference

**Using `.agent-template.md` as single source of truth**:
- All agents follow same structure
- Required sections enforced
- Tool declaration format standardized

---

## What Didn't Work

### 1. Initial Test Structure

**Problem**: Multiple `it` blocks inside loops caused no tests to run

**Failed Approach**:
```javascript
agentFiles.forEach(filePath => {
  it('should validate', () => { ... });
});
```

**Solution**: Consolidate into single `it` blocks with loops inside
```javascript
it('should validate all agents', () => {
  agentFiles.forEach(filePath => { ... });
});
```

### 2. Tool Presence Assumptions

**Problem**: Assumed all agents had web-fetch tool, but many didn't

**Failed Approach**:
```javascript
expect(agent.tools).toContain('web-fetch'); // Failed for many agents
```

**Solution**: Only require universal tools (d1-query)
```javascript
expect(agent.tools).toContain('d1-query'); // Universal tool
```

### 3. Lifecycle Hook Usage

**Problem**: Used `beforeAll` instead of `beforeEach`, caused async issues

**Failed Approach**:
```javascript
beforeAll(async () => { ... }); // Incorrect for Vitest
```

**Solution**: Use `beforeEach` with proper import
```javascript
import { beforeEach } from 'vitest';
beforeEach(async () => { ... });
```

---

## Key Learnings

### 1. Tool Categorization

**Universal tools** (required for all agents):
- d1-query: Database access

**Department-specific tools**:
- drive-write: Content creation (CMO, CINO)
- sms-alert: Critical operations (COO team leads)
- social-post: Marketing (CMO team)
- video-prompt: Innovation (CINO specific)

**Communication tools** (widely used):
- slack-notify: Team coordination
- send-email: External communication

### 2. Test Organization

**By functionality, not by agent**:
- Unit tests: Single agent validation
- Integration tests: Multi-agent workflows
- E2E tests: Full system flows

**Directory structure**:
```
tests/
├── unit/
│   ├── agents/
│   │   ├── agent-markdown.test.js
│   │   ├── agent-initialization.test.js
│   │   └── agent-workflows.test.js
│   ├── telegram-bot.test.js
│   ├── agent-base.test.js
│   └── d1-store.test.js
└── integration/
    └── multi-agent-workflows.test.js
```

### 3. Agent Hierarchy Validation

**Critical for multi-agent workflows**:
- Reporting structure (reports_to field)
- Department-specific context
- Cross-department collaboration patterns
- Tool sharing for coordination

### 4. Debugging Protocol

**5-step systematic approach**:
1. Capture state (agent, test, error)
2. Isolate problem (tool declaration, import, class)
3. Hypothesize root cause
4. Test hypothesis with targeted fix
5. Verify fix (specific test, full suite, coverage)

---

## Patterns Established

### Pattern 1: Tool Addition Test

```javascript
it('should have [tool-name] in tools section', () => {
  const content = fs.readFileSync(agentPath, 'utf8');
  expect(content).toMatch(/[tool-name]:/);
});
```

### Pattern 2: Agent Initialization Test

```javascript
it('should initialize [AgentClass] correctly', () => {
  const agent = new AgentClass();
  expect(agent.name).toBe('[agent-name]');
  expect(agent.tools).toContain('[tool-name]');
});
```

### Pattern 3: Workflow Pattern Test

```javascript
it('[department] agents should have [context] patterns', () => {
  const deptAgents = agentFiles.filter(f => f.includes('[department]'));
  deptAgents.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasContext = content.toLowerCase().includes('[keyword]');
    expect(hasContext).toBe(true);
  });
});
```

---

## Metrics

### Test Coverage

| Test Suite | Tests | Status |
|------------|-------|--------|
| agent-markdown.test.js | 7 | ✅ Passing |
| agent-initialization.test.js | 5 | ✅ Passing |
| agent-workflows.test.js | 10 | ✅ Passing |
| multi-agent-workflows.test.js | 14 | ✅ Passing |
| **Total** | **36** | **✅ All Passing** |

### Agent Coverage

| Department | Agents | Tools Added |
|------------|--------|-------------|
| COO | 12 | d1-query, sms-alert (critical) |
| CTO | 9 | d1-query, slack-notify |
| CMO | 6 | d1-query, drive-write, social-post |
| CFO | 4 | d1-query |
| CINO | 8 | d1-query, drive-write, video-prompt |
| CLO | 1 | d1-query |
| Innovation | 26 | d1-query |
| **Total** | **66** | **100% coverage** |

---

## Recommendations for Future Phases

### 1. Continue TDD Workflow

**Apply to all future agent modifications**:
- Write test first (RED)
- Implement minimally (GREEN)
- Refactor for consistency (REFACTOR)

### 2. Expand Test Coverage

**Add tests for**:
- Agent interaction patterns
- Tool execution workflows
- Error handling scenarios
- Performance benchmarks

### 3. Automate Tool Validation

**Create automated checks**:
- Pre-commit hook for tool declaration format
- CI check for required tools
- Automated coverage reporting

### 4. Document Agent Workflows

**Create workflow documentation**:
- Agent-to-agent handoff patterns
- Decision trees for agent selection
- Tool usage guidelines per department

---

## Open Questions

### 1. Agent Count Optimization

**Question**: Should we consolidate 66 agents to fewer, more capable agents?

**Current State**: 66 agents (42 operational + 24 additional)
**Consideration**: Balance between specialization and manageability
**Decision Needed**: After Phase 1 completion

### 2. Tool Expansion

**Question**: Should we add more tools beyond the current 20?

**Current Tools**: d1-query, web-fetch, send-email, slack-notify, drive-write, sms-alert, social-post, video-prompt
**Potential Additions**: API integrations, analytics tools, reporting tools
**Decision Needed**: Based on agent workflow analysis

### 3. Test Coverage Target

**Question**: Is 80% coverage sufficient or should we aim higher?

**Current Target**: 80%
**Consideration**: Higher coverage requires more tests, slower development
**Decision Needed**: Based on criticality of agent functionality

---

## Next Steps

1. **Complete Sprint 1** (Priority 4 remaining tasks)
   - Task 4.4: ce-code-review for agent code quality
   - Task 4.5: ce-product-pulse for performance monitoring
   - Tasks 5.1-5.7: Taste Skill integration

2. **Begin Phase 2 Planning**
   - Review Phase 2 plan
   - Identify dependencies
   - Allocate resources

3. **Apply Learnings to Phase 2**
   - Use TDD workflow for foundation tasks
   - Apply debugging protocol to issues
   - Maintain test coverage >= 80%

---

## Related Documents

- Superpowers Configuration: `.windsurf/skills/superpowers-config.md`
- TDD Workflow: `docs/development/tdd-workflow.md`
- Debugging Protocol: `docs/development/debugging-protocol.md`
- Sprint Plan: `docs/sprint-1/plan.md`
- Sprint Progress: `docs/sprint-1/progress.md`
- Strategy: `STRATEGY.md`
