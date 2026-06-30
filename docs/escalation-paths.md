# Escalation Paths for Blocked Tasks

**Project**: MFM Corporation
**Phase**: Phase 2 - Foundation
**Created**: 2026-05-30
**Owner**: Sage (Backend Engineer)

---

## Overview

Escalation paths define how blocked tasks move through the organization to resolution. This system ensures that blocked tasks are handled efficiently and reach the right decision-makers when needed.

## Escalation Levels

### Level 1: Team Lead

**When**: Task blocked within team for > 15 minutes

**Actions**:
- Team lead reviews the blockage
- Attempts local resolution
- Allocates additional resources if needed

**Escalation Trigger**: Blockage persists > 30 minutes

**Implementation**:
```javascript
class TeamLeadEscalation {
  async handleBlockedTask(task, blockage) {
    const resolution = await this.attemptLocalResolution(task, blockage);
    
    if (resolution.success) {
      return { level: 1, resolved: true, resolution };
    }
    
    // Check if escalation needed
    if (this.blockageDuration(blockage) > 30 * 60 * 1000) {
      return this.escalateToLevel2(task, blockage);
    }
    
    return { level: 1, resolved: false, reason: 'Awaiting resolution' };
  }
}
```

---

### Level 2: C-Level Executive

**When**: Task blocked for > 30 minutes, Level 1 failed

**Actions**:
- C-level executive reviews the blockage
- Cross-department coordination
- Resource reallocation
- Priority adjustment

**Escalation Trigger**: Blockage persists > 1 hour OR critical priority

**Implementation**:
```javascript
class CLevelEscalation {
  async handleBlockedTask(task, blockage) {
    const resolution = await this.coordinateCrossDepartment(task, blockage);
    
    if (resolution.success) {
      return { level: 2, resolved: true, resolution };
    }
    
    // Check if escalation needed
    if (this.blockageDuration(blockage) > 60 * 60 * 1000 || 
        task.priority === 'critical') {
      return this.escalateToLevel3(task, blockage);
    }
    
    return { level: 2, resolved: false, reason: 'Awaiting coordination' };
  }
}
```

---

### Level 3: General Manager

**When**: Task blocked for > 1 hour, Level 2 failed OR critical priority

**Actions**:
- General Manager reviews the blockage
- Strategic decision on task priority
- May pause, defer, or cancel task
- May allocate emergency resources

**Escalation Trigger**: Blockage persists > 2 hours OR strategic decision needed

**Implementation**:
```javascript
class GeneralManagerEscalation {
  async handleBlockedTask(task, blockage) {
    const decision = await this.makeStrategicDecision(task, blockage);
    
    return {
      level: 3,
      resolved: decision.resolved,
      decision: decision.action, // continue, pause, defer, cancel
      reason: decision.rationale
    };
  }
}
```

---

### Level 4: CEO Remy

**When**: Strategic decision needed, GM unable to resolve, OR executive decision required

**Actions**:
- CEO reviews the situation
- Makes final executive decision
- May override previous decisions
- May change project direction

**Escalation Trigger**: None (CEO is final escalation point)

**Implementation**:
```javascript
class CEOEscalation {
  async handleBlockedTask(task, blockage) {
    const decision = await this.makeExecutiveDecision(task, blockage);
    
    return {
      level: 4,
      resolved: decision.resolved,
      decision: decision.action,
      reason: decision.rationale,
      executiveOverride: decision.overrideGM
    };
  }
}
```

---

## Escalation Flow

```
Task Blocked
    ↓
Level 1: Team Lead (15 min threshold)
    ↓ (Unresolved after 30 min)
Level 2: C-Level Executive (30 min threshold)
    ↓ (Unresolved after 1 hour OR critical)
Level 3: General Manager (1 hour threshold)
    ↓ (Strategic decision needed)
Level 4: CEO Remy (Final decision)
```

## Escalation Triggers

**Time-Based Triggers**:
- Level 1 → Level 2: 30 minutes
- Level 2 → Level 3: 1 hour
- Level 3 → Level 4: 2 hours OR strategic need

**Priority-Based Triggers**:
- Critical tasks: Immediate escalation to Level 3
- High priority: Escalation to Level 2 after 15 minutes
- Medium priority: Standard time-based escalation
- Low priority: Escalation to Level 2 after 1 hour

**Blockage Type Triggers**:
- Resource shortage: Escalate to Level 2
- Technical blocker: Escalate to Level 2
- Strategic conflict: Escalate to Level 3
- Executive decision needed: Escalate to Level 4

## Escalation Actions

**At Each Level**:
1. **Assess**: Review blockage and context
2. **Attempt**: Try to resolve at current level
3. **Document**: Record actions taken
4. **Decide**: Escalate or resolve
5. **Notify**: Inform relevant stakeholders

**Resolution Actions**:
- **Continue**: Task proceeds with resolution
- **Pause**: Task paused pending external input
- **Defer**: Task deferred to later sprint
- **Cancel**: Task cancelled (no longer needed)
- **Redirect**: Task redirected to different team

## Escalation Metadata

**Each Escalation Includes**:
```typescript
interface EscalationMetadata {
  taskId: string;
  task: string;
  blockage: string;
  blockageType: 'resource' | 'technical' | 'strategic' | 'executive';
  currentLevel: number;
  previousLevel: number;
  escalatedAt: Date;
  escalatedBy: string;
  reason: string;
  actionsTaken: string[];
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}
```

## Escalation Analytics

**Metrics to Track**:
- Escalation rate by level
- Average time to resolution per level
- Blockage types by frequency
- Resolution success rate by level
- CEO override rate

**Target Metrics**:
- Level 1 resolution rate: 70%+
- Level 2 resolution rate: 20%+
- Level 3 resolution rate: 8%+
- Level 4 resolution rate: 2% (CEO decisions should be rare)
- Average resolution time: < 2 hours

## Integration Points

**Error Recovery System**:
- Escalation triggered after MAX_ATTEMPTS=3
- Research intervention precedes escalation
- Solution generation attempted before escalation

**Database**:
- D1 database (escalations table)
- database/schema.sql (escalation tracking schema)

**Monitoring**:
- dashboard/escalations.html (escalation analytics dashboard)
- Existing monitoring system integration

**Quality Gate System**:
- Gate failures trigger escalation
- Quality score below threshold → Level 2
- Security gate failure → Level 3

## Escalation Database Schema

```sql
CREATE TABLE IF NOT EXISTS escalations (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    task TEXT NOT NULL,
    blockage TEXT NOT NULL,
    blockage_type TEXT NOT NULL CHECK (blockage_type IN ('resource', 'technical', 'strategic', 'executive')),
    current_level INTEGER NOT NULL CHECK (current_level IN (1, 2, 3, 4)),
    previous_level INTEGER,
    escalated_at TIMESTAMP DEFAULT NOW(),
    escalated_by TEXT NOT NULL,
    reason TEXT NOT NULL,
    actions_taken TEXT NOT NULL DEFAULT '[]',
    resolution TEXT,
    resolved_at TIMESTAMP,
    resolved_by TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_escalations_task_id ON escalations(task_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_level ON escalations(current_level);
CREATE INDEX IF NOT EXISTS idx_escalations_escalated_at ON escalations(escalated_at);
```

## References

- Phase 2 Plan: plan/PROJECT-CORE-UPGRADE-PHASE-2.md
- Sprint 2 Plan: docs/sprint-2/plan.md
- Quality Gate System: docs/quality-gate-system.md
- Error Categories: docs/error-categories.md
- PROJECT_BRIEF.md: Team roles and escalation authority
