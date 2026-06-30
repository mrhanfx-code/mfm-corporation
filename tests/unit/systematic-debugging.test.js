import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SystematicDebuggingManager } from '../../src/core/systematic-debugging.js';

describe('SystematicDebuggingManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    manager = new SystematicDebuggingManager(mockEnv);
    vi.clearAllMocks();
  });

  it('should capture error in Phase 1', async () => {
    const error = new Error('Network timeout occurred');
    const context = { userId: 'test-user', operation: 'api-call' };

    const session = await manager.captureError(error, context);

    expect(session).toBeDefined();
    expect(session.phase).toBe('capture');
    expect(session.error.message).toBe('Network timeout occurred');
    expect(session.phases.capture.completed).toBe(true);
    expect(session.phases.analyze.completed).toBe(false);
    expect(session.phases.hypothesize.completed).toBe(false);
    expect(session.phases.verify.completed).toBe(false);
  });

  it('should classify error type correctly', () => {
    const networkError = new Error('Network connection failed');
    const authError = new Error('Permission denied');
    const resourceError = new Error('Memory limit exceeded');
    const syntaxError = new Error('Invalid syntax');
    const referenceError = new Error('Variable not found');

    expect(manager.classifyError(networkError)).toBe('connectivity');
    expect(manager.classifyError(authError)).toBe('authorization');
    expect(manager.classifyError(resourceError)).toBe('resource');
    expect(manager.classifyError(syntaxError)).toBe('syntax');
    expect(manager.classifyError(referenceError)).toBe('reference');
  });

  it('should assess error severity correctly', () => {
    const criticalError = new Error('Critical security breach');
    const highError = new Error('Operation failed');
    const mediumError = new Error('Deprecated feature used');
    const lowError = new Error('Minor issue');

    expect(manager.assessSeverity(criticalError)).toBe('critical');
    expect(manager.assessSeverity(highError)).toBe('high');
    expect(manager.assessSeverity(mediumError)).toBe('medium');
    expect(manager.assessSeverity(lowError)).toBe('low');
  });

  it('should analyze error in Phase 2', async () => {
    const error = new Error('Network timeout occurred');
    const session = await manager.captureError(error);

    const analysis = await manager.analyzeError(session.id);

    expect(analysis).toBeDefined();
    expect(analysis.patterns).toBeDefined();
    expect(analysis.rootCauseCandidates).toBeDefined();
    expect(analysis.rootCauseCandidates.length).toBeGreaterThan(0);
    expect(session.phases.analyze.completed).toBe(true);
  });

  it('should identify error patterns', () => {
    const error = new Error('timeout');
    error.stack = 'Error: timeout\n    at async function (node_modules/test.js:10:5)';

    const patterns = manager.identifyPatterns(error);

    expect(patterns).toContain('timeout_pattern');
    expect(patterns).toContain('dependency_issue');
  });

  it('should generate root cause candidates', () => {
    const session = {
      phases: {
        capture: {
          data: { errorType: 'connectivity' }
        }
      }
    };

    const analysis = {
      patterns: ['timeout_pattern']
    };

    const candidates = manager.generateRootCauseCandidates(session, analysis);

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].cause).toBeDefined();
    expect(candidates[0].likelihood).toBeGreaterThan(0);
    expect(candidates[0].evidence).toBeDefined();
  });

  it('should hypothesize solution in Phase 3', async () => {
    const error = new Error('Network timeout occurred');
    const session = await manager.captureError(error);
    await manager.analyzeError(session.id);

    const hypothesis = await manager.hypothesizeSolution(session.id);

    expect(hypothesis).toBeDefined();
    expect(hypothesis.rootCause).toBeDefined();
    expect(hypothesis.solution).toBeDefined();
    expect(hypothesis.implementationSteps).toBeDefined();
    expect(hypothesis.verificationCriteria).toBeDefined();
    expect(session.phases.hypothesize.completed).toBe(true);
  });

  it('should generate solution for root cause', () => {
    const solution = manager.generateSolution('Network connectivity issue');
    expect(solution).toContain('retry');
  });

  it('should get implementation steps for root cause', () => {
    const steps = manager.getImplementationSteps('Network connectivity issue');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]).toContain('retry');
  });

  it('should get verification criteria for root cause', () => {
    const criteria = manager.getVerificationCriteria('Network connectivity issue');
    expect(criteria.length).toBeGreaterThan(0);
    expect(criteria[0]).toContain('timeout');
  });

  it('should verify solution in Phase 4', async () => {
    const error = new Error('Network timeout occurred');
    const session = await manager.captureError(error);
    await manager.analyzeError(session.id);
    await manager.hypothesizeSolution(session.id);

    const implementationResult = { success: true };
    const verification = await manager.verifySolution(session.id, implementationResult);

    expect(verification).toBeDefined();
    expect(verification.implemented).toBe(true);
    expect(verification.criteria).toBeDefined();
    expect(verification.passed).toBeDefined();
    expect(verification.overallPassed).toBe(true);
    expect(session.phases.verify.completed).toBe(true);
    expect(session.status).toBe('resolved');
  });

  it('should handle failed verification', async () => {
    const error = new Error('Network timeout occurred');
    const session = await manager.captureError(error);
    await manager.analyzeError(session.id);
    await manager.hypothesizeSolution(session.id);

    const implementationResult = { success: false };
    const verification = await manager.verifySolution(session.id, implementationResult);

    expect(verification.implemented).toBe(false);
    expect(verification.overallPassed).toBe(false);
    expect(session.status).toBe('verification_failed');
  });

  it('should get session by ID', async () => {
    const error = new Error('Test error');
    const session = await manager.captureError(error);

    const retrieved = manager.getSession(session.id);
    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(session.id);
  });

  it('should get all sessions', async () => {
    const error1 = new Error('Error 1');
    const error2 = new Error('Error 2');

    await manager.captureError(error1);
    await manager.captureError(error2);

    const sessions = manager.getAllSessions();
    expect(sessions.length).toBe(2);
  });

  it('should throw error for non-existent session', async () => {
    await expect(manager.analyzeError('non-existent')).rejects.toThrow();
  });

  it('should handle unknown error type', () => {
    const error = new Error('Unknown issue');
    const classification = manager.classifyError(error);
    expect(classification).toBe('unknown');
  });

  it('should provide default solution for unknown cause', () => {
    const solution = manager.generateSolution('Unknown cause');
    expect(solution).toContain('error handling');
  });

  it('should provide default steps for unknown cause', () => {
    const steps = manager.getImplementationSteps('Unknown cause');
    expect(steps.length).toBe(3);
  });

  it('should provide default criteria for unknown cause', () => {
    const criteria = manager.getVerificationCriteria('Unknown cause');
    expect(criteria.length).toBe(3);
  });

  it('should complete all 4 phases in sequence', async () => {
    const error = new Error('Network timeout occurred');
    const context = { operation: 'api-call' };

    // Phase 1: Capture
    const session = await manager.captureError(error, context);
    expect(session.phases.capture.completed).toBe(true);
    expect(session.phases.analyze.completed).toBe(false);

    // Phase 2: Analyze
    await manager.analyzeError(session.id);
    expect(session.phases.analyze.completed).toBe(true);
    expect(session.phases.hypothesize.completed).toBe(false);

    // Phase 3: Hypothesize
    await manager.hypothesizeSolution(session.id);
    expect(session.phases.hypothesize.completed).toBe(true);
    expect(session.phases.verify.completed).toBe(false);

    // Phase 4: Verify
    await manager.verifySolution(session.id, { success: true });
    expect(session.phases.verify.completed).toBe(true);
    expect(session.status).toBe('resolved');
  });
});
