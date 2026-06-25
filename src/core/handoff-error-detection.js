// Handoff Error Detection System

import { logger } from './logger.js';

const HANDOFF_ERROR_TYPES = {
  quality_gate_failure: 'Quality gate failure',
  missing_context: 'Missing required context',
  invalid_task: 'Invalid task description',
  team_unavailable: 'Target team unavailable',
  timeout: 'Handoff timeout',
  data_corruption: 'Data corruption during handoff',
  permission_denied: 'Permission denied',
  dependency_missing: 'Missing dependency'
};

const HANDOFF_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

class HandoffErrorDetector {
  constructor(env) {
    this.env = env;
    this.errorHistory = new Map();
  }

  /**
   * Detect errors during handoff
   */
  detectHandoffError(handoff) {
    const errors = [];

    // Check 1: Quality gate failure
    if (handoff.quality_score && handoff.quality_score < 85) {
      errors.push({
        type: HANDOFF_ERROR_TYPES.quality_gate_failure,
        severity: 'high',
        message: `Quality score ${handoff.quality_score} below threshold 85`,
        recommendation: 'Improve work quality before handoff'
      });
    }

    // Check 2: Missing context
    if (!handoff.task_description || handoff.task_description.length < 10) {
      errors.push({
        type: HANDOFF_ERROR_TYPES.missing_context,
        severity: 'high',
        message: 'Task description too short or missing',
        recommendation: 'Provide detailed task description'
      });
    }

    // Check 3: Invalid task
    if (!handoff.task_id) {
      errors.push({
        type: HANDOFF_ERROR_TYPES.invalid_task,
        severity: 'medium',
        message: 'No task ID provided',
        recommendation: 'Ensure task is properly initialized'
      });
    }

    // Check 4: Timeout
    if (handoff.created_at) {
      const elapsed = Date.now() - new Date(handoff.created_at).getTime();
      if (elapsed > HANDOFF_TIMEOUT_MS) {
        errors.push({
          type: HANDOFF_ERROR_TYPES.timeout,
          severity: 'critical',
          message: `Handoff timeout after ${Math.floor(elapsed / 1000)} seconds`,
          recommendation: 'Escalate to General Manager'
        });
      }
    }

    // Check 5: Team availability (would check team status in production)
    // This is a placeholder - in production, check team.status from database
    if (this.isTeamUnavailable(handoff.to_team)) {
      errors.push({
        type: HANDOFF_ERROR_TYPES.team_unavailable,
        severity: 'high',
        message: `Target team ${handoff.to_team} is unavailable`,
        recommendation: 'Wait for team availability or redirect to alternative team'
      });
    }

    return errors;
  }

  /**
   * Check if team is unavailable
   */
  isTeamUnavailable(teamName) {
    // In production, query database for team status
    // Placeholder implementation
    return false;
  }

  /**
   * Log handoff error
   */
  async logHandoffError(handoffId, error) {
    if (!this.env.db) return;

    await this.env.db.prepare(
      'INSERT INTO handoff_errors (handoff_id, error_type, severity, message, recommendation, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))'
    ).bind(
      handoffId,
      error.type,
      error.severity,
      error.message,
      error.recommendation
    ).run();

    logger.error('HandoffErrorDetector', 'error_detected', {
      handoffId,
      errorType: error.type,
      severity: error.severity,
      message: error.message
    });
  }

  /**
   * Get handoff error statistics
   */
  async getHandoffErrorStats(env) {
    if (!env.db) return { total: 0, byType: {}, bySeverity: {} };

    const result = await env.db.prepare(
      'SELECT error_type, severity, COUNT(*) as count FROM handoff_errors GROUP BY error_type, severity'
    ).all();

    const stats = { total: 0, byType: {}, bySeverity: {} };

    for (const row of (result.results || [])) {
      stats.total += row.count;
      stats.byType[row.error_type] = (stats.byType[row.error_type] || 0) + row.count;
      stats.bySeverity[row.severity] = (stats.bySeverity[row.severity] || 0) + row.count;
    }

    return stats;
  }

  /**
   * Get error rate by team
   */
  async getErrorRateByTeam(env) {
    if (!env.db) return {};

    const result = await env.db.prepare(`
      SELECT 
        h.from_team,
        COUNT(*) as total_handoffs,
        COUNT(he.id) as error_count,
        CAST(COUNT(he.id) * 100.0 / NULLIF(COUNT(*), 0) AS REAL) as error_rate
      FROM team_handoffs h
      LEFT JOIN handoff_errors he ON h.id = he.handoff_id
      GROUP BY h.from_team
    `).all();

    const rates = {};
    for (const row of (result.results || [])) {
      rates[row.from_team] = {
        totalHandoffs: row.total_handoffs,
        errorCount: row.error_count,
        errorRate: row.error_rate || 0
      };
    }

    return rates;
  }
}

export { HandoffErrorDetector, HANDOFF_ERROR_TYPES, HANDOFF_TIMEOUT_MS };
