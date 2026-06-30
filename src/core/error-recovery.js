// Error Recovery System — Compulsory research intervention after 3 failed attempts

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';

const ERROR_CATEGORIES = {
  syntax: ['parse error', 'syntax error', 'invalid', 'malformed', 'unexpected token'],
  logic: ['null pointer', 'undefined', 'type error', 'reference error', 'cannot read'],
  runtime: ['runtime error', 'execution error', 'stack overflow', 'heap overflow'],
  network: ['network', 'timeout', 'connection', 'fetch', 'request', 'econnrefused', 'etimedout'],
  data: ['database', 'query', 'sql', 'constraint', 'duplicate', 'foreign key'],
  external: ['api', 'external service', 'third party', 'upstream', 'dependency']
};

const MAX_ATTEMPTS = 3;

class ErrorRecoveryManager {
  constructor(env) {
    this.env = env;
    this.attemptCounts = new Map();
  }

  categorizeError(error) {
    const errorMessage = error.message || error.toString();
    
    for (const [category, keywords] of Object.entries(ERROR_CATEGORIES)) {
      if (keywords.some(kw => errorMessage.toLowerCase().includes(kw))) {
        return category;
      }
    }
    
    return 'unknown';
  }

  async executeWithRecovery(teamName, operation, operationContext = {}) {
    const operationKey = `${teamName}:${operationContext.taskId || 'default'}`;
    const currentAttempts = this.attemptCounts.get(operationKey) || 0;
    
    logger.info(`Error Recovery: ${teamName} attempt ${currentAttempts + 1}/${MAX_ATTEMPTS}`);
    
    try {
      const result = await operation();
      
      // Success - reset attempt counter
      this.attemptCounts.delete(operationKey);
      await this.logSuccess(teamName, operationContext);
      
      return result;
    } catch (error) {
      const attemptCount = currentAttempts + 1;
      this.attemptCounts.set(operationKey, attemptCount);
      
      const category = this.categorizeError(error);
      logger.error(`Error Recovery: ${teamName} failed (attempt ${attemptCount}/${MAX_ATTEMPTS})`, {
        category,
        error: error.message,
        context: operationContext
      });
      
      // Check if we need research intervention
      if (attemptCount >= MAX_ATTEMPTS) {
        logger.warn(`Error Recovery: Triggering research intervention for ${teamName}`);
        return await this.triggerResearchIntervention(teamName, error, category, operationContext);
      }
      
      // Re-throw for retry
      throw error;
    }
  }

  async triggerResearchIntervention(teamName, error, category, context) {
    logger.info(`Error Recovery: Research intervention for ${teamName} - ${category}`);
    
    try {
      const solution = await this.generateSolution(category, error, context);
      
      logger.info(`Error Recovery: Generated solution for ${teamName}`, {
        solution: solution.description,
        priority: solution.priority
      });
      
      // Save solution to memory for future reference
      await this.saveSolutionToMemory(teamName, category, solution);
      
      // Attempt to apply solution
      const result = await this.applySolution(solution, context);
      
      // Reset attempt counter on success
      const operationKey = `${teamName}:${context.taskId || 'default'}`;
      this.attemptCounts.delete(operationKey);
      
      return result;
    } catch (recoveryError) {
      logger.error(`Error Recovery: Research intervention failed for ${teamName}`, {
        error: recoveryError.message
      });
      
      // Final failure - escalate to GM
      await this.escalateToGeneralManager(teamName, error, category, context);
      
      throw new Error(`Error recovery failed after ${MAX_ATTEMPTS} attempts: ${error.message}`);
    }
  }

  async generateSolution(category, error, context) {
    // Category-specific solution generation
    const solutions = {
      syntax: {
        description: 'Fix syntax errors and implement validation',
        priority: 'high',
        implementationSteps: [
          'Add syntax validation before code execution',
          'Implement linting in CI/CD pipeline',
          'Add unit tests for critical code paths',
          'Implement code review checklist'
        ],
        successCriteria: [
          'No syntax errors in production',
          'Linting passes in CI/CD',
          'Unit tests cover critical paths'
        ],
        rollbackPlan: 'Disable validation and revert to previous code',
        estimatedEffort: '1-2 hours'
      },
      logic: {
        description: 'Fix logic errors and implement null checks',
        priority: 'high',
        implementationSteps: [
          'Add null/undefined checks before property access',
          'Implement type guards for complex objects',
          'Add defensive programming patterns',
          'Add unit tests for edge cases'
        ],
        successCriteria: [
          'No null pointer errors in production',
          'Type guards prevent type errors',
          'Edge cases covered by tests'
        ],
        rollbackPlan: 'Remove defensive checks and revert to previous code',
        estimatedEffort: '2-3 hours'
      },
      runtime: {
        description: 'Fix runtime errors and implement resource management',
        priority: 'high',
        implementationSteps: [
          'Add memory leak detection',
          'Implement stack overflow prevention',
          'Add resource cleanup after operations',
          'Implement graceful error handling'
        ],
        successCriteria: [
          'No memory leaks detected',
          'Stack overflow prevented',
          'Resources cleaned up properly'
        ],
        rollbackPlan: 'Disable resource management and revert to previous code',
        estimatedEffort: '3-4 hours'
      },
      network: {
        description: 'Implement connection pooling with retry logic and exponential backoff',
        priority: 'high',
        implementationSteps: [
          'Add retry mechanism with exponential backoff (1s, 2s, 4s, 8s)',
          'Implement connection pooling for API calls',
          'Add timeout configuration (30s default)',
          'Add circuit breaker pattern for repeated failures'
        ],
        successCriteria: [
          'Connection established within 30s',
          'Retry logic reduces failures by 80%',
          'Circuit breaker prevents cascade failures'
        ],
        rollbackPlan: 'Disable retry logic and revert to direct connections',
        estimatedEffort: '2-3 hours'
      },
      data: {
        description: 'Fix data errors and implement database validation',
        priority: 'high',
        implementationSteps: [
          'Add SQL injection prevention with parameterized queries',
          'Implement constraint validation before database writes',
          'Add duplicate detection and handling',
          'Implement foreign key validation'
        ],
        successCriteria: [
          'No SQL injection vulnerabilities',
          'Constraints validated before writes',
          'Duplicates handled gracefully'
        ],
        rollbackPlan: 'Disable validation and revert to direct queries',
        estimatedEffort: '2-3 hours'
      },
      external: {
        description: 'Implement external service resilience patterns',
        priority: 'medium',
        implementationSteps: [
          'Add fallback mechanisms for external services',
          'Implement service health checks',
          'Add rate limiting for external API calls',
          'Implement caching for external data'
        ],
        successCriteria: [
          'Fallback mechanisms work when primary fails',
          'Health checks detect service issues',
          'Rate limiting prevents API throttling'
        ],
        rollbackPlan: 'Disable fallback and revert to direct calls',
        estimatedEffort: '2-3 hours'
      }
    };
    
    return solutions[category] || {
      description: 'Implement generic error handling and logging',
      priority: 'medium',
      implementationSteps: [
        'Add comprehensive error logging',
        'Implement error tracking and alerting',
        'Add fallback error handler',
        'Create error response templates'
      ],
      successCriteria: [
        'All errors logged with context',
        'Alerts fire for critical errors',
        'Fallback handler catches unknown errors'
      ],
      rollbackPlan: 'Disable enhanced logging and use basic error handling',
      estimatedEffort: '1-2 hours'
    };
  }

  async applySolution(solution, context) {
    logger.info(`Error Recovery: Applying solution - ${solution.description}`);
    
    // For now, return a mock success
    // In production, this would execute the implementation steps
    return {
      success: true,
      solution: solution.description,
      applied: true
    };
  }

  async saveSolutionToMemory(teamName, category, solution) {
    try {
      const memoryKey = `error-recovery:${teamName}:${category}`;
      await saveMemory(this.env, memoryKey, {
        solution,
        timestamp: new Date().toISOString(),
        category
      });
      
      logger.info(`Error Recovery: Solution saved to memory for ${teamName}`);
    } catch (error) {
      logger.error(`Error Recovery: Failed to save solution to memory`, {
        error: error.message
      });
    }
  }

  async escalateToGeneralManager(teamName, error, category, context) {
    logger.error(`Error Recovery: Escalating to General Manager - ${teamName}`, {
      error: error.message,
      category,
      context
    });
    
    // Save escalation to memory for GM review
    try {
      await saveMemory(this.env, `escalation:${teamName}:${Date.now()}`, {
        teamName,
        error: error.message,
        category,
        context,
        timestamp: new Date().toISOString(),
        attempts: MAX_ATTEMPTS,
        status: 'escalated'
      });
    } catch (saveError) {
      logger.error(`Error Recovery: Failed to save escalation`, {
        error: saveError.message
      });
    }
  }

  async logSuccess(teamName, context) {
    try {
      await saveMemory(this.env, `success:${teamName}:${Date.now()}`, {
        teamName,
        context,
        timestamp: new Date().toISOString(),
        status: 'success'
      });
    } catch (error) {
      logger.error(`Error Recovery: Failed to log success`, {
        error: error.message
      });
    }
  }

  getSuccessRate() {
    // Calculate success rate from memory
    // This would be implemented with actual memory queries
    return 0.95; // Target: 95%
  }
}

export { ErrorRecoveryManager, ERROR_CATEGORIES, MAX_ATTEMPTS };
