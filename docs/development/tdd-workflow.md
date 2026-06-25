# TDD Workflow for Agent Development

**Project**: MFM Corporation
**Phase**: Phase 1 - Agent Upgrades
**Last Updated**: 2026-05-30
**Owner**: Sage (Backend Engineer)

---

## Overview

Test-Driven Development (TDD) workflow for MFM Corporation agent development using Vitest. This workflow ensures 80%+ test coverage and high-quality agent implementations.

---

## TDD Cycle: RED-GREEN-REFACTOR

### Phase 1: RED (Write Failing Test)

**Step 1**: Identify the feature or tool to add
- Example: Add `d1-query` tool to `finance-planner` agent
- Review agent template: `src/agents/.agent-template.md`

**Step 2**: Write the test first
```javascript
// tests/unit/agents/finance-planner.test.js
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Finance Planner Agent', () => {
  it('should have d1-query tool in tools section', () => {
    const agentPath = path.join(__dirname, '../../src/agents/cfo/finance-planner.md');
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toMatch(/d1-query:/);
  });
});
```

**Step 3**: Run the test and verify it fails
```powershell
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm test -- tests/unit/agents/finance-planner.test.js
```

**Expected Result**: Test fails (RED) ✗

---

### Phase 2: GREEN (Write Minimal Implementation)

**Step 1**: Add the minimal implementation
```markdown
# src/agents/cfo/finance-planner.md

## Tools
- d1-query: Database queries for financial data
```

**Step 2**: Run the test again
```powershell
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm test -- tests/unit/agents/finance-planner.test.js
```

**Expected Result**: Test passes (GREEN) ✓

**Step 3**: Verify no other tests broke
```powershell
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm test
```

---

### Phase 3: REFACTOR (Improve Code)

**Step 1**: Review implementation for consistency
- Check against agent template
- Verify tool description format
- Ensure markdown structure is correct

**Step 2**: Refactor if needed
- Improve tool descriptions
- Add missing sections
- Standardize formatting

**Step 3**: Run full test suite
```powershell
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm test
```

**Step 4**: Check coverage
```powershell
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm run test:coverage
```

**Expected Result**: Coverage >= 80% ✓

---

## Test Patterns for Agent Development

### Pattern 1: Tool Declaration Test

```javascript
it('should have [tool-name] in tools section', () => {
  const content = fs.readFileSync(agentPath, 'utf8');
  expect(content).toMatch(/[tool-name]:/);
});
```

### Pattern 2: Frontmatter Validation Test

```javascript
it('should have required frontmatter fields', () => {
  const content = fs.readFileSync(agentPath, 'utf8');
  expect(content).toMatch(/name:/);
  expect(content).toMatch(/role:/);
  expect(content).toMatch(/department:/);
  expect(content).toMatch(/reports_to:/);
});
```

### Pattern 3: Required Sections Test

```javascript
it('should have required markdown sections', () => {
  const content = fs.readFileSync(agentPath, 'utf8');
  expect(content).toMatch(/## Overview/);
  expect(content).toMatch(/## Responsibilities/);
  expect(content).toMatch(/## Capabilities/);
  expect(content).toMatch(/## Tools/);
  expect(content).toMatch(/## Dependencies/);
});
```

### Pattern 4: Agent Class Initialization Test

```javascript
import { FinancePlanner } from '../../src/agents/cfo/finance-planner.js';

it('should initialize FinancePlanner correctly', () => {
  const agent = new FinancePlanner();
  expect(agent.name).toBe('finance-planner');
  expect(agent.tools).toContain('d1-query');
});
```

---

## Quality Gates

### Before Committing

- [ ] Test written and fails (RED)
- [ ] Implementation added and test passes (GREEN)
- [ ] Code refactored for consistency
- [ ] Full test suite passes
- [ ] Coverage >= 80%
- [ ] No regressions introduced
- [ ] Agent markdown follows template format

### Before Merging

- [ ] All tests pass in CI
- [ ] Coverage report reviewed
- [ ] Code review completed
- [ ] Documentation updated
- [ ] PR description includes test results

---

## Common Pitfalls

### Pitfall 1: Writing Implementation Before Test

**Problem**: Adding tool to agent before writing test
**Solution**: Always write test first (RED phase)

### Pitfall 2: Skipping Refactor Phase

**Problem**: Moving to next task without refactoring
**Solution**: Always complete REFACTOR phase before moving on

### Pitfall 3: Not Running Full Test Suite

**Problem**: Only running the new test
**Solution**: Always run full test suite after GREEN phase

### Pitfall 4: Ignoring Coverage

**Problem**: Test passes but coverage is low
**Solution**: Check coverage and add tests until >= 80%

---

## Test Organization

### Directory Structure

```
tests/
├── unit/
│   ├── agents/
│   │   ├── agent-markdown.test.js (general agent tests)
│   │   ├── agent-initialization.test.js (class tests)
│   │   ├── agent-workflows.test.js (workflow tests)
│   │   └── [department]/
│   │       └── [agent-name].test.js (agent-specific tests)
│   ├── telegram-bot.test.js
│   ├── agent-base.test.js
│   └── d1-store.test.js
└── integration/
    ├── multi-agent-workflows.test.js
    └── [other integration tests]
```

### Naming Conventions

- Test files: `[feature].test.js`
- Test suites: `describe('[Feature Name]', () => { ... })`
- Test cases: `it('should [expected behavior]', () => { ... })`

---

## Continuous Integration

### Pre-commit Hook (Recommended)

```json
// package.json
{
  "scripts": {
    "precommit": "npm test && npm run test:coverage"
  }
}
```

### CI Pipeline

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

---

## References

- Vitest Documentation: https://vitest.dev/
- Superpowers Configuration: `.windsurf/skills/superpowers-config.md`
- Agent Template: `src/agents/.agent-template.md`
- Sprint Plan: `docs/sprint-1/plan.md`
