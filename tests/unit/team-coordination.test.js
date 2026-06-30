import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TeamCoordinationManager, TEAM_WORKFLOW, QUALITY_THRESHOLDS } from '../../src/core/team-coordination.js';

describe('TeamCoordinationManager', () => {
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
    manager = new TeamCoordinationManager(mockEnv);
  });

  describe('initiateWorkflow', () => {
    it('should create a new workflow', async () => {
      const workflow = await manager.initiateWorkflow('research', 'task-1', { priority: 'high' });
      
      expect(workflow).toHaveProperty('id');
      expect(workflow).toHaveProperty('team', 'research');
      expect(workflow).toHaveProperty('status', 'active');
      expect(workflow).toHaveProperty('currentStage', 'research');
      expect(workflow).toHaveProperty('qualityScores');
      expect(workflow).toHaveProperty('decisions');
      expect(workflow).toHaveProperty('history');
    });

    it('should save workflow to memory', async () => {
      const workflow = await manager.initiateWorkflow('planning', 'task-2');
      
      expect(manager.activeWorkflows.has(workflow.id)).toBe(true);
    });
  });

  describe('recordQualityScore', () => {
    it('should record quality score and pass gate', async () => {
      await manager.initiateWorkflow('research', 'task-1');
      const result = await manager.recordQualityScore('research:task-1', 'research_accuracy', 0.95);
      
      expect(result.passed).toBe(true);
      expect(result.workflow.qualityScores.research_accuracy).toHaveProperty('score', 0.95);
      expect(result.workflow.qualityScores.research_accuracy).toHaveProperty('passed', true);
    });

    it('should fail quality gate below threshold', async () => {
      await manager.initiateWorkflow('research', 'task-1');
      const result = await manager.recordQualityScore('research:task-1', 'research_accuracy', 0.85);
      
      expect(result.passed).toBe(false);
      expect(result.workflow.qualityScores.research_accuracy).toHaveProperty('score', 0.85);
      expect(result.workflow.qualityScores.research_accuracy).toHaveProperty('passed', false);
    });

    it('should escalate on critical gate failure', async () => {
      await manager.initiateWorkflow('development', 'task-1');
      const result = await manager.recordQualityScore('development:task-1', 'code_quality', 0.75);
      
      expect(result.success).toBe(true);
      expect(result.workflow.status).toBe('escalated');
      expect(result.workflow.escalation).toHaveProperty('type', 'quality_gate_failure');
    });

    it('should allow retry on non-critical gate failure', async () => {
      await manager.initiateWorkflow('planning', 'task-1');
      const result = await manager.recordQualityScore('planning:task-1', 'plan_accuracy', 0.75);
      
      expect(result.passed).toBe(false);
      expect(result.workflow.status).toBe('retry');
      expect(result.requiresRetry).toBe(true);
    });
  });

  describe('requestHandoff', () => {
    it('should allow valid handoff sequence', async () => {
      await manager.initiateWorkflow('research', 'task-1');
      await manager.recordQualityScore('research:task-1', 'research_accuracy', 0.95);
      await manager.recordQualityScore('research:task-1', 'solution_effectiveness', 0.90);
      
      const result = await manager.requestHandoff('research:task-1', 'planning', { notes: 'Ready for planning' });
      
      expect(result.success).toBe(true);
      expect(result.workflow.currentStage).toBe('planning');
      expect(result.workflow.decisions).toHaveLength(1);
    });

    it('should reject invalid handoff sequence', async () => {
      await manager.initiateWorkflow('research', 'task-1');
      
      const result = await manager.requestHandoff('research:task-1', 'development', {});
      
      expect(result.error).toBe('Invalid handoff sequence');
    });

    it('should reject handoff with failed quality gates', async () => {
      await manager.initiateWorkflow('research', 'task-1');
      await manager.recordQualityScore('research:task-1', 'research_accuracy', 0.85);
      
      const result = await manager.requestHandoff('research:task-1', 'planning', {});
      
      expect(result.error).toBe('Quality gates not passed');
      expect(result.failedGates).toContain('solution_effectiveness');
    });
  });

  describe('escalateWorkflow', () => {
    it('should escalate to general manager', async () => {
      await manager.initiateWorkflow('research', 'task-1');
      const result = await manager.escalateWorkflow(
        manager.activeWorkflows.get('research:task-1'),
        'Critical issue detected',
        'blocking_issue'
      );
      
      expect(result.success).toBe(true);
      expect(result.workflow.status).toBe('escalated');
      expect(result.workflow.escalation).toHaveProperty('to', 'general_manager');
    });

    it('should return error when no escalation path', async () => {
      await manager.initiateWorkflow('general_manager', 'task-1');
      const result = await manager.escalateWorkflow(
        manager.activeWorkflows.get('general_manager:task-1'),
        'Issue',
        'escalation'
      );
      
      expect(result.error).toBe('No escalation path available');
    });
  });

  describe('recordDecision', () => {
    it('should record decision for current team', async () => {
      await manager.initiateWorkflow('planning', 'task-1');
      const result = await manager.recordDecision('planning:task-1', { decision: 'Proceed with Phase 1' });
      
      expect(result.success).toBe(true);
      expect(result.decision).toHaveProperty('team', 'planning');
      expect(result.decision.data).toHaveProperty('decision', 'Proceed with Phase 1');
    });
  });

  describe('completeWorkflow', () => {
    it('should complete workflow and calculate duration', async () => {
      await manager.initiateWorkflow('management', 'task-1');
      const result = await manager.completeWorkflow('management:task-1', { status: 'success' });
      
      expect(result.success).toBe(true);
      expect(result.workflow.status).toBe('completed');
      expect(result.workflow).toHaveProperty('endTime');
      expect(result.workflow).toHaveProperty('result');
      expect(result).toHaveProperty('duration');
    });

    it('should remove workflow from active workflows', async () => {
      await manager.initiateWorkflow('research', 'task-1');
      await manager.completeWorkflow('research:task-1');
      
      expect(manager.activeWorkflows.has('research:task-1')).toBe(false);
    });
  });

  describe('getWorkflowStatus', () => {
    it('should return workflow status', async () => {
      await manager.initiateWorkflow('research', 'task-1');
      const status = manager.getWorkflowStatus('research:task-1');
      
      expect(status).toHaveProperty('id', 'research:task-1');
      expect(status).toHaveProperty('team', 'research');
      expect(status).toHaveProperty('currentStage', 'research');
      expect(status).toHaveProperty('status', 'active');
    });

    it('should return null for non-existent workflow', () => {
      const status = manager.getWorkflowStatus('nonexistent:task-1');
      
      expect(status).toBeNull();
    });
  });

  describe('getTeamWorkflowPath', () => {
    it('should return workflow path for research team', () => {
      const path = manager.getTeamWorkflowPath('research');
      
      expect(path).toEqual(['research', 'planning', 'development', 'management', 'general_manager']);
    });

    it('should return workflow path for general manager', () => {
      const path = manager.getTeamWorkflowPath('general_manager');
      
      expect(path).toEqual(['general_manager']);
    });
  });

  describe('TEAM_WORKFLOW', () => {
    it('should define workflow for all teams', () => {
      expect(TEAM_WORKFLOW).toHaveProperty('research');
      expect(TEAM_WORKFLOW).toHaveProperty('planning');
      expect(TEAM_WORKFLOW).toHaveProperty('development');
      expect(TEAM_WORKFLOW).toHaveProperty('management');
      expect(TEAM_WORKFLOW).toHaveProperty('general_manager');
    });

    it('should define next stage for each team except GM', () => {
      expect(TEAM_WORKFLOW.research.next).toBe('planning');
      expect(TEAM_WORKFLOW.planning.next).toBe('development');
      expect(TEAM_WORKFLOW.development.next).toBe('management');
      expect(TEAM_WORKFLOW.management.next).toBe('general_manager');
      expect(TEAM_WORKFLOW.general_manager.next).toBeNull();
    });

    it('should define quality gates for each team', () => {
      expect(TEAM_WORKFLOW.research.qualityGates).toContain('research_accuracy');
      expect(TEAM_WORKFLOW.planning.qualityGates).toContain('plan_accuracy');
      expect(TEAM_WORKFLOW.development.qualityGates).toContain('code_quality');
    });
  });

  describe('QUALITY_THRESHOLDS', () => {
    it('should define thresholds for all quality gates', () => {
      expect(QUALITY_THRESHOLDS).toHaveProperty('research_accuracy');
      expect(QUALITY_THRESHOLDS).toHaveProperty('solution_effectiveness');
      expect(QUALITY_THRESHOLDS).toHaveProperty('plan_accuracy');
      expect(QUALITY_THRESHOLDS).toHaveProperty('code_quality');
    });

    it('should have thresholds between 0.80 and 0.95', () => {
      Object.values(QUALITY_THRESHOLDS).forEach(threshold => {
        expect(threshold).toBeGreaterThanOrEqual(0.80);
        expect(threshold).toBeLessThanOrEqual(0.95);
      });
    });
  });
});
