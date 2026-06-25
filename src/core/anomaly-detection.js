// Anomaly detection and alerting system
// Detects unusual patterns in system metrics and triggers alerts

const ANOMALY_THRESHOLDS = {
  // Response time thresholds (ms)
  response_time_p95: 5000,
  response_time_p99: 10000,
  
  // Error rate thresholds (%)
  error_rate_warning: 5,
  error_rate_critical: 10,
  
  // Throughput thresholds
  throughput_drop_percent: 50,
  
  // Cost thresholds
  cost_spike_percent: 200,
  
  // Database thresholds
  db_query_time_p95: 1000,
  db_connection_failures: 5,
  
  // LLM thresholds
  llm_failure_rate: 10,
  llm_latency_p95: 10000,
};

class AnomalyDetector {
  constructor(env) {
    this.env = env;
    this.baselineMetrics = new Map();
    this.alertHistory = new Map();
    this.cooldownPeriod = 300000; // 5 minutes between same alerts
  }

  async detectAnomalies(currentMetrics) {
    const anomalies = [];
    
    // Detect response time anomalies
    const responseTimeAnomalies = this.detectResponseTimeAnomalies(currentMetrics.performance);
    anomalies.push(...responseTimeAnomalies);
    
    // Detect error rate anomalies
    const errorRateAnomalies = this.detectErrorRateAnomalies(currentMetrics.performance);
    anomalies.push(...errorRateAnomalies);
    
    // Detect throughput anomalies
    const throughputAnomalies = this.detectThroughputAnomalies(currentMetrics.usage);
    anomalies.push(...throughputAnomalies);
    
    // Detect cost anomalies
    const costAnomalies = this.detectCostAnomalies(currentMetrics.usage);
    anomalies.push(...costAnomalies);
    
    // Detect database anomalies
    const dbAnomalies = await this.detectDatabaseAnomalies();
    anomalies.push(...dbAnomalies);
    
    // Detect LLM anomalies
    const llmAnomalies = await this.detectLLMAnomalies();
    anomalies.push(...llmAnomalies);
    
    // Filter out alerts in cooldown
    const filteredAnomalies = anomalies.filter(anomaly => {
      const lastAlert = this.alertHistory.get(anomaly.type);
      if (!lastAlert) return true;
      
      const timeSinceLastAlert = Date.now() - lastAlert;
      return timeSinceLastAlert > this.cooldownPeriod;
    });
    
    // Send alerts for detected anomalies
    for (const anomaly of filteredAnomalies) {
      await this.sendAlert(anomaly);
      this.alertHistory.set(anomaly.type, Date.now());
    }
    
    return {
      detected: anomalies.length,
      anomalies: filteredAnomalies,
      timestamp: new Date().toISOString()
    };
  }

  detectResponseTimeAnomalies(performance) {
    const anomalies = [];
    
    if (performance.p95_response_time > ANOMALY_THRESHOLDS.response_time_p95) {
      anomalies.push({
        type: 'response_time_p95_high',
        severity: 'warning',
        metric: 'p95_response_time',
        value: performance.p95_response_time,
        threshold: ANOMALY_THRESHOLDS.response_time_p95,
        message: `P95 response time ${performance.p95_response_time}ms exceeds threshold ${ANOMALY_THRESHOLDS.response_time_p95}ms`
      });
    }
    
    if (performance.p99_response_time > ANOMALY_THRESHOLDS.response_time_p99) {
      anomalies.push({
        type: 'response_time_p99_high',
        severity: 'critical',
        metric: 'p99_response_time',
        value: performance.p99_response_time,
        threshold: ANOMALY_THRESHOLDS.response_time_p99,
        message: `P99 response time ${performance.p99_response_time}ms exceeds threshold ${ANOMALY_THRESHOLDS.response_time_p99}ms`
      });
    }
    
    return anomalies;
  }

  detectErrorRateAnomalies(performance) {
    const anomalies = [];
    
    if (performance.error_rate > ANOMALY_THRESHOLDS.error_rate_critical) {
      anomalies.push({
        type: 'error_rate_critical',
        severity: 'critical',
        metric: 'error_rate',
        value: performance.error_rate,
        threshold: ANOMALY_THRESHOLDS.error_rate_critical,
        message: `Error rate ${performance.error_rate.toFixed(2)}% exceeds critical threshold ${ANOMALY_THRESHOLDS.error_rate_critical}%`
      });
    } else if (performance.error_rate > ANOMALY_THRESHOLDS.error_rate_warning) {
      anomalies.push({
        type: 'error_rate_warning',
        severity: 'warning',
        metric: 'error_rate',
        value: performance.error_rate,
        threshold: ANOMALY_THRESHOLDS.error_rate_warning,
        message: `Error rate ${performance.error_rate.toFixed(2)}% exceeds warning threshold ${ANOMALY_THRESHOLDS.error_rate_warning}%`
      });
    }
    
    return anomalies;
  }

  detectThroughputAnomalies(usage) {
    const anomalies = [];
    
    // Compare with baseline
    const baseline = this.baselineMetrics.get('throughput');
    if (baseline) {
      const dropPercent = ((baseline - usage.total_tasks) / baseline) * 100;
      
      if (dropPercent > ANOMALY_THRESHOLDS.throughput_drop_percent) {
        anomalies.push({
          type: 'throughput_drop',
          severity: 'warning',
          metric: 'throughput',
          value: usage.total_tasks,
          baseline: baseline,
          drop_percent: dropPercent,
          message: `Throughput dropped ${dropPercent.toFixed(1)}% from baseline ${baseline}`
        });
      }
    }
    
    // Update baseline
    this.baselineMetrics.set('throughput', usage.total_tasks);
    
    return anomalies;
  }

  detectCostAnomalies(usage) {
    const anomalies = [];
    
    const baseline = this.baselineMetrics.get('cost');
    if (baseline && usage.total_cost > 0) {
      const spikePercent = ((usage.total_cost - baseline) / baseline) * 100;
      
      if (spikePercent > ANOMALY_THRESHOLDS.cost_spike_percent) {
        anomalies.push({
          type: 'cost_spike',
          severity: 'warning',
          metric: 'total_cost',
          value: usage.total_cost,
          baseline: baseline,
          spike_percent: spikePercent,
          message: `Cost spiked ${spikePercent.toFixed(1)}% from baseline $${baseline.toFixed(2)}`
        });
      }
    }
    
    // Update baseline
    this.baselineMetrics.set('cost', usage.total_cost);
    
    return anomalies;
  }

  async detectDatabaseAnomalies() {
    const anomalies = [];
    
    try {
      // Check database query performance
      const slowQueries = await this.env.db.prepare(`
        SELECT COUNT(*) as count
        FROM tasks
        WHERE completed_at IS NOT NULL
          AND (julianday(completed_at) - julianday(created_at)) * 86400000 > ?
          AND created_at > datetime("now", "-1 hour")
      `).bind(ANOMALY_THRESHOLDS.db_query_time_p95).first();
      
      if (slowQueries?.count > 0) {
        anomalies.push({
          type: 'slow_database_queries',
          severity: 'warning',
          metric: 'slow_queries',
          value: slowQueries.count,
          threshold: ANOMALY_THRESHOLDS.db_query_time_p95,
          message: `${slowQueries.count} slow database queries detected (>${ANOMALY_THRESHOLDS.db_query_time_p95}ms)`
        });
      }
    } catch (error) {
      console.error('[AnomalyDetector] Failed to detect database anomalies:', error);
    }
    
    return anomalies;
  }

  async detectLLMAnomalies() {
    const anomalies = [];
    
    try {
      // Check LLM failure rate
      const failedCalls = await this.env.db.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN quality_score < 0.5 THEN 1 ELSE 0 END) as failed
        FROM model_usage
        WHERE timestamp > ?
      `).bind(Date.now() - 3600000).first();
      
      if (failedCalls?.total > 0) {
        const failureRate = (failedCalls.failed / failedCalls.total) * 100;
        
        if (failureRate > ANOMALY_THRESHOLDS.llm_failure_rate) {
          anomalies.push({
            type: 'llm_failure_rate_high',
            severity: 'warning',
            metric: 'llm_failure_rate',
            value: failureRate,
            threshold: ANOMALY_THRESHOLDS.llm_failure_rate,
            message: `LLM failure rate ${failureRate.toFixed(2)}% exceeds threshold ${ANOMALY_THRESHOLDS.llm_failure_rate}%`
          });
        }
      }
    } catch (error) {
      console.error('[AnomalyDetector] Failed to detect LLM anomalies:', error);
    }
    
    return anomalies;
  }

  async sendAlert(anomaly) {
    const alert = {
      type: anomaly.type,
      severity: anomaly.severity,
      message: anomaly.message,
      metrics: {
        metric: anomaly.metric,
        value: anomaly.value,
        threshold: anomaly.threshold
      },
      timestamp: new Date().toISOString()
    };
    
    console.error(`[AnomalyDetector] ALERT [${anomaly.severity.toUpperCase()}]: ${anomaly.message}`);
    
    // Store alert in database
    if (this.env.db) {
      try {
        await this.env.db.prepare(`
          INSERT INTO security_alerts (type, severity, message, timestamp, status)
          VALUES (?, ?, ?, ?, 'active')
        `).bind(`anomaly_${anomaly.type}`, anomaly.severity, anomaly.message, alert.timestamp).run();
      } catch (err) {
        console.error('[AnomalyDetector] Failed to store alert:', err);
      }
    }
    
    // Send to external alerting system
    if (this.env.SENTRY_DSN) {
      const { captureMessage } = await import('./error-tracking.js');
      captureMessage(anomaly.message, anomaly.severity, {
        anomaly_type: anomaly.type,
        metrics: anomaly.metrics
      });
    }
  }

  async getAnomalyHistory(hours = 24) {
    if (!this.env.db) return [];
    
    try {
      const since = new Date(Date.now() - hours * 3600000).toISOString();
      
      const alerts = await this.env.db.prepare(`
        SELECT type, severity, message, timestamp
        FROM security_alerts
        WHERE type LIKE 'anomaly_%'
          AND timestamp > ?
        ORDER BY timestamp DESC
        LIMIT 50
      `).bind(since).all();
      
      return alerts.results || [];
    } catch (error) {
      console.error('[AnomalyDetector] Failed to get anomaly history:', error);
      return [];
    }
  }

  resetBaselines() {
    this.baselineMetrics.clear();
  }
}

// Singleton instance
let detectorInstance = null;

export function getAnomalyDetector(env) {
  if (!detectorInstance) {
    detectorInstance = new AnomalyDetector(env);
  }
  return detectorInstance;
}

export function resetAnomalyDetector() {
  detectorInstance = null;
}

// Scheduled anomaly detection handler
export async function handleScheduledAnomalyDetection(env) {
  const detector = getAnomalyDetector(env);
  const { getMonitoringDashboard } = await import('../scripts/monitoring-dashboard.js');
  const dashboard = getMonitoringDashboard(env);
  
  const metrics = await dashboard.getSystemMetrics();
  const result = await detector.detectAnomalies(metrics);
  
  console.log('[AnomalyDetector] Scheduled anomaly detection completed:', result.detected, 'anomalies');
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
