import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorRecoveryManager, ERROR_CATEGORIES, MAX_ATTEMPTS } from '../../src/core/error-recovery.js';

describe('ErrorRecoveryManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      db: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({ results: [] })
          })
        })
      },
      KV: {
        get: vi.fn().mockResolvedValue('0'),
        put: vi.fn()
      }
    };
    manager = new ErrorRecoveryManager(mockEnv);
  });

  describe('categorizeError', () => {
    it('should categorize syntax errors', () => {
      const error = new Error('Unexpected token in JSON parse');
      expect(manager.categorizeError(error)).toBe('syntax');
    });

    it('should categorize logic errors', () => {
      const error = new Error('Cannot read property id of undefined');
      expect(manager.categorizeError(error)).toBe('logic');
    });

    it('should categorize runtime errors', () => {
      const error = new Error('Stack overflow');
      expect(manager.categorizeError(error)).toBe('runtime');
    });

    it('should categorize network errors', () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      expect(manager.categorizeError(error)).toBe('network');
    });

    it('should categorize data errors', () => {
      const error = new Error('SQL constraint violation');
      expect(manager.categorizeError(error)).toBe('data');
    });

    it('should categorize external errors', () => {
      const error = new Error('Third party API failure');
      expect(manager.categorizeError(error)).toBe('external');
    });

    it('should categorize unknown errors as unknown', () => {
      const error = new Error('Some unknown error');
      expect(manager.categorizeError(error)).toBe('unknown');
    });
  });

  describe('executeWithRecovery', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await manager.executeWithRecovery('test-team', operation, { taskId: 'task-1' });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      await expect(manager.executeWithRecovery('test-team', operation, { taskId: 'task-1' }))
        .rejects.toThrow('Network error');
      
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should trigger research intervention after MAX_ATTEMPTS', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'));
      
      // Use same task ID to track attempts - first 2 calls should fail
      const taskId = 'task-1';
      
      await expect(manager.executeWithRecovery('test-team', operation, { taskId }))
        .rejects.toThrow('Network error');
      await expect(manager.executeWithRecovery('test-team', operation, { taskId }))
        .rejects.toThrow('Network error');
      
      // 3rd call should trigger research intervention and attempt recovery
      const result = await manager.executeWithRecovery('test-team', operation, { taskId });
      
      // Research intervention should attempt to apply a solution
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('solution');
      
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('generateSolution', () => {
    it('should generate solution for syntax errors', async () => {
      const solution = await manager.generateSolution('syntax', new Error('Syntax error'), {});
      
      expect(solution).toHaveProperty('description');
      expect(solution).toHaveProperty('priority');
      expect(solution).toHaveProperty('implementationSteps');
      expect(solution).toHaveProperty('successCriteria');
      expect(solution).toHaveProperty('rollbackPlan');
      expect(solution).toHaveProperty('estimatedEffort');
    });

    it('should generate solution for network errors', async () => {
      const solution = await manager.generateSolution('network', new Error('Network error'), {});
      
      expect(solution.description).toContain('connection pooling');
      expect(solution.priority).toBe('high');
    });

    it('should generate generic solution for unknown errors', async () => {
      const solution = await manager.generateSolution('unknown', new Error('Unknown error'), {});
      
      expect(solution.description).toContain('generic error handling');
    });
  });

  describe('MAX_ATTEMPTS', () => {
    it('should be set to 3', () => {
      expect(MAX_ATTEMPTS).toBe(3);
    });
  });

  describe('ERROR_CATEGORIES', () => {
    it('should have 6 categories', () => {
      expect(Object.keys(ERROR_CATEGORIES)).toHaveLength(6);
    });

    it('should include all required categories', () => {
      expect(ERROR_CATEGORIES).toHaveProperty('syntax');
      expect(ERROR_CATEGORIES).toHaveProperty('logic');
      expect(ERROR_CATEGORIES).toHaveProperty('runtime');
      expect(ERROR_CATEGORIES).toHaveProperty('network');
      expect(ERROR_CATEGORIES).toHaveProperty('data');
      expect(ERROR_CATEGORIES).toHaveProperty('external');
    });
  });
});
