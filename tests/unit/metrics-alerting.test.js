// Metrics Alerting System Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsAlertingSystem, ALERT_THRESHOLDS, ALERT_SEVERITY } from '../../src/core/metrics-alerting.js';

describe('MetricsAlertingSystem', () => {
  let alertingSystem;
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      db: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            run: vi.fn().mockResolvedValue(),
            all: vi.fn().mockResolvedValue({ results: [] }),
            first: vi.fn().mockResolvedValue(null)
          })
        })
      }
    };
    alertingSystem = new MetricsAlertingSystem(mockEnv);
  });

  describe('checkMetric', () => {
    it('should generate critical alert for quality score below 70%', () => {
      const alert = alertingSystem.checkMetric('quality_score', 65, 'dev-team');
      
      expect(alert).not.toBeNull();
      expect(alert.severity).toBe(ALERT_SEVERITY.critical);
      expect(alert.metricName).toBe('quality_score');
      expect(alert.metricValue).toBe(65);
    });

    it('should generate warning alert for quality score between 70% and 85%', () => {
      const alert = alertingSystem.checkMetric('quality_score', 80, 'dev-team');
      
      expect(alert).not.toBeNull();
      expect(alert.severity).toBe(ALERT_SEVERITY.warning);
      expect(alert.metricName).toBe('quality_score');
    });

    it('should not generate alert for quality score above 85%', () => {
      const alert = alertingSystem.checkMetric('quality_score', 90, 'dev-team');
      
      expect(alert).toBeNull();
    });

    it('should generate critical alert for error rate above 20%', () => {
      const alert = alertingSystem.checkMetric('error_rate', 25, 'dev-team');
      
      expect(alert).not.toBeNull();
      expect(alert.severity).toBe(ALERT_SEVERITY.critical);
      expect(alert.metricName).toBe('error_rate');
    });

    it('should generate warning alert for resource utilization above 85%', () => {
      const alert = alertingSystem.checkMetric('resource_utilization', 90, 'dev-team');
      
      expect(alert).not.toBeNull();
      expect(alert.severity).toBe(ALERT_SEVERITY.warning);
      expect(alert.metricName).toBe('resource_utilization');
    });

    it('should return null for unknown metric', () => {
      const alert = alertingSystem.checkMetric('unknown_metric', 50, 'dev-team');
      
      expect(alert).toBeNull();
    });
  });

  describe('processMetrics', () => {
    it('should process multiple metrics and generate alerts', async () => {
      const metrics = [
        { name: 'quality_score', value: 65, team: 'dev-team' },
        { name: 'error_rate', value: 25, team: 'qa-team' },
        { name: 'task_completion_rate', value: 95, team: 'dev-team' }
      ];

      const alerts = await alertingSystem.processMetrics(metrics);
      
      expect(alerts).toHaveLength(2);
      expect(alerts[0].metricName).toBe('quality_score');
      expect(alerts[1].metricName).toBe('error_rate');
    });

    it('should return empty array if no alerts generated', async () => {
      const metrics = [
        { name: 'quality_score', value: 95, team: 'dev-team' },
        { name: 'task_completion_rate', value: 95, team: 'dev-team' }
      ];

      const alerts = await alertingSystem.processMetrics(metrics);
      
      expect(alerts).toHaveLength(0);
    });
  });

  describe('logAlert', () => {
    it('should log alert to database', async () => {
      const alert = {
        id: 'alert-1',
        metricName: 'quality_score',
        metricValue: 65,
        team: 'dev-team',
        severity: 'critical',
        message: 'Quality score critically low',
        threshold: 95,
        timestamp: new Date().toISOString()
      };

      await alertingSystem.logAlert(alert);
      
      expect(mockEnv.db.prepare).toHaveBeenCalled();
      expect(alertingSystem.activeAlerts.has('alert-1')).toBe(true);
    });

    it('should handle missing database gracefully', async () => {
      const alertingSystemNoDb = new MetricsAlertingSystem({});
      const alert = {
        id: 'alert-1',
        metricName: 'quality_score',
        metricValue: 65,
        team: 'dev-team',
        severity: 'critical',
        message: 'Quality score critically low',
        threshold: 95,
        timestamp: new Date().toISOString()
      };

      await expect(alertingSystemNoDb.logAlert(alert)).resolves.not.toThrow();
    });
  });

  describe('getActiveAlerts', () => {
    it('should return all active alerts', () => {
      const alert1 = { id: 'alert-1', metricName: 'quality_score', team: 'dev-team' };
      const alert2 = { id: 'alert-2', metricName: 'error_rate', team: 'qa-team' };
      
      alertingSystem.activeAlerts.set('alert-1', alert1);
      alertingSystem.activeAlerts.set('alert-2', alert2);
      
      const alerts = alertingSystem.getActiveAlerts();
      
      expect(alerts).toHaveLength(2);
      expect(alerts[0].id).toBe('alert-1');
      expect(alerts[1].id).toBe('alert-2');
    });

    it('should return empty array if no active alerts', () => {
      const alerts = alertingSystem.getActiveAlerts();
      
      expect(alerts).toHaveLength(0);
    });
  });

  describe('getAlertsBySeverity', () => {
    it('should return alerts filtered by severity', () => {
      const alert1 = { id: 'alert-1', metricName: 'quality_score', team: 'dev-team', severity: 'critical' };
      const alert2 = { id: 'alert-2', metricName: 'error_rate', team: 'qa-team', severity: 'warning' };
      const alert3 = { id: 'alert-3', metricName: 'task_completion_rate', team: 'dev-team', severity: 'critical' };
      
      alertingSystem.activeAlerts.set('alert-1', alert1);
      alertingSystem.activeAlerts.set('alert-2', alert2);
      alertingSystem.activeAlerts.set('alert-3', alert3);
      
      const criticalAlerts = alertingSystem.getAlertsBySeverity('critical');
      const warningAlerts = alertingSystem.getAlertsBySeverity('warning');
      
      expect(criticalAlerts).toHaveLength(2);
      expect(warningAlerts).toHaveLength(1);
    });
  });

  describe('getAlertsByTeam', () => {
    it('should return alerts filtered by team', () => {
      const alert1 = { id: 'alert-1', metricName: 'quality_score', team: 'dev-team', severity: 'critical' };
      const alert2 = { id: 'alert-2', metricName: 'error_rate', team: 'qa-team', severity: 'warning' };
      const alert3 = { id: 'alert-3', metricName: 'task_completion_rate', team: 'dev-team', severity: 'critical' };
      
      alertingSystem.activeAlerts.set('alert-1', alert1);
      alertingSystem.activeAlerts.set('alert-2', alert2);
      alertingSystem.activeAlerts.set('alert-3', alert3);
      
      const devTeamAlerts = alertingSystem.getAlertsByTeam('dev-team');
      const qaTeamAlerts = alertingSystem.getAlertsByTeam('qa-team');
      
      expect(devTeamAlerts).toHaveLength(2);
      expect(qaTeamAlerts).toHaveLength(1);
    });
  });

  describe('resolveAlert', () => {
    it('should resolve alert and remove from active alerts', async () => {
      const alert = { id: 'alert-1', metricName: 'quality_score', team: 'dev-team' };
      alertingSystem.activeAlerts.set('alert-1', alert);
      
      await alertingSystem.resolveAlert('alert-1');
      
      expect(alertingSystem.activeAlerts.has('alert-1')).toBe(false);
      expect(mockEnv.db.prepare).toHaveBeenCalled();
    });

    it('should handle non-existent alert gracefully', async () => {
      await expect(alertingSystem.resolveAlert('non-existent')).resolves.not.toThrow();
    });
  });

  describe('getAlertStats', () => {
    it('should return empty stats when no database', async () => {
      const alertingSystemNoDb = new MetricsAlertingSystem({});
      const stats = await alertingSystemNoDb.getAlertStats({});
      
      expect(stats).toEqual({ total: 0, bySeverity: {}, byTeam: {} });
    });

    it('should return alert statistics', async () => {
      mockEnv.db.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({
          results: [
            { severity: 'critical', team: 'dev-team', count: 2 },
            { severity: 'warning', team: 'dev-team', count: 1 },
            { severity: 'critical', team: 'qa-team', count: 1 }
          ]
        })
      });

      const stats = await alertingSystem.getAlertStats(mockEnv);
      
      expect(stats.total).toBe(4);
      expect(stats.bySeverity['critical']).toBe(3);
      expect(stats.bySeverity['warning']).toBe(1);
      expect(stats.byTeam['dev-team']).toBe(3);
      expect(stats.byTeam['qa-team']).toBe(1);
    });
  });

  describe('checkAlertEscalation', () => {
    it('should escalate critical alert after 30 minutes', () => {
      const oldTimestamp = new Date(Date.now() - 31 * 60 * 1000).toISOString();
      const alert = {
        id: 'alert-1',
        metricName: 'quality_score',
        team: 'dev-team',
        severity: 'critical',
        timestamp: oldTimestamp
      };

      const escalation = alertingSystem.checkAlertEscalation(alert);
      
      expect(escalation.shouldEscalate).toBe(true);
      expect(escalation.escalationLevel).toBe('CEO');
    });

    it('should escalate warning alert after 1 hour', () => {
      const oldTimestamp = new Date(Date.now() - 61 * 60 * 1000).toISOString();
      const alert = {
        id: 'alert-1',
        metricName: 'quality_score',
        team: 'dev-team',
        severity: 'warning',
        timestamp: oldTimestamp
      };

      const escalation = alertingSystem.checkAlertEscalation(alert);
      
      expect(escalation.shouldEscalate).toBe(true);
      expect(escalation.escalationLevel).toBe('General Manager');
    });

    it('should not escalate recent alert', () => {
      const recentTimestamp = new Date().toISOString();
      const alert = {
        id: 'alert-1',
        metricName: 'quality_score',
        team: 'dev-team',
        severity: 'critical',
        timestamp: recentTimestamp
      };

      const escalation = alertingSystem.checkAlertEscalation(alert);
      
      expect(escalation.shouldEscalate).toBe(false);
    });
  });

  describe('ALERT_THRESHOLDS', () => {
    it('should have thresholds for 6 metrics', () => {
      expect(Object.keys(ALERT_THRESHOLDS)).toHaveLength(6);
    });

    it('should include all required metrics', () => {
      expect(ALERT_THRESHOLDS).toHaveProperty('quality_score');
      expect(ALERT_THRESHOLDS).toHaveProperty('task_completion_rate');
      expect(ALERT_THRESHOLDS).toHaveProperty('error_rate');
      expect(ALERT_THRESHOLDS).toHaveProperty('handoff_success_rate');
      expect(ALERT_THRESHOLDS).toHaveProperty('sla_compliance');
      expect(ALERT_THRESHOLDS).toHaveProperty('resource_utilization');
    });
  });

  describe('ALERT_SEVERITY', () => {
    it('should have 3 severity levels', () => {
      expect(Object.keys(ALERT_SEVERITY)).toHaveLength(3);
    });

    it('should include all required severity levels', () => {
      expect(ALERT_SEVERITY).toHaveProperty('critical');
      expect(ALERT_SEVERITY).toHaveProperty('warning');
      expect(ALERT_SEVERITY).toHaveProperty('info');
    });
  });
});
