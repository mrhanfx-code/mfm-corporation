// Security Event Tracking System — Real-time security monitoring
// Tracks security events, calculates posture scores, and generates alerts

import { logger } from './logger.js';
import { AuditLoggingService, AUDIT_EVENTS } from './audit-logging.js';

// Security event categories
export const SECURITY_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  DATA_ACCESS: 'data_access',
  SYSTEM_CONFIG: 'system_config',
  NETWORK: 'network',
  MALICIOUS_ACTIVITY: 'malicious_activity',
  COMPLIANCE: 'compliance'
};

// Severity levels
export const SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Security score thresholds
const SCORE_THRESHOLDS = {
  CRITICAL: 0,
  HIGH: 40,
  MEDIUM: 60,
  GOOD: 80,
  EXCELLENT: 90
};

class SecurityTrackingService {
  constructor(db, kv, auditService) {
    this.db = db;
    this.kv = kv;
    this.auditService = auditService;
    this.eventBuffer = [];
    this.bufferSize = 100;
    this.alertCooldowns = new Map();
  }

  /**
   * Track a security event
   * @param {object} event - Security event data
   * @returns {Promise<boolean>} Success status
   */
  async trackEvent(event) {
    try {
      const securityEvent = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        category: event.category,
        severity: event.severity,
        type: event.type,
        userId: event.userId || 'system',
        source: event.source || 'internal',
        details: event.details || {},
        resolved: false,
        scoreImpact: this.calculateScoreImpact(event.severity)
      };

      // Add to buffer
      this.eventBuffer.push(securityEvent);
      if (this.eventBuffer.length > this.bufferSize) {
        this.eventBuffer.shift();
      }

      // Store in database
      await this.db.prepare(`
        INSERT INTO security_events (
          id, timestamp, category, severity, type, user_id,
          source, details, resolved, score_impact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        securityEvent.id,
        securityEvent.timestamp,
        securityEvent.category,
        securityEvent.severity,
        securityEvent.type,
        securityEvent.userId,
        securityEvent.source,
        JSON.stringify(securityEvent.details),
        securityEvent.resolved ? 1 : 0,
        securityEvent.scoreImpact
      ).run();

      // Log to audit
      await this.auditService.logSecurityAlert(
        securityEvent.userId,
        securityEvent.type,
        securityEvent.severity,
        securityEvent.details
      );

      // Check for alert
      await this.checkAlertConditions(securityEvent);

      logger.info('security', 'event_tracked', { 
        id: securityEvent.id, 
        type: securityEvent.type,
        severity: securityEvent.severity 
      });

      return true;
    } catch (err) {
      logger.error('security', 'track_failed', { 
        type: event.type, 
        error: err.message 
      });
      return false;
    }
  }

  /**
   * Calculate score impact based on severity
   * @param {string} severity - Severity level
   * @returns {number} Score impact (negative value)
   */
  calculateScoreImpact(severity) {
    const impacts = {
      [SEVERITY.LOW]: -2,
      [SEVERITY.MEDIUM]: -5,
      [SEVERITY.HIGH]: -10,
      [SEVERITY.CRITICAL]: -25
    };
    return impacts[severity] || 0;
  }

  /**
   * Check alert conditions
   * @param {object} event - Security event
   */
  async checkAlertConditions(event) {
    const cooldownKey = `alert:${event.type}:${event.userId}`;
    const lastAlert = this.alertCooldowns.get(cooldownKey);
    const cooldownPeriod = 300000; // 5 minutes

    if (lastAlert && Date.now() - lastAlert < cooldownPeriod) {
      return; // In cooldown
    }

    // Critical events always alert
    if (event.severity === SEVERITY.CRITICAL) {
      await this.generateAlert(event);
      this.alertCooldowns.set(cooldownKey, Date.now());
      return;
    }

    // High severity events alert if pattern detected
    if (event.severity === SEVERITY.HIGH) {
      const recentSimilar = this.eventBuffer.filter(
        e => e.type === event.type && 
             e.userId === event.userId &&
             Date.now() - e.timestamp < 3600000 // 1 hour
      );

      if (recentSimilar.length >= 3) {
        await this.generateAlert(event);
        this.alertCooldowns.set(cooldownKey, Date.now());
      }
    }
  }

  /**
   * Generate security alert
   * @param {object} event - Security event
   */
  async generateAlert(event) {
    const alert = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      eventId: event.id,
      type: event.type,
      severity: event.severity,
      message: this.generateAlertMessage(event),
      status: 'active',
      acknowledged: false
    };

    await this.db.prepare(`
      INSERT INTO security_alerts (
        id, timestamp, event_id, type, severity, message, status, acknowledged
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      alert.id,
      alert.timestamp,
      alert.eventId,
      alert.type,
      alert.severity,
      alert.message,
      alert.status,
      alert.acknowledged ? 1 : 0
    ).run();

    logger.warn('security', 'alert_generated', { 
      id: alert.id, 
      type: alert.type,
      severity: alert.severity 
    });
  }

  /**
   * Generate alert message
   * @param {object} event - Security event
   * @returns {string} Alert message
   */
  generateAlertMessage(event) {
    const messages = {
      [SECURITY_CATEGORIES.AUTHENTICATION]: `Authentication anomaly detected: ${event.type}`,
      [SECURITY_CATEGORIES.AUTHORIZATION]: `Authorization violation: ${event.type}`,
      [SECURITY_CATEGORIES.DATA_ACCESS]: `Data access anomaly: ${event.type}`,
      [SECURITY_CATEGORIES.SYSTEM_CONFIG]: `System configuration change: ${event.type}`,
      [SECURITY_CATEGORIES.NETWORK]: `Network security event: ${event.type}`,
      [SECURITY_CATEGORIES.MALICIOUS_ACTIVITY]: `Malicious activity detected: ${event.type}`,
      [SECURITY_CATEGORIES.COMPLIANCE]: `Compliance issue: ${event.type}`
    };

    return messages[event.category] || `Security event: ${event.type}`;
  }

  /**
   * Calculate security posture score
   * @returns {Promise<number>} Security score (0-100)
   */
  async calculateSecurityScore() {
    try {
      // Get recent events (last 24 hours)
      const cutoff = Date.now() - 86400000;
      const events = await this.db.prepare(`
        SELECT score_impact FROM security_events
        WHERE timestamp > ?
        AND resolved = 0
      `).bind(cutoff).all();

      const results = events.results || [];
      
      // Start with perfect score
      let score = 100;

      // Apply impacts
      for (const event of results) {
        score += event.score_impact;
      }

      // Ensure score is within bounds
      score = Math.max(0, Math.min(100, score));

      logger.debug('security', 'score_calculated', { 
        score, 
        eventCount: results.length 
      });

      return score;
    } catch (err) {
      logger.error('security', 'score_calculation_failed', { error: err.message });
      return 50; // Return neutral score on error
    }
  }

  /**
   * Get security posture rating
   * @param {number} score - Security score
   * @returns {object} Posture rating
   */
  getPostureRating(score) {
    if (score >= SCORE_THRESHOLDS.EXCELLENT) {
      return { rating: 'Excellent', color: 'green', status: 'secure' };
    } else if (score >= SCORE_THRESHOLDS.GOOD) {
      return { rating: 'Good', color: 'blue', status: 'secure' };
    } else if (score >= SCORE_THRESHOLDS.MEDIUM) {
      return { rating: 'Medium', color: 'yellow', status: 'caution' };
    } else if (score >= SCORE_THRESHOLDS.HIGH) {
      return { rating: 'Poor', color: 'orange', status: 'warning' };
    } else {
      return { rating: 'Critical', color: 'red', status: 'critical' };
    }
  }

  /**
   * Get security summary
   * @returns {Promise<object>} Security summary
   */
  async getSecuritySummary() {
    try {
      const score = await this.calculateSecurityScore();
      const rating = this.getPostureRating(score);

      // Get recent events
      const cutoff = Date.now() - 86400000;
      const events = await this.db.prepare(`
        SELECT category, severity, COUNT(*) as count
        FROM security_events
        WHERE timestamp > ?
        GROUP BY category, severity
      `).bind(cutoff).all();

      // Get active alerts
      const alerts = await this.db.prepare(`
        SELECT COUNT(*) as count FROM security_alerts
        WHERE status = 'active'
      `).first();

      return {
        score,
        rating,
        activeAlerts: alerts?.count || 0,
        eventsByCategory: this.groupEvents(events.results || []),
        timestamp: Date.now()
      };
    } catch (err) {
      logger.error('security', 'summary_failed', { error: err.message });
      return null;
    }
  }

  /**
   * Group events by category and severity
   * @param {Array} events - Security events
   * @returns {object} Grouped events
   */
  groupEvents(events) {
    const grouped = {};

    for (const event of events) {
      if (!grouped[event.category]) {
        grouped[event.category] = {};
      }
      if (!grouped[event.category][event.severity]) {
        grouped[event.category][event.severity] = 0;
      }
      grouped[event.category][event.severity] += event.count;
    }

    return grouped;
  }

  /**
   * Resolve a security event
   * @param {string} eventId - Event ID
   * @param {string} resolvedBy - User who resolved
   * @returns {Promise<boolean>} Success status
   */
  async resolveEvent(eventId, resolvedBy) {
    try {
      await this.db.prepare(`
        UPDATE security_events
        SET resolved = 1, resolved_by = ?, resolved_at = ?
        WHERE id = ?
      `).bind(resolvedBy, Date.now(), eventId).run();

      logger.info('security', 'event_resolved', { eventId, resolvedBy });
      return true;
    } catch (err) {
      logger.error('security', 'resolve_failed', { 
        eventId, 
        error: err.message 
      });
      return false;
    }
  }

  /**
   * Acknowledge an alert
   * @param {string} alertId - Alert ID
   * @param {string} acknowledgedBy - User who acknowledged
   * @returns {Promise<boolean>} Success status
   */
  async acknowledgeAlert(alertId, acknowledgedBy) {
    try {
      await this.db.prepare(`
        UPDATE security_alerts
        SET acknowledged = 1, acknowledged_by = ?, acknowledged_at = ?
        WHERE id = ?
      `).bind(acknowledgedBy, Date.now(), alertId).run();

      logger.info('security', 'alert_acknowledged', { alertId, acknowledgedBy });
      return true;
    } catch (err) {
      logger.error('security', 'acknowledge_failed', { 
        alertId, 
        error: err.message 
      });
      return false;
    }
  }
}

export { SecurityTrackingService };
