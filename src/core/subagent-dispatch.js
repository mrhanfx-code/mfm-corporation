// Subagent Dispatch System - Parallel Task Execution Framework

import { logger } from './logger.js';

/**
 * Task Status Enum
 */
const TaskStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REVIEWING: 'reviewing',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

/**
 * Task Priority Enum
 */
const TaskPriority = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

/**
 * Subagent Task Definition
 */
class SubagentTask {
  constructor(options = {}) {
    this.id = options.id || this.generateId();
    this.agent = options.agent; // Agent name/type
    this.description = options.description;
    this.instructions = options.instructions;
    this.dependencies = options.dependencies || []; // Task IDs this depends on
    this.priority = options.priority || TaskPriority.MEDIUM;
    this.status = TaskStatus.PENDING;
    this.result = null;
    this.error = null;
    this.startTime = null;
    this.endTime = null;
    this.reviewer = options.reviewer; // Agent for review stage
    this.reviewResult = null;
    this.metadata = options.metadata || {};
  }

  generateId() {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if task is ready to run (all dependencies completed)
   * @param {Map} tasks - All tasks map
   * @returns {boolean}
   */
  isReady(tasks) {
    for (const depId of this.dependencies) {
      const depTask = tasks.get(depId);
      if (!depTask || depTask.status !== TaskStatus.COMPLETED) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get task duration
   * @returns {number} Duration in milliseconds
   */
  getDuration() {
    if (!this.startTime || !this.endTime) return 0;
    return this.endTime - this.startTime;
  }
}

/**
 * Subagent Dispatch System
 * Manages parallel task execution with dependency resolution
 */
class SubagentDispatch {
  constructor(options = {}) {
    this.maxParallelTasks = options.maxParallelTasks || 4;
    this.tasks = new Map();
    this.runningTasks = new Set();
    this.agentRegistry = new Map(); // Agent name -> agent instance
    this.taskQueue = [];
    this.completedTasks = new Set();
    this.failedTasks = new Set();
    this.enableTwoStageReview = options.enableTwoStageReview !== false;
  }

  /**
   * Register an agent for dispatch
   * @param {string} name - Agent name
   * @param {object} agent - Agent instance
   */
  registerAgent(name, agent) {
    this.agentRegistry.set(name, agent);
  }

  /**
   * Create a new task
   * @param {object} options - Task options
   * @returns {SubagentTask}
   */
  createTask(options) {
    const task = new SubagentTask(options);
    this.tasks.set(task.id, task);
    this.taskQueue.push(task.id);
    return task;
  }

  /**
   * Get task by ID
   * @param {string} taskId - Task ID
   * @returns {SubagentTask}
   */
  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   * @returns {Array<SubagentTask>}
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by status
   * @param {string} status - Task status
   * @returns {Array<SubagentTask>}
   */
  getTasksByStatus(status) {
    return this.getAllTasks().filter(task => task.status === status);
  }

  /**
   * Execute a single task
   * @param {SubagentTask} task - Task to execute
   * @param {object} env - Environment context
   * @returns {Promise<object>} Task result
   */
  async executeTask(task, env) {
    const agent = this.agentRegistry.get(task.agent);
    if (!agent) {
      throw new Error(`Agent ${task.agent} not registered`);
    }

    task.status = TaskStatus.RUNNING;
    task.startTime = Date.now();
    this.runningTasks.add(task.id);

    try {
      // Execute task with agent
      const result = await agent.execute(task.instructions, env);
      
      task.result = result;
      task.status = TaskStatus.COMPLETED;
      task.endTime = Date.now();
      
      this.runningTasks.delete(task.id);
      this.completedTasks.add(task.id);
      
      logger.info(`Task ${task.id} completed by ${task.agent}`);
      
      // Two-stage review if enabled
      if (this.enableTwoStageReview && task.reviewer) {
        await this.reviewTask(task, env);
      }
      
      return result;
    } catch (error) {
      task.error = error.message;
      task.status = TaskStatus.FAILED;
      task.endTime = Date.now();
      
      this.runningTasks.delete(task.id);
      this.failedTasks.add(task.id);
      
      logger.error(`Task ${task.id} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Review a task result
   * @param {SubagentTask} task - Task to review
   * @param {object} env - Environment context
   * @returns {Promise<object>} Review result
   */
  async reviewTask(task, env) {
    const reviewer = this.agentRegistry.get(task.reviewer);
    if (!reviewer) {
      logger.warn(`Reviewer ${task.reviewer} not registered, skipping review`);
      return null;
    }

    task.status = TaskStatus.REVIEWING;
    
    try {
      const reviewResult = await reviewer.review(task.result, task.instructions, env);
      task.reviewResult = reviewResult;
      
      if (reviewResult.approved) {
        task.status = TaskStatus.APPROVED;
      } else {
        task.status = TaskStatus.REJECTED;
        task.reviewResult = reviewResult;
      }
      
      logger.info(`Task ${task.id} review ${task.status}`);
      return reviewResult;
    } catch (error) {
      logger.error(`Task ${task.id} review failed: ${error.message}`);
      task.status = TaskStatus.COMPLETED; // Fallback to completed
      return null;
    }
  }

  /**
   * Execute all tasks in dependency order with parallel execution
   * @param {object} env - Environment context
   * @returns {Promise<object>} Execution summary
   */
  async executeAll(env) {
    const summary = {
      total: this.tasks.size,
      completed: 0,
      failed: 0,
      approved: 0,
      rejected: 0,
      duration: 0,
      startTime: Date.now()
    };

    // Process tasks until all are done
    while (this.completedTasks.size + this.failedTasks.size < this.tasks.size) {
      // Find ready tasks that aren't running
      const readyTasks = this.taskQueue
        .filter(taskId => {
          const task = this.tasks.get(taskId);
          return task.status === TaskStatus.PENDING && task.isReady(this.tasks);
        })
        .slice(0, this.maxParallelTasks - this.runningTasks.size);

      if (readyTasks.length === 0 && this.runningTasks.size === 0) {
        // No tasks can run - likely circular dependency or all failed
        const pendingTasks = this.getTasksByStatus(TaskStatus.PENDING);
        if (pendingTasks.length > 0) {
          logger.error('Circular dependency detected or all tasks failed');
          pendingTasks.forEach(task => {
            task.status = TaskStatus.FAILED;
            task.error = 'Could not resolve dependencies';
            this.failedTasks.add(task.id);
          });
        }
        break;
      }

      // Execute ready tasks in parallel
      const executionPromises = readyTasks.map(taskId => {
        const task = this.tasks.get(taskId);
        return this.executeTask(task, env).catch(error => {
          logger.error(`Task ${taskId} execution failed: ${error.message}`);
        });
      });

      await Promise.all(executionPromises);
    }

    summary.endTime = Date.now();
    summary.duration = summary.endTime - summary.startTime;
    summary.completed = this.completedTasks.size;
    summary.failed = this.failedTasks.size;
    summary.approved = this.getTasksByStatus(TaskStatus.APPROVED).length;
    summary.rejected = this.getTasksByStatus(TaskStatus.REJECTED).length;

    return summary;
  }

  /**
   * Get execution statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const allTasks = this.getAllTasks();
    const completedTasks = allTasks.filter(t => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.APPROVED);
    const failedTasks = allTasks.filter(t => t.status === TaskStatus.FAILED);
    
    const totalDuration = completedTasks.reduce((sum, task) => sum + task.getDuration(), 0);
    const avgDuration = completedTasks.length > 0 ? totalDuration / completedTasks.length : 0;

    return {
      total: allTasks.length,
      completed: completedTasks.length,
      failed: failedTasks.length,
      running: this.runningTasks.size,
      pending: this.getTasksByStatus(TaskStatus.PENDING).length,
      totalDuration,
      avgDuration,
      successRate: allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0
    };
  }

  /**
   * Clear all tasks
   */
  clear() {
    this.tasks.clear();
    this.taskQueue = [];
    this.runningTasks.clear();
    this.completedTasks.clear();
    this.failedTasks.clear();
  }

  /**
   * Enable or disable two-stage review
   * @param {boolean} enabled - Enable flag
   */
  setTwoStageReview(enabled) {
    this.enableTwoStageReview = enabled;
  }
}

/**
 * Subagent Coordinator
 * High-level coordination for subagent-driven development
 */
class SubagentCoordinator {
  constructor(options = {}) {
    this.dispatch = new SubagentDispatch(options);
    this.taskHistory = [];
    this.performanceMetrics = {
      totalTasks: 0,
      totalDuration: 0,
      parallelSpeedup: 1.0,
      avgParallelTasks: 0
    };
  }

  /**
   * Register an agent
   * @param {string} name - Agent name
   * @param {object} agent - Agent instance
   */
  registerAgent(name, agent) {
    this.dispatch.registerAgent(name, agent);
  }

  /**
   * Create a development task
   * @param {object} options - Task options
   * @returns {SubagentTask}
   */
  createDevelopmentTask(options) {
    return this.dispatch.createTask({
      ...options,
      metadata: {
        ...options.metadata,
        type: 'development'
      }
    });
  }

  /**
   * Execute development workflow
   * @param {object} env - Environment context
   * @returns {Promise<object>} Execution summary
   */
  async executeDevelopmentWorkflow(env) {
    const startTime = Date.now();
    const summary = await this.dispatch.executeAll(env);
    const endTime = Date.now();

    // Calculate performance metrics
    const sequentialDuration = this.calculateSequentialDuration();
    const parallelDuration = summary.duration;
    const speedup = sequentialDuration > 0 ? sequentialDuration / parallelDuration : 1.0;

    this.performanceMetrics.totalTasks += summary.total;
    this.performanceMetrics.totalDuration += parallelDuration;
    this.performanceMetrics.parallelSpeedup = speedup;
    this.performanceMetrics.avgParallelTasks = this.dispatch.maxParallelTasks;

    // Record history
    this.taskHistory.push({
      timestamp: Date.now(),
      summary,
      metrics: { ...this.performanceMetrics }
    });

    return {
      ...summary,
      speedup,
      sequentialDuration,
      performanceMetrics: { ...this.performanceMetrics }
    };
  }

  /**
   * Calculate sequential execution duration
   * @returns {number} Duration in milliseconds
   */
  calculateSequentialDuration() {
    const completedTasks = this.dispatch.getTasksByStatus(TaskStatus.COMPLETED);
    return completedTasks.reduce((sum, task) => sum + task.getDuration(), 0);
  }

  /**
   * Get performance metrics
   * @returns {object} Performance metrics
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Get task history
   * @returns {Array} Task history
   */
  getTaskHistory() {
    return [...this.taskHistory];
  }

  /**
   * Clear all data
   */
  clear() {
    this.dispatch.clear();
    this.taskHistory = [];
    this.performanceMetrics = {
      totalTasks: 0,
      totalDuration: 0,
      parallelSpeedup: 1.0,
      avgParallelTasks: 0
    };
  }
}

export { 
  SubagentTask, 
  SubagentDispatch, 
  SubagentCoordinator, 
  TaskStatus, 
  TaskPriority 
};
