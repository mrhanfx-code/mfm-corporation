# Quality Gate System

**Project**: MFM Corporation
**Phase**: Phase 2 - Foundation
**Created**: 2026-05-30
**Owner**: Sage (Backend Engineer)

---

## Overview

The quality gate system enforces quality standards between teams in the MFM Corporation agent framework. It ensures that work passing from one team to another meets defined quality criteria before proceeding to the next stage.

## Quality Gates

### Gate 1: Input Validation Gate

**Location**: Before team accepts a task from CEO or another team

**Criteria**:
- Task description is clear and unambiguous
- Required inputs are available (files, data, context)
- Dependencies are satisfied
- Deadline is realistic

**Pass Condition**: All criteria met

**Fail Action**: Return task to source with clarification request

**Implementation**:
```javascript
class InputValidationGate {
  validate(task) {
    const checks = [
      this.validateTaskDescription(task),
      this.validateInputs(task),
      this.validateDependencies(task),
      this.validateDeadline(task)
    ];
    
    return {
      passed: checks.every(c => c.passed),
      failures: checks.filter(c => !c.passed),
      warnings: checks.filter(c => c.warning)
    };
  }
}
```

---

### Gate 2: Quality Score Gate

**Location**: After team completes work, before submission

**Criteria**:
- Quality score >= 85% (configurable threshold)
- No critical errors
- High-severity issues resolved

**Pass Condition**: Quality score >= threshold

**Fail Action**: Team must redo work to meet threshold

**Implementation**:
```javascript
class QualityScoreGate {
  validate(work, threshold = 85) {
    const qualityScore = this.calculateQualityScore(work);
    
    return {
      passed: qualityScore >= threshold,
      score: qualityScore,
      threshold,
      gap: threshold - qualityScore,
      requiresRedo: qualityScore < threshold
    };
  }
  
  calculateQualityScore(work) {
    // Score based on:
    // - Accuracy (40%)
    // - Completeness (30%)
    // - Clarity (20%)
    // - Timeliness (10%)
    return this.calculateScore(work);
  }
}
```

---

### Gate 3: Cross-Team Review Gate

**Location**: Before work passes to dependent team

**Criteria**:
- Dependent team reviews and approves
- No blocking issues identified
- Integration points validated

**Pass Condition**: Dependent team approval

**Fail Action**: Return to source team for fixes

**Implementation**:
```javascript
class CrossTeamReviewGate {
  async validate(work, dependentTeam) {
    const review = await dependentTeam.review(work);
    
    return {
      passed: review.approved,
      reviewer: dependentTeam.name,
      feedback: review.feedback,
      blockingIssues: review.blockingIssues,
      approvalTimestamp: review.timestamp
    };
  }
}
```

---

### Gate 4: Security Gate

**Location**: Before any work involving sensitive data or external integrations

**Criteria**:
- No hardcoded secrets
- Input validation implemented
- Output sanitization applied
- Authentication/authorization verified

**Pass Condition**: All security checks pass

**Fail Action**: Block and require security fixes

**Implementation**:
```javascript
class SecurityGate {
  validate(work) {
    const checks = [
      this.checkForSecrets(work),
      this.checkInputValidation(work),
      this.checkOutputSanitization(work),
      this.checkAuth(work)
    ];
    
    return {
      passed: checks.every(c => c.passed),
      securityIssues: checks.filter(c => !c.passed),
      severity: this.calculateSeverity(checks)
    };
  }
}
```

---

### Gate 5: Testing Gate

**Location**: Before work is marked complete

**Criteria**:
- Unit tests pass (100%)
- Integration tests pass (100%)
- Test coverage >= 80%
- No flaky tests

**Pass Condition**: All test criteria met

**Fail Action**: Fix tests or add missing tests

**Implementation**:
```javascript
class TestingGate {
  async validate(work) {
    const testResults = await this.runTests(work);
    
    return {
      passed: testResults.unit.passed && 
              testResults.integration.passed &&
              testResults.coverage >= 80,
      unitTests: testResults.unit,
      integrationTests: testResults.integration,
      coverage: testResults.coverage,
      flakyTests: testResults.flaky
    };
  }
}
```

---

## Gate Execution Flow

```
Task Received
    ↓
Gate 1: Input Validation
    ↓ (Pass)
Work in Progress
    ↓
Gate 2: Quality Score
    ↓ (Pass)
Gate 3: Cross-Team Review (if dependent team exists)
    ↓ (Pass)
Gate 4: Security (if applicable)
    ↓ (Pass)
Gate 5: Testing (if applicable)
    ↓ (Pass)
Task Complete
```

## Gate Configuration

**Thresholds** (configurable per team):
- Quality Score: 85% (default)
- Test Coverage: 80% (default)
- Security Severity: Block on critical/high

**Team-Specific Overrides**:
```javascript
const gateConfig = {
  'Development Team': {
    qualityThreshold: 90,
    testCoverage: 85,
    securityRequired: true
  },
  'Marketing Team': {
    qualityThreshold: 80,
    testCoverage: 0,
    securityRequired: false
  },
  'Security Operations Team': {
    qualityThreshold: 95,
    testCoverage: 90,
    securityRequired: true
  }
};
```

## Gate Failure Handling

**Retry Policy**:
- Max 3 retries per gate
- Exponential backoff between retries
- Escalation to General Manager after 3 failures

**Escalation Path**:
```
Gate Failure
    ↓
Retry (up to 3 times)
    ↓ (Still failing)
Escalate to General Manager
    ↓
GM review and decision
    ↓
Override or require redo
```

## Gate Analytics

**Metrics to Track**:
- Gate pass rate by team
- Gate failure reasons
- Average time per gate
- Escalation rate
- Quality score trends

**Target Metrics**:
- Overall gate pass rate: 90%+
- Average gate time: < 5 minutes
- Escalation rate: < 5%

## Integration Points

**Error Recovery System**:
- Gate failures trigger error recovery
- Research intervention for repeated failures
- Solution generation for common failures

**Database**:
- D1 database (gate_logs table)
- database/schema.sql (gate tracking schema)

**Monitoring**:
- dashboard/quality-gates.html (gate analytics dashboard)
- Existing monitoring system integration

## References

- Phase 2 Plan: plan/PROJECT-CORE-UPGRADE-PHASE-2.md
- Sprint 2 Plan: docs/sprint-2/plan.md
- Error Categories: docs/error-categories.md
- Debugging Protocol: docs/development/debugging-protocol.md
