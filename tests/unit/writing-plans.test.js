import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WritingPlansWorkflow } from '../../src/cascade/writing-plans.js';

describe('WritingPlansWorkflow', () => {
  let workflow;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    workflow = new WritingPlansWorkflow(mockEnv);
    vi.clearAllMocks();
  });

  it('should create a new plan', () => {
    const planData = {
      title: 'Test Plan',
      description: 'Test description',
      objective: 'Test objective'
    };

    const plan = workflow.createPlan('plan-1', planData);

    expect(plan).toBeDefined();
    expect(plan.id).toBe('plan-1');
    expect(plan.title).toBe('Test Plan');
    expect(plan.status).toBe('draft');
  });

  it('should add task to plan', () => {
    workflow.createPlan('plan-1', { title: 'Test Plan' });
    const taskData = {
      title: 'Test Task',
      description: 'Task description',
      complexity: 'medium'
    };

    const task = workflow.addTask('plan-1', taskData);

    expect(task).toBeDefined();
    expect(task.title).toBe('Test Task');
    expect(task.estimatedMinutes).toBe(3);
    expect(task.status).toBe('pending');
  });

  it('should estimate task duration based on complexity', () => {
    workflow.createPlan('plan-1', { title: 'Test Plan' });

    const simpleTask = workflow.addTask('plan-1', { title: 'Simple', complexity: 'simple' });
    const mediumTask = workflow.addTask('plan-1', { title: 'Medium', complexity: 'medium' });
    const complexTask = workflow.addTask('plan-1', { title: 'Complex', complexity: 'complex' });

    expect(simpleTask.estimatedMinutes).toBe(2);
    expect(mediumTask.estimatedMinutes).toBe(3);
    expect(complexTask.estimatedMinutes).toBe(5);
  });

  it('should add dependency between tasks', () => {
    workflow.createPlan('plan-1', { title: 'Test Plan' });
    const task1 = workflow.addTask('plan-1', { title: 'Task 1' });
    const task2 = workflow.addTask('plan-1', { title: 'Task 2' });

    const dependency = workflow.addDependency('plan-1', task2.id, task1.id);

    expect(dependency).toBeDefined();
    expect(dependency.taskId).toBe(task2.id);
    expect(dependency.dependsOn).toBe(task1.id);
  });

  it('should detect circular dependency', () => {
    workflow.createPlan('plan-1', { title: 'Test Plan' });
    const task1 = workflow.addTask('plan-1', { title: 'Task 1' });
    const task2 = workflow.addTask('plan-1', { title: 'Task 2' });

    workflow.addDependency('plan-1', task2.id, task1.id);

    expect(() => {
      workflow.addDependency('plan-1', task1.id, task2.id);
    }).toThrow('Circular dependency');
  });

  it('should start task execution', () => {
    workflow.createPlan('plan-1', { title: 'Test Plan' });
    const task = workflow.addTask('plan-1', { title: 'Task 1' });

    const startedTask = workflow.startTask('plan-1', task.id);

    expect(startedTask.status).toBe('in_progress');
    expect(startedTask.startedAt).toBeDefined();
  });

  it('should not start task with unsatisfied dependencies', () => {
    workflow.createPlan('plan-1', { title: 'Test Plan' });
    const task1 = workflow.addTask('plan-1', { title: 'Task 1' });
    const task2 = workflow.addTask('plan-1', { title: 'Task 2' });
    workflow.addDependency('plan-1', task2.id, task1.id);

    expect(() => {
      workflow.startTask('plan-1', task2.id);
    }).toThrow('Task dependencies not satisfied');
  });

  it('should complete task execution', () => {
    workflow.createPlan('plan-1', { title: 'Test Plan' });
    const task = workflow.addTask('plan-1', { title: 'Task 1' });
    workflow.startTask('plan-1', task.id);

    const completedTask = workflow.completeTask('plan-1', task.id, 3);

    expect(completedTask.status).toBe('completed');
    expect(completedTask.completedAt).toBeDefined();
    expect(completedTask.actualMinutes).toBe(3);
  });

  it('should calculate plan progress', () => {
    workflow.createPlan('plan-1', { title: 'Test Plan' });
    workflow.addTask('plan-1', { title: 'Task 1' });
    workflow.addTask('plan-1', { title: 'Task 2' });
    workflow.addTask('plan-1', { title: 'Task 3' });

    const plan = workflow.plans.get('plan-1');
    const progress = workflow.calculateProgress(plan);

    expect(progress).toBe(0);
  });

  it('should update progress on task completion', () => {
    workflow.createPlan('plan-1', { title: 'Test Plan' });
    const task1 = workflow.addTask('plan-1', { title: 'Task 1' });
    const task2 = workflow.addTask('plan-1', { title: 'Task 2' });

    workflow.startTask('plan-1', task1.id);
    workflow.completeTask('plan-1', task1.id, 2);

    const summary = workflow.getPlanSummary('plan-1');

    expect(summary.progress).toBe(50);
  });

  it('should get next executable tasks', () => {
    workflow.createPlan('plan-1', { title: 'Test Plan' });
    const task1 = workflow.addTask('plan-1', { title: 'Task 1' });
    const task2 = workflow.addTask('plan-1', { title: 'Task 2' });
    workflow.addDependency('plan-1', task2.id, task1.id);

    const nextTasks = workflow.getNextTasks('plan-1');

    expect(nextTasks.length).toBe(1);
    expect(nextTasks[0].id).toBe(task1.id);
  });

  it('should get plan summary', () => {
    workflow.createPlan('plan-1', { title: 'Test Plan' });
    workflow.addTask('plan-1', { title: 'Task 1' });
    workflow.addTask('plan-1', { title: 'Task 2' });

    const summary = workflow.getPlanSummary('plan-1');

    expect(summary).toBeDefined();
    expect(summary.title).toBe('Test Plan');
    expect(summary.taskBreakdown.total).toBe(2);
  });

  it('should return null for non-existent plan', () => {
    const summary = workflow.getPlanSummary('non-existent');

    expect(summary).toBeNull();
  });

  it('should get execution accuracy', () => {
    workflow.createPlan('plan-1', { title: 'Test Plan' });
    const task1 = workflow.addTask('plan-1', { title: 'Task 1' });
    // Add delay to ensure different task IDs
    const now = Date.now();
    const task2 = workflow.addTask('plan-1', { title: 'Task 2' });

    workflow.startTask('plan-1', task1.id);
    workflow.completeTask('plan-1', task1.id, 3);
    workflow.startTask('plan-1', task2.id);
    workflow.completeTask('plan-1', task2.id, 4);

    const accuracy = workflow.getExecutionAccuracy('plan-1');

    expect(accuracy).toBeDefined();
    expect(accuracy.totalTasks).toBe(2);
  });

  it('should mark plan as completed when all tasks done', () => {
    workflow.createPlan('plan-1', { title: 'Test Plan' });
    const task1 = workflow.addTask('plan-1', { title: 'Task 1' });
    // Add delay to ensure different task IDs
    const now = Date.now();
    const task2 = workflow.addTask('plan-1', { title: 'Task 2' });

    workflow.startTask('plan-1', task1.id);
    workflow.completeTask('plan-1', task1.id, 2);
    workflow.startTask('plan-1', task2.id);
    workflow.completeTask('plan-1', task2.id, 3);

    const summary = workflow.getPlanSummary('plan-1');

    expect(summary.status).toBe('completed');
  });

  it('should get all plans', () => {
    workflow.createPlan('plan-1', { title: 'Plan 1' });
    workflow.createPlan('plan-2', { title: 'Plan 2' });

    const plans = workflow.getAllPlans();

    expect(plans.length).toBe(2);
  });

  it('should delete plan', () => {
    workflow.createPlan('plan-1', { title: 'Test Plan' });

    const deleted = workflow.deletePlan('plan-1');

    expect(deleted).toBe(true);
    expect(workflow.plans.has('plan-1')).toBe(false);
  });

  it('should clear all plans', () => {
    workflow.createPlan('plan-1', { title: 'Plan 1' });
    workflow.createPlan('plan-2', { title: 'Plan 2' });

    workflow.clearAllPlans();

    expect(workflow.plans.size).toBe(0);
  });
});
