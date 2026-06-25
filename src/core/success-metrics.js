// Success Metrics Framework — Team performance tracking and executive dashboard

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';

const TEAM_METRICS = {
  general_manager: {
    primary: ['executive_confidence', 'strategic_alignment'],
    targets: { executive_confidence: 0.90, strategic_alignment: 0.85 }
  },
  research: {
    primary: ['research_accuracy', 'solution_effectiveness'],
    targets: { research_accuracy: 0.90, solution_effectiveness: 0.85 }
  },
  planning: {
    primary: ['plan_accuracy', 'timeline_adherence'],
    targets: { plan_accuracy: 0.85, timeline_adherence: 0.90 }
  },
  development: {
    primary: ['code_quality', 'development_velocity'],
    targets: { code_quality: 0.90, development_velocity: 0.80 }
  },
  management: {
    primary: ['team_performance', 'quality_compliance'],
    targets: { team_performance: 0.85, quality_compliance: 0.95 }
  }
};

const METRIC_DEFINITIONS = {
  executive_confidence: {
    description: 'CEO confidence in GM decisions',
    calculation: 'average of CEO approval ratings',
    unit: 'score (0-1)',
    importance: 'critical'
  },
  strategic_alignment: {
    description: 'Alignment with company strategy',
    calculation: 'percentage of decisions aligned with strategy',
    unit: 'percentage',
    importance: 'high'
  },
  research_accuracy: {
    description: 'Accuracy of research findings',
    calculation: 'verified correct / total research outputs',
    unit: 'percentage',
    importance: 'critical'
  },
  solution_effectiveness: {
    description: 'Effectiveness of proposed solutions',
    calculation: 'successful implementations / total solutions',
    unit: 'percentage',
    importance: 'critical'
  },
  plan_accuracy: {
    description: 'Accuracy of project plans',
    calculation: 'plans executed as specified / total plans',
    unit: 'percentage',
    importance: 'high'
  },
  timeline_adherence: {
    description: 'Adherence to project timelines',
    calculation: 'on-time completions / total tasks',
    unit: 'percentage',
    importance: 'high'
  },
  code_quality: {
    description: 'Quality of code produced',
    calculation: 'passing tests / total tests + code review score',
    unit: 'score (0-1)',
    importance: 'critical'
  },
  development_velocity: {
    description: 'Speed of development',
    calculation: 'story points completed / time spent',
    unit: 'points per week',
    importance: 'medium'
  },
  team_performance: {
    description: 'Overall team performance score',
    calculation: 'average of individual team member scores',
    unit: 'score (0-1)',
    importance: 'high'
  },
  quality_compliance: {
    description: 'Compliance with quality standards',
    calculation: 'quality gates passed / total quality gates',
    unit: 'percentage',
    importance: 'critical'
  }
};

class SuccessMetricsManager {
  constructor(env) {
    this.env = env;
    this.metricHistory = new Map();
  }

  async recordMetric(teamName, metricName, value, context = {}) {
    const teamConfig = TEAM_METRICS[teamName];
    if (!teamConfig) {
      logger.warn(`Success Metrics: Unknown team ${teamName}`);
      return null;
    }

    if (!teamConfig.primary.includes(metricName) && !teamConfig.secondary?.includes(metricName)) {
      logger.warn(`Success Metrics: Unknown metric ${metricName} for team ${teamName}`);
      return null;
    }

    const target = teamConfig.targets[metricName] || 0.80;
    const met = value >= target;

    const metricRecord = {
      team: teamName,
      metric: metricName,
      value,
      target,
      met,
      context,
      timestamp: new Date().toISOString()
    };

    const historyKey = `${teamName}:${metricName}`;
    if (!this.metricHistory.has(historyKey)) {
      this.metricHistory.set(historyKey, []);
    }
    this.metricHistory.get(historyKey).push(metricRecord);

    logger.info(`Success Metrics: Recorded ${metricName} for ${teamName}`, {
      value,
      target,
      met
    });

    await this.saveMetric(metricRecord);

    return metricRecord;
  }

  async getTeamMetrics(teamName, timeRange = '7d') {
    const teamConfig = TEAM_METRICS[teamName];
    if (!teamConfig) {
      logger.warn(`Success Metrics: Unknown team ${teamName}`);
      return null;
    }

    const metrics = {};
    const cutoffDate = this.getCutoffDate(timeRange);

    for (const metricName of teamConfig.primary) {
      const historyKey = `${teamName}:${metricName}`;
      const history = this.metricHistory.get(historyKey) || [];
      
      const recentMetrics = history.filter(m => new Date(m.timestamp) >= cutoffDate);
      
      if (recentMetrics.length > 0) {
        const latest = recentMetrics[recentMetrics.length - 1];
        const average = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
        const target = teamConfig.targets[metricName] || 0.80;
        
        metrics[metricName] = {
          current: latest.value,
          average,
          target,
          met: latest.met,
          trend: this.calculateTrend(recentMetrics),
          definition: METRIC_DEFINITIONS[metricName]
        };
      }
    }

    return {
      team: teamName,
      metrics,
      overallScore: this.calculateOverallScore(metrics),
      timestamp: new Date().toISOString()
    };
  }

  async getAllTeamMetrics(timeRange = '7d') {
    const allMetrics = {};

    for (const teamName of Object.keys(TEAM_METRICS)) {
      allMetrics[teamName] = await this.getTeamMetrics(teamName, timeRange);
    }

    return allMetrics;
  }

  calculateOverallScore(teamMetrics) {
    if (!teamMetrics || Object.keys(teamMetrics).length === 0) return 0;

    const values = Object.values(teamMetrics).map(m => m.current);
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    
    return Math.round(average * 100) / 100;
  }

  calculateTrend(metrics) {
    if (metrics.length < 2) return 'stable';

    const recent = metrics.slice(-5);
    const first = recent[0].value;
    const last = recent[recent.length - 1].value;
    const change = ((last - first) / first) * 100;

    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  getCutoffDate(timeRange) {
    const now = new Date();
    const ranges = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    const days = ranges[timeRange] || 7;
    return new Date(now.setDate(now.getDate() - days));
  }

  async saveMetric(metricRecord) {
    try {
      const memoryKey = `metric:${metricRecord.team}:${metricRecord.metric}:${Date.now()}`;
      await saveMemory(this.env, memoryKey, metricRecord);
    } catch (error) {
      logger.error(`Success Metrics: Failed to save metric`, {
        error: error.message
      });
    }
  }

  async generateExecutiveDashboard() {
    const allMetrics = await this.getAllTeamMetrics('7d');
    
    const dashboard = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTeams: Object.keys(allMetrics).length,
        teamsMeetingTargets: 0,
        overallPerformance: 0
      },
      teams: {}
    };

    let totalScore = 0;
    let teamCount = 0;

    for (const [teamName, teamData] of Object.entries(allMetrics)) {
      if (teamData) {
        dashboard.teams[teamName] = {
          overallScore: teamData.overallScore,
          metrics: teamData.metrics,
          status: teamData.overallScore >= 0.85 ? 'excellent' : 
                  teamData.overallScore >= 0.75 ? 'good' : 'needs_improvement'
        };

        if (teamData.overallScore >= 0.85) {
          dashboard.summary.teamsMeetingTargets++;
        }

        totalScore += teamData.overallScore;
        teamCount++;
      }
    }

    dashboard.summary.overallPerformance = teamCount > 0 ? totalScore / teamCount : 0;

    await this.saveDashboard(dashboard);

    return dashboard;
  }

  async saveDashboard(dashboard) {
    try {
      const memoryKey = `dashboard:${Date.now()}`;
      await saveMemory(this.env, memoryKey, dashboard);
      logger.info(`Success Metrics: Dashboard saved`);
    } catch (error) {
      logger.error(`Success Metrics: Failed to save dashboard`, {
        error: error.message
      });
    }
  }

  async getMetricDefinition(metricName) {
    return METRIC_DEFINITIONS[metricName] || null;
  }

  async getTeamTargets(teamName) {
    const teamConfig = TEAM_METRICS[teamName];
    if (!teamConfig) return null;

    return {
      team: teamName,
      primaryMetrics: teamConfig.primary,
      targets: teamConfig.targets
    };
  }

  async getAllTargets() {
    const allTargets = {};

    for (const [teamName, config] of Object.entries(TEAM_METRICS)) {
      allTargets[teamName] = {
        primaryMetrics: config.primary,
        targets: config.targets
      };
    }

    return allTargets;
  }
}

export { SuccessMetricsManager, TEAM_METRICS, METRIC_DEFINITIONS };
