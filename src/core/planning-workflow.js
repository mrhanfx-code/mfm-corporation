// Planning Workflow — Structured plan creation with task breakdown

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';

class PlanningWorkflow {
  constructor(env) {
    this.env = env;
    this.activePlans = new Map();
  }

  async createPlan(topic, requirements, context = {}) {
    const planId = `plan:${Date.now()}`;
    
    const plan = {
      id: planId,
      topic,
      requirements,
      context,
      status: 'draft',
      createdAt: new Date().toISOString(),
      phases: [],
      tasks: [],
      dependencies: new Map(),
      timeline: {},
      risks: [],
      successCriteria: [],
      history: []
    };
    
    this.activePlans.set(planId, plan);
    
    logger.info(`Planning: Created plan ${planId}`, {
      topic,
      requirements: requirements.length
    });
    
    await this.savePlan(plan);
    
    return plan;
  }

  async addPhase(planId, phase) {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    
    const phaseId = `phase:${Date.now()}`;
    
    const phaseData = {
      id: phaseId,
      name: phase.name,
      description: phase.description,
      order: plan.phases.length,
      tasks: [],
      estimatedDuration: phase.estimatedDuration || '1 week',
      dependencies: phase.dependencies || [],
      createdAt: new Date().toISOString()
    };
    
    plan.phases.push(phaseData);
    
    plan.history.push({
      type: 'phase_added',
      phaseId,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Planning: Added phase ${phase.name} to plan ${planId}`);
    
    await this.savePlan(plan);
    
    return phaseData;
  }

  async addTask(planId, phaseId, task) {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    
    const phase = plan.phases.find(p => p.id === phaseId);
    if (!phase) {
      throw new Error(`Phase not found: ${phaseId}`);
    }
    
    const taskId = `task:${Date.now()}`;
    
    const taskData = {
      id: taskId,
      title: task.title,
      description: task.description,
      priority: task.priority || 'medium',
      estimatedEffort: task.estimatedEffort || '1 day',
      assignee: task.assignee || null,
      status: 'pending',
      dependencies: task.dependencies || [],
      acceptanceCriteria: task.acceptanceCriteria || [],
      createdAt: new Date().toISOString()
    };
    
    phase.tasks.push(taskData);
    plan.tasks.push(taskData);
    
    // Track dependencies
    for (const dep of task.dependencies) {
      if (!plan.dependencies.has(taskId)) {
        plan.dependencies.set(taskId, []);
      }
      plan.dependencies.get(taskId).push(dep);
    }
    
    plan.history.push({
      type: 'task_added',
      taskId,
      phaseId,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Planning: Added task ${task.title} to phase ${phase.name}`);
    
    await this.savePlan(plan);
    
    return taskData;
  }

  async addRisk(planId, risk) {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    
    const riskData = {
      id: `risk:${Date.now()}`,
      description: risk.description,
      likelihood: risk.likelihood || 'medium',
      impact: risk.impact || 'medium',
      mitigation: risk.mitigation || '',
      owner: risk.owner || null,
      createdAt: new Date().toISOString()
    };
    
    plan.risks.push(riskData);
    
    plan.history.push({
      type: 'risk_added',
      riskId: riskData.id,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Planning: Added risk to plan ${planId}`, {
      likelihood: riskData.likelihood,
      impact: riskData.impact
    });
    
    await this.savePlan(plan);
    
    return riskData;
  }

  async addSuccessCriteria(planId, criteria) {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    
    const criteriaData = {
      id: `criteria:${Date.now()}`,
      description: criteria.description,
      metric: criteria.metric || 'boolean',
      target: criteria.target || true,
      measurement: criteria.measurement || 'manual',
      createdAt: new Date().toISOString()
    };
    
    plan.successCriteria.push(criteriaData);
    
    plan.history.push({
      type: 'criteria_added',
      criteriaId: criteriaData.id,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Planning: Added success criteria to plan ${planId}`);
    
    await this.savePlan(plan);
    
    return criteriaData;
  }

  async generateTimeline(planId) {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    
    let currentDate = new Date();
    const timeline = {
      startDate: currentDate.toISOString(),
      phases: [],
      totalDuration: 0
    };
    
    for (const phase of plan.phases) {
      const phaseStart = new Date(currentDate);
      const phaseDuration = this.parseDuration(phase.estimatedDuration);
      const phaseEnd = new Date(currentDate.getTime() + phaseDuration);
      
      timeline.phases.push({
        phaseId: phase.id,
        name: phase.name,
        startDate: phaseStart.toISOString(),
        endDate: phaseEnd.toISOString(),
        duration: phase.estimatedDuration
      });
      
      currentDate = phaseEnd;
      timeline.totalDuration += phaseDuration;
    }
    
    timeline.endDate = currentDate.toISOString();
    plan.timeline = timeline;
    
    plan.history.push({
      type: 'timeline_generated',
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Planning: Generated timeline for plan ${planId}`, {
      totalDuration: `${Math.round(timeline.totalDuration / (1000 * 60 * 60 * 24))} days`
    });
    
    await this.savePlan(plan);
    
    return timeline;
  }

  parseDuration(durationStr) {
    // Parse duration string like "1 week", "2 days", "3 hours"
    const match = durationStr.match(/(\d+)\s*(week|day|hour|minute)s?/i);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default to 1 week
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    const multipliers = {
      week: 7 * 24 * 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      hour: 60 * 60 * 1000,
      minute: 60 * 1000
    };
    
    return value * (multipliers[unit] || multipliers.day);
  }

  async validatePlan(planId) {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    
    const validation = {
      valid: true,
      issues: [],
      warnings: []
    };
    
    // Check if plan has phases
    if (plan.phases.length === 0) {
      validation.valid = false;
      validation.issues.push('Plan has no phases');
    }
    
    // Check if plan has tasks
    if (plan.tasks.length === 0) {
      validation.valid = false;
      validation.issues.push('Plan has no tasks');
    }
    
    // Check if all tasks are assigned
    const unassignedTasks = plan.tasks.filter(t => !t.assignee);
    if (unassignedTasks.length > 0) {
      validation.warnings.push(`${unassignedTasks.length} tasks are unassigned`);
    }
    
    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(plan);
    if (circularDeps.length > 0) {
      validation.valid = false;
      validation.issues.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
    }
    
    // Check if timeline is generated
    if (!plan.timeline || !plan.timeline.startDate) {
      validation.warnings.push('Timeline not generated');
    }
    
    // Check if success criteria are defined
    if (plan.successCriteria.length === 0) {
      validation.warnings.push('No success criteria defined');
    }
    
    plan.validation = validation;
    plan.status = validation.valid ? 'validated' : 'invalid';
    
    plan.history.push({
      type: 'validation',
      valid: validation.valid,
      issues: validation.issues.length,
      warnings: validation.warnings.length,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Planning: Validated plan ${planId}`, {
      valid: validation.valid,
      issues: validation.issues.length,
      warnings: validation.warnings.length
    });
    
    await this.savePlan(plan);
    
    return validation;
  }

  detectCircularDependencies(plan) {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];
    
    const dfs = (taskId) => {
      visited.add(taskId);
      recursionStack.add(taskId);
      
      const deps = plan.dependencies.get(taskId) || [];
      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (dfs(dep)) return true;
        } else if (recursionStack.has(dep)) {
          cycles.push(`${taskId} -> ${dep}`);
          return true;
        }
      }
      
      recursionStack.delete(taskId);
      return false;
    };
    
    for (const task of plan.tasks) {
      if (!visited.has(task.id)) {
        dfs(task.id);
      }
    }
    
    return cycles;
  }

  async approvePlan(planId, approver) {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    
    if (plan.status !== 'validated') {
      throw new Error('Plan must be validated before approval');
    }
    
    plan.status = 'approved';
    plan.approvedBy = approver;
    plan.approvedAt = new Date().toISOString();
    
    plan.history.push({
      type: 'approval',
      approver,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Planning: Approved plan ${planId}`, {
      approver
    });
    
    await this.savePlan(plan);
    
    return plan;
  }

  async savePlan(plan) {
    try {
      const memoryKey = `plan:${plan.id}`;
      await saveMemory(this.env, memoryKey, plan);
    } catch (error) {
      logger.error(`Planning: Failed to save plan`, {
        error: error.message
      });
    }
  }

  getPlan(planId) {
    return this.activePlans.get(planId) || null;
  }

  getAllPlans() {
    return Array.from(this.activePlans.values());
  }

  getPlanStatistics(planId) {
    const plan = this.activePlans.get(planId);
    if (!plan) return null;
    
    const taskStats = {
      total: plan.tasks.length,
      pending: plan.tasks.filter(t => t.status === 'pending').length,
      inProgress: plan.tasks.filter(t => t.status === 'in_progress').length,
      completed: plan.tasks.filter(t => t.status === 'completed').length
    };
    
    const riskStats = {
      total: plan.risks.length,
      high: plan.risks.filter(r => r.impact === 'high').length,
      medium: plan.risks.filter(r => r.impact === 'medium').length,
      low: plan.risks.filter(r => r.impact === 'low').length
    };
    
    return {
      phases: plan.phases.length,
      tasks: taskStats,
      risks: riskStats,
      successCriteria: plan.successCriteria.length,
      status: plan.status
    };
  }
}

export { PlanningWorkflow };
