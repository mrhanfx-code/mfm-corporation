// Error Categorization — Structured error classification with solution generation

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';

const ERROR_CATEGORIES = {
  connectivity: {
    keywords: ['network', 'timeout', 'connection', 'fetch', 'request', 'dns', 'socket'],
    severity: 'high',
    priority: 'critical',
    solutions: [
      'Implement retry logic with exponential backoff',
      'Add connection pooling',
      'Configure timeout settings',
      'Add circuit breaker pattern'
    ],
    rollback: 'Disable retry logic and use direct connections'
  },
  authorization: {
    keywords: ['permission', 'access denied', 'auth', 'unauthorized', 'forbidden', 'token', 'credential'],
    severity: 'critical',
    priority: 'critical',
    solutions: [
      'Refresh authentication tokens',
      'Implement automatic token refresh',
      'Add permission validation',
      'Implement fallback authentication'
    ],
    rollback: 'Disable automatic refresh and use manual token rotation'
  },
  performance: {
    keywords: ['slow', 'timeout', 'resource', 'memory', 'cpu', 'latency', 'performance'],
    severity: 'medium',
    priority: 'high',
    solutions: [
      'Add caching layer',
      'Implement pagination',
      'Optimize database queries',
      'Add lazy loading'
    ],
    rollback: 'Disable caching and revert to direct queries'
  },
  dependency: {
    keywords: ['missing module', 'version conflict', 'import', 'require', 'dependency', 'package'],
    severity: 'high',
    priority: 'high',
    solutions: [
      'Pin dependency versions',
      'Implement dependency validation',
      'Add fallback for optional dependencies',
      'Create dependency health check'
    ],
    rollback: 'Revert to previous working dependency versions'
  },
  syntax: {
    keywords: ['parse error', 'syntax error', 'invalid', 'malformed', 'unexpected token'],
    severity: 'high',
    priority: 'high',
    solutions: [
      'Add syntax validation',
      'Implement linting in CI/CD',
      'Add unit tests for critical paths',
      'Implement code review checklist'
    ],
    rollback: 'Disable validation and revert to previous code'
  },
  resource: {
    keywords: ['disk space', 'storage', 'quota', 'limit', 'exceeded', 'capacity'],
    severity: 'medium',
    priority: 'medium',
    solutions: [
      'Implement resource cleanup',
      'Add resource pooling',
      'Implement resource monitoring',
      'Add graceful degradation'
    ],
    rollback: 'Disable automatic cleanup and use manual management'
  },
  validation: {
    keywords: ['invalid input', 'validation failed', 'schema', 'constraint', 'format'],
    severity: 'medium',
    priority: 'medium',
    solutions: [
      'Add input validation',
      'Implement schema validation',
      'Add user-friendly error messages',
      'Implement input sanitization'
    ],
    rollback: 'Disable validation and accept all inputs'
  },
  concurrency: {
    keywords: ['race condition', 'deadlock', 'concurrency', 'lock', 'atomic', 'synchronization'],
    severity: 'high',
    priority: 'high',
    solutions: [
      'Implement proper locking mechanisms',
      'Add atomic operations',
      'Implement queue-based processing',
      'Add transaction management'
    ],
    rollback: 'Disable concurrent processing and use sequential execution'
  },
  data: {
    keywords: ['data integrity', 'corruption', 'inconsistent', 'duplicate', 'missing data'],
    severity: 'critical',
    priority: 'critical',
    solutions: [
      'Implement data validation',
      'Add transaction support',
      'Implement data backup',
      'Add data reconciliation'
    ],
    rollback: 'Restore from backup and disable new data operations'
  },
  external: {
    keywords: ['api', 'service', 'third-party', 'external', 'integration', 'webhook'],
    severity: 'medium',
    priority: 'medium',
    solutions: [
      'Add fallback services',
      'Implement retry logic',
      'Add service health monitoring',
      'Implement circuit breaker'
    ],
    rollback: 'Disable external service integration'
  },
  unknown: {
    keywords: [],
    severity: 'medium',
    priority: 'low',
    solutions: [
      'Log error details',
      'Monitor for recurrence',
      'Investigate root cause'
    ],
    rollback: 'No rollback available for unknown errors'
  }
};

class ErrorCategorizationManager {
  constructor(env) {
    this.env = env;
    this.errorHistory = new Map();
  }

  categorizeError(error) {
    const errorMessage = error.message || error.toString();
    const errorStack = error.stack || '';
    const fullError = `${errorMessage} ${errorStack}`.toLowerCase();
    
    let bestMatch = null;
    let highestScore = 0;
    
    for (const [category, config] of Object.entries(ERROR_CATEGORIES)) {
      let score = 0;
      
      for (const keyword of config.keywords) {
        if (fullError.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      
      if (score > 0 && score > highestScore) {
        highestScore = score;
        bestMatch = category;
      }
    }
    
    if (!bestMatch) {
      bestMatch = 'unknown';
    }
    
    const category = ERROR_CATEGORIES[bestMatch] || ERROR_CATEGORIES.unknown;
    
    return {
      category: bestMatch,
      severity: category.severity,
      priority: category.priority,
      confidence: highestScore / (category.keywords.length || 1),
      solutions: category.solutions,
      rollback: category.rollback,
      timestamp: new Date().toISOString()
    };
  }

  async generateSolution(error, context = {}) {
    const categorization = this.categorizeError(error);
    
    logger.info(`Error Categorization: Categorized error as ${categorization.category}`, {
      severity: categorization.severity,
      confidence: categorization.confidence
    });
    
    const solution = {
      category: categorization.category,
      severity: categorization.severity,
      priority: categorization.priority,
      recommendedSolution: categorization.solutions[0],
      alternativeSolutions: categorization.solutions.slice(1),
      rollbackPlan: categorization.rollback,
      implementationSteps: this.getImplementationSteps(categorization.category),
      estimatedEffort: this.getEstimatedEffort(categorization.category),
      successCriteria: this.getSuccessCriteria(categorization.category),
      context,
      timestamp: new Date().toISOString()
    };
    
    // Save to history
    const errorKey = `${categorization.category}:${Date.now()}`;
    this.errorHistory.set(errorKey, solution);
    await this.saveError(errorKey, solution);
    
    return solution;
  }

  getImplementationSteps(category) {
    const steps = {
      connectivity: [
        'Add retry mechanism with exponential backoff (1s, 2s, 4s, 8s)',
        'Implement connection pooling for API calls',
        'Add timeout configuration (30s default)',
        'Add circuit breaker pattern for repeated failures'
      ],
      authorization: [
        'Check token expiration and refresh if needed',
        'Implement automatic token refresh 5 minutes before expiry',
        'Add token validation before API calls',
        'Implement fallback authentication method'
      ],
      performance: [
        'Add caching layer for frequently accessed data',
        'Implement pagination for large datasets',
        'Optimize database queries with indexes',
        'Add lazy loading for non-critical resources'
      ],
      dependency: [
        'Pin all dependency versions in package.json',
        'Implement dependency validation at startup',
        'Add fallback for missing optional dependencies',
        'Create dependency health check endpoint'
      ],
      syntax: [
        'Add syntax validation before code execution',
        'Implement linting in CI/CD pipeline',
        'Add unit tests for critical code paths',
        'Implement code review checklist'
      ],
      resource: [
        'Add automatic resource cleanup after operations',
        'Implement resource pooling',
        'Add resource usage monitoring',
        'Implement graceful degradation when resources low'
      ],
      validation: [
        'Add input validation at system boundaries',
        'Implement schema-based validation',
        'Add user-friendly error messages',
        'Implement input sanitization'
      ],
      concurrency: [
        'Implement proper locking mechanisms',
        'Add atomic operations for shared state',
        'Implement queue-based processing',
        'Add transaction management'
      ],
      data: [
        'Implement data validation at write time',
        'Add transaction support for critical operations',
        'Implement automated data backup',
        'Add data reconciliation process'
      ],
      external: [
        'Add fallback services for critical integrations',
        'Implement retry logic with exponential backoff',
        'Add service health monitoring',
        'Implement circuit breaker pattern'
      ]
    };
    
    return steps[category] || ['Add error handling', 'Log error details', 'Monitor for recurrence'];
  }

  getEstimatedEffort(category) {
    const efforts = {
      connectivity: '2-3 hours',
      authorization: '1-2 hours',
      performance: '3-4 hours',
      dependency: '2-3 hours',
      syntax: '1-2 hours',
      resource: '2-3 hours',
      validation: '1-2 hours',
      concurrency: '3-4 hours',
      data: '4-6 hours',
      external: '2-3 hours'
    };
    
    return efforts[category] || '1-2 hours';
  }

  getSuccessCriteria(category) {
    const criteria = {
      connectivity: [
        'Connection established within 30s',
        'Retry logic reduces failures by 80%',
        'Circuit breaker prevents cascade failures'
      ],
      authorization: [
        'Tokens refreshed automatically',
        'No authentication failures after refresh',
        'Fallback authentication works when primary fails'
      ],
      performance: [
        'Response time < 2s for 95% of requests',
        'Memory usage reduced by 30%',
        'Cache hit rate > 80%'
      ],
      dependency: [
        'All dependencies resolved correctly',
        'Startup validation passes',
        'No runtime dependency errors'
      ],
      syntax: [
        'No syntax errors in production',
        'Linting passes in CI/CD',
        'Unit tests cover critical paths'
      ],
      resource: [
        'No resource leaks detected',
        'Resource usage stays within limits',
        'Graceful degradation works correctly'
      ],
      validation: [
        'All inputs validated before processing',
        'User-friendly error messages displayed',
        'No invalid data enters system'
      ],
      concurrency: [
        'No race conditions detected',
        'Deadlock prevention active',
        'Atomic operations work correctly'
      ],
      data: [
        'Data integrity maintained',
        'No data corruption detected',
        'Backup and restore works'
      ],
      external: [
        'Fallback services work when primary fails',
        'Retry logic reduces failures by 70%',
        'Health monitoring detects issues'
      ]
    };
    
    return criteria[category] || ['Error handled gracefully', 'System remains operational', 'No data loss'];
  }

  async saveError(errorKey, solution) {
    try {
      const memoryKey = `error_solution:${errorKey}`;
      await saveMemory(this.env, memoryKey, solution);
    } catch (error) {
      logger.error(`Error Categorization: Failed to save error solution`, {
        error: error.message
      });
    }
  }

  getErrorStatistics() {
    const stats = {
      total: this.errorHistory.size,
      byCategory: {},
      bySeverity: {},
      byPriority: {}
    };
    
    for (const solution of this.errorHistory.values()) {
      stats.byCategory[solution.category] = (stats.byCategory[solution.category] || 0) + 1;
      stats.bySeverity[solution.severity] = (stats.bySeverity[solution.severity] || 0) + 1;
      stats.byPriority[solution.priority] = (stats.byPriority[solution.priority] || 0) + 1;
    }
    
    return stats;
  }

  getMostCommonErrors(limit = 5) {
    const categoryCounts = {};
    
    for (const solution of this.errorHistory.values()) {
      categoryCounts[solution.category] = (categoryCounts[solution.category] || 0) + 1;
    }
    
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([category, count]) => ({ category, count }));
  }
}

export { ErrorCategorizationManager, ERROR_CATEGORIES };
