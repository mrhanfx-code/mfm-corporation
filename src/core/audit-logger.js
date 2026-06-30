// Audit logging for sensitive operations
// Provides comprehensive audit trail for security and compliance

class AuditLogger {
  constructor(env) {
    this.env = env;
  }

  async logEvent(event) {
    const auditRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event
    };
    
    console.log(`[AuditLogger] ${event.action}: ${event.resource || 'N/A'} by ${event.user_id || 'system'}`);
    
    // Store in database
    if (this.env.db) {
      try {
        await this.env.db.prepare(`
          INSERT INTO audit_log (id, action, resource, user_id, details, status, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          auditRecord.id,
          event.action,
          event.resource || null,
          event.user_id || 'system',
          JSON.stringify(event.details || {}),
          event.status || 'success',
          auditRecord.timestamp
        ).run();
      } catch (error) {
        console.error('[AuditLogger] Failed to store audit record:', error);
      }
    }
    
    // Store in KV for recent events
    if (this.env.KV) {
      try {
        const recentKey = `audit:recent:${auditRecord.id}`;
        await this.env.KV.put(recentKey, JSON.stringify(auditRecord), { expirationTtl: 86400 }); // 24 hours
      } catch (error) {
        console.error('[AuditLogger] Failed to store in KV:', error);
      }
    }
    
    return auditRecord.id;
  }

  async logGitHubOperation(action, details, userId = 'system') {
    return await this.logEvent({
      action: `github:${action}`,
      resource: details.repo || details.repository,
      user_id: userId,
      details,
      category: 'github'
    });
  }

  async logEmailOperation(action, details, userId = 'system') {
    return await this.logEvent({
      action: `email:${action}`,
      resource: details.to || details.recipient,
      user_id: userId,
      details,
      category: 'email'
    });
  }

  async logAgentOperation(action, agent, details, userId = 'system') {
    return await this.logEvent({
      action: `agent:${action}`,
      resource: agent,
      user_id: userId,
      details,
      category: 'agent'
    });
  }

  async logDatabaseOperation(action, table, details, userId = 'system') {
    return await this.logEvent({
      action: `database:${action}`,
      resource: table,
      user_id: userId,
      details,
      category: 'database'
    });
  }

  async logSecurityEvent(action, details, userId = 'system') {
    return await this.logEvent({
      action: `security:${action}`,
      resource: details.resource || 'system',
      user_id: userId,
      details,
      category: 'security',
      status: 'alert'
    });
  }

  async logAPIAccess(endpoint, method, userId = 'system', status = 'success') {
    return await this.logEvent({
      action: 'api_access',
      resource: endpoint,
      user_id: userId,
      details: { method, status },
      category: 'api'
    });
  }

  async getAuditLog(filters = {}, limit = 100) {
    if (!this.env.db) return [];
    
    try {
      let query = 'SELECT * FROM audit_log WHERE 1=1';
      const params = [];
      
      if (filters.action) {
        query += ' AND action = ?';
        params.push(filters.action);
      }
      
      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }
      
      if (filters.user_id) {
        query += ' AND user_id = ?';
        params.push(filters.user_id);
      }
      
      if (filters.since) {
        query += ' AND timestamp > ?';
        params.push(filters.since);
      }
      
      query += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(limit);
      
      const result = await this.env.db.prepare(query).bind(...params).all();
      return result.results || [];
    } catch (error) {
      console.error('[AuditLogger] Failed to get audit log:', error);
      return [];
    }
  }

  async getRecentEvents(hours = 24) {
    const since = new Date(Date.now() - hours * 3600000).toISOString();
    return await this.getAuditLog({ since }, 50);
  }

  async getSecurityEvents(hours = 24) {
    const since = new Date(Date.now() - hours * 3600000).toISOString();
    return await this.getAuditLog({ category: 'security', since }, 50);
  }
}

// Singleton instance
let auditLoggerInstance = null;

export function getAuditLogger(env) {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger(env);
  }
  return auditLoggerInstance;
}

export function resetAuditLogger() {
  auditLoggerInstance = null;
}
