// Parallel Tool Executor
// Executes independent tools in parallel to reduce execution overhead

import { logger } from './logger.js';

/**
 * Tool dependency graph
 * Maps tools to their dependencies
 */
const TOOL_DEPENDENCIES = {
  // Write operations depend on read operations
  'drive-write': ['drive-read'],
  'github-push': ['github-list-repos'],
  'memory-remember': ['memory-search'],
  
  // No dependencies for read-only tools
  'web-fetch': [],
  'exa-search': [],
  'perplexity-search': [],
  'brave-search': [],
  'github-issues': [],
  'notion-search': [],
  'drive-list': [],
  'drive-read': [],
  'drive-search': [],
  'calendar-list': [],
  'calendar-create': [],
  'calendar-free-slot': [],
  'pdf-generate': [],
  'slack-notify': [],
  'sms-alert': [],
  'stripe-balance': [],
  'stripe-charges': [],
  'github-create-repo': [],
  'github-list-repos': [],
  'video-prompt': [],
  'codegraph-query': [],
  'codegraph-context': [],
  'd1-query': [],
  'memory-search': [],
  'memory-context': [],
  'memory-enrich': [],
  'social-post': []
};

/**
 * Read-only tools (safe to parallelize)
 */
const READ_ONLY_TOOLS = new Set([
  'web-fetch',
  'exa-search',
  'perplexity-search',
  'brave-search',
  'github-issues',
  'notion-search',
  'drive-list',
  'drive-read',
  'drive-search',
  'calendar-list',
  'calendar-free-slot',
  'pdf-generate',
  'slack-notify',
  'sms-alert',
  'stripe-balance',
  'stripe-charges',
  'github-list-repos',
  'video-prompt',
  'codegraph-query',
  'codegraph-context',
  'd1-query',
  'memory-search',
  'memory-context',
  'memory-enrich'
]);

/**
 * Parallel Tool Executor
 * Executes independent tools in parallel using Promise.all()
 */
export class ParallelToolExecutor {
  constructor(env) {
    this.env = env;
    this.maxParallel = 5; // Max parallel tool executions
  }

  /**
   * Check if a tool is read-only
   */
  isReadOnly(toolName) {
    return READ_ONLY_TOOLS.has(toolName);
  }

  /**
   * Get dependencies for a tool
   */
  getDependencies(toolName) {
    return TOOL_DEPENDENCIES[toolName] || [];
  }

  /**
   * Check if two tool calls can execute in parallel
   */
  canParallelize(call1, call2) {
    // Different tools that are both read-only can parallelize
    if (call1.tool !== call2.tool && this.isReadOnly(call1.tool) && this.isReadOnly(call2.tool)) {
      return true;
    }

    // Same tool with different args can parallelize if read-only
    if (call1.tool === call2.tool && this.isReadOnly(call1.tool)) {
      // Check if args are different (avoid duplicate work)
      return JSON.stringify(call1.args) !== JSON.stringify(call2.args);
    }

    // Check dependencies
    const deps1 = this.getDependencies(call1.tool);
    const deps2 = this.getDependencies(call2.tool);

    // If call2 depends on call1's tool, cannot parallelize
    if (deps1.includes(call2.tool)) return false;
    if (deps2.includes(call1.tool)) return false;

    // Otherwise, can parallelize
    return true;
  }

  /**
   * Build dependency graph for tool calls
   * Only adds real dependencies (write depends on read), not "can't parallelize" edges
   */
  buildDependencyGraph(toolCalls) {
    const graph = new Map();
    
    for (const call of toolCalls) {
      graph.set(call, {
        dependencies: [],
        dependents: []
      });
    }

    // Only add real dependencies based on TOOL_DEPENDENCIES
    for (const call1 of toolCalls) {
      const deps1 = this.getDependencies(call1.tool);
      
      for (const call2 of toolCalls) {
        if (call1 === call2) continue;
        
        // If call1 depends on call2's tool type, add dependency
        if (deps1.includes(call2.tool)) {
          graph.get(call1).dependencies.push(call2);
          graph.get(call2).dependents.push(call1);
        }
      }
    }

    return graph;
  }

  /**
   * Topological sort to determine execution order
   */
  topologicalSort(graph) {
    const sorted = [];
    const visited = new Set();
    const temp = new Set();

    const visit = (node) => {
      if (temp.has(node)) {
        throw new Error('Circular dependency detected');
      }
      if (visited.has(node)) return;

      temp.add(node);
      const nodeData = graph.get(node);
      
      for (const dep of nodeData.dependencies) {
        visit(dep);
      }

      temp.delete(node);
      visited.add(node);
      sorted.push(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        visit(node);
      }
    }

    return sorted;
  }

  /**
   * Group tool calls into parallel execution batches
   */
  groupIntoBatches(sortedCalls) {
    const batches = [];
    const executed = new Set();

    for (const call of sortedCalls) {
      if (executed.has(call)) continue;

      // Start a new batch
      const batch = [call];
      executed.add(call);

      // Try to add more calls to this batch
      for (const otherCall of sortedCalls) {
        if (executed.has(otherCall)) continue;
        if (otherCall === call) continue;

        // Check if can parallelize with all calls in batch
        let canAdd = true;
        for (const batchCall of batch) {
          if (!this.canParallelize(batchCall, otherCall)) {
            canAdd = false;
            break;
          }
        }

        if (canAdd && batch.length < this.maxParallel) {
          batch.push(otherCall);
          executed.add(otherCall);
        }
      }

      batches.push(batch);
    }

    return batches;
  }

  /**
   * Execute a batch of tool calls in parallel
   */
  async executeBatch(batch, useToolFn) {
    const startTime = Date.now();
    
    try {
      const results = await Promise.all(
        batch.map(async ({ tool, args }) => {
          try {
            const result = await useToolFn(tool, args);
            return { tool, args, result, success: true };
          } catch (error) {
            logger.error('parallel_executor', 'tool_failed', { tool, error: error.message });
            return { tool, args, result: error.message, success: false };
          }
        })
      );

      const duration = Date.now() - startTime;
      logger.info('parallel_executor', 'batch_complete', { 
        batchSize: batch.length, 
        duration,
        tools: batch.map(c => c.tool)
      });

      return results;
    } catch (error) {
      logger.error('parallel_executor', 'batch_failed', { 
        batchSize: batch.length, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Execute tool calls with parallel optimization
   */
  async execute(toolCalls, useToolFn) {
    if (toolCalls.length <= 1) {
      // Single tool, execute directly
      const { tool, args } = toolCalls[0];
      return await useToolFn(tool, args);
    }

    const startTime = Date.now();
    logger.info('parallel_executor', 'start', { toolCount: toolCalls.length });

    try {
      // Build dependency graph
      const graph = this.buildDependencyGraph(toolCalls);
      
      // Topological sort
      const sorted = this.topologicalSort(graph);
      
      // Group into parallel batches
      const batches = this.groupIntoBatches(sorted);
      
      logger.info('parallel_executor', 'batches_created', { 
        totalCalls: toolCalls.length,
        batchCount: batches.length,
        batchSizes: batches.map(b => b.length)
      });

      // Execute batches sequentially (tools within batch execute in parallel)
      const allResults = [];
      for (const batch of batches) {
        const batchResults = await this.executeBatch(batch, useToolFn);
        allResults.push(...batchResults);
      }

      const duration = Date.now() - startTime;
      logger.info('parallel_executor', 'complete', { 
        totalCalls: toolCalls.length,
        batchCount: batches.length,
        duration,
        avgPerTool: duration / toolCalls.length
      });

      // Format results for compatibility with existing code
      return allResults.map(r => 
        r.success 
          ? `[Result: ${r.tool}]\n${String(r.result).slice(0, 2000)}`
          : `[Error: ${r.tool}] ${r.result}`
      ).join('\n\n');
    } catch (error) {
      logger.error('parallel_executor', 'failed', { 
        toolCount: toolCalls.length,
        error: error.message 
      });
      
      // Fallback to sequential execution
      logger.warn('parallel_executor', 'fallback_sequential');
      return await this.executeSequential(toolCalls, useToolFn);
    }
  }

  /**
   * Fallback to sequential execution
   */
  async executeSequential(toolCalls, useToolFn) {
    const results = [];
    
    for (const { tool, args } of toolCalls) {
      try {
        const result = await useToolFn(tool, args);
        results.push(`[Result: ${tool}]\n${String(result).slice(0, 2000)}`);
      } catch (error) {
        results.push(`[Error: ${tool}] ${error.message}`);
      }
    }

    return results.join('\n\n');
  }
}
