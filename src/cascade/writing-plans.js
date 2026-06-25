// Writing Plans — Detailed task breakdown with predictable execution

import { logger } from '../core/logger.js';

class WritingPlansWorkflow {
  constructor(env) {
    this.env = env;
    this.plans = new Map();
    this.taskHistory = new Map();
  }

  /**
   * Create a new plan
   * @param {string} planId - Plan identifier
   * @param {object} planData - Plan data
   * @returns {object} Created plan
   */
  createPlan(planId, planData) {
    const plan = {
      id: planId,
      title: planData.title,
      description: planData.description,
      objective: planData.objective,
      createdAt: new Date().toISOString(),
      status: 'draft',
      tasks: [],
      dependencies: [],
      progress: 0,
      estimatedDuration: 0,
      actualDuration: 0
    };

    this.plans.set(planId, plan);

    logger.info(`Writing Plans: Created plan ${planId}`, {
      title: plan.title
    });

    return plan;
  }

  /**
   * Add task to plan with time estimation
   * @param {string} planId - Plan identifier
   * @param {object} taskData - Task data
   * @returns {object} Created task
   */
  addTask(planId, taskData) {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    // Generate unique task ID with counter
    const taskCounter = plan.tasks.length + 1;
    const task = {
      id: `task-${Date.now()}-${taskCounter}`,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority || 'medium',
      estimatedMinutes: this.estimateTaskDuration(taskData),
      actualMinutes: 0,
      status: 'pending',
      dependencies: taskData.dependencies || [],
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };

    // Validate task size (2-5 minutes)
    if (task.estimatedMinutes < 2 || task.estimatedMinutes > 5) {
      logger.warn(`Writing Plans: Task size outside recommended range`, {
        taskId: task.id,
        estimatedMinutes: task.estimatedMinutes
      });
    }

    plan.tasks.push(task);
    plan.estimatedDuration += task.estimatedMinutes;

    logger.info(`Writing Plans: Added task to plan ${planId}`, {
      taskId: task.id,
      estimatedMinutes: task.estimatedMinutes
    });

    return task;
  }

  /**
   * Estimate task duration based on complexity
   * @param {object} taskData - Task data
   * @returns {number} Estimated minutes
   */
  estimateTaskDuration(taskData) {
    const complexity = taskData.complexity || 'medium';
    const baseDuration = {
      simple: 2,
      medium: 3,
      complex: 5
    };

    return baseDuration[complexity] || 3;
  }

  /**
   * Add dependency between tasks
   * @param {string} planId - Plan identifier
   * @param {string} taskId - Task identifier
   * @param {string} dependsOnTaskId - Task this depends on
   * @returns {object} Dependency data
   */
  addDependency(planId, taskId, dependsOnTaskId) {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    const task = plan.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const dependsOnTask = plan.tasks.find(t => t.id === dependsOnTaskId);
    if (!dependsOnTask) {
      throw new Error(`Dependency task not found: ${dependsOnTaskId}`);
    }

    // Check for circular dependency
    if (this.hasCircularDependency(plan, taskId, dependsOnTaskId)) {
      throw new Error(`Circular dependency detected between ${taskId} and ${dependsOnTaskId}`);
    }

    if (!task.dependencies.includes(dependsOnTaskId)) {
      task.dependencies.push(dependsOnTaskId);
    }

    const dependency = {
      taskId,
      dependsOn: dependsOnTaskId,
      type: 'sequential'
    };

    plan.dependencies.push(dependency);

    logger.info(`Writing Plans: Added dependency`, {
      taskId,
      dependsOn: dependsOnTaskId
    });

    return dependency;
  }

  /**
   * Check for circular dependency
   * @param {object} plan - Plan object
   * @param {string} taskId - Task identifier
   * @param {string} dependsOnTaskId - Dependency task identifier
   * @returns {boolean} Whether circular dependency exists
   */
  hasCircularDependency(plan, taskId, dependsOnTaskId) {
    if (taskId === dependsOnTaskId) {
      return false; // Self-dependency is not circular
    }

    const visited = new Set();
    const checkCircular = (currentTaskId, targetTaskId) => {
      if (currentTaskId === targetTaskId) return true;
      if (visited.has(currentTaskId)) return false;
      visited.add(currentTaskId);

      const task = plan.tasks.find(t => t.id === currentTaskId);
      if (!task) return false;

      for (const depId of task.dependencies) {
        if (checkCircular(depId, targetTaskId)) return true;
      }

      return false;
    };

    return checkCircular(dependsOnTaskId, taskId);
  }

  /**
   * Start task execution
   * @param {string} planId - Plan identifier
   * @param {string} taskId - Task identifier
   * @returns {object} Updated task
   */
  startTask(planId, taskId) {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    const task = plan.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Check if dependencies are satisfied
    const dependenciesSatisfied = task.dependencies.every(depId => {
      const depTask = plan.tasks.find(t => t.id === depId);
      return depTask && depTask.status === 'completed';
    });

    if (!dependenciesSatisfied) {
      throw new Error(`Task dependencies not satisfied: ${taskId}`);
    }

    task.status = 'in_progress';
    task.startedAt = new Date().toISOString();
    plan.status = 'in_progress';

    this.taskHistory.set(taskId, {
      taskId,
      action: 'started',
      timestamp: task.startedAt
    });

    logger.info(`Writing Plans: Started task ${taskId}`, {
      planId
    });

    return task;
  }

  /**
   * Complete task execution
   * @param {string} planId - Plan identifier
   * @param {string} taskId - Task identifier
   * @param {number} actualMinutes - Actual time taken
   * @returns {object} Updated task
   */
  completeTask(planId, taskId, actualMinutes) {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    const task = plan.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.actualMinutes = actualMinutes;
    plan.actualDuration += actualMinutes;

    // Update plan progress
    plan.progress = this.calculateProgress(plan);

    // Check if all tasks are completed
    if (plan.tasks.every(t => t.status === 'completed')) {
      plan.status = 'completed';
      plan.completedAt = new Date().toISOString();
    }

    this.taskHistory.set(taskId, {
      taskId,
      action: 'completed',
      timestamp: task.completedAt,
      actualMinutes
    });

    logger.info(`Writing Plans: Completed task ${taskId}`, {
      planId,
      actualMinutes,
      estimatedMinutes: task.estimatedMinutes
    });

    return task;
  }

  /**
   * Calculate plan progress
   * @param {object} plan - Plan object
   * @returns {number} Progress percentage
   */
  calculateProgress(plan) {
    if (plan.tasks.length === 0) return 0;

    const completedTasks = plan.tasks.filter(t => t.status === 'completed').length;
    return (completedTasks / plan.tasks.length) * 100;
  }

  /**
   * Get next executable tasks
   * @param {string} planId - Plan identifier
   * @returns {Array} Executable tasks
   */
  getNextTasks(planId) {
    const plan = this.plans.get(planId);
    if (!plan) {
      return [];
    }

    return plan.tasks.filter(task => {
      if (task.status !== 'pending') return false;

      // Check if all dependencies are completed
      const dependenciesSatisfied = task.dependencies.every(depId => {
        const depTask = plan.tasks.find(t => t.id === depId);
        return depTask && depTask.status === 'completed';
      });

      return dependenciesSatisfied;
    });
  }

  /**
   * Get plan summary
   * @param {string} planId - Plan identifier
   * @returns {object} Plan summary
   */
  getPlanSummary(planId) {
    const plan = this.plans.get(planId);
    if (!plan) {
      return null;
    }

    const taskBreakdown = {
      total: plan.tasks.length,
      pending: plan.tasks.filter(t => t.status === 'pending').length,
      inProgress: plan.tasks.filter(t => t.status === 'in_progress').length,
      completed: plan.tasks.filter(t => t.status === 'completed').length
    };

    const executionAccuracy = plan.estimatedDuration > 0
      ? (plan.actualDuration / plan.estimatedDuration) * 100
      : 0;

    return {
      id: plan.id,
      title: plan.title,
      status: plan.status,
      progress: plan.progress,
      taskBreakdown,
      estimatedDuration: plan.estimatedDuration,
      actualDuration: plan.actualDuration,
      executionAccuracy: executionAccuracy.toFixed(1) + '%',
      createdAt: plan.createdAt,
      completedAt: plan.completedAt
    };
  }

  /**
   * Get execution accuracy statistics
   * @param {string} planId - Plan identifier
   * @returns {object} Accuracy statistics
   */
  getExecutionAccuracy(planId) {
    const plan = this.plans.get(planId);
    if (!plan) {
      return null;
    }

    const completedTasks = plan.tasks.filter(t => t.status === 'completed');
    if (completedTasks.length === 0) {
      return {
        averageAccuracy: 0,
        within20Percent: 0,
        totalTasks: 0
      };
    }

    const accuracies = completedTasks.map(task => {
      if (task.estimatedMinutes === 0) return 0;
      return (task.actualMinutes / task.estimatedMinutes) * 100;
    });

    const averageAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    const within20Percent = accuracies.filter(acc => acc >= 80 && acc <= 120).length;

    return {
      averageAccuracy: averageAccuracy.toFixed(1) + '%',
      within20Percent: (within20Percent / completedTasks.length) * 100,
      totalTasks: completedTasks.length
    };
  }

  /**
   * Get all plans
   * @returns {Array} All plans
   */
  getAllPlans() {
    return Array.from(this.plans.values());
  }

  /**
   * Delete plan
   * @param {string} planId - Plan identifier
   * @returns {boolean} Success
   */
  deletePlan(planId) {
    const deleted = this.plans.delete(planId);

    if (deleted) {
      logger.info(`Writing Plans: Deleted plan ${planId}`);
    }

    return deleted;
  }

  /**
   * Clear all plans
   */
  clearAllPlans() {
    this.plans.clear();
    this.taskHistory.clear();
    logger.info(`Writing Plans: Cleared all plans`);
  }
}

export { WritingPlansWorkflow };
