// Cost Monitor — Real-time cost tracking and budget management

import { logger } from './logger.js';

class CostMonitor {
  constructor(env) {
    this.env = env;
    this.costHistory = new Map();
    this.budgetAlerts = new Map();
    this.currentBudget = null;
    this.costThresholds = {
      warning: 0.7, // 70% of budget
      critical: 0.9 // 90% of budget
    };
  }

  /**
   * Track cost for a model call
   * @param {string} modelId - Model identifier
   * @param {number} tokens - Number of tokens used
   * @param {number} costPerToken - Cost per token
   * @param {object} metadata - Additional metadata
   */
  trackCost(modelId, tokens, costPerToken, metadata = {}) {
    const cost = tokens * costPerToken;
    const timestamp = new Date().toISOString();
    
    const costEntry = {
      modelId,
      tokens,
      costPerToken,
      cost,
      timestamp,
      metadata
    };
    
    // Store in history
    const key = `${modelId}:${timestamp}`;
    this.costHistory.set(key, costEntry);
    
    // Update budget tracking
    this.updateBudgetTracking(cost);
    
    logger.info(`Cost Monitor: Tracked cost`, {
      modelId,
      tokens,
      cost,
      timestamp
    });
    
    return costEntry;
  }

  /**
   * Set budget for cost monitoring
   * @param {object} budget - Budget configuration
   */
  setBudget(budget) {
    this.currentBudget = {
      total: budget.total || 1000,
      period: budget.period || 'monthly',
      startDate: budget.startDate || new Date().toISOString(),
      endDate: budget.endDate || this.calculateEndDate(budget.period),
      spent: 0,
      alerts: budget.alerts || true
    };
    
    logger.info(`Cost Monitor: Budget set`, {
      total: this.currentBudget.total,
      period: this.currentBudget.period
    });
    
    return this.currentBudget;
  }

  /**
   * Calculate end date based on period
   * @param {string} period - Period type
   * @returns {string} End date ISO string
   */
  calculateEndDate(period) {
    const now = new Date();
    const endDate = new Date(now);
    
    switch (period) {
      case 'daily':
        endDate.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(now.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(now.getFullYear() + 1);
        break;
      default:
        endDate.setMonth(now.getMonth() + 1);
    }
    
    return endDate.toISOString();
  }

  /**
   * Update budget tracking with new cost
   * @param {number} cost - Cost to add
   */
  updateBudgetTracking(cost) {
    if (!this.currentBudget) return;
    
    this.currentBudget.spent += cost;
    
    // Check budget thresholds
    this.checkBudgetThresholds();
  }

  /**
   * Check if budget thresholds are exceeded
   */
  checkBudgetThresholds() {
    if (!this.currentBudget || !this.currentBudget.alerts) return;
    
    const percentage = this.currentBudget.spent / this.currentBudget.total;
    
    if (percentage >= this.costThresholds.critical) {
      this.triggerAlert('critical', percentage);
    } else if (percentage >= this.costThresholds.warning) {
      this.triggerAlert('warning', percentage);
    }
  }

  /**
   * Trigger budget alert
   * @param {string} level - Alert level (warning, critical)
   * @param {number} percentage - Budget percentage used
   */
  triggerAlert(level, percentage) {
    const alertKey = `${level}:${Date.now()}`;
    
    const alert = {
      level,
      percentage: (percentage * 100).toFixed(1),
      spent: this.currentBudget.spent,
      total: this.currentBudget.total,
      remaining: this.currentBudget.total - this.currentBudget.spent,
      timestamp: new Date().toISOString()
    };
    
    this.budgetAlerts.set(alertKey, alert);
    
    logger.warn(`Cost Monitor: Budget ${level} alert`, {
      percentage: alert.percentage,
      spent: alert.spent,
      remaining: alert.remaining
    });
    
    return alert;
  }

  /**
   * Get current budget status
   * @returns {object} Budget status
   */
  getBudgetStatus() {
    if (!this.currentBudget) {
      return null;
    }
    
    const percentage = this.currentBudget.spent / this.currentBudget.total;
    const remaining = this.currentBudget.total - this.currentBudget.spent;
    
    return {
      total: this.currentBudget.total,
      spent: this.currentBudget.spent,
      remaining,
      percentage: (percentage * 100).toFixed(1),
      period: this.currentBudget.period,
      startDate: this.currentBudget.startDate,
      endDate: this.currentBudget.endDate,
      status: this.getBudgetStatusLevel(percentage)
    };
  }

  /**
   * Get budget status level
   * @param {number} percentage - Budget percentage
   * @returns {string} Status level
   */
  getBudgetStatusLevel(percentage) {
    if (percentage >= this.costThresholds.critical) return 'critical';
    if (percentage >= this.costThresholds.warning) return 'warning';
    return 'ok';
  }

  /**
   * Get cost history for a model
   * @param {string} modelId - Model identifier
   * @param {number} limit - Maximum number of entries
   * @returns {Array} Cost history entries
   */
  getModelCostHistory(modelId, limit = 100) {
    const history = [];
    
    for (const [key, entry] of this.costHistory) {
      if (entry.modelId === modelId) {
        history.push(entry);
      }
    }
    
    // Sort by timestamp descending
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return history.slice(0, limit);
  }

  /**
   * Get total cost for a time period
   * @param {string} startDate - Start date ISO string
   * @param {string} endDate - End date ISO string
   * @returns {number} Total cost
   */
  getTotalCost(startDate, endDate) {
    let total = 0;
    
    for (const entry of this.costHistory.values()) {
      const entryDate = new Date(entry.timestamp);
      if (entryDate >= new Date(startDate) && entryDate <= new Date(endDate)) {
        total += entry.cost;
      }
    }
    
    return total;
  }

  /**
   * Get cost breakdown by model
   * @returns {object} Cost breakdown
   */
  getCostBreakdown() {
    const breakdown = {};
    
    for (const entry of this.costHistory.values()) {
      if (!breakdown[entry.modelId]) {
        breakdown[entry.modelId] = {
          modelId: entry.modelId,
          totalCost: 0,
          totalTokens: 0,
          callCount: 0
        };
      }
      
      breakdown[entry.modelId].totalCost += entry.cost;
      breakdown[entry.modelId].totalTokens += entry.tokens;
      breakdown[entry.modelId].callCount++;
    }
    
    return Object.values(breakdown);
  }

  /**
   * Get cost statistics
   * @returns {object} Cost statistics
   */
  getCostStatistics() {
    const costs = Array.from(this.costHistory.values());
    
    if (costs.length === 0) {
      return {
        totalCost: 0,
        totalTokens: 0,
        totalCalls: 0,
        averageCostPerCall: 0,
        averageTokensPerCall: 0
      };
    }
    
    const totalCost = costs.reduce((sum, entry) => sum + entry.cost, 0);
    const totalTokens = costs.reduce((sum, entry) => sum + entry.tokens, 0);
    
    return {
      totalCost,
      totalTokens,
      totalCalls: costs.length,
      averageCostPerCall: totalCost / costs.length,
      averageTokensPerCall: totalTokens / costs.length
    };
  }

  /**
   * Get budget alerts
   * @param {string} level - Alert level filter (optional)
   * @returns {Array} Budget alerts
   */
  getBudgetAlerts(level = null) {
    const alerts = Array.from(this.budgetAlerts.values());
    
    if (level) {
      return alerts.filter(alert => alert.level === level);
    }
    
    return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Clear cost history
   */
  clearCostHistory() {
    this.costHistory.clear();
    logger.info(`Cost Monitor: Cost history cleared`);
  }

  /**
   * Clear budget alerts
   */
  clearBudgetAlerts() {
    this.budgetAlerts.clear();
    logger.info(`Cost Monitor: Budget alerts cleared`);
  }

  /**
   * Reset budget
   */
  resetBudget() {
    if (this.currentBudget) {
      this.currentBudget.spent = 0;
      logger.info(`Cost Monitor: Budget reset`);
    }
  }
}

export { CostMonitor };
