import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  SubagentTask, 
  SubagentDispatch, 
  SubagentCoordinator, 
  TaskStatus, 
  TaskPriority 
} from '../../src/core/subagent-dispatch.js';

describe('SubagentTask', () => {
  it('should create task with generated ID', () => {
    const task = new SubagentTask({
      agent: 'test-agent',
      description: 'Test task'
    });
    expect(task.id).toMatch(/^task-\d+-[a-z0-9]+$/);
  });

  it('should create task with custom ID', () => {
    const task = new SubagentTask({
      id: 'custom-id',
      agent: 'test-agent',
      description: 'Test task'
    });
    expect(task.id).toBe('custom-id');
  });

  it('should set default status to pending', () => {
    const task = new SubagentTask({
      agent: 'test-agent',
      description: 'Test task'
    });
    expect(task.status).toBe(TaskStatus.PENDING);
  });

  it('should check if task is ready with no dependencies', () => {
    const task = new SubagentTask({
      agent: 'test-agent',
      description: 'Test task'
    });
    expect(task.isReady(new Map())).toBe(true);
  });

  it('should check if task is ready with completed dependencies', () => {
    const task = new SubagentTask({
      agent: 'test-agent',
      description: 'Test task',
      dependencies: ['dep1']
    });
    
    const tasks = new Map();
    tasks.set('dep1', { status: TaskStatus.COMPLETED });
    
    expect(task.isReady(tasks)).toBe(true);
  });

  it('should check if task is not ready with pending dependencies', () => {
    const task = new SubagentTask({
      agent: 'test-agent',
      description: 'Test task',
      dependencies: ['dep1']
    });
    
    const tasks = new Map();
    tasks.set('dep1', { status: TaskStatus.PENDING });
    
    expect(task.isReady(tasks)).toBe(false);
  });

  it('should calculate duration correctly', () => {
    const task = new SubagentTask({
      agent: 'test-agent',
      description: 'Test task'
    });
    task.startTime = Date.now();
    task.endTime = task.startTime + 1000;
    
    expect(task.getDuration()).toBe(1000);
  });

  it('should return 0 duration if not completed', () => {
    const task = new SubagentTask({
      agent: 'test-agent',
      description: 'Test task'
    });
    expect(task.getDuration()).toBe(0);
  });
});

describe('SubagentDispatch', () => {
  let dispatch;
  let mockAgent;
  let mockEnv;

  beforeEach(() => {
    dispatch = new SubagentDispatch({ maxParallelTasks: 2 });
    mockEnv = { test: 'env' };
    
    mockAgent = {
      execute: vi.fn().mockResolvedValue({ success: true }),
      review: vi.fn().mockResolvedValue({ approved: true })
    };
    
    dispatch.registerAgent('test-agent', mockAgent);
  });

  it('should register agent', () => {
    dispatch.registerAgent('another-agent', mockAgent);
    expect(dispatch.agentRegistry.has('another-agent')).toBe(true);
  });

  it('should create task', () => {
    const task = dispatch.createTask({
      agent: 'test-agent',
      description: 'Test task',
      instructions: 'Do something'
    });
    
    expect(task).toBeInstanceOf(SubagentTask);
    expect(dispatch.tasks.has(task.id)).toBe(true);
  });

  it('should get task by ID', () => {
    const task = dispatch.createTask({
      agent: 'test-agent',
      description: 'Test task'
    });
    
    const retrieved = dispatch.getTask(task.id);
    expect(retrieved).toBe(task);
  });

  it('should get all tasks', () => {
    dispatch.createTask({ agent: 'test-agent', description: 'Task 1' });
    dispatch.createTask({ agent: 'test-agent', description: 'Task 2' });
    
    const allTasks = dispatch.getAllTasks();
    expect(allTasks.length).toBe(2);
  });

  it('should get tasks by status', () => {
    const task1 = dispatch.createTask({ agent: 'test-agent', description: 'Task 1' });
    const task2 = dispatch.createTask({ agent: 'test-agent', description: 'Task 2' });
    
    task1.status = TaskStatus.COMPLETED;
    
    const completedTasks = dispatch.getTasksByStatus(TaskStatus.COMPLETED);
    expect(completedTasks.length).toBe(1);
    expect(completedTasks[0]).toBe(task1);
  });

  it('should execute single task', async () => {
    const task = dispatch.createTask({
      agent: 'test-agent',
      description: 'Test task',
      instructions: 'Do something'
    });
    
    const result = await dispatch.executeTask(task, mockEnv);
    
    expect(result).toEqual({ success: true });
    expect(task.status).toBe(TaskStatus.COMPLETED);
    expect(task.result).toEqual({ success: true });
    expect(mockAgent.execute).toHaveBeenCalledWith('Do something', mockEnv);
  });

  it('should handle task execution failure', async () => {
    mockAgent.execute.mockRejectedValue(new Error('Execution failed'));
    
    const task = dispatch.createTask({
      agent: 'test-agent',
      description: 'Test task',
      instructions: 'Do something'
    });
    
    await expect(dispatch.executeTask(task, mockEnv)).rejects.toThrow('Execution failed');
    expect(task.status).toBe(TaskStatus.FAILED);
    expect(task.error).toBe('Execution failed');
  });

  it('should execute task with two-stage review', async () => {
    const reviewer = {
      review: vi.fn().mockResolvedValue({ approved: true, comments: 'Good' })
    };
    
    dispatch.registerAgent('reviewer', reviewer);
    
    const task = dispatch.createTask({
      agent: 'test-agent',
      description: 'Test task',
      instructions: 'Do something',
      reviewer: 'reviewer'
    });
    
    await dispatch.executeTask(task, mockEnv);
    
    expect(task.status).toBe(TaskStatus.APPROVED);
    expect(task.reviewResult).toEqual({ approved: true, comments: 'Good' });
    expect(reviewer.review).toHaveBeenCalledWith({ success: true }, 'Do something', mockEnv);
  });

  it('should reject task in review', async () => {
    const reviewer = {
      review: vi.fn().mockResolvedValue({ approved: false, comments: 'Needs work' })
    };
    
    dispatch.registerAgent('reviewer', reviewer);
    
    const task = dispatch.createTask({
      agent: 'test-agent',
      description: 'Test task',
      instructions: 'Do something',
      reviewer: 'reviewer'
    });
    
    await dispatch.executeTask(task, mockEnv);
    
    expect(task.status).toBe(TaskStatus.REJECTED);
    expect(task.reviewResult).toEqual({ approved: false, comments: 'Needs work' });
  });

  it('should execute all tasks with dependencies', async () => {
    const task1 = dispatch.createTask({
      agent: 'test-agent',
      description: 'Task 1',
      instructions: 'First task'
    });
    
    const task2 = dispatch.createTask({
      agent: 'test-agent',
      description: 'Task 2',
      instructions: 'Second task',
      dependencies: [task1.id]
    });
    
    const summary = await dispatch.executeAll(mockEnv);
    
    expect(summary.total).toBe(2);
    expect(summary.completed).toBe(2);
    expect(summary.failed).toBe(0);
  });

  it('should execute tasks in parallel when possible', async () => {
    const task1 = dispatch.createTask({
      agent: 'test-agent',
      description: 'Task 1',
      instructions: 'First task'
    });
    
    const task2 = dispatch.createTask({
      agent: 'test-agent',
      description: 'Task 2',
      instructions: 'Second task'
    });
    
    const summary = await dispatch.executeAll(mockEnv);
    
    expect(summary.total).toBe(2);
    expect(summary.completed).toBe(2);
  });

  it('should respect max parallel tasks limit', async () => {
    dispatch = new SubagentDispatch({ maxParallelTasks: 1 });
    dispatch.registerAgent('test-agent', mockAgent);
    
    const task1 = dispatch.createTask({
      agent: 'test-agent',
      description: 'Task 1',
      instructions: 'First task'
    });
    
    const task2 = dispatch.createTask({
      agent: 'test-agent',
      description: 'Task 2',
      instructions: 'Second task'
    });
    
    const summary = await dispatch.executeAll(mockEnv);
    
    expect(summary.total).toBe(2);
    expect(summary.completed).toBe(2);
  });

  it('should get statistics', async () => {
    dispatch.createTask({ agent: 'test-agent', description: 'Task 1', instructions: 'Task 1' });
    dispatch.createTask({ agent: 'test-agent', description: 'Task 2', instructions: 'Task 2' });
    
    await dispatch.executeAll(mockEnv);
    
    const stats = dispatch.getStatistics();
    
    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(2);
    expect(stats.failed).toBe(0);
    expect(stats.successRate).toBe(100);
  });

  it('should clear all tasks', () => {
    dispatch.createTask({ agent: 'test-agent', description: 'Task 1' });
    dispatch.createTask({ agent: 'test-agent', description: 'Task 2' });
    
    dispatch.clear();
    
    expect(dispatch.tasks.size).toBe(0);
    expect(dispatch.taskQueue.length).toBe(0);
  });

  it('should toggle two-stage review', () => {
    dispatch.setTwoStageReview(false);
    expect(dispatch.enableTwoStageReview).toBe(false);
    
    dispatch.setTwoStageReview(true);
    expect(dispatch.enableTwoStageReview).toBe(true);
  });
});

describe('SubagentCoordinator', () => {
  let coordinator;
  let mockAgent;
  let mockEnv;

  beforeEach(() => {
    coordinator = new SubagentCoordinator({ maxParallelTasks: 2 });
    mockEnv = { test: 'env' };
    
    mockAgent = {
      execute: vi.fn().mockResolvedValue({ success: true }),
      review: vi.fn().mockResolvedValue({ approved: true })
    };
    
    coordinator.registerAgent('test-agent', mockAgent);
  });

  it('should register agent', () => {
    coordinator.registerAgent('another-agent', mockAgent);
    expect(coordinator.dispatch.agentRegistry.has('another-agent')).toBe(true);
  });

  it('should create development task', () => {
    const task = coordinator.createDevelopmentTask({
      agent: 'test-agent',
      description: 'Dev task',
      instructions: 'Implement feature'
    });
    
    expect(task).toBeInstanceOf(SubagentTask);
    expect(task.metadata.type).toBe('development');
  });

  it('should execute development workflow', async () => {
    coordinator.createDevelopmentTask({
      agent: 'test-agent',
      description: 'Task 1',
      instructions: 'First task'
    });
    
    coordinator.createDevelopmentTask({
      agent: 'test-agent',
      description: 'Task 2',
      instructions: 'Second task'
    });
    
    const result = await coordinator.executeDevelopmentWorkflow(mockEnv);
    
    expect(result.total).toBe(2);
    expect(result.completed).toBe(2);
    expect(result.speedup).toBeGreaterThan(0);
    expect(result.performanceMetrics).toBeDefined();
  });

  it('should calculate performance metrics', async () => {
    // Add a small delay to ensure duration is captured
    mockAgent.execute.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { success: true };
    });
    
    coordinator.createDevelopmentTask({
      agent: 'test-agent',
      description: 'Task 1',
      instructions: 'First task'
    });
    
    await coordinator.executeDevelopmentWorkflow(mockEnv);
    
    const metrics = coordinator.getPerformanceMetrics();
    
    expect(metrics.totalTasks).toBe(1);
    expect(metrics.totalDuration).toBeGreaterThanOrEqual(0);
    expect(metrics.parallelSpeedup).toBeGreaterThan(0);
  });

  it('should get task history', async () => {
    coordinator.createDevelopmentTask({
      agent: 'test-agent',
      description: 'Task 1',
      instructions: 'First task'
    });
    
    await coordinator.executeDevelopmentWorkflow(mockEnv);
    
    const history = coordinator.getTaskHistory();
    
    expect(history.length).toBe(1);
    expect(history[0].summary).toBeDefined();
    expect(history[0].metrics).toBeDefined();
  });

  it('should clear all data', async () => {
    coordinator.createDevelopmentTask({
      agent: 'test-agent',
      description: 'Task 1',
      instructions: 'First task'
    });
    
    await coordinator.executeDevelopmentWorkflow(mockEnv);
    
    coordinator.clear();
    
    expect(coordinator.dispatch.tasks.size).toBe(0);
    expect(coordinator.taskHistory.length).toBe(0);
    expect(coordinator.performanceMetrics.totalTasks).toBe(0);
  });
});

describe('TaskStatus and TaskPriority', () => {
  it('should have correct status values', () => {
    expect(TaskStatus.PENDING).toBe('pending');
    expect(TaskStatus.RUNNING).toBe('running');
    expect(TaskStatus.COMPLETED).toBe('completed');
    expect(TaskStatus.FAILED).toBe('failed');
    expect(TaskStatus.REVIEWING).toBe('reviewing');
    expect(TaskStatus.APPROVED).toBe('approved');
    expect(TaskStatus.REJECTED).toBe('rejected');
  });

  it('should have correct priority values', () => {
    expect(TaskPriority.LOW).toBe(1);
    expect(TaskPriority.MEDIUM).toBe(2);
    expect(TaskPriority.HIGH).toBe(3);
    expect(TaskPriority.CRITICAL).toBe(4);
  });
});
