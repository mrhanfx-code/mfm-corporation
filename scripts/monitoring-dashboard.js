// Custom monitoring dashboard data collector
// Aggregates metrics for monitoring dashboards

class MonitoringDashboard {
  constructor(env) {
    this.env = env;
  }

  async getSystemMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      health: {},
      performance: {},
      usage: {},
      errors: {}
    };

    // Health metrics
    metrics.health = await this.getHealthMetrics();
    
    // Performance metrics
    metrics.performance = await this.getPerformanceMetrics();
    
    // Usage metrics
    metrics.usage = await this.getUsageMetrics();
    
    // Error metrics
    metrics.errors = await this.getErrorMetrics();

    return metrics;
  }

  async getHealthMetrics() {
    const health = {
      database: 'unknown',
      kv: 'unknown',
      r2: 'unknown',
      queue: 'unknown',
      llm: 'unknown'
    };

    try {
      // Database health
      await this.env.db.prepare('SELECT 1').first();
      health.database = 'healthy';
    } catch (error) {
      health.database = 'unhealthy';
    }

    try {
      // KV health
      await this.env.KV.put('health-check', 'test', { expirationTtl: 60 });
      health.kv = 'healthy';
    } catch (error) {
      health.kv = 'unhealthy';
    }

    try {
      // R2 health
      const bucket = this.env['mfm-corporation-uploads'];
      if (bucket) {
        await bucket.list({ limit: 1 });
        health.r2 = 'healthy';
      } else {
        health.r2 = 'not_configured';
      }
    } catch (error) {
      health.r2 = 'unhealthy';
    }

    // Queue health
    health.queue = this.env.TASK_QUEUE ? 'healthy' : 'not_configured';

    // LLM health
    const hasCerebras = !!this.env.CEREBRAS_API_KEY;
    const hasOpenRouter = !!this.env.OPENROUTER_API_KEY;
    health.llm = (hasCerebras || hasOpenRouter) ? 'healthy' : 'unhealthy';

    return health;
  }

  async getPerformanceMetrics() {
    const performance = {
      avg_response_time: 0,
      p95_response_time: 0,
      p99_response_time: 0,
      throughput: 0,
      error_rate: 0
    };

    try {
      // Get task metrics from last hour
      const tasks = await this.env.db.prepare(`
        SELECT 
          (julianday(completed_at) - julianday(created_at)) * 86400000 as response_ms,
          quality_score
        FROM tasks
        WHERE completed_at IS NOT NULL 
          AND created_at > datetime("now", "-1 hour")
      `).all();

      const taskList = tasks.results || [];
      
      if (taskList.length > 0) {
        const responseTimes = taskList.map(t => t.response_ms || 0);
        responseTimes.sort((a, b) => a - b);
        
        const sum = responseTimes.reduce((a, b) => a + b, 0);
        performance.avg_response_time = Math.round(sum / responseTimes.length);
        performance.p95_response_time = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
        performance.p99_response_time = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;
        performance.throughput = taskList.length; // tasks per hour
        
        const failedTasks = taskList.filter(t => t.quality_score < 0.5);
        performance.error_rate = (failedTasks.length / taskList.length) * 100;
      }
    } catch (error) {
      console.error('[MonitoringDashboard] Failed to get performance metrics:', error);
    }

    return performance;
  }

  async getUsageMetrics() {
    const usage = {
      total_tasks: 0,
      active_agents: 0,
      total_tokens: 0,
      total_cost: 0,
      storage_used: 0
    };

    try {
      // Total tasks (last 24 hours)
      const totalTasks = await this.env.db.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE created_at > datetime("now", "-1 day")
      `).first();
      usage.total_tasks = totalTasks?.count || 0;

      // Active agents (last 24 hours)
      const activeAgents = await this.env.db.prepare(`
        SELECT COUNT(DISTINCT agent) as count FROM tasks
        WHERE created_at > datetime("now", "-1 day")
      `).first();
      usage.active_agents = activeAgents?.count || 0;

      // Token usage (last 24 hours)
      const tokenUsage = await this.env.db.prepare(`
        SELECT SUM(total_tokens) as tokens, SUM(cost) as cost
        FROM model_usage
        WHERE timestamp > ?
      `).bind(Date.now() - 86400000).first();
      usage.total_tokens = tokenUsage?.tokens || 0;
      usage.total_cost = tokenUsage?.cost || 0;

      // Storage usage (R2)
      try {
        const bucket = this.env['mfm-corporation-uploads'];
        if (bucket) {
          const listed = await bucket.list();
          usage.storage_used = listed.objects.reduce((sum, obj) => sum + obj.size, 0);
        }
      } catch (error) {
        console.error('[MonitoringDashboard] Failed to get R2 usage:', error);
      }
    } catch (error) {
      console.error('[MonitoringDashboard] Failed to get usage metrics:', error);
    }

    return usage;
  }

  async getErrorMetrics() {
    const errors = {
      total_errors: 0,
      by_type: {},
      recent_errors: []
    };

    try {
      // Get errors from security alerts
      const alerts = await this.env.db.prepare(`
        SELECT type, message, timestamp
        FROM security_alerts
        WHERE status = 'active'
          AND timestamp > datetime("now", "-1 hour")
        ORDER BY timestamp DESC
        LIMIT 20
      `).all();

      const alertList = alerts.results || [];
      errors.total_errors = alertList.length;
      errors.recent_errors = alertList.slice(0, 10);

      // Group by type
      alertList.forEach(alert => {
        errors.by_type[alert.type] = (errors.by_type[alert.type] || 0) + 1;
      });

      // Get DLQ stats
      const dlqStats = await this.env.db.prepare(`
        SELECT COUNT(*) as count, status
        FROM dead_letter_queue
        WHERE failed_at > datetime("now", "-1 hour")
        GROUP BY status
      `).all();

      dlqStats.results?.forEach(stat => {
        errors.by_type[`dlq_${stat.status}`] = stat.count;
      });
    } catch (error) {
      console.error('[MonitoringDashboard] Failed to get error metrics:', error);
    }

    return errors;
  }

  async getAgentMetrics(agentId = null) {
    const metrics = {
      agent: agentId,
      tasks_completed: 0,
      avg_quality_score: 0,
      avg_response_time: 0,
      recent_activity: []
    };

    try {
      let query = `
        SELECT 
          COUNT(*) as count,
          AVG(quality_score) as avg_score,
          AVG((julianday(completed_at) - julianday(created_at)) * 86400000) as avg_time
        FROM tasks
        WHERE created_at > datetime("now", "-7 days")
      `;
      const params = [];

      if (agentId) {
        query += ' AND agent = ?';
        params.push(agentId);
      }

      const stats = await this.env.db.prepare(query).bind(...params).first();
      
      metrics.tasks_completed = stats?.count || 0;
      metrics.avg_quality_score = stats?.avg_score || 0;
      metrics.avg_response_time = Math.round(stats?.avg_time || 0);

      // Recent activity
      let activityQuery = `
        SELECT id, input, output, quality_score, created_at
        FROM tasks
        WHERE created_at > datetime("now", "-1 day")
      `;
      if (agentId) {
        activityQuery += ' AND agent = ?';
      }
      activityQuery += ' ORDER BY created_at DESC LIMIT 10';

      const activity = await this.env.db.prepare(activityQuery).bind(...params).all();
      metrics.recent_activity = activity.results || [];
    } catch (error) {
      console.error('[MonitoringDashboard] Failed to get agent metrics:', error);
    }

    return metrics;
  }

  async getCostMetrics(days = 7) {
    const metrics = {
      period_days: days,
      total_cost: 0,
      by_model: {},
      by_task_type: {},
      trend: []
    };

    try {
      const since = Date.now() - (days * 24 * 60 * 60 * 1000);

      // Total cost
      const totalCost = await this.env.db.prepare(`
        SELECT SUM(cost) as total FROM model_usage
        WHERE timestamp > ?
      `).bind(since).first();
      metrics.total_cost = totalCost?.total || 0;

      // Cost by model
      const byModel = await this.env.db.prepare(`
        SELECT model, SUM(cost) as cost, SUM(total_tokens) as tokens
        FROM model_usage
        WHERE timestamp > ?
        GROUP BY model
        ORDER BY cost DESC
      `).bind(since).all();

      byModel.results?.forEach(row => {
        metrics.by_model[row.model] = {
          cost: row.cost,
          tokens: row.tokens
        };
      });

      // Cost by task type
      const byTask = await this.env.db.prepare(`
        SELECT task_type, SUM(cost) as cost
        FROM model_usage
        WHERE timestamp > ?
        GROUP BY task_type
        ORDER BY cost DESC
      `).bind(since).all();

      byTask.results?.forEach(row => {
        metrics.by_task_type[row.task_type] = row.cost;
      });

      // Daily trend
      const trend = await this.env.db.prepare(`
        SELECT 
          date(timestamp/1000, 'unixepoch') as date,
          SUM(cost) as daily_cost
        FROM model_usage
        WHERE timestamp > ?
        GROUP BY date
        ORDER BY date ASC
      `).bind(since).all();

      metrics.trend = trend.results?.map(row => ({
        date: row.date,
        cost: row.daily_cost
      })) || [];
    } catch (error) {
      console.error('[MonitoringDashboard] Failed to get cost metrics:', error);
    }

    return metrics;
  }
}

// Singleton instance
let dashboardInstance = null;

export function getMonitoringDashboard(env) {
  if (!dashboardInstance) {
    dashboardInstance = new MonitoringDashboard(env);
  }
  return dashboardInstance;
}

export function resetMonitoringDashboard() {
  dashboardInstance = null;
}
