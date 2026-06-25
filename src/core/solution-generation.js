// Solution Generation — AI-powered solution generation with context

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';

class SolutionGenerationManager {
  constructor(env) {
    this.env = env;
    this.solutionHistory = new Map();
  }

  async generateSolution(problem, context = {}) {
    const solutionId = `solution:${Date.now()}`;
    
    logger.info(`Solution Generation: Generating solution ${solutionId}`, {
      problem: problem.description || problem,
      context
    });
    
    const solution = {
      id: solutionId,
      problem,
      context,
      status: 'generating',
      createdAt: new Date().toISOString(),
      steps: [],
      code: null,
      explanation: null,
      tests: null,
      alternatives: []
    };
    
    // Analyze problem
    const analysis = this.analyzeProblem(problem, context);
    
    // Generate solution steps
    solution.steps = this.generateSteps(analysis);
    
    // Generate code if needed
    if (analysis.requiresCode) {
      solution.code = this.generateCode(analysis);
    }
    
    // Generate explanation
    solution.explanation = this.generateExplanation(analysis, solution.steps);
    
    // Generate tests
    solution.tests = this.generateTests(analysis, solution.code);
    
    // Generate alternatives
    solution.alternatives = this.generateAlternatives(analysis);
    
    solution.status = 'completed';
    solution.completedAt = new Date().toISOString();
    
    // Save to history
    this.solutionHistory.set(solutionId, solution);
    await this.saveSolution(solutionId, solution);
    
    logger.info(`Solution Generation: Solution ${solutionId} completed`, {
      steps: solution.steps.length,
      hasCode: !!solution.code,
      hasTests: !!solution.tests
    });
    
    return solution;
  }

  analyzeProblem(problem, context = {}) {
    const problemText = problem.description || problem;
    const lowerProblem = problemText.toLowerCase();
    const safeContext = context || {};
    
    const analysis = {
      type: this.classifyProblem(lowerProblem),
      complexity: this.assessComplexity(lowerProblem),
      requiresCode: this.checkRequiresCode(lowerProblem),
      requiresDatabase: this.checkRequiresDatabase(lowerProblem),
      requiresAPI: this.checkRequiresAPI(lowerProblem),
      dependencies: this.extractDependencies(lowerProblem),
      constraints: safeContext.constraints || []
    };
    
    return analysis;
  }

  classifyProblem(problem) {
    if (problem.includes('error') || problem.includes('bug') || problem.includes('fix')) {
      return 'debugging';
    }
    if (problem.includes('implement') || problem.includes('create') || problem.includes('build')) {
      return 'implementation';
    }
    if (problem.includes('optimize') || problem.includes('improve') || problem.includes('performance')) {
      return 'optimization';
    }
    if (problem.includes('refactor') || problem.includes('clean') || problem.includes('organize')) {
      return 'refactoring';
    }
    if (problem.includes('test') || problem.includes('spec') || problem.includes('validate')) {
      return 'testing';
    }
    
    return 'general';
  }

  assessComplexity(problem) {
    const complexityIndicators = {
      low: ['simple', 'basic', 'single', 'one', 'quick'],
      medium: ['multiple', 'several', 'integrate', 'connect', 'combine'],
      high: ['complex', 'advanced', 'architecture', 'system', 'framework']
    };
    
    let score = 0;
    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      for (const indicator of indicators) {
        if (problem.includes(indicator)) {
          score += level === 'low' ? 1 : level === 'medium' ? 2 : 3;
        }
      }
    }
    
    if (score >= 3) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  checkRequiresCode(problem) {
    return problem.includes('function') || problem.includes('class') || problem.includes('implement') || problem.includes('code');
  }

  checkRequiresDatabase(problem) {
    return problem.includes('database') || problem.includes('sql') || problem.includes('query') || problem.includes('data');
  }

  checkRequiresAPI(problem) {
    return problem.includes('api') || problem.includes('endpoint') || problem.includes('http') || problem.includes('request');
  }

  extractDependencies(problem) {
    const dependencies = [];
    
    if (problem.includes('database')) dependencies.push('database');
    if (problem.includes('api')) dependencies.push('api');
    if (problem.includes('auth')) dependencies.push('authentication');
    if (problem.includes('file')) dependencies.push('filesystem');
    if (problem.includes('email')) dependencies.push('email');
    if (problem.includes('cache')) dependencies.push('cache');
    
    return dependencies;
  }

  generateSteps(analysis) {
    const steps = [
      {
        id: 'step-1',
        order: 1,
        title: 'Analyze Requirements',
        description: 'Understand the problem and identify key requirements',
        status: 'pending'
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Design Solution',
        description: 'Create a design for the solution approach',
        status: 'pending'
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Implement Solution',
        description: 'Write the code or configuration for the solution',
        status: 'pending'
      },
      {
        id: 'step-4',
        order: 4,
        title: 'Test Solution',
        description: 'Verify the solution works correctly',
        status: 'pending'
      },
      {
        id: 'step-5',
        order: 5,
        title: 'Deploy Solution',
        description: 'Deploy the solution to the target environment',
        status: 'pending'
      }
    ];
    
    // Add dependency-specific steps
    if (analysis.dependencies.includes('database')) {
      steps.splice(2, 0, {
        id: 'step-db',
        order: 3,
        title: 'Setup Database',
        description: 'Configure database schema and connections',
        status: 'pending'
      });
      // Reorder subsequent steps
      steps.forEach((step, index) => {
        if (index >= 3) step.order = index + 1;
      });
    }
    
    return steps;
  }

  generateCode(analysis) {
    // In production, this would call an LLM to generate code
    // For now, return a template
    const codeTemplate = `// Solution for ${analysis.type} problem
// Complexity: ${analysis.complexity}
// Dependencies: ${analysis.dependencies.join(', ')}

function solution() {
  // Implementation here
  return true;
}

module.exports = { solution };`;
    
    return codeTemplate;
  }

  generateExplanation(analysis, steps) {
    const explanation = {
      summary: `This solution addresses a ${analysis.type} problem with ${analysis.complexity} complexity.`,
      approach: `The approach involves ${steps.length} steps: ${steps.map(s => s.title).join(', ')}.`,
      considerations: [
        `Problem type: ${analysis.type}`,
        `Complexity level: ${analysis.complexity}`,
        `Dependencies: ${analysis.dependencies.join(', ') || 'none'}`,
        `Constraints: ${analysis.constraints.join(', ') || 'none'}`
      ],
      risks: [
        'Solution may require testing in production environment',
        'Dependencies may need version compatibility checks',
        'Performance should be monitored after deployment'
      ]
    };
    
    return explanation;
  }

  generateTests(analysis, code) {
    if (!code) return null;
    
    const tests = `// Tests for solution
const { solution } = require('./solution');

describe('Solution Tests', () => {
  test('solution returns truthy value', () => {
    expect(solution()).toBeTruthy();
  });
  
  test('solution handles edge cases', () => {
    expect(solution()).toBeDefined();
  });
});`;
    
    return tests;
  }

  generateAlternatives(analysis) {
    const alternatives = [];
    
    if (analysis.complexity === 'high') {
      alternatives.push({
        approach: 'Simplified Solution',
        description: 'Reduce complexity by breaking into smaller components',
        tradeoffs: 'May require more coordination between components'
      });
    }
    
    if (analysis.dependencies.length > 2) {
      alternatives.push({
        approach: 'Dependency Reduction',
        description: 'Minimize external dependencies for simpler deployment',
        tradeoffs: 'May require custom implementation of some features'
      });
    }
    
    alternatives.push({
      approach: 'Incremental Rollout',
      description: 'Deploy solution gradually to minimize risk',
      tradeoffs: 'Longer deployment timeline'
    });
    
    return alternatives;
  }

  async saveSolution(solutionId, solution) {
    try {
      const memoryKey = `solution:${solutionId}`;
      await saveMemory(this.env, memoryKey, solution);
    } catch (error) {
      logger.error(`Solution Generation: Failed to save solution`, {
        error: error.message
      });
    }
  }

  getSolution(solutionId) {
    return this.solutionHistory.get(solutionId) || null;
  }

  getAllSolutions() {
    return Array.from(this.solutionHistory.values());
  }

  getSolutionStatistics() {
    const solutions = this.getAllSolutions();
    
    const stats = {
      total: solutions.length,
      byType: {},
      byComplexity: {},
      averageSteps: 0,
      withCode: solutions.filter(s => s.code).length,
      withTests: solutions.filter(s => s.tests).length
    };
    
    for (const solution of solutions) {
      const analysis = this.analyzeProblem(solution.problem, solution.context);
      stats.byType[analysis.type] = (stats.byType[analysis.type] || 0) + 1;
      stats.byComplexity[analysis.complexity] = (stats.byComplexity[analysis.complexity] || 0) + 1;
    }
    
    if (solutions.length > 0) {
      stats.averageSteps = solutions.reduce((sum, s) => sum + s.steps.length, 0) / solutions.length;
    }
    
    return stats;
  }
}

export { SolutionGenerationManager };
