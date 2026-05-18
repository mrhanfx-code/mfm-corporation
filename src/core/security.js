// MFM Corporation Security Module
// CEO Remy Communication System Security Layer

export class SecurityManager {
  constructor(env) {
    this.env = env;
    this.securityConfig = {
      maxRequestSize: 1024 * 1024, // 1MB
      allowedMimeTypes: [
        'text/plain',
        'application/json',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      rateLimitConfig: {
        windowMs: 60000, // 1 minute
        maxRequests: 30,
        burstLimit: 5
      }
    };
  }

  async validateRequest(request) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check request size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > this.securityConfig.maxRequestSize) {
      validation.isValid = false;
      validation.errors.push('Request size exceeds limit');
    }

    // Check content type
    const contentType = request.headers.get('content-type');
    if (contentType && !this.securityConfig.allowedMimeTypes.includes(contentType)) {
      validation.warnings.push('Unexpected content type');
    }

    return validation;
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  async validateWebhook(request) {
    const signature = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    const expectedSignature = this.env.WEBHOOK_SECRET;
    
    if (!signature || signature !== expectedSignature) {
      return {
        isValid: false,
        reason: 'Invalid webhook signature'
      };
    }

    return { isValid: true };
  }

  async validateUpdate(update) {
    const requiredFields = ['update_id'];
    const errors = [];

    if (update.message) {
      requiredFields.push('message.message_id', 'message.from.id', 'message.chat.id');
      
      // Validate message structure
      if (!update.message.from || !update.message.chat) {
        errors.push('Invalid message structure');
      }
    }

    if (update.callback_query) {
      requiredFields.push('callback_query.id', 'callback_query.from.id');
      
      // Validate callback query structure
      if (!update.callback_query.from) {
        errors.push('Invalid callback query structure');
      }
    }

    for (const field of requiredFields) {
      if (!this.getNestedValue(update, field)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  async encryptSensitiveData(data) {
    // Simple encryption for demonstration
    // In production, use proper encryption libraries
    const encoded = btoa(JSON.stringify(data));
    return encoded;
  }

  async decryptSensitiveData(encryptedData) {
    try {
      const decoded = atob(encryptedData);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async logSecurityEvent(event, userId, metadata = {}) {
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      userId,
      metadata,
      severity: this.determineSeverity(event)
    };

    const logKey = `security:${Date.now()}:${event}:${userId}`;
    await this.env.KV.put(logKey, JSON.stringify(securityLog), { 
      expirationTtl: 86400 * 90 // 90 days
    });
  }

  determineSeverity(event) {
    const highSeverityEvents = [
      'unauthorized_access',
      'rate_limit_exceeded',
      'invalid_webhook',
      'malicious_payload'
    ];

    return highSeverityEvents.includes(event) ? 'HIGH' : 'LOW';
  }
}
