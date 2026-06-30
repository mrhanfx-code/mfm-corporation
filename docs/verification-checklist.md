# Verification Checklist for Cascade

**Project**: MFM Corporation
**Phase**: Phase 2 - Foundation
**Created**: 2026-05-30
**Owner**: Sage (Backend Engineer)

---

## Overview

This checklist must be completed before any fix or code change is marked as complete. It ensures quality, prevents regression, and maintains system stability.

## Required Checklist Items

### 1. Code Review
- [ ] **Peer review completed**: At least one team member has reviewed the code
- [ ] **Review comments addressed**: All review comments have been addressed
- [ ] **Code quality verified**: Code follows project standards and best practices
- [ ] **Style consistency**: Code follows existing style patterns

### 2. Tests Pass
- [ ] **Unit tests pass**: All unit tests pass (100% pass rate)
- [ ] **Integration tests pass**: All integration tests pass
- [ ] **E2E tests pass**: All E2E tests pass
- [ ] **No new test failures**: No previously passing tests now fail
- [ ] **Test coverage adequate**: New code has 80%+ test coverage

### 3. No Regressions
- [ ] **Error rate stable**: Error rate not increased by >5%
- [ ] **Response time stable**: Response time not increased by >100ms
- [ ] **Throughput stable**: Throughput not decreased by >10%
- [ ] **Functionality intact**: No existing functionality broken
- [ ] **Performance stable**: No performance degradation detected

### 4. Security Review
- [ ] **Security review completed**: Security implications reviewed
- [ ] **No new vulnerabilities**: No new security vulnerabilities introduced
- [ ] **Input validation**: All user inputs validated
- [ ] **Output sanitization**: All outputs properly sanitized
- [ ] **Authentication**: Authentication/authorization verified

## Optional Checklist Items

### 5. Documentation Updated
- [ ] **README updated**: README updated if behavior changed
- [ ] **API docs updated**: API documentation updated if API changed
- [ ] **Comments added**: Complex code has comments
- [ ] **Changelog updated**: Changelog entry added

### 6. Performance Check
- [ ] **Performance impact assessed**: Performance impact measured
- [ ] **Benchmarks run**: Benchmarks run for performance-critical code
- [ ] **Memory usage checked**: Memory usage not significantly increased
- [ ] **CPU usage checked**: CPU usage not significantly increased

## Checklist Integration

The checklist is integrated into the VerificationSystem class in `src/core/verification-system.js`:

```javascript
const VERIFICATION_CHECKLIST = {
  code_review: {
    description: 'Code review completed',
    required: true
  },
  tests_pass: {
    description: 'All tests pass',
    required: true
  },
  no_regressions: {
    description: 'No regressions detected',
    required: true
  },
  documentation_updated: {
    description: 'Documentation updated',
    required: false
  },
  security_review: {
    description: 'Security review completed',
    required: true
  },
  performance_check: {
    description: 'Performance impact assessed',
    required: false
  }
};
```

## Usage

### Starting Verification

```javascript
const verificationSystem = new VerificationSystem(env);
const verification = await verificationSystem.startVerification(taskId, fixDetails);
```

### Completing Checklist Items

```javascript
await verificationSystem.completeChecklistItem(
  verificationId,
  'code_review',
  true,
  'Reviewed by Sage, all comments addressed'
);
```

### Completing Verification

```javascript
const result = await verificationSystem.completeVerification(verificationId, overallResult);
// Returns { success: true, verification, duration }
```

## Verification Status

A verification can have the following statuses:

- **in_progress**: Verification is in progress
- **passed**: All required checklist items completed, no regressions
- **failed**: Required checklist items not completed or regressions detected

## Required vs Optional Items

**Required items** must be completed for verification to pass:
- code_review
- tests_pass
- no_regressions
- security_review

**Optional items** are recommended but not required:
- documentation_updated
- performance_check

## Regression Detection

The system automatically detects regressions by comparing baseline and current test results:

- **Test failure regression**: Previously passing test now fails
- **Missing test regression**: Test removed or not executed
- **Performance regression**: Test slowed down by >50%

## Rollback Mechanism

If verification fails, use the rollback mechanism:

```javascript
const snapshotId = await verificationSystem.createSnapshot(taskId, files);
// ... make changes ...
await verificationSystem.rollbackToSnapshot(snapshotId);
```

## References

- Verification Workflow: docs/verification-workflow.md
- Verification System: src/core/verification-system.js
- TDD Enforcement: src/core/tdd-enforcement.js
- Error Recovery: src/core/error-recovery.js
