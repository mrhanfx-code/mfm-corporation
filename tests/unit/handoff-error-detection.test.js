// Handoff Error Detection Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HandoffErrorDetector, HANDOFF_ERROR_TYPES, HANDOFF_TIMEOUT_MS } from '../../src/core/handoff-error-detection.js';

describe('HandoffErrorDetector', () => {
  let detector;
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      db: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            run: vi.fn().mockResolvedValue(),
            all: vi.fn().mockResolvedValue({ results: [] }),
            first: vi.fn().mockResolvedValue(null)
          })
        })
      }
    };
    detector = new HandoffErrorDetector(mockEnv);
  });

  describe('detectHandoffError', () => {
    it('should detect quality gate failure', () => {
      const handoff = {
        id: 'handoff-1',
        task_id: 'task-1',
        from_team: 'dev-team',
        to_team: 'qa-team',
        task_description: 'Valid task description with sufficient detail',
        quality_score: 75,
        created_at: new Date().toISOString()
      };

      const errors = detector.detectHandoffError(handoff);
      
      expect(errors.length).toBeGreaterThan(0);
      const qualityError = errors.find(e => e.type === HANDOFF_ERROR_TYPES.quality_gate_failure);
      expect(qualityError).toBeDefined();
      expect(qualityError.severity).toBe('high');
    });

    it('should detect missing context', () => {
      const handoff = {
        id: 'handoff-1',
        task_id: 'task-1',
        from_team: 'dev-team',
        to_team: 'qa-team',
        task_description: 'Short',
        quality_score: 90,
        created_at: new Date().toISOString()
      };

      const errors = detector.detectHandoffError(handoff);
      
      expect(errors.length).toBeGreaterThan(0);
      const contextError = errors.find(e => e.type === HANDOFF_ERROR_TYPES.missing_context);
      expect(contextError).toBeDefined();
    });

    it('should detect invalid task', () => {
      const handoff = {
        id: 'handoff-1',
        from_team: 'dev-team',
        to_team: 'qa-team',
        task_description: 'Valid task description',
        quality_score: 90,
        created_at: new Date().toISOString()
      };

      const errors = detector.detectHandoffError(handoff);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(HANDOFF_ERROR_TYPES.invalid_task);
    });

    it('should detect timeout', () => {
      const oldDate = new Date(Date.now() - HANDOFF_TIMEOUT_MS - 1000);
      const handoff = {
        id: 'handoff-1',
        task_id: 'task-1',
        from_team: 'dev-team',
        to_team: 'qa-team',
        task_description: 'Valid task description',
        quality_score: 90,
        created_at: oldDate.toISOString()
      };

      const errors = detector.detectHandoffError(handoff);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(HANDOFF_ERROR_TYPES.timeout);
      expect(errors[0].severity).toBe('critical');
    });

    it('should detect multiple errors', () => {
      const oldDate = new Date(Date.now() - HANDOFF_TIMEOUT_MS - 1000);
      const handoff = {
        id: 'handoff-1',
        from_team: 'dev-team',
        to_team: 'qa-team',
        task_description: 'Short',
        quality_score: 75,
        created_at: oldDate.toISOString()
      };

      const errors = detector.detectHandoffError(handoff);
      
      expect(errors.length).toBeGreaterThan(1);
      const errorTypes = errors.map(e => e.type);
      expect(errorTypes).toContain(HANDOFF_ERROR_TYPES.quality_gate_failure);
      expect(errorTypes).toContain(HANDOFF_ERROR_TYPES.missing_context);
      expect(errorTypes).toContain(HANDOFF_ERROR_TYPES.invalid_task);
      expect(errorTypes).toContain(HANDOFF_ERROR_TYPES.timeout);
    });

    it('should return no errors for valid handoff', () => {
      const handoff = {
        id: 'handoff-1',
        task_id: 'task-1',
        from_team: 'dev-team',
        to_team: 'qa-team',
        task_description: 'Valid task description with sufficient detail',
        quality_score: 90,
        created_at: new Date().toISOString()
      };

      const errors = detector.detectHandoffError(handoff);
      
      expect(errors).toHaveLength(0);
    });
  });

  describe('logHandoffError', () => {
    it('should log error to database', async () => {
      const error = {
        type: HANDOFF_ERROR_TYPES.quality_gate_failure,
        severity: 'high',
        message: 'Quality score below threshold',
        recommendation: 'Improve quality'
      };

      await detector.logHandoffError('handoff-1', error);
      
      expect(mockEnv.db.prepare).toHaveBeenCalled();
    });

    it('should handle missing database gracefully', async () => {
      const detectorNoDb = new HandoffErrorDetector({});
      const error = {
        type: HANDOFF_ERROR_TYPES.quality_gate_failure,
        severity: 'high',
        message: 'Quality score below threshold',
        recommendation: 'Improve quality'
      };

      await expect(detectorNoDb.logHandoffError('handoff-1', error)).resolves.not.toThrow();
    });
  });

  describe('getHandoffErrorStats', () => {
    it('should return empty stats when no database', async () => {
      const detectorNoDb = new HandoffErrorDetector({});
      const stats = await detectorNoDb.getHandoffErrorStats({});
      
      expect(stats).toEqual({ total: 0, byType: {}, bySeverity: {} });
    });

    it('should return error statistics', async () => {
      mockEnv.db.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({
          results: [
            { error_type: 'quality_gate_failure', severity: 'high', count: 5 },
            { error_type: 'missing_context', severity: 'high', count: 3 },
            { error_type: 'timeout', severity: 'critical', count: 1 }
          ]
        })
      });

      const stats = await detector.getHandoffErrorStats(mockEnv);
      
      expect(stats.total).toBe(9);
      expect(stats.byType['quality_gate_failure']).toBe(5);
      expect(stats.byType['missing_context']).toBe(3);
      expect(stats.byType['timeout']).toBe(1);
      expect(stats.bySeverity['high']).toBe(8);
      expect(stats.bySeverity['critical']).toBe(1);
    });
  });

  describe('getErrorRateByTeam', () => {
    it('should return empty object when no database', async () => {
      const detectorNoDb = new HandoffErrorDetector({});
      const rates = await detectorNoDb.getErrorRateByTeam({});
      
      expect(rates).toEqual({});
    });

    it('should return error rates by team', async () => {
      mockEnv.db.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({
          results: [
            { from_team: 'dev-team', total_handoffs: 100, error_count: 5, error_rate: 5.0 },
            { from_team: 'qa-team', total_handoffs: 50, error_count: 2, error_rate: 4.0 }
          ]
        })
      });

      const rates = await detector.getErrorRateByTeam(mockEnv);
      
      expect(rates['dev-team']).toEqual({
        totalHandoffs: 100,
        errorCount: 5,
        errorRate: 5.0
      });
      expect(rates['qa-team']).toEqual({
        totalHandoffs: 50,
        errorCount: 2,
        errorRate: 4.0
      });
    });
  });

  describe('HANDOFF_TIMEOUT_MS', () => {
    it('should be set to 5 minutes', () => {
      expect(HANDOFF_TIMEOUT_MS).toBe(5 * 60 * 1000);
    });
  });

  describe('HANDOFF_ERROR_TYPES', () => {
    it('should have 8 error types', () => {
      expect(Object.keys(HANDOFF_ERROR_TYPES)).toHaveLength(8);
    });

    it('should include all required error types', () => {
      expect(HANDOFF_ERROR_TYPES).toHaveProperty('quality_gate_failure');
      expect(HANDOFF_ERROR_TYPES).toHaveProperty('missing_context');
      expect(HANDOFF_ERROR_TYPES).toHaveProperty('invalid_task');
      expect(HANDOFF_ERROR_TYPES).toHaveProperty('team_unavailable');
      expect(HANDOFF_ERROR_TYPES).toHaveProperty('timeout');
      expect(HANDOFF_ERROR_TYPES).toHaveProperty('data_corruption');
      expect(HANDOFF_ERROR_TYPES).toHaveProperty('permission_denied');
      expect(HANDOFF_ERROR_TYPES).toHaveProperty('dependency_missing');
    });
  });
});
