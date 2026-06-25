# Superpowers Configuration for MFM Corporation

**Project**: MFM Corporation
**Phase**: Phase 1 - Agent Upgrades
**Last Updated**: 2026-05-30
**Owner**: Sage (Backend Engineer)

---

## Superpowers Methodology Integration

Superpowers provides TDD (Test-Driven Development) and systematic debugging workflows. This configuration maps MFM Corporation's tools and workflows to Superpowers methodology.

---

## Tool Mapping

### MFM Tools to Superpowers Categories

| MFM Tool | Superpowers Category | Usage Pattern |
|----------|---------------------|---------------|
| d1-query | Data Access | Database queries for test data setup/teardown |
| web-fetch | External API | Mocking external dependencies in tests |
| send-email | Notification | Test email delivery verification |
| slack-notify | Notification | Test Slack integration verification |
| sms-alert | Notification | Test SMS alert verification |
| drive-write | File Storage | Test file persistence verification |
| social-post | Social Media | Test social media posting verification |
| video-prompt | Media Generation | Test video generation workflows |

---

## TDD Workflow Configuration

### Agent Development TDD Cycle

**RED Phase (Write Failing Test)**:
1. Create test file in `tests/unit/agents/` or `tests/integration/`
2. Write test for agent tool addition or functionality
3. Run test: `$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm test`
4. Verify test fails (RED)

**GREEN Phase (Write Minimal Implementation)**:
1. Add tool to agent markdown file (src/agents/**/*.md)
2. Run test again
3. Verify test passes (GREEN)

**REFACTOR Phase (Improve Code)**:
1. Review agent markdown for consistency
2. Ensure tool declaration follows template
3. Run all tests to ensure no regression
4. Verify 80%+ coverage maintained

---

## Systematic Debugging Protocol

### Agent Issue Debugging Steps

**1. Capture State**:
- Record agent name and tool configuration
- Note test failure message
- Capture relevant agent markdown content

**2. Isolate Problem**:
- Check tool declaration syntax in agent markdown
- Verify tool exists in agent-base.js
- Test tool independently if possible

**3. Hypothesize Root Cause**:
- Missing tool import in agent-base.js
- Incorrect tool name in agent markdown
- Tool configuration mismatch

**4. Test Hypothesis**:
- Add missing import if needed
- Correct tool name if misspelled
- Run targeted test

**5. Verify Fix**:
- Run specific test
- Run full test suite
- Check for regressions

---

## Test Configuration

### Vitest Configuration for Superpowers

**Test Patterns**:
- Unit tests: `tests/unit/**/*.test.js`
- Integration tests: `tests/integration/**/*.test.js`
- Coverage target: 80%

**Test Execution**:
```powershell
# Run all tests
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm test

# Run with coverage
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm run test:coverage

# Watch mode for TDD
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; npm run test:watch
```

---

## Agent-Specific Test Patterns

### Tool Addition Test Pattern

```javascript
// Test pattern for adding tools to agents
describe('Agent Tool Addition', () => {
  it('should have [tool-name] in tools section', () => {
    const agentContent = fs.readFileSync('src/agents/[agent-name].md', 'utf8');
    expect(agentContent).toMatch(/[tool-name]:/);
  });
});
```

### Agent Initialization Test Pattern

```javascript
// Test pattern for agent class initialization
describe('Agent Initialization', () => {
  it('should initialize [agent-name] correctly', () => {
    const agent = new [AgentClass]();
    expect(agent.name).toBe('[agent-name]');
    expect(agent.tools).toContain('[tool-name]');
  });
});
```

---

## Quality Gates

### Before Marking Task Complete

- [ ] Test written and fails (RED)
- [ ] Implementation added and test passes (GREEN)
- [ ] Code reviewed for consistency
- [ ] Full test suite passes
- [ ] Coverage >= 80%
- [ ] No regressions introduced

---

## Known Issues

### Tool Declaration Format

**Issue**: Some agent markdown files may have inconsistent tool declaration formats
**Resolution**: Follow .agent-template.md format strictly
**Pattern**: `- [tool-name]: [description]`

### Tool Import Dependencies

**Issue**: Tools must be imported in agent-base.js before use
**Resolution**: Verify import exists in src/core/agent-base.js
**Check**: `import { [toolFunction] } from '../tools/[tool-file].js';`

---

## Next Steps

1. Apply TDD workflow to remaining agent tool additions
2. Use systematic debugging for any test failures
3. Maintain 80%+ coverage throughout Sprint 1
4. Document learnings using ce-compound after each milestone
