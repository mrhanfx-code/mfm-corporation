// MFM Corporation - Monitoring and Alerting System
// Real-time system health monitoring with automated alerting

// Monitoring configuration
const MONITORING_CONFIG = {
  alertThresholds: {
    errorRate: 5, // 5% error rate threshold
    responseTime: 1000, // 1 second response time threshold
    uptime: 99.9, // 99.9% uptime threshold
    rateLimitHits: 10 // 10 rate limit hits per minute threshold
  },
  alertChannels: {
    console: true,
    webhook: false, // Can be configured for Slack/Teams
    email: false    // Can be configured for email alerts
  },
  metricsRetention: {
    minutes: 60,
    hours: 24,
    days: 7
  }
};

// Metrics storage using KV
class MetricsCollector {
  constructor(env) {
    this.env = env;
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      rateLimitHits: 0,
      endpoints: {},
      lastUpdate: Date.now()
    };
  }

  async recordRequest(endpoint, status, responseTime, clientIP) {
    this.metrics.requests++;
    this.metrics.responseTime.push(responseTime);
    
    // Keep only last 100 response times for average calculation
    if (this.metrics.responseTime.length > 100) {
      this.metrics.responseTime.shift();
    }

    // Track endpoint-specific metrics
    if (!this.metrics.endpoints[endpoint]) {
      this.metrics.endpoints[endpoint] = { requests: 0, errors: 0, avgResponseTime: 0 };
    }
    this.metrics.endpoints[endpoint].requests++;
    this.metrics.endpoints[endpoint].avgResponseTime = 
      this.calculateAverageResponseTime(endpoint);

    if (status >= 400) {
      this.metrics.errors++;
      this.metrics.endpoints[endpoint].errors++;
    }

    // Update KV storage periodically
    if (Date.now() - this.metrics.lastUpdate > 60000) { // Every minute
      await this.persistMetrics();
      this.metrics.lastUpdate = Date.now();
    }
  }

  async recordRateLimitHit(clientIP) {
    this.metrics.rateLimitHits++;
    
    // Check if rate limit threshold exceeded
    if (this.metrics.rateLimitHits >= MONITORING_CONFIG.alertThresholds.rateLimitHits) {
      await this.triggerAlert('RATE_LIMIT', 
        `Rate limit threshold exceeded: ${this.metrics.rateLimitHits} hits`);
    }
  }

  calculateAverageResponseTime(endpoint = null) {
    const times = endpoint 
      ? this.metrics.responseTime.slice(-10) // Last 10 requests for endpoint
      : this.metrics.responseTime;
    
    return times.length > 0 
      ? times.reduce((a, b) => a + b, 0) / times.length 
      : 0;
  }

  calculateErrorRate() {
    return this.metrics.requests > 0 
      ? (this.metrics.errors / this.metrics.requests) * 100 
      : 0;
  }

  async persistMetrics() {
    try {
      const timestamp = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      const key = `metrics:${timestamp}`;
      
      await this.env.KV.put(key, JSON.stringify({
        ...this.metrics,
        timestamp: new Date().toISOString()
      }), { expirationTtl: 86400 * 7 }); // Keep for 7 days
      
    } catch (error) {
      console.error('Failed to persist metrics:', error);
    }
  }

  async getMetrics(timeRange = 'hour') {
    try {
      const now = new Date();
      const keys = [];
      
      // Generate keys for the requested time range
      if (timeRange === 'hour') {
        for (let i = 0; i < 60; i++) {
          const time = new Date(now.getTime() - i * 60000);
          keys.push(`metrics:${time.toISOString().slice(0, 16)}`);
        }
      } else if (timeRange === 'day') {
        for (let i = 0; i < 24; i++) {
          const time = new Date(now.getTime() - i * 3600000);
          keys.push(`metrics:${time.toISOString().slice(0, 16)}`);
        }
      }

      const results = await Promise.all(
        keys.map(async (key) => {
          const value = await this.env.KV.get(key);
          return value ? JSON.parse(value) : null;
        })
      );

      return results.filter(r => r !== null);
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return [];
    }
  }
}

// Alert system
class AlertManager {
  constructor(env) {
    this.env = env;
    this.alertHistory = [];
  }

  async triggerAlert(type, message, severity = 'WARNING') {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      severity,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.alertHistory.push(alert);
    
    // Keep only last 100 alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory.shift();
    }

    // Store alert in KV
    await this.env.KV.put(`alert:${alert.id}`, JSON.stringify(alert), 
      { expirationTtl: 86400 * 7 }); // Keep for 7 days

    // Send alert to configured channels
    await this.sendAlert(alert);
  }

  async sendAlert(alert) {
    const alertMessage = `[${alert.severity}] ${alert.type}: ${alert.message}`;
    
    // Console logging (always enabled)
    console.log(`🚨 ALERT: ${alertMessage}`);
    
    // Webhook integration (can be configured)
    if (MONITORING_CONFIG.alertChannels.webhook) {
      await this.sendWebhookAlert(alert);
    }
    
    // Email integration (can be configured)
    if (MONITORING_CONFIG.alertChannels.email) {
      await this.sendEmailAlert(alert);
    }
  }

  async sendWebhookAlert(alert) {
    try {
      const webhookUrl = this.env.WEBHOOK_URL;
      if (!webhookUrl) return;

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: alert.message,
          severity: alert.severity,
          timestamp: alert.timestamp
        })
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  async sendEmailAlert(alert) {
    // Email integration would go here
    console.log('Email alert integration not configured');
  }

  async getActiveAlerts() {
    try {
      const alerts = await this.env.KV.list({ prefix: 'alert:' });
      const activeAlerts = [];
      
      for (const key of alerts.keys) {
        const alert = JSON.parse(await this.env.KV.get(key.name));
        if (!alert.resolved) {
          activeAlerts.push(alert);
        }
      }
      
      return activeAlerts;
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }
}

// Health check system
class HealthChecker {
  constructor(env) {
    this.env = env;
    this.metricsCollector = new MetricsCollector(env);
    this.alertManager = new AlertManager(env);
  }

  async checkSystemHealth() {
    const health = {
      status: 'HEALTHY',
      checks: {},
      timestamp: new Date().toISOString(),
      metrics: this.metricsCollector.metrics
    };

    // Check error rate
    const errorRate = this.metricsCollector.calculateErrorRate();
    health.checks.errorRate = {
      status: errorRate < MONITORING_CONFIG.alertThresholds.errorRate ? 'PASS' : 'FAIL',
      value: errorRate,
      threshold: MONITORING_CONFIG.alertThresholds.errorRate
    };

    // Check response time
    const avgResponseTime = this.metricsCollector.calculateAverageResponseTime();
    health.checks.responseTime = {
      status: avgResponseTime < MONITORING_CONFIG.alertThresholds.responseTime ? 'PASS' : 'FAIL',
      value: avgResponseTime,
      threshold: MONITORING_CONFIG.alertThresholds.responseTime
    };

    // Check rate limiting
    health.checks.rateLimiting = {
      status: this.metricsCollector.metrics.rateLimitHits < MONITORING_CONFIG.alertThresholds.rateLimitHits ? 'PASS' : 'FAIL',
      value: this.metricsCollector.metrics.rateLimitHits,
      threshold: MONITORING_CONFIG.alertThresholds.rateLimitHits
    };

    // Check resource availability
    health.checks.resources = {
      database: !!this.env.db,
      kv: !!this.env.KV,
      r2: !!this.env["mfm-corporation-uploads"]
    };

    // Determine overall health
    const failedChecks = Object.values(health.checks).filter(check => 
      typeof check === 'object' && check.status === 'FAIL'
    ).length;

    if (failedChecks > 0) {
      health.status = failedChecks === 1 ? 'DEGRADED' : 'UNHEALTHY';
      await this.alertManager.triggerAlert('SYSTEM_HEALTH', 
        `System health: ${health.status} (${failedChecks} checks failed)`);
    }

    return health;
  }

  async generateHealthReport() {
    const health = await this.checkSystemHealth();
    const metrics = await this.metricsCollector.getMetrics('hour');
    const alerts = await this.alertManager.getActiveAlerts();

    return {
      health,
      metrics: {
        summary: {
          totalRequests: metrics.reduce((sum, m) => sum + m.requests, 0),
          totalErrors: metrics.reduce((sum, m) => sum + m.errors, 0),
          avgResponseTime: this.metricsCollector.calculateAverageResponseTime()
        },
        hourly: metrics
      },
      alerts: {
        active: alerts.length,
        recent: alerts.slice(0, 10)
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Monitoring middleware
function createMonitoringMiddleware(env) {
  const healthChecker = new HealthChecker(env);
  
  return async (request, response, startTime) => {
    const duration = Date.now() - startTime;
    const endpoint = new URL(request.url).pathname;
    const status = response.status;
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    // Record metrics
    await healthChecker.metricsCollector.recordRequest(endpoint, status, duration, clientIP);

    // Check for health issues periodically
    if (Math.random() < 0.01) { // 1% chance to check health
      await healthChecker.checkSystemHealth();
    }

    return healthChecker;
  };
}

// Export monitoring components
export { 
  MetricsCollector, 
  AlertManager, 
  HealthChecker, 
  createMonitoringMiddleware 
};

// Auto-initialize monitoring if running in worker environment
if (typeof globalThis !== 'undefined' && globalThis.fetch) {
  // This will be initialized in the main worker
  console.log('📊 Monitoring system initialized');
}
