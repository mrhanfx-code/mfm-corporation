# Systematic Debugging Protocol for Agent Issues

**Project**: MFM Corporation
**Phase**: Phase 1 - Agent Upgrades
**Last Updated**: 2026-05-30
**Owner**: Sage (Backend Engineer)

---

## Overview

Systematic debugging protocol for troubleshooting agent issues in MFM Corporation. This protocol ensures structured, efficient problem resolution for agent tool additions, initialization failures, and workflow issues.

---

## Debugging Framework

### 5-Step Debugging Process

#### Step 1: Capture State

**Objective**: Record all relevant information about the issue

**Checklist**:
- [ ] Agent name and file path
- [ ] Test failure message (full stack trace)
- [ ] Agent markdown content (relevant sections)
- [ ] Agent class code (if applicable)
- [ ] Tool configuration in agent-base.js
- [ ] Last working state (if known)

**Template**:
```markdown
## Issue Capture
- Agent: [agent-name]
- File: src/agents/[department]/[agent-name].md
- Test: tests/unit/agents/[agent-name].test.js
- Error: [full error message]
- Last Working: [commit hash or description]
```

---

#### Step 2: Isolate Problem

**Objective**: Narrow down the root cause

**Investigation Areas**:

1. **Tool Declaration Check**
   - Verify tool name spelling in agent markdown
   - Check tool format: `- [tool-name]: [description]`
   - Ensure tool is in Tools section

2. **Tool Import Check**
   - Verify tool import in `src/core/agent-base.js`
   - Check import statement syntax
   - Confirm tool function is exported

3. **Agent Class Check**
   - Verify agent class extends AgentBase
   - Check tools array includes tool name
   - Ensure systemPrompt is defined

4. **Test Check**
   - Verify test file path is correct
   - Check test assertions are valid
   - Ensure test imports are correct

**Isolation Commands**:
```powershell
# Check tool in agent markdown
Get-Content "src/agents/[department]/[agent-name].md" | Select-String "[tool-name]"

# Check tool import in agent-base
Get-Content "src/core/agent-base.js" | Select-String "[tool-name]"

# Run specific test
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm test -- tests/unit/agents/[agent-name].test.js
```

---

#### Step 3: Hypothesize Root Cause

**Objective**: Formulate testable hypotheses

**Common Hypotheses**:

| Hypothesis | Evidence | Test |
|------------|----------|------|
| Tool not imported in agent-base.js | Tool not found in imports | Add import, run test |
| Tool name misspelled in agent markdown | No match in search | Correct spelling, run test |
| Tool function not exported | Import fails | Check export in tool file |
| Test assertion incorrect | Test fails on valid code | Review test logic |
| Agent class not extending AgentBase | Class properties missing | Check extends clause |

**Hypothesis Template**:
```markdown
## Hypothesis
**Root Cause**: [hypothesis]
**Evidence**: [supporting evidence]
**Test**: [how to verify]
```

---

#### Step 4: Test Hypothesis

**Objective**: Verify hypothesis with targeted fix

**Fix Patterns**:

**Pattern 1: Missing Tool Import**
```javascript
// src/core/agent-base.js
import { d1Query } from '../tools/d1-query.js'; // Add this
```

**Pattern 2: Misspelled Tool Name**
```markdown
# src/agents/cfo/finance-planner.md
## Tools
- d1-query: Database queries (not d1query or d1_query)
```

**Pattern 3: Missing Tool Export**
```javascript
// src/tools/d1-query.js
export { d1Query }; // Ensure export exists
```

**Pattern 4: Incorrect Test Assertion**
```javascript
// tests/unit/agents/finance-planner.test.js
expect(content).toMatch(/d1-query:/); // Correct regex pattern
```

**Verification Commands**:
```powershell
# Run specific test after fix
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm test -- tests/unit/agents/[agent-name].test.js

# Run full test suite
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm test
```

---

#### Step 5: Verify Fix

**Objective**: Ensure fix resolves issue without side effects

**Verification Checklist**:
- [ ] Specific test passes
- [ ] Full test suite passes
- [ ] No new test failures
- [ ] Coverage >= 80%
- [ ] Agent markdown follows template
- [ ] Tool works in agent class instantiation

**Regression Testing**:
```powershell
# Run all agent tests
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm test -- tests/unit/agents/

# Run integration tests
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm test -- tests/integration/

# Check coverage
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm run test:coverage
```

---

## Common Issues and Solutions

### Issue 1: Tool Not Found in Agent

**Symptoms**: Test fails with "tool not found" error

**Root Causes**:
1. Tool not declared in agent markdown
2. Tool name misspelled
3. Tool not in Tools section

**Solutions**:
```markdown
# Add tool to agent markdown
## Tools
- [tool-name]: [description]
```

---

### Issue 2: Agent Class Initialization Fails

**Symptoms**: Test fails when instantiating agent class

**Root Causes**:
1. Agent class doesn't extend AgentBase
2. Required properties missing
3. Tools array incorrect

**Solutions**:
```javascript
// Ensure class extends AgentBase
export class FinancePlanner extends AgentBase {
  constructor() {
    super();
    this.name = 'finance-planner';
    this.tools = ['d1-query', 'web-fetch'];
    this.systemPrompt = '...';
  }
}
```

---

### Issue 3: Test File Not Found

**Symptoms**: Vitest error "test file not found"

**Root Causes**:
1. Incorrect file path
2. File not in tests/ directory
3. File extension not .test.js

**Solutions**:
```powershell
# Verify file exists
Test-Path "tests/unit/agents/[agent-name].test.js"

# Ensure correct extension
Rename-Item "tests/unit/agents/[agent-name].js" "[agent-name].test.js"
```

---

### Issue 4: Coverage Below 80%

**Symptoms**: Coverage report shows < 80%

**Root Causes**:
1. Missing test cases
2. Untested code paths
3. Conditional logic not covered

**Solutions**:
```javascript
// Add test for uncovered code path
it('should handle [condition]', () => {
  const agent = new AgentClass();
  agent.[method]();
  expect(agent.[property]).toBe([expected]);
});
```

---

## Debugging Tools

### Vitest Debug Mode

```powershell
# Run tests in debug mode
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npx vitest --debug
```

### Console Logging

```javascript
// Add console.log for debugging
console.log('Agent tools:', agent.tools);
console.log('Agent name:', agent.name);
```

### VS Code Debugger

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest",
      "runtimeExecutable": "node",
      "runtimeArgs": ["--inspect-brk", "./node_modules/.bin/vitest", "run", "--no-coverage"]
    }
  ]
}
```

---

## Documentation

### Issue Tracking

Document all debugging sessions in `docs/debugging/`:

```markdown
# [Date] - [Agent Name] Debugging Session

## Issue
[Description]

## Steps Taken
1. Captured state
2. Isolated problem
3. Hypothesized root cause
4. Tested hypothesis
5. Verified fix

## Root Cause
[Final root cause]

## Solution
[Implementation]

## Lessons Learned
[What to avoid in future]
```

---

## References

- Superpowers Configuration: `.windsurf/skills/superpowers-config.md`
- TDD Workflow: `docs/development/tdd-workflow.md`
- Agent Template: `src/agents/.agent-template.md`
- Vitest Documentation: https://vitest.dev/
