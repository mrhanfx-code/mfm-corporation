// Model Router — intelligent model selection based on task complexity
// Routes to cheaper models for simple tasks, expensive models for complex tasks

import { logger } from './logger.js';
import { MODELS } from './llm-client.js';

// Model cost per 1M tokens (approximate)
const MODEL_COSTS = {
  'llama-3.3-70b': 0.10,          // Cerebras fast
  'llama-4-scout-17b-16e-instruct': 0.05,  // Cerebras small
  'openai/gpt-oss-120b:free': 0.00,        // Free
  'openai/gpt-oss-20b:free': 0.00,         // Free
  'nvidia/nemotron-3-super-120b-a12b:free': 0.00  // Free
};

// Task complexity classification
const COMPLEXITY_KEYWORDS = {
  high: [
    'analyze', 'evaluate', 'assess', 'compare', 'synthesize',
    'strategy', 'architecture', 'design', 'implement', 'optimize',
    'debug', 'troubleshoot', 'integrate', 'security', 'compliance',
    'audit', 'review', 'report', 'forecast', 'predict'
  ],
  low: [
    'list', 'show', 'get', 'fetch', 'retrieve', 'find',
    'search', 'count', 'summarize', 'format', 'convert',
    'extract', 'parse', 'validate', 'check', 'verify'
  ]
};

/**
 * Classify task complexity based on message content.
 * Returns: 'high' (complex) or 'low' (simple)
 */
export function classifyComplexity(message) {
  const lower = message.toLowerCase();
  
  // Check for high complexity keywords
  for (const keyword of COMPLEXITY_KEYWORDS.high) {
    if (lower.includes(keyword)) return 'high';
  }
  
  // Check for low complexity keywords
  for (const keyword of COMPLEXITY_KEYWORDS.low) {
    if (lower.includes(keyword)) return 'low';
  }
  
  // Default to medium complexity
  return 'medium';
}

/**
 * Select optimal model based on task complexity.
 * Returns: model name from MODELS
 */
export function selectModel(complexity, preferredModel = null) {
  // If a specific model is requested, use it
  if (preferredModel) return preferredModel;
  
  // Route based on complexity
  switch (complexity) {
    case 'low':
      // Use cheapest/fastest model for simple tasks
      return MODELS.OR_FAST;
    case 'medium':
      // Use balanced model
      return MODELS.CEREBRAS_FAST;
    case 'high':
      // Use best model for complex tasks
      return MODELS.CEREBRAS_LARGE;
    default:
      return MODELS.CEREBRAS_FAST;
  }
}

/**
 * Calculate cost based on model and token usage.
 * Returns: cost in USD
 */
export function calculateCost(model, usage) {
  const costPerM = MODEL_COSTS[model] || 0.10;
  const tokens = (usage?.prompt_tokens || 0) + (usage?.completion_tokens || 0);
  return (tokens / 1_000_000) * costPerM;
}

/**
 * Record model usage to D1 for cost tracking.
 */
export async function recordModelUsage(env, model, taskType, usage, cost) {
  if (!env.D1) return;
  
  try {
    await env.D1.prepare(`
      INSERT INTO model_usage (model, task_type, prompt_tokens, completion_tokens, total_tokens, cost, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      model,
      taskType,
      usage?.prompt_tokens || 0,
      usage?.completion_tokens || 0,
      (usage?.prompt_tokens || 0) + (usage?.completion_tokens || 0),
      cost,
      Date.now()
    ).run();
    
    logger.info('model-router', 'usage_recorded', { model, taskType, cost });
  } catch (err) {
    logger.error('model-router', 'usage_record_failed', { error: err.message });
  }
}

/**
 * Get cost summary for a time period.
 */
export async function getCostSummary(env, days = 7) {
  if (!env.D1) return { totalCost: 0, byModel: {}, byTask: {} };
  
  try {
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);
    const result = await env.D1.prepare(`
      SELECT model, task_type, SUM(cost) as total_cost, SUM(total_tokens) as total_tokens
      FROM model_usage
      WHERE timestamp > ?
      GROUP BY model, task_type
    `).bind(since).all();
    
    const summary = {
      totalCost: 0,
      byModel: {},
      byTask: {}
    };
    
    for (const row of result.results) {
      summary.totalCost += row.total_cost;
      
      if (!summary.byModel[row.model]) {
        summary.byModel[row.model] = { cost: 0, tokens: 0 };
      }
      summary.byModel[row.model].cost += row.total_cost;
      summary.byModel[row.model].tokens += row.total_tokens;
      
      if (!summary.byTask[row.task_type]) {
        summary.byTask[row.task_type] = { cost: 0, tokens: 0 };
      }
      summary.byTask[row.task_type].cost += row.total_cost;
      summary.byTask[row.task_type].tokens += row.total_tokens;
    }
    
    return summary;
  } catch (err) {
    logger.error('model-router', 'cost_summary_failed', { error: err.message });
    return { totalCost: 0, byModel: {}, byTask: {} };
  }
}

/**
 * Check if budget exceeded for the period.
 */
export async function checkBudget(env, budget, days = 7) {
  const summary = await getCostSummary(env, days);
  return {
    exceeded: summary.totalCost > budget,
    current: summary.totalCost,
    remaining: Math.max(0, budget - summary.totalCost),
    percentage: (summary.totalCost / budget) * 100
  };
}
