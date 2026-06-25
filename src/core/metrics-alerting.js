// Metrics Alerting System

import { logger } from './logger.js';

const ALERT_THRESHOLDS = {
  quality_score: {
    critical: 70,
    warning: 85,
    target: 95
  },
  task_completion_rate: {
    critical: 70,
    warning: 85,
    target: 90
  },
  error_rate: {
    critical: 20,
    warning: 15,
    target: 10
  },
  handoff_success_rate: {
    critical: 80,
    warning: 90,
    target: 95
  },
  sla_compliance: {
    critical: 70,
    warning: 85,
    target: 90
  },
  resource_utilization: {
    critical: 95,
    warning: 85,
    target: 75
  }
};

const ALERT_SEVERITY = {
  critical: 'critical',
  warning: 'warning',
  info: 'info'
};

class MetricsAlertingSystem {
  constructor(env) {
    this.env = env;
    this.activeAlerts = new Map();
    this.alertHistory = [];
  }

  /**
   * Check metric against thresholds and generate alerts
   */
  checkMetric(metricName, metricValue, team) {
    const thresholds = ALERT_THRESHOLDS[metricName];
    if (!thresholds) {
      return null;
    }

    let severity = null;
    let message = '';

    // Metrics where higher values are bad (error_rate, resource_utilization)
    const higherIsBad = ['error_rate', 'resource_utilization'].includes(metricName);

    if (higherIsBad) {
      if (metricValue > thresholds.critical) {
        severity = ALERT_SEVERITY.critical;
        message = `${metricName} at ${metricValue}% is critically above target ${thresholds.target}%`;
      } else if (metricValue > thresholds.warning) {
        severity = ALERT_SEVERITY.warning;
        message = `${metricName} at ${metricValue}% is above target ${thresholds.target}%`;
      }
    } else {
      // Metrics where lower values are bad (quality_score, task_completion_rate, etc.)
      if (metricValue < thresholds.critical) {
        severity = ALERT_SEVERITY.critical;
        message = `${metricName} at ${metricValue}% is critically below target ${thresholds.target}%`;
      } else if (metricValue < thresholds.warning) {
        severity = ALERT_SEVERITY.warning;
        message = `${metricName} at ${metricValue}% is below target ${thresholds.target}%`;
      }
    }

    if (severity) {
      return {
        id: this.generateAlertId(metricName, team),
        metricName,
        metricValue,
        team,
        severity,
        message,
        timestamp: new Date().toISOString(),
        threshold: thresholds.target
      };
    }

    return null;
  }

  /**
   * Generate unique alert ID
   */
  generateAlertId(metricName, team) {
    return `${team}-${metricName}-${Date.now()}`;
  }

  /**
   * Process metrics and generate alerts
   */
  async processMetrics(metrics) {
    const newAlerts = [];

    for (const metric of metrics) {
      const alert = this.checkMetric(metric.name, metric.value, metric.team);
      if (alert) {
        newAlerts.push(alert);
        await this.logAlert(alert);
      }
    }

    return newAlerts;
  }

  /**
   * Log alert to database
   */
  async logAlert(alert) {
    if (!this.env.db) return;

    await this.env.db.prepare(
      'INSERT INTO metrics_alerts (id, metric_name, metric_value, team, severity, message, threshold, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))'
    ).bind(
      alert.id,
      alert.metricName,
      alert.metricValue,
      alert.team,
      alert.severity,
      alert.message,
      alert.threshold
    ).run();

    logger.error('MetricsAlertingSystem', 'alert_generated', {
      alertId: alert.id,
      metricName: alert.metricName,
      severity: alert.severity,
      team: alert.team
    });

    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity) {
    return this.getActiveAlerts().filter(alert => alert.severity === severity);
  }

  /**
   * Get alerts by team
   */
  getAlertsByTeam(team) {
    return this.getActiveAlerts().filter(alert => alert.team === team);
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    if (this.env.db) {
      await this.env.db.prepare(
        'UPDATE metrics_alerts SET resolved_at = datetime("now"), status = ? WHERE id = ?'
      ).bind('resolved', alertId).run();
    }

    this.activeAlerts.delete(alertId);
    logger.info('MetricsAlertingSystem', 'alert_resolved', { alertId });
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(env) {
    if (!env.db) return { total: 0, bySeverity: {}, byTeam: {} };

    const result = await env.db.prepare(
      'SELECT severity, team, COUNT(*) as count FROM metrics_alerts WHERE resolved_at IS NULL GROUP BY severity, team'
    ).all();

    const stats = { total: 0, bySeverity: {}, byTeam: {} };

    for (const row of (result.results || [])) {
      stats.total += row.count;
      stats.bySeverity[row.severity] = (stats.bySeverity[row.severity] || 0) + row.count;
      stats.byTeam[row.team] = (stats.byTeam[row.team] || 0) + row.count;
    }

    return stats;
  }

  /**
   * Check for alert escalation
   */
  checkAlertEscalation(alert) {
    const alertAge = Date.now() - new Date(alert.timestamp).getTime();
    const escalationThresholds = {
      critical: 30 * 60 * 1000, // 30 minutes
      warning: 60 * 60 * 1000    // 1 hour
    };

    const threshold = escalationThresholds[alert.severity];
    if (threshold && alertAge > threshold) {
      return {
        shouldEscalate: true,
        reason: `Alert ${alert.id} has been active for ${Math.floor(alertAge / 60000)} minutes`,
        escalationLevel: alert.severity === 'critical' ? 'CEO' : 'General Manager'
      };
    }

    return { shouldEscalate: false };
  }
}

export { MetricsAlertingSystem, ALERT_THRESHOLDS, ALERT_SEVERITY };
