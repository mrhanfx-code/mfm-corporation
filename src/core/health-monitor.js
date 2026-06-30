// Health monitoring and alerting system
// Provides automated health checks with alerting

const HEALTH_CHECKS = {
  database: {
    name: 'D1 Database',
    check: async (env) => {
      try {
        const result = await env.db.prepare('SELECT 1 as test').first();
        return { healthy: !!result, latency: 0 };
      } catch (error) {
        return { healthy: false, error: error.message };
      }
    }
  },
  kv: {
    name: 'KV Storage',
    check: async (env) => {
      try {
        const testKey = 'health-check-test';
        await env.KV.put(testKey, 'test', { expirationTtl: 60 });
        const value = await env.KV.get(testKey);
        return { healthy: value === 'test', latency: 0 };
      } catch (error) {
        return { healthy: false, error: error.message };
      }
    }
  },
  r2: {
    name: 'R2 Storage',
    check: async (env) => {
      try {
        const bucket = env['mfm-corporation-uploads'];
        if (!bucket) return { healthy: false, error: 'R2 bucket not bound' };
        // Simple check - list with limit 0
        await bucket.list({ limit: 1 });
        return { healthy: true, latency: 0 };
      } catch (error) {
        return { healthy: false, error: error.message };
      }
    }
  },
  queue: {
    name: 'Task Queue',
    check: async (env) => {
      try {
        // Queue health check - verify queue is accessible
        return { healthy: !!env.TASK_QUEUE, latency: 0 };
      } catch (error) {
        return { healthy: false, error: error.message };
      }
    }
  },
  llm: {
    name: 'LLM Provider',
    check: async (env) => {
      try {
        const hasCerebras = !!env.CEREBRAS_API_KEY;
        const hasOpenRouter = !!env.OPENROUTER_API_KEY;
        return { 
          healthy: hasCerebras || hasOpenRouter, 
          details: { cerebras: hasCerebras, openrouter: hasOpenRouter }
        };
      } catch (error) {
        return { healthy: false, error: error.message };
      }
    }
  }
};

class HealthMonitor {
  constructor(env) {
    this.env = env;
    this.alertThreshold = 3; // Alert after 3 consecutive failures
    this.failureCounts = new Map();
    this.lastHealthStatus = new Map();
  }

  async runHealthChecks() {
    const results = {};
    const timestamp = new Date().toISOString();
    
    for (const [key, check] of Object.entries(HEALTH_CHECKS)) {
      const startTime = Date.now();
      const result = await check.check(this.env);
      const duration = Date.now() - startTime;
      
      results[key] = {
        name: check.name,
        ...result,
        duration,
        timestamp
      };
      
      // Track failures
      if (!result.healthy) {
        const count = (this.failureCounts.get(key) || 0) + 1;
        this.failureCounts.set(key, count);
        
        // Alert if threshold exceeded
        if (count >= this.alertThreshold) {
          await this.sendAlert(key, check.name, result.error);
        }
      } else {
        this.failureCounts.set(key, 0);
      }
      
      this.lastHealthStatus.set(key, result.healthy);
    }
    
    // Store health status in KV for dashboard
    await this.storeHealthStatus(results);
    
    return results;
  }

  async storeHealthStatus(results) {
    if (!this.env.KV) return;
    
    try {
      await this.env.KV.put(
        'health-status',
        JSON.stringify({
          results,
          timestamp: new Date().toISOString()
        }),
        { expirationTtl: 300 } // 5 minutes
      );
    } catch (error) {
      console.error('[HealthMonitor] Failed to store health status:', error);
    }
  }

  async sendAlert(component, componentName, error) {
    const alert = {
      component,
      componentName,
      error,
      timestamp: new Date().toISOString(),
      severity: 'critical'
    };
    
    console.error(`[HealthMonitor] ALERT: ${componentName} - ${error}`);
    
    // Store alert in database
    if (this.env.db) {
      try {
        await this.env.db.prepare(`
          INSERT INTO security_alerts (type, severity, message, timestamp, status)
          VALUES (?, ?, ?, ?, 'active')
        `).bind('health_check', 'critical', `${componentName}: ${error}`, alert.timestamp).run();
      } catch (err) {
        console.error('[HealthMonitor] Failed to store alert:', err);
      }
    }
    
    // Send to external alerting system (Sentry, Slack, etc.)
    if (this.env.SENTRY_DSN) {
      const { captureMessage } = await import('./error-tracking.js');
      captureMessage(`Health check failed: ${componentName}`, 'error', { component, error });
    }
  }

  async getHealthStatus() {
    if (!this.env.KV) return null;
    
    try {
      const status = await this.env.KV.get('health-status', { type: 'json' });
      return status;
    } catch (error) {
      console.error('[HealthMonitor] Failed to get health status:', error);
      return null;
    }
  }

  async getSystemHealth() {
    const results = await this.runHealthChecks();
    
    const healthyCount = Object.values(results).filter(r => r.healthy).length;
    const totalCount = Object.values(results).length;
    const healthPercentage = (healthyCount / totalCount) * 100;
    
    let status = 'healthy';
    if (healthPercentage < 50) status = 'unhealthy';
    else if (healthPercentage < 100) status = 'degraded';
    
    return {
      status,
      healthPercentage,
      checks: results,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
let monitorInstance = null;

export function getHealthMonitor(env) {
  if (!monitorInstance) {
    monitorInstance = new HealthMonitor(env);
  }
  return monitorInstance;
}

export function resetHealthMonitor() {
  monitorInstance = null;
}

// Scheduled health check handler
export async function handleScheduledHealthCheck(env) {
  const monitor = getHealthMonitor(env);
  const health = await monitor.getSystemHealth();
  
  console.log('[HealthMonitor] Scheduled health check:', health.status, `${health.healthPercentage}%`);
  
  return new Response(JSON.stringify(health), {
    headers: { 'Content-Type': 'application/json' }
  });
}
