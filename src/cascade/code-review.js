// Code Review Workflow — Automated code review with security and quality analysis

import { logger } from '../core/logger.js';

class CodeReviewWorkflow {
  constructor(env) {
    this.env = env;
    this.reviewHistory = new Map();
    this.securityPatterns = new Map();
    this.performancePatterns = new Map();
    this.reviewCounter = 0;
    this.initializePatterns();
  }

  /**
   * Initialize security and performance patterns
   */
  initializePatterns() {
    // Security vulnerability patterns
    this.securityPatterns.set('sql-injection', {
      pattern: /SELECT.*FROM.*WHERE|execute\s*\(|query\s*\(/gi,
      severity: 'critical',
      description: 'Potential SQL injection vulnerability'
    });

    this.securityPatterns.set('hardcoded-secret', {
      pattern: /(password|secret|api[_-]?key|token)\s*=\s*['"][^'"]{8,}['"]/gi,
      severity: 'critical',
      description: 'Hardcoded secret detected'
    });

    this.securityPatterns.set('eval-usage', {
      pattern: /eval\s*\(/gi,
      severity: 'high',
      description: 'Unsafe eval() usage detected'
    });

    this.securityPatterns.set('xss-vulnerability', {
      pattern: /innerHTML\s*=\s*|document\.write\s*\(/gi,
      severity: 'high',
      description: 'Potential XSS vulnerability'
    });

    // Performance patterns
    this.performancePatterns.set('nested-loops', {
      pattern: /for\s*\([^)]*\)\s*{[\s\S]*for\s*\(/gi,
      severity: 'medium',
      description: 'Nested loops detected - potential performance issue'
    });

    this.performancePatterns.set('inefficient-dom', {
      pattern: /document\.getElementById\s*\([^)]*\)\s*inside\s*loop/gi,
      severity: 'medium',
      description: 'DOM operations inside loop detected'
    });

    this.performancePatterns.set('large-objects', {
      pattern: /const\s+\w+\s*=\s*{[\s\S]{500,}}/gi,
      severity: 'low',
      description: 'Large object initialization detected'
    });
  }

  /**
   * Perform automated code review
   * @param {string} code - Code to review
   * @param {string} language - Programming language
   * @param {object} options - Review options
   * @returns {object} Review results
   */
  async reviewCode(code, language = 'javascript', options = {}) {
    this.reviewCounter++;
    const reviewId = `review-${Date.now()}-${this.reviewCounter}`;

    logger.info(`Code Review: Starting review ${reviewId}`, {
      language,
      codeLength: code.length
    });

    // Security analysis
    const securityIssues = this.analyzeSecurity(code);

    // Performance analysis
    const performanceIssues = this.analyzePerformance(code);

    // Quality scoring
    const qualityScore = this.calculateQualityScore(code, securityIssues, performanceIssues);

    // Generate recommendations
    const recommendations = this.generateRecommendations(securityIssues, performanceIssues);

    const reviewResult = {
      id: reviewId,
      code,
      language,
      security: {
        issues: securityIssues,
        score: this.calculateSecurityScore(securityIssues)
      },
      performance: {
        issues: performanceIssues,
        score: this.calculatePerformanceScore(performanceIssues)
      },
      quality: {
        score: qualityScore,
        grade: this.getQualityGrade(qualityScore)
      },
      recommendations,
      summary: this.generateSummary(securityIssues, performanceIssues, qualityScore),
      timestamp: new Date().toISOString()
    };

    // Store in history
    this.reviewHistory.set(reviewId, reviewResult);

    logger.info(`Code Review: Completed review ${reviewId}`, {
      securityScore: reviewResult.security.score,
      performanceScore: reviewResult.performance.score,
      qualityScore: qualityScore
    });

    return reviewResult;
  }

  /**
   * Analyze code for security vulnerabilities
   * @param {string} code - Code to analyze
   * @returns {Array} Security issues
   */
  analyzeSecurity(code) {
    const issues = [];

    for (const [patternName, patternData] of this.securityPatterns) {
      const matches = code.match(patternData.pattern);
      if (matches) {
        issues.push({
          type: patternName,
          severity: patternData.severity,
          description: patternData.description,
          occurrences: matches.length,
          locations: this.findPatternLocations(code, patternData.pattern)
        });
      }
    }

    return issues;
  }

  /**
   * Analyze code for performance issues
   * @param {string} code - Code to analyze
   * @returns {Array} Performance issues
   */
  analyzePerformance(code) {
    const issues = [];

    for (const [patternName, patternData] of this.performancePatterns) {
      const matches = code.match(patternData.pattern);
      if (matches) {
        issues.push({
          type: patternName,
          severity: patternData.severity,
          description: patternData.description,
          occurrences: matches.length,
          locations: this.findPatternLocations(code, patternData.pattern)
        });
      }
    }

    return issues;
  }

  /**
   * Find pattern locations in code
   * @param {string} code - Code to search
   * @param {RegExp} pattern - Pattern to find
   * @returns {Array} Pattern locations
   */
  findPatternLocations(code, pattern) {
    const locations = [];
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    
    while ((match = regex.exec(code)) !== null) {
      const line = code.substring(0, match.index).split('\n').length;
      locations.push({
        line,
        index: match.index,
        snippet: match[0].substring(0, 50)
      });
    }

    return locations;
  }

  /**
   * Calculate security score
   * @param {Array} securityIssues - Security issues
   * @returns {number} Security score (0-100)
   */
  calculateSecurityScore(securityIssues) {
    if (securityIssues.length === 0) return 100;

    let score = 100;
    for (const issue of securityIssues) {
      switch (issue.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Calculate performance score
   * @param {Array} performanceIssues - Performance issues
   * @returns {number} Performance score (0-100)
   */
  calculatePerformanceScore(performanceIssues) {
    if (performanceIssues.length === 0) return 100;

    let score = 100;
    for (const issue of performanceIssues) {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Calculate overall quality score
   * @param {string} code - Code to analyze
   * @param {Array} securityIssues - Security issues
   * @param {Array} performanceIssues - Performance issues
   * @returns {number} Quality score (0-100)
   */
  calculateQualityScore(code, securityIssues, performanceIssues) {
    const securityScore = this.calculateSecurityScore(securityIssues);
    const performanceScore = this.calculatePerformanceScore(performanceIssues);
    
    // Code complexity factor
    const complexityFactor = this.calculateComplexityFactor(code);
    
    // Weighted average
    const qualityScore = (securityScore * 0.4) + (performanceScore * 0.3) + (complexityFactor * 0.3);
    
    return Math.round(qualityScore);
  }

  /**
   * Calculate complexity factor
   * @param {string} code - Code to analyze
   * @returns {number} Complexity score (0-100)
   */
  calculateComplexityFactor(code) {
    const lines = code.split('\n').length;
    const functions = (code.match(/function\s+\w+/g) || []).length;
    const comments = (code.match(/\/\/|\/\*/g) || []).length;
    
    // Simpler code gets higher score
    let complexityScore = 100;
    
    if (lines > 500) complexityScore -= 20;
    if (lines > 1000) complexityScore -= 20;
    if (functions === 0 && lines > 50) complexityScore -= 15;
    if (comments / lines < 0.1) complexityScore -= 10;
    
    return Math.max(0, complexityScore);
  }

  /**
   * Get quality grade
   * @param {number} score - Quality score
   * @returns {string} Quality grade
   */
  getQualityGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate recommendations
   * @param {Array} securityIssues - Security issues
   * @param {Array} performanceIssues - Performance issues
   * @returns {Array} Recommendations
   */
  generateRecommendations(securityIssues, performanceIssues) {
    const recommendations = [];

    // Security recommendations
    for (const issue of securityIssues) {
      if (issue.severity === 'critical' || issue.severity === 'high') {
        recommendations.push({
          priority: 'high',
          category: 'security',
          issue: issue.type,
          action: this.getSecurityRecommendation(issue.type)
        });
      }
    }

    // Performance recommendations
    for (const issue of performanceIssues) {
      if (issue.severity === 'high' || issue.severity === 'medium') {
        recommendations.push({
          priority: 'medium',
          category: 'performance',
          issue: issue.type,
          action: this.getPerformanceRecommendation(issue.type)
        });
      }
    }

    return recommendations;
  }

  /**
   * Get security recommendation
   * @param {string} issueType - Issue type
   * @returns {string} Recommendation
   */
  getSecurityRecommendation(issueType) {
    const recommendations = {
      'sql-injection': 'Use parameterized queries or prepared statements',
      'hardcoded-secret': 'Move secrets to environment variables or secret manager',
      'eval-usage': 'Replace eval() with safer alternatives',
      'xss-vulnerability': 'Use textContent instead of innerHTML, sanitize input'
    };

    return recommendations[issueType] || 'Review and fix security issue';
  }

  /**
   * Get performance recommendation
   * @param {string} issueType - Issue type
   * @returns {string} Recommendation
   */
  getPerformanceRecommendation(issueType) {
    const recommendations = {
      'nested-loops': 'Consider using hash maps or optimizing algorithm',
      'inefficient-dom': 'Cache DOM queries outside loops',
      'large-objects': 'Break down large objects into smaller modules'
    };

    return recommendations[issueType] || 'Review and optimize performance';
  }

  /**
   * Generate review summary
   * @param {Array} securityIssues - Security issues
   * @param {Array} performanceIssues - Performance issues
   * @param {number} qualityScore - Quality score
   * @returns {string} Summary
   */
  generateSummary(securityIssues, performanceIssues, qualityScore) {
    const criticalSecurity = securityIssues.filter(i => i.severity === 'critical').length;
    const highSecurity = securityIssues.filter(i => i.severity === 'high').length;
    const totalIssues = securityIssues.length + performanceIssues.length;

    let summary = `Quality Score: ${qualityScore}/100 (${this.getQualityGrade(qualityScore)})\n`;
    summary += `Total Issues: ${totalIssues}\n`;
    summary += `Critical Security Issues: ${criticalSecurity}\n`;
    summary += `High Security Issues: ${highSecurity}\n`;
    summary += `Performance Issues: ${performanceIssues.length}`;

    return summary;
  }

  /**
   * Get review history
   * @param {number} limit - Maximum number of entries
   * @returns {Array} Review history
   */
  getReviewHistory(limit = 50) {
    const history = Array.from(this.reviewHistory.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return history.slice(0, limit);
  }

  /**
   * Get review statistics
   * @returns {object} Review statistics
   */
  getReviewStatistics() {
    const reviews = Array.from(this.reviewHistory.values());

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageQualityScore: 0,
        averageSecurityScore: 0,
        averagePerformanceScore: 0
      };
    }

    const avgQuality = reviews.reduce((sum, r) => sum + r.quality.score, 0) / reviews.length;
    const avgSecurity = reviews.reduce((sum, r) => sum + r.security.score, 0) / reviews.length;
    const avgPerformance = reviews.reduce((sum, r) => sum + r.performance.score, 0) / reviews.length;

    return {
      totalReviews: reviews.length,
      averageQualityScore: avgQuality.toFixed(1),
      averageSecurityScore: avgSecurity.toFixed(1),
      averagePerformanceScore: avgPerformance.toFixed(1)
    };
  }

  /**
   * Clear review history
   */
  clearHistory() {
    this.reviewHistory.clear();
    logger.info(`Code Review: History cleared`);
  }
}

export { CodeReviewWorkflow };
