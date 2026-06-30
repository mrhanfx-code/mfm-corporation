import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TDDEnforcementManager, TDD_PHASES, TDD_REQUIREMENTS } from '../../src/core/tdd-enforcement.js';

describe('TDDEnforcementManager', () => {
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
    manager = new TDDEnforcementManager(mockEnv);
  });

  describe('startSession', () => {
    it('should create a new TDD session', async () => {
      const session = await manager.startSession('task-1', { codePath: 'src/example.js' });
      
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('taskId', 'task-1');
      expect(session).toHaveProperty('currentPhase', TDD_PHASES.RED);
      expect(session).toHaveProperty('phases');
      expect(session.phases).toHaveProperty(TDD_PHASES.RED);
      expect(session.phases).toHaveProperty(TDD_PHASES.GREEN);
      expect(session.phases).toHaveProperty(TDD_PHASES.REFACTOR);
    });

    it('should save session to memory', async () => {
      const session = await manager.startSession('task-2');
      
      expect(manager.activeSessions.has(session.id)).toBe(true);
    });
  });

  describe('recordTest', () => {
    it('should record test in RED phase', async () => {
      await manager.startSession('task-1');
      const result = await manager.recordTest('tdd:task-1', 'tests/example.test.js', 'test code here', TDD_PHASES.RED);
      
      expect(result).toHaveProperty('path', 'tests/example.test.js');
      expect(result).toHaveProperty('code', 'test code here');
      expect(result).toHaveProperty('phase', TDD_PHASES.RED);
    });

    it('should add test to session history', async () => {
      await manager.startSession('task-1');
      await manager.recordTest('tdd:task-1', 'tests/example.test.js', 'test code', TDD_PHASES.RED);
      
      const session = manager.activeSessions.get('tdd:task-1');
      expect(session.phases[TDD_PHASES.RED].tests).toHaveLength(1);
      expect(session.history).toHaveLength(1);
    });
  });

  describe('recordImplementation', () => {
    it('should record implementation in GREEN phase', async () => {
      await manager.startSession('task-1');
      const result = await manager.recordImplementation('tdd:task-1', 'src/example.js', 'implementation code', TDD_PHASES.GREEN);
      
      expect(result).toHaveProperty('path', 'src/example.js');
      expect(result).toHaveProperty('code', 'implementation code');
      expect(result).toHaveProperty('phase', TDD_PHASES.GREEN);
    });
  });

  describe('recordRefactor', () => {
    it('should record refactor in REFACTOR phase', async () => {
      await manager.startSession('task-1');
      const result = await manager.recordRefactor('tdd:task-1', 'src/example.js', 'refactored code', 'Optimized performance');
      
      expect(result).toHaveProperty('path', 'src/example.js');
      expect(result).toHaveProperty('code', 'refactored code');
      expect(result).toHaveProperty('description', 'Optimized performance');
    });
  });

  describe('validatePhase', () => {
    it('should validate RED phase with failing test', async () => {
      await manager.startSession('task-1');
      await manager.recordTest('tdd:task-1', 'tests/example.test.js', 'test code', TDD_PHASES.RED);
      
      const validation = await manager.validatePhase('tdd:task-1', TDD_PHASES.RED, { passed: false });
      
      expect(validation.passed).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail RED phase if test passes', async () => {
      await manager.startSession('task-1');
      await manager.recordTest('tdd:task-1', 'tests/example.test.js', 'test code', TDD_PHASES.RED);
      
      const validation = await manager.validatePhase('tdd:task-1', TDD_PHASES.RED, { passed: true });
      
      expect(validation.passed).toBe(false);
      expect(validation.errors).toContain('Test must fail in RED phase');
    });

    it('should fail RED phase if no tests written', async () => {
      await manager.startSession('task-1');
      
      const validation = await manager.validatePhase('tdd:task-1', TDD_PHASES.RED, { passed: false });
      
      expect(validation.passed).toBe(false);
      expect(validation.errors).toContain('No tests written in RED phase');
    });

    it('should validate GREEN phase with passing tests', async () => {
      await manager.startSession('task-1');
      await manager.recordTest('tdd:task-1', 'tests/example.test.js', 'test code', TDD_PHASES.RED);
      await manager.recordImplementation('tdd:task-1', 'src/example.js', 'implementation', TDD_PHASES.GREEN);
      
      const validation = await manager.validatePhase('tdd:task-1', TDD_PHASES.GREEN, { passed: true });
      
      expect(validation.passed).toBe(true);
    });

    it('should fail GREEN phase if RED not completed', async () => {
      await manager.startSession('task-1');
      await manager.recordImplementation('tdd:task-1', 'src/example.js', 'implementation', TDD_PHASES.GREEN);
      
      const validation = await manager.validatePhase('tdd:task-1', TDD_PHASES.GREEN, { passed: true });
      
      expect(validation.passed).toBe(false);
      expect(validation.errors).toContain('RED phase must be completed before GREEN');
    });

    it('should validate REFACTOR phase with passing tests', async () => {
      await manager.startSession('task-1');
      await manager.recordTest('tdd:task-1', 'tests/example.test.js', 'test code', TDD_PHASES.RED);
      await manager.recordImplementation('tdd:task-1', 'src/example.js', 'implementation', TDD_PHASES.GREEN);
      
      const validation = await manager.validatePhase('tdd:task-1', TDD_PHASES.REFACTOR, { passed: true });
      
      expect(validation.passed).toBe(true);
    });
  });

  describe('advancePhase', () => {
    it('should advance from RED to GREEN', async () => {
      await manager.startSession('task-1');
      const result = await manager.advancePhase('tdd:task-1');
      
      expect(result.currentPhase).toBe(TDD_PHASES.GREEN);
    });

    it('should advance from GREEN to REFACTOR', async () => {
      await manager.startSession('task-1');
      await manager.advancePhase('tdd:task-1');
      const result = await manager.advancePhase('tdd:task-1');
      
      expect(result.currentPhase).toBe(TDD_PHASES.REFACTOR);
    });

    it('should not advance from REFACTOR', async () => {
      await manager.startSession('task-1');
      await manager.advancePhase('tdd:task-1');
      await manager.advancePhase('tdd:task-1');
      const result = await manager.advancePhase('tdd:task-1');
      
      expect(result).toBeNull();
    });
  });

  describe('completeSession', () => {
    it('should complete session and calculate duration', async () => {
      await manager.startSession('task-1');
      const result = await manager.completeSession('tdd:task-1', { testsPassed: 5 });
      
      expect(result.success).toBe(true);
      expect(result.session.status).toBe('completed');
      expect(result.session).toHaveProperty('endTime');
      expect(result.session).toHaveProperty('finalResults');
      expect(result).toHaveProperty('duration');
    });

    it('should remove session from active sessions', async () => {
      await manager.startSession('task-1');
      await manager.completeSession('tdd:task-1');
      
      expect(manager.activeSessions.has('tdd:task-1')).toBe(false);
    });
  });

  describe('enforceTestBeforeCode', () => {
    it('should enforce test before code in RED phase', async () => {
      const result = await manager.enforceTestBeforeCode('task-1', 'src/example.js');
      
      expect(result.enforced).toBe(false);
      expect(result.error).toBe('Test must be written before code (RED phase)');
    });

    it('should allow code after test is written', async () => {
      await manager.startSession('task-1');
      await manager.recordTest('tdd:task-1', 'tests/example.test.js', 'test code', TDD_PHASES.RED);
      
      const result = await manager.enforceTestBeforeCode('task-1', 'src/example.js');
      
      expect(result.enforced).toBe(true);
    });
  });

  describe('getSessionStatus', () => {
    it('should return session status', async () => {
      await manager.startSession('task-1');
      const status = manager.getSessionStatus('tdd:task-1');
      
      expect(status).toHaveProperty('id', 'tdd:task-1');
      expect(status).toHaveProperty('taskId', 'task-1');
      expect(status).toHaveProperty('currentPhase', TDD_PHASES.RED);
      expect(status).toHaveProperty('phases');
    });

    it('should return null for non-existent session', () => {
      const status = manager.getSessionStatus('nonexistent:task-1');
      
      expect(status).toBeNull();
    });
  });

  describe('TDD_PHASES', () => {
    it('should define all TDD phases', () => {
      expect(TDD_PHASES).toHaveProperty('RED', 'red');
      expect(TDD_PHASES).toHaveProperty('GREEN', 'green');
      expect(TDD_PHASES).toHaveProperty('REFACTOR', 'refactor');
    });
  });

  describe('TDD_REQUIREMENTS', () => {
    it('should define requirements for RED phase', () => {
      expect(TDD_REQUIREMENTS.RED).toHaveProperty('description');
      expect(TDD_REQUIREMENTS.RED).toHaveProperty('mustFail', true);
      expect(TDD_REQUIREMENTS.RED).toHaveProperty('mustExist', true);
    });

    it('should define requirements for GREEN phase', () => {
      expect(TDD_REQUIREMENTS.GREEN).toHaveProperty('description');
      expect(TDD_REQUIREMENTS.GREEN).toHaveProperty('mustPass', true);
      expect(TDD_REQUIREMENTS.GREEN).toHaveProperty('minimalImplementation', true);
    });

    it('should define requirements for REFACTOR phase', () => {
      expect(TDD_REQUIREMENTS.REFACTOR).toHaveProperty('description');
      expect(TDD_REQUIREMENTS.REFACTOR).toHaveProperty('mustPass', true);
      expect(TDD_REQUIREMENTS.REFACTOR).toHaveProperty('testsMustExist', true);
    });
  });

  describe('getPhaseDescription', () => {
    it('should return phase description', () => {
      const desc = manager.getPhaseDescription(TDD_PHASES.RED);
      
      expect(desc).toBe('Write failing test before implementation');
    });
  });

  describe('getPhaseRequirements', () => {
    it('should return phase requirements', () => {
      const reqs = manager.getPhaseRequirements(TDD_PHASES.GREEN);
      
      expect(reqs).toHaveProperty('mustPass', true);
      expect(reqs).toHaveProperty('minimalImplementation', true);
    });
  });
});
