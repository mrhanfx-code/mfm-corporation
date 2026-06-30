// A/B testing for agent routing
// Enables controlled experiments with different agent configurations

class ABTestingManager {
  constructor(env) {
    this.env = env;
    this.experiments = new Map();
  }

  async createExperiment(name, config) {
    const experiment = {
      id: crypto.randomUUID(),
      name,
      config,
      createdAt: new Date().toISOString(),
      status: 'active',
      trafficSplit: config.trafficSplit || { control: 50, variant: 50 },
      metrics: {
        control: { count: 0, success: 0, errors: 0 },
        variant: { count: 0, success: 0, errors: 0 }
      }
    };
    
    // Store in database
    if (this.env.db) {
      try {
        await this.env.db.prepare(`
          INSERT INTO ab_experiments (id, name, config, created_at, status, traffic_split, metrics)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          experiment.id,
          name,
          JSON.stringify(config),
          experiment.createdAt,
          'active',
          JSON.stringify(experiment.trafficSplit),
          JSON.stringify(experiment.metrics)
        ).run();
      } catch (error) {
        console.error('[ABTesting] Failed to create experiment:', error);
      }
    }
    
    this.experiments.set(experiment.id, experiment);
    
    console.log(`[ABTesting] Created experiment: ${name}`);
    
    return experiment;
  }

  async getExperiment(experimentId) {
    // Check memory first
    if (this.experiments.has(experimentId)) {
      return this.experiments.get(experimentId);
    }
    
    // Check database
    if (this.env.db) {
      try {
        const result = await this.env.db.prepare(`
          SELECT * FROM ab_experiments WHERE id = ?
        `).bind(experimentId).first();
        
        if (result) {
          const experiment = {
            id: result.id,
            name: result.name,
            config: JSON.parse(result.config),
            createdAt: result.created_at,
            status: result.status,
            trafficSplit: JSON.parse(result.traffic_split),
            metrics: JSON.parse(result.metrics)
          };
          
          this.experiments.set(experiment.id, experiment);
          return experiment;
        }
      } catch (error) {
        console.error('[ABTesting] Failed to get experiment:', error);
      }
    }
    
    return null;
  }

  async assignVariant(userId, experimentId) {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment || experiment.status !== 'active') {
      return null;
    }
    
    // Consistent hashing for user assignment
    const hash = this.hashUser(userId);
    const threshold = experiment.trafficSplit.control / 100;
    
    const variant = hash < threshold ? 'control' : 'variant';
    
    // Update metrics
    experiment.metrics[variant].count++;
    await this.updateExperimentMetrics(experimentId, experiment.metrics);
    
    return {
      experimentId,
      variant,
      config: experiment.config[variant]
    };
  }

  hashUser(userId) {
    // Simple hash function for consistent assignment
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  async recordResult(experimentId, variant, success, error = null) {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment) return;
    
    if (success) {
      experiment.metrics[variant].success++;
    } else {
      experiment.metrics[variant].errors++;
    }
    
    await this.updateExperimentMetrics(experimentId, experiment.metrics);
  }

  async updateExperimentMetrics(experimentId, metrics) {
    if (this.env.db) {
      try {
        await this.env.db.prepare(`
          UPDATE ab_experiments SET metrics = ? WHERE id = ?
        `).bind(JSON.stringify(metrics), experimentId).run();
      } catch (error) {
        console.error('[ABTesting] Failed to update metrics:', error);
      }
    }
    
    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      experiment.metrics = metrics;
    }
  }

  async getExperimentResults(experimentId) {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment) return null;
    
    const controlSuccessRate = experiment.metrics.control.count > 0
      ? (experiment.metrics.control.success / experiment.metrics.control.count) * 100
      : 0;
    
    const variantSuccessRate = experiment.metrics.variant.count > 0
      ? (experiment.metrics.variant.success / experiment.metrics.variant.count) * 100
      : 0;
    
    const improvement = controlSuccessRate > 0
      ? ((variantSuccessRate - controlSuccessRate) / controlSuccessRate) * 100
      : 0;
    
    return {
      experimentId,
      name: experiment.name,
      status: experiment.status,
      metrics: experiment.metrics,
      analysis: {
        controlSuccessRate: controlSuccessRate.toFixed(2),
        variantSuccessRate: variantSuccessRate.toFixed(2),
        improvement: improvement.toFixed(2),
        significant: Math.abs(improvement) > 5 // 5% threshold
      },
      timestamp: new Date().toISOString()
    };
  }

  async endExperiment(experimentId, winner = null) {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment) return;
    
    experiment.status = 'ended';
    experiment.endedAt = new Date().toISOString();
    experiment.winner = winner;
    
    if (this.env.db) {
      try {
        await this.env.db.prepare(`
          UPDATE ab_experiments 
          SET status = 'ended', ended_at = ?, winner = ?
          WHERE id = ?
        `).bind(experiment.endedAt, winner, experimentId).run();
      } catch (error) {
        console.error('[ABTesting] Failed to end experiment:', error);
      }
    }
    
    console.log(`[ABTesting] Ended experiment: ${experiment.name} (winner: ${winner})`);
    
    return experiment;
  }

  async listExperiments(status = 'active') {
    if (this.env.db) {
      try {
        const results = await this.env.db.prepare(`
          SELECT * FROM ab_experiments
          WHERE status = ?
          ORDER BY created_at DESC
        `).bind(status).all();
        
        return (results.results || []).map(r => ({
          id: r.id,
          name: r.name,
          config: JSON.parse(r.config),
          createdAt: r.created_at,
          status: r.status,
          trafficSplit: JSON.parse(r.traffic_split),
          metrics: JSON.parse(r.metrics)
        }));
      } catch (error) {
        console.error('[ABTesting] Failed to list experiments:', error);
      }
    }
    
    return [];
  }

  async createRoutingExperiment(agentId, controlConfig, variantConfig) {
    return await this.createExperiment(`routing_${agentId}`, {
      type: 'routing',
      agentId,
      control: controlConfig,
      variant: variantConfig,
      trafficSplit: { control: 50, variant: 50 }
    });
  }
}

// Singleton instance
let abTestingInstance = null;

export function getABTestingManager(env) {
  if (!abTestingInstance) {
    abTestingInstance = new ABTestingManager(env);
  }
  return abTestingInstance;
}

export function resetABTestingManager() {
  abTestingInstance = null;
}
