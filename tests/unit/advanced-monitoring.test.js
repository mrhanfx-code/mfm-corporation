import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdvancedMonitoringManager } from '../../src/core/advanced-monitoring.js';

describe('AdvancedMonitoringManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    manager = new AdvancedMonitoringManager(mockEnv);
    vi.clearAllMocks();
  });

  it('should start a trace', () => {
    const traceId = manager.startTrace('test-operation', { userId: 'user-1' });

    expect(traceId).toBeDefined();
    expect(traceId).toContain('trace-');
    
    const trace = manager.getTrace(traceId);
    expect(trace).toBeDefined();
    expect(trace.operation).toBe('test-operation');
    expect(trace.status).toBe('active');
  });

  it('should end a trace', async () => {
    const traceId = manager.startTrace('test-operation');
    await new Promise(resolve => setTimeout(resolve, 10));
    const completedTrace = manager.endTrace(traceId, 'completed', { result: 'success' });

    expect(completedTrace).toBeDefined();
    expect(completedTrace.status).toBe('completed');
    expect(completedTrace.duration).toBeGreaterThan(0);
  });

  it('should return null when ending non-existent trace', () => {
    const result = manager.endTrace('non-existent');
    expect(result).toBeNull();
  });

  it('should add a span to a trace', () => {
    const traceId = manager.startTrace('test-operation');
    const spanId = manager.addSpan(traceId, 'sub-operation', { key: 'value' });

    expect(spanId).toBeDefined();
    expect(spanId).toContain('span-');
    
    const trace = manager.getTrace(traceId);
    expect(trace.spans.length).toBe(1);
  });

  it('should return null when adding span to non-existent trace', () => {
    const spanId = manager.addSpan('non-existent', 'sub-operation');
    expect(spanId).toBeNull();
  });

  it('should end a span', async () => {
    const traceId = manager.startTrace('test-operation');
    const spanId = manager.addSpan(traceId, 'sub-operation');
    await new Promise(resolve => setTimeout(resolve, 10));
    const result = manager.endSpan(traceId, spanId, 'completed');

    expect(result).toBe(true);
    
    const trace = manager.getTrace(traceId);
    const span = trace.spans[0];
    expect(span.status).toBe('completed');
    expect(span.duration).toBeGreaterThan(0);
  });

  it('should return false when ending non-existent span', () => {
    const traceId = manager.startTrace('test-operation');
    const result = manager.endSpan(traceId, 'non-existent');
    expect(result).toBe(false);
  });

  it('should record a metric', () => {
    manager.recordMetric('test-metric', 100, { tag: 'value' });

    const metrics = manager.getAllMetrics();
    expect(metrics.length).toBe(1);
    expect(metrics[0].name).toBe('test-metric');
  });

  it('should update metric statistics', () => {
    manager.recordMetric('test-metric', 100);
    manager.recordMetric('test-metric', 200);
    manager.recordMetric('test-metric', 300);

    const stats = manager.getMetricStatistics('test-metric');
    expect(stats).toBeDefined();
    expect(stats.count).toBe(3);
    expect(stats.average).toBe(200);
  });

  it('should calculate percentiles correctly', () => {
    for (let i = 1; i <= 100; i++) {
      manager.recordMetric('test-metric', i);
    }

    const stats = manager.getMetricStatistics('test-metric');
    expect(stats.p50).toBe(50);
    expect(stats.p95).toBe(95);
    expect(stats.p99).toBe(99);
  });

  it('should set baseline metric', () => {
    const statistics = { average: 100, stdDev: 10 };
    manager.setBaseline('test-operation', statistics);

    const baseline = manager.baselineMetrics.get('test-operation');
    expect(baseline).toBeDefined();
    expect(baseline.statistics).toEqual(statistics);
  });

  it('should detect slow trace anomaly', () => {
    manager.setBaseline('test-operation', { average: 100, stdDev: 10 });
    
    const traceId = manager.startTrace('test-operation');
    // Simulate a slow trace by setting end time manually
    const trace = manager.getTrace(traceId);
    trace.startTime = Date.now() - 1000; // 1 second ago
    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;
    
    manager.checkForAnomalies(trace);
    
    const anomalies = manager.getAnomalies();
    expect(anomalies.length).toBeGreaterThan(0);
  });

  it('should detect metric anomaly', () => {
    // Record baseline data
    for (let i = 0; i < 10; i++) {
      manager.recordMetric('test-metric', 100);
    }
    
    // Record anomalous value
    manager.recordMetric('test-metric', 1000);
    
    const anomalies = manager.getAnomalies();
    expect(anomalies.length).toBeGreaterThan(0);
  });

  it('should get trace by ID', () => {
    const traceId = manager.startTrace('test-operation');
    const trace = manager.getTrace(traceId);
    
    expect(trace).toBeDefined();
    expect(trace.id).toBe(traceId);
  });

  it('should return null for non-existent trace', () => {
    const trace = manager.getTrace('non-existent');
    expect(trace).toBeNull();
  });

  it('should get all traces', () => {
    manager.startTrace('operation-1');
    manager.startTrace('operation-2');
    
    const traces = manager.getTraces();
    expect(traces.length).toBe(2);
  });

  it('should limit traces returned', () => {
    for (let i = 0; i < 10; i++) {
      manager.startTrace(`operation-${i}`);
    }
    
    const traces = manager.getTraces(5);
    expect(traces.length).toBe(5);
  });

  it('should get metric statistics', () => {
    manager.recordMetric('test-metric', 100);
    const stats = manager.getMetricStatistics('test-metric');
    
    expect(stats).toBeDefined();
    expect(stats.count).toBe(1);
  });

  it('should return null for non-existent metric', () => {
    const stats = manager.getMetricStatistics('non-existent');
    expect(stats).toBeNull();
  });

  it('should get all metrics', () => {
    manager.recordMetric('metric-1', 100);
    manager.recordMetric('metric-2', 200);
    
    const metrics = manager.getAllMetrics();
    expect(metrics.length).toBe(2);
  });

  it('should get anomalies', () => {
    manager.setBaseline('test-operation', { average: 100, stdDev: 10 });
    
    const traceId = manager.startTrace('test-operation');
    const trace = manager.getTrace(traceId);
    trace.startTime = Date.now() - 1000;
    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;
    manager.checkForAnomalies(trace);
    
    const anomalies = manager.getAnomalies();
    expect(anomalies.length).toBeGreaterThan(0);
  });

  it('should limit anomalies returned', () => {
    for (let i = 0; i < 10; i++) {
      manager.setBaseline(`operation-${i}`, { average: 100, stdDev: 10 });
      const traceId = manager.startTrace(`operation-${i}`);
      const trace = manager.getTrace(traceId);
      trace.startTime = Date.now() - 1000;
      trace.endTime = Date.now();
      trace.duration = trace.endTime - trace.startTime;
      manager.checkForAnomalies(trace);
    }
    
    const anomalies = manager.getAnomalies(5);
    expect(anomalies.length).toBeGreaterThanOrEqual(2);
  });

  it('should create alert', () => {
    const alertId = manager.createAlert('test-type', 'high', 'Test alert message');
    
    expect(alertId).toBeDefined();
    expect(alertId).toContain('alert-');
    
    const alerts = manager.getAlerts();
    expect(alerts.length).toBe(1);
  });

  it('should acknowledge alert', () => {
    const alertId = manager.createAlert('test-type', 'high', 'Test alert');
    const result = manager.acknowledgeAlert(alertId);
    
    expect(result).toBe(true);
    
    const alerts = manager.getAlerts();
    expect(alerts[0].acknowledged).toBe(true);
  });

  it('should return false when acknowledging non-existent alert', () => {
    const result = manager.acknowledgeAlert('non-existent');
    expect(result).toBe(false);
  });

  it('should get alerts', async () => {
    manager.createAlert('type-1', 'high', 'Alert 1');
    await new Promise(resolve => setTimeout(resolve, 10));
    manager.createAlert('type-2', 'medium', 'Alert 2');
    
    const alerts = manager.getAlerts();
    expect(alerts.length).toBeGreaterThanOrEqual(1);
  });

  it('should limit alerts returned', async () => {
    for (let i = 0; i < 10; i++) {
      manager.createAlert(`type-${i}`, 'high', `Alert ${i}`);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const alerts = manager.getAlerts(5);
    expect(alerts.length).toBeGreaterThanOrEqual(2);
  });

  it('should get monitoring statistics', () => {
    manager.startTrace('operation-1');
    const traceId = manager.startTrace('operation-2');
    manager.endTrace(traceId);
    manager.recordMetric('test-metric', 100);
    
    const stats = manager.getStatistics();
    expect(stats).toBeDefined();
    expect(stats.totalTraces).toBe(2);
    expect(stats.totalMetrics).toBe(1);
  });

  it('should return zero statistics when no data', () => {
    const stats = manager.getStatistics();
    expect(stats.totalTraces).toBe(0);
    expect(stats.totalMetrics).toBe(0);
  });

  it('should clear traces', () => {
    manager.startTrace('operation-1');
    manager.clearTraces();
    
    const traces = manager.getTraces();
    expect(traces.length).toBe(0);
  });

  it('should clear metrics', () => {
    manager.recordMetric('test-metric', 100);
    manager.clearMetrics();
    
    const metrics = manager.getAllMetrics();
    expect(metrics.length).toBe(0);
  });

  it('should clear anomalies', () => {
    manager.setBaseline('test-operation', { average: 100, stdDev: 10 });
    const traceId = manager.startTrace('test-operation');
    const trace = manager.getTrace(traceId);
    trace.startTime = Date.now() - 1000;
    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;
    manager.checkForAnomalies(trace);
    
    manager.clearAnomalies();
    
    const anomalies = manager.getAnomalies();
    expect(anomalies.length).toBe(0);
  });

  it('should clear alerts', () => {
    manager.createAlert('test-type', 'high', 'Test alert');
    manager.clearAlerts();
    
    const alerts = manager.getAlerts();
    expect(alerts.length).toBe(0);
  });

  it('should reset all monitoring data', () => {
    manager.startTrace('operation-1');
    manager.recordMetric('test-metric', 100);
    manager.createAlert('test-type', 'high', 'Test alert');
    
    manager.reset();
    
    const stats = manager.getStatistics();
    expect(stats.totalTraces).toBe(0);
    expect(stats.totalMetrics).toBe(0);
    expect(stats.totalAlerts).toBe(0);
  });

  it('should track trace attributes', () => {
    const attributes = { userId: 'user-1', requestId: 'req-1' };
    const traceId = manager.startTrace('test-operation', attributes);
    
    const trace = manager.getTrace(traceId);
    expect(trace.attributes.userId).toBe('user-1');
    expect(trace.attributes.requestId).toBe('req-1');
  });

  it('should track span attributes', () => {
    const traceId = manager.startTrace('test-operation');
    const attributes = { key: 'value' };
    const spanId = manager.addSpan(traceId, 'sub-operation', attributes);
    
    const trace = manager.getTrace(traceId);
    expect(trace.spans[0].attributes.key).toBe('value');
  });
});
