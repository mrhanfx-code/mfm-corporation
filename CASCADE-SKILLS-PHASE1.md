# Cascade Skills - Phase 1 Foundation

**Date**: May 29, 2026  
**Purpose**: Document foundational skills for Cascade AI coding assistant

---

## Skill 1: TDD Enforcement (RED-GREEN-REFACTOR)

### Description
Strict Test-Driven Development workflow that enforces writing tests before implementation.

### Workflow

#### RED Phase - Write Failing Test
1. Analyze the requirement or bug report
2. Write a test that captures the expected behavior
3. Verify the test fails (must fail before proceeding)
4. Document the test purpose and edge cases

#### GREEN Phase - Write Minimal Code
1. Write the minimal code to make the test pass
2. Do not add any extra features or optimizations
3. Verify the test now passes
4. Ensure no other tests are broken

#### REFACTOR Phase - Improve Code
1. Review the code for improvements
2. Refactor while keeping tests passing
3. Remove duplication, improve naming, enhance readability
4. Verify all tests still pass

### Implementation Pattern

```javascript
// Example TDD workflow for a new function
async function executeWithTDD(task) {
  // RED: Write failing test
  const test = await writeTest(task);
  const testResult = await runTest(test);
  if (testResult.passed) {
    throw new Error('Test must fail in RED phase');
  }
  
  // GREEN: Write minimal code
  const code = await writeMinimalCode(test);
  const greenResult = await runTest(test);
  if (!greenResult.passed) {
    throw new Error('Code must pass test in GREEN phase');
  }
  
  // REFACTOR: Improve code
  const refactored = await refactorCode(code);
  const refactorResult = await runTest(test);
  if (!refactorResult.passed) {
    throw new Error('Refactoring broke the test');
  }
  
  return refactored;
}
```

### Success Criteria
- 80%+ test coverage on new code
- All tests pass before completion
- No code exists without corresponding tests
- Refactoring maintains test integrity

### Integration Points
- Test framework (Vitest, Jest, etc.)
- Code coverage tools
- CI/CD pipeline integration

---

## Skill 2: Verification Before Completion

### Description
Ensure fixes actually work by verifying the solution before marking tasks complete.

### Workflow

#### 1. Reproduce the Issue
- Confirm the bug or requirement exists
- Document the current behavior
- Identify the expected behavior

#### 2. Apply the Fix
- Implement the solution
- Document the changes made
- Note any side effects

#### 3. Verify the Fix
- Reproduce the original issue (should now be fixed)
- Test edge cases
- Verify no regressions in related functionality
- Run full test suite

#### 4. Document Verification
- Record verification steps
- Document test results
- Note any remaining issues

### Implementation Pattern

```javascript
async function verifyBeforeCompletion(task, fix) {
  // Step 1: Reproduce original issue
  const originalState = await reproduceIssue(task);
  if (!originalState.exists) {
    throw new Error('Cannot verify - issue does not exist');
  }
  
  // Step 2: Apply fix
  await applyFix(fix);
  
  // Step 3: Verify fix
  const verification = await verifyFix(task);
  if (!verification.fixed) {
    throw new Error('Fix did not resolve the issue');
  }
  
  // Step 4: Check for regressions
  const regressions = await checkRegressions();
  if (regressions.length > 0) {
    throw new Error(`Fix caused ${regressions.length} regressions`);
  }
  
  // Step 5: Run full test suite
  const testResults = await runTestSuite();
  if (testResults.failed > 0) {
    throw new Error(`${testResults.failed} tests failed after fix`);
  }
  
  return {
    verified: true,
    testResults,
    regressions: []
  };
}
```

### Success Criteria
- 100% of fixes verified before completion
- Zero regressions introduced
- Full test suite passes after each fix
- Documentation of verification steps

### Integration Points
- Test execution framework
- Regression detection tools
- Issue tracking system

---

## Skill 3: MCP Memory Integration

### Description
Integrate agentmemory MCP tools for persistent context and hybrid search.

### MCP Tools

#### memory_search
Search memory with hybrid BM25 + vector search for 95%+ accuracy.

```javascript
{
  tool: 'memory_search',
  parameters: {
    query: 'search term',
    limit: 10,
    bm25Weight: 0.4,
    vectorWeight: 0.6
  }
}
```

#### memory_remember
Store information in persistent memory.

```javascript
{
  tool: 'memory_remember',
  parameters: {
    content: 'information to remember',
    metadata: {
      category: 'code',
      tags: ['function', 'utility']
    }
  }
}
```

#### memory_context
Get relevant context for current task.

```javascript
{
  tool: 'memory_context',
  parameters: {
    task: 'current task description',
    includeRecent: true,
    maxResults: 20
  }
}
```

#### memory_enrich
Enrich current context with related information.

```javascript
{
  tool: 'memory_enrich',
  parameters: {
    content: 'current code or context',
    enrichmentTypes: ['related_functions', 'known_bugs', 'patterns']
  }
}
```

### Implementation Pattern

```javascript
class MCPMemoryManager {
  constructor(mcpClient) {
    this.mcp = mcpClient;
  }
  
  async getContextForTask(task) {
    // Get relevant context
    const context = await this.mcp.call('memory_context', {
      task: task.description,
      includeRecent: true,
      maxResults: 20
    });
    
    // Enrich with related information
    const enriched = await this.mcp.call('memory_enrich', {
      content: context,
      enrichmentTypes: ['related_functions', 'known_bugs', 'patterns']
    });
    
    return enriched;
  }
  
  async searchMemory(query) {
    return await this.mcp.call('memory_search', {
      query,
      limit: 10,
      bm25Weight: 0.4,
      vectorWeight: 0.6
    });
  }
  
  async remember(content, metadata = {}) {
    return await this.mcp.call('memory_remember', {
      content,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
  }
}
```

### Success Criteria
- 95%+ retrieval accuracy
- 60% reduction in token usage
- Automatic context injection on session start
- Related file detection working

### Integration Points
- MCP server connection
- Session management
- Context injection hooks

---

## Skill 4: Tool Calling Standardization

### Description
Standardize tool calling with type-safe parameters using Zod validation.

### Pattern

#### Tool Definition with Zod Schema

```javascript
import { z } from 'zod';

const TOOL_SCHEMAS = {
  web_fetch: z.object({
    url: z.string().url(),
    maxChars: z.number().max(10000).optional().default(2000)
  }),
  
  send_email: z.object({
    to: z.string().email(),
    subject: z.string().min(1).max(200),
    body: z.string().min(1).max(10000)
  }),
  
  codegraph_query: z.object({
    query: z.string().min(1),
    limit: z.number().max(100).optional().default(10)
  })
};

function validateToolCall(toolName, args) {
  const schema = TOOL_SCHEMAS[toolName];
  if (!schema) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  
  return schema.parse(args);
}
```

#### Tool Execution with Validation

```javascript
async function executeTool(toolName, args) {
  // Validate parameters
  const validatedArgs = validateToolCall(toolName, args);
  
  // Execute tool
  const result = await TOOL_REGISTRY[toolName](validatedArgs);
  
  return result;
}
```

### Benefits
- Type-safe parameters
- Automatic validation
- Better error messages
- Easier tool integration
- Consistent interface

### Success Criteria
- 100% of tools have Zod schemas
- All parameters validated before execution
- Clear error messages for invalid inputs
- Easy addition of new tools

### Integration Points
- Tool registry
- Parameter validation
- Error handling

---

## Phase 1 Summary

### Completed Components
1. **Error Recovery System** - Automatic research intervention after 3 failures
2. **Team Coordination Patterns** - Quality gates and escalation paths
3. **Success Metrics Framework** - Team performance tracking
4. **TDD Enforcement** - RED-GREEN-REFACTOR workflow
5. **Verification Before Completion** - Fix verification process
6. **MCP Memory Integration** - Persistent context with hybrid search
7. **Tool Calling Standardization** - Type-safe parameters with Zod

### Next Steps
- Phase 2: Core Enhancements (Hybrid Search, Subagent Development, Systematic Debugging)
- Phase 3: Workflow Improvements (Brainstorming, Planning, Smart Search)
- Phase 4: Advanced Features (Streaming, Solution Generation, Memory Slots)
- Phase 5: Optimization (Performance, Security, Documentation)

### Success Metrics
- Error recovery: 90%+ success rate
- TDD: 80%+ test coverage
- Memory: 95%+ retrieval accuracy
- Tools: 100% type-safe parameters
