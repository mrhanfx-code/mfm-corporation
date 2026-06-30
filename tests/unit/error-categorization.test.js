import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorCategorizationManager, ERROR_CATEGORIES } from '../../src/core/error-categorization.js';

describe('ErrorCategorizationManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    manager = new ErrorCategorizationManager(mockEnv);
    vi.clearAllMocks();
  });

  it('should categorize connectivity errors', () => {
    const error = new Error('Network timeout occurred');
    const categorization = manager.categorizeError(error);

    expect(categorization.category).toBe('connectivity');
    expect(categorization.severity).toBe('high');
    expect(categorization.priority).toBe('critical');
    expect(categorization.solutions).toBeDefined();
    expect(categorization.solutions.length).toBeGreaterThan(0);
  });

  it('should categorize authorization errors', () => {
    const error = new Error('Unauthorized access token');
    const categorization = manager.categorizeError(error);

    expect(categorization.category).toBe('authorization');
    expect(categorization.severity).toBe('critical');
    expect(categorization.priority).toBe('critical');
  });

  it('should categorize performance errors', () => {
    const error = new Error('Memory limit exceeded');
    const categorization = manager.categorizeError(error);

    expect(categorization.category).toBe('performance');
    expect(categorization.severity).toBe('medium');
    expect(categorization.priority).toBe('high');
  });

  it('should categorize dependency errors', () => {
    const error = new Error('Version conflict in package');
    const categorization = manager.categorizeError(error);

    expect(categorization.category).toBe('dependency');
    expect(categorization.severity).toBe('high');
    expect(categorization.priority).toBe('high');
  });

  it('should categorize syntax errors', () => {
    const error = new Error('Parse error in code');
    error.stack = '';
    const categorization = manager.categorizeError(error);

    expect(categorization.category).toBe('syntax');
    expect(categorization.severity).toBe('high');
    expect(categorization.priority).toBe('high');
  });

  it('should categorize resource errors', () => {
    const error = new Error('Disk space exceeded');
    const categorization = manager.categorizeError(error);

    expect(categorization.category).toBe('resource');
    expect(categorization.severity).toBe('medium');
    expect(categorization.priority).toBe('medium');
  });

  it('should categorize validation errors', () => {
    const error = new Error('Invalid input format');
    const categorization = manager.categorizeError(error);

    expect(categorization.category).toBe('validation');
    expect(categorization.severity).toBe('medium');
    expect(categorization.priority).toBe('medium');
  });

  it('should categorize concurrency errors', () => {
    const error = new Error('Deadlock detected in transaction');
    const categorization = manager.categorizeError(error);

    expect(categorization.category).toBe('concurrency');
    expect(categorization.severity).toBe('high');
    expect(categorization.priority).toBe('high');
  });

  it('should categorize data errors', () => {
    const error = new Error('Missing data in records');
    error.stack = '';
    const categorization = manager.categorizeError(error);

    expect(categorization.category).toBe('data');
    expect(categorization.severity).toBe('critical');
    expect(categorization.priority).toBe('critical');
  });

  it('should categorize external service errors', () => {
    const error = new Error('API service unavailable');
    const categorization = manager.categorizeError(error);

    expect(categorization.category).toBe('external');
    expect(categorization.severity).toBe('medium');
    expect(categorization.priority).toBe('medium');
  });

  it('should categorize unknown errors', () => {
    const error = new Error('Generic problem occurred');
    error.stack = '';
    const categorization = manager.categorizeError(error);

    expect(categorization.category).toBe('unknown');
  });

  it('should generate solution for error', async () => {
    const error = new Error('Network timeout occurred');
    const solution = await manager.generateSolution(error);

    expect(solution.category).toBe('connectivity');
    expect(solution.recommendedSolution).toBeDefined();
    expect(solution.alternativeSolutions).toBeDefined();
    expect(solution.rollbackPlan).toBeDefined();
    expect(solution.implementationSteps).toBeDefined();
    expect(solution.estimatedEffort).toBeDefined();
    expect(solution.successCriteria).toBeDefined();
  });

  it('should get implementation steps for category', () => {
    const steps = manager.getImplementationSteps('connectivity');

    expect(steps).toBeDefined();
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]).toContain('retry');
  });

  it('should get estimated effort for category', () => {
    const effort = manager.getEstimatedEffort('connectivity');

    expect(effort).toBeDefined();
    expect(effort).toContain('hour');
  });

  it('should get success criteria for category', () => {
    const criteria = manager.getSuccessCriteria('connectivity');

    expect(criteria).toBeDefined();
    expect(criteria.length).toBeGreaterThan(0);
  });

  it('should provide default steps for unknown category', () => {
    const steps = manager.getImplementationSteps('unknown');

    expect(steps).toBeDefined();
    expect(steps.length).toBe(3);
  });

  it('should provide default effort for unknown category', () => {
    const effort = manager.getEstimatedEffort('unknown');

    expect(effort).toBe('1-2 hours');
  });

  it('should provide default criteria for unknown category', () => {
    const criteria = manager.getSuccessCriteria('unknown');

    expect(criteria).toBeDefined();
    expect(criteria.length).toBe(3);
  });

  it('should track error statistics', async () => {
    await manager.generateSolution(new Error('Network timeout'));
    await manager.generateSolution(new Error('Permission denied'));
    await manager.generateSolution(new Error('Memory limit'));

    const stats = manager.getErrorStatistics();

    expect(stats.total).toBe(3);
    expect(stats.byCategory.connectivity).toBe(1);
    expect(stats.byCategory.authorization).toBe(1);
    expect(stats.byCategory.performance).toBe(1);
  });

  it('should get most common errors', async () => {
    await manager.generateSolution(new Error('Network timeout'));
    await manager.generateSolution(new Error('Connection failed'));
    await manager.generateSolution(new Error('Permission denied'));

    const common = manager.getMostCommonErrors(2);

    expect(common.length).toBe(2);
    expect(common[0].category).toBe('connectivity');
    expect(common[0].count).toBe(2);
  });

  it('should include context in solution', async () => {
    const error = new Error('Network timeout');
    const context = { userId: 'test-user', operation: 'api-call' };

    const solution = await manager.generateSolution(error, context);

    expect(solution.context).toEqual(context);
  });

  it('should have all required error categories', () => {
    const requiredCategories = [
      'connectivity',
      'authorization',
      'performance',
      'dependency',
      'syntax',
      'resource',
      'validation',
      'concurrency',
      'data',
      'external'
    ];

    for (const category of requiredCategories) {
      expect(ERROR_CATEGORIES[category]).toBeDefined();
      expect(ERROR_CATEGORIES[category].keywords).toBeDefined();
      expect(ERROR_CATEGORIES[category].solutions).toBeDefined();
      expect(ERROR_CATEGORIES[category].rollback).toBeDefined();
    }
  });

  it('should calculate confidence score', () => {
    const error = new Error('Network timeout connection failed');
    const categorization = manager.categorizeError(error);

    expect(categorization.confidence).toBeGreaterThan(0);
    expect(categorization.confidence).toBeLessThanOrEqual(1);
  });

  it('should include timestamp in categorization', () => {
    const error = new Error('Network timeout');
    const categorization = manager.categorizeError(error);

    expect(categorization.timestamp).toBeDefined();
  });

  it('should include timestamp in solution', async () => {
    const error = new Error('Network timeout');
    const solution = await manager.generateSolution(error);

    expect(solution.timestamp).toBeDefined();
  });
});
