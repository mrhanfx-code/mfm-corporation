// Threat Detection Algorithms — Automated security threat detection
// Detects patterns, anomalies, and potential security threats

import { logger } from './logger.js';
import { SecurityTrackingService, SEVERITY, SECURITY_CATEGORIES } from './security-tracking.js';

// Threat patterns
const THREAT_PATTERNS = {
  // Authentication threats
  BRUTE_FORCE: {
    pattern: 'multiple_failed_logins',
    threshold: 5,
    window: 300000, // 5 minutes
    severity: SEVERITY.HIGH
  },
  IMPOSSIBLE_TRAVEL: {
    pattern: 'impossible_travel',
    threshold: 1,
    window: 3600000, // 1 hour
    severity: SEVERITY.CRITICAL
  },
  
  // Authorization threats
  PRIVILEGE_ESCALATION: {
    pattern: 'privilege_escalation',
    threshold: 1,
    window: 86400000, // 24 hours
    severity: SEVERITY.CRITICAL
  },
  UNAUTHORIZED_ACCESS: {
    pattern: 'unauthorized_access',
    threshold: 3,
    window: 3600000, // 1 hour
    severity: SEVERITY.HIGH
  },
  
  // Data threats
  EXFILTRATION: {
    pattern: 'data_exfiltration',
    threshold: 1,
    window: 3600000, // 1 hour
    severity: SEVERITY.CRITICAL
  },
  MASS_DOWNLOAD: {
    pattern: 'mass_download',
    threshold: 10,
    window: 3600000, // 1 hour
    severity: SEVERITY.MEDIUM
  },
  
  // Network threats
  DDOS_PATTERN: {
    pattern: 'ddos_pattern',
    threshold: 100,
    window: 60000, // 1 minute
    severity: SEVERITY.CRITICAL
  },
  PORT_SCAN: {
    pattern: 'port_scan',
    threshold: 20,
    window: 300000, // 5 minutes
    severity: SEVERITY.HIGH
  },
  
  // Malicious activity
  MALWARE_SIGNATURE: {
    pattern: 'malware_signature',
    threshold: 1,
    window: 86400000, // 24 hours
    severity: SEVERITY.CRITICAL
  },
  INJECTION_ATTACK: {
    pattern: 'injection_attack',
    threshold: 1,
    window: 86400000, // 24 hours
    severity: SEVERITY.CRITICAL
  }
};

class ThreatDetectionService {
  constructor(db, kv, securityService) {
    this.db = db;
    this.kv = kv;
    this.securityService = securityService;
    this.eventHistory = new Map();
    this.baselineMetrics = new Map();
  }

  /**
   * Analyze security event for threats
   * @param {object} event - Security event
   * @returns {Promise<Array>} Detected threats
   */
  async analyzeEvent(event) {
    const threats = [];

    try {
      // Check against all threat patterns
      for (const [threatName, pattern] of Object.entries(THREAT_PATTERNS)) {
        const detected = await this.checkPattern(event, threatName, pattern);
        if (detected) {
          threats.push({
            threat: threatName,
            severity: pattern.severity,
            confidence: detected.confidence,
            details: detected.details
          });
        }
      }

      // Anomaly detection
      const anomalies = await this.detectAnomalies(event);
      threats.push(...anomalies);

      // Log detected threats
      for (const threat of threats) {
        await this.securityService.trackEvent({
          category: SECURITY_CATEGORIES.MALICIOUS_ACTIVITY,
          severity: threat.severity,
          type: threat.threat,
          userId: event.userId,
          source: event.source,
          details: {
            ...threat.details,
            originalEvent: event
          }
        });
      }

      return threats;
    } catch (err) {
      logger.error('threat', 'analysis_failed', { 
        eventId: event.id, 
        error: err.message 
      });
      return [];
    }
  }

  /**
   * Check if event matches threat pattern
   * @param {object} event - Security event
   * @param {string} threatName - Threat name
   * @param {object} pattern - Threat pattern
   * @returns {Promise<object|null>} Detection result
   */
  async checkPattern(event, threatName, pattern) {
    const now = Date.now();
    const windowStart = now - pattern.window;

    // Get recent events of this type
    const recentEvents = await this.db.prepare(`
      SELECT * FROM security_events
      WHERE type = ? AND timestamp > ?
      ORDER BY timestamp DESC
    `).bind(pattern.pattern, windowStart).all();

    const events = recentEvents.results || [];

    // Check if threshold exceeded
    if (events.length >= pattern.threshold) {
      return {
        confidence: this.calculateConfidence(events.length, pattern.threshold),
        details: {
          count: events.length,
          threshold: pattern.threshold,
          window: pattern.window,
          events: events.slice(0, 5) // Last 5 events
        }
      };
    }

    return null;
  }

  /**
   * Detect anomalies using baseline comparison
   * @param {object} event - Security event
   * @returns {Promise<Array>} Detected anomalies
   */
  async detectAnomalies(event) {
    const anomalies = [];

    try {
      // Get baseline for this event type
      const baseline = await this.getBaseline(event.type);
      if (!baseline) {
        // Establish baseline
        await this.establishBaseline(event.type);
        return [];
      }

      // Check for deviations
      const deviation = this.calculateDeviation(event, baseline);
      
      if (deviation > 3) { // 3 standard deviations
        anomalies.push({
          threat: 'statistical_anomaly',
          severity: SEVERITY.HIGH,
          confidence: Math.min(deviation / 5, 1),
          details: {
            deviation: deviation.toFixed(2),
            baseline: baseline,
            currentValue: this.extractMetric(event)
          }
        });
      }
    } catch (err) {
      logger.error('threat', 'anomaly_detection_failed', { 
        eventType: event.type, 
        error: err.message 
      });
    }

    return anomalies;
  }

  /**
   * Get baseline metrics for event type
   * @param {string} eventType - Event type
   * @returns {Promise<object>} Baseline metrics
   */
  async getBaseline(eventType) {
    const cached = this.baselineMetrics.get(eventType);
    if (cached && Date.now() - cached.timestamp < 86400000) { // 24 hours
      return cached.metrics;
    }

    // Calculate baseline from historical data
    const cutoff = Date.now() - 604800000; // 7 days
    const events = await this.db.prepare(`
      SELECT timestamp, details FROM security_events
      WHERE type = ? AND timestamp > ?
    `).bind(eventType, cutoff).all();

    const results = events.results || [];
    
    if (results.length < 10) {
      return null; // Not enough data
    }

    const metrics = this.calculateMetrics(results);
    
    this.baselineMetrics.set(eventType, {
      metrics,
      timestamp: Date.now()
    });

    return metrics;
  }

  /**
   * Establish baseline for event type
   * @param {string} eventType - Event type
   */
  async establishBaseline(eventType) {
    const cutoff = Date.now() - 604800000; // 7 days
    const events = await this.db.prepare(`
      SELECT timestamp, details FROM security_events
      WHERE type = ? AND timestamp > ?
    `).bind(eventType, cutoff).all();

    const results = events.results || [];
    
    if (results.length >= 10) {
      const metrics = this.calculateMetrics(results);
      this.baselineMetrics.set(eventType, {
        metrics,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Calculate metrics from events
   * @param {Array} events - Security events
   * @returns {object} Metrics
   */
  calculateMetrics(events) {
    const values = events.map(e => this.extractMetric(e));
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      stdDev,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  /**
   * Extract metric from event
   * @param {object} event - Security event
   * @returns {number} Metric value
   */
  extractMetric(event) {
    // Default metric: count (1)
    if (!event.details) return 1;

    // Try to extract relevant metric
    if (event.details.count) return event.details.count;
    if (event.details.size) return event.details.size;
    if (event.details.duration) return event.details.duration;
    
    return 1;
  }

  /**
   * Calculate deviation from baseline
   * @param {object} event - Security event
   * @param {object} baseline - Baseline metrics
   * @returns {number} Standard deviations from mean
   */
  calculateDeviation(event, baseline) {
    const value = this.extractMetric(event);
    const deviation = Math.abs(value - baseline.mean) / baseline.stdDev;
    return deviation;
  }

  /**
   * Calculate confidence score
   * @param {number} count - Event count
   * @param {number} threshold - Threshold
   * @returns {number} Confidence (0-1)
   */
  calculateConfidence(count, threshold) {
    const ratio = count / threshold;
    return Math.min(ratio / 2, 1); // Cap at 1.0
  }

  /**
   * Run comprehensive threat scan
   * @returns {Promise<object>} Scan results
   */
  async runThreatScan() {
    try {
      const results = {
        timestamp: Date.now(),
        threats: [],
        anomalies: [],
        riskScore: 0
      };

      // Scan recent events
      const cutoff = Date.now() - 3600000; // 1 hour
      const events = await this.db.prepare(`
        SELECT * FROM security_events
        WHERE timestamp > ?
        ORDER BY timestamp DESC
      `).bind(cutoff).all();

      const eventList = events.results || [];

      // Analyze each event
      for (const event of eventList) {
        const threats = await this.analyzeEvent(event);
        results.threats.push(...threats);
      }

      // Calculate risk score
      results.riskScore = this.calculateRiskScore(results.threats);

      logger.info('threat', 'scan_completed', { 
        eventCount: eventList.length,
        threatCount: results.threats.length,
        riskScore: results.riskScore
      });

      return results;
    } catch (err) {
      logger.error('threat', 'scan_failed', { error: err.message });
      return null;
    }
  }

  /**
   * Calculate overall risk score
   * @param {Array} threats - Detected threats
   * @returns {number} Risk score (0-100)
   */
  calculateRiskScore(threats) {
    if (threats.length === 0) return 0;

    let score = 0;
    for (const threat of threats) {
      const severityWeight = {
        [SEVERITY.LOW]: 5,
        [SEVERITY.MEDIUM]: 15,
        [SEVERITY.HIGH]: 30,
        [SEVERITY.CRITICAL]: 50
      };
      score += (severityWeight[threat.severity] || 10) * threat.confidence;
    }

    return Math.min(score, 100);
  }

  /**
   * Get threat intelligence
   * @returns {Promise<object>} Threat intelligence
   */
  async getThreatIntelligence() {
    try {
      const scan = await this.runThreatScan();
      
      return {
        ...scan,
        recommendations: this.generateRecommendations(scan.threats),
        topThreats: this.getTopThreats(scan.threats, 5)
      };
    } catch (err) {
      logger.error('threat', 'intelligence_failed', { error: err.message });
      return null;
    }
  }

  /**
   * Generate recommendations based on threats
   * @param {Array} threats - Detected threats
   * @returns {Array} Recommendations
   */
  generateRecommendations(threats) {
    const recommendations = [];
    const threatTypes = new Set(threats.map(t => t.threat));

    if (threatTypes.has('brute_force')) {
      recommendations.push({
        priority: 'high',
        action: 'Implement account lockout after failed login attempts',
        type: 'authentication'
      });
    }

    if (threatTypes.has('unauthorized_access')) {
      recommendations.push({
        priority: 'critical',
        action: 'Review and tighten RBAC permissions',
        type: 'authorization'
      });
    }

    if (threatTypes.has('data_exfiltration')) {
      recommendations.push({
        priority: 'critical',
        action: 'Implement data loss prevention (DLP) controls',
        type: 'data'
      });
    }

    if (threatTypes.has('injection_attack')) {
      recommendations.push({
        priority: 'critical',
        action: 'Enhance input validation and sanitization',
        type: 'security'
      });
    }

    return recommendations;
  }

  /**
   * Get top threats by severity
   * @param {Array} threats - All threats
   * @param {number} limit - Number of threats to return
   * @returns {Array} Top threats
   */
  getTopThreats(threats, limit) {
    const severityOrder = {
      [SEVERITY.CRITICAL]: 4,
      [SEVERITY.HIGH]: 3,
      [SEVERITY.MEDIUM]: 2,
      [SEVERITY.LOW]: 1
    };

    return threats
      .sort((a, b) => {
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, limit);
  }
}

export { ThreatDetectionService };
