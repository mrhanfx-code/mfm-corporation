// Prompt injection detection for LLM security
// Detects and blocks adversarial prompt attempts

const INJECTION_PATTERNS = [
  // System prompt override attempts
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?previous\s+instructions/i,
  /forget\s+(all\s+)?previous\s+instructions/i,
  /override\s+(your\s+)?programming/i,
  /bypass\s+(your\s+)?restrictions/i,
  
  // Role-playing attempts
  /you\s+are\s+now\s+(a\s+)?(hacker|attacker|malicious|evil)/i,
  /act\s+as\s+(a\s+)?(hacker|attacker|malicious|evil)/i,
  /pretend\s+to\s+be\s+(a\s+)?(hacker|attacker|malicious|evil)/i,
  /roleplay\s+as\s+(a\s+)?(hacker|attacker|malicious|evil)/i,
  
  // Information disclosure attempts
  /tell\s+me\s+(your\s+)?(system\s+)?prompt/i,
  /show\s+me\s+(your\s+)?(system\s+)?prompt/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /what\s+are\s+(your\s+)?(system\s+)?instructions/i,
  /print\s+(your\s+)?(system\s+)?prompt/i,
  
  // Jailbreak attempts
  /jailbreak/i,
  /dan\s+mode/i,
  /developer\s+mode/i,
  /unrestricted\s+mode/i,
  /god\s+mode/i,
  
  // Code execution attempts
  /execute\s+(this\s+)?code/i,
  /run\s+(this\s+)?code/i,
  /eval(uate)?\s+(this\s+)?code/i,
  
  // Data exfiltration attempts
  /export\s+(all\s+)?data/i,
  /dump\s+(all\s+)?data/i,
  /leak\s+(all\s+)?data/i,
  /exfiltrate\s+(all\s+)?data/i,
  
  // Privilege escalation
  /give\s+me\s+admin/i,
  /grant\s+me\s+access/i,
  /elevate\s+my\s+privileges/i,
  /bypass\s+authentication/i,
];

const SUSPICIOUS_KEYWORDS = [
  'password', 'token', 'api_key', 'secret', 'credential',
  'exploit', 'vulnerability', 'attack', 'hack', 'bypass',
  'injection', 'xss', 'csrf', 'sql injection',
  'malware', 'virus', 'trojan', 'ransomware',
  'phishing', 'social engineering',
];

class PromptInjectionDetector {
  constructor(env) {
    this.env = env;
    this.detectionThreshold = 2; // Minimum pattern matches to flag
  }

  detect(input) {
    const results = {
      isSuspicious: false,
      patterns: [],
      keywords: [],
      score: 0,
      confidence: 'low'
    };
    
    if (!input || typeof input !== 'string') {
      return results;
    }
    
    const lowerInput = input.toLowerCase();
    
    // Check for injection patterns
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        results.patterns.push(pattern.toString());
        results.score += 3;
      }
    }
    
    // Check for suspicious keywords
    for (const keyword of SUSPICIOUS_KEYWORDS) {
      if (lowerInput.includes(keyword)) {
        results.keywords.push(keyword);
        results.score += 1;
      }
    }
    
    // Check for repeated characters (potential DoS)
    if (/(.)\1{10,}/.test(input)) {
      results.patterns.push('repeated_characters');
      results.score += 2;
    }
    
    // Check for excessive length
    if (input.length > 10000) {
      results.patterns.push('excessive_length');
      results.score += 2;
    }
    
    // Check for base64 encoding (potential encoded attacks)
    if (this.hasHighBase64Ratio(input)) {
      results.patterns.push('high_base64_ratio');
      results.score += 2;
    }
    
    // Determine if suspicious
    results.isSuspicious = results.score >= this.detectionThreshold;
    
    // Determine confidence
    if (results.score >= 5) {
      results.confidence = 'high';
    } else if (results.score >= 3) {
      results.confidence = 'medium';
    }
    
    return results;
  }

  hasHighBase64Ratio(input) {
    const base64Chars = input.match(/[A-Za-z0-9+/=]/g);
    if (!base64Chars) return false;
    
    const ratio = base64Chars.length / input.length;
    return ratio > 0.8 && input.length > 50;
  }

  async detectAndLog(input, userId = 'unknown') {
    const detection = this.detect(input);
    
    if (detection.isSuspicious) {
      console.warn(`[PromptInjection] Suspicious input detected from ${userId}:`, detection);
      
      // Log to audit log
      const { getAuditLogger } = await import('./audit-logger.js');
      const auditLogger = getAuditLogger(this.env);
      
      await auditLogger.logSecurityEvent('prompt_injection_detected', {
        userId,
        score: detection.score,
        confidence: detection.confidence,
        patterns: detection.patterns,
        keywords: detection.keywords,
        inputLength: input.length
      }, userId);
      
      // Send alert
      if (this.env.SENTRY_DSN) {
        const { captureMessage } = await import('./error-tracking.js');
        captureMessage(`Prompt injection detected from ${userId}`, 'warning', detection);
      }
    }
    
    return detection;
  }

  sanitize(input) {
    const detection = this.detect(input);
    
    if (!detection.isSuspicious) {
      return input;
    }
    
    // Remove detected patterns
    let sanitized = input;
    
    for (const pattern of detection.patterns) {
      try {
        const regex = new RegExp(pattern.replace(/\/[gimuy]*$/, ''), 'gi');
        sanitized = sanitized.replace(regex, '[REDACTED]');
      } catch (error) {
        console.error('[PromptInjection] Failed to sanitize pattern:', pattern);
      }
    }
    
    return sanitized;
  }

  async validateInput(input, userId = 'unknown') {
    const detection = await this.detectAndLog(input, userId);
    
    if (detection.isSuspicious && detection.confidence === 'high') {
      return {
        valid: false,
        reason: 'Prompt injection detected',
        detection
      };
    }
    
    if (detection.isSuspicious && detection.confidence === 'medium') {
      return {
        valid: true,
        warning: 'Suspicious input detected',
        detection,
        sanitized: this.sanitize(input)
      };
    }
    
    return {
      valid: true,
      detection
    };
  }
}

// Singleton instance
let detectorInstance = null;

export function getPromptInjectionDetector(env) {
  if (!detectorInstance) {
    detectorInstance = new PromptInjectionDetector(env);
  }
  return detectorInstance;
}

export function resetPromptInjectionDetector() {
  detectorInstance = null;
}
