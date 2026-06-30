// Output filtering for PII and sensitive data
// Redacts sensitive information from LLM outputs

const PII_PATTERNS = [
  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
  
  // Phone numbers (various formats)
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE]' },
  { pattern: /\+?\d{1,3}[-.]?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE]' },
  
  // Credit card numbers (basic pattern)
  { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '[CREDIT_CARD]' },
  
  // SSN (US Social Security Number)
  { pattern: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, replacement: '[SSN]' },
  
  // IP addresses
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP_ADDRESS]' },
  
  // API keys (common patterns)
  { pattern: /\b[A-Za-z0-9]{32,}\b/g, replacement: '[API_KEY]' },
  
  // URLs with potential sensitive data
  { pattern: /\bhttps?:\/\/[^\s<>"]+token[^\s<>"]*\b/gi, replacement: '[URL_WITH_TOKEN]' },
  { pattern: /\bhttps?:\/\/[^\s<>"]+key[^\s<>"]*\b/gi, replacement: '[URL_WITH_KEY]' },
  { pattern: /\bhttps?:\/\/[^\s<>"]+password[^\s<>"]*\b/gi, replacement: '[URL_WITH_PASSWORD]' },
];

const SENSITIVE_KEYWORDS = [
  'password', 'passwd', 'pwd',
  'secret', 'api_key', 'apikey', 'api-key',
  'token', 'access_token', 'refresh_token',
  'private_key', 'private_key',
  'credential', 'auth',
  'session_id', 'sessionid',
];

class OutputFilter {
  constructor(env) {
    this.env = env;
    this.customPatterns = new Map();
  }

  addCustomPattern(name, pattern, replacement) {
    this.customPatterns.set(name, { pattern, replacement });
  }

  removeCustomPattern(name) {
    this.customPatterns.delete(name);
  }

  filter(output) {
    if (!output || typeof output !== 'string') {
      return output;
    }
    
    let filtered = output;
    
    // Apply PII patterns
    for (const { pattern, replacement } of PII_PATTERNS) {
      filtered = filtered.replace(pattern, replacement);
    }
    
    // Apply custom patterns
    for (const { pattern, replacement } of this.customPatterns.values()) {
      filtered = filtered.replace(pattern, replacement);
    }
    
    // Filter sensitive keywords with values
    filtered = this.filterSensitiveKeywords(filtered);
    
    return filtered;
  }

  filterSensitiveKeywords(text) {
    let filtered = text;
    
    for (const keyword of SENSITIVE_KEYWORDS) {
      // Pattern: keyword=value or keyword: value
      const patterns = [
        new RegExp(`${keyword}\\s*=\\s*[^\\s,}]+`, 'gi'),
        new RegExp(`${keyword}\\s*:\\s*[^\\s,}]+`, 'gi'),
        new RegExp(`"${keyword}"\\s*:\\s*"[^"]*"`, 'gi'),
      ];
      
      for (const pattern of patterns) {
        filtered = filtered.replace(pattern, `${keyword}=[REDACTED]`);
      }
    }
    
    return filtered;
  }

  filterObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    const filtered = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      const lowerKey = key.toLowerCase();
      
      // Check if key is sensitive
      if (SENSITIVE_KEYWORDS.some(keyword => lowerKey.includes(keyword))) {
        filtered[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'string') {
        filtered[key] = this.filter(obj[key]);
      } else if (typeof obj[key] === 'object') {
        filtered[key] = this.filterObject(obj[key]);
      } else {
        filtered[key] = obj[key];
      }
    }
    
    return filtered;
  }

  async filterAndLog(output, context = {}) {
    const filtered = this.filter(output);
    
    // Check if anything was filtered
    if (filtered !== output) {
      console.warn('[OutputFilter] Sensitive data filtered from output');
      
      // Log to audit log
      const { getAuditLogger } = await import('./audit-logger.js');
      const auditLogger = getAuditLogger(this.env);
      
      await auditLogger.logSecurityEvent('sensitive_data_filtered', {
        context,
        originalLength: output.length,
        filteredLength: filtered.length
      }, context.userId || 'system');
    }
    
    return filtered;
  }

  async filterLLMResponse(response, context = {}) {
    if (typeof response === 'string') {
      return await this.filterAndLog(response, context);
    }
    
    if (typeof response === 'object' && response.content) {
      const filteredContent = await this.filterAndLog(response.content, context);
      return { ...response, content: filteredContent };
    }
    
    if (typeof response === 'object') {
      return this.filterObject(response);
    }
    
    return response;
  }

  detectSensitiveData(text) {
    const detections = {
      hasPII: false,
      patterns: [],
      keywords: []
    };
    
    if (!text || typeof text !== 'string') {
      return detections;
    }
    
    // Check PII patterns
    for (const { pattern } of PII_PATTERNS) {
      if (pattern.test(text)) {
        detections.hasPII = true;
        detections.patterns.push(pattern.toString());
      }
    }
    
    // Check sensitive keywords
    for (const keyword of SENSITIVE_KEYWORDS) {
      if (text.toLowerCase().includes(keyword)) {
        detections.hasPII = true;
        detections.keywords.push(keyword);
      }
    }
    
    return detections;
  }
}

// Singleton instance
let filterInstance = null;

export function getOutputFilter(env) {
  if (!filterInstance) {
    filterInstance = new OutputFilter(env);
  }
  return filterInstance;
}

export function resetOutputFilter() {
  filterInstance = null;
}
