import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VerificationSystem, VERIFICATION_CHECKLIST } from '../../src/core/verification-system.js';

describe('VerificationSystem', () => {
  let system;
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
    system = new VerificationSystem(mockEnv);
  });

  describe('startVerification', () => {
    it('should create a new verification', async () => {
      const verification = await system.startVerification('task-1', { fixType: 'bug' });
      
      expect(verification).toHaveProperty('id');
      expect(verification).toHaveProperty('taskId', 'task-1');
      expect(verification).toHaveProperty('status', 'in_progress');
      expect(verification).toHaveProperty('checklist');
      expect(verification).toHaveProperty('regressionTests');
    });

    it('should initialize checklist with all items', async () => {
      const verification = await system.startVerification('task-1');
      
      expect(Object.keys(verification.checklist)).toEqual(Object.keys(VERIFICATION_CHECKLIST));
      Object.values(verification.checklist).forEach(item => {
        expect(item).toHaveProperty('completed', false);
        expect(item).toHaveProperty('result', null);
      });
    });

    it('should save verification to memory', async () => {
      const verification = await system.startVerification('task-2');
      
      expect(system.activeVerifications.has(verification.id)).toBe(true);
    });
  });

  describe('completeChecklistItem', () => {
    it('should complete checklist item', async () => {
      await system.startVerification('task-1');
      const result = await system.completeChecklistItem('verify:task-1', 'code_review', true, 'Review passed');
      
      expect(result).toHaveProperty('completed', true);
      expect(result).toHaveProperty('result', true);
      expect(result).toHaveProperty('notes', 'Review passed');
    });

    it('should add to verification history', async () => {
      await system.startVerification('task-1');
      await system.completeChecklistItem('verify:task-1', 'tests_pass', true);
      
      const verification = system.activeVerifications.get('verify:task-1');
      expect(verification.history).toHaveLength(1);
      expect(verification.history[0].type).toBe('checklist_item_completed');
    });

    it('should return null for unknown item', async () => {
      await system.startVerification('task-1');
      const result = await system.completeChecklistItem('verify:task-1', 'unknown_item', true);
      
      expect(result).toBeNull();
    });
  });

  describe('detectRegressions', () => {
    it('should detect test failures', async () => {
      await system.startVerification('task-1');
      
      const baseline = { test1: { passed: true, duration: 100 } };
      const current = { test1: { passed: false, duration: 100 } };
      
      const regressions = await system.detectRegressions('verify:task-1', baseline, current);
      
      expect(regressions).toHaveLength(1);
      expect(regressions[0].type).toBe('test_failure');
    });

    it('should detect missing tests', async () => {
      await system.startVerification('task-1');
      
      const baseline = { test1: { passed: true } };
      const current = {};
      
      const regressions = await system.detectRegressions('verify:task-1', baseline, current);
      
      expect(regressions).toHaveLength(1);
      expect(regressions[0].type).toBe('missing_test');
    });

    it('should detect performance regressions', async () => {
      await system.startVerification('task-1');
      
      const baseline = { test1: { passed: true, duration: 100 } };
      const current = { test1: { passed: true, duration: 200 } };
      
      const regressions = await system.detectRegressions('verify:task-1', baseline, current);
      
      expect(regressions).toHaveLength(1);
      expect(regressions[0].type).toBe('performance_regression');
    });

    it('should return empty array if no regressions', async () => {
      await system.startVerification('task-1');
      
      const baseline = { test1: { passed: true, duration: 100 } };
      const current = { test1: { passed: true, duration: 110 } };
      
      const regressions = await system.detectRegressions('verify:task-1', baseline, current);
      
      expect(regressions).toHaveLength(0);
    });
  });

  describe('createSnapshot', () => {
    it('should create snapshot with files', async () => {
      const files = { 'src/example.js': 'code here' };
      const snapshotId = await system.createSnapshot('task-1', files);
      
      expect(snapshotId).toContain('snapshot:task-1');
      expect(system.rollbackSnapshots.has(snapshotId)).toBe(true);
    });

    it('should save snapshot to memory', async () => {
      const files = { 'src/example.js': 'code' };
      const snapshotId = await system.createSnapshot('task-1', files);
      
      const snapshot = system.rollbackSnapshots.get(snapshotId);
      expect(snapshot).toHaveProperty('files', files);
    });
  });

  describe('rollbackToSnapshot', () => {
    it('should rollback to snapshot', async () => {
      const files = { 'src/example.js': 'original code' };
      const snapshotId = await system.createSnapshot('task-1', files);
      
      const result = await system.rollbackToSnapshot(snapshotId);
      
      expect(result.success).toBe(true);
      expect(result.files).toEqual(files);
    });

    it('should return null for unknown snapshot', async () => {
      const result = await system.rollbackToSnapshot('unknown:snapshot');
      
      expect(result).toBeNull();
    });
  });

  describe('completeVerification', () => {
    it('should pass when all required items completed', async () => {
      await system.startVerification('task-1');
      await system.completeChecklistItem('verify:task-1', 'code_review', true);
      await system.completeChecklistItem('verify:task-1', 'tests_pass', true);
      await system.completeChecklistItem('verify:task-1', 'no_regressions', true);
      await system.completeChecklistItem('verify:task-1', 'security_review', true);
      
      const result = await system.completeVerification('verify:task-1');
      
      expect(result.success).toBe(true);
      expect(result.verification.status).toBe('passed');
    });

    it('should fail when required items not completed', async () => {
      await system.startVerification('task-1');
      await system.completeChecklistItem('verify:task-1', 'code_review', true);
      
      const result = await system.completeVerification('verify:task-1');
      
      expect(result.success).toBe(true);
      expect(result.verification.status).toBe('failed');
      expect(result.verification.failureReason).toBe('Required checklist items not completed');
    });

    it('should fail when regressions detected', async () => {
      await system.startVerification('task-1');
      await system.completeChecklistItem('verify:task-1', 'code_review', true);
      await system.completeChecklistItem('verify:task-1', 'tests_pass', true);
      await system.completeChecklistItem('verify:task-1', 'no_regressions', true);
      await system.completeChecklistItem('verify:task-1', 'security_review', true);
      
      await system.detectRegressions('verify:task-1', { test1: { passed: true } }, { test1: { passed: false } });
      
      const result = await system.completeVerification('verify:task-1');
      
      expect(result.verification.status).toBe('failed');
      expect(result.verification.failureReason).toBe('Regressions detected');
    });

    it('should remove verification from active verifications', async () => {
      await system.startVerification('task-1');
      await system.completeChecklistItem('verify:task-1', 'code_review', true);
      await system.completeChecklistItem('verify:task-1', 'tests_pass', true);
      await system.completeChecklistItem('verify:task-1', 'no_regressions', true);
      await system.completeChecklistItem('verify:task-1', 'security_review', true);
      
      await system.completeVerification('verify:task-1');
      
      expect(system.activeVerifications.has('verify:task-1')).toBe(false);
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verification status', async () => {
      const verification = await system.startVerification('task-1');
      const status = system.getVerificationStatus(verification.id);
      
      expect(status).toHaveProperty('id', verification.id);
      expect(status).toHaveProperty('taskId', 'task-1');
      expect(status).toHaveProperty('status', 'in_progress');
      expect(status).toHaveProperty('checklist');
    });

    it('should return null for non-existent verification', () => {
      const status = system.getVerificationStatus('nonexistent:verify');
      
      expect(status).toBeNull();
    });
  });

  describe('VERIFICATION_CHECKLIST', () => {
    it('should define all checklist items', () => {
      expect(VERIFICATION_CHECKLIST).toHaveProperty('code_review');
      expect(VERIFICATION_CHECKLIST).toHaveProperty('tests_pass');
      expect(VERIFICATION_CHECKLIST).toHaveProperty('no_regressions');
      expect(VERIFICATION_CHECKLIST).toHaveProperty('documentation_updated');
      expect(VERIFICATION_CHECKLIST).toHaveProperty('security_review');
      expect(VERIFICATION_CHECKLIST).toHaveProperty('performance_check');
    });

    it('should mark required items correctly', () => {
      expect(VERIFICATION_CHECKLIST.code_review.required).toBe(true);
      expect(VERIFICATION_CHECKLIST.tests_pass.required).toBe(true);
      expect(VERIFICATION_CHECKLIST.no_regressions.required).toBe(true);
      expect(VERIFICATION_CHECKLIST.security_review.required).toBe(true);
      expect(VERIFICATION_CHECKLIST.documentation_updated.required).toBe(false);
      expect(VERIFICATION_CHECKLIST.performance_check.required).toBe(false);
    });
  });

  describe('getChecklist', () => {
    it('should return checklist', () => {
      const checklist = system.getChecklist();
      
      expect(checklist).toEqual(VERIFICATION_CHECKLIST);
    });
  });

  describe('getRequiredChecklistItems', () => {
    it('should return only required items', () => {
      const required = system.getRequiredChecklistItems();
      
      expect(required).toHaveLength(4);
      required.forEach(item => {
        expect(item.required).toBe(true);
      });
    });
  });
});
