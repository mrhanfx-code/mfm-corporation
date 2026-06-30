// Audit Logging System — Immutable audit trail for critical operations
// Logs all security-relevant events with blockchain-like immutability

import { logger } from './logger.js';
import crypto from 'crypto';

// Audit event types
export const AUDIT_EVENTS = {
  // Authentication
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  LOGIN_FAILED: 'auth.login_failed',
  
  // Authorization
  PERMISSION_GRANTED: 'auth.permission_granted',
  PERMISSION_DENIED: 'auth.permission_denied',
  ROLE_ASSIGNED: 'auth.role_assigned',
  ROLE_CHANGED: 'auth.role_changed',
  
  // Data operations
  DATA_READ: 'data.read',
  DATA_CREATED: 'data.created',
  DATA_UPDATED: 'data.updated',
  DATA_DELETED: 'data.deleted',
  
  // System operations
  SYSTEM_CONFIG_CHANGED: 'system.config_changed',
  SYSTEM_STARTED: 'system.started',
  SYSTEM_STOPPED: 'system.stopped',
  
  // Security events
  SECURITY_ALERT: 'security.alert',
  THREAT_DETECTED: 'security.threat_detected',
  SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
  
  // Agent operations
  AGENT_EXECUTED: 'agent.executed',
  AGENT_FAILED: 'agent.failed',
  AGENT_APPROVED: 'agent.approved',
  AGENT_REJECTED: 'agent.rejected',
};

class AuditLoggingService {
  constructor(db, kv) {
    this.db = db;
    this.kv = kv;
    this.chainHashes = new Map(); // For blockchain-like verification
  }

  /**
   * Log an audit event
   * @param {object} event - Audit event data
   * @returns {Promise<boolean>} Success status
   */
  async logEvent(event) {
    try {
      const auditRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        eventType: event.eventType,
        userId: event.userId || 'system',
        resourceId: event.resourceId || null,
        action: event.action,
        details: event.details || {},
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
        result: event.result || 'success',
        previousHash: this.getPreviousHash(),
        hash: null // Will be calculated
      };

      // Calculate hash for immutability
      auditRecord.hash = this.calculateHash(auditRecord);

      // Store in database
      await this.db.prepare(`
        INSERT INTO audit_logs (
          id, timestamp, event_type, user_id, resource_id,
          action, details, ip_address, user_agent, result,
          previous_hash, hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        auditRecord.id,
        auditRecord.timestamp,
        auditRecord.eventType,
        auditRecord.userId,
        auditRecord.resourceId,
        auditRecord.action,
        JSON.stringify(auditRecord.details),
        auditRecord.ipAddress,
        auditRecord.userAgent,
        auditRecord.result,
        auditRecord.previousHash,
        auditRecord.hash
      ).run();

      // Update chain
      this.chainHashes.set(auditRecord.id, auditRecord.hash);

      logger.info('audit', 'event_logged', { 
        id: auditRecord.id, 
        eventType: auditRecord.eventType,
        userId: auditRecord.userId 
      });

      return true;
    } catch (err) {
      logger.error('audit', 'log_failed', { 
        eventType: event.eventType, 
        error: err.message 
      });
      return false;
    }
  }

  /**
   * Calculate hash for audit record
   * @param {object} record - Audit record
   * @returns {string} Hash
   */
  calculateHash(record) {
    const data = JSON.stringify({
      timestamp: record.timestamp,
      eventType: record.eventType,
      userId: record.userId,
      resourceId: record.resourceId,
      action: record.action,
      details: record.details,
      previousHash: record.previousHash
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get previous hash in chain
   * @returns {string|null} Previous hash
   */
  getPreviousHash() {
    const hashes = Array.from(this.chainHashes.values());
    return hashes.length > 0 ? hashes[hashes.length - 1] : null;
  }

  /**
   * Verify audit log integrity
   * @returns {Promise<boolean>} Integrity status
   */
  async verifyIntegrity() {
    try {
      const records = await this.db.prepare(`
        SELECT id, timestamp, event_type, user_id, resource_id,
               action, details, previous_hash, hash
        FROM audit_logs
        ORDER BY timestamp ASC
      `).all();

      const results = records.results || [];
      let previousHash = null;

      for (const record of results) {
        // Recalculate hash
        const recalculatedHash = this.calculateHash({
          timestamp: record.timestamp,
          eventType: record.event_type,
          userId: record.user_id,
          resourceId: record.resource_id,
          action: record.action,
          details: JSON.parse(record.details),
          previousHash: record.previous_hash
        });

        // Verify hash matches
        if (recalculatedHash !== record.hash) {
          logger.error('audit', 'integrity_failed', { 
            id: record.id,
            expected: record.hash,
            calculated: recalculatedHash
          });
          return false;
        }

        // Verify chain
        if (record.previous_hash !== previousHash) {
          logger.error('audit', 'chain_broken', { 
            id: record.id,
            expected: previousHash,
            actual: record.previous_hash
          });
          return false;
        }

        previousHash = record.hash;
      }

      logger.info('audit', 'integrity_verified', { recordCount: results.length });
      return true;
    } catch (err) {
      logger.error('audit', 'verify_failed', { error: err.message });
      return false;
    }
  }

  /**
   * Query audit logs
   * @param {object} filters - Query filters
   * @returns {Promise<Array>} Audit records
   */
  async queryLogs(filters = {}) {
    try {
      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      const params = [];

      if (filters.userId) {
        query += ' AND user_id = ?';
        params.push(filters.userId);
      }

      if (filters.eventType) {
        query += ' AND event_type = ?';
        params.push(filters.eventType);
      }

      if (filters.resourceId) {
        query += ' AND resource_id = ?';
        params.push(filters.resourceId);
      }

      if (filters.startDate) {
        query += ' AND timestamp >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND timestamp <= ?';
        params.push(filters.endDate);
      }

      query += ' ORDER BY timestamp DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const result = await this.db.prepare(query).bind(...params).all();
      return result.results || [];
    } catch (err) {
      logger.error('audit', 'query_failed', { error: err.message });
      return [];
    }
  }

  /**
   * Get audit statistics
   * @param {object} filters - Query filters
   * @returns {Promise<object>} Statistics
   */
  async getStatistics(filters = {}) {
    try {
      const records = await this.queryLogs(filters);
      
      const stats = {
        total: records.length,
        byEventType: {},
        byUser: {},
        byResult: {},
        timeRange: null
      };

      if (records.length > 0) {
        stats.timeRange = {
          start: Math.min(...records.map(r => r.timestamp)),
          end: Math.max(...records.map(r => r.timestamp))
        };
      }

      for (const record of records) {
        // By event type
        stats.byEventType[record.event_type] = (stats.byEventType[record.event_type] || 0) + 1;

        // By user
        stats.byUser[record.user_id] = (stats.byUser[record.user_id] || 0) + 1;

        // By result
        stats.byResult[record.result] = (stats.byResult[record.result] || 0) + 1;
      }

      return stats;
    } catch (err) {
      logger.error('audit', 'stats_failed', { error: err.message });
      return null;
    }
  }

  /**
   * Helper: Log permission check
   * @param {string} userId - User ID
   * @param {string} permission - Permission checked
   * @param {boolean} granted - Permission granted status
   * @param {object} context - Request context
   */
  async logPermissionCheck(userId, permission, granted, context = {}) {
    await this.logEvent({
      eventType: granted ? AUDIT_EVENTS.PERMISSION_GRANTED : AUDIT_EVENTS.PERMISSION_DENIED,
      userId,
      action: 'permission_check',
      details: {
        permission,
        granted,
        resource: context.resourceId
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      result: granted ? 'success' : 'denied'
    });
  }

  /**
   * Helper: Log data operation
   * @param {string} userId - User ID
   * @param {string} operation - Operation type (read, created, updated, deleted)
   * @param {string} resourceType - Resource type
   * @param {string} resourceId - Resource ID
   * @param {object} details - Operation details
   * @param {object} context - Request context
   */
  async logDataOperation(userId, operation, resourceType, resourceId, details, context = {}) {
    const eventTypeMap = {
      read: AUDIT_EVENTS.DATA_READ,
      created: AUDIT_EVENTS.DATA_CREATED,
      updated: AUDIT_EVENTS.DATA_UPDATED,
      deleted: AUDIT_EVENTS.DATA_DELETED
    };

    await this.logEvent({
      eventType: eventTypeMap[operation] || AUDIT_EVENTS.DATA_READ,
      userId,
      resourceId,
      action: `${operation}_${resourceType}`,
      details: {
        resourceType,
        ...details
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      result: 'success'
    });
  }

  /**
   * Helper: Log security alert
   * @param {string} userId - User ID (optional)
   * @param {string} alertType - Alert type
   * @param {string} severity - Severity level
   * @param {object} details - Alert details
   * @param {object} context - Request context
   */
  async logSecurityAlert(userId, alertType, severity, details, context = {}) {
    await this.logEvent({
      eventType: AUDIT_EVENTS.SECURITY_ALERT,
      userId: userId || 'system',
      action: 'security_alert',
      details: {
        alertType,
        severity,
        ...details
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      result: 'alert'
    });
  }
}

export { AuditLoggingService };
