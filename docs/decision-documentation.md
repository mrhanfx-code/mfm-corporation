# Decision Documentation System

**Project**: MFM Corporation
**Phase**: Phase 2 - Foundation
**Created**: 2026-05-30
**Owner**: Sage (Backend Engineer)

---

## Overview

The decision documentation system captures and stores agent decisions with reasoning, confidence scores, and context. This system enables decision tracking, analysis, and learning across the MFM Corporation agent framework.

## Implementation Status

**Status**: ✅ Already Implemented

**Location**: `src/tools/d1-store.js` (lines 139-145)

**Function**: `logDecision(agent, input, reasoning, decision, confidence, env)`

## Decision Logging Function

```javascript
export async function logDecision(agent, input, reasoning, decision, confidence, env) {
  if (!env.db) return;
  const id = uid();
  await env.db.prepare(
    'INSERT INTO decisions (id, agent, input, reasoning, decision, confidence) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, agent, input, reasoning, decision, confidence).run();
}
```

**Parameters**:
- `agent`: Agent name making the decision
- `input`: Input/task that triggered the decision
- `reasoning`: Reasoning behind the decision
- `decision`: The decision made
- `confidence`: Confidence score (0-100)
- `env`: Environment context with D1 database

## Database Schema

**Table**: `decisions`

**Schema** (from database/schema.sql):
```sql
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent TEXT NOT NULL,
    input TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    decision TEXT NOT NULL,
    confidence DECIMAL(5,2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `idx_decisions_agent`: Agent-based queries
- `idx_decisions_created_at`: Time-based queries
- `idx_decisions_confidence`: Confidence-based filtering

## Decision Metadata

**Each Decision Includes**:
```typescript
interface DecisionMetadata {
  id: string;              // Unique decision identifier
  agent: string;           // Agent who made the decision
  input: string;           // Input/task context
  reasoning: string;       // Reasoning process
  decision: string;        // Final decision
  confidence: number;      // Confidence score (0-100)
  createdAt: Date;         // Timestamp
}
```

## Decision Categories

**Types of Decisions**:
1. **Routing Decisions**: Which agent handles a task
2. **Quality Decisions**: Accept/reject work based on quality score
3. **Escalation Decisions**: When to escalate blocked tasks
4. **Priority Decisions**: Task priority adjustments
5. **Resource Decisions**: Resource allocation
6. **Strategic Decisions**: High-level strategic choices

## Decision Analytics

**Metrics to Track**:
- Decision volume by agent
- Average confidence score by agent
- Decision patterns by category
- Decision success rate
- Decision reversal rate

**Target Metrics**:
- Average confidence score: 80%+
- Decision success rate: 90%+
- Decision reversal rate: < 5%

## Decision Query Patterns

**Get Recent Decisions by Agent**:
```sql
SELECT * FROM decisions 
WHERE agent = ? 
ORDER BY created_at DESC 
LIMIT 20
```

**Get High-Confidence Decisions**:
```sql
SELECT * FROM decisions 
WHERE confidence >= 80 
ORDER BY created_at DESC 
LIMIT 50
```

**Get Decisions by Category**:
```sql
SELECT * FROM decisions 
WHERE decision LIKE '%routing%' 
ORDER BY created_at DESC
```

**Get Decision Statistics**:
```sql
SELECT 
  agent,
  COUNT(*) as total_decisions,
  AVG(confidence) as avg_confidence,
  COUNT(CASE WHEN confidence >= 80 THEN 1 END) as high_confidence
FROM decisions
GROUP BY agent
```

## Integration Points

**Agent System**:
- Agents call `logDecision()` after making decisions
- Integrated into `src/core/agent-base.js`

**Error Recovery System**:
- Research intervention decisions logged
- Solution application decisions tracked

**Quality Gate System**:
- Gate pass/fail decisions logged
- Quality score decisions documented

**Escalation System**:
- Escalation decisions logged with reasoning
- Level assignment decisions tracked

## Decision Dashboard

**Location**: `dashboard/decisions.html` (to be created)

**Features**:
- Real-time decision feed
- Decision volume by agent
- Confidence score trends
- Decision category breakdown
- Decision success rate tracking

## Decision Review Process

**Weekly Review**:
1. Review high-impact decisions
2. Analyze low-confidence decisions
3. Identify decision patterns
4. Update decision guidelines
5. Document lessons learned

**Decision Audit**:
- Random sample of decisions reviewed
- Verify reasoning quality
- Check confidence score accuracy
- Validate decision outcomes

## References

- Phase 2 Plan: plan/PROJECT-CORE-UPGRADE-PHASE-2.md
- Sprint 2 Plan: docs/sprint-2/plan.md
- D1 Store: src/tools/d1-store.js
- Database Schema: database/schema.sql
