# Error Categorization System

**Project**: MFM Corporation
**Phase**: Phase 2 - Foundation
**Created**: 2026-05-30
**Owner**: Sage (Backend Engineer)

---

## Overview

The error categorization system provides a structured framework for classifying and handling errors in the MFM Corporation AI automation system. This system enables compulsory research intervention triggers, solution generation, and error analytics.

## Error Categories

### 1. Syntax Errors

**Definition**: Errors related to code syntax, grammar, or structural issues in code generation or execution.

**Examples**:
- Invalid JavaScript syntax
- Missing semicolons or brackets
- Incorrect function signatures
- Malformed JSON/XML
- Template syntax errors

**Detection**:
- Linting tools (ESLint)
- Parser errors
- Syntax validation during code generation

**Recovery Strategy**:
- Automatic syntax correction using linter
- Regenerate code with corrected syntax
- Request user clarification for ambiguous syntax

**Severity**: High (prevents code execution)

---

### 2. Logic Errors

**Definition**: Errors related to incorrect algorithmic logic, flawed reasoning, or incorrect business logic implementation.

**Examples**:
- Incorrect conditional logic
- Wrong loop iterations
- Flawed algorithm implementation
- Incorrect business rule application
- Logic contradictions

**Detection**:
- Test failures
- Unexpected output
- Behavioral inconsistencies
- User-reported incorrect behavior

**Recovery Strategy**:
- Analyze test cases to identify logic flaw
- Request additional context or requirements
- Regenerate with corrected logic
- Human review for complex logic errors

**Severity**: High (produces incorrect results)

---

### 3. Runtime Errors

**Definition**: Errors that occur during program execution, including exceptions, crashes, and unexpected runtime behavior.

**Examples**:
- Null reference errors
- Type errors
- Out of bounds errors
- Stack overflow
- Memory allocation failures

**Detection**:
- Exception handlers
- Runtime error logging
- Crash reports
- Monitoring alerts

**Recovery Strategy**:
- Add null checks and validation
- Implement error boundaries
- Add retry logic for transient errors
- Fallback to safe default behavior

**Severity**: Critical (causes system failure)

---

### 4. Network Errors

**Definition**: Errors related to network connectivity, API failures, timeout issues, or communication problems.

**Examples**:
- Connection timeout
- DNS resolution failure
- API rate limiting
- HTTP 5xx errors
- Network unreachable

**Detection**:
- Network monitoring
- API response codes
- Timeout handlers
- Connection state tracking

**Recovery Strategy**:
- Implement exponential backoff retry
- Add circuit breaker pattern
- Cache responses for offline scenarios
- Fallback to alternative endpoints

**Severity**: Medium (affects external integrations)

---

### 5. Data Errors

**Definition**: Errors related to data integrity, validation failures, format issues, or data consistency problems.

**Examples**:
- Invalid data format
- Missing required fields
- Data type mismatch
- Constraint violations
- Duplicate data

**Detection**:
- Schema validation (Zod)
- Database constraints
- Data validation rules
- Integrity checks

**Recovery Strategy**:
- Validate data before processing
- Provide clear error messages for invalid data
- Request corrected data from user
- Implement data sanitization

**Severity**: Medium (affects data quality)

---

### 6. External Errors

**Definition**: Errors caused by external dependencies, third-party services, or environmental factors outside system control.

**Examples**:
- Third-party API downtime
- Service dependency failures
- Environment configuration issues
- External service rate limits
- Third-party service changes

**Detection**:
- External service health checks
- Dependency monitoring
- Configuration validation
- Service status APIs

**Recovery Strategy**:
- Implement graceful degradation
- Add service health monitoring
- Provide fallback functionality
- Alert on external service issues

**Severity**: Variable (depends on criticality of external service)

---

## Error Classification Flow

```
Error Occurred
    ↓
Categorize Error (6 categories)
    ↓
Determine Severity (Critical/High/Medium/Low)
    ↓
Apply Recovery Strategy
    ↓
Log Error to D1 Database
    ↓
Trigger Compulsory Research Intervention (if needed)
    ↓
Generate Solution
    ↓
Implement Fix
    ↓
Verify Resolution
```

## Error Metadata Schema

Each error should include the following metadata:

```typescript
interface ErrorMetadata {
  id: string;                    // Unique error identifier
  category: ErrorCategory;      // One of 6 categories
  severity: ErrorSeverity;       // Critical/High/Medium/Low
  timestamp: Date;               // When error occurred
  context: string;              // Context where error occurred
  stackTrace?: string;          // Stack trace if available
  agent?: string;               // Agent that caused error
  tool?: string;                // Tool that caused error
  recoveryAttempted: boolean;   // Whether recovery was attempted
  recoverySuccessful: boolean;  // Whether recovery succeeded
  solution?: string;            // Solution applied
  resolved: boolean;            // Whether error is resolved
}
```

## Error Analytics

**Metrics to Track**:
- Error frequency by category
- Error resolution time by category
- Error recurrence rate
- Agent-specific error rates
- Tool-specific error rates
- Recovery success rate by category

**Target Metrics**:
- Overall error recovery success rate: 90%+
- Critical error resolution time: < 5 minutes
- High error resolution time: < 15 minutes
- Medium error resolution time: < 1 hour
- Low error resolution time: < 4 hours

## Integration Points

**Error Recovery System**:
- src/core/error-recovery.js (compulsory research intervention trigger)
- src/core/solution-generation.js (solution generation framework)

**Database**:
- D1 database (error logging and analytics)
- database/schema.sql (error tracking schema)

**Monitoring**:
- dashboard/error-analytics.html (error analytics dashboard)
- Existing monitoring system integration

## References

- Phase 2 Plan: plan/PROJECT-CORE-UPGRADE-PHASE-2.md
- Sprint 2 Plan: docs/sprint-2/plan.md
- Superpowers Configuration: .windsurf/skills/superpowers-config.md
- Debugging Protocol: docs/development/debugging-protocol.md
