// Advanced Monitoring — OpenTelemetry distributed tracing and performance profiling

import { logger } from './logger.js';

class AdvancedMonitoringManager {
  constructor(env) {
    this.env = env;
    this.traces = new Map();
    this.metrics = new Map();
    this.anomalies = new Map();
    this.alerts = new Map();
    this.traceCounter = 0;
    this.baselineMetrics = new Map();
  }

  /**
   * Start a distributed trace
   * @param {string} operation - Operation name
   * @param {object} attributes - Trace attributes
   * @returns {string} Trace ID
   */
  startTrace(operation, attributes = {}) {
    this.traceCounter++;
    const traceId = `trace-${Date.now()}-${this.traceCounter}`;
    
    const trace = {
      id: traceId,
      operation,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      status: 'active',
      spans: [],
      attributes: {
        ...attributes,
        timestamp: new Date().toISOString()
      },
      metadata: {
        parentTraceId: attributes.parentTraceId || null,
        traceType: attributes.traceType || 'user'
      }
    };
    
    this.traces.set(traceId, trace);
    
    logger.debug(`Advanced Monitoring: Started trace ${traceId}`, {
      operation,
      attributes
    });
    
    return traceId;
  }

  /**
   * End a trace
   * @param {string} traceId - Trace ID
   * @param {string} status - Trace status
   * @param {object} result - Trace result
   * @returns {object} Completed trace
   */
  endTrace(traceId, status = 'completed', result = {}) {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return null;
    }
    
    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;
    trace.status = status;
    trace.result = result;
    
    // Check for anomalies
    this.checkForAnomalies(trace);
    
    logger.debug(`Advanced Monitoring: Ended trace ${traceId}`, {
      duration: trace.duration,
      status
    });
    
    return trace;
  }

  /**
   * Add a span to a trace
   * @param {string} traceId - Trace ID
   * @param {string} operation - Span operation
   * @param {object} attributes - Span attributes
   * @returns {string} Span ID
   */
  addSpan(traceId, operation, attributes = {}) {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return null;
    }
    
    const spanId = `span-${Date.now()}-${trace.spans.length}`;
    const span = {
      id: spanId,
      operation,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      status: 'active',
      attributes: {
        ...attributes,
        timestamp: new Date().toISOString()
      }
    };
    
    trace.spans.push(span);
    
    logger.debug(`Advanced Monitoring: Added span ${spanId} to trace ${traceId}`, {
      operation
    });
    
    return spanId;
  }

  /**
   * End a span
   * @param {string} traceId - Trace ID
   * @param {string} spanId - Span ID
   * @param {string} status - Span status
   * @returns {boolean} Success
   */
  endSpan(traceId, spanId, status = 'completed') {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return false;
    }
    
    const span = trace.spans.find(s => s.id === spanId);
    if (!span) {
      return false;
    }
    
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    
    return true;
  }

  /**
   * Record a metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {object} attributes - Metric attributes
   */
  recordMetric(name, value, attributes = {}) {
    const metricKey = `${name}:${JSON.stringify(attributes)}`;
    const timestamp = Date.now();
    
    if (!this.metrics.has(metricKey)) {
      this.metrics.set(metricKey, {
        name,
        values: [],
        attributes,
        statistics: {}
      });
    }
    
    const metric = this.metrics.get(metricKey);
    metric.values.push({ value, timestamp });
    
    // Update statistics
    this.updateMetricStatistics(metric);
    
    // Check for anomalies
    this.checkMetricForAnomalies(name, value, attributes);
    
    logger.debug(`Advanced Monitoring: Recorded metric ${name}`, {
      value,
      attributes
    });
  }

  /**
   * Update metric statistics
   * @param {object} metric - Metric object
   */
  updateMetricStatistics(metric) {
    const values = metric.values.map(v => v.value);
    
    if (values.length === 0) {
      return;
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate standard deviation
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquaredDiff);
    
    metric.statistics = {
      count: values.length,
      sum,
      average: avg,
      min,
      max,
      stdDev,
      p50: this.calculatePercentile(values, 50),
      p95: this.calculatePercentile(values, 95),
      p99: this.calculatePercentile(values, 99)
    };
  }

  /**
   * Calculate percentile
   * @param {Array} values - Sorted values
   * @param {number} percentile - Percentile to calculate
   * @returns {number} Percentile value
   */
  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Check for anomalies in trace
   * @param {object} trace - Trace object
   */
  checkForAnomalies(trace) {
    const baseline = this.baselineMetrics.get(trace.operation);
    
    if (baseline && baseline.statistics) {
      const avgDuration = baseline.statistics.average;
      const stdDev = baseline.statistics.stdDev;
      
      // Check if duration is 3 standard deviations from mean
      if (trace.duration > avgDuration + (3 * stdDev)) {
        const anomalyId = `anomaly-${Date.now()}`;
        this.anomalies.set(anomalyId, {
          id: anomalyId,
          type: 'slow_trace',
          traceId: trace.id,
          operation: trace.operation,
          duration: trace.duration,
          expectedDuration: avgDuration,
          severity: 'high',
          timestamp: new Date().toISOString()
        });
        
        logger.warn(`Advanced Monitoring: Anomaly detected in trace ${trace.id}`, {
          duration: trace.duration,
          expectedDuration: avgDuration
        });
      }
    }
  }

  /**
   * Check metric for anomalies
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {object} attributes - Metric attributes
   */
  checkMetricForAnomalies(name, value, attributes) {
    const metricKey = `${name}:${JSON.stringify(attributes)}`;
    const metric = this.metrics.get(metricKey);
    
    if (!metric || metric.values.length < 10) {
      return;
    }
    
    const stats = metric.statistics;
    
    // Check if value is 3 standard deviations from mean
    if (value > stats.average + (3 * stats.stdDev) || value < stats.average - (3 * stats.stdDev)) {
      const anomalyId = `anomaly-${Date.now()}`;
      this.anomalies.set(anomalyId, {
        id: anomalyId,
        type: 'metric_anomaly',
        metricName: name,
        value,
        expectedValue: stats.average,
        stdDev: stats.stdDev,
        severity: 'medium',
        timestamp: new Date().toISOString()
      });
      
      logger.warn(`Advanced Monitoring: Metric anomaly detected for ${name}`, {
        value,
        expectedValue: stats.average
      });
    }
  }

  /**
   * Set baseline metric
   * @param {string} operation - Operation name
   * @param {object} statistics - Baseline statistics
   */
  setBaseline(operation, statistics) {
    this.baselineMetrics.set(operation, {
      operation,
      statistics,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Advanced Monitoring: Set baseline for ${operation}`, statistics);
  }

  /**
   * Get trace by ID
   * @param {string} traceId - Trace ID
   * @returns {object|null} Trace
   */
  getTrace(traceId) {
    return this.traces.get(traceId) || null;
  }

  /**
   * Get all traces
   * @param {number} limit - Maximum number of traces
   * @returns {Array} Traces
   */
  getTraces(limit = 50) {
    const traces = Array.from(this.traces.values())
      .sort((a, b) => b.startTime - a.startTime);
    
    return traces.slice(0, limit);
  }

  /**
   * Get metric statistics
   * @param {string} name - Metric name
   * @param {object} attributes - Metric attributes
   * @returns {object|null} Metric statistics
   */
  getMetricStatistics(name, attributes = {}) {
    const metricKey = `${name}:${JSON.stringify(attributes)}`;
    const metric = this.metrics.get(metricKey);
    
    return metric ? metric.statistics : null;
  }

  /**
   * Get all metrics
   * @returns {Array} Metrics
   */
  getAllMetrics() {
    return Array.from(this.metrics.values());
  }

  /**
   * Get anomalies
   * @param {number} limit - Maximum number of anomalies
   * @returns {Array} Anomalies
   */
  getAnomalies(limit = 50) {
    const anomalies = Array.from(this.anomalies.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return anomalies.slice(0, limit);
  }

  /**
   * Get alerts
   * @param {number} limit - Maximum number of alerts
   * @returns {Array} Alerts
   */
  getAlerts(limit = 50) {
    const alerts = Array.from(this.alerts.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return alerts.slice(0, limit);
  }

  /**
   * Create alert
   * @param {string} type - Alert type
   * @param {string} severity - Alert severity
   * @param {string} message - Alert message
   * @param {object} data - Alert data
   * @returns {string} Alert ID
   */
  createAlert(type, severity, message, data = {}) {
    const alertId = `alert-${Date.now()}`;
    
    this.alerts.set(alertId, {
      id: alertId,
      type,
      severity,
      message,
      data,
      timestamp: new Date().toISOString(),
      acknowledged: false
    });
    
    logger.warn(`Advanced Monitoring: Alert created ${alertId}`, {
      type,
      severity,
      message
    });
    
    return alertId;
  }

  /**
   * Acknowledge alert
   * @param {string} alertId - Alert ID
   * @returns {boolean} Success
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }
    
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date().toISOString();
    
    return true;
  }

  /**
   * Get monitoring statistics
   * @returns {object} Monitoring statistics
   */
  getStatistics() {
    const traces = this.getTraces();
    const activeTraces = traces.filter(t => t.status === 'active');
    const completedTraces = traces.filter(t => t.status === 'completed');
    const errorTraces = traces.filter(t => t.status === 'error');
    
    const avgDuration = completedTraces.length > 0
      ? completedTraces.reduce((sum, t) => sum + t.duration, 0) / completedTraces.length
      : 0;
    
    return {
      totalTraces: traces.length,
      activeTraces: activeTraces.length,
      completedTraces: completedTraces.length,
      errorTraces: errorTraces.length,
      averageDuration: avgDuration.toFixed(0) + 'ms',
      totalMetrics: this.metrics.size,
      totalAnomalies: this.anomalies.size,
      totalAlerts: this.alerts.size,
      unacknowledgedAlerts: Array.from(this.alerts.values()).filter(a => !a.acknowledged).length
    };
  }

  /**
   * Clear traces
   */
  clearTraces() {
    this.traces.clear();
    logger.info('Advanced Monitoring: Cleared all traces');
  }

  /**
   * Clear metrics
   */
  clearMetrics() {
    this.metrics.clear();
    logger.info('Advanced Monitoring: Cleared all metrics');
  }

  /**
   * Clear anomalies
   */
  clearAnomalies() {
    this.anomalies.clear();
    logger.info('Advanced Monitoring: Cleared all anomalies');
  }

  /**
   * Clear alerts
   */
  clearAlerts() {
    this.alerts.clear();
    logger.info('Advanced Monitoring: Cleared all alerts');
  }

  /**
   * Reset all monitoring data
   */
  reset() {
    this.traces.clear();
    this.metrics.clear();
    this.anomalies.clear();
    this.alerts.clear();
    this.baselineMetrics.clear();
    logger.info('Advanced Monitoring: Reset all monitoring data');
  }
}

export { AdvancedMonitoringManager };
