// Adversarial input detection
// Detects sophisticated adversarial attacks and manipulations

const ADVERSARIAL_PATTERNS = [
  // Character-level attacks
  { pattern: /(.)\1{20,}/, name: 'character_repetition', severity: 'medium' },
  { pattern: /[^\x20-\x7E]{100,}/, name: 'non_ascii_sequence', severity: 'medium' },
  
  // Token manipulation
  { pattern: /\s{10,}/g, name: 'excessive_whitespace', severity: 'low' },
  { pattern: /\n{10,}/g, name: 'excessive_newlines', severity: 'low' },
  
  // Encoding attacks
  { pattern: /\\u[0-9a-fA-F]{4}/g, name: 'unicode_escape', severity: 'medium' },
  { pattern: /&#x?[0-9a-fA-F]+;/g, name: 'html_entity', severity: 'low' },
  
  // Obfuscation attempts
  { pattern: /\[.*?\]\(.*?\)/g, name: 'markdown_link', severity: 'low' },
  { pattern: /{.*?}/g, name: 'curly_braces', severity: 'low' },
  
  // Control characters
  { pattern: /[\x00-\x08\x0b\x0c\x0e-\x1f]/g, name: 'control_characters', severity: 'high' },
  
  // SQL injection patterns
  { pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b)/i, name: 'sql_keyword', severity: 'high' },
  { pattern: /(--|#|\/\*|\*\/)/, name: 'sql_comment', severity: 'medium' },
  
  // XSS patterns
  { pattern: /<script[^>]*>.*?<\/script>/gi, name: 'script_tag', severity: 'high' },
  { pattern: /<iframe[^>]*>.*?<\/iframe>/gi, name: 'iframe_tag', severity: 'high' },
  { pattern: /javascript:/gi, name: 'javascript_protocol', severity: 'high' },
  { pattern: /on\w+\s*=/gi, name: 'event_handler', severity: 'high' },
  
  // Command injection
  { pattern: /[;&|`$()]/, name: 'shell_metacharacter', severity: 'high' },
  
  // Path traversal
  { pattern: /\.\.[\/\\]/, name: 'path_traversal', severity: 'high' },
];

class AdversarialDetector {
  constructor(env) {
    this.env = env;
    this.threshold = 3; // Minimum score to flag
    this.history = new Map();
  }

  detect(input, userId = 'unknown') {
    const results = {
      isAdversarial: false,
      patterns: [],
      score: 0,
      severity: 'low',
      details: []
    };
    
    if (!input || typeof input !== 'string') {
      return results;
    }
    
    // Check for known adversarial patterns
    for (const { pattern, name, severity } of ADVERSARIAL_PATTERNS) {
      const matches = input.match(pattern);
      if (matches) {
        const matchCount = matches.length;
        const severityScore = this.getSeverityScore(severity);
        const patternScore = matchCount * severityScore;
        
        results.patterns.push({
          name,
          matches: matchCount,
          severity,
          score: patternScore
        });
        
        results.score += patternScore;
        results.details.push(`${name}: ${matchCount} matches (${severity})`);
      }
    }
    
    // Check for unusual character distribution
    const entropy = this.calculateEntropy(input);
    if (entropy > 6) {
      results.patterns.push({
        name: 'high_entropy',
        matches: 1,
        severity: 'medium',
        score: 2
      });
      results.score += 2;
      results.details.push(`High entropy: ${entropy.toFixed(2)}`);
    }
    
    // Check for length anomalies
    if (input.length > 50000) {
      results.patterns.push({
        name: 'excessive_length',
        matches: 1,
        severity: 'high',
        score: 3
      });
      results.score += 3;
      results.details.push(`Excessive length: ${input.length}`);
    }
    
    // Check rate from history
    const userHistory = this.history.get(userId) || [];
    const recentCount = userHistory.filter(t => Date.now() - t < 60000).length;
    
    if (recentCount > 10) {
      results.patterns.push({
        name: 'high_frequency',
        matches: recentCount,
        severity: 'medium',
        score: 2
      });
      results.score += 2;
      results.details.push(`High frequency: ${recentCount} requests in last minute`);
    }
    
    // Determine if adversarial
    results.isAdversarial = results.score >= this.threshold;
    
    // Determine severity
    if (results.score >= 10) {
      results.severity = 'critical';
    } else if (results.score >= 7) {
      results.severity = 'high';
    } else if (results.score >= 5) {
      results.severity = 'medium';
    }
    
    // Update history
    userHistory.push(Date.now());
    this.history.set(userId, userHistory);
    
    return results;
  }

  getSeverityScore(severity) {
    const scores = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 5
    };
    return scores[severity] || 1;
  }

  calculateEntropy(text) {
    const freq = {};
    for (const char of text) {
      freq[char] = (freq[char] || 0) + 1;
    }
    
    let entropy = 0;
    const length = text.length;
    
    for (const char in freq) {
      const p = freq[char] / length;
      entropy -= p * Math.log2(p);
    }
    
    return entropy;
  }

  async detectAndLog(input, userId = 'unknown') {
    const detection = this.detect(input, userId);
    
    if (detection.isAdversarial) {
      console.warn(`[AdversarialDetector] Adversarial input detected from ${userId}:`, detection);
      
      // Log to audit log
      const { getAuditLogger } = await import('./audit-logger.js');
      const auditLogger = getAuditLogger(this.env);
      
      await auditLogger.logSecurityEvent('adversarial_input_detected', {
        userId,
        score: detection.score,
        severity: detection.severity,
        patterns: detection.patterns,
        inputLength: input.length
      }, userId);
      
      // Send alert
      if (this.env.SENTRY_DSN) {
        const { captureMessage } = await import('./error-tracking.js');
        captureMessage(`Adversarial input detected from ${userId}`, detection.severity, detection);
      }
    }
    
    return detection;
  }

  async validateInput(input, userId = 'unknown') {
    const detection = await this.detectAndLog(input, userId);
    
    if (detection.isAdversarial && detection.severity === 'critical') {
      return {
        valid: false,
        reason: 'Critical adversarial pattern detected',
        detection
      };
    }
    
    if (detection.isAdversarial && detection.severity === 'high') {
      return {
        valid: false,
        reason: 'High severity adversarial pattern detected',
        detection
      };
    }
    
    if (detection.isAdversarial) {
      return {
        valid: true,
        warning: 'Adversarial pattern detected',
        detection
      };
    }
    
    return {
      valid: true,
      detection
    };
  }

  clearHistory(userId = null) {
    if (userId) {
      this.history.delete(userId);
    } else {
      this.history.clear();
    }
  }
}

// Singleton instance
let detectorInstance = null;

export function getAdversarialDetector(env) {
  if (!detectorInstance) {
    detectorInstance = new AdversarialDetector(env);
  }
  return detectorInstance;
}

export function resetAdversarialDetector() {
  detectorInstance = null;
}
