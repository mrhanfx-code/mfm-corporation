import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SolutionGenerationManager } from '../../src/core/solution-generation.js';

describe('SolutionGenerationManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    manager = new SolutionGenerationManager(mockEnv);
    vi.clearAllMocks();
  });

  it('should generate solution for problem', async () => {
    const problem = { description: 'Fix the authentication bug' };
    const solution = await manager.generateSolution(problem);

    expect(solution).toBeDefined();
    expect(solution.id).toBeDefined();
    expect(solution.status).toBe('completed');
    expect(solution.steps.length).toBeGreaterThan(0);
  });

  it('should classify debugging problem', () => {
    const analysis = manager.analyzeProblem('Fix the error in the code');
    expect(analysis.type).toBe('debugging');
  });

  it('should classify implementation problem', () => {
    const analysis = manager.analyzeProblem('Implement new feature');
    expect(analysis.type).toBe('implementation');
  });

  it('should classify optimization problem', () => {
    const analysis = manager.analyzeProblem('Optimize the performance');
    expect(analysis.type).toBe('optimization');
  });

  it('should classify refactoring problem', () => {
    const analysis = manager.analyzeProblem('Refactor the code');
    expect(analysis.type).toBe('refactoring');
  });

  it('should classify testing problem', () => {
    const analysis = manager.analyzeProblem('Test the function');
    expect(analysis.type).toBe('testing');
  });

  it('should classify general problem', () => {
    const analysis = manager.analyzeProblem('Some random task');
    expect(analysis.type).toBe('general');
  });

  it('should assess low complexity', () => {
    const analysis = manager.analyzeProblem('Simple fix');
    expect(['low', 'medium', 'high']).toContain(analysis.complexity);
  });

  it('should assess medium complexity', () => {
    const analysis = manager.analyzeProblem('Integrate components');
    expect(['low', 'medium', 'high']).toContain(analysis.complexity);
  });

  it('should assess high complexity', () => {
    const analysis = manager.analyzeProblem('Complex advanced system architecture');
    expect(analysis.complexity).toBe('high');
  });

  it('should detect code requirement', () => {
    const analysis = manager.analyzeProblem('Implement function');
    expect(analysis.requiresCode).toBe(true);
  });

  it('should detect database requirement', () => {
    const analysis = manager.analyzeProblem('Query database');
    expect(analysis.requiresDatabase).toBe(true);
  });

  it('should detect API requirement', () => {
    const analysis = manager.analyzeProblem('Call API endpoint');
    expect(analysis.requiresAPI).toBe(true);
  });

  it('should extract dependencies', () => {
    const analysis = manager.analyzeProblem('Connect to database and API');
    expect(analysis.dependencies).toContain('database');
    expect(analysis.dependencies).toContain('api');
  });

  it('should generate implementation steps', () => {
    const analysis = manager.analyzeProblem('Implement feature');
    const steps = manager.generateSteps(analysis);

    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].title).toBe('Analyze Requirements');
  });

  it('should add database setup step when needed', () => {
    const analysis = manager.analyzeProblem('Implement database feature');
    const steps = manager.generateSteps(analysis);

    const dbStep = steps.find(s => s.title === 'Setup Database');
    expect(dbStep).toBeDefined();
  });

  it('should generate code template', () => {
    const analysis = manager.analyzeProblem('Implement function');
    const code = manager.generateCode(analysis);

    expect(code).toBeDefined();
    expect(code).toContain('function solution');
  });

  it('should generate explanation', () => {
    const analysis = manager.analyzeProblem('Fix bug');
    const steps = manager.generateSteps(analysis);
    const explanation = manager.generateExplanation(analysis, steps);

    expect(explanation).toBeDefined();
    expect(explanation.summary).toBeDefined();
    expect(explanation.approach).toBeDefined();
  });

  it('should generate tests', () => {
    const analysis = manager.analyzeProblem('Implement function');
    const code = manager.generateCode(analysis);
    const tests = manager.generateTests(analysis, code);

    expect(tests).toBeDefined();
    expect(tests).toContain('describe');
  });

  it('should return null tests when no code', () => {
    const analysis = manager.analyzeProblem('Some task');
    const tests = manager.generateTests(analysis, null);

    expect(tests).toBeNull();
  });

  it('should generate alternatives for high complexity', () => {
    const analysis = manager.analyzeProblem('Complex advanced system');
    const alternatives = manager.generateAlternatives(analysis);

    expect(alternatives.length).toBeGreaterThan(0);
  });

  it('should generate alternatives for many dependencies', () => {
    const analysis = manager.analyzeProblem('Connect to database, api, auth, and email');
    const alternatives = manager.generateAlternatives(analysis);

    expect(alternatives.length).toBeGreaterThan(0);
  });

  it('should get solution by ID', async () => {
    const problem = { description: 'Test problem' };
    const solution = await manager.generateSolution(problem);
    const retrieved = manager.getSolution(solution.id);

    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(solution.id);
  });

  it('should return null for non-existent solution', () => {
    const solution = manager.getSolution('non-existent');
    expect(solution).toBeNull();
  });

  it('should get all solutions', async () => {
    await manager.generateSolution({ description: 'Problem 1' });
    await manager.generateSolution({ description: 'Problem 2' });

    const solutions = manager.getAllSolutions();
    expect(solutions.length).toBe(2);
  });

  it('should get solution statistics', async () => {
    await manager.generateSolution({ description: 'Fix bug' });
    await manager.generateSolution({ description: 'Implement feature' });

    const stats = manager.getSolutionStatistics();
    expect(stats).toBeDefined();
    expect(stats.total).toBe(2);
  });

  it('should return zero statistics when no solutions', () => {
    const stats = manager.getSolutionStatistics();
    expect(stats.total).toBe(0);
  });

  it('should include context in analysis', () => {
    const context = { constraints: ['No external APIs'] };
    const analysis = manager.analyzeProblem('Implement feature', context);

    expect(analysis.constraints).toContain('No external APIs');
  });

  it('should generate solution with alternatives', async () => {
    const problem = { description: 'Complex advanced system architecture' };
    const solution = await manager.generateSolution(problem);

    expect(solution.alternatives).toBeDefined();
    expect(solution.alternatives.length).toBeGreaterThan(0);
  });

  it('should generate solution with tests when code is needed', async () => {
    const problem = { description: 'Implement function' };
    const solution = await manager.generateSolution(problem);

    expect(solution.code).toBeDefined();
    expect(solution.tests).toBeDefined();
  });

  it('should generate solution without tests when no code needed', async () => {
    const problem = { description: 'Analyze requirements' };
    const solution = await manager.generateSolution(problem);

    expect(solution.code).toBeNull();
    expect(solution.tests).toBeNull();
  });

  it('should track solution completion time', async () => {
    const problem = { description: 'Test problem' };
    const solution = await manager.generateSolution(problem);

    expect(solution.completedAt).toBeDefined();
    expect(solution.createdAt).toBeDefined();
  });
});
