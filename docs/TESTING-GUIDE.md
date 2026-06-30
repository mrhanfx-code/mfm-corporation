# Testing Guide for MFM Corporation

## Overview

This guide provides comprehensive instructions for testing the MFM Corporation codebase using Vitest. The test infrastructure is designed to ensure code quality, prevent regressions, and maintain system reliability.

## Test-Driven Development (TDD) Principles

### The TDD Cycle

1. **Red**: Write a failing test that defines the desired behavior
2. **Green**: Write the minimum code to make the test pass
3. **Refactor**: Improve the code while keeping tests green

### Why TDD?

- **Documentation**: Tests serve as living documentation of expected behavior
- **Regression Prevention**: Catches bugs early before they reach production
- **Design Feedback**: Writing tests first improves code design and modularity
- **Confidence**: Enables fearless refactoring and feature additions

## Test Structure

### Directory Organization

```
tests/
├── setup.js              # Shared test configuration and utilities
├── unit/                 # Unit tests for individual functions/modules
│   ├── orchestrator.test.js
│   ├── auth.test.js
│   └── d1-store.test.js
└── integration/         # Integration tests for API endpoints and workflows
    └── dashboard-api.test.js
```

### Test File Naming Convention

- Unit tests: `[module].test.js`
- Integration tests: `[feature]-api.test.js`
- E2E tests: `[workflow]-e2e.test.js`

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npm test orchestrator.test.js
```

### Run Tests Matching a Pattern

```bash
npm test -- --grep "authentication"
```

## Writing Tests

### Test Structure Template

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Specific Behavior', () => {
    it('should do X when Y', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **One Assertion Per Test**: Keep tests focused
3. **Descriptive Names**: Test names should describe the behavior
4. **Independent Tests**: Tests should not depend on each other
5. **Mock External Dependencies**: Use mocks for external services

### Mocking External Services

```javascript
// Mock Cloudflare Workers KV
const mockKV = {
  get: vi.fn().mockResolvedValue('value'),
  put: vi.fn()
};

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ data: 'test' })
});
```

## Coverage Requirements

### Minimum Thresholds

- **Critical Paths**: 40% minimum coverage
- **Unit Tests**: 80% minimum for core modules
- **Integration Tests**: 60% minimum for API endpoints

### Coverage Report

```bash
npm run test:coverage
```

View the HTML report at `coverage/index.html`.

### Critical Paths

The following modules are considered critical and must meet coverage thresholds:

- `src/core/orchestrator.js` - Intent classification and routing
- `src/core/jwt-auth.js` - Authentication and authorization
- `src/tools/d1-store.js` - Database operations
- `src/dashboard/dashboard-worker.js` - API endpoints

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- Pull requests to `main`, `master`, and `feature/*` branches
- Pushes to `main` and `master` branches

### Coverage Enforcement

The CI/CD pipeline enforces a 40% coverage threshold. PRs with coverage below this threshold will fail.

### Local Pre-Commit Check

Before pushing, run:

```bash
npm test
npm run test:coverage
```

## Adding New Tests

### When to Add Tests

- **New Features**: Write tests before implementing code (TDD)
- **Bug Fixes**: Write a test that reproduces the bug, then fix it
- **Refactoring**: Ensure existing tests still pass

### Steps to Add a Test

1. Create test file in appropriate directory
2. Write failing test for desired behavior
3. Implement code to make test pass
4. Refactor if needed
5. Run full test suite to ensure no regressions

### Example: Adding a Unit Test

```javascript
// tests/unit/new-feature.test.js
import { describe, it, expect } from 'vitest';
import { newFunction } from '../../src/modules/new-feature.js';

describe('newFunction', () => {
  it('should return correct result for valid input', () => {
    const result = newFunction('valid input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    const result = newFunction('');
    expect(result).toBeNull();
  });
});
```

## Troubleshooting

### Tests Fail Locally but Pass in CI

- Check environment variables are set correctly
- Ensure Node.js version matches CI (18+)
- Verify all dependencies are installed

### Coverage Not Generated

- Ensure `@vitest/coverage-v8` is installed
- Check vitest.config.js has coverage configuration
- Run with `npm run test:coverage` explicitly

### Mocks Not Working

- Clear mocks in `beforeEach`: `vi.clearAllMocks()`
- Restore mocks in `afterEach`: `vi.restoreAllMocks()`
- Verify mock is called before assertions

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [Cloudflare Workers Testing](https://developers.cloudflare.com/workers/testing/)
