// Team Coordination Patterns — Quality gates, escalation paths, decision documentation

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';

const TEAM_WORKFLOW = {
  research: {
    next: 'planning',
    qualityGates: ['research_accuracy', 'solution_effectiveness'],
    escalation: 'general_manager'
  },
  planning: {
    next: 'development',
    qualityGates: ['plan_accuracy', 'timeline_adherence'],
    escalation: 'general_manager'
  },
  development: {
    next: 'management',
    qualityGates: ['code_quality', 'development_velocity'],
    escalation: 'general_manager'
  },
  management: {
    next: 'general_manager',
    qualityGates: ['team_performance', 'quality_compliance'],
    escalation: 'general_manager'
  },
  general_manager: {
    next: null,
    qualityGates: ['executive_confidence', 'strategic_alignment'],
    escalation: null
  }
};

const QUALITY_THRESHOLDS = {
  research_accuracy: 0.90,
  solution_effectiveness: 0.85,
  plan_accuracy: 0.85,
  timeline_adherence: 0.90,
  code_quality: 0.90,
  development_velocity: 0.80,
  team_performance: 0.85,
  quality_compliance: 0.95,
  executive_confidence: 0.90,
  strategic_alignment: 0.85
};

class TeamCoordinationManager {
  constructor(env) {
    this.env = env;
    this.activeWorkflows = new Map();
  }

  async initiateWorkflow(teamName, taskId, context = {}) {
    const workflowId = `${teamName}:${taskId}`;
    
    logger.info(`Team Coordination: Initiating workflow for ${teamName}`, {
      workflowId,
      context
    });
    
    const workflow = {
      id: workflowId,
      team: teamName,
      taskId,
      status: 'active',
      currentStage: teamName,
      context,
      qualityScores: {},
      decisions: [],
      startTime: new Date().toISOString(),
      history: []
    };
    
    this.activeWorkflows.set(workflowId, workflow);
    await this.saveWorkflow(workflow);
    
    return workflow;
  }

  async recordQualityScore(workflowId, gateName, score) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      logger.warn(`Team Coordination: Workflow not found ${workflowId}`);
      return null;
    }
    
    const threshold = QUALITY_THRESHOLDS[gateName] || 0.80;
    const passed = score >= threshold;
    
    workflow.qualityScores[gateName] = {
      score,
      threshold,
      passed,
      timestamp: new Date().toISOString()
    };
    
    workflow.history.push({
      type: 'quality_gate',
      gate: gateName,
      score,
      threshold,
      passed,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Team Coordination: Quality gate ${gateName} for ${workflowId}`, {
      score,
      threshold,
      passed
    });
    
    await this.saveWorkflow(workflow);
    
    if (!passed) {
      return await this.handleQualityGateFailure(workflow, gateName, score, threshold);
    }
    
    return { passed, workflow };
  }

  async handleQualityGateFailure(workflow, gateName, score, threshold) {
    logger.warn(`Team Coordination: Quality gate failed ${gateName} for ${workflow.id}`, {
      score,
      threshold
    });
    
    // Check if this is a critical failure requiring escalation
    const criticalGates = ['code_quality', 'solution_effectiveness', 'quality_compliance'];
    const isCritical = criticalGates.includes(gateName);
    
    if (isCritical) {
      return await this.escalateWorkflow(workflow, gateName, 'quality_gate_failure');
    }
    
    // Non-critical - allow retry with warning
    workflow.status = 'retry';
    workflow.retryReason = `Quality gate ${gateName} failed: ${score} < ${threshold}`;
    
    await this.saveWorkflow(workflow);
    
    return { passed: false, workflow, requiresRetry: true };
  }

  async requestHandoff(workflowId, toTeam, decisionData = {}) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      logger.warn(`Team Coordination: Workflow not found ${workflowId}`);
      return null;
    }
    
    const fromTeam = workflow.currentStage;
    const allowedNext = TEAM_WORKFLOW[fromTeam]?.next;
    
    if (allowedNext !== toTeam) {
      logger.error(`Team Coordination: Invalid handoff from ${fromTeam} to ${toTeam}`, {
        allowedNext,
        requested: toTeam
      });
      return { error: 'Invalid handoff sequence' };
    }
    
    // Verify all quality gates passed
    const requiredGates = TEAM_WORKFLOW[fromTeam]?.qualityGates || [];
    const failedGates = requiredGates.filter(gate => {
      const gateData = workflow.qualityScores[gate];
      return !gateData || !gateData.passed;
    });
    
    if (failedGates.length > 0) {
      logger.error(`Team Coordination: Cannot handoff - failed quality gates`, {
        failedGates
      });
      return { error: 'Quality gates not passed', failedGates };
    }
    
    // Record decision
    const decision = {
      from: fromTeam,
      to: toTeam,
      data: decisionData,
      timestamp: new Date().toISOString(),
      approved: true
    };
    
    workflow.decisions.push(decision);
    workflow.currentStage = toTeam;
    workflow.history.push({
      type: 'handoff',
      from: fromTeam,
      to: toTeam,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Team Coordination: Handoff from ${fromTeam} to ${toTeam}`, {
      workflowId: workflow.id
    });
    
    await this.saveWorkflow(workflow);
    
    return { success: true, workflow, decision };
  }

  async escalateWorkflow(workflow, reason, escalationType) {
    const currentTeam = workflow.currentStage;
    const escalationTarget = TEAM_WORKFLOW[currentTeam]?.escalation;
    
    if (!escalationTarget) {
      logger.error(`Team Coordination: No escalation path for ${currentTeam}`);
      return { error: 'No escalation path available' };
    }
    
    workflow.status = 'escalated';
    workflow.escalation = {
      from: currentTeam,
      to: escalationTarget,
      reason,
      type: escalationType,
      timestamp: new Date().toISOString()
    };
    
    workflow.history.push({
      type: 'escalation',
      from: currentTeam,
      to: escalationTarget,
      reason,
      type: escalationType,
      timestamp: new Date().toISOString()
    });
    
    logger.warn(`Team Coordination: Escalating workflow ${workflow.id}`, {
      from: currentTeam,
      to: escalationTarget,
      reason
    });
    
    await this.saveWorkflow(workflow);
    await this.notifyGeneralManager(workflow);
    
    return { success: true, workflow, escalation: workflow.escalation };
  }

  async recordDecision(workflowId, decisionData) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      logger.warn(`Team Coordination: Workflow not found ${workflowId}`);
      return null;
    }
    
    const decision = {
      team: workflow.currentStage,
      data: decisionData,
      timestamp: new Date().toISOString()
    };
    
    workflow.decisions.push(decision);
    workflow.history.push({
      type: 'decision',
      team: workflow.currentStage,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Team Coordination: Decision recorded for ${workflow.id}`, {
      team: workflow.currentStage
    });
    
    await this.saveWorkflow(workflow);
    
    return { success: true, decision };
  }

  async completeWorkflow(workflowId, result = {}) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      logger.warn(`Team Coordination: Workflow not found ${workflowId}`);
      return null;
    }
    
    workflow.status = 'completed';
    workflow.endTime = new Date().toISOString();
    workflow.result = result;
    workflow.history.push({
      type: 'completion',
      timestamp: new Date().toISOString()
    });
    
    const duration = new Date(workflow.endTime) - new Date(workflow.startTime);
    
    logger.info(`Team Coordination: Workflow completed ${workflow.id}`, {
      duration: `${duration}ms`,
      result
    });
    
    await this.saveWorkflow(workflow);
    this.activeWorkflows.delete(workflowId);
    
    return { success: true, workflow, duration };
  }

  async saveWorkflow(workflow) {
    try {
      const memoryKey = `workflow:${workflow.id}`;
      await saveMemory(this.env, memoryKey, workflow);
    } catch (error) {
      logger.error(`Team Coordination: Failed to save workflow`, {
        error: error.message
      });
    }
  }

  async notifyGeneralManager(workflow) {
    try {
      const notificationKey = `gm_notification:${workflow.id}`;
      await saveMemory(this.env, notificationKey, {
        workflowId: workflow.id,
        team: workflow.currentStage,
        escalation: workflow.escalation,
        timestamp: new Date().toISOString(),
        status: 'pending_review'
      });
      
      logger.info(`Team Coordination: GM notification sent for ${workflow.id}`);
    } catch (error) {
      logger.error(`Team Coordination: Failed to notify GM`, {
        error: error.message
      });
    }
  }

  getWorkflowStatus(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return null;
    
    return {
      id: workflow.id,
      team: workflow.team,
      currentStage: workflow.currentStage,
      status: workflow.status,
      qualityScores: workflow.qualityScores,
      decisions: workflow.decisions,
      escalation: workflow.escalation,
      history: workflow.history
    };
  }

  getTeamWorkflowPath(teamName) {
    const path = [teamName];
    let current = teamName;
    
    while (TEAM_WORKFLOW[current]?.next) {
      current = TEAM_WORKFLOW[current].next;
      path.push(current);
    }
    
    return path;
  }
}

export { TeamCoordinationManager, TEAM_WORKFLOW, QUALITY_THRESHOLDS };
