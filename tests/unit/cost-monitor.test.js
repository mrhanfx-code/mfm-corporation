import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CostMonitor } from '../../src/core/cost-monitor.js';

describe('CostMonitor', () => {
  let monitor;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    monitor = new CostMonitor(mockEnv);
    vi.clearAllMocks();
  });

  it('should track cost for model call', () => {
    const costEntry = monitor.trackCost('model-1', 1000, 0.0001, { task: 'test' });

    expect(costEntry).toBeDefined();
    expect(costEntry.modelId).toBe('model-1');
    expect(costEntry.tokens).toBe(1000);
    expect(costEntry.cost).toBe(0.1);
    expect(costEntry.costPerToken).toBe(0.0001);
  });

  it('should set budget', () => {
    const budget = {
      total: 1000,
      period: 'monthly',
      alerts: true
    };

    const result = monitor.setBudget(budget);

    expect(result).toBeDefined();
    expect(result.total).toBe(1000);
    expect(result.period).toBe('monthly');
    expect(result.spent).toBe(0);
  });

  it('should calculate end date for daily period', () => {
    const budget = { total: 100, period: 'daily' };
    monitor.setBudget(budget);

    expect(monitor.currentBudget.endDate).toBeDefined();
  });

  it('should calculate end date for weekly period', () => {
    const budget = { total: 100, period: 'weekly' };
    monitor.setBudget(budget);

    expect(monitor.currentBudget.endDate).toBeDefined();
  });

  it('should calculate end date for monthly period', () => {
    const budget = { total: 100, period: 'monthly' };
    monitor.setBudget(budget);

    expect(monitor.currentBudget.endDate).toBeDefined();
  });

  it('should get budget status', () => {
    monitor.setBudget({ total: 1000, period: 'monthly' });
    monitor.trackCost('model-1', 1000, 0.05);

    const status = monitor.getBudgetStatus();

    expect(status).toBeDefined();
    expect(status.total).toBe(1000);
    expect(status.spent).toBe(50);
    expect(status.remaining).toBe(950);
  });

  it('should return null when no budget set', () => {
    const status = monitor.getBudgetStatus();

    expect(status).toBeNull();
  });

  it('should trigger warning alert at 70% threshold', () => {
    monitor.setBudget({ total: 100, period: 'monthly', alerts: true });
    monitor.trackCost('model-1', 1000, 0.075); // 75% of budget

    const alerts = monitor.getBudgetAlerts('warning');

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].level).toBe('warning');
  });

  it('should trigger critical alert at 90% threshold', () => {
    monitor.setBudget({ total: 100, period: 'monthly', alerts: true });
    monitor.trackCost('model-1', 1000, 0.095); // 95% of budget

    const alerts = monitor.getBudgetAlerts('critical');

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].level).toBe('critical');
  });

  it('should get model cost history', () => {
    monitor.trackCost('model-1', 1000, 0.0001);
    // Add delay to ensure different timestamps
    const now = new Date();
    const future = new Date(now.getTime() + 1000);
    monitor.trackCost('model-1', 2000, 0.0001);
    monitor.trackCost('model-2', 1000, 0.0001);

    const history = monitor.getModelCostHistory('model-1');

    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history.every(entry => entry.modelId === 'model-1')).toBe(true);
  });

  it('should get total cost for time period', () => {
    const now = new Date();
    const startDate = new Date(now.getTime() - 86400000).toISOString(); // 1 day ago
    const endDate = new Date(now.getTime() + 86400000).toISOString(); // 1 day from now

    monitor.trackCost('model-1', 1000, 0.0001);
    monitor.trackCost('model-2', 2000, 0.0001);

    const total = monitor.getTotalCost(startDate, endDate);

    expect(total).toBeGreaterThan(0);
  });

  it('should get cost breakdown by model', () => {
    monitor.trackCost('model-1', 1000, 0.0001);
    monitor.trackCost('model-1', 2000, 0.0001);
    monitor.trackCost('model-2', 1000, 0.0001);

    const breakdown = monitor.getCostBreakdown();

    expect(breakdown.length).toBe(2);
    expect(breakdown[0].modelId).toBeDefined();
    expect(breakdown[0].totalCost).toBeGreaterThan(0);
  });

  it('should get cost statistics', () => {
    monitor.trackCost('model-1', 1000, 0.0001);
    monitor.trackCost('model-2', 2000, 0.0001);

    const stats = monitor.getCostStatistics();

    expect(stats).toBeDefined();
    expect(stats.totalCost).toBeCloseTo(0.3, 2);
    expect(stats.totalTokens).toBe(3000);
    expect(stats.totalCalls).toBe(2);
  });

  it('should return zero statistics when no costs tracked', () => {
    const stats = monitor.getCostStatistics();

    expect(stats.totalCost).toBe(0);
    expect(stats.totalTokens).toBe(0);
    expect(stats.totalCalls).toBe(0);
  });

  it('should get all budget alerts', () => {
    monitor.setBudget({ total: 100, period: 'monthly', alerts: true });
    monitor.trackCost('model-1', 1000, 0.075);
    monitor.trackCost('model-1', 1000, 0.02);

    const alerts = monitor.getBudgetAlerts();

    expect(alerts.length).toBeGreaterThan(0);
  });

  it('should clear cost history', () => {
    monitor.trackCost('model-1', 1000, 0.0001);
    expect(monitor.costHistory.size).toBe(1);

    monitor.clearCostHistory();

    expect(monitor.costHistory.size).toBe(0);
  });

  it('should clear budget alerts', () => {
    monitor.setBudget({ total: 100, period: 'monthly', alerts: true });
    monitor.trackCost('model-1', 1000, 0.075);
    expect(monitor.budgetAlerts.size).toBeGreaterThan(0);

    monitor.clearBudgetAlerts();

    expect(monitor.budgetAlerts.size).toBe(0);
  });

  it('should reset budget', () => {
    monitor.setBudget({ total: 100, period: 'monthly' });
    monitor.trackCost('model-1', 1000, 0.05);
    expect(monitor.currentBudget.spent).toBe(50);

    monitor.resetBudget();

    expect(monitor.currentBudget.spent).toBe(0);
  });
});
