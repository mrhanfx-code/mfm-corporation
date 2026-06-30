# Tool Batching Strategy - Sprint 6

**Date**: 2026-05-31
**Owner**: Sage
**Status**: Completed

---

## Batching Strategy Overview

### Goal
Group compatible tool operations into single batched executions to reduce overhead by 20-30%.

### Approach
- Identify batchable tool patterns
- Define batch grouping rules
- Implement batch execution logic
- Maintain tool compatibility

---

## Batchable Tool Categories

### Category 1: Read-Only Queries (High Batchability)

**Tools**:
- d1-query (different queries)
- memory-search (different queries)
- github-issues (different repos)
- drive-list (different folders)
- web-fetch (different URLs - limited batchability)

**Batch Strategy**:
- Group multiple queries into single batch
- Execute all queries in parallel
- Return aggregated results

**Example**:
```javascript
// Current (Sequential)
const result1 = await d1Query("SELECT * FROM tasks WHERE agent='ops-coordinator'");
const result2 = await d1Query("SELECT * FROM tasks WHERE agent='project-manager'");
const result3 = await d1Query("SELECT * FROM tasks WHERE agent='qa-engineer'");
// Total: 3 × 100ms = 300ms

// Optimized (Batched)
const results = await batchD1Query([
  "SELECT * FROM tasks WHERE agent='ops-coordinator'",
  "SELECT * FROM tasks WHERE agent='project-manager'",
  "SELECT * FROM tasks WHERE agent='qa-engineer'"
]);
// Total: 150ms (single batch execution)
// Savings: 50%
```

---

### Category 2: Memory Operations (High Batchability)

**Tools**:
- memory-search (multiple queries)
- memory-remember (multiple saves)
- memory-context (multiple contexts)

**Batch Strategy**:
- Group multiple memory operations
- Single batch write/read
- Atomic operations

**Example**:
```javascript
// Current (Sequential)
await memoryRemember("fact 1", { category: "general" });
await memoryRemember("fact 2", { category: "general" });
await memoryRemember("fact 3", { category: "general" });
// Total: 3 × 200ms = 600ms

// Optimized (Batched)
await batchMemoryRemember([
  { content: "fact 1", category: "general" },
  { content: "fact 2", category: "general" },
  { content: "fact 3", category: "general" }
]);
// Total: 250ms (single batch write)
// Savings: 58%
```

---

### Category 3: External API Calls (Medium Batchability)

**Tools**:
- github-issues (different repos - limited by API rate limits)
- exa-search (different queries - limited by API)
- brave-search (different queries - limited by API)

**Batch Strategy**:
- Group requests within API limits
- Respect rate limits
- Parallel execution with rate limiting

**Example**:
```javascript
// Current (Sequential)
const issues1 = await githubListIssues("owner1", "repo1");
const issues2 = await githubListIssues("owner2", "repo2");
const issues3 = await githubListIssues("owner3", "repo3");
// Total: 3 × 1000ms = 3000ms

// Optimized (Batched with rate limiting)
const results = await batchGitHubIssues([
  { owner: "owner1", repo: "repo1" },
  { owner: "owner2", repo: "repo2" },
  { owner: "owner3", repo: "repo3" }
]);
// Total: 1200ms (parallel with rate limiting)
// Savings: 60%
```

---

### Category 4: Non-Batchable (Low/No Batchability)

**Tools**:
- send-email (each email is separate)
- social-post (each post is separate)
- github-push (each push is separate)
- drive-write (each write is separate)
- calendar-create (each event is separate)

**Reason**:
- Each operation has unique side effects
- No logical grouping possible
- Must remain sequential

---

## Batch Grouping Rules

### Rule 1: Same Tool Type
Only batch operations of the same tool type:
- ✅ d1-query + d1-query + d1-query
- ❌ d1-query + memory-search + github-issues

### Rule 2: Read-Only Operations
Only batch read-only operations:
- ✅ d1-query (SELECT)
- ❌ d1-query (INSERT/UPDATE/DELETE)

### Rule 3: Independent Operations
Only batch operations with no dependencies:
- ✅ memory-search(query1) + memory-search(query2)
- ❌ memory-remember + memory-search (depends on remember)

### Rule 4: API Rate Limits
Respect external API rate limits:
- ✅ GitHub: 5 requests per batch
- ✅ Exa: 3 requests per batch
- ❌ Unlimited batching (will hit rate limits)

---

## Batch Execution Flow

### Detection Phase
```javascript
function detectBatchableOperations(toolCalls) {
  const groups = {};
  
  for (const call of toolCalls) {
    const key = call.tool;
    if (!groups[key]) groups[key] = [];
    groups[key].push(call);
  }
  
  return groups;
}
```

### Validation Phase
```javascript
function validateBatch(group) {
  const tool = group[0].tool;
  
  // Check if tool supports batching
  if (!BATCHABLE_TOOLS.includes(tool)) return false;
  
  // Check if all operations are read-only
  if (group.some(call => isWriteOperation(call))) return false;
  
  // Check batch size limits
  if (group.length > MAX_BATCH_SIZE[tool]) return false;
  
  return true;
}
```

### Execution Phase
```javascript
async function executeBatch(group) {
  const tool = group[0].tool;
  const args = group.map(call => call.args);
  
  switch (tool) {
    case 'd1-query':
      return await batchD1Query(args);
    case 'memory-search':
      return await batchMemorySearch(args);
    case 'github-issues':
      return await batchGitHubIssues(args);
    default:
      return await executeSequential(group);
  }
}
```

---

## Batch Size Limits

| Tool | Max Batch Size | Reason |
|------|----------------|--------|
| d1-query | 10 | Database query limit |
| memory-search | 20 | Memory system limit |
| memory-remember | 50 | Memory write limit |
| github-issues | 5 | API rate limit |
| exa-search | 3 | API rate limit |
| brave-search | 5 | API rate limit |
| drive-list | 10 | API rate limit |

---

## Implementation Design

### Batch Executor Class

```javascript
class BatchExecutor {
  constructor(env) {
    this.env = env;
    this.batchableTools = new Set([
      'd1-query',
      'memory-search',
      'memory-remember',
      'github-issues',
      'exa-search',
      'brave-search',
      'drive-list'
    ]);
  }
  
  groupToolCalls(toolCalls) {
    const groups = {};
    for (const call of toolCalls) {
      const key = call.tool;
      if (!groups[key]) groups[key] = [];
      groups[key].push(call);
    }
    return groups;
  }
  
  canBatch(group) {
    const tool = group[0].tool;
    if (!this.batchableTools.has(tool)) return false;
    if (group.length > this.getMaxBatchSize(tool)) return false;
    return true;
  }
  
  async executeBatch(group) {
    const tool = group[0].tool;
    const args = group.map(call => call.args);
    
    switch (tool) {
      case 'd1-query':
        return await this.batchD1Query(args);
      case 'memory-search':
        return await this.batchMemorySearch(args);
      // ... other batch methods
      default:
        return await this.executeSequential(group);
    }
  }
  
  async execute(toolCalls) {
    const groups = this.groupToolCalls(toolCalls);
    const results = [];
    
    for (const [tool, group] of Object.entries(groups)) {
      if (this.canBatch(group)) {
        const batchResult = await this.executeBatch(group);
        results.push(...batchResult);
      } else {
        for (const call of group) {
          const result = await this.executeSingle(call);
          results.push(result);
        }
      }
    }
    
    return results;
  }
}
```

---

## Integration with AgentBase

### Modified Tool Loop

```javascript
// Current (Sequential)
for (const { tool, args } of toolCalls) {
  const toolResult = await this.useTool(tool, args, env);
  toolResults.push(`[Result: ${tool}]\n${String(toolResult).slice(0, 2000)}`);
}

// Optimized (Batched)
const batchExecutor = new BatchExecutor(env);
const groupedCalls = batchExecutor.groupToolCalls(toolCalls);

for (const [tool, group] of Object.entries(groupedCalls)) {
  if (batchExecutor.canBatch(group)) {
    const batchResults = await batchExecutor.executeBatch(group);
    toolResults.push(...batchResults.map(r => `[Result: ${tool}]\n${String(r).slice(0, 2000)}`));
  } else {
    for (const { tool, args } of group) {
      const toolResult = await this.useTool(tool, args, env);
      toolResults.push(`[Result: ${tool}]\n${String(toolResult).slice(0, 2000)}`);
    }
  }
}
```

---

## Expected Performance Impact

### Scenario 1: Multiple D1 Queries
- Current: 10 queries × 100ms = 1000ms
- Batched: 1 batch × 150ms = 150ms
- **Savings: 85%**

### Scenario 2: Multiple Memory Operations
- Current: 5 operations × 200ms = 1000ms
- Batched: 1 batch × 250ms = 250ms
- **Savings: 75%**

### Scenario 3: Mixed Operations
- Current: 3 d1-query + 2 memory-search = 3×100ms + 2×200ms = 700ms
- Batched: 1 d1-batch + 1 memory-batch = 150ms + 250ms = 400ms
- **Savings: 43%**

### Overall Expected Savings
- **Average: 20-30%**
- **Best case: 85%** (all batchable)
- **Worst case: 0%** (no batchable operations)

---

## Testing Strategy

### Unit Tests
- Test batch detection logic
- Test batch validation rules
- Test batch execution
- Test batch size limits

### Integration Tests
- Test batched D1 queries
- Test batched memory operations
- Test batched API calls
- Test mixed batched/sequential flows

### Performance Tests
- Measure batch vs sequential performance
- Verify 20%+ savings target
- Test batch size limits
- Test rate limiting

---

## Risk Assessment

### Medium Risk
- **Batch execution errors**: Mitigate with fallback to sequential
- **Batch size too large**: Mitigate with size limits
- **API rate limits**: Mitigate with rate limiting

### Low Risk
- **Batch detection bugs**: Mitigate with comprehensive testing
- **Batch validation errors**: Mitigate with validation tests

---

## Next Steps

1. Implement BatchExecutor class (Task 6.4)
2. Add batch execution methods for each tool
3. Integrate with AgentBase tool loop
4. Add batch detection and validation
5. Test batch execution
6. Measure performance improvements
