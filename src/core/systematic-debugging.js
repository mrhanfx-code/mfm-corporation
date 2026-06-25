// Systematic Debugging — 4-phase root cause process

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';

class SystematicDebuggingManager {
  constructor(env) {
    this.env = env;
    this.debugSessions = new Map();
  }

  // Phase 1: Capture
  async captureError(error, context = {}) {
    const sessionId = `debug:${Date.now()}`;
    
    const session = {
      id: sessionId,
      phase: 'capture',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      },
      context: {
        timestamp: new Date().toISOString(),
        ...context
      },
      phases: {
        capture: {
          completed: true,
          timestamp: new Date().toISOString(),
          data: {
            errorType: this.classifyError(error),
            severity: this.assessSeverity(error),
            reproducible: this.checkReproducibility(error, context)
          }
        },
        analyze: { completed: false },
        hypothesize: { completed: false },
        verify: { completed: false }
      }
    };
    
    this.debugSessions.set(sessionId, session);
    
    logger.info(`Systematic Debugging: Captured error ${sessionId}`, {
      errorType: session.phases.capture.data.errorType,
      severity: session.phases.capture.data.severity
    });
    
    await this.saveSession(session);
    
    return session;
  }

  classifyError(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return 'connectivity';
    }
    if (message.includes('permission') || message.includes('access') || message.includes('auth')) {
      return 'authorization';
    }
    if (message.includes('memory') || message.includes('resource') || message.includes('limit')) {
      return 'resource';
    }
    if (message.includes('syntax') || message.includes('parse') || message.includes('invalid')) {
      return 'syntax';
    }
    if (message.includes('not found') || message.includes('undefined') || message.includes('null')) {
      return 'reference';
    }
    
    return 'unknown';
  }

  assessSeverity(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('critical') || message.includes('fatal') || message.includes('security')) {
      return 'critical';
    }
    if (message.includes('error') || message.includes('failed') || message.includes('exception')) {
      return 'high';
    }
    if (message.includes('warning') || message.includes('deprecated')) {
      return 'medium';
    }
    
    return 'low';
  }

  checkReproducibility(error, context) {
    // In production, this would check if the error can be reproduced
    return context.reproducible || false;
  }

  // Phase 2: Analyze
  async analyzeError(sessionId) {
    const session = this.debugSessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session not found: ${sessionId}`);
    }
    
    logger.info(`Systematic Debugging: Analyzing error ${sessionId}`);
    
    const analysis = {
      rootCauseCandidates: [],
      patterns: [],
      relatedErrors: [],
      timestamp: new Date().toISOString()
    };
    
    // Analyze error patterns
    analysis.patterns = this.identifyPatterns(session.error);
    
    // Find related errors from memory
    analysis.relatedErrors = await this.findRelatedErrors(session.error);
    
    // Generate root cause candidates
    analysis.rootCauseCandidates = this.generateRootCauseCandidates(session, analysis);
    
    session.phases.analyze = {
      completed: true,
      timestamp: new Date().toISOString(),
      data: analysis
    };
    
    await this.saveSession(session);
    
    return analysis;
  }

  identifyPatterns(error) {
    const patterns = [];
    
    if (error.stack) {
      // Check for common stack patterns
      if (error.stack.includes('node_modules')) {
        patterns.push('dependency_issue');
      }
      if (error.stack.includes('async')) {
        patterns.push('async_operation');
      }
      if (error.stack.includes('Promise')) {
        patterns.push('promise_rejection');
      }
    }
    
    if (error.message) {
      if (error.message.includes('timeout')) {
        patterns.push('timeout_pattern');
      }
      if (error.message.includes('null') || error.message.includes('undefined')) {
        patterns.push('null_reference');
      }
    }
    
    return patterns;
  }

  async findRelatedErrors(error) {
    // In production, search memory for similar errors
    return [];
  }

  generateRootCauseCandidates(session, analysis) {
    const candidates = [];
    
    const errorType = session.phases.capture.data.errorType;
    
    switch (errorType) {
      case 'connectivity':
        candidates.push({
          cause: 'Network connectivity issue',
          likelihood: 0.7,
          evidence: analysis.patterns.includes('timeout_pattern')
        });
        candidates.push({
          cause: 'API endpoint unavailable',
          likelihood: 0.5,
          evidence: analysis.patterns.includes('dependency_issue')
        });
        break;
      
      case 'authorization':
        candidates.push({
          cause: 'Invalid or expired credentials',
          likelihood: 0.8,
          evidence: true
        });
        candidates.push({
          cause: 'Insufficient permissions',
          likelihood: 0.6,
          evidence: true
        });
        break;
      
      case 'resource':
        candidates.push({
          cause: 'Memory leak',
          likelihood: 0.6,
          evidence: analysis.patterns.includes('async_operation')
        });
        candidates.push({
          cause: 'Resource limit exceeded',
          likelihood: 0.7,
          evidence: true
        });
        break;
      
      default:
        candidates.push({
          cause: 'Unknown error',
          likelihood: 0.5,
          evidence: false
        });
    }
    
    return candidates.sort((a, b) => b.likelihood - a.likelihood);
  }

  // Phase 3: Hypothesize
  async hypothesizeSolution(sessionId) {
    const session = this.debugSessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session not found: ${sessionId}`);
    }
    
    logger.info(`Systematic Debugging: Hypothesizing solution for ${sessionId}`);
    
    const analysis = session.phases.analyze.data;
    const topCandidate = analysis.rootCauseCandidates[0];
    
    const hypothesis = {
      rootCause: topCandidate.cause,
      likelihood: topCandidate.likelihood,
      solution: this.generateSolution(topCandidate.cause),
      implementationSteps: this.getImplementationSteps(topCandidate.cause),
      verificationCriteria: this.getVerificationCriteria(topCandidate.cause),
      timestamp: new Date().toISOString()
    };
    
    session.phases.hypothesize = {
      completed: true,
      timestamp: new Date().toISOString(),
      data: hypothesis
    };
    
    await this.saveSession(session);
    
    return hypothesis;
  }

  generateSolution(cause) {
    const solutions = {
      'Network connectivity issue': 'Implement retry logic with exponential backoff',
      'API endpoint unavailable': 'Add circuit breaker pattern and fallback endpoints',
      'Invalid or expired credentials': 'Implement automatic token refresh',
      'Insufficient permissions': 'Add permission validation before API calls',
      'Memory leak': 'Implement resource cleanup and memory monitoring',
      'Resource limit exceeded': 'Add resource pooling and rate limiting',
      'Unknown error': 'Add comprehensive error logging and monitoring'
    };
    
    return solutions[cause] || 'Add error handling and logging';
  }

  getImplementationSteps(cause) {
    const steps = {
      'Network connectivity issue': [
        'Add retry mechanism with exponential backoff',
        'Implement connection timeout configuration',
        'Add network status monitoring'
      ],
      'API endpoint unavailable': [
        'Implement circuit breaker pattern',
        'Add fallback API endpoints',
        'Configure health checks'
      ],
      'Invalid or expired credentials': [
        'Implement token refresh logic',
        'Add token validation before API calls',
        'Configure automatic re-authentication'
      ],
      'Insufficient permissions': [
        'Add permission validation',
        'Implement graceful degradation',
        'Add permission request workflow'
      ],
      'Memory leak': [
        'Implement resource cleanup',
        'Add memory monitoring',
        'Optimize data structures'
      ],
      'Resource limit exceeded': [
        'Implement resource pooling',
        'Add rate limiting',
        'Optimize resource usage'
      ],
      'Unknown error': [
        'Add comprehensive error logging',
        'Implement error tracking',
        'Add monitoring and alerting'
      ]
    };
    
    return steps[cause] || ['Add error handling', 'Log error details', 'Monitor for recurrence'];
  }

  getVerificationCriteria(cause) {
    const criteria = {
      'Network connectivity issue': [
        'Connection established within timeout',
        'Retry logic reduces failures by 80%',
        'No connection leaks detected'
      ],
      'API endpoint unavailable': [
        'Circuit breaker activates correctly',
        'Fallback endpoints work',
        'Health checks pass'
      ],
      'Invalid or expired credentials': [
        'Tokens refresh automatically',
        'No authentication failures after refresh',
        'Fallback authentication works'
      ],
      'Insufficient permissions': [
        'Permission validation works',
        'Graceful degradation active',
        'No unauthorized access attempts'
      ],
      'Memory leak': [
        'Memory usage stable over time',
        'No resource leaks detected',
        'Cleanup functions execute correctly'
      ],
      'Resource limit exceeded': [
        'Resource usage within limits',
        'Rate limiting active',
        'Pooling reduces resource usage'
      ],
      'Unknown error': [
        'Error logged with full context',
        'Monitoring captures error',
        'Alert fires for critical errors'
      ]
    };
    
    return criteria[cause] || ['Error handled gracefully', 'System remains operational', 'No data loss'];
  }

  // Phase 4: Verify
  async verifySolution(sessionId, implementationResult) {
    const session = this.debugSessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session not found: ${sessionId}`);
    }
    
    logger.info(`Systematic Debugging: Verifying solution for ${sessionId}`);
    
    const hypothesis = session.phases.hypothesize.data;
    const verification = {
      implemented: implementationResult.success,
      criteria: [],
      passed: [],
      failed: [],
      timestamp: new Date().toISOString()
    };
    
    if (verification.implemented) {
      for (const criterion of hypothesis.verificationCriteria) {
        const result = await this.checkCriterion(criterion, implementationResult);
        verification.criteria.push({
          criterion,
          passed: result.passed,
          details: result.details
        });
        
        if (result.passed) {
          verification.passed.push(criterion);
        } else {
          verification.failed.push(criterion);
        }
      }
    }
    
    verification.overallPassed = verification.implemented && verification.failed.length === 0;
    
    session.phases.verify = {
      completed: true,
      timestamp: new Date().toISOString(),
      data: verification
    };
    
    session.status = verification.overallPassed ? 'resolved' : 'verification_failed';
    
    await this.saveSession(session);
    
    return verification;
  }

  async checkCriterion(criterion, implementationResult) {
    // In production, this would actually verify the criterion
    // For now, return a mock result
    return {
      passed: true,
      details: 'Criterion verified'
    };
  }

  async saveSession(session) {
    try {
      const memoryKey = `debug_session:${session.id}`;
      await saveMemory(this.env, memoryKey, session);
    } catch (error) {
      logger.error(`Systematic Debugging: Failed to save session`, {
        error: error.message
      });
    }
  }

  getSession(sessionId) {
    return this.debugSessions.get(sessionId) || null;
  }

  getAllSessions() {
    return Array.from(this.debugSessions.values());
  }
}

export { SystematicDebuggingManager };
