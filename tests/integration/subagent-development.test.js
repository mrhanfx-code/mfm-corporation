import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubagentCoordinator } from '../../src/core/subagent-dispatch.js';

describe('Subagent Development Integration Test', () => {
  let mockEnv;
  let mockAgents;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    
    // Create fresh mock agents for each test
    mockAgents = {
      'developer': {
        execute: vi.fn().mockImplementation(async (instructions) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return { success: true, code: 'implementation', changes: 5 };
        }),
        review: vi.fn().mockResolvedValue({ approved: true, comments: 'Good implementation' })
      },
      'reviewer': {
        execute: vi.fn().mockImplementation(async (instructions) => {
          await new Promise(resolve => setTimeout(resolve, 30));
          return { success: true, review: 'approved' };
        }),
        review: vi.fn().mockResolvedValue({ approved: true, comments: 'Code quality is good' })
      },
      'tester': {
        execute: vi.fn().mockImplementation(async (instructions) => {
          await new Promise(resolve => setTimeout(resolve, 40));
          return { success: true, tests: 10, passed: 10 };
        }),
        review: vi.fn().mockResolvedValue({ approved: true, comments: 'All tests pass' })
      }
    };
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  it('should execute parallel development tasks', async () => {
    const coordinator = new SubagentCoordinator({ maxParallelTasks: 4 });
    Object.entries(mockAgents).forEach(([name, agent]) => {
      coordinator.registerAgent(name, agent);
    });
    
    // Create independent tasks that can run in parallel
    coordinator.createDevelopmentTask({
      agent: 'developer',
      description: 'Implement feature A',
      instructions: 'Create feature A implementation'
    });
    
    coordinator.createDevelopmentTask({
      agent: 'developer',
      description: 'Implement feature B',
      instructions: 'Create feature B implementation'
    });
    
    coordinator.createDevelopmentTask({
      agent: 'tester',
      description: 'Test feature A',
      instructions: 'Write tests for feature A'
    });
    
    const summary = await coordinator.executeDevelopmentWorkflow(mockEnv);
    
    expect(summary.total).toBe(3);
    expect(summary.completed).toBe(3);
    expect(summary.failed).toBe(0);
    expect(summary.speedup).toBeGreaterThan(1);
  });

  it('should handle task dependencies correctly', async () => {
    const coordinator = new SubagentCoordinator({ maxParallelTasks: 4 });
    Object.entries(mockAgents).forEach(([name, agent]) => {
      coordinator.registerAgent(name, agent);
    });
    
    // Create tasks with dependencies
    const task1 = coordinator.createDevelopmentTask({
      agent: 'developer',
      description: 'Implement base feature',
      instructions: 'Create base implementation'
    });
    
    const task2 = coordinator.createDevelopmentTask({
      agent: 'developer',
      description: 'Extend feature',
      instructions: 'Extend base implementation',
      dependencies: [task1.id]
    });
    
    const task3 = coordinator.createDevelopmentTask({
      agent: 'tester',
      description: 'Test extended feature',
      instructions: 'Test extended implementation',
      dependencies: [task2.id]
    });
    
    const summary = await coordinator.executeDevelopmentWorkflow(mockEnv);
    
    expect(summary.total).toBe(3);
    expect(summary.completed).toBe(3);
    
    // Verify execution order by checking start times
    const tasks = coordinator.dispatch.getAllTasks();
    const t1 = tasks.find(t => t.id === task1.id);
    const t2 = tasks.find(t => t.id === task2.id);
    const t3 = tasks.find(t => t.id === task3.id);
    
    expect(t1.startTime).toBeLessThan(t2.startTime);
    expect(t2.startTime).toBeLessThan(t3.startTime);
  });

  it('should execute two-stage review workflow', async () => {
    const coordinator = new SubagentCoordinator({ maxParallelTasks: 4 });
    Object.entries(mockAgents).forEach(([name, agent]) => {
      coordinator.registerAgent(name, agent);
    });
    
    coordinator.createDevelopmentTask({
      agent: 'developer',
      description: 'Implement feature',
      instructions: 'Create implementation',
      reviewer: 'reviewer'
    });
    
    const summary = await coordinator.executeDevelopmentWorkflow(mockEnv);
    
    expect(summary.total).toBe(1);
    expect(summary.completed).toBe(1);
    expect(summary.approved).toBe(1);
    
    const task = coordinator.dispatch.getAllTasks()[0];
    expect(task.status).toBe('approved');
    expect(task.reviewResult).toBeDefined();
    expect(task.reviewResult.approved).toBe(true);
  });

  it('should achieve 25%+ faster development with parallel execution', async () => {
    const coordinator = new SubagentCoordinator({ maxParallelTasks: 4 });
    Object.entries(mockAgents).forEach(([name, agent]) => {
      coordinator.registerAgent(name, agent);
    });
    
    // Sequential execution baseline
    const sequentialTasks = [];
    for (let i = 0; i < 4; i++) {
      const task = coordinator.createDevelopmentTask({
        agent: 'developer',
        description: `Task ${i}`,
        instructions: `Implement task ${i}`
      });
      sequentialTasks.push(task);
    }
    
    const sequentialStart = Date.now();
    for (const task of sequentialTasks) {
      await coordinator.dispatch.executeTask(task, mockEnv);
    }
    const sequentialDuration = Date.now() - sequentialStart;
    
    // Clear and test parallel execution
    coordinator.clear();
    Object.entries(mockAgents).forEach(([name, agent]) => {
      coordinator.registerAgent(name, agent);
    });
    
    const parallelTasks = [];
    for (let i = 0; i < 4; i++) {
      coordinator.createDevelopmentTask({
        agent: 'developer',
        description: `Task ${i}`,
        instructions: `Implement task ${i}`
      });
    }
    
    const parallelStart = Date.now();
    await coordinator.executeDevelopmentWorkflow(mockEnv);
    const parallelDuration = Date.now() - parallelStart;
    
    const speedup = sequentialDuration / parallelDuration;
    const improvement = ((sequentialDuration - parallelDuration) / sequentialDuration) * 100;
    
    console.log(`Sequential duration: ${sequentialDuration}ms`);
    console.log(`Parallel duration: ${parallelDuration}ms`);
    console.log(`Speedup: ${speedup.toFixed(2)}x`);
    console.log(`Improvement: ${improvement.toFixed(2)}%`);
    
    expect(speedup).toBeGreaterThan(1.25); // 25%+ faster
    expect(improvement).toBeGreaterThanOrEqual(25);
  });

  it('should track performance metrics across multiple workflows', async () => {
    const freshCoordinator = new SubagentCoordinator({ maxParallelTasks: 4 });
    Object.entries(mockAgents).forEach(([name, agent]) => {
      freshCoordinator.registerAgent(name, agent);
    });
    
    // First workflow
    freshCoordinator.createDevelopmentTask({
      agent: 'developer',
      description: 'Task 1',
      instructions: 'Implement task 1'
    });
    
    await freshCoordinator.executeDevelopmentWorkflow(mockEnv);
    
    const metrics1 = freshCoordinator.getPerformanceMetrics();
    expect(metrics1.totalTasks).toBeGreaterThan(0);
    
    // Second workflow
    freshCoordinator.createDevelopmentTask({
      agent: 'developer',
      description: 'Task 2',
      instructions: 'Implement task 2'
    });
    
    await freshCoordinator.executeDevelopmentWorkflow(mockEnv);
    
    const metrics2 = freshCoordinator.getPerformanceMetrics();
    expect(metrics2.totalTasks).toBeGreaterThan(metrics1.totalTasks);
    
    // Verify history is tracked
    const history = freshCoordinator.getTaskHistory();
    expect(history.length).toBe(2);
  });

  it('should handle task failures gracefully', async () => {
    const coordinator = new SubagentCoordinator({ maxParallelTasks: 4 });
    Object.entries(mockAgents).forEach(([name, agent]) => {
      coordinator.registerAgent(name, agent);
    });
    
    mockAgents['developer'].execute.mockRejectedValueOnce(new Error('Implementation failed'));
    
    coordinator.createDevelopmentTask({
      agent: 'developer',
      description: 'Failing task',
      instructions: 'This will fail'
    });
    
    const summary = await coordinator.executeDevelopmentWorkflow(mockEnv);
    
    expect(summary.total).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.completed).toBe(0);
    
    const task = coordinator.dispatch.getAllTasks()[0];
    expect(task.status).toBe('failed');
    expect(task.error).toBe('Implementation failed');
  });

  it('should respect max parallel tasks limit', async () => {
    const coordinator = new SubagentCoordinator({ maxParallelTasks: 2 });
    Object.entries(mockAgents).forEach(([name, agent]) => {
      coordinator.registerAgent(name, agent);
    });
    
    // Create 4 tasks
    for (let i = 0; i < 4; i++) {
      coordinator.createDevelopmentTask({
        agent: 'developer',
        description: `Task ${i}`,
        instructions: `Implement task ${i}`
      });
    }
    
    const summary = await coordinator.executeDevelopmentWorkflow(mockEnv);
    
    expect(summary.total).toBe(4);
    expect(summary.completed).toBe(4);
  });

  it('should provide detailed statistics', async () => {
    const coordinator = new SubagentCoordinator({ maxParallelTasks: 4 });
    Object.entries(mockAgents).forEach(([name, agent]) => {
      coordinator.registerAgent(name, agent);
    });
    
    coordinator.createDevelopmentTask({
      agent: 'developer',
      description: 'Task 1',
      instructions: 'Implement task 1'
    });
    
    coordinator.createDevelopmentTask({
      agent: 'tester',
      description: 'Task 2',
      instructions: 'Test task 2'
    });
    
    await coordinator.executeDevelopmentWorkflow(mockEnv);
    
    const stats = coordinator.dispatch.getStatistics();
    
    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(2);
    expect(stats.failed).toBe(0);
    expect(stats.successRate).toBe(100);
    expect(stats.totalDuration).toBeGreaterThan(0);
    expect(stats.avgDuration).toBeGreaterThan(0);
  });
});
